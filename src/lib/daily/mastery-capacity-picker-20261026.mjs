// Read-only Mastery topic-capacity proposal for the next Daily engine.
// NEVER overwrite/rescore an already opened or credited assignment with this planner.
// Supply loaded eligible Year 8 topic pools, taught flags and a sanitized learner state.
import {diagnoseTaskQuestionEligibility} from './question-eligibility-diagnostics-20261026.mjs';
import {allocateGlobalQuestions} from './global-allocation-preflight-20261026.mjs';
const positive=x=>Number.isFinite(Number(x))?Number(x):0;
export function proposeTwoMasteryTopics(topicPools=[],state={},day=state.today||'',options={}){
 const target=20,limit=Math.max(1,Math.min(2000,Math.floor(Number(options.maxPairs)||500)));
 const evaluated=[],skipped=[];
 // Optional previously assigned Daily questions must be supplied as full question
 // objects, not IDs, so family/fingerprint collisions can also be detected.
 const reserved=options.reservedQuestions||[];
 if(!Array.isArray(reserved)||reserved.some(q=>!q||!q.id))
  return {status:'NEEDS_REVIEW',reason:'invalid_reserved_questions'};
 const fixed=reserved.map((q,i)=>({id:'existing-daily-'+i,target:1,candidates:[q]}));
 for(const topic of topicPools){
  if(!topic?.topicId||topic.taught===false||topic.status==='disabled'||Number(topic.year||8)!==8){
   skipped.push({topicId:topic?.topicId||null,reason:'not_enabled_taught_y8'});continue;
  }
  const task={id:'mastery-preview',subject:topic.subject,year:8,topicId:topic.topicId,mode:'mastery',target};
  const diag=diagnoseTaskQuestionEligibility(task,topic.questions||[],state,day);
  const row={topicId:topic.topicId,subject:topic.subject,priority:positive(topic.priority),eligible:diag.eligible,
    available:diag.questions,shortage:diag.shortage,exclusionReasons:diag.reasons};
  if(diag.eligible<target){skipped.push({topicId:topic.topicId,reason:'insufficient_fresh_questions',eligible:diag.eligible,needed:target});continue}
  evaluated.push(row);
 }
 // Upstream curriculum logic defines priority. Never make guessed curriculum choices.
 evaluated.sort((a,b)=>b.priority-a.priority||b.eligible-a.eligible||a.topicId.localeCompare(b.topicId));
 let checked=0;
 for(let i=0;i<evaluated.length;i++){
  for(let j=i+1;j<evaluated.length;j++){
   if(checked++>=limit)return {status:'NEEDS_REVIEW',reason:'pair_search_limit',checked,eligibleTopics:evaluated.length,skipped};
   const [a,b]=[evaluated[i],evaluated[j]];
   const reservation=allocateGlobalQuestions([
    ...fixed,
    {id:'y8-mastery-a',target,candidates:a.available},
    {id:'y8-mastery-b',target,candidates:b.available}
   ]);
   if(reservation.status!=='FULL_READY')continue;
   return {status:'FULL_READY',checked,eligibleTopics:evaluated.length,skipped,
    assignments:[{taskId:'y8-mastery-a',topicId:a.topicId,subject:a.subject,questionIds:reservation.rows[fixed.length].items.map(q=>q.id)},
     {taskId:'y8-mastery-b',topicId:b.topicId,subject:b.subject,questionIds:reservation.rows[fixed.length+1].items.map(q=>q.id)}]};
  }
 }
 return {status:'NOT_READY',reason:'two_nonoverlapping_20_question_pools_unavailable',checked,
 eligibleTopics:evaluated.length,skipped};
}
