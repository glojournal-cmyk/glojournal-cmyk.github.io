/* Per-practice drafts: persistent IndexedDB, never share localStorage quota with Scholar progress.
   Previous localStorage drafts are migrated only after the IndexedDB copy is verified. */
(function(root){
 "use strict";
 const LEGACY_KEY="lux-practice-drafts-v1";
 const SESSION_KEY="lux-practice-draft-tab-v2";
 const DB_NAME="lux-practice-drafts-v2", STORE="drafts";
 const LIFE_MS=7*86400000;
 const cache=new Map(), writes=new Map(), completedKeys=new Set();
 let dbPromise=null, readyPromise=null, loaded=false;

 function oldMap(){
   try{
     const value=JSON.parse(localStorage.getItem(LEGACY_KEY)||"{}");
     return value&&typeof value==="object"&&!Array.isArray(value)?value:{};
   }catch{return {};}
 }
 function inTab(){
   try{const row=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
     return row&&typeof row.key==="string"&&row.record?row:null;
   }catch{return null;}
 }
 function tabSave(k,d){
   try{sessionStorage.setItem(SESSION_KEY,JSON.stringify({key:k,record:d}));return true;}
   catch{return false;}
 }
 function newer(a,b){return Number(a?.savedAt||0)>=Number(b?.savedAt||0)?a:b;}
 function valid(d){return d?.version===1&&Date.now()-Number(d.savedAt)<LIFE_MS&&
   Array.isArray(d.base)&&d.base.length&&Number.isInteger(d.j)&&d.j>=0&&
   d.j<d.base.length+(d.rr?.length||0)&&!d.ce;}

 function openDB(){
   if(dbPromise)return dbPromise;
   dbPromise=new Promise((resolve,reject)=>{
     if(!root.indexedDB)return reject(Error("IndexedDB unavailable"));
     const req=root.indexedDB.open(DB_NAME,1);
     req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))
       req.result.createObjectStore(STORE);};
     req.onsuccess=()=>resolve(req.result);
     req.onerror=()=>reject(req.error||Error("Cannot open draft storage"));
     req.onblocked=()=>reject(Error("Draft storage blocked"));
   }).catch(error=>{dbPromise=null;throw error});
   return dbPromise;
 }
 async function dbRead(k){
   const db=await openDB();
   return new Promise((resolve,reject)=>{
     const tx=db.transaction(STORE,"readonly"),req=tx.objectStore(STORE).get(k);
     req.onsuccess=()=>resolve(req.result??null);
     req.onerror=()=>reject(req.error||Error("Draft read failed"));
     tx.onabort=()=>reject(tx.error||Error("Draft read aborted"));
   });
 }
 async function dbAll(){
   const db=await openDB();
   return new Promise((resolve,reject)=>{
     const tx=db.transaction(STORE,"readonly"),st=tx.objectStore(STORE);
     const keys=st.getAllKeys(),values=st.getAll();
     tx.oncomplete=()=>resolve(keys.result.map((k,i)=>[k,values.result[i]]));
     tx.onerror=()=>reject(tx.error||Error("Draft list failed"));
     tx.onabort=()=>reject(tx.error||Error("Draft list aborted"));
   });
 }
 async function dbWrite(k,d){
   const db=await openDB();
   await new Promise((resolve,reject)=>{
     const tx=db.transaction(STORE,"readwrite");
     tx.objectStore(STORE).put(d,k);
     tx.oncomplete=resolve;
     tx.onerror=()=>reject(tx.error||Error("Draft save failed"));
     tx.onabort=()=>reject(tx.error||Error("Draft save aborted"));
   });
   const verified=await dbRead(k);
   if(!verified||JSON.stringify(verified)!==JSON.stringify(d))
     throw Error("Draft save could not be verified");
   return true;
 }
 async function dbDelete(k){
   const db=await openDB();
   await new Promise((resolve,reject)=>{
     const tx=db.transaction(STORE,"readwrite");
     tx.objectStore(STORE).delete(k);
     tx.oncomplete=resolve;
     tx.onerror=()=>reject(tx.error||Error("Draft removal failed"));
     tx.onabort=()=>reject(tx.error||Error("Draft removal aborted"));
   });
   return (await dbRead(k))==null;
 }
 function enqueue(k,fn){
   const previous=writes.get(k)||Promise.resolve();
   const next=previous.catch(()=>{}).then(fn);
   writes.set(k,next);
   next.then(()=>{if(writes.get(k)===next)writes.delete(k)},
             ()=>{if(writes.get(k)===next)writes.delete(k)});
   return next;
 }
 async function hydrate(){
   const raw=(()=>{try{return localStorage.getItem(LEGACY_KEY)}catch{return null}})();
   const legacy=oldMap(),tab=inTab();
   for(const [k,d] of Object.entries(legacy))if(d&&typeof d==="object")
     cache.set(k,newer(cache.get(k),d));
   if(tab)cache.set(tab.key,newer(cache.get(tab.key),tab.record));
   try{
     const rows=await dbAll();
     for(const [k,d] of rows)if(d&&typeof d==="object")
       cache.set(k,newer(cache.get(k),d));
     // Verify ALL older local drafts are present in IndexedDB before removing
     // only their redundant localStorage container. Do not touch main progress.
     for(const [k,d] of Object.entries(legacy)){
       if(!d||typeof d!=="object")continue;
       const stored=await dbRead(k);
       if(!stored||Number(stored.savedAt||0)<Number(d.savedAt||0))
         await dbWrite(k,d);
     }
     if(raw&&Object.keys(legacy).length){
       let complete=true;
       for(const [k,d] of Object.entries(legacy)){
         if(!d||typeof d!=="object")continue;
         const saved=await dbRead(k);
         if(!saved||Number(saved.savedAt||0)<Number(d.savedAt||0)){complete=false;break;}
       }
       if(complete&&localStorage.getItem(LEGACY_KEY)===raw)
         localStorage.removeItem(LEGACY_KEY);
     }
   }catch{
     // Keep old data untouched if IDB is unavailable or blocked.
   }
 }
 function ready(){
   if(!readyPromise)readyPromise=hydrate().catch(()=>{}).then(()=>{loaded=true;return true;});
   return readyPromise;
 }
 function key(subject,year,size,topic,daily,mode){
   const u=new URL(location.href);
   return JSON.stringify([subject,year,size,topic||"",daily||"",
     mode||u.searchParams.get("mode")||"standard",u.searchParams.get("task")||"",
     u.searchParams.get("scope")||"",
     daily?new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London"}).format(new Date()):""]);
 }
 function read(k){
   // A completed quiz must not become resumable between the UI completion
   // event and the asynchronous IndexedDB delete transaction.
   if(completedKeys.has(k))return null;
   const row=cache.get(k),legacy=oldMap()[k],tab=inTab();
   const candidate=newer(newer(row,legacy),tab?.key===k?tab.record:null);
   return valid(candidate)?candidate:null;
 }
 function recoveryReceipt(d){
   try{
     const href=String(d.href||""),today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London"}).format(new Date());
     const date=(href.match(/[?&]recover=(\d{4}-\d{2}-\d{2})/)||[])[1]||
       (d.planDate&&d.planDate!==today?d.planDate:null);
     const task=decodeURIComponent((href.match(/[?&]task=([^&]+)/)||[])[1]||d.dailyTaskId||"");
     const ids=(d.sessionLog||[]).filter(a=>a&&a.questionId&&a.formal!==false&&!a.repair).map(a=>a.questionId);
     if(date&&task&&ids.length&&task!=="french-vocab"&&task!=="latin-vocab")
       root.LuxRecoveryReceipt?.saveRecoveryReceipt?.({date,taskId:task,questionIds:ids});
   }catch{}
 }
 async function clear(k){
   // Mark expired synchronously; preserve all Scholar progress separately.
   completedKeys.add(k);
   await ready();
   return enqueue(k,async()=>{
     try{
       if(!(await dbDelete(k)))return false;
       const legacy=oldMap();
       if(Object.prototype.hasOwnProperty.call(legacy,k)){
         delete legacy[k];
         // Keep the original if removal cannot be committed.
         try{localStorage.setItem(LEGACY_KEY,JSON.stringify(legacy));}
         catch{return false;}
       }
       if(inTab()?.key===k){try{sessionStorage.removeItem(SESSION_KEY)}catch{}}
       cache.delete(k);
       return true;
     }catch{return false;}
   });
 }
 function save(k,d){
   if(d.ce){recoveryReceipt(d);return clear(k);}
   completedKeys.delete(k);
   const snapshot={...d,version:1,savedAt:Date.now()};
   cache.set(k,snapshot);
   tabSave(k,snapshot); // Small same-tab rescue while the IndexedDB transaction is in flight.
   return enqueue(k,async()=>{
     await ready();
     try{return await dbWrite(k,snapshot);}
     catch{
       // Fallback must be a VERIFIED persistent write, not only sessionStorage.
       try{
         const legacy=oldMap();legacy[k]=snapshot;
         const serialized=JSON.stringify(legacy);
         localStorage.setItem(LEGACY_KEY,serialized);
         return localStorage.getItem(LEGACY_KEY)===serialized;
       }catch{return false;}
     }
   });
 }
 root.LuxPracticeDrafts={key,read,save,clear,ready,isReady:()=>loaded};
 void ready();
})(globalThis);
