import test from 'node:test';
import assert from 'node:assert/strict';
import {selectMathsV31Daily} from '../assets/math-study/daily-v31-selector.js';
const topics=['math-y9-indices','math-y9-standard-form','math-y9-changing-subject',
 'math-y9-straight-line-graphs','math-y9-simultaneous-equations'];
const grades=['G7','G7','G7','G7','G8','G8','G8','G8','G8-9','G8-9'];
const fixture=topics.flatMap((topicId,t)=>grades.flatMap((difficultyTarget,k)=>
 Array.from({length:4},(_,v)=>({
  id:'test-math-'+t+'-'+k+'-'+v,subject:'maths',year:9,topicId,
  difficultyTarget,templateId:'test-template-'+t+'-'+k,
  conceptFamilyId:'test-template-'+t+'-'+k,
  academicQA:'approved',taughtVerified:true,mathDailyEnabled:true,renderRequired:true,
  qaSourceStatus:'MATH_VERIFIED_WITH_INDEPENDENT_PEDAGOGICAL_SIGNOFF',
  options:['A','B','C','D','E','F'].map(id=>({id,text:id}))
 }))));

test('fail closed on source metadata, teacher review or incorrect date',()=>{
 const tomorrow=selectMathsV31Daily({approvedQuestions:fixture,day:'2026-11-23T12:00:00Z'});
 assert.equal(tomorrow.ready,false);
 const absent=selectMathsV31Daily({approvedQuestions:fixture.map(q=>({...q,academicQA:'pending'})),day:'2026-11-23'});
 assert.equal(absent.ready,false);
 const noTaught=selectMathsV31Daily({approvedQuestions:fixture.map(q=>({...q,taughtVerified:false})),day:'2026-11-23'});
 assert.equal(noTaught.ready,false);
});

test('daily 10 MC: exactly two per topic, 4/4/2 provisional bands and no duplicate ID or template',()=>{
 const one=selectMathsV31Daily({approvedQuestions:fixture,day:'2026-11-23'});
 assert.equal(one.ready,true,one.issues?.join(','));
 assert.equal(one.questions.length,10);
 assert.deepEqual(one.diagnostics.bandCounts,{'G7':4,'G8':4,'G8-9':2});
 assert.ok(Object.values(one.diagnostics.topics).every(n=>n===2));
 assert.equal(new Set(one.questions.map(q=>q.id)).size,10);
 assert.equal(new Set(one.questions.map(q=>q.templateId)).size,10);
 assert.deepEqual(selectMathsV31Daily({approvedQuestions:fixture,day:'2026-11-23'}).questions.map(x=>x.id),
   one.questions.map(x=>x.id),'stable on reload');
});

test('twenty days consume exactly 200 unique fresh questions and avoid adjacent template repeats when supply allows',()=>{
 const history=[],seen=new Set();let repeats=0;
 for(let dayIndex=0;dayIndex<20;dayIndex++){
  const d=new Date('2026-11-23T12:00:00Z');d.setUTCDate(d.getUTCDate()+dayIndex);
  const day=d.toISOString().slice(0,10);
  const result=selectMathsV31Daily({approvedQuestions:fixture,day,history});
  assert.equal(result.ready,true,day+': '+result.issues?.join(','));
  for(const q of result.questions){assert.ok(!seen.has(q.id),q.id);seen.add(q.id)}
  repeats+=result.diagnostics.previousDayTemplateRepeats;
  history.push({date:day,questionIds:result.questions.map(q=>q.id),
   templateIds:result.questions.map(q=>q.templateId)});
 }
 assert.equal(seen.size,200);
 assert.equal(repeats,0);
 const exhausted=selectMathsV31Daily({approvedQuestions:fixture,day:'2026-12-13',history});
 assert.equal(exhausted.ready,false);
 assert.equal(exhausted.questions.length,0);
});

test('Missing semantic concept family cannot be selected as Maths Daily supply',()=>{
 const unreviewed=fixture.map(q=>({...q,conceptFamilyId:null}));
 assert.equal(selectMathsV31Daily({approvedQuestions:unreviewed,day:'2026-11-23'}).ready,false);
});

test('Different source template IDs cannot masquerade as different Maths concepts',()=>{
 const picked=selectMathsV31Daily({approvedQuestions:fixture,day:'2026-11-23'});
 assert.equal(picked.ready,true);
 const [a,b]=picked.questions.slice(0,2);
 const sameFamily=picked.questions.map(q=>q.id===b.id?{...q,conceptFamilyId:a.conceptFamilyId}:q);
 const result=selectMathsV31Daily({approvedQuestions:sameFamily,day:'2026-11-23'});
 assert.equal(result.ready,false,'there are only nine semantic concepts despite ten template IDs');
});

test('one already-used ID is not recycled to make artificial ten without independent fresh replacements',()=>{
 const bank=fixture.slice(0,10),history=[{date:'2026-11-22',questionIds:bank.map(q=>q.id),
   templateIds:bank.map(q=>q.templateId)}];
 const result=selectMathsV31Daily({approvedQuestions:bank,day:'2026-11-23',history});
 assert.equal(result.ready,false);
 assert.equal(result.questions.length,0);
});
