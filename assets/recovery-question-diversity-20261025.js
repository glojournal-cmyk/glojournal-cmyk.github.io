/* Keep dated Recovery question sets distinct across tasks and across iPad reloads.
 * Read-only: the quiz's ordinary grading and dated Recovery ledger remain authoritative. */
const PRACTICE_SUBJECTS=new Set(['french','latin','biology','chemistry','physics']);
const asId=value=>String(value||'').split('@')[0];
const taskSubject=task=>task?.assignedSubject||task?.focusSubject||task?.reviewSubject||
  String(task?.href||'').match(/^\/study\/(french|latin|biology|chemistry|physics)\/practise/)?.[1]||null;
const taskTopic=task=>task?.assignedTopic||task?.focusTopic||task?.reviewTopic||
  (()=>{try{return new URL(task?.href||'/', 'https://local.invalid').searchParams.get('topic')}catch{return null}})();
const clean=value=>String(value||'').normalize('NFKC').toLowerCase()
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
      entry.subject!==subject||(entry.year!=null&&year!=null&&Number(entry.year)!==Number(year)))continue;
   if(entry.correct===true)add(correct,entry.questionId);
   if(entry.recoveryFor===date&&entry.dailyTaskId&&entry.dailyTaskId!==taskId)
     add(otherTasks,entry.questionId);
 }
 const row=state?.dailyLog?.[date],tasks=row?.tasks||[];
 for(const [id,proof] of Object.entries(state?.recoveryTaskByDay?.[date]||{})){
   const assigned=tasks.find(t=>t.id===id);
   if(!assigned||taskSubject(assigned)!==subject)continue;
   for(const [qid,ok] of Object.entries(proof?.items||{})){
     if(ok===true)add(correct,qid);
     if(id!==taskId)add(otherTasks,qid);
   }
 }
 // Dedicated small Safari receipts hold correct-only proof if the main
 // Scholar state could not be saved. Legacy receipts (no correctness flag)
 // must NEVER be interpreted as correct answers.
 for(const proof of state?.recoveryReceipts||[]){
   if(proof?.date!==date||proof.subject!==subject)continue;
   for(const id of proof.verifiedCorrect===true?proof.correctQuestionIds||[]:[])
     add(correct,id);
   if(proof.taskId!==taskId)
     for(const id of proof.questionIds||[])add(otherTasks,id);
 }
 return {correct,otherTasks,ids:new Set([...correct,...otherTasks])};
}
export function selectDiverseRecoveryQuestions(fresh,loaded,options={},rank,progression){
 const {state,date,taskId,subject,year,topicId='',size=10,mode='standard'}=options;
 const current=Array.isArray(fresh)?fresh:[];
 if(!date||!taskId||!PRACTICE_SUBJECTS.has(subject)||!state)return current;
 const excluded=recoveryQuestionExclusions(state,{date,taskId,subject,year});
 const bank=(Array.isArray(loaded)?loaded:[]),byId=new Map(bank.map(q=>[String(q.id),q]));
 const excludedFingerprints=new Set([...excluded.ids].map(id=>recoveryQuestionFingerprint(byId.get(id))).filter(Boolean));
 const allowed=q=>q?.id&&q.formal!==false&&!q._repair&&q.status!=='preview'&&
   (!topicId||q.topicId===topicId)&&!excluded.ids.has(asId(q.id))&&
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
 const ranked=selectUnique(typeof rank==='function'?rank(candidates,subject,candidates.length):candidates);
 // Independent, non-overlapping portions of one subject/topic bank for
 // same-day Recovery assignments; prevents overlap even BEFORE first answer.
 const assignments=(state.dailyLog?.[date]?.tasks||[]).filter(t=>
    taskSubject(t)===subject&&String(taskTopic(t)||'')===String(topicId||'')&&Number(t.target)>0);
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
