import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fillDailyLockedQuestions} from '../assets/daily-locked-question-fallback-20261021.js';
const bank=JSON.parse(readFileSync(new URL('../content/topics/bio-y8-food-tests.json',import.meta.url),'utf8'));
const oldIds=new Set(bank.questions.filter(q=>!q.id.includes('20261025-')).map(q=>q.id));
test('Year 8 food tests has substantial fresh, genuine exam-style bank',()=>{
 assert.equal(bank.topicId,'bio-y8-food-tests');
 assert.ok(bank.questions.length>=130);
 assert.equal(new Set(bank.questions.map(q=>q.id)).size,bank.questions.length);
 assert.equal(bank.enabled,bank.questions.filter(q=>q.status==='enabled').length);
 for(const q of bank.questions){
  assert.equal(q.topicId,bank.topicId);
  assert.ok(q.prompt?.length>12);
  assert.ok(q.answer?.accepted?.length||q.answer?.markPoints?.length||q.answer?.pairs?.length);
  if(q.format==='mc_single'){
   assert.equal(q.options.length,4);
   assert.equal(new Set(q.options).size,4);
   assert.ok(q.options.includes(q.answer.accepted[0]));
  }
 }
});
test('When 33 original questions are already correct, Daily still serves 10 genuinely unused questions',()=>{
 const picked=fillDailyLockedQuestions([],bank.questions,{locked:true,mode:'standard',size:10,subject:'biology',topicId:bank.topicId,correctIds:oldIds},items=>items,(items,mode,size)=>items.slice(0,size));
 assert.equal(picked.length,10);
 assert.ok(picked.every(q=>!oldIds.has(q.id)));
});
test('Previously correct questions are not recycled on next Daily 15-question challenge',()=>{
 const used=new Set(bank.questions.slice(0,90).map(q=>q.id));
 const picked=fillDailyLockedQuestions([],bank.questions,{locked:true,mode:'standard',size:15,subject:'biology',topicId:bank.topicId,correctIds:used},items=>items,(items,mode,size)=>items.slice(0,size));
 assert.equal(picked.length,15);
 assert.ok(picked.every(q=>!used.has(q.id)));
});
test('The active loader refreshes the food-tests JSON instead of iPad cached 33-item bank',()=>{
 const source=readFileSync(new URL('../assets/index-BLVOhKhN.core.js',import.meta.url),'utf8');
 assert.ok(source.includes('content/topics/'));
 assert.ok(source.includes('20261025-food-tests-bank2'));
});
