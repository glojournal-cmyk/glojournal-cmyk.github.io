// Append-only question evidence journal independent of Safari localStorage.
// Does not alter or delete learning, XP, pets, or dated Daily Records.
const DB="lux-scholar-answer-evidence-v1",TABLE="marked";let opening=null;
const day=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s);
const valid=e=>e&&e.questionId&&e.subject&&typeof e.correct==="boolean"&&
 typeof e.at==="string"&&(day(e.day)||day(e.recoveryFor))&&e.formal!==false&&!e.repair;
const key=e=>String(e.attemptId||[e.at,e.subject,e.questionId,e.dailyTaskId||"",e.recoveryFor||""].join(":"));
function open(){
 if(typeof indexedDB==="undefined")return Promise.reject(Error("IndexedDB unavailable"));
 if(opening)return opening;
 opening=new Promise((resolve,reject)=>{
   const req=indexedDB.open(DB,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(TABLE))
     req.result.createObjectStore(TABLE,{keyPath:"id"})};
   req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();opening=null};resolve(db)};
   req.onerror=()=>reject(req.error||Error("Answer journal unavailable"));
   req.onblocked=()=>reject(Error("Answer journal blocked"));
 }).catch(e=>{opening=null;throw e});
 return opening;
}
function warn(error){try{window.dispatchEvent(new CustomEvent("scholar:storage-status",{
 detail:{saved:false,durableEvidence:false,error:String(error?.message||error)}
}))}catch{}}
export function saveMarkedAnswer(entry){
 if(!valid(entry))return Promise.resolve(false);
 return open().then(db=>new Promise((resolve,reject)=>{
   const tx=db.transaction(TABLE,"readwrite");
   tx.objectStore(TABLE).put({...entry,id:key(entry)});
   tx.oncomplete=()=>resolve(true);
   tx.onerror=()=>reject(tx.error||Error("Answer write failed"));
   tx.onabort=()=>reject(tx.error||Error("Answer write aborted"));
 })).catch(e=>{warn(e);return false});
}
export async function readMarkedAnswers(){
 try{
   const db=await open();
   const data=await new Promise((resolve,reject)=>{
     const tx=db.transaction(TABLE,"readonly"),req=tx.objectStore(TABLE).getAll();
     req.onsuccess=()=>resolve(req.result||[]);
     req.onerror=()=>reject(req.error||Error("Answer read failed"));
     tx.onabort=()=>reject(tx.error||Error("Answer read aborted"));
   });
   const cutoff=Date.now()-92*86400000;
   return data.filter(e=>valid(e)&&Date.parse(e.at)>=cutoff)
     .sort((a,b)=>a.at.localeCompare(b.at)).slice(-10000);
 }catch(e){warn(e);return []}
}
export function mergeMarkedEvidence(current,archived){
 const base=Array.isArray(current)?current:[],seen=new Set(base.map(key)),extra=[];
 for(const entry of archived||[]){
   if(!valid(entry)||seen.has(key(entry)))continue;
   seen.add(key(entry));const {id:unused,...clean}=entry;extra.push(clean);
 }
 return extra.length?[...base,...extra]
   .sort((a,b)=>String(a.at||"").localeCompare(String(b.at||""))).slice(-10000):base;
}
