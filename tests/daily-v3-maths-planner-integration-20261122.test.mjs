import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDailyV3,V3_APPROVED} from '../assets/daily-tasks-v3-20261122.js';
const topics=['math-y9-indices','math-y9-standard-form','math-y9-changing-subject',
 'math-y9-straight-line-graphs','math-y9-simultaneous-equations'];
const slugs=['indices','standard-form','changing-subject','straight-line-graphs','simultaneous-equations'];
const grades=Array.from({length:10},(_,i)=>i<4?'G7':i<8?'G8':'G8-9');
const bank=topics.flatMap((topicId,t)=>grades.flatMap((difficultyTarget,k)=>
 Array.from({length:4},(_,v)=>({
  id:'fixture-'+t+'-'+k+'-'+v,subject:'maths',year:9,topicId,topic:slugs[t],
  difficultyTarget,grade:difficultyTarget.slice(1),templateId:'template-'+t+'-'+k,
  conceptFamilyId:'template-'+t+'-'+k,
  conceptFamilyEvidence:'synthetic family equivalence test',
  conceptFamilyReviewer:'synthetic reviewer',
  academicQA:'approved',taughtVerified:true,mathDailyEnabled:true,renderRequired:true,
  sourceRef:'synthetic CI fixture only',qaReviewer:'synthetic fixture',
  workedSolution:['fixture solution 1','fixture solution 2'],
  correctOptionId:'A',options:['A','B','C','D','E','F'].map((id,i)=>({
   id,text:String(i),...(i?{misconception:'synthetic wrong choice '+i}:{})
  }))
 }))));
const legacy=day=>[
 ['french-vocab',30,8],['latin-vocab',30,8],['latin-standard',10,8],
 ['y8-standard-a',10,8],['y8-standard-b',10,8],['y8-mastery-a',20,8],
 ['y8-mastery-b',20,8],['weakness-review',10,8],['due-review',10,8],['year9-light',15,9]
].map(([id,target,assignedYear])=>({id,target,assignedYear,planDate:day,progress:0}));
test('actual V3 planner consumes 200 synthetic unique question IDs in 20 fixed 4/4/2 Daily assignments',()=>{
 const history={},seen=new Set();let previous=new Set();
 for(let i=0;i<20;i++){
  const d=new Date('2026-11-23T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);
  const day=d.toISOString().slice(0,10);
  const state={today:day,daily:[],dailyLog:history,formalAttemptLog:[],seenCorrect:{},reviews:{}};
  const tasks=buildDailyV3(state,legacy(day),{...V3_APPROVED,maths:bank,mathsRuntimeReady:true});
  const maths=tasks.find(t=>t.id==='maths-daily');
  assert.equal(maths.supplyBlocked,undefined,day);
  assert.equal(maths.approvedQuestionIds.length,10,day);
  assert.equal(new Set(maths.approvedQuestionIds).size,10,day);
  const templates=Object.values(maths.approvedTemplateByQuestion);
  const families=Object.values(maths.approvedConceptByQuestion);
  assert.equal(new Set(families).size,10,day);
  assert.equal(new Set(templates).size,10,day);
  assert.equal(templates.filter(x=>previous.has(x)).length,0,day+' no adjacent repeat');
  for(const id of maths.approvedQuestionIds){
   assert.ok(!seen.has(id),'no repeated ID '+id);seen.add(id);
  }
  previous=new Set(templates);
  history[day]={date:day,tasks:[maths]};
  assert.equal(tasks.reduce((n,t)=>n+t.target,0),165);
 }
 assert.equal(seen.size,200);
 const date='2026-12-13';
 const exhausted=buildDailyV3({today:date,daily:[],dailyLog:history,formalAttemptLog:[],seenCorrect:{},reviews:{}},
    legacy(date),{...V3_APPROVED,maths:bank,mathsRuntimeReady:true}).find(t=>t.id==='maths-daily');
 assert.equal(exhausted.supplyBlocked,true);
 assert.equal(exhausted.progress,0);
});


import {appendApprovedMathsDaily} from '../assets/daily-maths-additive-eleventh-20261125.js';
test('additive Maths planner retains all ten existing tasks and appends only approved Maths',()=>{
 const day='2026-11-26',old=legacy(day),state={today:day,daily:[],dailyLog:{},formalAttemptLog:[]};
 const release={...V3_APPROVED,maths:bank,mathsRuntimeReady:true};
 const result=appendApprovedMathsDaily(state,old,release,day);
 assert.equal(result.length,11);
 assert.deepEqual(result.slice(0,10),old);
 for(let i=0;i<10;i++)assert.equal(result[i],old[i]);
 const maths=result[10];assert.equal(maths.id,'maths-daily');
 assert.equal(maths.target,10);assert.equal(maths.progress,0);assert.equal(maths.done,false);
 assert.equal(new Set(maths.approvedQuestionIds).size,10);
 assert.equal(new Set(Object.values(maths.approvedConceptByQuestion)).size,10);
 assert.equal(result.reduce((n,t)=>n+t.target,0),old.reduce((n,t)=>n+t.target,0)+10);
});
test('additive Maths planner blocks unapproved, unverified-runtime and previously issued plans',()=>{
 const day='2026-11-26',old=legacy(day),state={today:day,daily:[],dailyLog:{},formalAttemptLog:[]};
 const release={...V3_APPROVED,maths:bank,mathsRuntimeReady:true};
 assert.equal(appendApprovedMathsDaily(state,old,V3_APPROVED,day),old);
 assert.equal(appendApprovedMathsDaily(state,old,{...release,mathsRuntimeReady:false},day),old);
 assert.equal(appendApprovedMathsDaily(state,old,release,'2026-11-27'),old);
 assert.equal(appendApprovedMathsDaily({...state,daily:old},old,release,day),old);
 assert.equal(appendApprovedMathsDaily({...state,dailyLog:{[day]:{tasks:old}}},old,release,day),old);
 assert.equal(appendApprovedMathsDaily({...state,formalAttemptLog:[{day,dailyTaskId:'latin-vocab'}]},old,release,day),old);
 assert.equal(appendApprovedMathsDaily(state,old.slice(0,9),release,day).length,9);
 assert.equal(appendApprovedMathsDaily(state,old,{...release,maths:[]},day),old);
});
