/* IndexedDB vault for full Scholar backup snapshots.
   Does not touch the main Zustand store or any Pet/wardrobe record. */
const DB_NAME="lux-scholar-recovery-v1", STORE_NAME="snapshots";
export const AUTO_KEY="lux-progress-auto-v1";
export const PREVIOUS_KEY=AUTO_KEY+"-previous";
export const MANUAL_KEY="lux-daily-manual-backup-v1";
export const BEFORE_KEY="lux-progress-before-restore-v1";
export const KEYS=[AUTO_KEY,PREVIOUS_KEY,MANUAL_KEY,BEFORE_KEY];
let opening=null;
function dbOpen(){
 if(opening)return opening;
 opening=new Promise((resolve,reject)=>{
  if(typeof indexedDB==="undefined")return reject(new Error("IndexedDB unavailable"));
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME);};
  request.onerror=()=>reject(request.error||new Error("Cannot open recovery vault"));
  request.onblocked=()=>reject(new Error("Recovery vault is blocked by another page"));
  request.onsuccess=()=>resolve(request.result);
 }).catch(error=>{opening=null;throw error});
 return opening;
}
async function read(key){
 const db=await dbOpen();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE_NAME,"readonly"),request=tx.objectStore(STORE_NAME).get(key);
  request.onsuccess=()=>resolve(request.result??null);
  request.onerror=()=>reject(request.error);
  tx.onerror=()=>reject(tx.error);
 });
}
async function write(key,data){
 const db=await dbOpen();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE_NAME,"readwrite");
  tx.objectStore(STORE_NAME).put(data,key);
  tx.oncomplete=()=>resolve(true);
  tx.onerror=()=>reject(tx.error||new Error("Recovery vault write failed"));
  tx.onabort=()=>reject(tx.error||new Error("Recovery vault write aborted"));
 });
}
export function validSnapshot(saved){
 if(!saved||typeof saved.data!=="string"||!saved.data.length)return false;
 try {const p=JSON.parse(saved.data);return p?.app==="lux-scholar-garden"&&typeof p.state?.xp==="number"&&Array.isArray(p.state?.daily);}
 catch{return false}
}
function fromLocal(key){
 try{const v=JSON.parse(localStorage.getItem(key)||"null");return validSnapshot(v)?v:null;}
 catch{return null}
}
export async function readBackup(key){
 const local=fromLocal(key);
 let vault=null;
 try{vault=await read(key)}catch{}
 // Prefer a later copy but NEVER replace a valid one with corrupt data.
 const result=!validSnapshot(vault)?local:
   local&&Date.parse(local.savedAt||"")>Date.parse(vault.savedAt||"")?local:vault;
 if(result&&typeof globalThis!=="undefined"){
   globalThis.LuxArchivedBackupCache ||= {};
   globalThis.LuxArchivedBackupCache[key]=result;
 }
 return result;
}
export async function putBackup(key,saved){
 if(!KEYS.includes(key)||!validSnapshot(saved))throw Error("Invalid backup");
 await write(key,saved);
 const again=await read(key);
 if(!validSnapshot(again)||again.data!==saved.data)throw Error("Backup verification failed");
 return true;
}
let archiving=null;
export function migrateOldBackups(){
 if(archiving)return archiving;
 archiving=(async()=>{
  let moved=0,failed=0;
  for(const key of KEYS){
   const original=localStorage.getItem(key);
   let local;try{local=JSON.parse(original||"null")}catch{continue}
   if(!validSnapshot(local))continue;
   try{
    const saved=await read(key);
    const keep=validSnapshot(saved)&&Date.parse(saved.savedAt||"")>Date.parse(local.savedAt||"")?saved:local;
    await putBackup(key,keep);
    // Verify first, then remove ONLY the duplicate backup key. Never remove
    // lux-scholar-garden-v1 or personal gameplay records.
    if((await read(key))?.data===keep.data&&
       localStorage.getItem(key)===original){
      localStorage.removeItem(key);moved++;
    }
   }catch{failed++}
  }
  return {moved,failed};
 })().finally(()=>{archiving=null});
 return archiving;
}
export async function readAllBackups(){
 const output={};
 for(const key of KEYS)output[key]=await readBackup(key);
 return output;
}

/* Retry the live primary save after moving verified duplicate snapshots.
   Never restore an older snapshot over the live answer state. */
let recovering=null;
export function recoverProgressStorage(store){
 if(recovering)return recovering;
 recovering=(async()=>{
  await migrateOldBackups();
  if(!store?.getState||!store?.setState||store.persist?.hasHydrated?.()===false)return false;
  const options=store.persist?.getOptions?.();
  if(!options||options.name!=="lux-scholar-garden-v1")return false;
  // If the primary already matches, this warning may concern a separate store.
  // Do not clear a different save failure by rewriting an unchanged primary.
  const before=JSON.stringify({state:options.partialize({...store.getState()}),version:options.version});
  if(localStorage.getItem(options.name)===before)return false;
  store.setState({});
  const state=options.partialize({...store.getState()});
  const expected=JSON.stringify({state,version:options.version});
  return localStorage.getItem(options.name)===expected;
 })().catch(()=>false).finally(()=>{recovering=null});
 return recovering;
}
