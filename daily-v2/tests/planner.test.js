import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DAILY_V2_TASKS,planDailyV2} from '../src/planner.js';
const day='2026-10-26';
const marks=[1,2,3];
function fixture(){
 const bank=[],prior=[],taught=['la-y9-vocab','fr-y9-vocab','y9-cell-topic'];
 const add=(id,subject,year,topicId,role,opts={})=>{
  const q={id,subject,year,topicId,status:'enabled',formal:true,prompt:'PROMPT '+id,
   roles:[role],...opts};bank.push(q);return q;
 };
 for(let n=0;n<2;n++){
  const subject=n===0?'physics':'chemistry',topicId=n===0?'phys-mastery':'chem-mastery';
  for(const [band,total] of [['foundation',4],['application',10],['challenge',6]]){
   for(let i=0;i<total;i++)add('m-'+n+'-'+band+'-'+i,subject,8,topicId,'mastery',{depthBand:band});
  }
 }
 for(const [lang,role,topic,parts] of [
  ['latin','latin-standard','la-std',{grammar:4,translation:3,passage:3}],
  ['french','french-standard','fr-std',{grammar:4,translation:3,writing:3}]]){
  for(const [skill,total] of Object.entries(parts))
   for(let i=0;i<total;i++)add(lang+'-'+skill+'-'+i,lang,8,topic,role,{skill});
 }
 for(let i=0;i<10;i++)add('science-'+i,'biology',8,'bio-std','science-standard',{depthBand:'application'});
 for(const [band,total] of [['foundation',6],['application',11],['challenge',3]])
  for(let i=0;i<total;i++)add('y9-'+band+'-'+i,'biology',9,'y9-cell-topic','year9-progressive',{depthBand:band});
 for(const subject of ['latin','french']){
  const t=subject==='latin'?'la':'fr';
  for(let i=0;i<25;i++)add(t+'-v8-'+i,subject,8,t+'-vocab-y8',subject+'-vocab',{conceptId:t+'-y8-word-'+i});
  for(let i=0;i<5;i++)add(t+'-v9-'+i,subject,9,t+'-y9-vocab',subject+'-vocab',{conceptId:t+'-y9-word-'+i});
 }
 for(let i=0;i<10;i++){
  const q=add('old-'+i,'physics',8,'phys-revision','retention-source');
  prior.push({eventId:'old-attempt-'+i,day:'2026-10-'+String(10+i).padStart(2,'0'),
    taskId:'old-task',questionId:q.id,correct:i%2===0,persisted:true});
 }
 marks.forEach(m=>add('gcse-'+m,'biology',8,'bio-exam','gcse',{marks:m,markScheme:['markpoint']}));
 return {day,questionBank:bank,priorAttempts:prior,taughtTopicIds:taught};
}
function kinds(plan){return new Map(plan.tasks.map(t=>[t.id,t]));}
test('ready preflight publishes exactly ten tasks and 163 unique IDs',()=>{
 const r=planDailyV2(fixture());assert.equal(r.status,'ready');assert.equal(r.target,163);
 assert.equal(r.tasks.length,10);assert.equal(r.preflight.plannedQuestions,163);
 assert.equal(new Set(r.tasks.flatMap(t=>t.questionIds)).size,163);
 for(const {id,target} of DAILY_V2_TASKS)assert.equal(kinds(r).get(id).questionIds.length,target);
});
test('mastery meets band quota and is allocated on distinct topics',()=>{
 const r=planDailyV2(fixture());const t=kinds(r);
 assert.notEqual(t.get('mastery-a').topicId,t.get('mastery-b').topicId);
 for(const id of ['mastery-a','mastery-b']){
  const b=t.get(id).questions.map(q=>q.depthBand);
  assert.equal(b.filter(x=>x==='foundation').length,4);
  assert.equal(b.filter(x=>x==='application').length,10);
  assert.equal(b.filter(x=>x==='challenge').length,6);
 }
});
test('identical inputs produce identical plans',()=>{
 const f=fixture();assert.deepEqual(planDailyV2(f),planDailyV2(f));
});
test('frozen ready plan is restored, never regenerated from changed bank',()=>{
 const p=planDailyV2(fixture());
 const r=planDailyV2({day,existingPlan:p,questionBank:[]});
 assert.strictEqual(r,p);
});
test('frozen plan from a different date rejected',()=>{
 const p=planDailyV2(fixture());
 assert.throws(()=>planDailyV2({day:'2026-10-27',existingPlan:p}),/invalid frozen/);
});
test('one mastery topic only is blocked, not assigned to two 20-question tasks',()=>{
 const f=fixture();f.questionBank=f.questionBank.filter(q=>q.topicId!=='chem-mastery');
 const r=planDailyV2(f);assert.equal(r.status,'blocked');assert.deepEqual(r.tasks,[]);
 assert.ok(r.diagnostics.some(x=>x.code==='MASTERY_BANK_OR_DEPTH_SHORTAGE'));
});
test('loss of one challenge question blocks mastery, never substitutes MC',()=>{
 const f=fixture();f.questionBank=f.questionBank.filter(q=>q.id!=='m-1-challenge-5');
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='MASTERY_BANK_OR_DEPTH_SHORTAGE'));
});
test('a Y9 topic not taught is blocked even when catalog says enabled',()=>{
 const f=fixture();f.taughtTopicIds=[];
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='YEAR9_PROGRESSIVE_BANK_OR_DEPTH_SHORTAGE'));
});
test('spaced retention admits only persisted previously attempted IDs',()=>{
 const f=fixture();f.priorAttempts[0].persisted=false;
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='INSUFFICIENT_PERSISTED_HISTORY'));
});
test('same-day historical attempt cannot be used as spaced retention history',()=>{
 const f=fixture();f.priorAttempts[0].day=day;
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
});
test('full past vocab rounds cycle again when completed in previous dates',()=>{
 const f=fixture();
 const prior=f.questionBank.filter(q=>q.roles.includes('latin-vocab')||q.roles.includes('french-vocab'))
   .map(q=>({day:'2026-10-24',taskId:q.subject+'-vocab',questionId:q.id,conceptId:q.conceptId,correct:true,persisted:true}));
 f.priorAttempts.push(...prior);
 const r=planDailyV2(f);assert.equal(r.status,'ready');
 assert.equal(kinds(r).get('latin-vocab').questionIds.length,30);
 assert.equal(kinds(r).get('french-vocab').questionIds.length,30);
});
test('same-day vocab concept credited is not silently assigned again',()=>{
 const f=fixture();f.priorAttempts.push({day,taskId:'french-vocab',questionId:'fr-v8-0',conceptId:'fr-y8-word-0',correct:true,persisted:true});
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='VOCAB_CONCEPT_SHORTAGE'));
});
test('GCSE 1,2,3 mark items are distinct and carry marks metadata',()=>{
 const r=planDailyV2(fixture());assert.equal(r.status,'ready');
 assert.deepEqual(kinds(r).get('gcse-exam-skills').marks,[1,2,3]);
});
test('GCSE prompt matching ordinary question is disallowed, even with different ID',()=>{
 const f=fixture();f.questionBank.find(q=>q.id==='gcse-2').prompt='PROMPT science-0';
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='EXCLUSIVE_EXAM_MARK_SHORTAGE'));
});
test('exam lacks mark scheme: reject bank as invalid',()=>{
 const f=fixture();f.questionBank.find(q=>q.id==='gcse-3').markScheme=null;
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='GCSE_MISSING_MARK_SCHEME'));
});
test('duplicate question IDs are rejected, not counted twice',()=>{
 const f=fixture();f.questionBank.push({...f.questionBank[0]});
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='INVALID_OR_DUPLICATE_QUESTION_ID'));
});
test('Latin grammar quota does not silently become multiple choice vocabulary',()=>{
 const f=fixture();f.questionBank.find(q=>q.id==='latin-grammar-0').skill='vocabulary';
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='STANDARD_BANK_OR_SKILL_SHORTAGE'));
});
test('Y9 progresses from foundation to application to challenge',()=>{
 const r=planDailyV2(fixture());const stages=kinds(r).get('year9-progressive').questions.map(x=>x.depthBand);
 assert.deepEqual(stages.slice(0,6),Array(6).fill('foundation'));
 assert.deepEqual(stages.slice(6,17),Array(11).fill('application'));
 assert.deepEqual(stages.slice(17),Array(3).fill('challenge'));
});
test('history-only retention never credits exam questions even from old days',()=>{
 const f=fixture();f.priorAttempts[0].questionId='gcse-1';
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='INSUFFICIENT_PERSISTED_HISTORY'));
});
test('regardless of insufficiency, no partial tasks are published',()=>{
 const f=fixture();f.questionBank=f.questionBank.filter(q=>q.id!=='fr-v9-4');
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.equal(r.tasks.length,0);
 assert.equal(r.preflight.unpublished,true);
});

