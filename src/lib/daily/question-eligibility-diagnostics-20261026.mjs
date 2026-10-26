// Diagnostic only: no app imports, no progress or storage writes.
// Caller supplies already-loaded topic questions and a SANITISED learner snapshot.
import {allocateGlobalQuestions} from './global-allocation-preflight-20261026.mjs';
const baseId=q=>String(q?.id||'').split('@')[0];
const dateOf=x=>String(x?.day||x?.date||'').slice(0,10);
const statuses=new Set(['enabled']);
const ordinaryModes=new Set(['standard','mastery','year8long','vocab','year9']);
const reviewModes=new Set(['retention','due','mistakes','weak']);
function firstPreviousAttempt(histories=[],id,today){
 return histories.some(e=>baseId({id:e?.questionId})===id&&dateOf(e)<today&&dateOf(e)&&e.formal!==false);
}
export function diagnoseTaskQuestionEligibility(task={},questions=[],state={},today=state.today||''){
 const reasons={};
 const count=k=>{reasons[k]=(reasons[k]||0)+1};
 const eligible=[],seen=new Set(),requiredYear=Number(task.year||0);
 const past=Array.isArray(state.formalAttemptLog)?state.formalAttemptLog:[];
 for(const q of questions){
  const id=baseId(q);
  const reject=k=>count(k);
  if(!id){reject('missing_id');continue}
  if(seen.has(id)){reject('duplicate_id');continue}seen.add(id);
  if(!statuses.has(q.status)||q.formal===false||q._repair){reject('disabled_preview_or_informal');continue}
  if(task.subject&&q.subject&&q.subject!==task.subject){reject('wrong_subject');continue}
  if(requiredYear&&q.year&&Number(q.year)!==requiredYear){reject('wrong_year');continue}
  if(task.topicId&&q.topicId!==task.topicId){reject('wrong_topic');continue}
  if(task.requiredMarks&&Number(q.marks)!==Number(task.requiredMarks)){reject('wrong_mark_allocation');continue}
  const correct=Number(state.seenCorrect?.[id]||0)>0||past.some(e=>baseId({id:e.questionId})===id&&e.correct===true&&e.formal!==false);
  const future=String(state.reviews?.[id]?.due||'')>today;
  const mode=task.mode||'standard';
  if(ordinaryModes.has(mode)&&correct){reject('previously_correct');continue}
  if(ordinaryModes.has(mode)&&future){reject('not_due');continue}
  if(reviewModes.has(mode)){
   if(!firstPreviousAttempt(past,id,today)){reject('no_prior_attempt');continue}
   if((mode==='due'||mode==='mistakes')&&!state.reviews?.[id]&&mode==='due'){reject('not_due');continue}
   if(mode==='due'&&(state.reviews?.[id]?.due||'')>today){reject('not_due');continue}
   if(mode==='mistakes'&&!past.some(e=>baseId({id:e.questionId})===id&&e.correct===false)){reject('no_historic_error');continue}
  }
  eligible.push(q);
 }
 const target=Math.max(0,Math.floor(Number(task.target)||0));
 return {id:task.id,mode:task.mode||'standard',nominal:questions.length,distinctIds:seen.size,eligible:eligible.length,target,
 shortage:Math.max(0,target-eligible.length),reasons,questions:eligible};
}
export function diagnoseDailyCapacity(tasks=[],state={},today=state.today||''){
 const rows=tasks.map(t=>diagnoseTaskQuestionEligibility(t,t.questions||[],state,today));
 const allocation=allocateGlobalQuestions(tasks.map((t,i)=>({id:t.id,target:t.target,candidates:rows[i].questions})));
 return {day:today,requested:allocation.requested,assigned:allocation.assigned,shortfall:allocation.shortfall,
 status:allocation.status,rows:rows.map((r,i)=>({...r,questions:undefined,allocated:allocation.rows[i].assigned,
 crossTaskShortage:Math.max(0,r.eligible-allocation.rows[i].assigned)})),
 assigned:allocation.rows.map(t=>({id:t.id,questionIds:t.items.map(q=>q.id)}))};
}
