import {assessImport, mergeImportProgress, latestStudyEvidence} from "./backup-import-safety-20261023.js";
import {mergeDailyHistory} from "./daily-record-integrity-20261018.js?v=20261018-daily-record1";

const KEY="lux-scholar-garden-v1";
const PAIRS=[
  ["practiceDrafts","lux-practice-drafts-v1"],
  ["biologyPractice","scholar-biology-cell-practice-v1"],
  ["topicLearning","lux-topic-learning-v1"],
  ["mathsStudy","lux-maths-study-v1"],
  ["mathsDrafts","lux-maths-draft-v1"],
  ["assessmentProgress","lux-assessment-v1"],
  ["petCompanion","lux-pet-companion-v1"]
];
const $=id=>document.getElementById(id);
let pending=null, currentRaw=null, plan=null, currentData=null, safetyAttempted=false, unsafeMerge=false;

export function parseNativeState(raw){
  if(raw==null || raw==="")return null;
  let parsed;
  try{parsed=JSON.parse(raw)}
  catch{throw Error("Current device progress is unreadable. Import blocked to protect it.");}
  if(!parsed || typeof parsed!=="object" || !parsed.state ||
     typeof parsed.state.xp!=="number" || !Array.isArray(parsed.state.daily))
    throw Error("Current device progress is not a recognized Scholar record. Import blocked.");
  return parsed;
}
export function validatePlainBackup(raw){
  let payload;
  try{payload=JSON.parse(raw)}
  catch{throw Error("This file is not valid JSON. Nothing changed.");}
  if(payload?.format==="gloria-encrypted-v1")
    throw Error("This is an encrypted Cloud Backup. Use the encrypted restore tool linked above.");
  if(payload?.app!=="lux-scholar-garden" || !payload.state ||
     typeof payload.state.xp!=="number" || !Number.isFinite(payload.state.xp) ||
     !Array.isArray(payload.state.daily))
    throw Error("This file is not a valid standard Scholar Garden progress JSON.");
  for(const [field] of PAIRS)
    if(payload[field]!=null && (typeof payload[field]!=="object" || Array.isArray(payload[field])))
      throw Error("Invalid "+field+" in backup; import has not started.");
  return payload;
}
// An older device may have 18 Oct receipts not present in a later 20 Oct
// backup. Safely MERGE those older records instead of blocking the Import.
// Verify that a protective merge keeps the device's real evidence.  An older
// six-task backup must never silently downgrade a newer ten-task device.
export function preservesExistingStudy(current={},after={}) {
  const atLeast=(next,old)=>Number(next??0)>=Number(old??0);
  if(!atLeast(after.xp,current.xp))return false;
  for(const key of ["latinXp","frenchXp","bioXp","chemXp","physXp","engXp","bodyXp"])
    if(!atLeast(after[key],current[key]))return false;
  const oldDay=latestStudyEvidence(current),newDay=latestStudyEvidence(after);
  if(oldDay && (!newDay||newDay<oldDay))return false;
  for(const key of ["studyDays","activityDays","loginDays","peDays"])
    if(Array.isArray(current[key]) &&
      current[key].some(day=>!Array.isArray(after[key])||!after[key].includes(day)))return false;
  if(Array.isArray(current.daily) && current.daily.length===10) {
    if(!Array.isArray(after.daily)||after.daily.length!==10)return false;
    if(current.today===after.today)for(const task of current.daily) {
      const found=after.daily.find(t=>t?.id===task?.id);
      if(!found||!atLeast(found.progress,task.progress)||
         (task.done===true&&found.done!==true&&!atLeast(found.progress,found.target)))
        return false;
    }
  }
  for(const [day,flag] of Object.entries(current.dailyCompleteAwarded||{}))
    if(flag===true&&after.dailyCompleteAwarded?.[day]!==true)return false;
  for(const [day,row] of Object.entries(current.dailyLog||{})) {
    const merged=after.dailyLog?.[day];
    if(!merged)return false;
    if(row?.complete===true&&merged.complete!==true)return false;
    for(const task of (Array.isArray(row?.tasks)?row.tasks:[])) {
      const matched=merged.tasks?.find(t=>t?.id===task?.id);
      if(!matched||!atLeast(matched.progress,task.progress)||
         (task.done===true&&matched.done!==true&&!atLeast(matched.progress,matched.target)))
        return false;
    }
  }
  for(const [day,subjects] of Object.entries(current.dailyVocabByDay||{}))
    for(const [subject,bucket] of Object.entries(subjects||{}))
      for(const [id,done] of Object.entries(bucket?.items||{}))
        if(done===true&&after.dailyVocabByDay?.[day]?.[subject]?.items?.[id]!==true)
          return false;
  for(const key of ["formalAttemptLog","history"]) {
    const original=Array.isArray(current[key])?current[key]:[];
    const updated=Array.isArray(after[key])?after[key]:[];
    const evidence=new Set(updated.map(v=>JSON.stringify(v)));
    if(original.some(v=>!evidence.has(JSON.stringify(v))))return false;
  }
  // These ledgers can contain nested true/number proofs, not just dates.
  const proofSurvives=(before,next,depth=0)=>{
    if(depth>12)return JSON.stringify(before)===JSON.stringify(next);
    if(before===true)return next===true;
    if(typeof before==="number")return atLeast(next,before);
    if(Array.isArray(before)){
      const updated=Array.isArray(next)?next:[];
      const available=new Set(updated.map(v=>JSON.stringify(v)));
      return before.every(v=>available.has(JSON.stringify(v)));
    }
    if(before&&typeof before==="object"){
      if(!next||typeof next!=="object")return false;
      return Object.entries(before).every(([key,value])=>
        proofSurvives(value,next[key],depth+1));
    }
    return before===undefined||before===null||next!==undefined;
  };
  for(const key of ["dailyCurriculumEvidenceByDay","recoveryTaskByDay",
                    "recoveryVocabByDay","recoveryAwarded","rewardLedgerByDay",
                    "gameRewardByDay","peRewardByDay","rewardedWriting",
                    "aiHelpByDay","aiHelpLedgerByDay"])
    if(current[key]!==undefined&&!proofSurvives(current[key],after[key]))return false;
  return true;
}
// A more recent date is not in itself unsafe.  The merged result, not the
// incoming file alone, determines whether existing device records survive.
export function wouldOverwriteNewerStudy(backup,current={}) {
  const merged=mergeImportProgress(backup,current,mergeDailyHistory);
  return !preservesExistingStudy(current,merged.backup.state);
}
export function nativeImportSnapshot(payload){
  return JSON.stringify({state:payload.state,version:10});
}
export function linkedAdditions(payload, storage){
  const entries=[];
  for(const [field,key] of PAIRS){
    if(payload[field]==null || storage.getItem(key)!=null)continue;
    entries.push([key,JSON.stringify(payload[field])]);
  }
  return entries;
}
function reportLine(dl,label,value){
  const dt=document.createElement("dt"),dd=document.createElement("dd");
  dt.textContent=label;dd.textContent=String(value);
  dl.append(dt,dd);
}
function reset(){
  pending=null;currentRaw=null;plan=null;currentData=null;safetyAttempted=false;unsafeMerge=false;
  $("comparison").replaceChildren();
  $("preview").hidden=true;
  $("safety").hidden=true;
  $("warning").hidden=true;
  $("safety-confirm").checked=false;
  $("safety-confirm").disabled=true;
  $("apply-button").disabled=true;
  $("result").textContent="";
}
function summarizeTasks(state){
  return (Array.isArray(state?.daily)?state.daily:[]).filter(t=>
    Number(t?.target)>0 && Number(t?.progress)>=Number(t?.target)).length;
}
function todayString(){
  return new Date().toISOString().slice(0,10);
}
function download(data,name){
  const blob=new Blob([data],{type:"application/json"}),url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function collectSafetySnapshot(raw){
  const native=JSON.parse(raw);
  const extra={};
  for(const [field,key] of PAIRS){
    const value=localStorage.getItem(key);
    if(value!=null){
      try{extra[field]=JSON.parse(value)}catch{extra[field+"Unparsed"]=value}
    }
  }
  return JSON.stringify({
    app:"lux-scholar-garden",
    version:10,
    exportedAt:new Date().toISOString(),
    safetyCopyFromDevice:true,
    state:native.state,
    ...extra
  },null,2);
}
function previewDetails(){
  const saved=pending.state,live=currentData?.state||{};
  const dl=$("comparison");
  reportLine(dl,"Backup file",pendingFileName);
  reportLine(dl,"Backup exported",pending.exportedAt||pending.savedAt||"Not recorded");
  reportLine(dl,"Backup XP",saved.xp);
  reportLine(dl,"Existing device XP",Number(live.xp)||0);
  reportLine(dl,"Backup daily tasks",saved.daily.length);
  reportLine(dl,"Existing daily tasks",Array.isArray(live.daily)?live.daily.length:0);
  reportLine(dl,"Backup latest study date",plan.report.savedDay||"No dated proof");
  reportLine(dl,"Existing latest study date",plan.report.liveDay||"No dated proof");
  reportLine(dl,"Backup completed today's tasks",summarizeTasks(saved));
  reportLine(dl,"Existing completed today's tasks",summarizeTasks(live));
  reportLine(dl,"Backup 22 Oct completion receipt",saved.dailyCompleteAwarded?.["2026-10-22"]===true?"Present":"Not present");
  reportLine(dl,"Existing 22 Oct completion receipt",live.dailyCompleteAwarded?.["2026-10-22"]===true?"Present":"Not present");
}
let pendingFileName="";
async function previewFile(){
  reset();
  const file=$("backup-file").files?.[0];
  if(!file){$("status").textContent="Choose a Scholar Garden JSON file first.";return;}
  $("status").textContent="Checking the JSON and current device progress…";
  try{
    const raw=await file.text();
    const payload=validatePlainBackup(raw);
    const existing=localStorage.getItem(KEY);
    const native=parseNativeState(existing);
    currentRaw=existing;
    currentData=native;
    plan=mergeImportProgress(payload,native?.state||{},mergeDailyHistory);
    unsafeMerge=wouldOverwriteNewerStudy(payload,native?.state||{});
    pending=payload;pendingFileName=file.name;
    previewDetails();
    $("preview").hidden=false;
    const warnings=[];
    if(plan.report.legacy)
      warnings.push("This is a legacy/partial file; it cannot supply dated records that were not exported.");
    if(plan.report.newerOnDevice && !unsafeMerge)
      warnings.push("This device has newer study records. A verified protective MERGE is available: the existing progress and completion evidence are kept, and distinct evidence from this older file can be added. Download and check the device safety copy before continuing. Missing days not in either record cannot be recovered.");
    if(unsafeMerge)
      warnings.push("The safety check could not prove that the merge preserves all existing study records. Import is BLOCKED. Keep both copies and obtain a newer full export from the original iPad.");
    if(warnings.length){$("warning").textContent=warnings.join("\n");$("warning").hidden=false}
    if(plan.report.currentHasProgress)$("safety").hidden=false;
    $("apply-button").disabled=unsafeMerge || !!plan.report.currentHasProgress;
    $("status").textContent=unsafeMerge
       ?"Preview ready — unsafe merge blocked to protect existing records."
       :"Preview ready. Nothing has been changed.";
  }catch(error){
    reset();
    $("status").textContent="Cannot preview: "+(error?.message||String(error))+". No progress changed.";
  }
}
function safetyDownload(){
  if(!pending || !currentRaw)return;
  try{
    const data=collectSafetySnapshot(currentRaw);
    download(data,"scholar-current-device-safety-"+todayString()+".json");
    safetyAttempted=true;
    $("safety-confirm").disabled=false;
    $("status").textContent="Safety file download started. Check Files / Downloads BEFORE ticking the confirmation box.";
  }catch(error){
    $("status").textContent="Could not produce safety file: "+(error?.message||error);
  }
}
function updateApply(){
  $("apply-button").disabled=!pending || unsafeMerge ||
    (!!plan?.report.currentHasProgress && (!safetyAttempted || !$("safety-confirm").checked));
}
export function commitToStorage(payload,existingRaw,storage){
  const native=parseNativeState(existingRaw);
  const merge=mergeImportProgress(payload,native?.state||{},mergeDailyHistory);
  if(wouldOverwriteNewerStudy(payload,native?.state||{}))
    throw Error("Safety check failed: this merge would lose existing device records. Nothing was imported.");
  const next=nativeImportSnapshot(merge.backup);
  const additions=linkedAdditions(payload,storage);
  const staged=[];
  const undo=()=>{
    for(const key of staged.reverse()){try{storage.removeItem(key)}catch{}}
  };
  try{
    // Stage only linked keys missing on the target; never replace newer local
    // drafts, pet progress, assessment data or other unrelated browser records.
    for(const [key,value] of additions){
      storage.setItem(key,value);
      staged.push(key);
      if(storage.getItem(key)!==value)throw Error("Could not verify linked "+key);
    }
    storage.setItem(KEY,next);
    if(storage.getItem(KEY)!==next)throw Error("Could not verify saved progress");
    const stored=parseNativeState(storage.getItem(KEY));
    if(JSON.stringify(stored.state)!==JSON.stringify(merge.backup.state))
      throw Error("Stored progress differs from imported progress");
    return {saved:stored.state,report:merge.report,linkedCount:staged.length};
  }catch(error){
    // If primary write succeeded but verification failed, try to put the
    // original bytes back. The external safety JSON was required beforehand.
    try{
      if(existingRaw==null)storage.removeItem(KEY);
      else storage.setItem(KEY,existingRaw);
    }catch{}
    undo();
    throw Error("Import not verified on this device: "+(error?.message||error)+
      ". Keep your original JSON and safety copy. Do not clear browser data.");
  }
}
function performImport(){
  if(!pending||!plan)return;
  if(unsafeMerge){
    $("status").textContent="Import stopped: merged data did not pass the existing-record protection check.";return;
  }
  if(plan.report.currentHasProgress && (!safetyAttempted || !$("safety-confirm").checked)){
    $("status").textContent="Save and verify a safety file before Import.";return;
  }
  if(!confirm("Import this Scholar JSON on THIS device? Existing saved dated evidence is protected where available. The backup cannot recreate missing days."))return;
  $("apply-button").disabled=true;
  try{
    // No app store is loaded here, so it cannot concurrently re-render or
    // rewrite data. Confirm a second time that the device has not changed
    // since the preview (another Gloria tab may have saved meanwhile).
    if(localStorage.getItem(KEY)!==currentRaw)
      throw Error("The device progress changed since preview. Close other Gloria tabs and preview again.");
    const result=commitToStorage(pending,currentRaw,localStorage);
    $("result").textContent="Import verified in browser storage. Saved "+result.saved.xp+
      " XP; linked datasets added: "+result.linkedCount+
      ". Close any other Gloria tabs before opening the Scholar app.";
    $("status").textContent="Import completed and storage read-back verified.";
    $("preview").hidden=true;
  }catch(error){
    $("status").textContent="Import stopped: "+(error?.message||String(error));
    updateApply();
  }
}
if(typeof document!=="undefined"){
  $("preview-button").addEventListener("click",previewFile);
  $("backup-file").addEventListener("change",()=>{reset();$("status").textContent="File chosen. Press Preview backup to inspect it.";});
  $("download-safety").addEventListener("click",safetyDownload);
  $("safety-confirm").addEventListener("change",updateApply);
  $("apply-button").addEventListener("click",performImport);
  $("status").textContent="Choose your exported Scholar Garden JSON to begin. No data will change during preview.";
}
