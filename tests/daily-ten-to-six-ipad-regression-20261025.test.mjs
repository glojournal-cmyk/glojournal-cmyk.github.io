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
