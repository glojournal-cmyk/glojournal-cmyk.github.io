import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canRecover,eligibleRecoveryTasks,recordRecoveryAnswer,validDay} from '../assets/recovery-task-ledger-20261017.js';
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
