// Restore the topic of an in-flight dated Daily task only from consistent,
// independently marked question evidence. Never infer a completion or reward.
const guardedTaskIds=new Set([
 'latin-standard','y8-standard-a','y8-standard-b',
 'y8-mastery-a','y8-mastery-b','y8-mastery-topup-a','y8-mastery-topup-b',
 'weakness-review','due-review','year9-light'
]);
const guardedModes=new Set(['standard','quick','mastery','weak','due','year8long']);
export function datedAssignmentEvidence(state,date,taskId,getCatalog){
 if(!guardedTaskIds.has(taskId)||!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return null;
 const entries=(state?.formalAttemptLog||[]).filter(e=>e?.day===date &&
   e.dailyTaskId===taskId && e.formal!==false && !e.repair &&
   !e.recoveryFor && !e.dailyVocab && typeof e.correct==='boolean' &&
   e.questionId && e.subject && e.topicId && guardedModes.has(e.mode));
 if(new Set(entries.map(e=>String(e.questionId).split('@')[0])).size<3)return null;
 const first=entries[0],year=Number(first.year);
 if(!Number.isInteger(year)||year<8||year>9)return null;
 if(entries.some(e=>e.subject!==first.subject||e.topicId!==first.topicId||
   e.mode!==first.mode||Number(e.year)!==year))return null;
 const topic=(getCatalog(first.subject,year)||[]).find(t=>
   t.topicId===first.topicId&&t.status==='enabled');
 if(!topic)return null;
 return {subject:first.subject,year,topicId:first.topicId,
   mode:first.mode,title:topic.title||first.topicId,
   questionCount:new Set(entries.map(e=>String(e.questionId).split('@')[0])).size};
}
