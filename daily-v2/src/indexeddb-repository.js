/* Daily V2 — browser IndexedDB atomic compare-and-swap repository.
 * Staging database is distinct from all legacy Scholar's Garden keys.
 * Usage: const repo=createIndexedDbDailyV2Repository();
 *      await commitDailyV2Plan(repo,plan); await commitDailyV2Answer(repo,event);
 * A commit is durable only once the readwrite transaction's oncomplete fires;
 * readback verification is additionally enforced in src/storage.js.
 * This code MUST be verified in real Safari before production integration.
 */
const DEFAULT_DB='scholar-daily-v2-staging';
const STORE='daily-snapshots';
function idbError(label,reason){
 const text=reason?.name||reason?.message||String(reason||'UNKNOWN');
 return new Error('DailyV2 IndexedDB '+label+': '+text);
}
function cloneValue(data){return data==null?data:JSON.parse(JSON.stringify(data));}
function assertRevision(day,expected,next){
 if(typeof day!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(day))throw Error('DailyV2 IndexedDB: invalid day');
 if(!Number.isSafeInteger(expected)||expected<0)throw Error('DailyV2 IndexedDB: invalid revision');
 if(!next||next.day!==day||next.revision!==expected+1||next.ledger?.version!==2)
  throw Error('DailyV2 IndexedDB: mismatched snapshot');
}
export function createIndexedDbDailyV2Repository({
 indexedDBFactory=typeof indexedDB==='undefined'?null:indexedDB,
 databaseName=DEFAULT_DB,
 version=1
}={}){
 if(!indexedDBFactory?.open)throw Error('DailyV2 IndexedDB unavailable; never fall back to unverified memory storage');
 if(typeof databaseName!=='string'||!databaseName.startsWith('scholar-daily-v2-'))
  throw Error('DailyV2 IndexedDB requires isolated v2 namespace');
 if(!Number.isInteger(version)||version<1)throw Error('DailyV2 IndexedDB invalid schema version');
 async function open(){
  return new Promise((resolve,reject)=>{
   let settled=false;
   let req;
   try{req=indexedDBFactory.open(databaseName,version);}
   catch(e){reject(idbError('OPEN_FAILED',e));return;}
   req.onupgradeneeded=()=>{
    try{
     const db=req.result;
     if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);
    }catch(e){if(!settled){settled=true;reject(idbError('SCHEMA_FAILED',e));}}
   };
   req.onerror=()=>{if(!settled){settled=true;reject(idbError('OPEN_FAILED',req.error));}};
   req.onblocked=()=>{if(!settled){settled=true;reject(idbError('OPEN_BLOCKED','another tab has older schema'));}};
   req.onsuccess=()=>{
    if(settled){req.result.close?.();return;}
    settled=true;const db=req.result;
    db.onversionchange=()=>db.close();
    resolve(db);
   };
  });
 }
 async function withTransaction(day,write,expected,next){
  const db=await open();
  return new Promise((resolve,reject)=>{
   let done=false,output=null;
   const finish=(err,val)=>{
    if(done)return;done=true;
    try{db.close();}catch{}
    if(err)reject(err);else resolve(val);
   };
   let tx;
   try{
    tx=db.transaction(STORE,write?'readwrite':'readonly');
    const store=tx.objectStore(STORE);
    tx.onabort=()=>finish(idbError('TRANSACTION_ABORTED',tx.error));
    tx.onerror=()=>{}; // the transaction abort event is the authoritative failure
    tx.oncomplete=()=>finish(null,cloneValue(output));
    const request=store.get(day);
    request.onerror=()=>{}; // transaction abort handles this error
    request.onsuccess=()=>{
     const current=request.result||null;
     if(!write){output=current;return;}
     const actual=current?.revision??0;
     if(actual!==expected){output=false;return;}
     try{
      // A read-modify-write occurs within one readwrite transaction.
      // Concurrent tabs cannot both commit the same expected revision.
      store.put(cloneValue(next),day);
      output=true;
     }catch(e){
      try{tx.abort();}catch{}
      finish(idbError('WRITE_FAILED',e));
     }
    };
   }catch(e){try{tx?.abort();}catch{}finish(idbError('TRANSACTION_START_FAILED',e));}
  });
 }
 return {
  async read(day){
   if(typeof day!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(day))
    throw Error('DailyV2 IndexedDB: invalid day');
   return withTransaction(day,false);
  },
  async compareAndSwap(day,expectedRevision,next){
   assertRevision(day,expectedRevision,next);
   return withTransaction(day,true,expectedRevision,next);
  },
  storageKind:'indexeddb-atomic-v2'
 };
}
