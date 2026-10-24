import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileCompletedDailyReceipts,saveCompletedDailyReceipt} from '../assets/daily-completed-session-receipts-20261024.js';
const day='2026-10-24',id='latin-standard',topic='la-y8-stage-1-vocabulary';
const route='/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task=latin-standard&topic='+topic;
const task=(progress=0)=>({id,title:'Latin · Stage 1 vocabulary',target:10,progress,
  planDate:day,assignedSubject:'latin',assignedTopic:topic,assignedYear:8,href:route});
const state=()=>({today:day,daily:[task(),...Array.from({length:9},(_,i)=>({
  id:'other-'+i,title:'Other',target:10,progress:0,planDate:day
}))],dailyLog:{[day]:{date:day,done:0,total:10,tasks:[
  {...task(),done:false},...Array.from({length:9},(_,i)=>({
    id:'other-'+i,target:10,progress:0,done:false
  }))]}}});
const completed=(correct=10)=>({key:'test',day,taskId:id,subject:'latin',topicId:topic,
  mode:'standard',year:8,target:10,at:Date.now(),
  questions:Array.from({length:10},(_,i)=>({id:'q'+i,topicId:topic,formal:true})),
  answers:Array.from({length:10},(_,i)=>({
    questionId:'q'+i,correct:i<correct,formal:true,repair:false
  }))});
test('Latin Stage 1 10 correct answers survive a simulated iPad reload without XP writes',()=>{
  const before=state(),patch=reconcileCompletedDailyReceipts(before,[completed()]);
  assert.equal(patch.daily.find(t=>t.id===id).progress,10);
  assert.equal(patch.dailyLog[day].tasks.find(t=>t.id===id).progress,10);
  assert.equal(patch.dailyLog[day].done,1);
  assert.equal(reconcileCompletedDailyReceipts({...before,...patch},[completed()]),null);
  assert.equal(before.daily[0].progress,0);
  assert.equal(Object.prototype.hasOwnProperty.call(patch,'xp'),false);
});
test('answers are retained but wrong answers do not become 10/10',()=>{
  const patch=reconcileCompletedDailyReceipts(state(),[completed(6)]);
  assert.equal(patch.daily[0].progress,6);
});
test('wrong date, changed topic or changed mode cannot borrow a saved completion',()=>{
  assert.equal(reconcileCompletedDailyReceipts({...state(),today:'2026-10-25'},[completed()]),null);
  assert.equal(reconcileCompletedDailyReceipts(state(),[{...completed(),topicId:'other'}]),null);
  assert.equal(reconcileCompletedDailyReceipts(state(),[{...completed(),mode:'mastery'}]),null);
  const other=state();other.daily[0]={...other.daily[0],assignedTopic:'other'};
  assert.equal(reconcileCompletedDailyReceipts(other,[completed()]),null);
});
test('duplicate completed receipts do not inflate task progress',()=>{
  const patch=reconcileCompletedDailyReceipts(state(),[completed(4),completed(4)]);
  assert.equal(patch.daily[0].progress,4);
});

test('iPad lost live task array but the verified 30-day Latin assignment survives',async()=>{
  const saved=state();
  const storage=new Map();
  const previous=globalThis.localStorage;
  globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>{storage.set(k,v)}};
  try{
    const broken={...saved,daily:saved.daily.filter(t=>t.id!==id)};
    const r=completed(8);
    assert.equal(await saveCompletedDailyReceipt(broken,{
      day:r.day,taskId:r.taskId,subject:r.subject,year:r.year,mode:r.mode,
      questions:r.questions,answers:r.answers
    }),true,'a complete session is still saved from its verified dated assignment');
    assert.ok(storage.size>0,'independent small localStorage fallback is available');
    assert.equal(await saveCompletedDailyReceipt(broken,{
      day:r.day,taskId:r.taskId,subject:r.subject,year:r.year,mode:r.mode,
      questions:r.questions,answers:r.answers.slice(0,9)
    }),false,'partial quiz cannot create a completion receipt');
  }finally{
    if(previous===undefined)delete globalThis.localStorage;
    else globalThis.localStorage=previous;
  }
});
