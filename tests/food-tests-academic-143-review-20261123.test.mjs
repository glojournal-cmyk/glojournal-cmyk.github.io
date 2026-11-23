// Independent source-alignment consistency for *held* Food Tests academic QA.
// It is NOT a science teacher sign-off, marking acceptance or release authorisation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url));
const read=p=>JSON.parse(raw(p).toString('utf8'));
const source=read('content/topics/bio-y8-food-tests.json');
const qa=read('qa/food-tests-independent-academic-143-review-20261123.json');
const proposal=read('qa/food-tests-academic-correction-proposals-20261123.json');
const draft=read('qa/food-tests-structured-99-point-review-candidate-20261122.json');
const original=source.questions,rows=qa.reviewRegister;
const byId=new Map(rows.map(r=>[r.questionId,r]));
const explicitKeys={
 'bio-y8-food-tests-iodine-solution-mc':'iodine solution',
 'bio-y8-food-tests-benedict-s-solution-mc':"Benedict's solution",
 'bio-y8-food-tests-biuret-solution-mc':'Biuret solution',
 'bio-y8-food-tests-ethanol-emulsion-test-mc':'ethanol emulsion test',
 'bio-y8-food-tests-blue-black-mc':'blue-black',
 'bio-y8-food-tests-brick-red-mc':'brick-red',
 'bio-y8-food-tests-lilac-or-purple-mc':'lilac or purple',
 'bio-y8-food-tests-cloudy-white-emulsion-mc':'cloudy white emulsion',
 'bio-y8-food-tests-water-bath-mc':'water bath'
};
function expectedPattern(prompt){
 return [
  /iodine blue-black/.test(prompt)?'starch':null,
  /heated Benedict's green \/ yellow \/ orange \/ brick-red/.test(prompt)?'reducing sugar':null,
  /Biuret lilac \/ purple/.test(prompt)?'protein':null,
  /ethanol emulsion test cloudy white emulsion/.test(prompt)?'lipid':null
 ].filter(Boolean).join(', ')||'none of these four nutrients';
}
test('source fingerprint, all 143 IDs and formal score hold must be consistent',()=>{
 const b=raw('content/topics/bio-y8-food-tests.json');
 const sha=createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
 assert.equal(sha,qa.sourceSHA,'changed source requires fresh evidence, not stale approval');
 assert.equal(original.length,143);
 assert.equal(rows.length,143);
 assert.equal(new Set(original.map(q=>q.id)).size,143);
 assert.equal(new Set(rows.map(r=>r.questionId)).size,143);
 assert.equal(qa.academicApproved,0);
 assert.equal(qa.formalCreditEligible,0);
 for(let i=0;i<143;i++){
  assert.equal(rows[i].ordinal,i+1);
  assert.equal(rows[i].questionId,original[i].id);
  assert.equal(rows[i].format,original[i].format);
  assert.equal(rows[i].sourcePrompt,original[i].prompt);
  assert.equal(rows[i].academicApproved,false);
  assert.equal(rows[i].formalCreditEligible,false);
  assert.equal(rows[i].sourceAcceptedAnswer?.join('|')??null,
    original[i].answer?.accepted?.join('|')??null);
 }
});
test('all 64 separate food-test observation questions have one scientifically keyed result',()=>{
 const cases=original.filter(q=>q.id.includes('food-tests-case-'));
 assert.equal(cases.length,64);
 const counts=new Map();
 for(const q of cases){
  const expect=expectedPattern(q.prompt);
  assert.deepEqual(q.answer.accepted,[expect],q.id);
  assert.equal(q.options.filter(o=>o===expect).length,1,q.id);
  assert.equal(new Set(q.options).size,4,q.id);
  assert.equal(byId.get(q.id)?.evidence?.[0]?.expected,expect,q.id);
  counts.set(expect,(counts.get(expect)||0)+1);
 }
 assert.equal(counts.size,16);
 assert.ok([...counts.values()].every(n=>n===4));
 assert.equal(rows.filter(r=>r.reviewDisposition==='REVISE_REDUNDANT_CASE').length,48);
});
test('nine independent food reagent/result MCQs have the single reference key',()=>{
 const choices=original.filter(q=>q.format==='mc_single'&&!q.id.includes('food-tests-case-'));
 assert.equal(choices.length,9);
 for(const q of choices){
  assert.deepEqual(q.answer.accepted,[explicitKeys[q.id]],q.id);
  assert.equal(q.options.filter(o=>o===explicitKeys[q.id]).length,1,q.id);
  assert.equal(byId.get(q.id)?.scienceKnowledgeStatus,'concept-consistent-on-first-review',q.id);
 }
});
test('all fifteen typed items remain blocked pending tested alternatives',()=>{
 const typed=original.filter(q=>['typed_exact','typed_short'].includes(q.format));
 assert.equal(typed.length,15);
 for(const q of typed){
  assert.ok(q.answer.accepted.length>0,q.id);
  const row=byId.get(q.id);
  assert.equal(row.reviewDisposition,'REVISE_EQUIVALENT_ANSWER_MARKING');
  assert.ok(row.issues.some(x=>x.code==='UNTOLERANT_TYPED_ANSWER_FAIRNESS'));
 }
});
test('three pair-matching tasks contain four pairs; 8 points for 4 compound matches is a formal credit defect',()=>{
 const match=original.filter(q=>q.format==='matching');
 assert.equal(match.length,3);
 for(const q of match){
  assert.equal(q.answer.pairs.length,4);
  assert.equal(new Set(q.answer.pairs.map(p=>p.left)).size,4,q.id);
  assert.equal(new Set(q.answer.pairs.map(p=>p.right)).size,4,q.id);
  assert.equal(byId.get(q.id).reviewDisposition,'REVISE_MATCHING_PARTIAL_CREDIT');
 }
 const compound=match.find(q=>q.id==='bio-y8-app-food-test-match');
 assert.equal(compound.answer.totalMarks,4,'one actual selectable pair is one mark; eight was an overclaim');
 assert.match(compound.prompt,/one mark for each complete pairing \(4 marks\)/i);
 assert.equal(byId.get(compound.id)?.currentQAStatus,'REVISED_IN_DRAFT_BRANCH_AWAITING_INDEPENDENT_SCORER_AND_CURRICULUM_REVIEW');
 assert.ok(byId.get(compound.id).issues.some(x=>x.code==='EIGHT_MARKS_FOUR_PAIRS'));
 assert.equal(proposal.sourceQuestionCorrections.find(x=>x.questionId===compound.id).proposedAnswerTotalMarks,4);
});
test('52 held original free-text responses and 99 points are all accounted for',()=>{
 const long=original.filter(q=>q.format==='mark_points');
 assert.equal(long.length,52);
 assert.equal(long.reduce((n,q)=>n+q.answer.markPoints.length,0),99);
 for(const q of long){
  assert.equal(q.answer.totalMarks??q.answer.markPoints.length,q.answer.markPoints.length,q.id);
  assert.equal(byId.get(q.id).reviewDisposition,'REVISE_FREE_TEXT_AND_SCORER');
  assert.ok(byId.get(q.id).issues.some(x=>x.code==='OPEN_RESPONSE_MARKING_UNSAFE'));
 }
 for(const id of ['bio-y8-food-tests-application-20261025-sugar-strength',
                   'bio-y8-food-tests-application-20261025-all-negative'])
  assert.ok(proposal.sourceQuestionCorrections.some(x=>x.questionId===id));
});
test('99 MCQ candidate mark-points have a single keyed option, but zero distractor sign-offs',()=>{
 const parts=draft.items.flatMap(item=>item.parts);
 assert.equal(draft.items.length,52);
 assert.equal(parts.length,99);
 assert.equal(qa.structured99PointCandidateReview.length,99);
 assert.equal(draft.approved,0);
 assert.equal(draft.formalCreditEligible,false);
 for(let i=0;i<parts.length;i++){
  const p=parts[i],review=qa.structured99PointCandidateReview[i];
  assert.equal(p.pointId,review.pointId);
  assert.equal(p.approved,false);
  assert.equal(review.approved,false);
  assert.equal(p.options.length,4);
  assert.equal(new Set(p.options.map(o=>o.id)).size,4);
  assert.equal(p.options.filter(o=>o.id===p.correctOptionId).length,1);
  assert.equal(p.options.find(o=>o.id===p.correctOptionId)?.text,review.keyedChoice);
  assert.equal(p.distractorReview,'pending','passing tests never approves distractors');
 }
 assert.deepEqual(qa.summary.structuredPointsClearlyImplausibleOptionsNeedingRepair,[32,39,45,72,75]);
 for(const p of proposal.structuredCandidatePointRevisions){
  assert.equal(parts[p.pointIndex-1].pointId.split('::')[0],p.sourceId);
  assert.ok(!p.wrong.includes(p.correct),'same text cannot be right and wrong');
  assert.equal(p.wrong.length,3);
 }
});
test('publish gate remains blocked with no teacher or iPad release permission',()=>{
 assert.deepEqual(qa.summary.sourceQuestionCorrectionsAppliedInQAOnly,[
  'bio-y8-app-food-test-match',
  'bio-y8-food-tests-application-20261025-sugar-strength',
  'bio-y8-food-tests-application-20261025-all-negative'
 ]);
 assert.equal(qa.summary.structuredPointsRevisedAwaitingIndependentAssessment.length,5);
 assert.equal(proposal.appliedStructuredPointIndices.length,5);
 const sugar=original.find(q=>q.id==='bio-y8-food-tests-application-20261025-sugar-strength');
 assert.match(sugar.prompt,/equal volumes of food extract/i);
 assert.match(sugar.prompt,/equal volumes of fresh Benedict/i);
 assert.match(sugar.prompt,/same time in the same hot-water bath/i);
 assert.match(sugar.answer.markPoints[1],/not an exact concentration/i);
 const neg=original.find(q=>q.id==='bio-y8-food-tests-application-20261025-all-negative');
 assert.match(neg.prompt,/Positive and negative controls work correctly/);
 assert.match(neg.answer.markPoints[0],/was detected under the test conditions/);
 assert.match(neg.answer.markPoints[1],/detection limit/);
  assert.equal(proposal.approvals.questions,0);
 assert.equal(proposal.approvals.structuredCandidateParts,0);
 assert.equal(qa.summary.scienceKeyMismatches.length,0);
 assert.equal(qa.summary.typedItemsRequiringEquivalenceReview,15);
 assert.equal(qa.summary.matchingItemsRequiringPairwiseScoringReview,3);
 assert.equal(qa.summary.duplicateCaseQuestionsRequiringReplacement,48);
 assert.ok(qa.not.includes('permission to merge or deploy'));
 assert.ok(proposal.notAppliedReason.includes('do not'));
});
