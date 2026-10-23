// Opt-in per-device automatic encrypted backups. No secrets ship in static code.
// Browser-stored credentials are readable to scripts on this origin: protect the origin.
import {readCurrentProgress,encryptProgress,uploadEncrypted} from './cloud-backup-client-20261022.js';
const DB='gloria-cloud-backup-device-v1', STORE='settings';
const INTERVAL=3*24*60*60*1000, RETRY=30*60*1000;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function readSettledProgress(){
 // Give the app's debounced state persistence time to finish before capturing a cloud snapshot.
 await wait(1200);
 const first=readCurrentProgress();
 await wait(500);
 const second=readCurrentProgress();
 if(first.raw!==second.raw)throw Error('Progress changed while preparing cloud backup; retry later');
 return second;
}
function openDb(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
async function setting(key,value,write=false){
 const db=await openDb();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,write?'readwrite':'readonly');
  const op=write?tx.objectStore(STORE).put(value,key):tx.objectStore(STORE).get(key);
  op.onsuccess=()=>resolve(write?true:op.result??null);op.onerror=()=>reject(op.error);
 });}finally{db.close();}
}
export async function enrollAutoBackup(token,passphrase){
 if(!/^[A-Za-z0-9_-]{40,100}$/.test(token))throw Error('Invalid backup token');
 if(typeof passphrase!=='string'||passphrase.length<16)throw Error('Passphrase too short');
 const source=await readSettledProgress();
 // Verify upload before remembering credentials; no silent false success.
 const envelope=await encryptProgress(source,passphrase);
 const receipt=await uploadEncrypted(envelope,token);
 await setting('device',{token,passphrase,lastSuccess:Date.now(),digest:receipt.digest},true);
 await setting('lastError',null,true);
 return receipt;
}
export async function disableAutoBackup(){await setting('device',null,true);return true;}
export async function backupStatus(){
 const config=await setting('device');
 return {enabled:!!(config?.token&&config?.passphrase),lastSuccess:config?.lastSuccess||null,nextDue:config?.lastSuccess?config.lastSuccess+INTERVAL:null,lastError:(await setting('lastError'))||null};
}
let running=null;
export async function runAutoBackup(now=Date.now()){
 if(running)return running;
 running=(async()=>{
  const config=await setting('device');
  if(!config?.token||!config?.passphrase)return {status:'not-enrolled'};
  const lastAttempt=Number(await setting('lastAttempt'))||0;
  if(now-lastAttempt<RETRY||now-Number(config.lastSuccess||0)<INTERVAL)return {status:'not-due'};
  await setting('lastAttempt',now,true);
  const progress=await readSettledProgress();
  const envelope=await encryptProgress(progress,config.passphrase);
  const receipt=await uploadEncrypted(envelope,config.token);
  // If enrollment disabled during upload, never silently re-enable it.
  const current=await setting('device');
  if(current?.token===config.token&&current?.passphrase===config.passphrase){
   await setting('device',{...current,lastSuccess:Date.now(),digest:receipt.digest},true);
   await setting('lastError',null,true);
  }
  return {status:'uploaded',uploadedAt:receipt.uploadedAt};
 })().catch(async error=>{try{await setting('lastError',{at:Date.now(),message:String(error?.message||error).slice(0,240)},true)}catch{}return {status:'retry-later',reason:String(error?.message||error)};}).finally(()=>{running=null;});
 return running;
}
export function startAutomaticBackup(){
 // Never block the app, never overwrite the progress store.
 const trigger=()=>{if(!document.hidden)void runAutoBackup();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',trigger,{once:true});else trigger();
 document.addEventListener('visibilitychange',trigger);
 window.addEventListener('online',trigger);
 // Open iPad Safari pages only: no scheduled OS background execution.
 const timer=setInterval(trigger,60*60*1000);
 return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',trigger);window.removeEventListener('online',trigger);};
}
