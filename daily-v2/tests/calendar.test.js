import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isValidDailyV2Day} from '../src/calendar.js';
import {planDailyV2} from '../src/planner.js';
import {makeDailyV2Ledger,projectSavedDailyV2Attempt} from '../src/ledger.js';
import {commitDailyV2Answer,commitDailyV2Plan,createMemoryDailyV2Repository} from '../src/storage.js';
import {createIndexedDbDailyV2Repository} from '../src/indexeddb-repository.js';

test('strict calendar accepts actual leap day and ordinary dates',()=>{
 for(const day of ['2024-02-29','2026-10-30','2026-12-31','2000-02-29'])
  assert.equal(isValidDailyV2Day(day),true,day);
});
test('strict calendar rejects Date.parse rollover, non-leap dates and malformed keys',()=>{
 for(const day of ['2026-02-29','2026-02-30','2026-04-31','2026-13-01',
  '2026-00-01','2026-01-00','2026-01-32','2026-2-3','2026-10-30T00:00:00Z',
  'not-a-day','',null,undefined,1234])
  assert.equal(isValidDailyV2Day(day),false,String(day));
});
test('planner refuses a fake calendar day before any assignment',()=>{
 for(const day of ['2026-02-30','2026-04-31'])
  assert.throws(()=>planDailyV2({day,questionBank:[]}),/invalid plan date/);
});
test('ledger refuses to create an impossible day or append an event from another date',()=>{
 assert.throws(()=>makeDailyV2Ledger('2026-02-30'),/real YYYY-MM-DD/);
 const ledger=makeDailyV2Ledger('2026-10-30');
 assert.throws(()=>projectSavedDailyV2Attempt(ledger,{
  eventId:'fake',day:'2026-02-30',taskId:'french-vocab',questionId:'fake',correct:true
 }),/event date/);
});
test('storage refuses an impossible plan date before writing any snapshot',async()=>{
 const repo=createMemoryDailyV2Repository();
 await assert.rejects(()=>commitDailyV2Plan(repo,{
  version:2,day:'2026-02-30',status:'ready',target:163,tasks:[]
 }),/fully verified/);
 assert.equal(repo.readOnlySnapshot('2026-02-30'),null);
 await assert.rejects(()=>commitDailyV2Answer(repo,{day:'2026-02-30',taskId:'latin-vocab'}),
  /invalid date/);
});
test('IndexedDB backend rejects an impossible read date before opening browser storage',async()=>{
 let opens=0;
 const repo=createIndexedDbDailyV2Repository({indexedDBFactory:{open(){opens++;throw Error('should not open');}}});
 await assert.rejects(()=>repo.read('2026-02-30'),/invalid day/);
 assert.equal(opens,0);
 await assert.rejects(()=>repo.compareAndSwap('2026-02-30',0,{
  day:'2026-02-30',revision:1,ledger:{version:2}
 }),/invalid day/);
 assert.equal(opens,0);
});
