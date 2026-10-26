/* Daily V2 source-of-truth pure projection core.
 * This module NEVER writes to storage; call projectSavedDailyV2Attempt ONLY
 * after a durable storage adapter has confirmed a persisted event.
 * Opaque legacy baselines deliberately DO NOT auto-credit fresh events until
 * historical identity reconciliation prevents double-counting.
 */

function dailyV2Require(ok,message){if(!ok)throw new Error(`DailyV2: ${message}`);}

export function makeDailyV2Ledger(day, legacyBaselines={}){
  dailyV2Require(/^\d{4}-\d{2}-\d{2}$/.test(String(day)),"day must be YYYY-MM-DD");
  const baseline={};
  for(const [taskId,v] of Object.entries(legacyBaselines)){
    dailyV2Require(taskId.length>0,"baseline task ID required");
    dailyV2Require(Number.isInteger(v?.count)&&v.count>=0,"baseline count invalid");
    dailyV2Require(Array.isArray(v?.knownKeys),"baseline knownKeys array required");
    baseline[taskId]={count:v.count,knownKeys:[...new Set(v.knownKeys.map(String))]};
  }
  return {version:2,day:String(day),attempts:[],legacyBaselines:baseline};
}

export function projectSavedDailyV2Attempt(ledger,attempt){
  dailyV2Require(ledger?.version===2,"ledger version incompatible");
  const required=["eventId","day","taskId","questionId"];
  for(const key of required)dailyV2Require(typeof attempt?.[key]==="string"&&attempt[key].trim().length>0,`missing ${key}`);
  dailyV2Require(attempt.day===ledger.day,"event date does not match ledger");
  dailyV2Require(typeof attempt.correct==="boolean","event correct must be boolean");
  if(attempt.marksEarned!==undefined||attempt.marksPossible!==undefined){
    dailyV2Require(Number.isFinite(attempt.marksEarned)&&Number.isFinite(attempt.marksPossible)&&attempt.marksPossible>0&&attempt.marksEarned>=0&&attempt.marksEarned<=attempt.marksPossible,"marks invalid");
  }
  const normalized={
    eventId:attempt.eventId,day:attempt.day,taskId:attempt.taskId,
    questionId:attempt.questionId,conceptId:attempt.conceptId||null,
    correct:attempt.correct,
    marksEarned:attempt.marksEarned??null,
    marksPossible:attempt.marksPossible??null
  };
  const existing=ledger.attempts.find(a=>a.eventId===normalized.eventId);
  if(existing){
    dailyV2Require(JSON.stringify(existing)===JSON.stringify(normalized),"conflicting replay of event ID");
    return ledger;
  }
  return {...ledger,attempts:[...ledger.attempts,normalized]};
}

export function summarizeDailyV2Task(ledger,task){
  dailyV2Require(ledger?.version===2,"ledger version incompatible");
  dailyV2Require(typeof task?.id==="string"&&task.id.length>0,"task ID required");
  dailyV2Require(Number.isInteger(task.target)&&task.target>=1,"target must be positive integer");
  dailyV2Require(["vocab","ordinary","retention","exam"].includes(task.kind),"unknown task kind");
  const b=ledger.legacyBaselines?.[task.id]||{count:0,knownKeys:[]};
  const oldKeys=new Set(b.knownKeys);
  const opaque=b.count>oldKeys.size;
  const fresh=new Set(),seen=new Set();
  let examEarned=0,examPossible=0;
  for(const a of ledger.attempts){
    if(a.taskId!==task.id||a.day!==ledger.day)continue;
    const key=task.kind==="vocab"?a.conceptId:a.questionId;
    dailyV2Require(typeof key==="string"&&key.length>0,"vocabulary events require conceptId");
    if(task.kind==="exam"){
      if(a.marksEarned===null||a.marksPossible===null||seen.has(key))continue;
      seen.add(key);
      examEarned+=a.marksEarned;examPossible+=a.marksPossible;
      if(!oldKeys.has(key))fresh.add(key);
    }else if(a.correct&&!oldKeys.has(key))fresh.add(key);
  }
  const verifiedProgress=Math.min(task.target,b.count+(opaque?0:fresh.size));
  return {
    taskId:task.id,target:task.target,verifiedProgress,
    complete:verifiedProgress===task.target,
    newDistinctCredits:fresh.size,
    legacyCredits:b.count,
    requiresLegacyReconciliation:opaque,
    pendingUnreconciledCredits:opaque?fresh.size:0,
    examMarks:task.kind==="exam"?{earned:examEarned,possible:examPossible}:null
  };
}
