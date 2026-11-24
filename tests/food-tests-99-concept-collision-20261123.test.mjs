// Academic QA-only register integrity, not independent approval or player release.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const ledger=read('qa/food-tests-99-concept-collision-review-20261123.json');
const c=read('qa/food-tests-structured-99-point-review-candidate-20261122.json');
const source=read('qa/food-tests-structured-mark-points-draft-20261122.json');
const flat=c.items.flatMap(x=>x.parts);
const srcMap=new Map(source.items.map(x=>[x.sourceId,x]));
const norm=s=>s.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
test('99 QA candidate points/396 options retain exact original mark-point concept and keyed choices',()=>{
 assert.equal(source.items.length,52);
 assert.equal(c.items.length,52);
 assert.equal(flat.length,99);
 assert.equal(ledger.items.length,99);
 assert.equal(ledger.scope.totalOptions,396);
 assert.equal(ledger.approvedCandidateParts,0);
 assert.equal(ledger.approvedSourceQuestions,0);
 assert.equal(c.approved,0);
 assert.equal(c.formalCreditEligible,false);
 for(let i=0;i<99;i++){
  const p=flat[i],row=ledger.items[i],original=srcMap.get(row.sourceId);
  assert.equal(row.ordinal,i+1);
  assert.equal(row.pointId,p.pointId);
  assert.equal(row.sourceConcept,p.concept);
  assert.equal(row.stem,p.stem);
  assert.equal(row.answerKey,p.keyedAnswer);
  assert.equal(row.correctOptionId,p.correctOptionId);
  assert.deepEqual(row.candidateChoices,p.options.map(o=>o.text));
  assert.equal(original.parts.filter(t=>t.pointId===p.pointId&&t.concept===p.concept).length,1);
  assert.equal(row.keyedChoiceIndex,p.options.findIndex(o=>o.id===p.correctOptionId));
  assert.equal(p.options.filter(o=>o.text===p.keyedAnswer).length,1);
  assert.equal(row.academicApproved,false);
  assert.equal(row.formalCreditEligible,false);
  assert.equal(row.independentDistractorJudgment,'PENDING');
  assert.equal(row.tgsTaughtScope,'PENDING');
  assert.match(row.preliminaryScienceScreen,/NOT_INDEPENDENT_SOLE_KEY_SIGNOFF/);
  assert.equal(p.approved,false);
  assert.equal(canEarnFormalCredit(row.sourceId),false);
 }
});
test('9 exact-answer collision clusters are exhaustive, but never count as approval or duplicate-mark removal',()=>{
 const groups=new Map();
 flat.forEach((p,i)=>{const k=norm(p.keyedAnswer);groups.set(k,[...(groups.get(k)||[]),i+1]);});
 const expected=[...groups.entries()].filter(([key,points])=>points.length>1).map(([key,points])=>({key,points}));
 assert.equal(ledger.exactAnswerCollisionClusters.length,9);
 assert.equal(ledger.scope.affectedCandidatePoints,21);
 assert.equal(expected.length,9);
 assert.deepEqual(ledger.exactAnswerCollisionClusters.map(x=>({key:x.normalizedKey,points:x.points})),expected);
 for(const c of ledger.exactAnswerCollisionClusters){
  assert.match(c.teacherReview,/PENDING/);
  assert.match(c.dailyRecommendation,/DO_NOT_REPEAT/);
  for(const n of c.points){
   assert.equal(ledger.items[n-1].duplicateExactAnswerCluster,c.clusterId);
   assert.equal(ledger.items[n-1].repeatAcrossItems.length,c.points.length-1);
  }
 }
 assert.equal(ledger.release,'BLOCKED');
});
test('specific ambiguity resolutions and AQA-vs-TGS scope exclusions are not mistaken for release permissions',()=>{
 assert.ok(ledger.items[30].reviewFlags.includes('FAIR_TEST_ENDPOINT_AMBIGUITY_QA_REVISED'));
 assert.ok(ledger.items[44].reviewFlags.includes('IODINE_QUALITATIVE_NOT_CALIBRATED_QUANTITATIVE_QA_REVISED'));
 assert.match(ledger.items[30].stem,/final Benedict's colours/);
 assert.match(ledger.items[44].answerKey,/equal measured masses/);
 assert.ok(ledger.items[92].reviewFlags.includes('ETHANOL_EMULSION_TGS_SCOPE_UNVERIFIED'));
 assert.equal(ledger.scope.standaloneSoleCorrectScienceApprovals,0);
 assert.equal(ledger.approvedCandidateParts,0);
 assert.equal(ledger.approvedSourceQuestions,0);
 assert.deepEqual(ledger.scope.answerPositionCounts,{A:25,B:25,C:24,D:25});
});
