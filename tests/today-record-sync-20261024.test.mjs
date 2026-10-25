import test from 'node:test';
import assert from 'node:assert/strict';
import {syncTodayFromDatedRecord} from '../assets/today-record-sync-20261024.js';
const day='2026-10-24';
const make=(i)=>({id:`task-${i}`,title:`Task ${i}`,target:10,progress:0,planDate:day,
  assignedSubject:'latin',assignedTopic:`latin-t${i}`,
  href:`/study/latin/practise?daily=1&task=task-${i}&topic=latin-t${i}&mode=standard`});
const live=()=>Array.from({length:10},(_,i)=>make(i));
const row=(tasks)=>({date:day,done:tasks.filter(t=>t.progress>=t.target).length,total:10,tasks});

test('three verified saved tasks in 30 Days appear on Home',()=>{
  const tasks=live(),logged=tasks.map((t,i)=>({...t,progress:i<3?10:0}));
  const result=syncTodayFromDatedRecord(tasks,row(logged),day);
  assert.equal(result.filter(t=>t.progress===10).length,3);
  assert.equal(syncTodayFromDatedRecord(result,row(logged),day),result,'idempotent');
  assert.deepEqual(tasks.map(t=>t.progress),Array(10).fill(0),'no mutation');
});
test('same date, task assignment, mode and target required',()=>{
  const tasks=live(),logged=tasks.map(t=>({...t,progress:10}));
  logged[0].assignedTopic='other-topic';logged[1].target=20;
  logged[2].href='/study/latin/practise?task=task-2&topic=latin-t2&mode=mastery';
  const result=syncTodayFromDatedRecord(tasks,row(logged),day);
  assert.equal(result.slice(0,3).filter(t=>t.progress>0).length,0);
  assert.equal(syncTodayFromDatedRecord(tasks,{...row(logged),date:'2026-10-23'},day),tasks);
  assert.equal(syncTodayFromDatedRecord(tasks,row(logged),'2026-10-23'),tasks);
});
test('verified correct-only tally never regresses to attempt-based tally',()=>{
  const tasks=live(),logged=live();
  tasks[3]={...tasks[3],progress:1,correctOnlyEvidence:true};
  logged[3].progress=2;
  assert.equal(syncTodayFromDatedRecord(tasks,row(logged),day)[3].progress,1);
  logged[3].correctOnlyEvidence=true;
  assert.equal(syncTodayFromDatedRecord(tasks,row(logged),day)[3].progress,2);
});
test('no progress is manufactured from an incomplete 30-day snapshot',()=>{
  const tasks=live(),logged=live();logged[0].progress=10;
  assert.equal(syncTodayFromDatedRecord(tasks,row(logged.slice(1)),day),tasks);
  const result=syncTodayFromDatedRecord(tasks,row(logged),day);
  assert.equal(result[0].progress,10);
  assert.equal(result[0].done,true,'a verified 10/10 task must be complete on Home');
  assert.deepEqual(Object.keys(result[0]).filter(k=>k!=='done'),Object.keys(tasks[0]));
});
