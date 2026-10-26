// Append-only question evidence journal independent of Safari localStorage.
// Does not alter or delete learning, XP, pets, or dated Daily Records.
const DB="lux-scholar-answer-evidence-v1",TABLE="marked";let opening=null;
const day=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s);
const valid=e=>e&&e.questionId&&e.subject&&typeof e.correct==="boolean"&&
 typeof e.at==="string"&&(day(e.day)||day(e.recoveryFor))&&e.formal!==false&&
 (!e.repair||(e.correct===true&&["latin","french"].includes(e.dailyVocab)&&!e.recoveryFor));
const key=e=>String(e.attemptId||[e.at,e.subject,e.questionId,e.dailyTaskId||"",e.recoveryFor||""].join(":"));
// Compact, checked local fallback. Especially important on iPad if IndexedDB
// closes, is blocked, or the Safari page unloads after marking an answer.
const FALLBACK="lux-marked-answer-fallback-v1";
const FIELD_NAMES=["at","day","attemptId","questionId","correct","subject","year",
 "topicId","formal","repair","format","mode","dailyTaskId","dailyVocab",
 "vocabConcept","recoveryFor"];
function fallbackRead(){
 try{
  const rows=JSON.parse(localStorage.getItem(FALLBACK)||"[]");
  return Array.isArray(rows)?rows.filter(valid):[];
 }catch{return []}
}
function fallbackSave(entry){
 try{
  if(typeof localStorage==="undefined")return false;
  const rows=fallbackRead(),id=key(entry);
  if(rows.some(e=>key(e)===id))return true;
  const compact={};
  for(const field of FIELD_NAMES)if(entry[field]!=null)compact[field]=entry[field];
  const cutoff=Date.now()-92*86400000;
  const out=[...rows.filter(e=>Date.parse(e.at)>=cutoff),compact]
    .sort((a,b)=>a.at.localeCompare(b.at)).slice(-2500);
  const serialized=JSON.stringify(out);
  localStorage.setItem(FALLBACK,serialized);
  return localStorage.getItem(FALLBACK)===serialized;
 }catch{return false}
}
function deadline(work,ms=3500){
 return new Promise((resolve,reject)=>{
  let settled=false;
  const timer=setTimeout(()=>{
   if(!settled){settled=true;reject(Error("IndexedDB answer journal timeout"));}
  },ms);
  Promise.resolve(work).then(
   value=>{if(!settled){settled=true;clearTimeout(timer);resolve(value)}},
   error=>{if(!settled){settled=true;clearTimeout(timer);reject(error)}}
  );
 });
}
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
 // Vocabulary answers are checked synchronously before the async IDB write.
 // This prevents a correct word from being lost on Safari pagehide.
 const protectedVocab=!!entry.dailyVocab&&fallbackSave(entry);
 const write=open().then(db=>new Promise((resolve,reject)=>{
   const tx=db.transaction(TABLE,"readwrite");
   tx.objectStore(TABLE).put({...entry,id:key(entry)});
   tx.oncomplete=()=>resolve(true);
   tx.onerror=()=>reject(tx.error||Error("Answer write failed"));
   tx.onabort=()=>reject(tx.error||Error("Answer write aborted"));
 }));
 return deadline(write).catch(error=>{
   const preserved=protectedVocab||fallbackSave(entry);
   if(!preserved)warn(error);
   return preserved;
 });
}
export async function readMarkedAnswers(){
 let dbEntries=[];
 try{
   const db=await deadline(open());
   dbEntries=await deadline(new Promise((resolve,reject)=>{
     const tx=db.transaction(TABLE,"readonly"),req=tx.objectStore(TABLE).getAll();
     req.onsuccess=()=>resolve(req.result||[]);
     req.onerror=()=>reject(req.error||Error("Answer read failed"));
     tx.onabort=()=>reject(tx.error||Error("Answer read aborted"));
   }),6000);
 }catch(error){
   if(!fallbackRead().length)warn(error);
 }
 const cutoff=Date.now()-92*86400000;
 const rows=[...dbEntries,...fallbackRead()].filter(e=>valid(e)&&Date.parse(e.at)>=cutoff);
 const seen=new Map();
 for(const entry of rows)seen.set(key(entry),entry);
 return [...seen.values()].sort((a,b)=>a.at.localeCompare(b.at)).slice(-10000);
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
