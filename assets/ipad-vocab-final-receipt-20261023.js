/* iPad-only-safe additional receipt for a genuinely marked final Daily Vocab answer.
   Does not invent answers, edit prior days, grant XP or clear Safari storage. */
(function(root){
"use strict";
const KEY="lux-daily-vocab-last-answer-receipts-v1";
const DB="lux-daily-vocab-last-answer-v1", TABLE="marked";
const dayOK=d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||""));
const valid=r=>r&&dayOK(r.day)&&["latin","french"].includes(r.subject)&&
  typeof r.questionId==="string"&&r.questionId.length>0&&r.correct===true&&
  Number(r.before)===29&&Number.isFinite(Number(r.at));
const key=r=>r.day+":"+r.subject+":"+r.questionId;
const store=()=>root.__luxStore?.getState&&root.__luxStore?.setState?root.__luxStore:null;
const inDaily=subject=>{
  if(!root.location)return false;
  const p=new URLSearchParams(root.location.search||"");
  return p.get("daily")==="1"&&p.get("locked")==="1"&&
    p.get("mode")==="y8vocab"&&p.get("task")===subject+"-vocab"&&
    !p.has("recover")&&String(root.location.pathname||"").replace(/\\/+$/,"")==="/study/"+subject+"/practise";
};
function recorded(state,subject,day,id){
  if(state.dailyVocabByDay?.[day]?.[subject]?.items?.[id]===true)return true;
  return (state.formalAttemptLog||[]).some(a=>a?.questionId===id&&
    a.day===day&&a.correct===true&&a.formal!==false&&
    !a.repair&&!a.recoveryFor&&(a.dailyVocab===subject||
    (a.dailyTaskId===subject+"-vocab"&&a.subject===subject)));
}
function progress(state,subject,day){
  const id=subject+"-vocab",row=state.dailyVocabByDay?.[day]?.[subject]||{};
  const credited=new Set(Object.keys(row.items||{}).filter(x=>row.items[x]===true));
  for(const a of state.formalAttemptLog||[]){
    if(a?.day===day&&a.correct===true&&a.questionId&&a.formal!==false&&
       !a.repair&&!a.recoveryFor&&(a.dailyVocab===subject||
       (a.dailyTaskId===id&&a.subject===subject)))credited.add(String(a.questionId));
  }
  const saved=[...(state.today===day?state.daily||[]:[]),
    ...(state.dailyLog?.[day]?.tasks||[])].filter(t=>t?.id===id)
    .reduce((n,t)=>Math.max(n,Number(t.progress)||0),0);
  const extras=Object.values(row.additionalCorrectIds||{}).filter(Boolean).length;
  return Math.min(30,Math.max(credited.size,saved,
    (Number(row.baselineProgress)||0)+extras));
}
function sessionRows(){
  try{
    const rows=JSON.parse(root.sessionStorage?.getItem(KEY)||"[]");
    return Array.isArray(rows)?rows.filter(valid):[];
  }catch{return []}
}
function putSession(r){
  try{
    const rows=sessionRows().filter(x=>key(x)!==key(r)&&
      x.day>=r.day.slice(0,7)+"-01").slice(-60);
    rows.push(r);
    root.sessionStorage.setItem(KEY,JSON.stringify(rows));
    return sessionRows().some(x=>key(x)===key(r));
  }catch{return false}
}
let opening;
function open(){
  if(opening)return opening;
  if(!root.indexedDB)return Promise.reject(Error("IndexedDB unavailable"));
  opening=new Promise((resolve,reject)=>{
    const q=root.indexedDB.open(DB,1);
    q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(TABLE))
      q.result.createObjectStore(TABLE)};
    q.onsuccess=()=>resolve(q.result);
    q.onerror=()=>reject(q.error||Error("Unable to open answer receipts"));
    q.onblocked=()=>reject(Error("Answer receipt store blocked"));
  }).catch(e=>{opening=null;throw e});
  return opening;
}
async function putDB(r){
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(TABLE,"readwrite");
    tx.objectStore(TABLE).put(r,key(r));
    tx.oncomplete=()=>resolve(true);
    tx.onerror=()=>reject(tx.error||Error("Answer receipt write failed"));
    tx.onabort=()=>reject(tx.error||Error("Answer receipt write aborted"));
  });
}
async function fromDB(){
  try{
    const db=await open();
    const rows=await new Promise((resolve,reject)=>{
      const tx=db.transaction(TABLE,"readonly"),q=tx.objectStore(TABLE).getAll();
      tx.oncomplete=()=>resolve(q.result||[]);
      tx.onerror=()=>reject(tx.error||Error("Answer receipt read failed"));
      tx.onabort=()=>reject(tx.error||Error("Answer receipt read aborted"));
    });
    return rows.filter(valid);
  }catch{return []}
}
let applying=false;
function apply(receipts){
  if(applying)return false;
  const s=store();
  if(!s||s.persist?.hasHydrated?.()===false)return false;
  const state=s.getState(),day=state.today;
  if(!dayOK(day))return false;
  const eligible=receipts.filter(r=>valid(r)&&r.day===day&&
    Number(r.at)<=Date.now()+60000);
  if(!eligible.length)return false;
  const groups=new Map();
  for(const r of eligible){
    const prior=groups.get(r.subject)||[];
    if(!prior.some(x=>x.questionId===r.questionId))prior.push(r);
    groups.set(r.subject,prior);
  }
  let ledger=state.dailyVocabByDay||{},daily=state.daily||[],
    log=state.dailyLog||{},changed=false;
  for(const [subject,proofs] of groups){
    const id=subject+"-vocab",current=ledger[day]?.[subject]||{};
    // Receipt was issued only when the learner had verified 29/30 before
    // answering; the exact marked question ID is the 30th independent proof.
    const extra={...(current.additionalCorrectIds||{})};
    for(const proof of proofs)extra[proof.questionId]=true;
    const base=Math.max(29,Number(current.baselineProgress)||0);
    const corrected=Math.min(30,base+Object.values(extra).filter(Boolean).length);
    if(corrected<=progress({...state,daily,dailyLog:log,dailyVocabByDay:ledger},subject,day))continue;
    ledger={...ledger,[day]:{...(ledger[day]||{}),[subject]:{
      ...current,baselineProgress:base,additionalCorrectIds:extra,
      lastVerifiedFinalAnswerAt:new Date(Math.max(...proofs.map(r=>r.at))).toISOString()
    }}};
    daily=daily.map(t=>t?.id===id&&t.planDate===day?
      {...t,progress:Math.max(Number(t.progress)||0,corrected),
        done:corrected>=Number(t.target||30)}:t);
    const row=log[day];
    if(Array.isArray(row?.tasks)){
      const tasks=row.tasks.map(t=>t?.id===id?
        {...t,progress:Math.max(Number(t.progress)||0,corrected),
          done:corrected>=Number(t.target||30)}:t);
      const done=tasks.filter(t=>t.done===true||
        (Number(t.target)>0&&Number(t.progress)>=Number(t.target))).length;
      log={...log,[day]:{...row,tasks,done,total:tasks.length,
        complete:tasks.length>0&&done===tasks.length}};
    }
    changed=true;
  }
  if(!changed)return false;
  applying=true;
  try{s.setState({dailyVocabByDay:ledger,daily,dailyLog:log});}
  finally{applying=false}
  return true;
}
let rescueTimer=null;
function queueApply(rows){
  if(rescueTimer!==null)clearTimeout(rescueTimer);
  rescueTimer=setTimeout(()=>{rescueTimer=null;apply(rows)},100);
}
function onMarked(event){
  const d=event?.detail||{},subject=d.dailyVocab;
  if(!["french","latin"].includes(subject)||!inDaily(subject)||
    d.correct!==true||typeof d.questionId!=="string"||!d.questionId)return;
  const s=store(),state=s?.getState?.(),day=state?.today;
  if(!state||s.persist?.hasHydrated?.()===false||!dayOK(day)||
    progress(state,subject,day)!==29||recorded(state,subject,day,d.questionId))return;
  const r={day,subject,questionId:d.questionId,correct:true,before:29,at:Date.now()};
  const sessionOK=putSession(r);
  if(sessionOK)queueApply(sessionRows());
  void putDB(r).then(()=>{if(!sessionOK)queueApply([r])}).catch(()=>{
    if(!sessionOK){
      root.dispatchEvent?.(new CustomEvent("scholar:storage-status",{
        detail:{saved:false,error:"iPad could not retain final Daily Vocab answer"} }));
    }
  });
}
async function recover(){
  if(!store()||store().persist?.hasHydrated?.()===false)return;
  apply(sessionRows());
  const dbRows=await fromDB();
  if(dbRows.length)apply([...sessionRows(),...dbRows]);
}
root.addEventListener?.("scholar:question-answered",onMarked);
root.addEventListener?.("pageshow",()=>{void recover()});
root.addEventListener?.("lux:app-ready",()=>{void recover()});
let tries=0;
const boot=setInterval(()=>{
  if(store()&&store().persist?.hasHydrated?.()){
    clearInterval(boot);void recover();
  }else if(++tries>60)clearInterval(boot);
},200);
root.LuxIpadVocabFinalReceipt={check:()=>recover()};
})(globalThis);
