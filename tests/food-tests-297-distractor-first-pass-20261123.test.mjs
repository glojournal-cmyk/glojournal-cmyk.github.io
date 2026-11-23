// QA-only proof that all 396 candidate choices have a source-linked triage record.
// A machine match / AI first-pass screen cannot grant independent academic approval.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const c=read('qa/food-tests-structured-99-point-review-candidate-20261122.json');
const matrix=read('qa/food-tests-297-distractor-first-pass-20261123.json');
const review=read('qa/food-tests-independent-academic-143-review-20261123.json');
const flat=c.items.flatMap(q=>q.parts);
test('all 99 source points and all 396 MCQ answer alternatives have exact held QA entries',()=>{
 assert.equal(matrix.status,'QA_FIRST_PASS_NOT_INDEPENDENT_ACADEMIC_APPROVAL');
 assert.equal(matrix.questions.length,99);
 assert.equal(flat.length,99);
 assert.deepEqual(matrix.counts,{groups:99,sourceMarkPoints:99,options:396,proposedKeys:99,distractors:297,individualSpecificDistractorReasons:45,distractorNotesAtFamilyLevel:252,qualifiedApprovals:0});
 const ids=[];
 let wrong=0,individual=0;
 for(let n=0;n<99;n++){
  const p=flat[n],row=matrix.questions[n];
  assert.equal(row.ordinal,n+1);
  assert.equal(row.pointId,p.pointId);
  assert.equal(row.stem,p.stem);
  assert.equal(row.sourceConcept,p.concept);
  assert.equal(row.keyId,p.correctOptionId);
  assert.equal(row.keyText,p.keyedAnswer);
  assert.equal(row.approved,false);
  assert.equal(row.formalCreditEligible,false);
  assert.equal(row.singleKeyReview,'PENDING_INDEPENDENT_TEACHER');
  assert.equal(row.distractorPlausibilityReview,'PENDING_INDEPENDENT_TEACHER');
  assert.equal(row.tgsTaughtScope,'PENDING');
  assert.equal(canEarnFormalCredit(row.pointId.split('::')[0]),false);
  assert.equal(row.choices.length,4);
  assert.equal(row.choices.filter(o=>o.choiceRole==='PROPOSED_KEY').length,1);
  for(let k=0;k<4;k++){
   const choice=row.choices[k],actual=p.options[k];
   ids.push(choice.choiceId);
   assert.equal(choice.choiceId,actual.id);
   assert.equal(choice.text,actual.text);
   assert.equal(choice.letter,'ABCD'[k]);
   assert.equal(choice.choiceRole,actual.id===p.correctOptionId?'PROPOSED_KEY':'DISTRACTOR');
   assert.equal(choice.independentQualifiedApproval,false);
   assert.equal(choice.needsIndependentSoleKeyReview,true);
   assert.ok(choice.reason.length>30);
   if(choice.choiceRole==='DISTRACTOR'){
    wrong++;
    if(choice.reasonSpecificity==='INDIVIDUAL_SCIENCE_JUSTIFICATION')individual++;
   }
  }
 }
 assert.equal(new Set(ids).size,396);
 assert.equal(wrong,297);
 assert.equal(individual,45);
 assert.equal(review.academicApproved,0);
 assert.equal(c.approved,0);
 assert.equal(matrix.approval.candidate99,0);
 assert.equal(matrix.approval.original143,0);
 assert.equal(matrix.approval.release,'BLOCKED');
});
test('high-risk real-world true properties and laboratory safety are never mislabeled as generally impossible',()=>{
 const get=(n,letter)=>matrix.questions[n-1].choices.find(x=>x.letter===letter);
 assert.match(get(14,'A').reason,/true property of ethanol/i);
 assert.match(get(14,'C').reason,/genuine reason for using ethanol/i);
 assert.match(get(92,'A').reason,/can condense/i);
 assert.match(get(92,'D').reason,/dilution of vapour/i);
 assert.equal(matrix.questions[91].keyText,'It can ignite');
 assert.match(matrix.questions[92].keyText,/Extinguish the Bunsen burner/);
 assert.match(matrix.questions[92].stem,/Which action/);
 assert.match(get(93,'B').reason,/yellow safety flame is still an open flame/i);
 assert.match(get(40,'C').reason,/peptide bonds/i);
 assert.match(get(75,'D').reason,/energy/i);
 for(const n of [14,40,41,75,92,93])assert.equal(matrix.questions[n-1].approved,false);
});
