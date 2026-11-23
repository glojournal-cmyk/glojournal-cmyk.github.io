// Held Food Tests 99-part semantic overlap triage. Do not activate Daily from this test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const c=read('qa/food-tests-structured-99-point-review-candidate-20261122.json');
const overlaps=read('qa/food-tests-99-semantic-overlap-review-20261123.json');
const parts=c.items.flatMap(x=>x.parts);
const conflicts=ids=>overlaps.groups.filter(g=>g.pointIndices.filter(n=>ids.includes(n)).length>=2);
test('13 source-grounded semantic skill-overlap families account for 32 unique held candidate parts',()=>{
 assert.equal(parts.length,99);
 assert.equal(overlaps.totalCandidateParts,99);
 assert.equal(overlaps.crossKeyReviewGroupCount,13);
 assert.equal(overlaps.highOverlapGroupCount,8);
 assert.equal(overlaps.groups.length,13);
 assert.equal(overlaps.academicApprovals,0);
 assert.equal(overlaps.sourceApprovals,0);
 assert.equal(overlaps.status,'PROVISIONAL_SEMANTIC_ROTATION_QA_DO_NOT_DEPLOY');
 const seen=new Set();
 for(const g of overlaps.groups){
  assert.equal(g.pointIndices.length,g.pointIds.length);
  assert.equal(g.pointIndices.length,g.keyedAnswers.length);
  assert.equal(g.independentAcademicApproved,false);
  assert.equal(g.releaseDisposition,'PROVISIONAL_ROTATION_AVOID_SAME_DAILY_UNTIL_QUALIFIED_REVIEW');
  assert.ok(['HIGH_OVERLAP','RELATED_COLOUR_SUBSKILLS','RELATED_COLOUR_AND_INFERENCE','RELATED_CONTROL_AND_OBSERVATION','RELATED_SEQUENTIAL_STEPS'].includes(g.risk),g.id);
  for(let i=0;i<g.pointIndices.length;i++){
   const n=g.pointIndices[i],p=parts[n-1];
   assert.ok(p,g.id);
   assert.equal(g.pointIds[i],p.pointId,g.id);
   assert.equal(g.keyedAnswers[i],p.keyedAnswer,g.id);
   assert.equal(p.approved,false,g.id);
   seen.add(n);
  }
 }
 assert.equal(seen.size,32);
});
test('QA-only planner rejects closely repeated underlying knowledge even if answer text differs',()=>{
 assert.ok(conflicts([2,11]).some(g=>g.id==='benedict_reagent_target_inverse'));
 assert.notEqual(parts[1].keyedAnswer,parts[10].keyedAnswer);
 assert.ok(conflicts([5,94]).some(g=>g.id==='iodine_blueblack_positive_inference'));
 assert.ok(conflicts([14,92]).some(g=>g.id==='ethanol_vapour_flammability'));
 assert.ok(conflicts([36,93]).some(g=>g.id==='extinguish_open_flame_precaution'));
 assert.ok(conflicts([23,53]).length===0,'already captured by separate exact-key cluster review; the two risk registers are complementary');
 assert.deepEqual(conflicts([1,2,3]),[]);
 assert.equal(c.approved,0);
 assert.equal(c.formalCreditEligible,false);
});
