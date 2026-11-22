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
// Receipt integrity tests need source-backed, actually assignable pools;
// synthetic t1-t4 catalog labels have no real question bank and are blocked.
for(const [topicId,subject] of [
 ['la-y8-nouns-and-dictionary-entries','latin'],
 ['la-y8-nouns-with-genitives','latin'],
 ['la-y8-core-verbs','latin'],
 ['fr-y8-s02-weather-activities-and-opinions','french'],
 ['fr-y8-s03-home-family-and-descriptions','french'],
 ['fr-y8-s07-passe-compose','french'],
 ['fr-y8-s25-classroom-objects','french'],
 ['bio-y8-food-tests','biology']
])catalog.push({subject,year:8,topicId,title:topicId,status:'enabled',enabled:80,formats:{typed_short:30}});
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

test('QA-held Biology Food Tests cannot gain a new 10/10 from repeated IDs',()=>{
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
 assert.equal(result.changed,false,'held work must not grant fresh formal credit');
 assert.equal(result.reason,'academic-qa-hold');
 assert.equal(result.progress,0);
 assert.strictEqual(result.daily,source.daily,'do not replace the dated task');
 assert.equal(result.daily[0].verifiedCorrectIds,undefined);
 assert.equal(result.daily[0].done,undefined);
});

test('QA-held Biology Food Tests cannot manufacture a completed iPad quiz receipt',async()=>{
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
  assert.equal(await saveCompletedDailyReceipt(snapshot,source),false,
   'new QA-held Food Tests receipt must be rejected even if all answers claim correct');
  assert.equal(saved.has('lux-daily-completed-sessions-safe-v1'),false,
   'no new credited receipt must be persisted');
  const legacy={...source,key:[day,id,'biology',topic,'standard',10].join('|'),
    topicId:topic,target:10,at:Date.now(),
    questions:questions.map(q=>({id:q.id,topicId:topic,formal:true,_repair:false})),
    answers:answers.map(a=>({questionId:a.questionId,correct:true,formal:true,repair:false}))};
  assert.equal(reconcileCompletedDailyReceipts(snapshot,[legacy]),null,
   'even an old validly structured receipt cannot retrospectively award new credit');
  assert.equal(snapshot.daily[0].progress,6,'previously saved progress must remain untouched');
 }finally{globalThis.localStorage=oldLocal;}
});

test('an already completed historical Food Tests Daily card is not erased by the QA hold',()=>{
 const topic='bio-y8-food-tests',id='y8-standard-a';
 const old={id,planDate:day,target:10,progress:10,done:true,
  assignedSubject:'biology',assignedTopic:topic,assignedYear:8,assignedLabel:'Food Tests',
  href:'/study/biology/practise?daily=1&locked=1&year=8&mode=standard&task='+id+'&topic='+topic};
 const original={...state(),daily:[old],dailyLog:{[day]:{date:day,tasks:[old]}}};
 const regenerated=buildYear8DailyV2(original,get);
 const row=regenerated.find(t=>t.id===id);
 assert.ok(row,'retain the historical Daily task');
 assert.equal(row.assignedTopic,topic,'historical topic ID must not be silently reassigned');
 assert.equal(row.progress,10,'already recorded progress must not be erased');
 assert.equal(row.target,10,'historic target must not be rewritten');
 assert.equal(original.daily[0].progress,10,'planner must not mutate historic state');
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
