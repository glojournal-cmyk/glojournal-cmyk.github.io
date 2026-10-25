import test from 'node:test';
import assert from 'node:assert/strict';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';
import {reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {syncTodayFromDatedRecord} from '../assets/today-record-sync-20261024.js';
const day='2026-10-25',subjects=['latin','french','biology','chemistry','physics'];
const catalog=subjects.flatMap(subject=>Array.from({length:4},(_,i)=>({
 subject,year:8,topicId:subject+'-y8-t'+(i+1),title:subject+' '+i,
 status:'enabled',enabled:40,formats:{typed_short:20}
})));
const get=(s,y)=>catalog.filter(t=>t.subject===s&&t.year===y);
const state=()=>({today:day,year:9,daily:[],dailyLog:{},topicStats:{},formalAttemptLog:[],dailyVocabByDay:{},reviews:{}});
const findTask=rows=>rows.find(t=>t.id==='y8-standard-a');
const topicReceipt=t=>{
 const qs=Array.from({length:10},(_,i)=>({id:'bio-question-'+i,topicId:t.assignedTopic,formal:true}));
 return {day,taskId:t.id,subject:t.assignedSubject,year:t.assignedYear,
  mode:'standard',questions:qs,answers:qs.map(q=>({questionId:q.id,correct:true,formal:true}))};
};
test('a previously verified 10/10 standard Daily cannot fall to 6/10 after iPad loses four journal events',()=>{
 const start=state(),plan=buildYear8DailyV2(start,get);
 const t=findTask(plan);
 assert.ok(t&&t.href.includes('locked=1'));
 const receipt=topicReceipt(t);
 const saved=reconcileDailySession({...start,daily:plan},receipt);
 assert.equal(saved.progress,10);
 assert.equal(saved.daily.find(x=>x.id===t.id).verifiedCorrectIds.length,10);
 assert.equal(saved.daily.find(x=>x.id===t.id).done,true);
 // Safari main state lost four of the ten saved journal rows, but the
 // independent completed-quiz receipt has been replayed to Daily.
 const partial=receipt.questions.slice(0,6).map((q,i)=>({
  day,questionId:q.id,dailyTaskId:t.id,subject:t.assignedSubject,
  year:t.assignedYear,topicId:t.assignedTopic,mode:'standard',
  attemptId:'a'+i,correct:true,formal:true,repair:false
 }));
 const regenerated=buildYear8DailyV2({...start,daily:saved.daily,formalAttemptLog:partial},get);
 const live=findTask(regenerated);
 assert.equal(live.progress,10,'verified correct receipts must override an incomplete journal');
 assert.equal(live.verifiedCorrectIds.length,10);
 assert.equal(live.correctOnlyEvidence,true);
});
test('a 6/10 journal with NO verified receipt must not be promoted to 10/10',()=>{
 const start=state(),plan=buildYear8DailyV2(start,get),t=findTask(plan);
 const partial=topicReceipt(t).questions.map((q,i)=>({
  day,questionId:q.id,dailyTaskId:t.id,subject:t.assignedSubject,
  year:t.assignedYear,topicId:t.assignedTopic,mode:'standard',
  attemptId:'a'+i,correct:i<6,formal:true,repair:false
 }));
 const rebuilt=buildYear8DailyV2({...start,daily:plan,formalAttemptLog:partial},get);
 assert.equal(findTask(rebuilt).progress,6);
 assert.equal(findTask(rebuilt).verifiedCorrectIds,undefined);
});
test('verified 10/10 is copied with the same exact topic and can restore 6/10 Home from dated record',()=>{
 const start=state(),plan=buildYear8DailyV2(start,get),t=findTask(plan);
 const saved=reconcileDailySession({...start,daily:plan},topicReceipt(t));
 const older=plan.map(x=>x.id===t.id?{...x,progress:6}:x);
 const synced=syncTodayFromDatedRecord(older,{date:day,tasks:saved.daily},day);
 assert.equal(findTask(synced).progress,10);
});
test('wrong-day subject or topic cannot borrow a different completed task proof',()=>{
 const start=state(),plan=buildYear8DailyV2(start,get),t=findTask(plan);
 const saved=reconcileDailySession({...start,daily:plan},topicReceipt(t));
 const mismatched=saved.daily.map(row=>row.id===t.id?{...row,assignedTopic:'other-biology-topic'}:row);
 const rebuilt=buildYear8DailyV2({...start,daily:mismatched,formalAttemptLog:[]},get);
 assert.notEqual(findTask(rebuilt).verifiedCorrectIds?.length,10);
});

test('Biology Food Tests: ten marked CORRECT slots with only six unique IDs still count 10/10',()=>{
 const topic='bio-y8-food-tests',id='y8-standard-a';
 const task={id,planDate:day,target:10,progress:0,
  assignedSubject:'biology',assignedTopic:topic,assignedYear:8,
  href:'/study/biology/practise?daily=1&locked=1&year=8&mode=standard&task='+id+'&topic='+topic};
 const questions=['a','b','c','d','e','f','a','b','c','d'].map(k=>({
  id:'food-'+k,topicId:topic,formal:true
 }));
 const answers=questions.map(q=>({questionId:q.id,correct:true,formal:true,repair:false}));
 const source={today:day,daily:[task],dailyLog:{[day]:{date:day,
  tasks:[task],total:1,done:0}},formalAttemptLog:[]};
 const result=reconcileDailySession(source,{day,taskId:id,subject:'biology',
  year:8,mode:'standard',questions,answers});
 assert.equal(result.progress,10,'ten marked slots must not collapse to six distinct IDs');
 assert.equal(result.daily[0].verifiedCorrectIds.length,6);
 assert.equal(result.daily[0].verifiedCorrectSlots,10);
 assert.equal(result.daily[0].done,true);
});
test('Biology Food Tests ten repeated-ID slots survive reload of iPad completed-quiz receipt',async()=>{
 const topic='bio-y8-food-tests',id='y8-standard-a';
 const task={id,planDate:day,target:10,progress:6,
  assignedSubject:'biology',assignedTopic:topic,assignedYear:8,
  href:'/study/biology/practise?daily=1&locked=1&year=8&mode=standard&task='+id+'&topic='+topic};
 const questions=['a','b','c','d','e','f','a','b','c','d'].map(k=>({
  id:'food-'+k,topicId:topic,formal:true
 }));
 const answers=questions.map(q=>({questionId:q.id,correct:true,formal:true,repair:false}));
 const source={day,taskId:id,subject:'biology',year:8,mode:'standard',questions,answers};
 const saved=new Map(),oldLocal=globalThis.localStorage;
 globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))};
 try{
  const snapshot={today:day,daily:[task],dailyLog:{[day]:{date:day,tasks:[task],total:1,done:0}},
    formalAttemptLog:[]};
  const {saveCompletedDailyReceipt,reconcileCompletedDailyReceipts}
    =await import('../assets/daily-completed-session-receipts-20261024.js');
  assert.equal(await saveCompletedDailyReceipt(snapshot,source),true);
  const stored=JSON.parse(saved.get('lux-daily-completed-sessions-safe-v1'));
  assert.equal(stored[0].questions.length,10);
  const refreshed=reconcileCompletedDailyReceipts(snapshot,stored);
  assert.equal(refreshed.daily[0].progress,10);
  assert.equal(refreshed.daily[0].verifiedCorrectSlots,10);
  assert.equal(refreshed.dailyLog[day].tasks[0].done,true);
  // Re-sending this exact receipt must not count it twice.
  assert.equal(await saveCompletedDailyReceipt(snapshot,source),true);
  const again=JSON.parse(saved.get('lux-daily-completed-sessions-safe-v1'));
  assert.equal(again[0].questions.length,10);
 }finally{globalThis.localStorage=oldLocal;}
});

