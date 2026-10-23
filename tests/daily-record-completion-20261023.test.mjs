import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasDailyCompletionReceipt, hasLiveTenTaskCompletion,
  savedRowComplete, datedDailyStatus, datedDailyLabel
} from '../assets/daily-record-completion-20261023.js';

const date='2026-10-22';
const tasks=n=>Array.from({length:10},(_,i)=>({id:'quest-'+i,target:10,progress:i<n?10:0}));
const row=(done,total=10)=>({
  date,done,total,complete:done===total,
  tasks:tasks(done).map(t=>({...t,done:t.progress===10}))
});
test('past full-day receipt wins when dated log was partially lost',()=>{
  const state={today:'2026-10-23',daily:tasks(0),
    dailyCompleteAwarded:{[date]:true},
    dailyLog:{[date]:row(2)}};
  const before=JSON.stringify(state);
  assert.equal(hasDailyCompletionReceipt(state,date),true);
  assert.equal(datedDailyStatus(state,date),'done');
  assert.equal(datedDailyLabel(state,date),'Completed · saved daily-complete receipt');
  assert.equal(JSON.stringify(state),before);
});
test('receipt rescues an absent dated log, but not unrelated days',()=>{
  const state={today:'2026-10-23',daily:tasks(0),
    dailyCompleteAwarded:{[date]:true},dailyLog:{}};
  assert.equal(datedDailyStatus(state,date),'done');
  assert.equal(datedDailyStatus(state,'2026-10-21'),'unopened');
});
test('live 10/10 is done even before rollover seals a dailyLog',()=>{
  const state={today:date,daily:tasks(10),dailyLog:{}};
  assert.equal(hasLiveTenTaskCompletion(state,date),true);
  assert.equal(datedDailyLabel(state,date),'Completed · 10/10 today');
  assert.equal(datedDailyStatus(state,'2026-10-23'),'unopened');
});
test('9/10 with no completion award stays incomplete',()=>{
  const state={today:date,daily:tasks(9),
    dailyLog:{[date]:row(9)},dailyCompleteAwarded:{}};
  assert.equal(hasLiveTenTaskCompletion(state,date),false);
  assert.equal(datedDailyStatus(state,date),'partial');
  assert.match(datedDailyLabel(state,date),/9\/10/);
});
test('historical 10/10 log is complete without a separate award',()=>{
  const state={today:'2026-10-23',daily:tasks(0),
    dailyLog:{[date]:row(10)}};
  assert.equal(savedRowComplete(state,date),true);
  assert.equal(datedDailyLabel(state,date),'Completed · 10/10');
});
test('zero-progress log never infers done merely from a page visit',()=>{
  const state={today:'2026-10-23',
    dailyLog:{[date]:row(0)},dailyCompleteAwarded:{[date]:false}};
  assert.equal(datedDailyStatus(state,date),'unopened');
  assert.equal(datedDailyLabel(state,date),'Not opened');
});
test('misjoined task snapshots do not invalidate an explicit full-day award',()=>{
  const state={today:'2026-10-23',daily:tasks(0),
    dailyCompleteAwarded:{[date]:true},dailyLog:{[date]:row(10,20)}};
  assert.equal(datedDailyStatus(state,date),'done');
  assert.match(datedDailyLabel(state,date),/saved daily-complete receipt/);
});
