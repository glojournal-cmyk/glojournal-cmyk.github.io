/* Isolated Daily V2 QA session controller.
 * Use synthetic fixture only. No real student bank, XP or legacy storage reads.
 */
import {createStagingFixture,STAGING_DAY,STAGING_EXPECTED} from './qa-fixture.js';
import {planDailyV2} from '../src/planner.js';
import {createDailyV2ContinuityPlan} from '../src/continuity.js';
import {commitDailyV2Plan,commitDailyV2Answer} from '../src/storage.js';
import {summarizeDailyV2Day} from '../src/day-summary.js';

export function qaDatabaseName(scenario){
 if(!['ready','missing-gcse'].includes(scenario))throw Error('Invalid QA scenario');
 return 'scholar-daily-v2-staging-ui-'+scenario;
}
export async function readQaSession(repo,day=STAGING_DAY){
 const row=await repo.read(day);
 if(!row?.plan)return null;
 return {plan:row.plan,ledger:row.ledger,summary:summarizeDailyV2Day(row.plan,row.ledger)};
}
export async function openQaSession(repo,{scenario='ready',day=STAGING_DAY}={}){
 const fixture=createStagingFixture({scenario,day});
 let plan=planDailyV2(fixture);
 if(plan.status==='blocked')plan=createDailyV2ContinuityPlan(plan);
 await commitDailyV2Plan(repo,plan,{allowPartial:plan.status==='partial'});
 const session=await readQaSession(repo,day);
 if(!session)throw Error('QA plan was not persisted');
 return session;
}
export function nextQaQuestion(plan,ledger,taskId){
 const task=plan?.tasks?.find(t=>t.id===taskId);
 if(!task)return null;
 if(task.kind==='exam'){
  // Give unseen questions first. Once the three have been marked, allow a
  // partial-score retry. A retry can improve MARKS but not question credits.
  const best=new Map();
  for(const a of ledger?.attempts||[]){
   if(a.taskId!==taskId||!Number.isInteger(a.marksEarned))continue;
   best.set(a.questionId,Math.max(best.get(a.questionId)??-1,a.marksEarned));
  }
  return task.questions.find(q=>!best.has(q.questionId))||
    task.questions.find(q=>best.get(q.questionId)<q.marks)||null;
 }
 const credited=new Set((ledger?.attempts||[]).filter(a=>a.taskId===taskId&&a.correct===true)
  .map(a=>a.questionId));
 return task.questions.find(q=>!credited.has(q.questionId))||null;
}
export async function commitQaAttempt(repo,{
 day=STAGING_DAY,eventId,taskId,questionId,answerText='',marksEarned
}={}){
 if(typeof eventId!=='string'||!eventId)throw Error('QA attempt requires stable eventId');
 const session=await readQaSession(repo,day);
 if(!session)throw Error('QA session has not been initialized');
 const task=session.plan.tasks.find(t=>t.id===taskId);
 const question=task?.questions.find(q=>q.questionId===questionId);
 if(!question)throw Error('QA question is not assigned to an available task');
 let correct=false;
 const attempt={eventId,day,taskId,questionId,conceptId:question.conceptId||null};
 if(task.kind==='exam'){
  if(!Number.isInteger(marksEarned)||marksEarned<0||marksEarned>question.marks)
   throw Error('QA marks must be between 0 and the frozen question maximum');
  attempt.marksEarned=marksEarned;attempt.marksPossible=question.marks;
  correct=marksEarned===question.marks;
 }else{
  correct=String(answerText).trim().toUpperCase()===STAGING_EXPECTED;
 }
 attempt.correct=correct;
 return commitDailyV2Answer(repo,attempt);
}
