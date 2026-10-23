// Canonical live Export for the last 30 calendar days and all saved history.
// The app's memory is authoritative for today's work; the on-device persisted
// store and independent IndexedDB journal can supply older dated evidence.
// Missing dated records are labelled missing; no XP or completion is invented.
import {readMarkedAnswers,mergeMarkedEvidence} from "./durable-study-evidence-20261018.js?v=20261018-evidence-v1";
import {mergeDailyHistory} from "./daily-record-integrity-20261018.js?v=20261018-daily-record1";
import {rebuildDatedDailyRecords} from "./daily-dated-answer-reconcile-20261023.js?v=1";
import {assertFullProgressBackup} from "./full-progress-backup-guard-20261023.js";
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const object=value=>value&&typeof value==="object"&&!Array.isArray(value);
const dayValid=d=>DATE.test(String(d||""))&&
 !Number.isNaN(Date.parse(d+"T12:00:00Z"))&&
 new Date(d+"T12:00:00Z").toISOString().slice(0,10)===d;
const countDone=tasks=>(Array.isArray(tasks)?tasks:[]).filter(t=>
 t?.done===true||(Number(t?.target)>0&&Number(t.progress)>=Number(t.target))).length;
const dayRange=through=>Array.from({length:30},(_,i)=>
 new Date(Date.parse(through+"T12:00:00Z")-(29-i)*86400000).toISOString().slice(0,10));
const safeCopy=value=>JSON.parse(JSON.stringify(value));
function combineVocab(older,newer) {
 const out={...(object(older)?older:{})};
 for(const [date,subjects] of Object.entries(object(newer)?newer:{})){
  const previous=object(out[date])?out[date]:{},next={...previous};
  for(const [subject,bucket] of Object.entries(object(subjects)?subjects:{})){
   const was=object(previous[subject])?previous[subject]:{};
   const items={...(object(was.items)?was.items:{})};
   for(const [word,correct] of Object.entries(object(bucket?.items)?bucket.items:{}))
    items[word]=items[word]===true||correct===true;
   next[subject]={...was,...bucket,items};
  }
  out[date]=next;
 }
 return out;
}
function persistedState(storage) {
 if(!storage?.getItem)return null;
 try{
  const saved=JSON.parse(storage.getItem("lux-scholar-garden-v1")||"null");
  return object(saved?.state)&&Array.isArray(saved.state.daily)?saved.state:null;
 }catch{return null}
}
const snapshotKey=state=>JSON.stringify({
 today:state.today,xp:state.xp,bodyXp:state.bodyXp,
 daily:state.daily,dailyLog:state.dailyLog,
 dailyCompleteAwarded:state.dailyCompleteAwarded,
 dailyVocabByDay:state.dailyVocabByDay,
 formalAttemptLog:state.formalAttemptLog,
 dailyCurriculumEvidenceByDay:state.dailyCurriculumEvidenceByDay,
 recoveryTaskByDay:state.recoveryTaskByDay,recoveryVocabByDay:state.recoveryVocabByDay
});
function mergeSnapshot(live,stored,archived){
 // No merging of current daily plan, XP, awards, mastery or preferences.
 const original=object(stored)?stored:{};
 const tasks=Array.isArray(live.daily)?live.daily:[];
 let merged={...live,daily:tasks,
   formalAttemptLog:mergeMarkedEvidence(
    mergeMarkedEvidence(original.formalAttemptLog,live.formalAttemptLog),
    archived),
   dailyLog:mergeDailyHistory(original.dailyLog,live.dailyLog),
   dailyVocabByDay:combineVocab(original.dailyVocabByDay,live.dailyVocabByDay),
   dailyCompleteAwarded:{...(object(original.dailyCompleteAwarded)?original.dailyCompleteAwarded:{})}
 };
 for(const [date,flag] of Object.entries(object(live.dailyCompleteAwarded)?live.dailyCompleteAwarded:{}))
  if(flag===true)merged.dailyCompleteAwarded[date]=true;
 // Only previously persisted, dated, task-scoped facts can repair an old
 // completion row. The two-date incident replay is itself evidence-gated.
 const restored=rebuildDatedDailyRecords(merged);
 if(restored?.dailyLog)merged={...merged,...restored};
 return merged;
}
function thirtyDayManifest(state,capturedAt){
 const dates=dayRange(state.today),lookup=object(state.dailyLog)?state.dailyLog:{};
 const tally=new Map();
 for(const item of Array.isArray(state.formalAttemptLog)?state.formalAttemptLog:[]){
  if(dayValid(item?.day)&&item?.questionId&&typeof item.correct==="boolean"&&
    item.formal!==false&&!item.repair){
   tally.set(item.day,(tally.get(item.day)||0)+1);
  }
 }
 const days=dates.map(date=>{
  const row=lookup[date],isToday=date===state.today,
   tasks=isToday?state.daily:Array.isArray(row?.tasks)?row.tasks:null,
   attempts=tally.get(date)||0;
  const total=Array.isArray(tasks)?tasks.length:null;
  const done=total===null?null:countDone(tasks);
  return {date,done,total,markedAttempts:attempts,
   status:total!==null
    ? (done===total&&total>0?"completed":"partial")
    :attempts>0?"answers-without-task-record":"no-saved-record"};
 });
 return {periodDays:30,from:dates[0],through:state.today,capturedAt,
  days,unverifiedDays:days.filter(d=>d.total===null).map(d=>d.date),
  // This is a coverage summary, not 30 invented task-completion receipts.
  note:"Includes all available saved original-day tasks and formal answers. A day without a dated task record is marked unverified, not completed."};
}
/**
 * Read a fresh snapshot after the optional IndexedDB journal has settled.
 * Returns a JSON string that can be imported by the existing Scholar importer.
 * Fresh changes during snapshot preparation cause a retry, not a stale export.
 */
