import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadObjectiveReviewQueue} from '../scripts/build-objective-review-queue.mjs';
import {validateNumericMethodMarkDrafts} from '../scripts/qa-numeric-method-drafts.mjs';
const doc=JSON.parse(readFileSync(new URL('../review/NUMERIC_METHOD_MARK_PROPOSALS.json',import.meta.url),'utf8'));
test('all 16 real multi-mark numeric working sources have one draft proposal per point, zero certifications',()=>{
 const result=validateNumericMethodMarkDrafts();
 assert.equal(result.proposals,16);
 assert.equal(result.coveredOriginalNumericRubrics,16);
 assert.equal(result.sourceDigestsMatch,true);
 assert.equal(result.independentlyApproved,0);
 assert.equal(result.autoScoringEnabled,false);
 assert.equal(result.studentCreditsWritten,0);
 assert.equal(doc.productionRelease,false);
 for(const p of doc.proposals){
  assert.equal(p.studentCreditPermitted,false);
  assert.equal(p.reviewStatus,'needs-independent-approval');
 }
});
test('changed source invalidates proposed rubric even when question ID is unchanged',()=>{
 const queue=loadObjectiveReviewQueue();
 const changed=structuredClone(queue),id=doc.proposals[0].questionId;
 const q=changed.rows.find(r=>r.questionId===id);
 q.sourceSha256='0'.repeat(64);
 assert.throws(()=>validateNumericMethodMarkDrafts({queue:changed,doc}),
  /STALE_SOURCE_DIGEST/);
});
test('no proposed rubric can be labelled approved or activate learner grades',()=>{
 const fake=structuredClone(doc);
 fake.productionRelease=true;
 assert.throws(()=>validateNumericMethodMarkDrafts({doc:fake}),/drafts must remain pending/);
 fake.productionRelease=false;
 fake.proposals[0].studentCreditPermitted=true;
 assert.throws(()=>validateNumericMethodMarkDrafts({doc:fake}),/must never authorise grading/);
});
test('incomplete or duplicate proposal coverage fails closed instead of silently making up missing marks',()=>{
 const partial=structuredClone(doc);
 partial.proposals.pop();
 assert.throws(()=>validateNumericMethodMarkDrafts({doc:partial}),/review queue requires 16 drafts/);
 partial.proposals.push(partial.proposals[0]);
 assert.throws(()=>validateNumericMethodMarkDrafts({doc:partial}),/duplicate proposal/);
});
test('draft mark points must match source mark ceilings but cannot rewrite sources',()=>{
 const fake=structuredClone(doc);
 const item=fake.proposals.find(x=>x.questionId==='phys-y8-circuits-current-voltage-challenge');
 assert.equal(item.pointsSuggested,3);
 item.suggestedMarkPoints.pop();
 assert.throws(()=>validateNumericMethodMarkDrafts({doc:fake}),/one clear individual criterion/);
 const queue=loadObjectiveReviewQueue();
 assert.equal(queue.summary.approvedForDaily,0);
});
