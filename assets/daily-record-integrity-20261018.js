// Append-only, monotonic completion reconciliation for dated Daily Records.
// Do not infer answers or XP: this only preserves already SAVED dated credit.
const validDate=d=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d||""))return false;
  const ms=Date.parse(d+"T12:00:00Z");
  return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===d;
};
const nonneg=v=>Math.max(0,Number(v)||0);
const tasksOf=row=>Array.isArray(row?.tasks)?row.tasks.filter(t=>t&&typeof t.id==="string"&&t.id):[];
const isDone=t=>t?.done===true||(Number(t?.target)>0&&nonneg(t?.progress)>=Number(t.target));
const isFallback=t=>t?.recoveryFallback===true;
function mergeTask(previous,incoming){
 const left=previous||{},right=incoming||{};
 // A dated, already-started assignment is immutable. A later planner may
 // re-use the same task ID for a different topic, 5->20 target or mode.
 // That is a NEW task, not proof that the pupil lost the original answers.
 const started=left?.id&&(nonneg(left.progress)>0||isDone(left));
 const different=right?.id&&(
   (Number(left.target)>0&&Number(right.target)>0&&Number(left.target)!==Number(right.target))||
   ['assignedSubject','assignedTopic','assignedYear','reviewTopic','focusTopic'].some(k=>
     left[k]!=null&&right[k]!=null&&String(left[k])!==String(right[k]))||
   (String(left.href||'').includes('?')&&String(right.href||'').includes('?')&&
     (()=>{try{
       const a=new URL(left.href,'https://scholar.invalid'),b=new URL(right.href,'https://scholar.invalid');
       return ['mode','topic','task','year'].some(k=>
         a.searchParams.has(k)&&b.searchParams.has(k)&&a.searchParams.get(k)!==b.searchParams.get(k));
     }catch{return false}})())
 );
 if(started&&different)return {...left,done:isDone(left)};
 const target=Math.max(1,nonneg(left.target),nonneg(right.target));
 const progress=Math.min(target,Math.max(nonneg(left.progress),nonneg(right.progress),
   isDone(left)?nonneg(left.target):0,isDone(right)?nonneg(right.target):0));
 const done=isDone(left)||isDone(right)||progress>=target;
 // Preserve the ORIGINAL assigned topic/subject. Replacing it with today's
 // rotating assignment caused eligible Recovery work to look unfinished.
 const hasOld=!!previous?.id,hasNew=!!incoming?.id;
 const original=hasOld&&!isFallback(left)?left:
   hasNew&&!isFallback(right)?right:hasOld?left:right;
 const other=original===left?right:left;
 const merged={...other,...original,target,progress,done};
 if(left.recovered===true||right.recovered===true)merged.recovered=true;
 if(left.correctedFromVocabAnswers===true||right.correctedFromVocabAnswers===true)
   merged.correctedFromVocabAnswers=true;
 // A genuine dated assignment replaces generic "Not opened" placeholders.
 if(hasOld&&hasNew&&(!isFallback(left)||!isFallback(right)))delete merged.recoveryFallback;
 return merged;
}
export function mergeDailyRecordRow(previous,incoming,date){
 const oldTasks=tasksOf(previous),newTasks=tasksOf(incoming);
 if(!oldTasks.length&&!newTasks.length)return previous||incoming||null;
 // A fully verified, originally TEN-of-TEN day is an immutable historic
 // assignment. Regenerating the new planner must not append renamed or extra
 // task IDs and silently downgrade 10/10 into 10/11 or 10/12.
 // Require all ten actual dated task receipts, not just a summary flag.
 const fullTen=(row,tasks)=>tasks.length===10&&
   row?.complete===true&&nonneg(row.done)===10&&
   nonneg(row.total)===10&&tasks.every(isDone);
 // A date-keyed original core Daily completion award proves all 10 original
 // slots finished, even when a later planner has replaced task details.
 const fullReceipt=(row,tasks)=>tasks.length===10&&
   row?.verifiedOriginalCompletionReceipt===true&&
   row?.complete===true&&nonneg(row.done)===10&&nonneg(row.total)===10;
 if(fullReceipt(previous,oldTasks)&&
    newTasks.some(t=>!oldTasks.some(old=>old.id===t.id)))return previous;
 if(fullReceipt(incoming,newTasks)&&
    oldTasks.some(t=>!newTasks.some(old=>old.id===t.id)))return incoming;
 if(fullTen(previous,oldTasks)){
   const incomingIds=new Set(newTasks.map(t=>t.id));
   if(newTasks.some(t=>!oldTasks.some(old=>old.id===t.id))||
      (newTasks.length>0&&newTasks.length<oldTasks.length))
     return previous;
 }
 // Conversely, a verified newer 10/10 record must not be expanded by older
 // stale placeholders. Merge matching task progress but keep its original IDs.
 if(fullTen(incoming,newTasks)&&
    oldTasks.some(t=>!newTasks.some(next=>next.id===t.id)))
   return incoming;
 // Preserve the ten ORIGINAL task IDs as soon as any work has been
 // recorded for that day. Regeneration must not add a new task and turn 10/10
 // into 10/11, or replace an answered 5/5 with an unattempted 0/20.
 // Actual Recovery answers are merged by matching task ID below.
 const startedTen=oldTasks.length===10&&oldTasks.some(t=>nonneg(t.progress)>0||isDone(t));
 const assignmentIdsChanged=newTasks.length>0&&(
   newTasks.length!==oldTasks.length||
   newTasks.some(t=>!oldTasks.some(old=>old.id===t.id))
 );
 if(startedTen&&assignmentIdsChanged){
   const tasks=oldTasks.map(old=>{
     const matching=newTasks.find(t=>t.id===old.id);
     return matching?mergeTask(old,matching):old;
   });
   const done=tasks.filter(isDone).length;
   return {...previous,date:date||previous?.date,tasks,done,total:tasks.length,
     complete:done===tasks.length};
 }
 const base=!oldTasks.length?incoming:!newTasks.length?previous:previous;
 const merged=[];
 const used=new Set();
 for(const old of oldTasks){
   const next=newTasks.find(t=>t.id===old.id);
   merged.push(next?mergeTask(old,next):mergeTask(old,{}));
   used.add(old.id);
 }
 for(const next of newTasks)if(!used.has(next.id)){
   // Only add genuinely new IDs; never throw away a completed old item.
   merged.push(mergeTask({},next));used.add(next.id);
 }
 const total=merged.length,verifiedReceipt=total===10&&
   (fullReceipt(previous,oldTasks)||fullReceipt(incoming,newTasks));
 const done=verifiedReceipt?10:merged.filter(isDone).length;
 const originalFallback=previous?.recoveryFallback===true;
 const newFallback=incoming?.recoveryFallback===true;
 const preferOriginal=previous&&(!originalFallback||newFallback);
 const row={...(preferOriginal?incoming:previous),...(preferOriginal?previous:incoming),
   date:date||previous?.date||incoming?.date,tasks:merged,done,total,
   complete:total>0&&done===total,
   ...(verifiedReceipt?{verifiedOriginalCompletionReceipt:true}:{})};
 if(previous&&incoming&&(!originalFallback||!newFallback))delete row.recoveryFallback;
 return row;
}
export function mergeDailyHistory(existing,incoming){
 const a=existing&&typeof existing==="object"&&!Array.isArray(existing)?existing:{};
 const b=incoming&&typeof incoming==="object"&&!Array.isArray(incoming)?incoming:{};
 let output=a;
 for(const [date,row] of Object.entries(b)){
   if(!validDate(date)||!tasksOf(row).length)continue;
   const prev=a[date];
   const merged=mergeDailyRecordRow(prev,row,date);
   if(JSON.stringify(prev)!==JSON.stringify(merged)){
     if(output===a)output={...a};
     output[date]=merged;
   }
 }
 return output;
}

