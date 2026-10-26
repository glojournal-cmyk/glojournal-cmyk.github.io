// Emergency READ-ONLY rescue for iPad Safari/PWA, 2026-10-26.
// Never writes, restores, merges, normalizes, resets, or awards learner progress.
// This file is intentionally NOT a normal Scholar import format.
const STORAGE_KEYS=/^(?:lux-|scholar-|gloria-)/i;
const SENSITIVE=/(?:password|secret|token|auth|credential|private-key)/i;
const errorText=e=>String(e?.message||e||"Unknown error");
function copy(value){
  if(value==null)return null;
  return JSON.parse(JSON.stringify(value));
}
function readStore(name,store,ms=3500){
  return new Promise(resolve=>{
    if(typeof indexedDB==="undefined"){
      resolve({status:"unavailable",records:[],error:"IndexedDB unavailable"});return;
    }
    let done=false,db=null;
    const complete=result=>{
      if(done)return;done=true;clearTimeout(timer);
      try{db?.close()}catch{}
      resolve(result);
    };
    const timer=setTimeout(()=>complete({status:"timeout",records:[],
      error:name+" timed out; other sources are still preserved"}),ms);
    try{
      const request=indexedDB.open(name);
      request.onupgradeneeded=()=>{
        // Do not create an empty database merely to inspect a missing store.
        try{request.transaction.abort()}catch{}
      };
      request.onerror=()=>complete({status:"error",records:[],
        error:errorText(request.error)});
      request.onblocked=()=>complete({status:"blocked",records:[],
        error:name+" is blocked"});
      request.onsuccess=()=>{
        db=request.result;
        if(done){try{db.close()}catch{}return;}
        if(!db.objectStoreNames.contains(store)){
          complete({status:"absent",records:[]});return;
        }
        try{
          const tx=db.transaction(store,"readonly"),s=tx.objectStore(store);
          let entries=[];
          const req=s.getAll();
          req.onsuccess=()=>{entries=req.result||[]};
          tx.oncomplete=()=>complete({status:"ok",records:entries});
          tx.onerror=()=>complete({status:"error",records:[],error:errorText(tx.error)});
          tx.onabort=()=>complete({status:"error",records:[],error:"Read transaction aborted"});
        }catch(e){complete({status:"error",records:[],error:errorText(e)})}
      };
    }catch(e){complete({status:"error",records:[],error:errorText(e)})}
  });
}
export async function captureEmergencyRescue({getState,standardExportError=null}={}){
  const capturedAt=new Date().toISOString(),warnings=[];
  let liveState=null,serializedMain=null,localCopies={},tabDraft=null;
  if(typeof getState==="function"){
    try{liveState=copy(getState())}catch(e){warnings.push("Live state: "+errorText(e))}
  }
  try{
    if(typeof localStorage!=="undefined"){
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);
        if(!key||!STORAGE_KEYS.test(key)||SENSITIVE.test(key))continue;
        try{localCopies[key]=localStorage.getItem(key)}
        catch(e){warnings.push("Reading "+key+": "+errorText(e))}
      }
      serializedMain=localCopies["lux-scholar-garden-v1"]||null;
    }
  }catch(e){warnings.push("Local storage: "+errorText(e))}
  try{tabDraft=typeof sessionStorage==="undefined"?null:
    sessionStorage.getItem("lux-practice-draft-tab-v2")}
  catch(e){warnings.push("Tab draft: "+errorText(e))}
  const [answers,drafts]=await Promise.all([
    readStore("lux-scholar-answer-evidence-v1","marked"),
    readStore("lux-practice-drafts-v2","drafts")
  ]);
  for(const [name,result] of [["answer journal",answers],["practice drafts",drafts]])
    if(result.status!=="ok"&&result.status!=="absent")
      warnings.push(name+": "+(result.error||result.status));
  if(!liveState&&!serializedMain&&!answers.records.length&&!drafts.records.length)
    throw Error("No usable Scholar data could be read. Do not delete Safari data.");
  const data={
    format:"lux-scholar-emergency-rescue-v1",
    recoveryOnly:true,
    capturedAt,
    note:"RAW RESCUE ONLY. DO NOT IMPORT THIS FILE INTO SCHOLAR. Preserve it for read-only recovery analysis.",
    standardExportError:standardExportError?errorText(standardExportError):null,
    warnings,
    sources:{
      liveState,
      persistedScholarRaw:serializedMain,
      localStorageEntries:localCopies,
      sessionPracticeDraftRaw:tabDraft,
      indexedDbAnswerJournal:answers,
      indexedDbPracticeDrafts:drafts
    },
    audit:{
      hasLiveState:!!liveState,
      hasPersistedScholarState:!!serializedMain,
      liveDay:liveState?.today||null,
      liveDailyTaskCount:Array.isArray(liveState?.daily)?liveState.daily.length:null,
      answerJournalCount:answers.records.length,
      practiceDraftCount:drafts.records.length,
      warningsCount:warnings.length
    }
  };
  return JSON.stringify(data,null,2);
}
export function saveEmergencyRescue(data){
  const date=new Date(),stamp=date.toISOString().replace(/[:.]/g,"-");
  const filename="scholar-EMERGENCY-RAW-"+stamp+".json";
  const blob=new Blob([data],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  try{
    const link=document.createElement("a");
    link.href=url;link.download=filename;
    link.style.display="none";
    document.body.appendChild(link);
    link.click();link.remove();
  }finally{setTimeout(()=>URL.revokeObjectURL(url),30000)}
  return filename;
}
