// Date-scoped recovery ledger for daily tasks. Does not mutate today's task list.
// This module is deliberately independent from React and localStorage so callers
// must submit actual verified answer events, not clicks or page visits.
const DAY_MS = 86400000;
export const RECOVERY_IDS = new Set([
  'mistake-review','study-session','french-vocab','latin-vocab',
  'adaptive-focus','year8-long-review','y8-practise','y8-mastery',
  'tend-garden','play-game'
]);
export function validDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) return false;
  const n=Date.parse(day+'T12:00:00Z');
  return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===day;
}
export function recoveryAge(today, date) {
  if (!validDay(today)||!validDay(date)) return null;
  return Math.round((Date.parse(today+'T12:00:00Z')-Date.parse(date+'T12:00:00Z'))/DAY_MS);
}
export function canRecover(today,date) {
  const n=recoveryAge(today,date);
  return n===1||n===2;
}
export function eligibleRecoveryTasks(state,date,today) {
  if(!canRecover(today,date)) return [];
  const row=state?.dailyLog?.[date];
  // An absent row is not evidence of the actual personalized assignments.
  // The UI must display a separate, explicitly labelled fallback plan.
  const tasks=Array.isArray(row?.tasks)?row.tasks:[];
  return tasks.filter(t=>RECOVERY_IDS.has(t?.id)&&Number(t?.target)>0)
    .map(t=>({...t,remaining:Math.max(0,Number(t.target)-Number(t.progress||0)),
      done:!!t.done||Number(t.progress||0)>=Number(t.target)}));
}
export function recordRecoveryAnswer(state,{today,date,taskId,questionId,correct,minimumCorrect}) {
  if(!canRecover(today,date)||!RECOVERY_IDS.has(taskId)||
     !questionId||typeof correct!=='boolean') return {state,accepted:false,completed:false};
  const day=state?.dailyLog?.[date];
  const task=day?.tasks?.find(t=>t.id===taskId);
  // No historical task means no automatic credit: recover assignment first.
  if(!task||Number(task.target)<=0||task.done||Number(task.progress)>=Number(task.target))
    return {state,accepted:false,completed:false};
  const all=state.recoveryTaskByDay||{},forDay=all[date]||{},old=forDay[taskId]||{};
  if(old.completed) return {state,accepted:false,completed:true};
  const baseline=Math.max(0,Math.min(Number(task.target),Number(old.originalCount??task.progress)||0));
  const required=Math.max(1,Number(old.totalNeeded)||Number(minimumCorrect)||Number(task.target)-baseline);
  const items={...(old.items||{})};
  items[String(questionId)]=correct||items[String(questionId)]===true;
  const count=Object.values(items).filter(Boolean).length;
  const completed=count>=required;
  const proof={...old,items,originalCount:baseline,totalNeeded:required,completed};
  const patch={...state,recoveryTaskByDay:{...all,[date]:{...forDay,[taskId]:proof}}};
  if(completed) {
    const tasks=day.tasks.map(t=>t.id===taskId?{...t,progress:Number(t.target),done:true,recovered:true}:t);
    const done=tasks.filter(t=>t.done||Number(t.progress)>=Number(t.target)).length;
    patch.dailyLog={...(state.dailyLog||{}),[date]:{...day,tasks,done,total:tasks.length,complete:done===tasks.length}};
  }
  // XP deliberately omitted. Reward dispatcher may award only after an
  // idempotent recoveryAwarded key has been persisted with proof.
  return {state:patch,accepted:true,completed,newlyCompleted:completed};
}
