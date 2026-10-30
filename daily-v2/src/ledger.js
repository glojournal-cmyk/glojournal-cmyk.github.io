/* Daily V2 source-of-truth pure projection core.
 * This module NEVER writes to storage; call projectSavedDailyV2Attempt ONLY
 * after a durable storage adapter has confirmed a persisted event.
 * Opaque legacy baselines deliberately DO NOT auto-credit fresh events until
 * historical identity reconciliation prevents double-counting.
 */

import {isValidDailyV2Day} from './calendar.js';

function dailyV2Require(ok,message){if(!ok)throw new Error(`DailyV2: ${message}`);}

export function makeDailyV2Ledger(day, legacyBaselines={}){
  dailyV2Require(isValidDailyV2Day(day),"day must be a real YYYY-MM-DD calendar date");
  const baseline={};
  for(const [taskId,v] of Object.entries(legacyBaselines)){
    dailyV2Require(taskId.length>0,"baseline task ID required");
    dailyV2Require(Number.isInteger(v?.count)&&v.count>=0,"baseline count invalid");
    dailyV2Require(Array.isArray(v?.knownKeys),"baseline knownKeys array required");
    const knownKeys=[...new Set(v.knownKeys.map(String))];
    const potentialLegacyKeys=Array.isArray(v.potentialLegacyKeys)?
      [...new Set(v.potentialLegacyKeys.map(String))]:[];
    const trusted=v.potentialKeysVerified===true &&
      typeof v.potentialKeysSource==='string'&&v.potentialKeysSource.length>0;
    dailyV2Require(!trusted || (potentialLegacyKeys.length>=v.count &&
      knownKeys.every(k=>potentialLegacyKeys.includes(k))),
      "verified potential legacy keys must cover the historical credit count and known keys");
    baseline[taskId]={count:v.count,knownKeys,potentialLegacyKeys,
      potentialKeysVerified:trusted,potentialKeysSource:trusted?v.potentialKeysSource:null};
  }
  return {version:2,day:String(day),attempts:[],legacyBaselines:baseline};
}

export function projectSavedDailyV2Attempt(ledger,attempt){
  dailyV2Require(ledger?.version===2,"ledger version incompatible");
  const required=["eventId","day","taskId","questionId"];
  for(const key of required)dailyV2Require(typeof attempt?.[key]==="string"&&attempt[key].trim().length>0,`missing ${key}`);
  dailyV2Require(isValidDailyV2Day(attempt.day)&&attempt.day===ledger.day,"event date does not match ledger");
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
  const possibleOldKeys=new Set(b.potentialLegacyKeys||[]);
  const trustedOldUniverse=b.potentialKeysVerified===true&&possibleOldKeys.size>=b.count&&
    [...oldKeys].every(k=>possibleOldKeys.has(k));
  const fresh=new Set(),examBest=new Map();
  let examEarned=0,examPossible=0;
  for(const a of ledger.attempts){
    if(a.taskId!==task.id||a.day!==ledger.day)continue;
    const key=task.kind==="vocab"?a.conceptId:a.questionId;
    dailyV2Require(typeof key==="string"&&key.length>0,"vocabulary events require conceptId");
    if(task.kind==="exam"){
      if(a.marksEarned===null||a.marksPossible===null)continue;
      const previous=examBest.get(key);
      dailyV2Require(!previous||previous.possible===a.marksPossible,
        "conflicting exam maximum marks for the same question");
      // A genuine retry can improve partial marks. Count one question once,
      // but award its best verified score, regardless of event replay order.
      if(!previous||a.marksEarned>previous.earned)
        examBest.set(key,{earned:a.marksEarned,possible:a.marksPossible});
      if(!oldKeys.has(key))fresh.add(key);
    }else if(a.correct&&!oldKeys.has(key))fresh.add(key);
  }
  for(const result of examBest.values()){
    examEarned+=result.earned;
    examPossible+=result.possible;
  }
  // Opaque old credits can progress ONLY when an independently VERIFIED
  // superset of all potentially credited legacy keys is available. Any new
  // key outside that superset is provably distinct; never infer the missing
  // old correct identities themselves.
  const newVerified=[...fresh].filter(k=>!opaque||(trustedOldUniverse&&!possibleOldKeys.has(k)));
  const unverifiedCount=fresh.size-newVerified.length;
  const verifiedProgress=Math.min(task.target,b.count+newVerified.length);
  return {
    taskId:task.id,target:task.target,verifiedProgress,
    complete:verifiedProgress===task.target,
    newDistinctCredits:fresh.size,
    legacyCredits:b.count,
    requiresLegacyReconciliation:opaque,
    trustedLegacyExclusionUniverse:trustedOldUniverse,
    newVerifiedDistinctCredits:newVerified.length,
    pendingUnreconciledCredits:unverifiedCount,
    examMarks:task.kind==="exam"?{earned:examEarned,possible:examPossible}:null
  };
}
