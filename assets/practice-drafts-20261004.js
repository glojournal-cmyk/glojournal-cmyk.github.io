/* Per-practice drafts: persistent IndexedDB, never share localStorage quota with Scholar progress.
   Previous localStorage drafts are migrated only after the IndexedDB copy is verified. */
(function(root){
 "use strict";
 const LEGACY_KEY="lux-practice-drafts-v1";
 const SESSION_KEY="lux-practice-draft-tab-v2";
 const DB_NAME="lux-practice-drafts-v2", STORE="drafts";
 const LIFE_MS=7*86400000;
 const cache=new Map(), writes=new Map(), completedKeys=new Set();
 let dbPromise=null, readyPromise=null, loaded=false, idbTimedOut=false;
 // Safari/iPad IndexedDB requests can remain pending without firing an error.
 // Never let this optional draft store indefinitely block practice or saving.
 const DRAFT_WAIT_MS=5000;
 function withDeadline(promise,label){
   return new Promise((resolve,reject)=>{
     const timer=setTimeout(()=>{idbTimedOut=true;reject(Error(label+" timed out"));},DRAFT_WAIT_MS);
     Promise.resolve(promise).then(
       result=>{clearTimeout(timer);resolve(result)},
       error=>{clearTimeout(timer);reject(error)}
     );
   });
 }

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
   if(!readyPromise)readyPromise=withDeadline(hydrate(),"Draft loading")
     .catch(()=>{}) // Keep IDB/legacy records untouched if this device stalls.
     .then(()=>{loaded=true;return true;});
   return readyPromise;
 }
 function key(subject,year,size,topic,daily,mode){
   const u=new URL(location.href);
   // A locked Daily assignment is one continuous sitting. Its remaining
   // question count changes after every correct answer and must NOT change
   // the draft identity (e.g. Biology 15 -> 10 on re-entry).
   const locked=!!daily&&u.searchParams.get("daily")==="1"&&
     u.searchParams.get("locked")==="1";
   const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London"}).format(new Date());
   const taskDay=locked?(u.searchParams.get("recover")||today):(daily?today:"");
   return JSON.stringify([subject,year,locked?"locked-task":size,topic||"",daily||"",
     mode||u.searchParams.get("mode")||"standard",u.searchParams.get("task")||"",
     u.searchParams.get("scope")||"",taskDay]);
 }
 function oldDailyDraftKeys(k,legacy=oldMap(),tab=inTab()){
   let identity;
   try{identity=JSON.parse(k)}catch{return []}
   if(!Array.isArray(identity)||identity.length!==9||identity[2]!=="locked-task")
     return [];
   const candidates=new Set([...cache.keys(),...Object.keys(legacy),...(tab?[tab.key]:[])]);
   return [...candidates].filter(previousKey=>{
     if(previousKey===k)return false;
     let prior;
     try{prior=JSON.parse(previousKey)}catch{return false}
     return Array.isArray(prior)&&prior.length===9&&
       Number.isInteger(prior[2])&&prior[2]>=1&&
       prior.every((value,index)=>index===2||value===identity[index]);
   });
 }
 function read(k){
   // A completed quiz must not become resumable between the UI completion
   // event and the asynchronous IndexedDB delete transaction.
   if(completedKeys.has(k))return null;
   const legacy=oldMap(),tab=inTab();
   const exact=newer(newer(cache.get(k),legacy[k]),tab?.key===k?tab.record:null);
   let best=valid(exact)?exact:null;
   // Recover already-started Daily sittings previously saved using their
   // changing remaining-count key, but never borrow a different assignment.
   for(const previousKey of oldDailyDraftKeys(k,legacy,tab)){
     if(completedKeys.has(previousKey))continue;
     const draft=newer(newer(cache.get(previousKey),legacy[previousKey]),
       tab?.key===previousKey?tab.record:null);
     if(valid(draft)&&(!best||Number(draft.savedAt)>Number(best.savedAt)))
       best=draft;
   }
   return best;
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
       // Once the original sitting finishes, remove numeric-key drafts too.
       // Otherwise an older 15-question snapshot could resurrect after
       // a 10-question remainder completes and the browser reloads.
       const legacy=oldMap(),tab=inTab();
       const keys=[k,...oldDailyDraftKeys(k,legacy,tab)];
       for(const item of keys)completedKeys.add(item);
       for(const item of keys)if(!(await withDeadline(dbDelete(item),"Draft removal")))return false;
       let changed=false;
       for(const item of keys)if(Object.prototype.hasOwnProperty.call(legacy,item)){
         delete legacy[item];changed=true;
       }
       if(changed){
         try{localStorage.setItem(LEGACY_KEY,JSON.stringify(legacy));}
         catch{return false;}
       }
       if(keys.includes(tab?.key)){try{sessionStorage.removeItem(SESSION_KEY)}catch{}}
       for(const item of keys)cache.delete(item);
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
     try{
       if(idbTimedOut)throw Error("Draft storage unresponsive");
       return await withDeadline(dbWrite(k,snapshot),"Draft save");
     }
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
 // Avoid an orphaned background IndexedDB probe on browsers that lack IDB.
 // Read-only legacy/tab rescue still works; an explicit save invokes ready().
 if(root.indexedDB)void ready().catch(()=>{});
})(globalThis);
