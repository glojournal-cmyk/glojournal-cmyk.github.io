/* Keep dated Recovery question sets distinct across tasks and across iPad reloads.
 * Read-only: the quiz's ordinary grading and dated Recovery ledger remain authoritative. */
const PRACTICE_SUBJECTS=new Set(['french','latin','biology','chemistry','physics']);
const asId=value=>String(value||'').split('@')[0];
const taskSubject=task=>task?.assignedSubject||task?.focusSubject||task?.reviewSubject||
  String(task?.href||'').match(/^\/study\/(french|latin|biology|chemistry|physics)\/practise/)?.[1]||null;
const taskYear=task=>Number(task?.assignedYear||task?.reviewYear||(() => {try{return new URL(task?.href||'/', 'https://local.invalid').searchParams.get('year')}catch{return null}})())||0;
const taskTopic=task=>task?.assignedTopic||task?.focusTopic||task?.reviewTopic||
  (()=>{try{return new URL(task?.href||'/', 'https://local.invalid').searchParams.get('topic')}catch{return null}})();
const clean=value=>String(value||'').normalize('NFKD').toLowerCase()
  .replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
export function recoveryQuestionFingerprint(question){
 if(!question)return '';
 const p=clean(question.prompt||question.question||question.text||'');
 const stimulus=clean(question.stimulus?.text||question.stimulus?.masked||'');
 if(!p&&!stimulus)return '';
 return [p,stimulus,clean(question.format)].join('|');
}
export function recoveryQuestionExclusions(state,{date,taskId,subject,year}={}){
 const correct=new Set(),otherTasks=new Set();
 if(!date||!taskId||!PRACTICE_SUBJECTS.has(subject))return {correct,otherTasks,ids:new Set()};
 const add=(set,id)=>{if(id)set.add(asId(id));};
 for(const [id,n] of Object.entries(state?.seenCorrect||{}))
   if(Number(n)>0)add(correct,id);
 for(const entry of state?.formalAttemptLog||[]){
   if(!entry?.questionId||entry.formal===false||entry.repair||
      entry.subject!==subject)continue;
   if(entry.correct===true)add(correct,entry.questionId);
   if(entry.recoveryFor===date&&entry.dailyTaskId&&entry.dailyTaskId!==taskId)
     add(otherTasks,entry.questionId);
 }
 const dated=state?.dailyLog||{},proofsByDay=state?.recoveryTaskByDay||{};
 for(const [proofDay,proofs] of Object.entries(proofsByDay)){
  const tasks=dated[proofDay]?.tasks||[];
  for(const [id,proof] of Object.entries(proofs||{})){
   const assigned=tasks.find(t=>t.id===id);
   if(!assigned||taskSubject(assigned)!==subject)continue;
   for(const [qid,ok] of Object.entries(proof?.items||{})){
    // Even when iPad lost seenCorrect, a positive dated proof survives.
    if(ok===true)add(correct,qid);
    if(proofDay===date&&id!==taskId)add(otherTasks,qid);
   }
  }
 }
 // Separate iPad vault receipts can also outlive a missing main store.
 // Legacy receipts lack correctness flags and must not be treated as mastered.
 for(const proof of state?.recoveryReceipts||[]){
   if(proof?.subject!==subject)continue;
   for(const id of proof.verifiedCorrect===true?proof.correctQuestionIds||[]:[])
     add(correct,id);
   if(proof.date===date&&proof.taskId!==taskId)
     for(const id of proof.questionIds||[])add(otherTasks,id);
 }
 return {correct,otherTasks,ids:new Set([...correct,...otherTasks])};
}
export function selectDiverseRecoveryQuestions(fresh,loaded,options={},rank,progression){
 const {state,date,taskId,subject,year,topicId='',size=10,mode='standard',day=state?.today,reviewQuestionIds}=options;
 const current=Array.isArray(fresh)?fresh:[];
 if(!date||!taskId||!PRACTICE_SUBJECTS.has(subject)||!state)return current;
 const excluded=recoveryQuestionExclusions(state,{date,taskId,subject,year});
 const bank=(Array.isArray(loaded)?loaded:[]),byId=new Map(bank.map(q=>[String(q.id),q]));
 const excludedFingerprints=new Set([...excluded.ids].map(id=>recoveryQuestionFingerprint(byId.get(id))).filter(Boolean));
 const reviewIds=mode==='mistakes'&&Array.isArray(reviewQuestionIds)&&reviewQuestionIds.length?new Set(reviewQuestionIds):null;
 const allowed=q=>q?.id&&q.formal!==false&&!q._repair&&q.status!=='preview'&&
   (!reviewIds||reviewIds.has(q.id))&&
   (!topicId||q.topicId===topicId)&&!excluded.ids.has(asId(q.id))&&
   !(day&&['standard','mastery','quick'].includes(mode)&&
     state.reviews?.[q.id]?.due>day)&&
   !excludedFingerprints.has(recoveryQuestionFingerprint(q));
 const selectUnique=arr=>{
   const out=[],ids=new Set(),prints=new Set();
   for(const q of arr||[]){
     if(!allowed(q)||ids.has(String(q.id)))continue;
     const fp=recoveryQuestionFingerprint(q);
     if(fp&&prints.has(fp))continue;
     ids.add(String(q.id));if(fp)prints.add(fp);out.push(q);
   }
   return out;
 };
 const limit=Math.max(0,Math.min(60,Number(size)||0));
 if(!limit)return [];
 const review=['due','retention','weak','mistakes'].includes(mode);
 // Mistake/due review may only draw from its specifically assigned pool.
 const candidates=selectUnique(review?current:bank);
 if(!candidates.length)return selectUnique(current).slice(0,limit);
 const ranked=selectUnique(typeof rank==='function'?rank(candidates,subject,Math.max(1,Math.min(30,limit))):candidates);
 // Independent, non-overlapping portions of one subject/topic bank for
 // same-day Recovery assignments; prevents overlap even BEFORE first answer.
 const assignments=(state.dailyLog?.[date]?.tasks||[]).filter(t=>
    taskSubject(t)===subject&&String(taskTopic(t)||'')===String(topicId||'')&&
    (!taskYear(t)||!year||taskYear(t)===Number(year))&&Number(t.target)>0);
 const slot=assignments.findIndex(t=>t.id===taskId);
 const start=slot<0?0:assignments.slice(0,slot).reduce((n,t)=>n+Math.max(1,Number(t.target)||1),0);
 let ordered=ranked;
 if(!review&&slot>=0&&assignments.length>1&&ranked.length>=start+limit){
   // Deterministic reservation: neighboring assignments never select the
   // same base questions, regardless of which card was opened first.
   ordered=ranked.slice(start,start+limit);
 }else if(!review&&slot>0&&ranked.length>limit){
   // Older, smaller banks: rotate to prefer other questions, then let the
   // exclusions block any that have actually been asked.
   const offset=start%ranked.length;
   ordered=[...ranked.slice(offset),...ranked.slice(0,offset)];
 }
 const picked=selectUnique(ordered).slice(0,limit);
 if(typeof progression==='function'&&['mastery','year8long','standard'].includes(mode)){
   const p=progression(picked,mode,picked.length);
   return selectUnique(p).slice(0,limit);
 }
 return picked;
}
