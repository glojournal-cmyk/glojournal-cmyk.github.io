// QA-only structural coverage. A complete draft is never approval.
// Run via Node 22; all learner credit remains blocked.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateConceptChoiceItem,scoreConceptChoices} from '../assets/food-tests-structured-concept-checks-20261122.js';
import {FOOD_TESTS_QA_HOLD_IDS,isFoodTestsQaHeld,canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const bank=read('content/topics/bio-y8-food-tests.json');
const source=read('qa/food-tests-structured-mark-points-draft-20261122.json');
const candidate=read('qa/food-tests-structured-99-point-review-candidate-20261122.json');
const sourceById=new Map(source.items.map(q=>[q.sourceId,q]));
const bankById=new Map(bank.questions.map(q=>[q.id,q]));
const candidateParts=candidate.items.flatMap(q=>q.parts);
test('The 52 candidates retain all 99 source mark points and exact source concepts',()=>{
 assert.equal(source.items.length,52);
 assert.equal(candidate.items.length,52);
 assert.equal(candidateParts.length,99);
 assert.equal(candidate.approved,0);
 assert.equal(candidate.formalCreditEligible,false);
 assert.equal(candidate.status,'academic-review-required');
 assert.equal(candidate.sourceSha.length,40);
 assert.equal(new Set(candidate.items.map(q=>q.sourceId)).size,52);
 assert.equal(new Set(candidateParts.map(p=>p.pointId)).size,99);
 for(const item of candidate.items){
  const original=sourceById.get(item.sourceId);
  assert.ok(original,'Unknown source ID '+item.sourceId);
  assert.ok(bankById.has(item.sourceId),'Not in actual bank '+item.sourceId);
  assert.equal(item.academicReview,'pending');
  assert.equal(item.totalMarks,original.totalMarks);
  assert.equal(item.parts.length,original.parts.length);
  assert.equal(item.totalMarks,item.parts.length);
  for(let n=0;n<item.parts.length;n++){
   const part=item.parts[n],prior=original.parts[n];
   assert.equal(part.pointId,prior.pointId);
   assert.equal(part.concept,prior.concept);
   assert.equal(part.approved,false);
   assert.equal(part.academicReview,'pending');
   assert.equal(part.distractorReview,'pending');
   assert.ok(part.stem.startsWith(item.sourcePrompt),'No source question in stem');
   assert.ok(part.stem.includes('independent mark point'));
   assert.equal(part.options.length,4);
   assert.equal(new Set(part.options.map(o=>o.id)).size,4);
   assert.equal(new Set(part.options.map(o=>o.text.toLowerCase().trim())).size,4);
   assert.equal(part.options.filter(o=>o.text===part.concept).length,1);
   assert.equal(part.options.find(o=>o.id===part.correctOptionId)?.text,part.concept);
   assert.ok(part.options.every(o=>typeof o.text==='string'&&o.text.length>=15));
  }
 }
});
test('All 52 structured proposals are still unapproved even when all answers are correct',()=>{
 const holdSet=new Set(FOOD_TESTS_QA_HOLD_IDS);
 for(const item of candidate.items){
  assert.ok(holdSet.has(item.sourceId));
  assert.equal(isFoodTestsQaHeld(item.sourceId),true);
  assert.equal(canEarnFormalCredit(item.sourceId),false);
  const answers=Object.fromEntries(item.parts.map(p=>[p.pointId,p.correctOptionId]));
  assert.equal(validateConceptChoiceItem(item).valid,false);
  const attempted=scoreConceptChoices(item,answers);
  assert.equal(attempted.score,0);
  assert.equal(attempted.formalCreditEligible,false);
  assert.equal(attempted.status,'academic-qa-pending');
 }
});
test('Structural validation never grants formal bank credit even when local approval flags are forged',()=>{
 for(const item of candidate.items){
  const forged={...item,academicReview:'approved',parts:item.parts.map(p=>({...p,approved:true}))};
  assert.equal(validateConceptChoiceItem(forged).valid,true);
  const answers=Object.fromEntries(forged.parts.map(p=>[p.pointId,p.correctOptionId]));
  const result=scoreConceptChoices(forged,answers);
  assert.equal(result.score,forged.totalMarks);
  assert.equal(result.formalCreditEligible,false);
 }
});
