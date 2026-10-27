// Garden Version 2 ONLY. Pure immutable scoring ledger; never accesses browser storage or current app.
const validId = value => typeof value === 'string' && value.trim().length > 0;
const validMark = value => Number.isInteger(value) && value >= 0;
const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);

export function emptyV2Ledger() {
  return {version:2,receipts:{},tasks:{}};
}

// A receipt is uniquely identified by task+question, not by individual retry event.
// Correct credit is monotonic. Incorrect attempts never revoke earned credit.
// XP is a separate idempotent award supplied only by an explicitly defined scoring policy.
export function recordV2Answer(ledger,answer) {
  if (!ledger || ledger.version !== 2 || !ledger.receipts || !ledger.tasks)
    throw new TypeError('Garden V2 ledger required');
  const {taskId,questionId,correct,maxMarks=1,earnedMarks=correct?maxMarks:0,awardXp=0} = answer ?? {};
  if (![taskId,questionId].every(validId) || typeof correct !== 'boolean' ||
      !validMark(maxMarks) || maxMarks === 0 || !validMark(earnedMarks) ||
      earnedMarks > maxMarks || !validMark(awardXp) ||
      (correct && earnedMarks !== maxMarks) || (!correct && earnedMarks===maxMarks))
    throw new TypeError('Invalid Garden V2 answer receipt');
  const key=JSON.stringify([taskId,questionId]);
  const previous=ledger.receipts[key];
  if (previous && previous.maxMarks !== maxMarks)
    throw new Error('Cannot change maximum marks for previously recorded question');
  const awardedNow=!previous?.correct && correct;
  const previousMarks=previous?.earnedMarks??0;
  const receipt={
    taskId,questionId,maxMarks,
    earnedMarks:Math.max(previousMarks,earnedMarks),
    correct:Boolean(previous?.correct||correct),
    xpAwarded:(previous?.xpAwarded??0)+(awardedNow?awardXp:0)
  };
  // Same verified answer replay cannot increase marks or XP.
  const receipts={...ledger.receipts,[key]:receipt};
  const tasks={...ledger.tasks};
  const task=tasks[taskId]??{questionIds:[],earnedMarks:0,xp:0};
  tasks[taskId]={
    ...task,
    questionIds:task.questionIds.includes(questionId)?[...task.questionIds]:[...task.questionIds,questionId],
    earnedMarks:task.earnedMarks+(receipt.earnedMarks-previousMarks),
    xp:task.xp+(awardedNow?awardXp:0)
  };
  return {ledger:{version:2,receipts,tasks},newCredit:receipt.earnedMarks-previousMarks,
    newXp:awardedNow?awardXp:0,alreadyCorrect:Boolean(previous?.correct)};
}

export function summarizeV2Task(ledger,taskId,target) {
  if(!validId(taskId)||!Number.isInteger(target)||target<1)throw new TypeError('Invalid V2 task');
  const ids=Object.values(ledger.receipts).filter(r=>r.taskId===taskId&&r.correct);
  const credited=ids.length;
  return {taskId,target,credited,remaining:Math.max(0,target-credited),
    complete:credited>=target,earnedMarks:ledger.tasks[taskId]?.earnedMarks??0,
    xp:ledger.tasks[taskId]?.xp??0};
}