// Original-day Foundation records use dailyCurriculumEvidenceByDay rather than
// Recovery's recoveryFor marker. Rebuild only from saved, task-scoped answers.
export function reconcileOriginalCurriculumHistory(state,history){
 const existing=history&&typeof history==="object"?history:{};
 let out=existing;
 const ledger=state?.dailyCurriculumEvidenceByDay||{};
 const attemptLog=Array.isArray(state?.formalAttemptLog)?state.formalAttemptLog:[];
 const ids=new Set(["y8-practise","y8-mastery","year8-long-review"]);
 for(const [date,row] of Object.entries(existing)){
   if(!validDate(date)||!tasksOf(row).length)continue;
   let changed=false;
   const tasks=row.tasks.map(task=>{
     if(!ids.has(task.id)||isDone(task))return task;
     let topic=task.assignedTopic||task.reviewTopic||null;
     let subject=task.assignedSubject||task.reviewSubject||null;
     const href=String(task.href||"");
     const route=href.match(/^\/study\/(french|latin|biology|chemistry|physics)\/practise(?:\?|\/|$)/);
     if(!subject)subject=route?.[1]||null;
     if(!topic){
       const query=href.split("?")[1]||"";
       const param=query.split("&").find(x=>x.startsWith("topic="));
       if(param){try{topic=decodeURIComponent(param.slice(6))}catch{}}
     }
     const byTopic=ledger?.[date]?.[task.id]||{};
     if(!topic){
       // No original assignment? Use only a single explicitly tagged
       // curriculum topic from the saved day's own task evidence.
       const keys=Object.keys(byTopic);
       if(keys.length===1)topic=keys[0];
     }
     let count=0;
     if(topic){
       const bucket=byTopic[topic]||{};
       const foundation=Object.entries(bucket.foundation||{}).filter(([,v])=>v===true).length;
       const mastery=Object.entries(bucket.mastery||{}).filter(([,v])=>v===true).length;
       count=task.id==="y8-practise"?foundation:Math.min(10,foundation)+mastery;
     }
     // A separate original-day formal attempt history also proves genuine
     // work, including on devices that failed to retain the phase ledger.
     const attempts=attemptLog.filter(a=>a?.day===date&&!a.recoveryFor&&
       a.dailyTaskId===task.id&&a.formal!==false&&!a.repair&&a.questionId&&
       (!subject||a.subject===subject)&&(!topic||a.topicId===topic));
     const distinct=new Set(attempts.map(a=>a.attemptId||(
       a.at?String(a.questionId)+"@"+String(a.at):String(a.questionId)))).size;
     count=Math.max(count,distinct);
     const target=Math.max(1,nonneg(task.target));
     const progress=Math.min(target,Math.max(nonneg(task.progress),count));
     if(progress<=nonneg(task.progress))return task;
     changed=true;
     return {...task,progress,done:progress>=target,
       correctedFromCurriculumEvidence:true};
   });
   if(!changed)continue;
   const repaired=mergeDailyRecordRow(row,{date,tasks},date);
   if(out===existing)out={...existing};
   out[date]=repaired;
 }
 return out;
}
