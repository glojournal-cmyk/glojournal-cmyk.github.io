import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canRecover,eligibleRecoveryTasks,recordRecoveryAnswer,validDay,reconcileRecoveredTaskHistory,prepareUnopenedRecovery} from '../assets/recovery-task-ledger-20261017.js';
function fixture(){
 const tasks=[{id:'y8-practise',progress:8,target:10,done:false},{id:'latin-vocab',progress:30,target:30,done:true},{id:'play-game',progress:0,target:1,done:false}];
 return {today:'2026-10-17',xp:135,pet:{name:'Moonveil'},daily:[{id:'y8-practise',progress:3}],dailyLog:{'2026-10-16':{date:'2026-10-16',tasks,done:1,total:3,complete:false}}};
}
test('only calendar yesterday and day before yesterday are eligible',()=>{
 assert.equal(canRecover('2026-10-17','2026-10-16'),true);
 assert.equal(canRecover('2026-10-17','2026-10-15'),true);
 for(const date of ['2026-10-17','2026-10-14','2026-10-18','2026-02-30','garbage'])assert.equal(canRecover('2026-10-17',date),false);
 assert.equal(validDay('2026-02-30'),false);
});
test('missing historical assignment is not silently invented',()=>{
 assert.deepEqual(eligibleRecoveryTasks(fixture(),'2026-10-15','2026-10-17'),[]);
});
test('practice recovery needs two distinct correct question IDs',()=>{
 let s=fixture(),r;
 r=recordRecoveryAnswer(s,{today:'2026-10-17',date:'2026-10-16',taskId:'y8-practise',questionId:'a',correct:false});s=r.state;
 assert.equal(r.completed,false);
 r=recordRecoveryAnswer(s,{today:'2026-10-17',date:'2026-10-16',taskId:'y8-practise',questionId:'a',correct:true});s=r.state;
 assert.equal(r.completed,false);
 r=recordRecoveryAnswer(s,{today:'2026-10-17',date:'2026-10-16',taskId:'y8-practise',questionId:'a',correct:true});s=r.state;
 assert.equal(r.completed,false);
 r=recordRecoveryAnswer(s,{today:'2026-10-17',date:'2026-10-16',taskId:'y8-practise',questionId:'b',correct:true});s=r.state;
 assert.equal(r.completed,true);assert.equal(s.dailyLog['2026-10-16'].done,2);
 assert.equal(s.dailyLog['2026-10-16'].complete,false);
 assert.equal(s.daily[0].progress,3);
 assert.equal(s.xp,135);assert.equal(s.pet.name,'Moonveil');
 const replay=recordRecoveryAnswer(s,{today:'2026-10-17',date:'2026-10-16',taskId:'y8-practise',questionId:'c',correct:true});
 assert.equal(replay.accepted,false);assert.equal(replay.newlyCompleted,undefined);
});
test('expired date, unknown assignment or wrong task never changes record',()=>{
 const s=fixture();
 for(const input of [{date:'2026-10-14',taskId:'y8-practise'},{date:'2026-10-15',taskId:'y8-practise'},{date:'2026-10-16',taskId:'fictional'}]){
  const r=recordRecoveryAnswer(s,{today:'2026-10-17',questionId:'x',correct:true,...input});
  assert.equal(r.accepted,false);assert.equal(r.state,s);
 }
});

test('runtime wires matching practice answers into recovery and leaves XP untouched',()=>{
 const source=fs.readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
 assert.match(source,/taskId===evidenceTask/);
 assert.match(source,/canRecover\(todayKey\(\),date\)/);
 assert.match(source,/subjectMatches && topicMatches/);
 assert.match(source,/if\(outcome.accepted\)store.setState/);
});

test('proof repairs the 30-day view without modifying persisted original',()=>{
 const s=fixture();
 s.recoveryTaskByDay={'2026-10-16':{'y8-practise':{completed:true}}};
 const snapshot=JSON.stringify(s.dailyLog);
 const log=reconcileRecoveredTaskHistory(s,s.dailyLog);
 assert.equal(log['2026-10-16'].done,2);
 assert.equal(log['2026-10-16'].total,3);
 assert.equal(log['2026-10-16'].complete,false);
 assert.equal(JSON.stringify(s.dailyLog),snapshot);
});
test('incomplete proof and absent historical row cannot be marked done',()=>{
 const s=fixture();
 s.recoveryTaskByDay={'2026-10-16':{'y8-practise':{completed:false}},'2026-10-15':{'y8-practise':{completed:true}}};
 const log=reconcileRecoveredTaskHistory(s,s.dailyLog);
 assert.equal(log['2026-10-16'].done,1);
 assert.equal(log['2026-10-15'],undefined);
});
test('date-scoped correction route does not credit current-day corrections',()=>{
 const source=fs.readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
 assert.match(source,/!inRecovery && typeof window[^\n]+get\("task"\) === "mistake-review"/);
 assert.match(source,/dailyCurriculumEvidenceByDay=inRecovery \?/);
 assert.match(source,/!isRepair && !inRecovery/);
 assert.match(source,/reconcileRecoveredTaskHistory\(state, reconcileRecoveredVocabHistory/);
});

test('unopened date creates ten isolated, unfinished fallback tasks',()=>{
 const original=fixture(),today=JSON.stringify(original.daily);
 const result=prepareUnopenedRecovery(original,'2026-10-15','2026-10-17');
 assert.equal(result.created,true);
 const row=result.state.dailyLog['2026-10-15'];
 assert.equal(row.total,10);assert.equal(row.done,0);
 assert.equal(row.complete,false);assert.equal(row.recoveryFallback,true);
 assert.ok(row.tasks.every(t=>t.recoveryFallback && !t.done));
 assert.equal(JSON.stringify(result.state.daily),today);
 assert.equal(original.dailyLog['2026-10-15'],undefined);
});
test('fallback never overwrites existing history or expired days',()=>{
 const initial=fixture();
 const existing=prepareUnopenedRecovery(initial,'2026-10-16','2026-10-17');
 assert.equal(existing.created,false);assert.equal(existing.state,initial);
 const expired=prepareUnopenedRecovery(initial,'2026-10-14','2026-10-17');
 assert.equal(expired.created,false);assert.equal(expired.state,initial);
});
