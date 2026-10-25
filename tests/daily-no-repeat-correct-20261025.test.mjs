import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dailyCorrectQuestionIds,fillDailyLockedQuestions} from '../assets/daily-locked-question-fallback-20261021.js';
import {saveCompletedDailyReceipt,reconcileCompletedDailyReceipts} from '../assets/daily-completed-session-receipts-20261024.js';
import {reconcileDailySession} from '../assets/daily-session-credit-20261021.js';

const day='2026-10-25',subject='biology',taskId='year9-light',topicId='bio-y9-b1',year=9;
const questions=Array.from({length:10},(_,i)=>({id:'bio-'+i,topicId,formal:true}));
const task=(progress=8)=>({id:taskId,planDate:day,assignedSubject:subject,assignedTopic:topicId,
 assignedYear:year,target:10,progress,href:'/study/biology/practise?daily=1&locked=1&year=9&mode=standard&task=year9-light&topic='+topicId});
const makeState=(progress=8)=>({today:day,daily:[task(progress)],dailyLog:{[day]:{date:day,tasks:[task(progress)],done:0,total:1}}});
const proof=(qs,ok)=>({day,taskId,subject,year,mode:'standard',questions:qs,
 answers:qs.map((q,i)=>({questionId:q.id,correct:ok[i],formal:true,repair:false}))});
const correctIds=new Set(questions.slice(0,8).map(q=>q.id));

test('8/10 correct questions never return when the Daily task is reopened',()=>{
 const selected=fillDailyLockedQuestions([],questions,{locked:true,mode:'standard',size:2,topicId,subject,correctIds},r=>r,(r,m,n)=>r.slice(0,n));
 assert.deepEqual(selected.map(q=>q.id),['bio-8','bio-9']);
 assert.equal(fillDailyLockedQuestions([],questions,{locked:true,mode:'standard',size:2,topicId,subject,
  correctIds:new Set(questions.map(q=>q.id))},r=>r,(r,m,n)=>r.slice(0,n)).length,0);
});

test('locked Daily uses remaining target; 8/10 resumes for exactly two questions',()=>{
 for(const path of ['assets/study._subject.practise-D_PWgUd7.js','assets/study._subject.practise-y8fix-20260920.js']){
  const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.ok(source.includes('remaining:Math.max(0,target-credited)'),path);
  assert.ok(source.includes('lockedRemainingRef.current.remaining'),path);
  assert.ok(source.includes('dailyCorrectQuestionIds(state'),path);
 }
});
test('same-day verified journal sums original 8 plus 2 newly correct answers',()=>{
 const s=makeState();
 s.formalAttemptLog=questions.map(q=>({day,questionId:q.id,correct:true,subject,year,
  dailyTaskId:taskId,topicId,mode:'standard',formal:true,repair:false}));
 const out=reconcileDailySession(s,proof(questions.slice(8),[true,true]));
 assert.equal(out.progress,10);
 assert.equal(out.daily[0].target,10);
});
test('iPad merges two sessions 8 correct then two wrong answers corrected, without double credit',async()=>{
 const db=new Map();
 globalThis.localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)};
 try {
  const first=proof(questions,[true,true,true,true,true,true,true,true,false,false]);
  const second=proof(questions.slice(8),[true,true]);
  const state=makeState();
  assert.equal(await saveCompletedDailyReceipt(state,first),true);
  assert.equal(await saveCompletedDailyReceipt(state,second),true);
  const all=JSON.parse(db.get('lux-daily-completed-sessions-safe-v1'));
  assert.equal(all.length,1);
  assert.equal(all[0].questions.length,10);
  assert.equal(all[0].answers.filter(a=>a.correct).length,10);
  const restored=reconcileCompletedDailyReceipts(state,all);
  assert.equal(restored.daily[0].progress,10);
  assert.equal(restored.daily[0].target,10);
  assert.equal(restored.dailyLog[day].tasks[0].done,true);
  assert.equal(await saveCompletedDailyReceipt(state,second),true);
  const again=JSON.parse(db.get('lux-daily-completed-sessions-safe-v1'));
  assert.equal(again[0].answers.filter(a=>a.correct).length,10);
 }finally{delete globalThis.localStorage;}
});
test('exact same-question review due on another day remains separate from Daily credit',()=>{
 const historical={formalAttemptLog:[{day:'2026-10-24',questionId:'bio-0',correct:true,subject,year,dailyTaskId:taskId}]};
 assert.equal(dailyCorrectQuestionIds(historical,{day,taskId,subject,year,topicId}).size,0);
});
