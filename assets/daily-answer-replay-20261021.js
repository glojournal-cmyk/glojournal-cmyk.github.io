// Repair the visible Daily Task ledger from genuine, dated, saved answer events.
// No XP, mastery, answers, rewards, or assignment identity is created/changed.
const VALID_IDS=new Set(['latin-standard','y8-standard-a','y8-standard-b',
  'y8-mastery-a','y8-mastery-b','weakness-review','due-review','year9-light']);
const validDay=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'');
function savedAssignment(task,day){
  if(!task||!VALID_IDS.has(task.id)||task.planDate!==day||
     !task.assignedSubject||!task.assignedTopic)return false;
  try {
    const url=new URL(task.href,'https://app.invalid');
    return url.pathname===`/study/${task.assignedSubject}/practise`&&
      url.searchParams.get('daily')==='1'&&
      url.searchParams.get('locked')==='1'&&
      url.searchParams.get('task')===task.id&&
      url.searchParams.get('topic')===task.assignedTopic;
  }catch{return false}
}
const marked=e=>e?.questionId&&typeof e.correct==='boolean'&&e.formal!==false&&
  e.repair!==true&&!e.recoveryFor&&!e.dailyVocab;
function evidenceFor(task,event){
  if(!marked(event)||event.subject!==task.assignedSubject)return false;
  // Task-scoped event is reliable even when an old quiz labelled its topic
  // differently; it came from the saved, locked Daily assignment.
  if(event.dailyTaskId===task.id)return true;
  // Legacy iPad Latin quizzes sometimes saved the formal answer but lost
  // the task tag. Accept ONLY today's precisely pinned Latin question topic
  // when the event has no other task owner; never borrow another Daily task.
  if(task.id!=='latin-standard'||event.dailyTaskId)return false;
  return event.topicId===task.assignedTopic||
    String(event.questionId).startsWith(task.assignedTopic+'-')||
    String(event.questionId).startsWith(task.assignedTopic+':');
}
function key(e){return String(e.attemptId||
  (e.at?String(e.questionId)+'@'+String(e.at):String(e.questionId)))}
export function replayDailyAnswerCredit(state){
  if(!validDay(state?.today)||!Array.isArray(state?.daily)||
     !Array.isArray(state?.formalAttemptLog))return null;
  const day=state.today,events=state.formalAttemptLog.filter(e=>e?.day===day&&marked(e));
  if(!events.length)return null;
  let changed=false;
  const daily=state.daily.map(task=>{
    if(!savedAssignment(task,day))return task;
    const seen=new Set(events.filter(e=>evidenceFor(task,e)).map(key));
    const target=Math.max(1,Number(task.target)||1);
    const old=Math.max(0,Number(task.progress)||0);
    let progress=Math.min(target,Math.max(old,seen.size));
    if(task.id.startsWith('y8-mastery-')&&
       new URL(task.href,'https://app.invalid').searchParams.get('mode')==='mastery'&&
       state.topicStats?.[task.assignedTopic]?.masteryV2?.passedMasteryAt!==day)
      progress=Math.max(Math.min(target,old),Math.min(progress,target-1));
    if(progress===old)return task;
    changed=true;
    return {...task,progress};
  });
  if(!changed)return null;
  // Preserve all saved dated tasks, original IDs, and all previous progress.
  // normalizeState will also build a log for an initially unlogged day.
  const log=state.dailyLog||{},row=log[day];
  let dailyLog;
  if(Array.isArray(row?.tasks)){
    const current=new Map(daily.map(t=>[t.id,t]));
    const tasks=row.tasks.map(t=>{
      const repaired=current.get(t.id);
      if(!repaired)return t;
      const target=Math.max(1,Number(t.target)||Number(repaired.target)||1);
      // Merge monotonically: a repair must never erase previously saved credit.
      const progress=Math.min(target,Math.max(0,Number(t.progress)||0,Number(repaired.progress)||0));
      return progress!==Number(t.progress||0)?
        {...t,progress,done:progress>=target}:t;
    });
    const done=tasks.filter(t=>t.done===true||Number(t.progress)>=Number(t.target)).length;
    dailyLog={...log,[day]:{...row,tasks,done,total:tasks.length,
      complete:tasks.length>0&&done===tasks.length}};
  }
  return {daily,...(dailyLog?{dailyLog}:{})};
}
