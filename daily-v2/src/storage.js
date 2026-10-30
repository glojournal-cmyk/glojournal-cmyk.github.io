/* Daily V2 CAS persistence contract.
 * Production adapters MUST make compareAndSwap a single durable atomic transaction
 * (e.g. one IndexedDB readwrite transaction with a revision check).
 * The memory repository below is for tests only and MUST NOT be used in production.
 * Never update UI/XP/30-day history before an event receipt has verified readback.
 */
import {makeDailyV2Ledger,projectSavedDailyV2Attempt,summarizeDailyV2Task} from './ledger.js';
import {DAILY_V2_TASKS} from './planner.js';
import {isValidDailyV2Day} from './calendar.js';

const clone = value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
function requireV2(ok,msg){if(!ok)throw new Error('DailyV2 storage: '+msg);}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function record(day){return {revision:0,day,plan:null,ledger:makeDailyV2Ledger(day)};}
async function readRow(repo,day){
 requireV2(repo && typeof repo.read==='function' && typeof repo.compareAndSwap==='function','atomic repository required');
 const row=await repo.read(day);
 if(row===null||row===undefined)return record(day);
 requireV2(row.day===day&&row.ledger?.version===2&&row.ledger?.day===day&&
   (row.plan===null||row.plan===undefined||row.plan.day===day)&&
   Number.isInteger(row.revision)&&row.revision>=0,'invalid snapshot');
 return row;
}
function acceptedSummary(ledger,task){
 const kind=task.kind==='vocab'?'vocab':task.kind==='retention'?'retention':task.kind==='exam'?'exam':'ordinary';
 return summarizeDailyV2Task(ledger,{id:task.id,target:task.target,kind});
}
function persistedEvent(ledger,eventId){
 return ledger.attempts.find(e=>e.eventId===eventId)||null;
}
// A saved attempt is not automatically a newly earned credit. These values
// describe *this event's* persisted contribution, not the current total.
// Reward/XP integrations must use verified deltas, never "verified:true" alone.
function receiptDelta(before,after){
 const creditDelta=after.verifiedProgress-before.verifiedProgress;
 const examMarkDelta=(after.examMarks?.earned||0)-(before.examMarks?.earned||0);
 requireV2(creditDelta>=0&&creditDelta<=1&&examMarkDelta>=0,
  'INVALID_CREDIT_DELTA: progress must be monotonic and one question can credit at most once');
 return {creditDelta,examMarkDelta,newVerifiedCredit:creditDelta===1};
}
function validatePlan(plan){
 requireV2(plan?.version===2&&['ready','partial'].includes(plan.status)&&
   isValidDailyV2Day(plan.day)&&Array.isArray(plan.tasks)&&
   plan.tasks.length>0&&plan.tasks.length<=10&&plan.target===163,
   'only fully verified or explicitly staged partial plans can be frozen');
 const isPartial=plan.status==='partial';
 requireV2(isPartial?plan.stagingOnly===true&&plan.dailyComplete===false&&
     plan.tasks.length<10&&Number.isInteger(plan.availableTarget):
     plan.tasks.length===10,
   'partial plan must preserve missing tasks and full-day completion as false');
 const seen=new Set(),knownTasks=new Set();
 const expectedTasks=new Map(DAILY_V2_TASKS.map(t=>[t.id,t]));
 for(const task of plan.tasks){
  const expected=expectedTasks.get(task.id);
  requireV2(expected&&!knownTasks.has(task.id)&&task.kind===expected.kind&&task.target===expected.target,
   'invalid task identity, kind or target');
  knownTasks.add(task.id);
  requireV2(typeof task.id==='string'&&Number.isInteger(task.target)&&
     Array.isArray(task.questions)&&task.questions.length===task.target,'invalid plan task roster');
  // Distinct vocabulary question IDs can still translate to the SAME concept.
  // Freezing such a plan creates an impossible 30/30 Daily because Ledger
  // correctly awards at most one verified credit per vocabulary concept.
  const vocabConcepts=new Set();
  for(const q of task.questions){
   if(task.kind==='exam')requireV2([1,2,3].includes(q.marks),'exam question maximum marks missing');
   requireV2(typeof q.questionId==='string'&&q.questionId.length>0&&!seen.has(q.questionId),
      'invalid or duplicated locked question');
   if(q.sourceFingerprint!==undefined)requireV2(
      typeof q.sourceFingerprint==='string'&&/^fnv1a32-[0-9a-f]{8}$/.test(q.sourceFingerprint),
      'INVALID_SOURCE_FINGERPRINT: roster source binding must be well-formed');
   if(task.kind==='vocab'){
    const concept=q.conceptId;
    requireV2(typeof concept==='string'&&concept.trim().length>0&&
      concept===concept.trim()&&!vocabConcepts.has(concept),
      'VOCAB_CONCEPT_ROSTER_INVALID: 30 independently creditable concepts required');
    vocabConcepts.add(concept);
   }
   seen.add(q.questionId);
  }
 }
 const exam=plan.tasks.find(t=>t.kind==='exam');
 if(exam)requireV2(exam.questions.map(q=>q.marks).join(',')==='1,2,3',
   'GCSE 1/2/3 marks quota missing');
 else requireV2(isPartial,'full daily plan missing GCSE task');
 if(isPartial){
  const missing=DAILY_V2_TASKS.filter(t=>!knownTasks.has(t.id));
  requireV2(Array.isArray(plan.unavailable)&&plan.unavailable.length===missing.length
    &&plan.unavailable.length===plan.blockedTasksCount,
    'partial plan missing explicit blocked task list');
  const unavailable=new Set();
  for(const task of plan.unavailable){
   requireV2(missing.some(t=>t.id===task.id&&t.target===task.target)
    &&!unavailable.has(task.id)&&Array.isArray(task.reasonCodes)
    &&task.reasonCodes.length>0,'invalid or duplicated unavailable task');
   unavailable.add(task.id);
  }
  requireV2(plan.availableTarget===seen.size&&plan.availableTarget<163
   &&unavailable.size+knownTasks.size===DAILY_V2_TASKS.length,
   'partial plan may not fake 163/163 or omit blocked tasks');
 }else requireV2(knownTasks.size===DAILY_V2_TASKS.length && seen.size===plan.target,
  'plan does not contain the exact 163 assigned questions');
}
export async function commitDailyV2Plan(repo,plan,{legacyBaselines={},maxRetries=5,allowPartial=false}={}){
 if(plan?.status==='partial')requireV2(allowPartial===true,
  'PARTIAL_REQUIRES_EXPLICIT_STAGING_OPT_IN');
 validatePlan(plan);
 const targetByTask=new Map(plan.tasks.map(task=>[task.id,task.target]));
 for(const [taskId,baseline] of Object.entries(legacyBaselines||{})){
  const target=targetByTask.get(taskId);
  requireV2(Number.isInteger(target)&&Number.isInteger(baseline?.count)&&
    baseline.count>=0&&baseline.count<=target,
    'LEGACY_BASELINE_TARGET_INVALID: cannot freeze excess or unknown task credits');
 }
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
 // Do not accidentally treat a staging score preview or unapproved manual
 // review as a trusted graded attempt. This is a misuse guard, NOT
 // authentication: the future production caller must independently verify
 // scorer identity and authorisation before invoking this low-level writer.
 requireV2(attempt?.releaseGrade!==false&&attempt?.ledgerEligible!==false&&
   attempt?.persisted!==false&&
   !['staging-uncredited-preview','staging-review-required','review-required',
     'staging-review-recorded','staging-preview'].includes(attempt?.status),
   'NON_AUTHORITATIVE_SCORING_PREVIEW: cannot persist or reward a staged grade');
 requireV2(attempt&&isValidDailyV2Day(attempt.day)&&typeof attempt.taskId==='string','answer metadata missing or invalid date');
 for(let i=0;i<maxRetries;i++){
  const row=await readRow(repo,attempt.day);
  requireV2(row.plan?.version===2&&['ready','partial'].includes(row.plan.status),
   'NO_FROZEN_DAILY_PLAN: answer not accepted');
  const task=row.plan.tasks.find(t=>t.id===attempt.taskId);
  requireV2(task,'answer task not present in frozen plan');
  const question=task.questions.find(q=>q.questionId===attempt.questionId);
  requireV2(question,'answer question not assigned to this task');
  // Until a separately audited, authoritative scorer can issue a source-bound
  // verification receipt, NEVER trust caller-supplied "correct"/marks for a
  // real signed question. A caller could strip staging metadata otherwise.
  // The old unsigned synthetic/legacy storage contract remains testable.
  requireV2(question.sourceFingerprint===undefined,
    'SOURCE_BOUND_GRADE_RELEASE_NOT_APPROVED: signed roster requires trusted scorer integration');
  if(task.kind==='vocab')requireV2(attempt.conceptId===question.conceptId,'answer concept does not match frozen roster');
  if(task.kind==='exam'){
   requireV2(Number.isInteger(attempt.marksEarned)&&
      Number.isInteger(attempt.marksPossible)&&attempt.marksPossible===question.marks&&
      attempt.marksEarned>=0&&attempt.marksEarned<=question.marks,
      'EXAM_MARKS_MISMATCH: grading must match frozen maximum marks');
   requireV2(attempt.correct===(attempt.marksEarned===question.marks),
      'EXAM_CORRECTNESS_INCONSISTENT_WITH_MARKS');
  }else requireV2(attempt.marksEarned===undefined&&attempt.marksPossible===undefined,
    'non-exam answer cannot forge GCSE marks');

  // This pure normalization rejects invalid answer-event identity or marks,
  // regardless of whether the storage adapter later accepts the write.
  const nextLedger=projectSavedDailyV2Attempt(row.ledger,attempt);
  if(nextLedger===row.ledger){
   const saved=persistedEvent(row.ledger,attempt.eventId);
   requireV2(saved,'IDEMPOTENT_EVENT_MISSING');
   return {eventId:attempt.eventId,verified:true,alreadyRecorded:true,revision:row.revision,
     progress:acceptedSummary(row.ledger,task),
     creditDelta:0,examMarkDelta:0,newVerifiedCredit:false};
  }
  const delta=receiptDelta(acceptedSummary(row.ledger,task),acceptedSummary(nextLedger,task));
  const update={...row,revision:row.revision+1,ledger:nextLedger};
  const success=await repo.compareAndSwap(attempt.day,row.revision,update);
  if(!success)continue;
  const check=await readRow(repo,attempt.day);
  const event=persistedEvent(check.ledger,attempt.eventId);
  requireV2(event && same(event,persistedEvent(nextLedger,attempt.eventId)),
    'ANSWER_SAVE_NOT_VERIFIED: do not grant credit or XP');
  return {eventId:attempt.eventId,verified:true,alreadyRecorded:false,revision:check.revision,
    progress:acceptedSummary(check.ledger,task),...delta};
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
