import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dailyUnfinishedQuestionIds,selectUnfinishedDailyQuestions}
 from '../assets/daily-unfinished-retry-20261025.js';
import {reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {readDailyRetryReceiptSync,saveCompletedDailyReceipt,restoreCompletedDailyReceipts}
 from '../assets/daily-completed-session-receipts-20261024.js';
const day='2026-10-25',taskId='y8-standard-a',topicId='latin-y8-basic-grammar';
const task=(progress=9)=>({id:taskId,planDate:day,target:10,progress,
 assignedSubject:'latin',assignedTopic:topicId,assignedYear:8,
 href:'/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task='+taskId+'&topic='+topicId});
const state=(progress=9)=>({today:day,year:8,seenCorrect:{},formalAttemptLog:[],
 daily:[task(progress)],dailyLog:{[day]:{date:day,tasks:[task(progress)],done:0,total:1,complete:false}}});
const questions=Array.from({length:11},(_,i)=>({id:'q'+i,formal:true,format:'typed_short',topicId,
 prompt:'Translate Latin example '+i}));
const originalReceipt=()=>({day,taskId,subject:'latin',year:8,topicId,
 mode:'standard',target:10,questions:questions.slice(0,10),
 answers:questions.slice(0,10).map((q,i)=>({questionId:q.id,correct:i!==9,formal:true,repair:false}))});
const options=(s,receipt,remaining=1)=>({state:s,receipt,day,taskId,subject:'latin',year:8,topicId,mode:'standard',remaining});
const scored=a=>({questionId:a.id,correct:true,formal:true,repair:false});
test('9/10 re-entry selects the exact original WRONG q9, not fresh q10',()=>{
 const s=state(),r=originalReceipt();
 s.reviews={q9:{wrong:true,due:'2026-10-27'}};
 const remaining=dailyUnfinishedQuestionIds(s,r,options(s,r));
 assert.deepEqual(remaining.wrongIds,['q9']);
 const retry=selectUnfinishedDailyQuestions([questions[10]],questions,options(s,r));
 assert.deepEqual(retry.map(q=>q.id),['q9']);
});
test('After correct retry of q9, locked Home and 30-day status become 10/10',()=>{
 const s=state(),old=originalReceipt(),retry=questions[9];
 const result=reconcileDailySession(s,{day,taskId,subject:'latin',year:8,mode:'standard',
  questions:[retry],answers:[scored(retry)],priorReceipt:old});
 assert.equal(result.changed,true);
 assert.equal(result.progress,10);
 assert.equal(result.daily[0].progress,10);
 assert.equal(result.daily[0].done,true);
 assert.equal(result.dailyLog[day].tasks[0].progress,10);
 assert.equal(result.dailyLog[day].tasks[0].done,true);
 assert.equal(result.dailyLog[day].done,1);
 assert.equal(result.dailyLog[day].complete,true);
 assert.equal(s.daily[0].progress,9,'selection/reconciliation never mutate prior student state');
});
test('9/10 journal can still establish completion with the matching tenth even when receipt missing',()=>{
 const s=state(),qs=questions.slice(0,9);
 s.formalAttemptLog=qs.map((q,i)=>({
  day,dailyTaskId:taskId,subject:'latin',year:8,topicId,questionId:q.id,
  attemptId:'a'+i,correct:true,formal:true,repair:false}));
 const result=reconcileDailySession(s,{day,taskId,subject:'latin',year:8,mode:'standard',
  questions:[questions[9]],answers:[scored(questions[9])]});
 assert.equal(result.progress,10);
});
test('Same answer twice does not fabricate missing Daily completion',()=>{
 const s=state(),old=originalReceipt();
 const result=reconcileDailySession(s,{day,taskId,subject:'latin',year:8,mode:'standard',
  questions:[questions[0]],answers:[scored(questions[0])],priorReceipt:old});
 assert.equal(result.progress,9,'a repeated correct answer must not become the missing tenth');
 assert.equal(result.daily[0].progress,9);
 assert.equal(result.daily[0].verifiedCorrectIds?.length,9,'verified evidence may be saved without extra score');
});
test('A receipt for a different assignment/date/subject cannot add a phantom tenth credit',()=>{
 const s=state(),old=originalReceipt(),query={day,taskId,subject:'latin',year:8,
 mode:'standard',questions:[questions[9]],answers:[scored(questions[9])]};
 for(const change of [{day:'2026-10-24'},{taskId:'y8-standard-b'},
   {subject:'biology'},{topicId:'other'},{mode:'mastery'},{year:9}]){
  const r=reconcileDailySession(s,{...query,priorReceipt:{...old,...change}});
  assert.equal(r.progress,9,JSON.stringify(change));
 }
});
test('Safari local receipt persists the 9-correct base set and its specific missed question',async()=>{
 const data=new Map(),original=globalThis.localStorage;
 globalThis.localStorage={getItem:k=>data.get(k)||null,
  setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
 try {
  const s=state(9),r=originalReceipt();
  assert.equal(await saveCompletedDailyReceipt(s,r),true);
  const fromSaved=readDailyRetryReceiptSync(r);
  assert.deepEqual(dailyUnfinishedQuestionIds(s,fromSaved,options(s,fromSaved)).wrongIds,['q9']);
  const retry=questions[9];
  assert.equal(await saveCompletedDailyReceipt(s,{day,taskId,subject:'latin',year:8,
    mode:'standard',questions:[retry],answers:[scored(retry)]}),true);
  const copy={...s,setState:()=>{}},snapshot={...s};
  const store={getState:()=>snapshot,setState:patch=>Object.assign(snapshot,patch)};
  assert.equal(await restoreCompletedDailyReceipts(store),true);
  assert.equal(snapshot.daily[0].progress,10);
  assert.equal(snapshot.dailyLog[day].tasks[0].done,true);
 }finally{globalThis.localStorage=original;}
});
test('Both deployed Science and Latin/French Practice wait for saved original wrong questions',()=>{
 for(const file of ['assets/study._subject.practise-D_PWgUd7.js',
  'assets/study._subject.practise-y8fix-20260920.js']){
  const s=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.match(s,/selectUnfinishedDailyQuestions\(selectDiverseRecoveryQuestions\(/);
  assert.match(s,/readDailyRetryReceipt\(retryConfig\)/);
  assert.match(s,/retryReady&&safeU.length&&!sessionSnapshot.current/);
  assert.match(s,/Restoring your unfinished Daily questions/);
 }
 const quiz=readFileSync(new URL('../assets/quiz-session-y8fix-20260920.js',import.meta.url),'utf8');
 assert.match(quiz,/priorReceipt:readDailyRetryReceiptSync/);
 assert.match(quiz,/topicId:new URLSearchParams\(location\.search\)\.get\('topic'\)\|\|g/);
});
