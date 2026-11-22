import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V3_TASK_SPEC,V3_TARGET,V3_APPROVED,buildDailyV3,languageEvidence,
  chooseApprovedTopic,distinctApprovedConcepts,validateMathQuestion,mathsEvidence
} from '../assets/daily-tasks-v3-20261122.js';

const day='2026-11-23';
const prior=(id,target,extra={})=>({id,target,progress:0,planDate:day,assignedYear:8,...extra});
const old=()=>[
  prior('french-vocab',30),prior('latin-vocab',30),prior('latin-standard',10),
  prior('y8-standard-a',10,{assignedTopic:'chem-y8-example',assignedSubject:'chemistry'}),
  prior('y8-standard-b',10,{assignedTopic:'phys-y8-example'}),
  prior('y8-mastery-a',20),prior('y8-mastery-b',20),
  prior('weakness-review',10),prior('due-review',10),
  prior('year9-light',15,{assignedTopic:'fr-y9-example'})
];
const state=(extras={})=>({today:day,daily:[],dailyLog:{},formalAttemptLog:[],seenCorrect:{},...extras});
const topic=(subject,year,topicId,concepts)=>({
  subject,year,topicId,title:topicId,academicQA:'approved',taughtVerified:true,
  concepts:Array.from({length:concepts},(_,i)=>({conceptId:topicId+'-'+i,ids:[topicId+'-q'+i]}))
});
const makeMath=(id,grade='7')=>({
  id,subject:'maths',year:9,topicId:'math-y9-indices',topic:'indices',grade,difficultyTarget:grade==='8-9'?'G8-9':'G'+grade,
  templateId:'unique-template-'+id,academicQA:'approved',taughtVerified:true,
  mathDailyEnabled:true,renderRequired:true,
  sourceRef:'teacher-confirmed-index-law-source',qaReviewer:'independent-reviewer',
  options:Array.from({length:6},(_,i)=>({id:'abcdef'[i],text:String(i+1),
    ...(i?{misconception:'confuses law '+i}:{})})),
  correctOptionId:'a',workedSolution:['Apply the law of indices.','Simplify the powers.']
});
test('fixed V3 contract: ten tasks and 165 questions',()=>{
  assert.equal(V3_TASK_SPEC.length,10);
  assert.equal(new Set(V3_TASK_SPEC.map(x=>x[0])).size,10);
  assert.equal(V3_TARGET,165);
  assert.deepEqual(V3_TASK_SPEC.map(x=>x[1]),[30,30,10,10,10,20,20,10,10,15]);
});
test('unapproved supply cannot be invented and weak review is no longer compulsory',()=>{
  const snapshot=JSON.stringify(state());
  const empty={...V3_APPROVED,languageGrammar:{latin:[],french:[]},year9Standard:[]};
  const result=buildDailyV3(state(),old(),empty);
  assert.deepEqual(result.map(x=>x.id),V3_TASK_SPEC.map(x=>x[0]));
  assert.ok(!result.some(x=>x.id==='weakness-review'));
  for(const id of ['languages-standard','y8-standard-b','maths-daily']){
    const card=result.find(x=>x.id===id);
    assert.equal(card.supplyBlocked,true,id);
    assert.equal(card.progress,0,id);
    assert.equal(card.done,false,id);
  }
  assert.equal(JSON.stringify(state()),snapshot);
});
test('in-progress legacy tasks remain original until next day; no receipt migration',()=>{
  const priorDaily=old().map(x=>({...x}));priorDaily[3].progress=7;
  const s=state({daily:priorDaily,dailyLog:{'2026-11-23':{tasks:priorDaily}}});
  const r=buildDailyV3(s,old());
  assert.deepEqual(r,old());
  assert.equal(s.daily[3].progress,7);
  assert.equal(s.dailyLog[day].tasks[3].progress,7);
});
test('historical dates retain V2 plan, including original credit',()=>{
  const legacy=old();legacy[3].progress=10;
  assert.equal(buildDailyV3({...state(),today:'2026-11-22'},legacy),legacy);
});
test('source QA check uses distinct eligible concepts rather than question ID variants',()=>{
  const t=topic('chemistry',9,'chem-y9-tested',10);
  t.concepts[0].ids.push('chem-y9-tested-reversed');
  const s=state({seenCorrect:{'chem-y9-tested-reversed':1}});
  assert.equal(distinctApprovedConcepts(t,s).length,9);
  assert.equal(chooseApprovedTopic([t],s,9,'chemistry',10),null);
  assert.ok(chooseApprovedTopic([t],s,9,'chemistry',9));
  t.taughtVerified=false;
  assert.equal(chooseApprovedTopic([t],state(),9,'chemistry',5),null);
});
test('eligible topics at 0, 5, 9, 10, 15, 20 concept levels',()=>{
  for(const n of [0,5,9,10,15,20]){
    const entry=topic('biology',9,'bio-y9-'+n,n);
    const chosen=chooseApprovedTopic([entry],state(),9,'biology',10);
    assert.equal(Boolean(chosen),n>=10,'available='+n);
  }
});
test('Standard B Year 9 is assigned only with ten certified Year 9 concepts',()=>{
  const approved={...V3_APPROVED,year9Standard:[topic('biology',9,'bio-y9-certified',10)]};
  const plan=buildDailyV3(state(),old(),approved);
  const b=plan.find(t=>t.id==='y8-standard-b');
  assert.equal(b.assignedYear,9);assert.equal(b.supplyBlocked,undefined);
  assert.match(b.href,/year=9/);assert.ok(!b.href.includes('year=8'));
  assert.equal(plan.find(t=>t.id==='y8-standard-a').assignedYear,8);
});
test('Languages Standard never completes with Latin alone',()=>{
  const rows=Array.from({length:10},(_,i)=>({
    day,year:8,dailyTaskId:'languages-standard',subject:'latin',questionId:'latin'+i,
    correct:true,formal:true
  }));
  let s=state({formalAttemptLog:rows});
  assert.deepEqual(languageEvidence(s,day).latin,{attempts:10,correct:5});
  assert.equal(languageEvidence(s,day).progress,5);
  assert.equal(languageEvidence(s,day).completed,false);
  s.formalAttemptLog.push(...Array.from({length:5},(_,i)=>({
    day,year:8,dailyTaskId:'languages-standard',subject:'french',questionId:'fr'+i,correct:true,formal:true
  })));
  assert.equal(languageEvidence(s,day).completed,true);
  assert.equal(languageEvidence(s,day).progress,10);
});
test('Language card preserves independently assigned approved Latin and French sources',()=>{
  const approved={...V3_APPROVED,languageGrammar:{
    latin:[topic('latin',8,'la-y8-case-functions',5)],
    french:[topic('french',8,'fr-y8-verb-agreement',5)]
  }};
  const plan=buildDailyV3(state(),old(),approved);
  const task=plan.find(t=>t.id==='languages-standard');
  assert.equal(task.languageSplit.latin.target,5);
  assert.equal(task.languageSplit.french.target,5);
  assert.equal(task.languageSplit.latin.approvedQuestionIds.length,5);
  assert.equal(task.languageSplit.french.approvedQuestionIds.length,5);
});
test('six-option Maths answer validator rejects filler, repeated answers and missing marking',()=>{
  const accepted=makeMath('math-001');
  assert.equal(validateMathQuestion(accepted).valid,true);
  assert.ok(validateMathQuestion({...accepted,academicQA:'pending'}).issues.includes('not-academic-qa-approved'));
  assert.ok(validateMathQuestion({...accepted,options:accepted.options.slice(0,5)}).issues.includes('six-options-required'));
  assert.ok(validateMathQuestion({...accepted,correctOptionId:'z'}).issues.includes('unique-correct-id-required'));
  const duplicated={...accepted,options:[...accepted.options.slice(0,5),{id:'f',text:'1',misconception:'same'}]};
  assert.ok(validateMathQuestion(duplicated).issues.includes('duplicate-or-empty-options'));
});
test('Maths plan requires genuine 4/4/2 band supply, never lower-level filler',()=>{
  const few=Array.from({length:4},(_,i)=>makeMath('g7-'+i,'7'));
  const topics=['math-y9-indices','math-y9-standard-form','math-y9-changing-subject',
    'math-y9-straight-line-graphs','math-y9-simultaneous-equations'];
  const enough=[...few,...Array.from({length:4},(_,i)=>makeMath('g8-'+i,'8')),
    ...Array.from({length:2},(_,i)=>makeMath('g89-'+i,'8-9'))]
    .map((q,i)=>({...q,topicId:topics[Math.floor(i/2)]}));
  assert.equal(buildDailyV3(state(),old(),{...V3_APPROVED,maths:few})
    .find(t=>t.id==='maths-daily').supplyBlocked,true);
  assert.equal(buildDailyV3(state(),old(),{...V3_APPROVED,maths:enough})
    .find(t=>t.id==='maths-daily').supplyBlocked,true,
    'Passing metadata alone cannot launch a non-existent iPad Maths player');
  const routed=buildDailyV3(state(),old(),{...V3_APPROVED,maths:enough,mathsRuntimeReady:true})
    .find(t=>t.id==='maths-daily');
  assert.equal(routed.supplyBlocked,undefined);
  assert.equal(routed.approvedQuestionIds.length,10);
  assert.equal(new Set(Object.values(routed.approvedConceptByQuestion)).size,10);
});
test('Maths only counts unique submitted question IDs and distinguishes 9/10 target',()=>{
  const attempts=Array.from({length:10},(_,i)=>({
    questionId:'m'+i,day,correct:i!==0,submittedAt:day+'T10:00:00Z'
  }));
  attempts.push({...attempts[1],correct:true});
  const e=mathsEvidence(attempts,day);
  assert.equal(e.submitted,10);assert.equal(e.correct,9);
  assert.equal(e.completed,true);assert.equal(e.targetMet,true);
  assert.equal(mathsEvidence(attempts.slice(0,9),day).completed,false);
});
test('existing V3 plan keeps assignments across planner rebuild',()=>{
  const approved={...V3_APPROVED,year9Standard:[topic('chemistry',9,'chem-y9-certified',10)]};
  const initial=buildDailyV3(state(),old(),approved);
  const saved=initial.map(t=>({...t}));
  saved[3].progress=7;
  const changed=buildDailyV3(state({daily:saved}),old(),V3_APPROVED);
  assert.equal(changed.find(t=>t.id==='y8-standard-a').progress,7);
  assert.equal(changed.find(t=>t.id==='y8-standard-b').assignedTopic,'chem-y9-certified');
});

