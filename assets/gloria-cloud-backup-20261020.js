/* Gloria encrypted cloud backup client. Safe to import while cloud service is
   not configured. Never sends credentials or plaintext study records to logs. */
const DB_NAME="gloria-cloud-secrets-v1",STORE="config",SLOT="owner";
const enc=new TextEncoder(),dec=new TextDecoder();
function b64url(bytes){
 let out="";
 for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(out).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function unb64(value){
 const base=String(value).replace(/-/g,"+").replace(/_/g,"/");
 const str=atob(base+"=".repeat((4-base.length%4)%4));
 return Uint8Array.from(str,c=>c.charCodeAt(0));
}
function hex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function digest(bytes){return hex(await crypto.subtle.digest("SHA-256",bytes))}
function verifyEndpoint(endpoint){
 const u=new URL(endpoint);
 if(u.protocol!=="https:"||u.username||u.password||u.hash||u.search||
    !u.hostname.endsWith(".workers.dev")&&u.hostname!=="glojournal-cmyk.github.io")
   throw Error("Use the verified HTTPS backup Worker URL");
 return u.origin;
}
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB)return reject(Error("Secure device storage unavailable"));
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>reject(Error("Cannot open secure device storage"));
  req.onblocked=()=>reject(Error("Secure device storage is blocked by another tab"));
  req.onsuccess=()=>resolve(req.result);
 });
}
async function withStore(mode,operation){
 const db=await openDB();
 try{
  return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,mode),obj=tx.objectStore(STORE);
   let value;
   let settled=false;
   function fail(){if(!settled){settled=true;reject(Error("Secure cloud configuration could not be stored"))}}
   tx.onabort=fail;tx.onerror=fail;
   tx.oncomplete=()=>{if(!settled){settled=true;resolve(value)}};
   const req=operation(obj);
   req.onsuccess=()=>{value=req.result};
   req.onerror=fail;
  });
 }finally{db.close()}
}
async function readConfig(){return withStore("readonly",obj=>obj.get(SLOT))}
async function storeConfig(config){return withStore("readwrite",obj=>obj.put(config,SLOT))}
export async function encryptBackup(payload,key,keyId){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 let clear=enc.encode(JSON.stringify(payload)),compression="none";
 // Compress repetitive practice history BEFORE encryption to reduce quota/network use.
 if(typeof CompressionStream==="function"){
  try{
   const stream=new Blob([clear]).stream().pipeThrough(new CompressionStream("gzip"));
   const gz=new Uint8Array(await new Response(stream).arrayBuffer());
   if(gz.length<clear.length){clear=gz;compression="gzip"}
  }catch{} // In older browsers retain valid, uncompressed AES-GCM.
 }
 const sealed=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,clear));
 const ciphertext=b64url(sealed);
 return {format:"gloria-encrypted-v1",version:1,keyId,compression,
   savedAt:new Date().toISOString(),iv:b64url(iv),ciphertext,
   contentSha256:await digest(enc.encode(ciphertext))};
}
export async function decryptBackup(envelope,recoveryKey){
 if(envelope?.format!=="gloria-encrypted-v1"||envelope?.version!==1)throw Error("Not a Gloria encrypted backup");
 const secret=unb64(recoveryKey);
 if(secret.length!==32)throw Error("The recovery key must contain exactly 32 bytes");
 const keyId=(await digest(secret)).slice(0,16);
 if(keyId!==envelope.keyId)throw Error("This recovery key does not match the backup");
 const key=await crypto.subtle.importKey("raw",secret,{name:"AES-GCM"},false,["decrypt"]);
 let plain=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(envelope.iv)},key,unb64(envelope.ciphertext)));
 if(envelope.compression==="gzip"){
  if(typeof DecompressionStream!=="function")throw Error("Gzip recovery is unsupported on this device");
  const stream=new Blob([plain]).stream().pipeThrough(new DecompressionStream("gzip"));
  plain=new Uint8Array(await new Response(stream).arrayBuffer());
 }else if(envelope.compression&&envelope.compression!=="none")throw Error("Unknown backup compression");
 const payload=JSON.parse(dec.decode(plain));
 if(payload?.app!=="gloria-cloud-snapshot"||payload?.main?.app!=="lux-scholar-garden"||
    !Array.isArray(payload.main?.state?.daily))throw Error("Invalid decrypted Scholar Garden data");
 return payload; // intentionally does NOT call importProgress / overwrite the device.
}
export function captureLiveProgress(store,local=globalThis.localStorage,doc=globalThis.document){
 const json=store?.getState?.()?.exportProgress?.();
 const main=JSON.parse(json||"null");
 if(main?.app!=="lux-scholar-garden"||typeof main.state?.xp!=="number"||
    !Array.isArray(main.state?.daily))throw Error("Scholar Garden progress unavailable");
 let drafts=null;
 try{
  const raw=local?.getItem("lux-practice-drafts-v1");
  const value=raw?JSON.parse(raw):null;
  if(value&&typeof value==="object"&&!Array.isArray(value))drafts=value;
 }catch{}
 // Pending, unsubmitted typed text may not be in persisted practice state.
 // Capture it as an emergency note only, never use it to award marks.
 let unfinished=null;
 try{
  const field=doc?.activeElement;
  const question=field?.closest?.("[data-question-id]");
  if(question&&field.matches("input:not([type=checkbox]),textarea"))
   unfinished={questionId:question.getAttribute("data-question-id"),value:String(field.value||"").slice(0,25000),
      route:globalThis.location?.pathname||""};
 }catch{}
 return {app:"gloria-cloud-snapshot",version:1,capturedAt:new Date().toISOString(),main,
   drafts,unfinished};
}
async function remoteRequest(config,path,init={}){
 const r=await fetch(config.endpoint+path,{
  ...init,
  headers:{"authorization":"Bearer "+config.token,...(init.headers||{})},
  cache:"no-store"
 });
 if(!r.ok)throw Error("Cloud backup request failed (HTTP "+r.status+")");
 return r;
}
export async function pairCloudBackup({endpoint,token}){
 const existing=await readConfig();
 if(existing?.keyId)throw Error("This device is already paired. Use the existing recovery key path; never overwrite an old encryption key silently.");
 const origin=verifyEndpoint(endpoint);
 if(!/^[A-Za-z0-9_-]{40,100}$/.test(token||""))throw Error("Pairing token has an invalid format");
 const check=await remoteRequest({endpoint:origin,token},"/v1/status");
 if(!check.ok)throw Error("Could not verify private cloud backup");
 // Recovery key must be recorded by the owner outside the iPad before trusting it.
 const secret=crypto.getRandomValues(new Uint8Array(32));
 const key=await crypto.subtle.importKey("raw",secret,{name:"AES-GCM"},false,["encrypt"]);
 const keyId=(await digest(secret)).slice(0,16);
 await storeConfig({endpoint:origin,token,keyId,key,enabled:false});
 return {recoveryKey:b64url(secret),keyId};
}
export async function importRecoveryKey({endpoint,token,recoveryKey}){
 const origin=verifyEndpoint(endpoint),secret=unb64(recoveryKey);
 if(secret.length!==32)throw Error("Recovery key must contain 32 bytes");
 if(!/^[A-Za-z0-9_-]{40,100}$/.test(token||""))throw Error("Pairing token has an invalid format");
 await remoteRequest({endpoint:origin,token},"/v1/status");
 const key=await crypto.subtle.importKey("raw",secret,{name:"AES-GCM"},false,["encrypt"]);
 const keyId=(await digest(secret)).slice(0,16);
 await storeConfig({endpoint:origin,token,keyId,key,enabled:false});
 return {keyId};
}
export async function enableAutoBackup(){
 const config=await readConfig();
 if(!config?.key||!config?.endpoint||!config?.token)
   throw Error("Complete owner pairing and save your recovery key first");
 await storeConfig({...config,enabled:true});
 return {enabled:true,keyId:config.keyId};
}
export async function disableAutoBackup(){
 const config=await readConfig();
 if(config)await storeConfig({...config,enabled:false});
 return {enabled:false};
}
export async function uploadBackup(store,options={}){
 const config=await readConfig();
 if(!config?.endpoint||!config?.token||!config?.key||config.enabled!==true)return {saved:false,reason:"not-enabled"};
 const payload=captureLiveProgress(store,options.localStorage,options.document);
 const envelope=await encryptBackup(payload,config.key,config.keyId);
 const r=await remoteRequest(config,"/v1/backups",{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(envelope)
 });
 const ack=await r.json();
 if(ack?.saved!==true||ack?.digest!==envelope.contentSha256)
   throw Error("Cloud storage did not acknowledge an identical encrypted snapshot");
 return {saved:true,uploadedAt:ack.uploadedAt,digest:ack.digest,id:ack.id};
}
export async function getCloudStatus(){
 const config=await readConfig();
 if(!config)return {paired:false};
 const response=await remoteRequest(config,"/v1/status");
 return {paired:true,keyId:config.keyId,...await response.json()};
}
export async function downloadEncryptedBackup(key){
 const config=await readConfig();
 if(!config)throw Error("Cloud pairing required");
 const r=await remoteRequest(config,"/v1/download?key="+encodeURIComponent(key));
 return r.json();
}
export function startAutoCloudBackup(store,{onStatus=()=>{},debounceMs=15000,minIntervalMs=120000}={}){
 let timer=null,busy=false,last=0,again=false,stopped=false;
 async function upload(){
  if(stopped)return;
  if(busy){again=true;return}
  if(Date.now()-last<minIntervalMs){schedule();return}
  busy=true;
  try{
   const result=await uploadBackup(store);
   if(result.saved)last=Date.now();
   onStatus(result);
  }catch{onStatus({saved:false,reason:"upload-failed"});}
  finally{busy=false;if(again){again=false;schedule()}}
 }
 function schedule(){
  if(stopped)return;
  if(timer)clearTimeout(timer);
  timer=setTimeout(()=>{timer=null;void upload()},Math.max(debounceMs,minIntervalMs-(Date.now()-last)));
 }
 const off=store.subscribe(schedule);
 const names=["scholar:question-answered","scholar:learning-changed","scholar:pet-changed"];
 for(const name of names)globalThis.addEventListener?.(name,schedule);
 schedule(); // Initial snapshot after the owner pairs this device.
 return ()=>{
  stopped=true;if(timer)clearTimeout(timer);
  off?.();for(const name of names)globalThis.removeEventListener?.(name,schedule);
 };
}
export {readConfig};