test('A verified 10/10 Daily with repeated IDs still reads 10/10 after its journal reloads with six unique IDs',()=>{
 const start=state(),plan=buildYear8DailyV2(start,get),task=findTask(plan);
 const qs=['a','b','c','d','e','f','a','b','c','d'].map(x=>({
  id:'test-'+x,topicId:task.assignedTopic,formal:true
 }));
 const receipt={day,taskId:task.id,subject:task.assignedSubject,year:task.assignedYear,
  mode:'standard',questions:qs,answers:qs.map(q=>({questionId:q.id,correct:true,formal:true}))};
 const first=reconcileDailySession({...start,daily:plan},receipt);
 assert.equal(first.progress,10);
 assert.equal(first.daily.find(x=>x.id===task.id).verifiedCorrectSlots,10);
 assert.equal(first.daily.find(x=>x.id===task.id).verifiedCorrectIds.length,6);
 const six=qs.slice(0,6).map((q,i)=>({
  day,questionId:q.id,dailyTaskId:task.id,subject:task.assignedSubject,
  year:task.assignedYear,topicId:task.assignedTopic,mode:'standard',
  attemptId:'ipad-'+i,correct:true,formal:true,repair:false
 }));
 const rebuilt=buildYear8DailyV2({...start,daily:first.daily,formalAttemptLog:six},get);
 assert.equal(findTask(rebuilt).progress,10);
 assert.equal(findTask(rebuilt).verifiedCorrectSlots,10);
});
