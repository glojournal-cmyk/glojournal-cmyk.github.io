import test from 'node:test';
import assert from 'node:assert/strict';
import {CORE_DAILY_TASK_IDS,dailyHistorySummary} from '../assets/daily-history-display-20261030.js';
const task=(id,done)=>({id,target:10,progress:done?10:0,done});
const extras=['study-session','year8-long-review','tend-garden','play-game'];
const record=(coreDone=10,extraDone=4)=>({
 date:'2026-10-26',
 tasks:[...CORE_DAILY_TASK_IDS.map((id,i)=>task(id,i<coreDone)),
   ...extras.map((id,i)=>task(id,i<extraDone))],
 done:coreDone+extraDone,total:14,complete:coreDone+extraDone===14
});
test('26 October 14/14 displays 10/10 while preserving all fourteen saved rows',()=>{
 const saved=record(), before=JSON.stringify(saved);
 assert.deepEqual(dailyHistorySummary(saved,'2026-10-26'),{
   total:10,done:10,extraSavedRecords:4,canonicalOnly:true,includesOldTasks:false
 });
 assert.equal(JSON.stringify(saved),before);
 assert.equal(saved.tasks.length,14);
});
test('extra finished old tasks do not falsely satisfy missing core tasks',()=>{
 const saved=record(6,4), result=dailyHistorySummary(saved,'2026-10-28');
 assert.equal(saved.done,10);assert.equal(saved.total,14);
 assert.equal(result.done,6);assert.equal(result.total,10);
});
test('original ten-task dates remain unchanged',()=>{
 const saved={date:'2026-10-27',tasks:CORE_DAILY_TASK_IDS.map(id=>task(id,true)),
 done:10,total:10,complete:true};
 const result=dailyHistorySummary(saved,'2026-10-27');
 assert.equal(result.done,10);assert.equal(result.total,10);
 assert.equal(result.extraSavedRecords,0);assert.equal(result.canonicalOnly,false);
});
test('an ambiguous 14-row record does not invent canonical completion',()=>{
 const saved=record(10,4);saved.tasks=saved.tasks.filter(t=>t.id!=='year9-light');
 saved.tasks.push(task('other-old-id',true));
 const result=dailyHistorySummary(saved,'2026-10-26');
 assert.equal(result.canonicalOnly,false);assert.equal(result.total,14);
 assert.equal(result.includesOldTasks,true);
});
test('old historic plan is not silently rewritten as the current planner',()=>{
 const saved=record(10,4);
 const result=dailyHistorySummary(saved,'2026-10-18');
 assert.equal(result.total,14);assert.equal(result.canonicalOnly,false);
});

test('legitimate newer Mastery top-up is NOT hidden as an old rescued task',()=>{
 const date='2026-10-29',core=CORE_DAILY_TASK_IDS.map(id=>task(id,true));
 const row={date,tasks:[...core,task('y8-mastery-topup-a',false)],
   total:11,done:10,complete:false};
 const summary=dailyHistorySummary(row,date);
 assert.equal(summary.canonicalOnly,false);
 assert.equal(summary.total,11);
 assert.equal(summary.done,10);
 assert.equal(summary.includesOldTasks,false);
});
