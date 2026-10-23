// Small, independent IndexedDB receipt vault for real dated Daily tasks.
// It never stores the 593MB app, never creates XP/answers and never clears data.
import {mergeDailyHistory,mergeDailyRecordRow} from "./daily-record-integrity-20261018.js?v=20261023-freeze-assigned-dates1";

const DB="lux-daily-record-vault-v1",TABLE="dated-rows";
let opening=null,recording=Promise.resolve(),initializing=false,initialized=false;
let timer=null,attached=false;
const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||"")&&
  new Date(d+"T12:00:00Z").toISOString().slice(0,10)===d;
const count=t=>t.filter(x=>x.done===true||(Number(x.target)>0&&Number(x.progress)>=Number(x.target))).length;
const clone=t=>JSON.parse(JSON.stringify(t));

function db(){
 if(opening)return opening;
 opening=new Promise((resolve,reject)=>{
   if(typeof indexedDB==="undefined")return reject(Error("IndexedDB unavailable"));
   const q=indexedDB.open(DB,1);
   q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(TABLE))q.result.createObjectStore(TABLE)};
   q.onsuccess=()=>resolve(q.result);
   q.onerror=()=>reject(q.error||Error("Unable to open dated records"));
   q.onblocked=()=>reject(Error("Dated record store blocked"));
 }).catch(e=>{opening=null;throw e});
 return opening;
}
async function all(){
 const d=await db();
 return new Promise((resolve,reject)=>{
  const t=d.transaction(TABLE,"readonly"),rows=t.objectStore(TABLE).getAll();
  t.oncomplete=()=>resolve(rows.result||[]);
  t.onerror=()=>reject(t.error||Error("Cannot read dated records"));
  t.onabort=()=>reject(t.error||Error("Read dated records aborted"));
 });
}
async function put(row){
 const d=await db();
 await new Promise((resolve,reject)=>{
  const t=d.transaction(TABLE,"readwrite");
  t.objectStore(TABLE).put(row,row.date);
  t.oncomplete=resolve;
  t.onerror=()=>reject(t.error||Error("Cannot save dated record"));
  t.onabort=()=>reject(t.error||Error("Dated record save aborted"));
 });
}
function actualRows(s){
 const rows={};
 for(const [date,row] of Object.entries(s.dailyLog||{})){
  if(!validDate(date)||!Array.isArray(row?.tasks)||!row.tasks.length)continue;
  rows[date]=row;
 }
 if(validDate(s.today)&&Array.isArray(s.daily)&&s.daily.length===10){
  const current=s.daily.map(t=>({...t,done:t.done===true||
      (Number(t.target)>0&&Number(t.progress)>=Number(t.target))}));
  const n=count(current);
  const incoming={date:s.today,tasks:current,done:n,total:10,complete:n===10};
  rows[s.today]=mergeDailyRecordRow(rows[s.today],incoming,s.today);
 }
 return rows;
}
function verifiedRow(row){
 const tasks=Array.isArray(row?.tasks)?row.tasks:[];
 if(!validDate(row?.date)||tasks.length<1||tasks.length>15)return false;
 return tasks.every(t=>typeof t?.id==="string"&&t.id.length&&
     Number.isFinite(Number(t.target))&&Number(t.target)>0&&
     Number.isFinite(Number(t.progress))&&Number(t.progress)>=0);
}
async function record(state){
 const rows=actualRows(state);
 recording=recording.catch(()=>{}).then(async()=>{
   const saved=await all();
   const byDate=Object.fromEntries(saved.filter(verifiedRow).map(r=>[r.date,r]));
   // Preserve both checked original tasks and later genuine same-assignment
   // progress. Incoming new task IDs cannot rewrite a started ten-task day.
   const merged=mergeDailyHistory(byDate,rows);
   for(const [date,row] of Object.entries(merged)){
     if(!verifiedRow(row)||JSON.stringify(byDate[date])===JSON.stringify(row))continue;
     await put(clone(row));
   }
 });
 return recording;
}
async function restore(store){
 const rows=(await all()).filter(verifiedRow);
 if(!rows.length)return;
 const s=store.getState();
 const archived=Object.fromEntries(rows.map(r=>[r.date,r]));
 // The independent older original plan is first, live evidence is second.
 // This is monotonic by task/date; do not touch user's XP, mastery or answers.
 const merged=mergeDailyHistory(archived,s.dailyLog);
 if(JSON.stringify(merged)!==JSON.stringify(s.dailyLog||{}))
   store.setState({dailyLog:merged});
}
function start(){
 if(initialized||initializing)return;
 const store=globalThis.__luxStore;
 if(!store?.getState||!store?.setState)return;
 if(store.persist?.hasHydrated?.()===false)return;
 initializing=true;
 Promise.resolve().then(()=>restore(store)).catch(e=>{
   console.warn("Gloria dated record vault restore unavailable",e?.name||e);
 }).then(()=>{
   initialized=true;initializing=false;
   void record(store.getState()).catch(e=>console.warn("Dated record vault unavailable",e?.name||e));
   if(attached)return;
   attached=true;
   let last=null;
   store.subscribe((next,prev)=>{
     if(!prev||(!initialized)||(
       next.daily===prev.daily&&next.dailyLog===prev.dailyLog&&next.today===prev.today))return;
     if(timer!==null)clearTimeout(timer);
     timer=setTimeout(()=>{timer=null;void record(store.getState()).catch(()=>{})},450);
   });
 });
}
if(typeof window!=="undefined"){
 const tryStart=()=>{const s=globalThis.__luxStore;
   if(s?.persist?.hasHydrated?.()===false){
     s.persist.onFinishHydration?.(start);return;
   }
   start();
 };
 window.addEventListener("lux:app-ready",tryStart,{once:true});
 window.addEventListener("pageshow",tryStart);
 let attempts=0;
 const tick=setInterval(()=>{attempts++;
   if(globalThis.__luxStore?.persist?.hasHydrated?.()){
     clearInterval(tick);tryStart();
   }else if(attempts>=50)clearInterval(tick);
 },120);
}
