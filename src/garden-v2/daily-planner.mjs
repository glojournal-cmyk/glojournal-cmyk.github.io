// Garden V2 only — read-only allocation; never imports the live Daily planner.
// Inputs must be learner-filtered by taught status, prior credit, dates, grading readiness.
import {allocateGlobalQuestions} from '../lib/daily/global-allocation-preflight-20261026.mjs';

export const V2_DAILY_QUOTAS=Object.freeze([30,30,10,10,10,20,20,10,3,20]);
export const V2_DAILY_TOTAL=163;

export function planGardenV2Day(tasks,{previouslyCreditedIds=[],reservedQuestions=[]}={}){
 if(!Array.isArray(tasks)||tasks.length!==V2_DAILY_QUOTAS.length||
    tasks.some((t,i)=>!t||typeof t.id!=='string'||!t.id||t.target!==V2_DAILY_QUOTAS[i]||!Array.isArray(t.candidates)))
  throw new TypeError('Garden V2 requires exactly ten valid ordered Daily task pools');
 if(new Set(tasks.map(t=>t.id)).size!==tasks.length)throw new TypeError('Duplicate Garden V2 task ID');
 if(!Array.isArray(previouslyCreditedIds)||!Array.isArray(reservedQuestions)||
   reservedQuestions.some(q=>!q||typeof q.id!=='string'||!q.id))
  throw new TypeError('Invalid Garden V2 exclusions or reservations');
 const credited=new Set(previouslyCreditedIds);
 const fixed=reservedQuestions.map((q,i)=>({id:'v2-existing-reservation-'+i,target:1,candidates:[q]}));
 const filtered=tasks.map(t=>({
  id:t.id,target:t.target,
  candidates:t.candidates.filter(q=>q&&typeof q.id==='string'&&!credited.has(q.id))
 }));
 const result=allocateGlobalQuestions([...fixed,...filtered]);
 const fixedRows=result.rows.slice(0,fixed.length);
 const rows=result.rows.slice(fixed.length).map((r,i)=>({
  id:tasks[i].id,requested:r.requested,assigned:r.assigned,
  shortage:r.deficit,questionIds:r.items.map(q=>q.id)
 }));
 const reservationShortage=fixedRows.reduce((n,r)=>n+r.deficit,0);
 const assigned=rows.reduce((n,r)=>n+r.assigned,0);
 return {version:2,status:result.status==='FULL_READY'?'FULL_READY':'PARTIAL_READY',
  requested:V2_DAILY_TOTAL,assigned,shortage:V2_DAILY_TOTAL-assigned,
  reservationConflict:reservationShortage>0,rows};
}
