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
   assert.ok(part.stem.includes('?'), part.pointId);
   assert.ok(!part.stem.includes('independent mark point'));
   assert.equal(new Set(item.parts.map(p=>p.stem)).size,item.parts.length);
   assert.equal(part.options.length,4);
   assert.equal(new Set(part.options.map(o=>o.id)).size,4);
   assert.equal(new Set(part.options.map(o=>o.text.toLowerCase().trim())).size,4);
   assert.equal(part.options.filter(o=>o.text===part.keyedAnswer).length,1);
   assert.equal(part.options.find(o=>o.id===part.correctOptionId)?.text,part.keyedAnswer);
   assert.ok(part.options.every(o=>typeof o.text==='string'&&o.text.trim().length>0));
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

test('Each option affects only its own point in the isolated scorer',()=>{
 for(const item of candidate.items){
  const fixture={...item,academicReview:'approved',parts:item.parts.map(p=>({...p,approved:true}))};
  for(const part of fixture.parts){
   for(const option of part.options){
    const result=scoreConceptChoices(fixture,{[part.pointId]:option.id});
    assert.equal(result.score,Number(option.id===part.correctOptionId),option.id);
    assert.equal(result.formalCreditEligible,false);
   }
  }
 }
});

test('The review register accounts for all remaining bank IDs and the 16 outcome patterns',()=>{
 const register=read('qa/food-tests-other-91-review-20261122.json');
 const sources=[...candidate.items.map(i=>i.sourceId),...register.items.map(i=>i.id)];
 assert.equal(register.items.length,91);
 assert.equal(sources.length,143);
 assert.deepEqual(new Set(sources),new Set(bankById.keys()));
 const exemplars=register.items.filter(i=>i.disposition==='review-one-exemplar');
 assert.equal(new Set(exemplars.map(i=>i.scienceKey)).size,16);
 const repeats=register.items.filter(i=>i.equivalentTo);
 assert.equal(repeats.length,48);
 for(const row of register.items){
  assert.equal(row.formalCreditEligible,false);
  if(row.proposedPrompt){
   assert.deepEqual(bankById.get(row.id).answer.accepted,[row.scienceKey]);
   if(row.equivalentTo) assert.ok(exemplars.some(e=>e.id===row.equivalentTo && e.scienceKey===row.scienceKey));
  }
 }
});

test('three repeated recall stems now challenge unsupported inferences without changing source answer keys',()=>{
 const byPoint=new Map(candidateParts.map(x=>[x.pointId,x]));
 const expectations=[
  ['bio-y8-food-tests-application-20261025-wrong-reagent::p2',/orange-brown result means it contains no protein/i,'Biuret reagent'],
  ['bio-y8-food-tests-application-20261025-unknown-analysis::p1',/unperformed tests/i,'Starch was detected'],
  ['bio-y8-food-tests-application-20261025-sugar-analysis::p1',/wrongly claims it proves starch/i,'Reducing sugar was detected']
 ];
 assert.deepEqual(candidate.qaDraftSecondPass.evidenceLimitStemRedesignIndices,[87,94,97]);
 for(const [id,stemPattern,key] of expectations){
  const point=byPoint.get(id);
  assert.match(point.stem,stemPattern,id);
  assert.equal(point.options.find(o=>o.id===point.correctOptionId)?.text,key,id);
  assert.equal(point.keyedAnswer,key,id);
  assert.equal(point.approved,false,id);
  assert.equal(point.distractorReview,'pending',id);
 }
});


test('adversarial option quality round 5 preserves exact science key and rejects nonsensical foils',()=>{
 const fixes=[
  [38,'Hot glass can burn the hand',/stops being a burn hazard/],
  [40,'More of the inside of the food is exposed',/guarantees every protein/],
  [42,'More surface is exposed for the same mass',/total surface area stays the same/]
 ];
 for(const [index,key,foil] of fixes){
  const part=candidateParts[index-1];
  assert.equal(part.keyedAnswer,key);
  assert.equal(part.options.find(o=>o.id===part.correctOptionId)?.text,key);
  assert.ok(part.options.some(o=>foil.test(o.text)),part.pointId);
  assert.equal(new Set(part.options.map(o=>o.text)).size,4);
  assert.equal(part.approved,false);
  assert.equal(part.distractorReview,'pending');
 }
 assert.deepEqual(candidate.qaDraftSecondPass.additionalMisconceptionDistractorFixes,[38,40,42]);
 assert.equal(candidate.approved,0);
});


test('two nuanced source concepts remain represented in unapproved MCQ choices',()=>{
 const p61=candidateParts[60],p93=candidateParts[92];
 assert.match(p61.concept,/below the detection limit/i);
 assert.match(p61.keyedAnswer,/do not target every nutrient/i);
 assert.match(p61.keyedAnswer,/below detection limits/i);
 assert.match(p61.stem,/working controls/i);
 assert.match(p93.concept,/open flame can ignite/i);
 assert.match(p93.stem,/yellow safety flame/i);
 assert.equal(p93.keyedAnswer,'The vapour can catch fire');
 for(const row of [p61,p93]){
  assert.equal(row.options.find(z=>z.id===row.correctOptionId)?.text,row.keyedAnswer);
  assert.equal(row.options.filter(z=>z.text===row.keyedAnswer).length,1);
  assert.equal(row.approved,false);
  assert.equal(row.distractorReview,'REWRITTEN_QA_DRAFT_REQUIRES_INDEPENDENT_SOLE_KEY_REVIEW'==='foo'?'foo':'pending');
 }
 assert.equal(candidate.formalCreditEligible,false);
 assert.equal(candidate.approved,0);
});