export async function prepareLatest30DayExport(getState,getBaseExport,options={}){
 const readJournal=options.readJournal||readMarkedAnswers;
 const storage=options.storage===undefined?
   (typeof localStorage==="undefined"?null:localStorage):options.storage;
 const journal=await readJournal();
 if(!Array.isArray(journal))throw Error("Could not verify saved answer journal.");
 for(let attempt=0;attempt<3;attempt++){
  const live=getState();
  if(!object(live)||!dayValid(live.today)||!Array.isArray(live.daily)||
     live.daily.length!==10)
   throw Error("Full 30-day export unavailable: today's ten Daily Tasks are not ready.");
  if(options.isHydrated?.()===false)
   throw Error("Learning progress is still loading. Export was not started.");
  const before=snapshotKey(live);
  const base=JSON.parse(getBaseExport());
  const stored=persistedState(storage);
  const snapshot=mergeSnapshot(live,stored,journal);
  const capturedAt=new Date().toISOString();
  const manifest=thirtyDayManifest(snapshot,capturedAt);
  const file={...base,app:"lux-scholar-garden",version:10,
   exportedAt:capturedAt,
   state:safeCopy(snapshot),
   recent30Days:manifest};
  assertFullProgressBackup(file,live);
  // Snapshot must include every available journal receipt. No fragile
  // array-length check: distinct attemptId is the durable answer identity.
  const keys=new Set((file.state.formalAttemptLog||[]).map(e=>
   String(e?.attemptId||(e?.at+":"+e?.subject+":"+e?.questionId))));
  if(journal.some(e=>!keys.has(String(e?.attemptId||
      (e?.at+":"+e?.subject+":"+e?.questionId)))))
   throw Error("The exported answer history is incomplete.");
  const after=getState();
  if(snapshotKey(after)!==before)continue;
  const data=JSON.stringify(file,null,2);
  const parsed=JSON.parse(data);
  if(parsed.recent30Days.days.length!==30||
     parsed.state.daily.length!==10||
     parsed.recent30Days.through!==parsed.state.today)
   throw Error("The 30-day export failed validation.");
  return data;
 }
 throw Error("Learning progress changed while exporting. Please export again; no stale file was created.");
}
