import assert from 'node:assert/strict';
import test from 'node:test';
import {allocateGlobalQuestions} from '../src/lib/daily/global-allocation-preflight-20261026.mjs';
const q=(id,prompt,format='typed_exact')=>({id,prompt,format});
test('constrained task retains unique item; flexible task receives its alternative',()=>{
 const shared=q('shared','name nucleus'),extra=q('extra','name mitochondria');
 const r=allocateGlobalQuestions([{id:'flex',target:1,candidates:[shared,extra]},{id:'scarce',target:1,candidates:[shared]}]);
 assert.equal(r.status,'FULL_READY');assert.equal(r.rows[0].items[0].id,'extra');assert.equal(r.rows[1].items[0].id,'shared');
});
test('identical content with different IDs cannot claim two tasks',()=>{
 const r=allocateGlobalQuestions([{id:'a',target:1,candidates:[q('1','What is density?')]},{id:'b',target:1,candidates:[q('2','What is density?')]}]);
 assert.equal(r.status,'PARTIAL_READY');assert.equal(r.assigned,1);
});
test('different questions testing one concept may appear in different skill roles',()=>{
 const r=allocateGlobalQuestions([{id:'vocab',target:1,candidates:[q('v','Translate puella')]},{id:'standard',target:1,candidates:[q('s','Identify subject in puella legit','controlled_translation')]}]);
 assert.equal(r.status,'FULL_READY');
});
test('retention bank emptiness does not fabricate ten answered items',()=>{
 const r=allocateGlobalQuestions([{id:'retention',target:10,candidates:[]},{id:'other',target:2,candidates:[q('a','one'),q('b','two')]}]);
 assert.equal(r.status,'PARTIAL_READY');assert.equal(r.rows[0].deficit,10);assert.equal(r.rows[1].assigned,2);
});
test('given 163 distinct eligible items all ten daily quotas can be reserved',()=>{
 const targets=[30,30,10,10,10,20,20,10,3,20];let n=0;
 const r=allocateGlobalQuestions(targets.map((target,i)=>({id:'task-'+i,target,candidates:Array.from({length:target},()=>{const num=n++;return q('question-'+num,'independent prompt '+num);})})));
 assert.equal(r.status,'FULL_READY');assert.equal(r.assigned,163);
});

test('matching cards with different word pairs are NOT identical merely because the heading matches',()=>{
 const a={id:'match-a',prompt:'Match each term to its meaning.',format:'matching',stimulus:{},answer:{mode:'pair_map',pairs:[{left:'leaf',right:'photosynthesis'}]}};
 const b={id:'match-b',prompt:'Match each term to its meaning.',format:'matching',stimulus:{},answer:{mode:'pair_map',pairs:[{left:'root',right:'absorption'}]}};
 const r=allocateGlobalQuestions([{id:'a',target:1,candidates:[a]},{id:'b',target:1,candidates:[b]}]);
 assert.equal(r.status,'FULL_READY');assert.equal(r.assigned,2);
});

test('nominal twenty-five questions are insufficient after ten prior correct exclusions',()=>{
 const bank=Array.from({length:25},(_,i)=>q('bank-'+i,'Question '+i));
 const alreadyCorrect=new Set(bank.slice(0,10).map(x=>x.id));
 const eligible=bank.filter(x=>!alreadyCorrect.has(x.id));
 const r=allocateGlobalQuestions([{id:'mastery',target:20,candidates:eligible}]);
 assert.equal(r.status,'PARTIAL_READY');assert.equal(r.rows[0].assigned,15);assert.equal(r.shortfall,5);
});
test('the real standalone GCSE bank cannot supply the proposed 1+2+3 marks yet',async()=>{
 const fs=await import('node:fs');
 const questions=JSON.parse(fs.readFileSync('content/exam-practice/gcse-20261024.json','utf8')).questions;
 const tasks=[1,2,3].map(marks=>({
  id:'exam-'+marks,target:1,candidates:questions.filter(q=>q.marks===marks).map(q=>({
    ...q,format:q.kind,prompt:q.prompt,stimulus:q.stimulus||''
  }))
 }));
 const r=allocateGlobalQuestions(tasks);
 assert.equal(r.status,'PARTIAL_READY');assert.equal(r.rows[0].deficit,1);assert.equal(r.rows[1].deficit,1);
 assert.equal(r.rows[2].assigned,1);
});

test('30 consecutive synthetic dates preserve 163 unique slots and never re-credit a prior success',()=>{
 const quotas=[30,30,10,10,10,20,20,10,3,20];
 assert.equal(quotas.reduce((a,b)=>a+b,0),163);
 const pools=quotas.map((quota,task)=>Array.from({length:quota*30},(_,i)=>q('daybank-'+task+'-'+i,'unique '+task+'-'+i)));
 const credited=new Set();
 for(let day=0;day<30;day++){
  const tasks=pools.map((pool,task)=>({
   id:'daily-'+task,target:quotas[task],
   candidates:pool.filter(question=>!credited.has(question.id))
  }));
  const result=allocateGlobalQuestions(tasks);
  assert.equal(result.status,'FULL_READY','day '+(day+1)+' should be fully reserved');
  assert.equal(result.assigned,163);
  const ids=result.rows.flatMap(row=>row.items.map(question=>question.id));
  assert.equal(new Set(ids).size,163);
  for(const id of ids){
   assert.equal(credited.has(id),false,'previously credited question recurred');
   credited.add(id);
  }
 }
 assert.equal(credited.size,4890);
 const exhausted=allocateGlobalQuestions(pools.map((pool,task)=>({
  id:'daily-'+task,target:quotas[task],candidates:pool.filter(question=>!credited.has(question.id))
 })));
 assert.equal(exhausted.status,'PARTIAL_READY');
 assert.equal(exhausted.shortfall,163);
});
test('cross-task conceptual reservations make a nominal 163-question day explicitly partial',()=>{
 const quotas=[30,30,10,10,10,20,20,10,3,20];
 let index=0;
 const tasks=quotas.map((target,task)=>({
  id:'task-'+task,target,
  candidates:Array.from({length:target},()=>{
   const n=index++;
   return {...q('id-'+n,'different text '+n),questionFamily:n===30?'previously-assigned-concept':'family-'+n};
  })
 }));
 tasks[0].candidates[0].questionFamily='previously-assigned-concept';
 const r=allocateGlobalQuestions(tasks);
 assert.equal(r.status,'PARTIAL_READY');
 assert.equal(r.shortfall,1);
 assert.equal(r.assigned,162);
});
