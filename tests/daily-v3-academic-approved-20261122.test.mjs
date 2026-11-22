import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {V3_ACADEMIC_WHITELIST} from '../assets/daily-v3-approved-content-20261122.js';
import {buildDailyV3,languageEvidence,V3_APPROVED} from '../assets/daily-tasks-v3-20261122.js';

const entries=[...V3_ACADEMIC_WHITELIST.latin,...V3_ACADEMIC_WHITELIST.french,...V3_ACADEMIC_WHITELIST.y9];
const load=t=>fs.readFileSync('content/topics/'+t.topicId+'.json','utf8');
const sourceSha=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const day='2026-11-23';
const state=(extra={})=>({today:day,daily:[],dailyLog:{},seenCorrect:{},formalAttemptLog:[],...extra});
const syntheticLegacy=()=>[
 ['french-vocab',30,8],['latin-vocab',30,8],['latin-standard',10,8],
 ['y8-standard-a',10,8],['y8-standard-b',10,8],['y8-mastery-a',20,8],
 ['y8-mastery-b',20,8],['weakness-review',10,8],['due-review',10,8],['year9-light',15,9]
].map(([id,target,assignedYear])=>({id,target,assignedYear,progress:0,planDate:day}));
test('Academic whitelist has exactly 40 independently named approved concepts over six selected topics',()=>{
 assert.equal(entries.length,6);
 assert.equal(entries.filter(t=>t.year===8&&t.subject==='latin').length,2);
 assert.equal(entries.filter(t=>t.year===8&&t.subject==='french').length,2);
 assert.equal(entries.filter(t=>t.year===9&&t.subject==='french').length,2);
 const concepts=entries.flatMap(t=>t.concepts.map(g=>g.conceptId));
 const ids=entries.flatMap(t=>t.concepts.flatMap(g=>g.ids));
 assert.equal(ids.length,40);
 assert.equal(new Set(ids).size,40);
 assert.equal(new Set(concepts).size,40);
 assert.ok(entries.every(t=>t.academicQA==='approved'&&t.taughtVerified===true&&t.teacherSource));
 assert.ok(entries.every(t=>t.concepts.every(q=>q.sourceRef&&q.label&&q.expectedAnswer)));
});
test('Every one of 40 approved IDs resolves to the SAME unchanged source bank, correct key, and active unscaffolded formal status',()=>{
 for(const t of entries){
   const src=load(t);
   assert.equal(sourceSha(src),t.bankSourceSha,'Source changed: repeat independent academic QA before import: '+t.topicId);
   const d=JSON.parse(src);
   assert.equal(d.topicId,t.topicId);
   assert.equal(Number(d.year),t.year);
   assert.equal(d.subject,t.subject);
   assert.equal(d.status,'enabled');
   for(const group of t.concepts){
     assert.equal(group.ids.length,1,'Only one independent approved attempt per concept in initial whitelist');
     const q=d.questions.filter(r=>r.id===group.ids[0]);
     assert.equal(q.length,1,group.ids[0]);
     const item=q[0];
     assert.equal(item.conceptId,group.conceptId,group.ids[0]);
     assert.equal(item.status,'enabled',group.ids[0]);
     assert.notEqual(item.preview,true,group.ids[0]);
     assert.notEqual(item.formal,false,group.ids[0]);
     assert.notEqual(item._repair,true,group.ids[0]);
     assert.equal(item.format,group.format,group.ids[0]);
     assert.ok(item.answer?.accepted?.includes(group.expectedAnswer),group.ids[0]);
     assert.ok(item.feedback?.short?.length>10,group.ids[0]);
     if(item.format==='mc_single'){
       assert.equal(item.answer.accepted.length,1,group.ids[0]);
       assert.equal(item.options.filter(x=>x===group.expectedAnswer).length,1,group.ids[0]);
       assert.equal(new Set(item.options).size,item.options.length,group.ids[0]);
     }else{
       assert.ok(['typed_equivalent','typed_exact','controlled_translation'].includes(item.format),group.ids[0]);
       assert.equal(item.answer.mode,'exact_or_equivalent',group.ids[0]);
       if(t.subject==='french')assert.equal(item.answer.normalization?.ignoreFrenchDiacriticsForScore,true,group.ids[0]);
     }
   }
 }
});
test('Every approved Year 9 topic genuinely has ten independently keyed, pre-existing question IDs',()=>{
 for(const t of V3_APPROVED.year9Standard){
  assert.equal(t.year,9);
  assert.equal(t.concepts.length,10);
  assert.equal(new Set(t.concepts.map(g=>g.label)).size,10);
  assert.equal(new Set(t.concepts.map(g=>g.expectedAnswer.toLocaleLowerCase())).size,10);
 }
});
test('Real Language 5+5 per-subject completed receipt is isolated from old Latin Standard credit',()=>{
 const plan=buildDailyV3(state(),syntheticLegacy());
 const split=plan.find(t=>t.id==='languages-standard').languageSplit;
 const oldHistory=Array.from({length:10},(_,i)=>({day,dailyTaskId:'latin-standard',subject:'latin',questionId:'prior-'+i,correct:true,formal:true}));
 const latin=split.latin.approvedQuestionIds.map(id=>({day,dailyTaskId:'languages-standard',subject:'latin',year:8,topicId:split.latin.topicId,questionId:id,correct:true,formal:true}));
 let s=state({daily:plan,formalAttemptLog:[...oldHistory,...latin]});
 let result=languageEvidence(s,day);
 assert.equal(result.progress,5);
 assert.equal(result.completed,false);
 assert.equal(result.french.correct,0);
 const french=split.french.approvedQuestionIds.map(id=>({day,dailyTaskId:'languages-standard',subject:'french',year:8,topicId:split.french.topicId,questionId:id,correct:true,formal:true}));
 s.formalAttemptLog.push(...french);
 result=languageEvidence(s,day);
 assert.equal(result.completed,true);
 assert.equal(result.progress,10);
 assert.equal(result.latin.correct,5);
 assert.equal(result.french.correct,5);
});
test('One subject cannot take the other subject’s marked ID, nor extra out-of-pool answers',()=>{
 const plan=buildDailyV3(state(),syntheticLegacy());
 const split=plan.find(t=>t.id==='languages-standard').languageSplit;
 const extra=[
   ...split.latin.approvedQuestionIds.map(id=>({day,dailyTaskId:'languages-standard',subject:'french',year:8,topicId:split.french.topicId,questionId:id,correct:true,formal:true})),
   ...Array.from({length:8},(_,i)=>({day,dailyTaskId:'languages-standard',subject:'latin',year:8,topicId:split.latin.topicId,questionId:'unapproved-'+i,correct:true,formal:true}))
 ];
 const result=languageEvidence(state({daily:plan,formalAttemptLog:extra}),day);
 assert.equal(result.progress,0);
 assert.equal(result.completed,false);
});
