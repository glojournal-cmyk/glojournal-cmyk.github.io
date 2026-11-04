/* Daily V2 — deterministic multi-day PRE-DEPLOYMENT simulator.
 * Synthetic or independently certified bank input only. Never writes student
 * data, and must NOT be used as real-time daily task service.
 */
import {planDailyV2,DAILY_V2_TASKS} from './planner.js';
import {createDailyV2ContinuityPlan} from './continuity.js';
function requireSim(ok,message){if(!ok)throw new Error('DailyV2 simulation: '+message);}
function isoDay(start,offset){
 const d=new Date(start+'T12:00:00.000Z');
 requireSim(!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===start,'invalid ISO startDate');
 d.setUTCDate(d.getUTCDate()+offset);
 return d.toISOString().slice(0,10);
}
export function simulateDailyV2Days({
 startDate,days=30,questionBank=[],taughtTopicIds=[],priorAttempts=[],
 correctQuestionIds=[],masteryStages={},subjectExposure={},continuityMode='none'
}={}){
 requireSim(Number.isInteger(days)&&days>=1&&days<=90,'days must be 1..90');
 requireSim(['none','staging-partial'].includes(continuityMode),'invalid continuity mode');
 requireSim(Array.isArray(priorAttempts)&&Array.isArray(questionBank),'bank/history arrays required');
 const history=priorAttempts.map(a=>({...a}));
 const details=[],dailyTotals=[];
 let partialDays=0;
 for(let i=0;i<days;i++){
  const day=isoDay(startDate,i);
  let plan=planDailyV2({day,questionBank,priorAttempts:history,
   taughtTopicIds,correctQuestionIds,masteryStages,subjectExposure});
  if(plan.status==='blocked'&&continuityMode==='staging-partial'){
   try{plan=createDailyV2ContinuityPlan(plan)}catch{/* genuine shortage, not silently bypassed */}
  }
  if(!['ready','partial'].includes(plan.status)){
   return {status:'blocked',startDate,requestedDays:days,completedDays:details.length,
    firstBlockedDay:day,diagnostics:plan.diagnostics,partialDays,
    days:details,totals:dailyTotals,syntheticAllCorrect:true,
    disclaimer:'Simulation only; no real bank certification or Safari storage proof.'};
  }
  const questions=plan.tasks.flatMap(t=>t.questions.map(q=>({...q,taskId:t.id,taskKind:t.kind})));
  const taskIds=new Set(plan.tasks.map(t=>t.id));
  const ids=new Set(questions.map(q=>q.questionId));
  const expectedCount=plan.status==='partial'?plan.availableTarget:163;
  requireSim(taskIds.size===plan.tasks.length &&questions.length===expectedCount
     &&ids.size===expectedCount &&
     (plan.status==='partial'||taskIds.size===DAILY_V2_TASKS.length),
     'plan published an invalid or duplicated question roster');
  if(plan.status==='partial')partialDays++;
  for(const question of questions){
   history.push({
    eventId:'sim|'+day+'|'+question.taskId+'|'+question.questionId,
    day,taskId:question.taskId,questionId:question.questionId,
    conceptId:question.conceptId||null,correct:true,persisted:true
   });
  }
  const vocabConceptsBySubject=Object.fromEntries(plan.tasks.filter(t=>t.kind==='vocab')
   .map(t=>[t.subject,t.questions.map(q=>q.conceptId)]));
  details.push({day,status:plan.status==='partial'?'partial':'completed',questions:questions.length,
   taskCount:plan.tasks.length,vocabConceptsBySubject,
   masteryTopicIds:plan.tasks.filter(t=>t.kind==='mastery').map(t=>t.topicId),
   retentionCount:plan.tasks.find(t=>t.kind==='retention')?.questions.length||0});
  dailyTotals.push(questions.length);
 }
 return {status:partialDays>0?'partial':'ready',startDate,requestedDays:days,
   completedDays:details.length,partialDays,fullDays:details.length-partialDays,
   fullDayTarget:163,questionsNotAssigned:days*163-dailyTotals.reduce((a,b)=>a+b,0),
   days:details,totals:dailyTotals,simulatedAnswered:history.length-priorAttempts.length,
   syntheticAllCorrect:true,
   disclaimer:'Synthetic all-correct upper-bound simulation only; does not prove real bank quality, user history or Safari reliability.'};
}