test('duplicate prompts inside Mastery are rejected rather than filling 20 with repeated wording',()=>{
 const f=fixture();const first=f.questionBank.find(q=>q.id==='m-0-application-0').prompt;
 f.questionBank.find(q=>q.id==='m-0-application-1').prompt=first;
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='MASTERY_BANK_OR_DEPTH_SHORTAGE'));
});
test('science Standard requires ten distinct prompts as well as IDs',()=>{
 const f=fixture();f.questionBank.find(q=>q.id==='science-1').prompt=f.questionBank.find(q=>q.id==='science-0').prompt;
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='STANDARD_BANK_OR_SKILL_SHORTAGE'));
});
test('historical retention requires ten distinct past question prompts',()=>{
 const f=fixture();f.questionBank.find(q=>q.id==='old-1').prompt=f.questionBank.find(q=>q.id==='old-0').prompt;
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='INSUFFICIENT_PERSISTED_HISTORY'));
});
test('duplicated vocabulary prompts cannot fill two concepts in one day',()=>{
 const f=fixture();f.questionBank.find(q=>q.id==='la-v8-1').prompt=f.questionBank.find(q=>q.id==='la-v8-0').prompt;
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='VOCAB_VARIANT_COLLISION'));
});
test('unused GCSE-labeled questions cannot leak into Science Standard',()=>{
 const f=fixture();f.questionBank=f.questionBank.filter(q=>q.id!=='science-9');
 f.questionBank.push({id:'gcse-other',subject:'biology',year:8,topicId:'bio-exam',status:'enabled',formal:true,
   prompt:'GCSE unique other',roles:['gcse','science-standard'],marks:1,markScheme:['point']});
 const r=planDailyV2(f);assert.equal(r.status,'blocked');
 assert.ok(r.diagnostics.some(x=>x.code==='STANDARD_BANK_OR_SKILL_SHORTAGE'));
});

test('Latin Standard may compose grammar, translation and passage from different taught topics',()=>{
 const f=fixture();
 for(const q of f.questionBank.filter(q=>q.roles.includes('latin-standard')))q.topicId='la-'+q.skill;
 const r=planDailyV2(f);
 assert.equal(r.status,'ready');
 const latin=kinds(r).get('latin-standard');
 assert.equal(latin.topicId,null);
 assert.equal(latin.topicIds.length,3);
 assert.equal(latin.questionIds.length,10);
});
test('French Standard may compose writing and translation across different taught topics',()=>{
 const f=fixture();
 for(const q of f.questionBank.filter(q=>q.roles.includes('french-standard')))q.topicId='fr-'+q.skill;
 const r=planDailyV2(f);
 assert.equal(r.status,'ready');
 const french=kinds(r).get('french-standard');
 assert.equal(french.topicId,null);
 assert.equal(french.topicIds.length,3);
 assert.equal(french.questionIds.length,10);
});
