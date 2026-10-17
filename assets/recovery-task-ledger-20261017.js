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
  // Daily Recovery credits a completed, marked study activity.
  // Correctness is still retained for feedback and correction review.
  const count=taskId==='mistake-review'
    ? Object.values(items).filter(Boolean).length
    : Object.keys(items).length;
  const completed=count>=required;
  const proof={...old,items,originalCount:baseline,totalNeeded:required,completed};
  const patch={...state,recoveryTaskByDay:{...all,[date]:{...forDay,[taskId]:proof}}};
  // Persist partial, genuinely marked activity progress on the ORIGINAL date,
  // rather than displaying 0 until the entire 4/10-question target is reached.
  const progress=Math.min(Number(task.target),baseline+count);
  const tasks=day.tasks.map(t=>t.id===taskId
    ? {...t,progress:Math.max(Number(t.progress)||0,progress),done:completed,
       ...(completed?{recovered:true}:{})}
    :t);
  const done=tasks.filter(t=>t.done||Number(t.progress)>=Number(t.target)).length;
  patch.dailyLog={...(state.dailyLog||{}),[date]:{
    ...day,tasks,done,total:tasks.length,complete:done===tasks.length
  }};
  // XP deliberately omitted. Reward dispatcher may award only after an
  // idempotent recoveryAwarded key has been persisted with proof.
  return {state:patch,accepted:true,completed,newlyCompleted:completed};
}

export function reconcileRecoveredTaskHistory(state, existingLog) {
  let log=existingLog||{};
  for(const [date,proofs] of Object.entries(state?.recoveryTaskByDay||{})){
    if(!validDay(date))continue;
    let row=log[date];
    const countProof=(id,proof)=>id==='mistake-review'
      ?Object.values(proof?.items||{}).filter(Boolean).length
      :Object.keys(proof?.items||{}).length;
    if(!row||!Array.isArray(row.tasks)||!row.tasks.length){
      // Reconstruct a full, plainly labelled fallback only from real dated
      // answer evidence, including partially finished Recovery sessions.
      if(!Object.entries(proofs||{}).some(([id,p])=>
          RECOVERY_IDS.has(id)&&(p?.completed===true||countProof(id,p)>0)))continue;
      const tasks=UNOPENED_FALLBACK_TASKS.map(([id,title,target])=>({
        id,title,target,progress:0,done:false,recoveryFallback:true
      }));
      row={date,tasks,done:0,total:tasks.length,complete:false,recoveryFallback:true};
      log={...log,[date]:row};
    }
    let changed=false;
    const tasks=row.tasks.map(task=>{
      const proof=proofs?.[task.id];
      if(!proof||!RECOVERY_IDS.has(task.id)||task.done||
          Number(task.progress)>=Number(task.target))return task;
      const target=Math.max(1,Number(task.target)||1);
      const initial=Math.max(0,Number(proof.originalCount??task.progress)||0);
      const attempts=countProof(task.id,proof);
      const progress=proof.completed===true?target:
        Math.min(target,Math.max(Number(task.progress)||0,initial+attempts));
      if(progress<=Number(task.progress||0))return task;
      changed=true;
      const done=proof.completed===true||progress>=target;
      return {...task,progress,done,...(done?{recovered:true}:{})};
    });
    if(!changed)continue;
    const done=tasks.filter(t=>t.done||Number(t.progress)>=Number(t.target)).length;
    log={...log,[date]:{...row,tasks,done,total:tasks.length,complete:done===tasks.length}};
  }
  return log;
}

export const UNOPENED_FALLBACK_TASKS = Object.freeze([
  ['mistake-review','Previous mistakes',1],
  ['study-session','Focused study',10],
  ['french-vocab','Year 7–8 French vocab',30],
  ['latin-vocab','Year 7–8 Latin vocab',30],
  ['adaptive-focus','Subject focus',4],
  ['year8-long-review','Year 8 practice + mastery',25],
  ['y8-practise','Foundation practice',10],
  ['y8-mastery','Mastery review',25],
  ['tend-garden','Water your plants',1],
  ['play-game','Play a quick game',1]
]);
// A fallback is a new recoverable plan, not a claim that this was assigned
// on the unopened day. Do not overwrite a partial or complete historical log.
export function prepareUnopenedRecovery(state,date,today) {
  if(!canRecover(today,date)) return {state,created:false,reason:'outside-window'};
  if(Object.prototype.hasOwnProperty.call(state?.dailyLog||{},date))
    return {state,created:false,reason:'existing-history'};
  const tasks=UNOPENED_FALLBACK_TASKS.map(([id,title,target])=>({
    id,title,target,progress:0,done:false,recoveryFallback:true
  }));
  const log={date,tasks,done:0,total:tasks.length,complete:false,recoveryFallback:true};
  return {
    state:{...state,dailyLog:{...(state.dailyLog||{}),[date]:log}},
    created:true,reason:'unopened-fallback'
  };
}
