/* Scholar's Garden Daily V2 — STAGING-ONLY continuity plan.
 * A single short bank must NOT prevent the other fully prepared tasks from
 * being available. This module never reduces the full-day 163 question target,
 * auto-awards credit, or downgrades Mastery. It cannot be called on an unsafe
 * source catalog and cannot bypass the per-task shortage diagnostic.
 *
 * Production rollout is NOT authorized. commitDailyV2Plan requires a separate
 * explicit allowPartial:true flag, and old plans cannot be silently replaced.
 */
import {DAILY_V2_TASKS} from './planner.js';
export function createDailyV2ContinuityPlan(preflight) {
 if(preflight?.version!==2||preflight.status!=='blocked'||typeof preflight.day!=='string'
   ||preflight.preflight?.globallyUnsafe===true)
  throw new Error('DailyV2 continuity: requires a safe but partially blocked preflight');
 if(!Array.isArray(preflight.eligibleTasks)||!Array.isArray(preflight.availability)
    ||preflight.availability.length!==DAILY_V2_TASKS.length)
  throw new Error('DailyV2 continuity: missing per-task availability proof');
 const allowed=new Map(DAILY_V2_TASKS.map(t=>[t.id,t]));
 const ready=new Set();
 let actualCount=0;
 const questionIds=new Set();
 const tasks=preflight.eligibleTasks.map(task=>{
  const def=allowed.get(task.id);
  if(!def||ready.has(task.id)||def.kind!==task.kind||def.target!==task.target
     ||!Array.isArray(task.questions)||task.questions.length!==def.target)
   throw new Error('DailyV2 continuity: incomplete or repeated task');
  ready.add(task.id);
  for(const question of task.questions){
   if(typeof question.questionId!=='string'||!question.questionId
      ||questionIds.has(question.questionId))
    throw new Error('DailyV2 continuity: duplicated or missing question');
   questionIds.add(question.questionId);
  }
  actualCount+=task.questions.length;
  return JSON.parse(JSON.stringify(task));
 });
 if(!tasks.length||tasks.length===DAILY_V2_TASKS.length)
  throw new Error('DailyV2 continuity: partial day must contain 1..9 ready tasks');
 const unavailable=DAILY_V2_TASKS.filter(t=>!ready.has(t.id)).map(t=>{
  const diagnostic=preflight.availability.find(a=>a.taskId===t.id);
  if(diagnostic?.state!=='unavailable'||!Array.isArray(diagnostic.reasonCodes)
     ||!diagnostic.reasonCodes.length)
   throw new Error('DailyV2 continuity: missing specific shortage evidence for '+t.id);
  return {id:t.id,target:t.target,reasonCodes:[...diagnostic.reasonCodes]};
 });
 for(const task of tasks){
  if(preflight.availability.find(a=>a.taskId===task.id)?.state!=='available')
   throw new Error('DailyV2 continuity: declared task unavailable');
 }
 return {
  version:2,day:preflight.day,status:'partial',target:163,
  availableTarget:actualCount,
  tasks,unavailable,
  // An explicitly visible incomplete day: blocked tasks remain NOT DONE,
  // do not influence task-completion percentages or XP rewards.
  dailyComplete:false,stagingOnly:true,blockedTasksCount:unavailable.length,
  diagnostics:JSON.parse(JSON.stringify(preflight.diagnostics||[]))
 };
}