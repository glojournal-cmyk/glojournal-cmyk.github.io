// Reconcile a completed, *marked* Daily quiz with its exact assigned task.
// A perfect quiz score / XP toast alone is not evidence of a Daily completion.
// This is a fallback for Safari/store write ordering; the normal formal journal
// remains the primary counting source. Never credit free/recovery/vocab practice.
const supported = new Set([
  'latin-standard','y8-standard-a','y8-standard-b',
  'y8-mastery-a','y8-mastery-b','y8-mastery-topup-a','y8-mastery-topup-b','weakness-review','due-review','year9-light'
]);
const progressOf = t => Math.max(0,Math.min(Math.max(1,Number(t?.target)||1),Number(t?.progress)||0));
export function reconcileDailySession(state,receipt={}) {
  const unchanged=(reason)=>({changed:false,reason,daily:state?.daily,progress:0,target:0});
  const {day,taskId,subject,year,mode,questions,answers}=receipt;
  if(!state||state.today!==day||!/^\d{4}-\d{2}-\d{2}$/.test(day||''))
    return unchanged('wrong-day');
  if(!supported.has(taskId)||!Array.isArray(state.daily)||!Array.isArray(questions)||!Array.isArray(answers))
    return unchanged('not-assigned');
  const task=state.daily.find(t=>t.id===taskId&&t.planDate===day);
  if(!task||!task.assignedTopic||task.assignedSubject!==subject||Number(task.assignedYear)!==Number(year))
    return unchanged('wrong-assignment');
  // Require the saved Home task's *locked* route, not merely an arbitrary task id.
  let expected;
  try{expected=new URL(task.href,'https://scholar.invalid')}catch{return unchanged('invalid-link')}
  if(expected.searchParams.get('daily')!=='1'||expected.searchParams.get('locked')!=='1'||
     expected.searchParams.get('task')!==taskId||
     expected.searchParams.get('topic')!==task.assignedTopic||
     expected.searchParams.get('mode')!==mode||
     Number(expected.searchParams.get('year'))!==Number(year)||
     expected.pathname!==`/study/${subject}/practise`)
    return unchanged('wrong-route');
  // The locked route above already validates the exact subject, year, topic,
  // date, mode and assigned task. Questions in this *opened* Daily session
  // are its bank: do not drop marked answers merely because an older science
  // question has a stale/missing topicId. Free practice cannot reach here.
  const scienceTask=['biology','chemistry','physics'].includes(subject);
  const eligible=new Set(questions.filter(q=>q?.id&&q.formal!==false&&
    !q._repair&&(q.topicId===task.assignedTopic||scienceTask)).map(q=>String(q.id)));
  // Count a marked answer per visible quiz slot; repeated question IDs can
  // legitimately occupy separate slots, but duplicate receipts cannot.
  const remaining=new Map();
  for(const question of questions){
    if(eligible.has(String(question?.id)))
      remaining.set(String(question.id),(remaining.get(String(question.id))||0)+1);
  }
  let verified=0;
  const creditedIds=new Set();
  for(const answer of answers){
    const id=String(answer?.questionId||'');
    if(!id||answer.repair||answer.formal===false||
       typeof answer.correct!=='boolean'||(day>='2026-10-24'&&answer.correct!==true)||
       !eligible.has(id)||!remaining.get(id))continue;
    remaining.set(id,remaining.get(id)-1);
    verified++;
    if(day>='2026-10-24')creditedIds.add(id);
  }
  // Reopening an assigned quiz may show only the missing two questions.
  // Merge independently marked journal evidence from the SAME task and day,
  // rather than comparing 2 fresh answers against the old 8/10 snapshot.
  const prior=receipt.priorReceipt;
  if(day>='2026-10-24'&&prior&&prior.day===day&&prior.taskId===taskId&&
     prior.subject===subject&&Number(prior.year)===Number(year)&&
     prior.topicId===task.assignedTopic&&prior.mode===mode&&
     Number(prior.target)===Number(task.target)&&
     Array.isArray(prior.questions)&&Array.isArray(prior.answers)){
    const allowedPrior=new Set(prior.questions.filter(q=>q?.id&&q.formal!==false&&!q._repair)
      .map(q=>String(q.id)));
    for(const priorAnswer of prior.answers)
      if(priorAnswer?.correct===true&&priorAnswer.formal!==false&&!priorAnswer.repair&&
         allowedPrior.has(String(priorAnswer.questionId)))
        creditedIds.add(String(priorAnswer.questionId));
  }
  if(day>='2026-10-24')for(const event of state.formalAttemptLog||[]){
    if(event?.day!==day||event?.dailyTaskId!==taskId||
       event?.subject!==subject||Number(event?.year)!==Number(year)||
       event?.correct!==true||event?.repair||event?.formal===false||
       event?.recoveryFor||!event.questionId)continue;
    if(event.topicId!==task.assignedTopic&&
       !(scienceTask&&event.topicId))continue;
    creditedIds.add(String(event.questionId));
  }
  // Preserve only individually verified correct base-question IDs as durable
  // proof. A later partial Safari journal cannot overrule this saved receipt.
  // Subject/topic/year/day/mode were checked against the locked assignment.
  const trustedOldIds=Array.isArray(task.verifiedCorrectIds)&&
    task.planDate===day&&task.assignedSubject===subject&&
    Number(task.assignedYear)===Number(year)&&
    task.assignedTopic===expected.searchParams.get('topic')&&
    expected.searchParams.get('mode')===mode?task.verifiedCorrectIds:[];
  for(const id of trustedOldIds)if(id)creditedIds.add(String(id));
  const target=Math.max(1,Number(task.target)||1),old=progressOf(task);
  const progress=Math.min(target,Math.max(old,day>='2026-10-24'?creditedIds.size:verified));
  if(progress===old&&
     (!creditedIds.size||JSON.stringify([...creditedIds].sort())===
       JSON.stringify((task.verifiedCorrectIds||[]).map(String).sort())))
    return {...unchanged('already-counted'),progress:old,target};
  const stamped={...task,progress,done:progress>=target,
    ...(day>='2026-10-24'&&creditedIds.size?
      {verifiedCorrectIds:[...creditedIds].slice(0,60)}:{})};
  const daily=state.daily.map(t=>t===task?stamped:t);
  // Keep the dated Home/Recovery summary aligned without touching any other day.
  let dailyLog=state.dailyLog;
  const row=dailyLog?.[day];
  if(Array.isArray(row?.tasks)){
    const tasks=row.tasks.map(t=>t.id===taskId?{
      ...t,progress,done:progress>=target,
      ...(stamped.verifiedCorrectIds?{verifiedCorrectIds:stamped.verifiedCorrectIds}:{})
    }:t);
    const done=tasks.filter(t=>t.done||Number(t.progress)>=Number(t.target)).length;
    dailyLog={...dailyLog,[day]:{...row,tasks,done,total:tasks.length,
      complete:tasks.length>0&&done===tasks.length}};
  }
  return {changed:true,reason:day>='2026-10-24'?'correct-answers':'marked-answers',daily,dailyLog,progress,target};
}