test('unopened Day 2/7 recall does not shrink ten-card V3 daily quota',()=>{
  const legacy=old();
  const due=legacy.find(t=>t.id==='due-review');
  due.target=5;due.masteryCheck=true;due.href='/study/latin/practise?daily=1&locked=1&mode=due&task=due-review';
  const plan=buildDailyV3(state(),legacy);
  assert.equal(plan.length,10);
  assert.equal(plan.find(t=>t.id==='due-review').target,10);
  assert.equal(plan.reduce((n,t)=>n+t.target,0),165);
  assert.equal(plan.find(t=>t.id==='due-review').progress,0);
});

test('actual reviewed whitelists activate both Language parts and an exclusively Year 9 Standard B',()=>{
  const plan=buildDailyV3(state(),old());
  const lang=plan.find(t=>t.id==='languages-standard');
  const b=plan.find(t=>t.id==='y8-standard-b');
  assert.equal(lang.supplyBlocked,undefined);
  assert.equal(lang.languageSplit.latin.approvedQuestionIds.length,5);
  assert.equal(lang.languageSplit.french.approvedQuestionIds.length,5);
  assert.equal(b.supplyBlocked,undefined);
  assert.equal(b.assignedYear,9);
  assert.equal(b.approvedQuestionIds.length,10);
  assert.equal(plan.reduce((sum,t)=>sum+t.target,0),165);
});
test('when future tense question supply is depleted, Standard B falls back to independently reviewed Year 9 perfect tense',()=>{
  const future=V3_APPROVED.year9Standard.find(t=>t.topicId.includes('future-tense'));
  const perfect=V3_APPROVED.year9Standard.find(t=>t.topicId.includes('perfect-tense'));
  assert.ok(future&&perfect);
  const seen=Object.fromEntries(future.concepts.map(c=>[c.ids[0],1]));
  const plan=buildDailyV3(state({seenCorrect:seen}),old());
  const b=plan.find(t=>t.id==='y8-standard-b');
  assert.equal(b.assignedTopic,perfect.topicId);
  assert.equal(b.approvedQuestionIds.length,10);
});
test('when all separately reviewed Year 9 topics are depleted, Standard B flags shortage without Year 8 substitution',()=>{
  const seen=Object.fromEntries(V3_APPROVED.year9Standard.flatMap(t=>t.concepts).map(c=>[c.ids[0],1]));
  const plan=buildDailyV3(state({seenCorrect:seen}),old());
  const b=plan.find(t=>t.id==='y8-standard-b');
  assert.equal(b.assignedYear,9);
  assert.equal(b.progress,0);
  assert.equal(b.supplyBlocked,true);
});

