import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyV2Ledger,recordV2Answer,summarizeV2Task} from '../src/garden-v2/scoring-ledger.mjs';
const submit=(ledger,data)=>recordV2Answer(ledger,{taskId:'bio-mastery',questionId:'q1',correct:true,awardXp:5,...data});

test('first correct credits once; replay after JSON reload credits zero XP and zero questions',()=>{
 const first=submit(emptyV2Ledger(),{});
 assert.equal(first.newCredit,1);assert.equal(first.newXp,5);
 const reloaded=JSON.parse(JSON.stringify(first.ledger));
 const again=submit(reloaded,{awardXp:50});
 assert.equal(again.newCredit,0);assert.equal(again.newXp,0);
 assert.deepEqual(summarizeV2Task(again.ledger,'bio-mastery',20),{
  taskId:'bio-mastery',target:20,credited:1,remaining:19,complete:false,earnedMarks:1,xp:5
 });
});
test('wrong retry then right answer awards only successful credit',()=>{
 const wrong=submit(emptyV2Ledger(),{correct:false,earnedMarks:0});
 assert.equal(wrong.newCredit,0);assert.equal(wrong.newXp,0);
 const right=submit(wrong.ledger,{});
 assert.equal(right.newCredit,1);assert.equal(right.newXp,5);
 const replay=submit(right.ledger,{correct:false,earnedMarks:0});
 assert.equal(replay.ledger.tasks['bio-mastery'].earnedMarks,1);
});
test('two answers on same question never satisfy two-question task quota',()=>{
 let s=emptyV2Ledger();s=submit(s,{}).ledger;s=submit(s,{}).ledger;
 assert.equal(summarizeV2Task(s,'bio-mastery',2).credited,1);
 s=submit(s,{questionId:'q2'}).ledger;
 assert.equal(summarizeV2Task(s,'bio-mastery',2).complete,true);
});
test('multiple task ledgers remain isolated',()=>{
 let s=submit(emptyV2Ledger(),{}).ledger;
 s=submit(s,{taskId:'latin-mastery'}).ledger;
 assert.equal(summarizeV2Task(s,'bio-mastery',2).credited,1);
 assert.equal(summarizeV2Task(s,'latin-mastery',2).credited,1);
});
test('partial marks are monotonic and do not imply fully correct completion',()=>{
 let s=submit(emptyV2Ledger(),{correct:false,maxMarks:3,earnedMarks:1}).ledger;
 let r=submit(s,{correct:false,maxMarks:3,earnedMarks:2});
 assert.equal(r.newCredit,1);assert.equal(r.ledger.tasks['bio-mastery'].earnedMarks,2);
 assert.equal(summarizeV2Task(r.ledger,'bio-mastery',1).complete,false);
 r=submit(r.ledger,{correct:true,maxMarks:3,earnedMarks:3});
 assert.equal(r.newCredit,1);assert.equal(r.newXp,5);
 assert.equal(summarizeV2Task(r.ledger,'bio-mastery',1).complete,true);
});
test('do not mutate caller snapshot or existing history',()=>{
 const original=emptyV2Ledger();const snapshot=JSON.stringify(original);
 submit(original,{});
 assert.equal(JSON.stringify(original),snapshot);
});
test('reject invalid receipts and changing established mark schemes',()=>{
 assert.throws(()=>submit(emptyV2Ledger(),{questionId:''}),/Invalid/);
 assert.throws(()=>submit(emptyV2Ledger(),{awardXp:-3}),/Invalid/);
 const s=submit(emptyV2Ledger(),{}).ledger;
 assert.throws(()=>submit(s,{maxMarks:2,earnedMarks:2}),/maximum marks/);
});
