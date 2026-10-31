/* Scholar's Garden Daily V2 — pure authoritative Home/Daily projection.
 * Do not derive Home progress from UI state or individual mini-quiz counters.
 * This summarizes VERIFIED ledger events and preserves unavailable tasks as
 * unavailable, NEVER as "done", "0/target attempted", or earned XP.
 */
import {DAILY_V2_TASKS} from './planner.js';
import {summarizeDailyV2Task} from './ledger.js';
const kindFor=t=>t.kind==='vocab'?'vocab':t.kind==='exam'?'exam':t.kind==='retention'?'retention':'ordinary';
export function summarizeDailyV2Day(plan,ledger){
 if(plan?.version!==2||!['ready','partial'].includes(plan.status)||
    ledger?.version!==2||plan.day!==ledger.day)
   throw new Error('DailyV2 projection: mismatched plan or ledger');
 if(!Array.isArray(plan.tasks)||plan.target!==163)
   throw new Error('DailyV2 projection: invalid task manifest');
 const active=new Map(plan.tasks.map(t=>[t.id,t]));
 const blocked=new Map((plan.unavailable||[]).map(t=>[t.id,t]));
 const rows=DAILY_V2_TASKS.map(t=>{
  const task=active.get(t.id);
  if(!task){
   const reason=blocked.get(t.id);
   if(plan.status!=='partial'||!reason||!Array.isArray(reason.reasonCodes))
    throw new Error('DailyV2 projection: missing unavailable task evidence');
   return {taskId:t.id,state:'unavailable',target:t.target,
    verifiedProgress:0,earnedCredits:0,reasonCodes:[...reason.reasonCodes],
    completed:false};
  }
  const progress=summarizeDailyV2Task(ledger,{id:task.id,target:task.target,kind:kindFor(task)});
  return {taskId:t.id,state:progress.complete?'complete':'available',
   target:t.target,verifiedProgress:progress.verifiedProgress,
   earnedCredits:progress.newVerifiedDistinctCredits??progress.newDistinctCredits,
   completed:progress.complete,
   requiresLegacyReconciliation:progress.requiresLegacyReconciliation,
   pendingUnreconciledCredits:progress.pendingUnreconciledCredits,
   ...(progress.examMarks?{examMarks:progress.examMarks}:{})
  };
 });
 const allPresent=plan.status==='ready'&&active.size===DAILY_V2_TASKS.length;
 const totalVerified=rows.reduce((n,t)=>n+t.verifiedProgress,0);
 const completedTasks=rows.filter(t=>t.completed).length;
 return {
  day:plan.day,planStatus:plan.status,fullDayTarget:163,
  availableTarget:plan.status==='partial'?plan.availableTarget:163,
  totalVerified,
  completedTasks,
  expectedTasks:10,
  unavailableTasks:rows.filter(t=>t.state==='unavailable').length,
  fullDayComplete:allPresent&&completedTasks===10,
  fullDayRewardEligible:allPresent&&completedTasks===10,
  // A client must not interpret 160/160 in a partial day as 163/163.
  tasks:rows
 };
}
