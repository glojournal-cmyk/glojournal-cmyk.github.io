import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const science=read('qa/food-tests-99-structured-content-adjudication-20261124.json');
const candidate=read('qa/food-tests-structured-99-point-review-candidate-20261122.json');
const matrix=read('qa/food-tests-297-distractor-first-pass-20261123.json');
const original=read('qa/food-tests-structured-mark-points-draft-20261122.json');
const parts=candidate.items.flatMap(x=>x.parts);
const bySource=new Map(original.items.map(x=>[x.sourceId,x]));
test('99 structured replacement mark-points each have source-concept key judgment and three individual science exclusions',()=>{
 assert.equal(parts.length,99);
 assert.equal(science.parts.length,99);
 assert.deepEqual({
  source:science.totals.sourceProseQuestions,
  points:science.totals.sourceRubricMarkPoints,
  contentPass:science.totals.scienceKeyAndContextualChoiceScreenPass,
  choices:science.totals.choiceOptionsReviewed,
  foilReasons:science.totals.individuallyExplainedWrongOptions,
  independentApprovals:science.totals.independentQualifiedApprovals
 },{source:52,points:99,contentPass:99,choices:396,foilReasons:297,independentApprovals:0});
 assert.equal(science.release,'BLOCKED');
 assert.equal(science.independentAcademicSignoff,false);
 assert.equal(candidate.approved,0);
 let foils=0;
 for(let i=0;i<99;i++){
  const row=science.parts[i],part=parts[i],support=matrix.questions[i];
  const orig=bySource.get(row.originalSourceId);
  assert.ok(orig,row.originalSourceId);
  assert.equal(row.ordinal,i+1);
  assert.equal(row.pointId,part.pointId);
  assert.ok(orig.parts.some(p=>p.pointId===row.pointId&&p.concept===row.originalMarkConcept));
  assert.equal(row.stem,part.stem);
  assert.equal(row.correctChoiceText,part.keyedAnswer);
  assert.equal(row.keyOptionId,part.correctOptionId);
  assert.equal(row.soleCorrectOptionContentReview,'AI_SECOND_PASS_PROVISIONAL_SCIENCE_KEY_PASS');
  assert.equal(row.threeNonKeyOptionContextReasons.length,3);
  assert.deepEqual(row.threeNonKeyOptionContextReasons,support.choices.filter(x=>x.choiceRole==='DISTRACTOR').map(x=>({choiceId:x.choiceId,text:x.text,scienceReason:x.reason})));
  assert.equal(row.independentQualifiedScienceApproval,false);
  assert.equal(row.independentDistractorDifficultyApproval,false);
  assert.equal(row.tgsCurriculumApproval,false);
  assert.equal(row.dailySkillSeparationApproval,false);
  assert.equal(row.formalCreditEligible,false);
  assert.equal(canEarnFormalCredit(row.pointId),false);
  foils+=row.threeNonKeyOptionContextReasons.length;
 }
 assert.equal(foils,297);
});
test('all duplicate and overlapping evidence is held separately from scientific single-best-key QA',()=>{
 assert.equal(science.totals.exactAnswerClusterAffected,21);
 assert.equal(science.totals.semanticNearOverlapAffected,32);
 assert.equal(science.totals.otherPoolOverlapAffected,47);
 assert.equal(science.totals.unionOfProvisionalSkillOverlapPoints,79);
 assert.equal(science.sourceOriginalAcademicApproval,0);
 assert.equal(science.candidateAcademicApproval,0);
 assert.equal(science.formalCreditEligible,false);
});
