// Reconcile a completed, *marked* Daily quiz with its exact assigned task.
// A perfect quiz score / XP toast alone is not evidence of a Daily completion.
// This is a fallback for Safari/store write ordering; the normal formal journal
// remains the primary counting source. Never credit free/recovery/vocab practice.
const supported = new Set([
  'latin-standard','y8-standard-a','y8-standard-b',
  'y8-mastery-a','y8-mastery-b','y8-mastery-topup-a','y8-mastery-topup-b','weakness-review','due-review','year9-light'
]);
// One independently marked quiz slot is evidence even if a depleted bank
// accidentally served the same question ID twice. Do not infer extra slots
// from duplicate saved receipts or unmarked questions.
export function verifiedQuizSlots(questions,answers){
 const buckets=new Map(),ordered=[];
 for(const q of questions||[]){
  if(!q?.id||q.formal===false||q._repair)continue;
  const id=String(q.id),slot={id,question:q,correct:null},group=buckets.get(id)||[];
  group.push(slot);buckets.set(id,group);ordered.push(slot);
 }
 for(const answer of answers||[]){
  const id=String(answer?.questionId||''),group=buckets.get(id);
  if(!group?.length||answer.repair||answer.formal===false||
    typeof answer.correct!=='boolean')continue;
  const slot=group.find(x=>x.correct===null);
  if(slot)slot.correct=answer.correct;
 }
 return ordered.filter(x=>x.correct!==null);
}
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
  const sourceSlots=verifiedQuizSlots(questions,answers)
    .filter(x=>eligible.has(x.id));
  let verifiedSlotCount=day>='2026-10-24'
    ?sourceSlots.filter(x=>x.correct).length:verified;
  // Reopening an assigned quiz may show only the missing two questions.
  // Merge independently marked journal evidence from the SAME task and day,
  // rather than comparing 2 fresh answers against the old 8/10 snapshot.
  const prior=receipt.priorReceipt;
  const priorMatches=!!prior&&prior.day===day&&prior.taskId===taskId&&
    prior.subject===subject&&Number(prior.year)===Number(year)&&
    prior.topicId===task.assignedTopic&&prior.mode===mode&&
    Number(prior.target)===Number(task.target)&&
    Array.isArray(prior.questions)&&Array.isArray(prior.answers);
  // An unrelated retry receipt must never validate an extra tenth answer.
  // When the old receipt is present but mismatched, leave the existing
  // durable score alone instead of inferring a new credit from one answer.
  if(day>='2026-10-24'&&prior&&!priorMatches)
    return {...unchanged('mismatched-prior-receipt'),
      progress:progressOf(task),target:Math.max(1,Number(task.target)||1)};
  if(day>='2026-10-24'&&priorMatches){
    const oldSlots=verifiedQuizSlots(prior.questions,prior.answers)
      .filter(x=>x.question?.topicId===task.assignedTopic||scienceTask);
    const oldById=new Map(),newById=new Map();
    for(const slot of oldSlots){
      const row=oldById.get(slot.id)||{correct:0,wrong:0};
      row[slot.correct?'correct':'wrong']++;
      oldById.set(slot.id,row);
      if(slot.correct)creditedIds.add(slot.id);
    }
    for(const slot of sourceSlots.filter(x=>x.correct)){
      const row=newById.get(slot.id)||0;newById.set(slot.id,row+1);
    }
    // A retry first corrects an old wrong slot. Already-correct repeated IDs
    // are not additional credits unless they occupied distinct ORIGINAL slots.
    let combined=0;
    for(const [id,row] of oldById){
      const additional=Math.min(row.wrong,newById.get(id)||0);
      combined+=row.correct+additional;
    }
    for(const [id,n] of newById)if(!oldById.has(id))combined+=n;
    verifiedSlotCount=Math.max(verifiedSlotCount,combined);
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
  const verifiedKey=[day,taskId,subject,task.assignedTopic,year,mode,
    Number(task.target)].join('|');
  const trustedOldIds=Array.isArray(task.verifiedCorrectIds)&&
    task.verifiedCorrectAssignment===verifiedKey&&
    task.planDate===day&&task.assignedSubject===subject&&
    Number(task.assignedYear)===Number(year)&&
    task.assignedTopic===expected.searchParams.get('topic')&&
    expected.searchParams.get('mode')===mode?task.verifiedCorrectIds:[];
  for(const id of trustedOldIds)if(id)creditedIds.add(String(id));
  const trustedOldSlots=task.verifiedCorrectAssignment===verifiedKey?
    Math.max(0,Number(task.verifiedCorrectSlots)||0):0;
  verifiedSlotCount=Math.max(verifiedSlotCount,trustedOldSlots);
  const target=Math.max(1,Number(task.target)||1),old=progressOf(task);
  // Physics P1 had only eight assignable questions for a fifteen-credit Daily.
  // Supplementary IDs were not available before the fix, so a NEW correct
  // supplementary answer cannot duplicate an older unitemised Home credit.
  // Track every such ID to prevent crediting it again after Safari re-entry.
  if(day>='2026-10-25'&&taskId==='year9-light'&&subject==='physics'&&
     task.assignedTopic==='phys-y9-p1'){
    const prefix='phys-y9-p1-daily-expansion-';
    const fresh=new Set(sourceSlots.filter(x=>x.correct&&x.id.startsWith(prefix))
      .map(x=>x.id).filter(id=>!trustedOldIds.includes(id)));
    if(fresh.size){
      const priorCount=Math.max(old,trustedOldSlots);
      verifiedSlotCount=Math.max(verifiedSlotCount,
        Math.min(target,priorCount+fresh.size));
    }
  }
  const sessionCorrect=new Set();
  for(const answer of answers||[]){
    if(answer?.correct===true&&answer.questionId&&!answer.repair&&answer.formal!==false)
      sessionCorrect.add(String(answer.questionId));
  }
  const oldIds=trustedOldIds.map(String).filter(Boolean);
  const journalIds=[...creditedIds].map(String);
  const absorbed=task.verifiedCorrectIdsAbsorbed===true&&task.verifiedCorrectAssignment===verifiedKey;
  let creditIds,progress,nextAbsorbed=absorbed;
  if(oldIds.length&&absorbed){
    const known=new Set(oldIds);
    const fresh=journalIds.filter(id=>!known.has(id));
    creditIds=[...known,...fresh];
    progress=Math.min(target,Math.max(old+fresh.length,trustedOldSlots,verifiedSlotCount));
  }else if(oldIds.length){
    const known=new Set(oldIds);
    const fresh=journalIds.filter(id=>!known.has(id)&&sessionCorrect.has(id));
    creditIds=[...new Set([...oldIds,...journalIds])];
    progress=Math.min(target,Math.max(old,creditIds.length,trustedOldSlots,verifiedSlotCount,old+fresh.length));
  }else if(journalIds.length>=old){
    creditIds=journalIds;
    progress=Math.min(target,Math.max(old,journalIds.length,trustedOldSlots,verifiedSlotCount));
  }else{
    // Saved score has no ID receipt. This sitting's correct answers are new credit.
    // Older IDs already inside that score are not added again.
    const fresh=[...sessionCorrect].filter(id=>journalIds.includes(id));
    creditIds=[...new Set(journalIds)];
    progress=Math.min(target,Math.max(old+fresh.length,trustedOldSlots,verifiedSlotCount));
    nextAbsorbed=true;
  }
  // Never downgrade a verified old score with a shorter/incomplete replay;
  // on legacy dates the quiz slot counter is not a correct-only proof.
  const proofSufficient=verifiedSlotCount>=old||creditedIds.size>=old||trustedOldSlots>=old;
  if(progress===old&&
     (day<'2026-10-24'||!proofSufficient||
      (verifiedSlotCount<=trustedOldSlots&&
       (!creditedIds.size||JSON.stringify([...creditedIds].sort())===
         JSON.stringify((task.verifiedCorrectIds||[]).map(String).sort())))))
    return {...unchanged('already-counted'),progress:old,target};
  const stamped={...task,progress,done:progress>=target,
    ...(creditIds.length?
      {verifiedCorrectIds:creditIds.slice(0,80),
       verifiedCorrectSlots:Math.min(target,progress),
       verifiedCorrectAssignment:verifiedKey,
       ...(nextAbsorbed?{verifiedCorrectIdsAbsorbed:true}:{})}:{})};
  const daily=state.daily.map(t=>t===task?stamped:t);
  // Keep the dated Home/Recovery summary aligned without touching any other day.
  let dailyLog=state.dailyLog;
  const row=dailyLog?.[day];
  if(Array.isArray(row?.tasks)){
    const tasks=row.tasks.map(t=>t.id===taskId?{
      ...t,progress,done:progress>=target,
      ...(stamped.verifiedCorrectIds?{
        verifiedCorrectIds:stamped.verifiedCorrectIds,
        verifiedCorrectSlots:stamped.verifiedCorrectSlots,
        verifiedCorrectAssignment:stamped.verifiedCorrectAssignment,
        ...(stamped.verifiedCorrectIdsAbsorbed?{verifiedCorrectIdsAbsorbed:true}:{})}:{})
    }:t);
    const done=tasks.filter(t=>t.done||Number(t.progress)>=Number(t.target)).length;
    dailyLog={...dailyLog,[day]:{...row,tasks,done,total:tasks.length,
      complete:tasks.length>0&&done===tasks.length}};
  }
  return {changed:true,reason:day>='2026-10-24'?'correct-answers':'marked-answers',daily,dailyLog,progress,target};
}
