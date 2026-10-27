import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyV2Ledger,recordV2Answer} from '../src/garden-v2/scoring-ledger.mjs';
import {V2_STORAGE_KEY,loadV2Snapshot,saveV2Snapshot,saveV2SnapshotIfUnchanged} from '../src/garden-v2/storage.mjs';
const makeStorage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('save and reload V2 receipts, not the current app key',()=>{
 const storage=makeStorage();const ledger=recordV2Answer(emptyV2Ledger(),{
  taskId:'biology',questionId:'q-1',correct:true,awardXp:10
 }).ledger;
 assert.equal(saveV2Snapshot(storage,ledger).ok,true);
 assert.deepEqual(loadV2Snapshot(storage).snapshot,ledger);
 assert.notEqual(V2_STORAGE_KEY,'lux-scholar-garden-v1');
});
test('quota error preserves previous verified snapshot and reports failure',()=>{
 const storage=makeStorage(),old=emptyV2Ledger();
 assert.equal(saveV2Snapshot(storage,old).ok,true);
 storage.setItem=()=>{const e=new Error('quota');e.name='QuotaExceededError';throw e;};
 const newer=recordV2Answer(old,{taskId:'bio',questionId:'q2',correct:true}).ledger;
 const status=saveV2Snapshot(storage,newer);
 assert.equal(status.ok,false);assert.equal(status.reason,'quota_exceeded');
 assert.deepEqual(loadV2Snapshot(storage).snapshot,old);
});
test('readback mismatch cannot be falsely acknowledged as durable save',()=>{
 const storage={getItem:()=>null,setItem:()=>{}};
 assert.equal(saveV2Snapshot(storage,emptyV2Ledger()).reason,'readback_mismatch');
});
test('invalid stored ledger is never overwritten by a new snapshot',()=>{
 const storage=makeStorage();storage.setItem(V2_STORAGE_KEY,'{"version":99}');
 const result=saveV2Snapshot(storage,emptyV2Ledger());
 assert.equal(result.ok,false);assert.equal(result.reason,'storage_failure');
 assert.equal(storage.getItem(V2_STORAGE_KEY),'{"version":99}');
 assert.equal(loadV2Snapshot(storage).ok,false);
});

test('stale V2 tab cannot erase newer verified progress',()=>{
 const storage=makeStorage(),base=emptyV2Ledger();
 assert.equal(saveV2Snapshot(storage,base).ok,true);
 const staleRaw=storage.getItem(V2_STORAGE_KEY);
 const newer=recordV2Answer(base,{taskId:'biology',questionId:'a',correct:true,awardXp:10}).ledger;
 assert.equal(saveV2SnapshotIfUnchanged(storage,newer,staleRaw).ok,true);
 const winningRaw=storage.getItem(V2_STORAGE_KEY);
 const stale=recordV2Answer(base,{taskId:'biology',questionId:'b',correct:true,awardXp:10}).ledger;
 const rejected=saveV2SnapshotIfUnchanged(storage,stale,staleRaw);
 assert.deepEqual(rejected,{ok:false,reason:'stale_snapshot'});
 assert.equal(storage.getItem(V2_STORAGE_KEY),winningRaw);
 assert.deepEqual(loadV2Snapshot(storage).snapshot,newer);
});
test('first guarded save requires empty storage, not an unknown existing history',()=>{
 const storage=makeStorage(),initial=emptyV2Ledger();
 assert.equal(saveV2SnapshotIfUnchanged(storage,initial,null).ok,true);
 assert.equal(saveV2SnapshotIfUnchanged(storage,initial,null).reason,'stale_snapshot');
});
