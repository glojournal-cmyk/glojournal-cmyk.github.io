import test from 'node:test';
import assert from 'node:assert/strict';
import {V2_DAILY_QUOTAS,V2_DAILY_TOTAL,planGardenV2Day} from '../src/garden-v2/daily-planner.mjs';
const pools=(extra=0)=>V2_DAILY_QUOTAS.map((target,i)=>({id:'task-'+i,target,
 candidates:Array.from({length:target+extra},(_,j)=>({id:'q-'+i+'-'+j,prompt:'Unique prompt '+i+' '+j,format:'typed_exact'}))}));
test('ten independent task pools fill all 163 slots with no duplicate credit',()=>{
 const result=planGardenV2Day(pools());
 assert.equal(V2_DAILY_TOTAL,163);assert.equal(result.status,'FULL_READY');
 assert.equal(result.assigned,163);assert.equal(result.shortage,0);
 const ids=result.rows.flatMap(x=>x.questionIds);
 assert.equal(new Set(ids).size,163);
 assert.ok(result.rows.every((r,i)=>r.assigned===V2_DAILY_QUOTAS[i]));
});
test('prior successes are excluded; exhausted pools report explicit shortage',()=>{
 const original=pools();
 const credited=original[0].candidates.slice(0,8).map(q=>q.id);
 const result=planGardenV2Day(original,{previouslyCreditedIds:credited});
 assert.equal(result.status,'PARTIAL_READY');assert.equal(result.assigned,155);
 assert.equal(result.shortage,8);assert.equal(result.rows[0].shortage,8);
 assert.ok(result.rows[0].questionIds.every(id=>!credited.includes(id)));
});
test('distinct IDs in same conceptual family cannot fill two tasks',()=>{
 const tasks=pools();
 tasks[0].candidates[0].questionFamily='shared';
 tasks[1].candidates[0].questionFamily='shared';
 const result=planGardenV2Day(tasks);
 assert.equal(result.status,'PARTIAL_READY');assert.equal(result.assigned,162);
});
test('other Daily reservations never silently recycle an already assigned concept',()=>{
 const tasks=pools();
 const reserved={id:'elsewhere',prompt:tasks[0].candidates[0].prompt,format:'typed_exact'};
 const result=planGardenV2Day(tasks,{reservedQuestions:[reserved]});
 assert.equal(result.status,'PARTIAL_READY');
 assert.equal(result.shortage,1);
});
test('30 day synthetic planner honestly stops after finite 4890-question supply',()=>{
 const all=pools().map((t,i)=>({...t,candidates:Array.from({length:t.target*30},(_,j)=>({
  id:'day-'+i+'-'+j,prompt:'day unique '+i+' '+j,format:'typed_exact'
 }))}));
 const credited=new Set();
 for(let d=0;d<30;d++){
  const r=planGardenV2Day(all,{previouslyCreditedIds:[...credited]});
  assert.equal(r.status,'FULL_READY','day '+(d+1));
  for(const id of r.rows.flatMap(x=>x.questionIds)){
   assert.equal(credited.has(id),false);credited.add(id);
  }
 }
 assert.equal(credited.size,4890);
 const exhausted=planGardenV2Day(all,{previouslyCreditedIds:[...credited]});
 assert.equal(exhausted.status,'PARTIAL_READY');
 assert.equal(exhausted.shortage,163);
});
test('malformed task contract is rejected and does not modify inputs',()=>{
 assert.throws(()=>planGardenV2Day(pools().slice(0,9)),/ten valid/);
 const orig=pools();const before=JSON.stringify(orig);planGardenV2Day(orig);
 assert.equal(JSON.stringify(orig),before);
});
