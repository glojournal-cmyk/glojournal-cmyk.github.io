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
