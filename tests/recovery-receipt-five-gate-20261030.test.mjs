import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saveRecoveryReceipt,applyRecoveryReceipts} from '../assets/recovery-receipt-20261018.js';

// No real student data used. Module reads a synthetic localStorage receipt.
class MemoryStorage {
 #rows=new Map();
 getItem(k){return this.#rows.get(k)??null;}
 setItem(k,v){this.#rows.set(k,String(v));}
 removeItem(k){this.#rows.delete(k);}
}
const date='2026-10-29',taskId='french-vocab';
const row=(progress=0,done=false)=>({[date]:{date,done:done?1:0,total:10,
 complete:false,tasks:[{id:taskId,target:30,progress,done},
 ...Array.from({length:9},(_,i)=>({id:'other-'+i,target:1,progress:0,done:false}))]}});
function proof(count,completed=false,withDuplicate=false){
 const items=Object.fromEntries(Array.from({length:count},(_,i)=>['q'+i,true]));
 const conceptByQuestion=Object.fromEntries(Array.from({length:count},(_,i)=>[
  'q'+i,withDuplicate&&i===count-1?'concept-0':'concept-'+i]));
 return {[date]:{french:{originalCount:0,totalNeeded:35,
  items,conceptByQuestion,completed}}};
}
const reset=()=>{globalThis.localStorage=new MemoryStorage();};
test('30/35 correct on recovery restart cannot become a completed 30/30 Daily task',()=>{
 reset();
 assert.equal(saveRecoveryReceipt({date,taskId,subject:'french',
  questionIds:Array.from({length:30},(_,i)=>'q'+i),baseline:0}),true);
 const result=applyRecoveryReceipts(row(),proof(30,false));
 const task=result[date].tasks[0];
 assert.ok(task.progress<task.target);
 assert.equal(task.done,false);
 assert.equal(result[date].complete,false);
});
test('35/35 independently saved Recovery proof can repair a previously interrupted Daily completion',()=>{
 reset();
 saveRecoveryReceipt({date,taskId,subject:'french',questionIds:['q34'],baseline:0});
 const result=applyRecoveryReceipts(row(),proof(35,true));
 const task=result[date].tasks[0];
 assert.equal(task.progress,30);
 assert.equal(task.done,true);
 assert.equal(task.recoveredFromReceipt,true);
});
test('legacy unverified receipts without per-day proof cannot falsely complete Recovery',()=>{
 reset();
 saveRecoveryReceipt({date,taskId,subject:'french',
  questionIds:Array.from({length:35},(_,i)=>'q'+i),baseline:0});
 const original=row();
 const result=applyRecoveryReceipts(original);
 assert.deepEqual(result,original);
});
test('duplicate concepts cannot satisfy the 35 correct threshold by receipt replay',()=>{
 reset();
 saveRecoveryReceipt({date,taskId,subject:'french',
  questionIds:Array.from({length:35},(_,i)=>'q'+i),baseline:0});
 const result=applyRecoveryReceipts(row(),proof(35,false,true));
 assert.equal(result[date].tasks[0].done,false);
 assert.ok(result[date].tasks[0].progress<30);
});
test('a partially persisted stale 30/30 progress without completion flag is corrected safely',()=>{
 reset();
 saveRecoveryReceipt({date,taskId,subject:'french',questionIds:['q0'],baseline:0});
 const result=applyRecoveryReceipts(row(30,false),proof(30,false));
 assert.equal(result[date].tasks[0].progress,29);
 assert.equal(result[date].tasks[0].done,false);
});
test('previously completed old-format Recovery is not revoked by upgrading receipt rules',()=>{
 reset();
 saveRecoveryReceipt({date,taskId,subject:'french',questionIds:['q0'],baseline:0});
 const existing=row(30,true);
 assert.deepEqual(applyRecoveryReceipts(existing,proof(1,false)),existing);
});
test('other Recovery receipts keep legacy task behavior without Vocab-only gate',()=>{
 reset();
 saveRecoveryReceipt({date,taskId:'play-game',questionIds:['played'],baseline:0});
 const original=row();
 original[date].tasks[1]={id:'play-game',target:1,progress:0,done:false};
 const result=applyRecoveryReceipts(original);
 assert.equal(result[date].tasks[1].done,true);
});

test('incomplete 30/35 receipt clears misleading recovered badges without withdrawing genuine task completion',()=>{
 reset();
 saveRecoveryReceipt({date,taskId,subject:'french',questionIds:['q0'],baseline:0});
 const stale=row(30,false);
 stale[date].tasks[0]={...stale[date].tasks[0],recovered:true,recoveredFromReceipt:true};
 const corrected=applyRecoveryReceipts(stale,proof(30,false));
 const task=corrected[date].tasks[0];
 assert.equal(task.progress,29);
 assert.equal(task.done,false);
 assert.equal(Object.hasOwn(task,'recovered'),false);
 assert.equal(Object.hasOwn(task,'recoveredFromReceipt'),false);
 assert.equal(corrected[date].done,0);
 const completed=row(30,true);
 completed[date].tasks[0].recovered=true;
 assert.deepEqual(applyRecoveryReceipts(completed,proof(30,false)),completed,
  'already-completed historical tasks remain untouched');
});
test('stale recovered marker is removed even when no new progress can be computed',()=>{
 reset();
 saveRecoveryReceipt({date,taskId,subject:'french',questionIds:['q0'],baseline:0});
 const stale=row(29,false);
 stale[date].tasks[0].recovered=true;
 const corrected=applyRecoveryReceipts(stale,proof(0,false));
 assert.equal(corrected[date].tasks[0].progress,29);
 assert.equal(corrected[date].tasks[0].done,false);
 assert.equal(Object.hasOwn(corrected[date].tasks[0],'recovered'),false);
});
