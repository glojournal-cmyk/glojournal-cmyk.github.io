import test from 'node:test';
import assert from 'node:assert/strict';
import {saveMarkedAnswer,readMarkedAnswers} from '../assets/durable-study-evidence-20261018.js';
const key='lux-marked-answer-fallback-v1';
const original=globalThis.localStorage;
const mockStorage=({throwOnWrite=false}={})=>{
 const data=new Map();
 return {data,
  getItem:k=>data.has(k)?data.get(k):null,
  setItem:(k,v)=>{if(throwOnWrite)throw Object.assign(Error('Storage quota exceeded'),{name:'QuotaExceededError'});data.set(k,String(v));},
  removeItem:k=>data.delete(k),clear:()=>data.clear()};
};
const entry=()=>{const at=new Date().toISOString();return {
 day:at.slice(0,10),at,attemptId:'v31-maths-fault-qa-'+at,
 questionId:'math-v31-Q1',subject:'maths',year:9,topicId:'math-y9-indices',
 dailyTaskId:'maths-daily',selectedOptionId:'A',correct:false,
 formal:true,repair:false,assisted:false,hintUsed:false,scaffolded:false
}};
test('IndexedDB unavailable: compact local fallback preserves original A-F and assistance flags',async()=>{
 const local=mockStorage();globalThis.localStorage=local;
 try{
  const e=entry();const result=await saveMarkedAnswer(e);
  assert.equal(result,true);
  const raw=JSON.parse(local.getItem(key));
  assert.equal(raw.length,1);
  const saved=raw[0];
  assert.equal(saved.selectedOptionId,'A');
  assert.equal(saved.assisted,false);
  assert.equal(saved.hintUsed,false);
  assert.equal(saved.scaffolded,false);
  assert.equal(saved.dailyTaskId,'maths-daily');
  assert.equal(saved.correct,false);
  assert.equal(saved.questionId,e.questionId);
  const recovered=await readMarkedAnswers();
  assert.equal(recovered.length,1);
  assert.equal(recovered[0].selectedOptionId,'A');
  assert.equal(recovered[0].correct,false);
  assert.deepEqual([...local.data.keys()],[key],'must not overwrite Scholar progress, XP, MP or Recovery');
  // Same attemptId must not silently rewrite first wrong answer.
  assert.equal(await saveMarkedAnswer({...e,correct:true,selectedOptionId:'B'}),true);
  assert.equal(JSON.parse(local.getItem(key)).length,1);
  assert.equal(JSON.parse(local.getItem(key))[0].correct,false);
 }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original}
});
test('If IndexedDB and localStorage both fail, the promise returns false and never fabricates durability',async()=>{
 const local=mockStorage({throwOnWrite:true});globalThis.localStorage=local;
 try{
  const ok=await saveMarkedAnswer(entry());
  assert.equal(ok,false);
  assert.equal(local.data.size,0);
 }finally{if(original===undefined)delete globalThis.localStorage;else globalThis.localStorage=original}
});
