import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createIndexedDbDailyV2Repository} from '../src/indexeddb-repository.js';
import {makeDailyV2Ledger} from '../src/ledger.js';
import {commitDailyV2Plan,commitDailyV2Answer} from '../src/storage.js';
import {DAILY_V2_TASKS} from '../src/planner.js';

/* Behavioral IndexedDB transaction fake for contract tests only.
 * This does not emulate Safari's quota/termination lifecycle.
 */
function fakeIndexedDB(){
 const stored=new Map();
 let openError=false,blocked=false,failTransactions=false,ghostWrite=false;
 const requestCompletion=r=>Promise.resolve().then(()=>r());
 const factory={
  open(name,version){
   if(openError)throw Error('SecurityError');
   const request={result:null,error:null};
   requestCompletion(()=>{
    if(blocked){request.onblocked?.();return;}
    const db={
     objectStoreNames:{contains:()=>true},
     createObjectStore(){},
     close(){},
     transaction(_store,mode){
      if(failTransactions)throw Error('QuotaExceededError');
      let aborted=false;
      const tx={
       error:null,
       abort(){aborted=true;requestCompletion(()=>tx.onabort?.());},
       objectStore(){
        return {
         get(key){
          const r={result:null,error:null};
          requestCompletion(()=>{
           if(aborted)return;
           r.result=stored.has(name+'|'+key)?structuredClone(stored.get(name+'|'+key)):undefined;
           r.onsuccess?.();
           requestCompletion(()=>{if(!aborted)tx.oncomplete?.();});
          });
          return r;
         },
         put(snapshot,key){
          if(mode!=='readwrite')throw Error('ReadonlyError');
          if(!ghostWrite)stored.set(name+'|'+key,structuredClone(snapshot));
         }
        };
       }
      };
      return tx;
     }
    };
    request.result=db;request.onsuccess?.();
   });
   return request;
  }
 };
 return {factory,stored,setOpenError:v=>openError=v,setBlocked:v=>blocked=v,
   setFailTransactions:v=>failTransactions=v,setGhostWrite:v=>ghostWrite=v};
}
function dailyPlan(){
 return {version:2,day:'2026-10-26',status:'ready',target:163,
  tasks:DAILY_V2_TASKS.map(t=>({...t,questions:Array.from({length:t.target},(_,i)=>({
   questionId:t.id+'-'+i,conceptId:t.kind==='vocab'?t.id+'-concept-'+i:null}))}))};
}
test('unavailable IndexedDB explicitly fails rather than falling back to volatile memory',()=>{
 assert.throws(()=>createIndexedDbDailyV2Repository({indexedDBFactory:null}),/unavailable/);
});
test('only isolated v2 IndexedDB names are accepted',()=>{
 assert.throws(()=>createIndexedDbDailyV2Repository({indexedDBFactory:fakeIndexedDB().factory,databaseName:'scholar-garden-legacy'}),/isolated/);
});
test('empty browser repository reads null',async()=>{
 const db=fakeIndexedDB();const r=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 assert.equal(await r.read('2026-10-26'),null);
});
test('atomic revision check writes one row and rejects stale compareAndSwap',async()=>{
 const db=fakeIndexedDB(),repo=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 const snapshot={revision:1,day:'2026-10-26',ledger:makeDailyV2Ledger('2026-10-26'),plan:null};
 assert.equal(await repo.compareAndSwap('2026-10-26',0,snapshot),true);
 assert.equal((await repo.read('2026-10-26')).revision,1);
 assert.equal(await repo.compareAndSwap('2026-10-26',0,snapshot),false);
});
test('record survives closing each IndexedDB connection and reopening repository',async()=>{
 const db=fakeIndexedDB(),r=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 const snapshot={revision:1,day:'2026-10-26',ledger:makeDailyV2Ledger('2026-10-26'),plan:null};
 await r.compareAndSwap('2026-10-26',0,snapshot);
 const reopened=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 assert.deepEqual(await reopened.read('2026-10-26'),snapshot);
});
test('schema rejects mismatched day or unexpected revision',async()=>{
 const r=createIndexedDbDailyV2Repository({indexedDBFactory:fakeIndexedDB().factory});
 await assert.rejects(()=>r.compareAndSwap('2026-10-26',0,{day:'2026-10-26',revision:9,ledger:makeDailyV2Ledger('2026-10-26')}),/mismatched snapshot/);
});
test('IndexedDB opening failure is surfaced',async()=>{
 const db=fakeIndexedDB();db.setOpenError(true);
 const r=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 await assert.rejects(()=>r.read('2026-10-26'),/OPEN_FAILED/);
});
test('browser older-tab blocking is surfaced',async()=>{
 const db=fakeIndexedDB();db.setBlocked(true);
 const r=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 await assert.rejects(()=>r.read('2026-10-26'),/OPEN_BLOCKED/);
});
test('quota-like transaction error is surfaced',async()=>{
 const db=fakeIndexedDB();db.setFailTransactions(true);
 const r=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 await assert.rejects(()=>r.read('2026-10-26'),/TRANSACTION_START_FAILED/);
});
test('existing save API can freeze 10-task plan through isolated IndexedDB backend',async()=>{
 const db=fakeIndexedDB(),repo=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 const plan=dailyPlan();const receipt=await commitDailyV2Plan(repo,plan);
 assert.equal(receipt.revision,1);
 assert.deepEqual((await repo.read(plan.day)).plan,plan);
});
test('answer receipts roundtrip via actual IndexedDB adapter contract',async()=>{
 const db=fakeIndexedDB(),repo=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 const plan=dailyPlan();await commitDailyV2Plan(repo,plan);
 const receipt=await commitDailyV2Answer(repo,{eventId:'first',day:plan.day,
  taskId:'latin-vocab',questionId:'latin-vocab-0',
  conceptId:'latin-vocab-concept-0',correct:true});
 assert.equal(receipt.verified,true);
 assert.equal(receipt.progress.verifiedProgress,1);
 assert.equal((await repo.read(plan.day)).ledger.attempts.length,1);
});
test('lying IndexedDB write still fails plan readback, not falsely marked as saved',async()=>{
 const db=fakeIndexedDB();db.setGhostWrite(true);
 const repo=createIndexedDbDailyV2Repository({indexedDBFactory:db.factory});
 await assert.rejects(()=>commitDailyV2Plan(repo,dailyPlan()),/PLAN_SAVE_NOT_VERIFIED/);
});