test('unapproved Maths card is never completed by arbitrary ten marked submissions',()=>{
 const initial=buildDailyV3(state(),old());
 const fake=Array.from({length:10},(_,i)=>({
   questionId:'fabricated-'+i,day,subject:'maths',year:9,
   dailyTaskId:'maths-daily',correct:true,formal:true,submittedAt:day+'T12:00:00Z'
 }));
 const reb=buildDailyV3(state({daily:initial}),old(),V3_APPROVED,{mathAttempts:fake});
 const card=reb.find(x=>x.id==='maths-daily');
 assert.equal(card.supplyBlocked,true);
 assert.equal(card.progress,0);
 assert.equal(card.done,false);
});
test('Maths task credit is scoped to ten pinned, unassisted, first submitted formal answers',()=>{
 const topics=['math-y9-indices','math-y9-standard-form','math-y9-changing-subject',
   'math-y9-straight-line-graphs','math-y9-simultaneous-equations'];
 const questions=[
   ...Array.from({length:4},(_,i)=>makeMath('v7-'+i,'7')),
   ...Array.from({length:4},(_,i)=>makeMath('v8-'+i,'8')),
   ...Array.from({length:2},(_,i)=>makeMath('v89-'+i,'8-9'))
 ].map((q,i)=>({...q,topicId:topics[Math.floor(i/2)]}));
 const original=buildDailyV3(state(),old(),{...V3_APPROVED,maths:questions,mathsRuntimeReady:true});
 const task=original.find(x=>x.id==='maths-daily');
 const attempts=task.approvedQuestionIds.map((questionId,i)=>({
   questionId,day,subject:'maths',year:9,dailyTaskId:'maths-daily',
   correct:i!==0,formal:true,submittedAt:day+'T12:00:00Z'
 }));
 const scoped=mathsEvidence([...attempts,
    {...attempts[0],correct:true},{...attempts[1],questionId:'not-assigned',correct:true},
    {...attempts[2],repair:true,questionId:attempts[2].questionId},
    {...attempts[3],hintUsed:true,questionId:attempts[3].questionId}],day,task);
 assert.equal(scoped.submitted,10);
 assert.equal(scoped.correct,9);
 assert.equal(scoped.completed,true);
 assert.equal(scoped.targetMet,true);
 assert.equal(mathsEvidence(attempts.slice(0,9),day,task).completed,false);
});
