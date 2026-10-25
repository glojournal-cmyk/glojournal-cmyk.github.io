import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {saveCompletedDailyReceipt,reconcileCompletedDailyReceipts} from '../assets/daily-completed-session-receipts-20261024.js';

const day='2026-10-25';
const topic='bio-y9-cell-structure';
const task=()=>({
  id:'year9-light',title:'Biology Daily',planDate:day,
  assignedSubject:'biology',assignedTopic:topic,assignedYear:9,
  href:'/study/biology/practise?daily=1&locked=1&year=9&mode=standard&task=year9-light&topic='+topic,
  target:15,progress:1
});
const state=()=>({today:day,
  daily:[task(),...Array.from({length:9},(_,i)=>({
    id:'other-'+i,planDate:day,target:1,progress:0
  }))],
  dailyLog:{[day]:{date:day,tasks:[task()],total:1,done:0}}
});
const questions=(n=10)=>Array.from({length:n},(_,i)=>({
  id:'bio-'+i,formal:true,topicId:i%2===0?topic:'bio-y9-stale-metadata'
}));
const answers=(qs,n=qs.length)=>qs.slice(0,n).map(q=>({
  questionId:q.id,correct:true,formal:true,repair:false
}));
const receipt=(qs=questions(),as=answers(qs))=>({
  day,taskId:'year9-light',subject:'biology',year:9,mode:'standard',
  questions:qs,answers:as
});

test('Biology Year 9 locked 15-question task serves the assigned target, not standard 10',()=>{
  const code=readFileSync(new URL('../assets/study._subject.practise-D_PWgUd7.js',import.meta.url),'utf8');
  assert.match(code,/dailyLocked&&assignment\?\.target&&String\(assignment\?\.href\|\|``\)\.includes/);
  assert.match(code,/Math\.max\(1,Math\.min\(30,Number\(assignment\.target\)\|\|10\)\)/);
});
test('10 correct marked answers count 10/15, even with old Biology topic metadata',()=>{
  const s=state(),q=questions(),a=answers(q);
  const result=reconcileDailySession(s,receipt(q,a));
  assert.equal(result.changed,true);
  assert.equal(result.target,15);
  assert.equal(result.progress,10);
  assert.equal(result.daily[0].progress,10);
  assert.equal(result.dailyLog[day].tasks[0].progress,10);
  assert.equal(result.dailyLog[day].tasks[0].done,false);
});
test('15 correct answers yield 15/15, wrong answers do not earn Home credit',()=>{
  const q=questions(15);
  assert.equal(reconcileDailySession(state(),receipt(q,answers(q))).progress,15);
  const a=answers(q);a[2].correct=false;
  assert.equal(reconcileDailySession(state(),receipt(q,a)).progress,14);
});
test('No credit without matching locked date, subject, year and task link',()=>{
  const q=questions(),r=receipt(q,answers(q));
  assert.equal(reconcileDailySession(state(),{...r,subject:'chemistry'}).changed,false);
  assert.equal(reconcileDailySession(state(),{...r,day:'2026-10-24'}).changed,false);
  assert.equal(reconcileDailySession(state(),{...r,year:8}).changed,false);
  assert.equal(reconcileDailySession(state(),{...r,mode:'mastery'}).changed,false);
});
test('iPad receipt vault saves a finished 10-question quiz as PARTIAL 10/15 evidence',async()=>{
  const data=new Map();
  globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  try{
    const s=state(),r=receipt();
    assert.equal(await saveCompletedDailyReceipt(s,r),true);
    const saved=JSON.parse(data.get('lux-daily-completed-sessions-safe-v1'));
    assert.equal(saved.length,1);
    assert.equal(saved[0].answers.length,10);
    const repaired=reconcileCompletedDailyReceipts(s,saved);
    assert.equal(repaired.daily[0].progress,10);
    assert.equal(repaired.daily[0].target,15);
  }finally{delete globalThis.localStorage;}
});
