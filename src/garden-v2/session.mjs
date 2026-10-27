// Garden V2 only. Pure session state transitions, not connected to the old app.
import {emptyV2Ledger,recordV2Answer,summarizeV2Task} from './scoring-ledger.mjs';

const validId=x=>typeof x==='string'&&x.length>0;
export function startV2Session(dayPlan,taskId,savedLedger=emptyV2Ledger()){
 if(dayPlan?.version!==2||!Array.isArray(dayPlan.rows)||!validId(taskId))
  throw new TypeError('Invalid V2 plan or task');
 const task=dayPlan.rows.find(row=>row.id===taskId);
 if(!task||!Array.isArray(task.questionIds)||!Number.isInteger(task.requested))
  throw new TypeError('V2 task not found');
 if(savedLedger?.version!==2||!savedLedger.receipts||!savedLedger.tasks)
  throw new TypeError('Invalid V2 ledger');
 // Never replace a partially completed allocation with a fresh plan.
 const existing=savedLedger.tasks[taskId]?.assignedIds;
 if(existing && JSON.stringify(existing)!==JSON.stringify(task.questionIds))
  throw new Error('Existing V2 task allocation differs: explicit migration required');
 const ledger=existing?savedLedger:{
  ...savedLedger,tasks:{...savedLedger.tasks,[taskId]:{
   questionIds:[],earnedMarks:0,xp:0,...savedLedger.tasks[taskId],
   assignedIds:[...task.questionIds]
  }}
 };
 return {ledger,task:readV2Session(ledger,taskId,task.requested)};
}
export function readV2Session(ledger,taskId,target){
 const state=ledger?.tasks?.[taskId];
 if(!state?.assignedIds)throw new Error('V2 session not started');
 const done=new Set(Object.values(ledger.receipts).filter(r=>r.taskId===taskId&&r.correct).map(r=>r.questionId));
 const completed=state.assignedIds.filter(id=>done.has(id));
 const outstanding=state.assignedIds.filter(id=>!done.has(id));
 return {...summarizeV2Task(ledger,taskId,target),
  assignedIds:[...state.assignedIds],completedIds:completed,outstandingIds:outstanding,
  unallocated:Math.max(0,target-state.assignedIds.length)};
}
export function answerV2Session(ledger,{taskId,questionId,...answer},target){
 const assigned=ledger?.tasks?.[taskId]?.assignedIds;
 if(!Array.isArray(assigned)||!assigned.includes(questionId))
  throw new Error('V2 answer not part of preserved task allocation');
 const outcome=recordV2Answer(ledger,{taskId,questionId,...answer});
 return {...outcome,task:readV2Session(outcome.ledger,taskId,target)};
}
