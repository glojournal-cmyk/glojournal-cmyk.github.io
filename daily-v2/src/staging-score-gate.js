/**
 * Staging-only read-through scorer for an already frozen Daily V2 roster.
 *
 * This intentionally NEVER calls commitDailyV2Answer / compareAndSwap.
 * A deterministic score, even of an approved rubric, does not constitute
 * curriculum authorisation or an XP/MP release receipt.
 */
import {fingerprintDailyV2Source} from './bank-adapter.js';
import {previewDailyV2ObjectiveScore} from './objective-scorer.js';
import {isValidDailyV2Day} from './calendar.js';

function requireGate(value,message){
 if(!value)throw new Error('DailyV2 staged score: '+message);
}
export async function previewFrozenDailyV2ObjectiveSubmission(repo,{
 day,taskId,questionId,topic,question,response
}={}){
 requireGate(repo&&typeof repo.read==='function','READ_ONLY_REPOSITORY_REQUIRED');
 requireGate(isValidDailyV2Day(day)&&typeof taskId==='string'&&taskId.trim()&&
  typeof questionId==='string'&&questionId.trim(),'INVALID_SUBMISSION_IDENTITY');
 const snapshot=await repo.read(day);
 requireGate(snapshot?.day===day&&Number.isInteger(snapshot.revision)&&
  snapshot.revision>=1&&snapshot.plan?.version===2&&snapshot.plan.day===day&&
  ['ready','partial'].includes(snapshot.plan.status)&&
  snapshot.ledger?.day===day,'NO_VALID_FROZEN_DAILY_PLAN');
 const task=snapshot.plan.tasks?.find(x=>x.id===taskId);
 requireGate(task&&Array.isArray(task.questions),'TASK_NOT_IN_FROZEN_ROSTER');
 const frozen=task.questions.find(x=>x.questionId===questionId);
 requireGate(frozen,'QUESTION_NOT_IN_FROZEN_ROSTER');
 requireGate(typeof frozen.sourceFingerprint==='string'&&
  /^fnv1a32-[0-9a-f]{8}$/.test(frozen.sourceFingerprint),
  'SOURCE_FINGERPRINT_MISSING_FROM_FROZEN_ROSTER');
 requireGate(topic?.topicId===frozen.topicId&&topic.subject===frozen.subject&&
  Number(topic.year)===Number(frozen.year)&&question?.id===questionId&&
  question.topicId===topic.topicId,
  'FROZEN_QUESTION_IDENTITY_MISMATCH');
 requireGate(topic.status==='enabled'&&question.status!=='disabled'&&
  question.preview!==true&&question.formal!==false&&!question._repair,
  'QUESTION_SOURCE_NOT_ACTIVE');
 const actualFingerprint=fingerprintDailyV2Source(topic,question);
 requireGate(actualFingerprint===frozen.sourceFingerprint,
  'SOURCE_CHANGED_SINCE_FROZEN_PLAN');
 const result=previewDailyV2ObjectiveScore({topic,question,response});
 requireGate(result.sourceFingerprint===actualFingerprint&&
  result.releaseGrade===false&&result.ledgerEligible===false,
  'UNSAFE_OBJECTIVE_SCORING_RESULT');
 return {
  ...result,
  day,taskId,questionId,verifiedFrozenAssignment:true,
  frozenPlanRevision:snapshot.revision,
  // At this phase there is still no production grade and no durable receipt,
  // even when the original source's expected answer scores perfectly.
  status:result.reviewRequired?'staging-review-required':'staging-uncredited-preview',
  persisted:false,creditDelta:0,examMarkDelta:0,newVerifiedCredit:false,
  awardXP:false,awardMP:false,releaseGrade:false,ledgerEligible:false
 };
}
