/* Daily V2 CAS persistence contract.
 * Production adapters MUST make compareAndSwap a single durable atomic transaction
 * (e.g. one IndexedDB readwrite transaction with a revision check).
 * The memory repository below is for tests only and MUST NOT be used in production.
 * Never update UI/XP/30-day history before an event receipt has verified readback.
 */
import {makeDailyV2Ledger,projectSavedDailyV2Attempt,summarizeDailyV2Task} from './ledger.js';

const clone = value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
function requireV2(ok,msg){if(!ok)throw new Error('DailyV2 storage: '+msg);}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function record(day){return {revision:0,day,plan:null,ledger:makeDailyV2Ledger(day)};}
async function readRow(repo,day){
 requireV2(repo && typeof repo.read==='function' && typeof repo.compareAndSwap==='function','atomic repository required');
 const row=await repo.read(day);
 if(row===null||row===undefined)return record(day);
 requireV2(row.day===day&&row.ledger?.version===2&&Number.isInteger(row.revision)&&row.revision>=0,'invalid snapshot');
 return row;
}
function acceptedSummary(ledger,task){
 const kind=task.kind==='vocab'?'vocab':task.kind==='retention'?'retention':task.kind==='exam'?'exam':'ordinary';
 return summarizeDailyV2Task(ledger,{id:task.id,target:task.target,kind});
}
function persistedEvent(ledger,eventId){
 return ledger.attempts.find(e=>e.eventId===eventId)||null;
}
function validatePlan(plan){
 requireV2(plan?.version===2&&plan.status==='ready'&&typeof plan.day==='string'&&
   Array.isArray(plan.tasks)&&plan.tasks.length===10&&plan.target===163,
   'only fully verified ten-task plans can be frozen');
 const seen=new Set();
 for(const task of plan.tasks){
  requireV2(typeof task.id==='string'&&Number.isInteger(task.target)&&
     Array.isArray(task.questions)&&task.questions.length===task.target,'invalid plan task roster');
  for(const q of task.questions){
   requireV2(typeof q.questionId==='string'&&q.questionId.length>0&&!seen.has(q.questionId),
      'invalid or duplicated locked question');
   seen.add(q.questionId);
  }
 }
}
export async function commitDailyV2Plan(repo,plan,{legacyBaselines={},maxRetries=5}={}){
 validatePlan(plan);
 for(let i=0;i<maxRetries;i++){
  const row=await readRow(repo,plan.day);
  if(row.plan){
   requireV2(same(row.plan,plan),'FROZEN_PLAN_CONFLICT: cannot replace an existing plan');
   return {alreadyFrozen:true,revision:row.revision,plan:clone(row.plan)};
  }
  const newLedger=row.revision===0 && !row.ledger.attempts.length?
    makeDailyV2Ledger(plan.day,legacyBaselines):row.ledger;
  const update={revision:row.revision+1,day:plan.day,plan:clone(plan),ledger:newLedger};
  const success=await repo.compareAndSwap(plan.day,row.revision,update);
  if(!success)continue;
  const check=await readRow(repo,plan.day);
  requireV2(check.revision>=update.revision&&check.plan&&same(check.plan,plan),
    'PLAN_SAVE_NOT_VERIFIED: reload required before quiz starts');
  return {alreadyFrozen:false,revision:check.revision,plan:clone(check.plan)};
 }
 throw new Error('DailyV2 storage: VERSION_CONFLICT: plan save retries exhausted');
}
export async function commitDailyV2Answer(repo,attempt,{maxRetries=8}={}){
 requireV2(attempt&&typeof attempt.day==='string'&&typeof attempt.taskId==='string','answer metadata missing');
 for(let i=0;i<maxRetries;i++){
  const row=await readRow(repo,attempt.day);
  requireV2(row.plan?.version===2&&row.plan?.status==='ready','NO_FROZEN_DAILY_PLAN: answer not accepted');
  const task=row.plan.tasks.find(t=>t.id===attempt.taskId);
  requireV2(task,'answer task not present in frozen plan');
  const question=task.questions.find(q=>q.questionId===attempt.questionId);
  requireV2(question,'answer question not assigned to this task');
  if(task.kind==='vocab')requireV2(attempt.conceptId===question.conceptId,'answer concept does not match frozen roster');
  // This pure normalization rejects invalid answer-event identity or marks,
  // regardless of whether the storage adapter later accepts the write.
  const nextLedger=projectSavedDailyV2Attempt(row.ledger,attempt);
  if(nextLedger===row.ledger){
   const saved=persistedEvent(row.ledger,attempt.eventId);
   requireV2(saved,'IDEMPOTENT_EVENT_MISSING');
   return {eventId:attempt.eventId,verified:true,alreadyRecorded:true,revision:row.revision,
     progress:acceptedSummary(row.ledger,task)};
  }
  const update={...row,revision:row.revision+1,ledger:nextLedger};
  const success=await repo.compareAndSwap(attempt.day,row.revision,update);
  if(!success)continue;
  const check=await readRow(repo,attempt.day);
  const event=persistedEvent(check.ledger,attempt.eventId);
  requireV2(event && same(event,persistedEvent(nextLedger,attempt.eventId)),
    'ANSWER_SAVE_NOT_VERIFIED: do not grant credit or XP');
  return {eventId:attempt.eventId,verified:true,alreadyRecorded:false,revision:check.revision,
    progress:acceptedSummary(check.ledger,task)};
 }
 throw new Error('DailyV2 storage: VERSION_CONFLICT: answer write retries exhausted');
}

/** TEST ONLY. Volatile, no disk backup, no iPad reliability guarantees. */
export function createMemoryDailyV2Repository({failWrites=0}={}){
 const rows=new Map();let remaining=failWrites;
 return {
  async read(day){return clone(rows.get(day)||null);},
  async compareAndSwap(day,expectedRevision,next){
   if(remaining>0){remaining--;throw new Error('SIMULATED_STORAGE_FAILURE');}
   const now=rows.get(day),actual=now?.revision??0;
   if(expectedRevision!==actual)return false;
   rows.set(day,clone(next));return true;
  },
  /** QA-only visibility. */
  readOnlySnapshot(day){return clone(rows.get(day)||null);}
 };
}
