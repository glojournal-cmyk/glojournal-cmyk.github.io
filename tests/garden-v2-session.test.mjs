import test from 'node:test';
import assert from 'node:assert/strict';
import {planGardenV2Day,V2_DAILY_QUOTAS} from '../src/garden-v2/daily-planner.mjs';
import {startV2Session,answerV2Session,readV2Session} from '../src/garden-v2/session.mjs';
const tasks=()=>V2_DAILY_QUOTAS.map((target,i)=>({id:'task-'+i,target,candidates:Array.from({length:target},(_,j)=>({id:'item-'+i+'-'+j,prompt:'unique '+i+' '+j,format:'typed_exact'}))}));
test('allocated questions persist after serialization without replacing task progress',()=>{
 const plan=planGardenV2Day(tasks());
 let {ledger}=startV2Session(plan,'task-0');
 const first=plan.rows[0].questionIds[0],second=plan.rows[0].questionIds[1];
 let r=answerV2Session(ledger,{taskId:'task-0',questionId:first,correct:true,awardXp:5},30);
 assert.equal(r.newCredit,1);assert.equal(r.newXp,5);
 ledger=JSON.parse(JSON.stringify(r.ledger));
 const reopened=startV2Session(plan,'task-0',ledger);
 assert.equal(reopened.task.completedIds.length,1);
 assert.equal(reopened.task.outstandingIds.length,29);
 r=answerV2Session(reopened.ledger,{taskId:'task-0',questionId:first,correct:true,awardXp:50},30);
 assert.equal(r.newCredit,0);assert.equal(r.newXp,0);
 r=answerV2Session(r.ledger,{taskId:'task-0',questionId:second,correct:false},30);
 assert.equal(r.task.completedIds.length,1);
 assert.ok(r.task.outstandingIds.includes(second));
 r=answerV2Session(r.ledger,{taskId:'task-0',questionId:second,correct:true,awardXp:5},30);
 assert.equal(r.task.completedIds.length,2);
 assert.equal(r.task.xp,10);
});
test('reject unallocated attempts and silent replacement of partially completed plan',()=>{
 const plan=planGardenV2Day(tasks());
 const {ledger}=startV2Session(plan,'task-0');
 assert.throws(()=>answerV2Session(ledger,{taskId:'task-0',questionId:'unassigned',correct:true},30),/not part/);
 const altered=structuredClone(plan);
 altered.rows[0].questionIds.reverse();
 assert.throws(()=>startV2Session(altered,'task-0',ledger),/migration required/);
 assert.equal(readV2Session(ledger,'task-0',30).credited,0);
});
test('shortage never appears as completion even after all assignable questions correct',()=>{
 const taskPools=tasks(),credited=taskPools[0].candidates.slice(0,8).map(q=>q.id);
 const plan=planGardenV2Day(taskPools,{previouslyCreditedIds:credited});
 let {ledger}=startV2Session(plan,'task-0');
 for(const id of plan.rows[0].questionIds)
  ledger=answerV2Session(ledger,{taskId:'task-0',questionId:id,correct:true},30).ledger;
 const state=readV2Session(ledger,'task-0',30);
 assert.equal(state.credited,22);assert.equal(state.unallocated,8);
 assert.equal(state.complete,false);
});
