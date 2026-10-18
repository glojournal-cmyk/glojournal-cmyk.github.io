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
 const total=merged.length,done=merged.filter(isDone).length;
 const originalFallback=previous?.recoveryFallback===true;
 const newFallback=incoming?.recoveryFallback===true;
 const preferOriginal=previous&&(!originalFallback||newFallback);
 const row={...(preferOriginal?incoming:previous),...(preferOriginal?previous:incoming),
   date:date||previous?.date||incoming?.date,tasks:merged,done,total,
   complete:total>0&&done===total};
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
