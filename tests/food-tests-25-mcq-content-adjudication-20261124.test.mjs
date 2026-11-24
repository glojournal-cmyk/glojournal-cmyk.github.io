import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const bank=read('content/topics/bio-y8-food-tests.json');
const candidate=read('qa/food-tests-16-retained-case-concrete-observations-20261124.json');
const review=read('qa/food-tests-25-source-mcq-content-adjudication-20261124.json');
const byId=new Map(bank.questions.map(q=>[q.id,q]));
const byCand=new Map(candidate.items.map(q=>[q.sourceId,q]));
test('25 original Food Tests MCQ science keys independently checked against all 100 options (AI content verdict; no formal teacher signoff)',()=>{
 assert.equal(bank.questions.length,143);
 assert.deepEqual(review.scope,{originalQuestions:143,originalRecallReviewed:9,originalResultExamplesReviewed:16,sourceAnswerKeysScienceCorrect:25,recallOriginalContentPass:8,recallOriginalNeedsWordingRevision:1,resultSourceNeedsWordingRevision:16,correctedResultDraftContentPass:16,totalCorrectedDraftContentPass:17,independentQualifiedApprovals:0});
 assert.equal(review.approvalState,'CONTENT_REVIEW_PERFORMED__FORMAL_APPROVAL_BLOCKED');
 assert.equal(review.independentAcademicSignoff,false);
 assert.equal(review.tgsYear8TeachingScopeVerified,false);
 assert.equal(review.sourceBankEdited,false);
 assert.equal(review.release,'BLOCKED');
 assert.equal(review.recallQuestions.length,9);
 assert.equal(review.retainedResultExamples.length,16);
 let fullOptions=0,wrongOptions=0;
 for(const item of [...review.recallQuestions,...review.retainedResultExamples]){
  const source=byId.get(item.sourceId);
  assert.ok(source,item.sourceId);
  assert.equal(source.answer.accepted[0],item.correctAnswer??item.sourceCorrectAnswer);
  assert.equal(source.options.length,4);
  assert.equal(item.options?.length??item.optionTexts.length,4);
  assert.equal(canEarnFormalCredit(source),false);
  assert.equal(item.independentQualifiedApproval,false);
  assert.equal(item.tgsTeachingVerified,false);
  assert.equal(item.formalCreditEligible,false);
  const arr=item.choiceReasons??item.options;
  assert.equal(arr.filter(o=>o.role==='PROPOSED_KEY').length,1,item.sourceId);
  for(let n=0;n<4;n++){
   const c=arr[n];
   assert.equal(c.text,source.options[n],item.sourceId);
   assert.equal(c.letter,'ABCD'[n]);
   assert.ok(c.reason.length>50,item.sourceId+' '+c.letter);
   fullOptions++;
   if(n!==item.correctIndex){wrongOptions++;assert.notEqual(c.role,'PROPOSED_KEY');}
  }
 }
 assert.equal(fullOptions,100);
 assert.equal(wrongOptions,75);
});
test('8 source recall MCQs pass content wording, 1 strong-positive item requires a precise scientific endpoint',()=>{
 const all=bank.questions.filter(q=>q.format==='mc_single'&&!q.id.includes('-case-'));
 assert.equal(all.length,9);
 assert.deepEqual(review.recallQuestions.map(x=>x.sourceId),all.map(x=>x.id));
 assert.equal(review.recallQuestions.filter(q=>q.sourceItemContentVerdict==='AI_CONTENT_QA_PASS').length,8);
 const red=review.recallQuestions.find(x=>x.sourceId==='bio-y8-food-tests-brick-red-mc');
 assert.equal(red.sourceItemContentVerdict,'REVISE_STEM_THEN_RECHECK');
 assert.match(red.revisedStemIfNeeded,/strongest commonly described positive/);
 assert.ok(red.choiceReasons.filter(x=>x.role!=='PROPOSED_KEY').some(x=>/Orange is also positive/.test(x.reason)));
 assert.equal(red.independentQualifiedApproval,false);
});
test('16 corrected result-case stems demand complete detected set, not an arbitrary true subset',()=>{
 const rows=review.retainedResultExamples;
 assert.deepEqual(rows.map(x=>x.sourceId),candidate.items.map(x=>x.sourceId));
 for(const item of rows){
  const source=byId.get(item.sourceId),draft=byCand.get(item.sourceId);
  assert.equal(item.sourcePrompt,source.prompt);
  assert.equal(item.revisedStem,draft.proposedPrompt);
  assert.match(item.revisedStem,/complete list of nutrient groups detected by these four tests/);
  assert.equal(item.revisedContentVerdict,'AI_QA_REVISED_CONTENT_PASS');
  assert.equal(item.sourceItemContentVerdict,'REVISE_SOURCE_PROMPT_BEFORE_USE');
  assert.equal(item.options.filter(x=>x.role==='PROPOSED_KEY').length,1);
  assert.equal(item.correctIndex,source.options.indexOf(source.answer.accepted[0]));
  assert.equal(item.independentQualifiedApproval,false);
 }
 const tricky=rows.find(x=>x.sourceId.endsWith('-1-1'));
 assert.ok(tricky.options.filter(x=>x.role==='NOT_COMPLETE_DETECTED_SET').some(x=>x.text==='starch'));
 assert.equal(tricky.options.find(x=>x.text==='starch').role,'NOT_COMPLETE_DETECTED_SET');
 assert.equal(tricky.options.find(x=>x.text==='starch').reason.includes('omits'),true);
});
