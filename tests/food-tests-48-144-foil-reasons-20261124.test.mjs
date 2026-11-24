import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const source=read('content/topics/bio-y8-food-tests.json');
const draft=read('qa/food-tests-48-duplicate-replacements-draft-20261123.json');
const preview=read('qa/food-tests-143-revised-preview-20261123.json');
const register=read('qa/food-tests-48-144-foil-reasons-20261124.json');
const byPreview=new Map(preview.questions.map(x=>[x.id,x]));
test('48 QA-only replacement MCQs have 192 synchronized choices and individual reasons for all 144 distractors',()=>{
 assert.equal(source.questions.length,143);
 assert.equal(draft.questions.length,48);
 assert.equal(preview.questions.length,143);
 assert.equal(register.candidateQuestions.length,48);
 assert.equal(register.reviewScope,'AI_FIRST_PASS_CONTEXTUAL_SCIENCE_JUSTIFICATION_NOT_QUALIFIED_TEACHER_SIGNOFF');
 assert.equal(register.releaseStatus,'BLOCKED');
 assert.deepEqual(register.counts,{replacements:48,options:192,proposedKeys:48,individuallyReasonedDistractors:144,approvedReplacements:0});
 assert.equal(draft.approved,0);
 assert.equal(preview.academicApproved,0);
 let numFoils=0,numOptions=0;
 for(let i=0;i<48;i++){
  const q=draft.questions[i],row=register.candidateQuestions[i],pv=byPreview.get(q.sourceId);
  assert.ok(pv,q.sourceId);
  assert.equal(q.sourceId,row.id);
  assert.equal(row.sourceOriginalId,q.sourceId);
  assert.equal(row.stem,q.prompt);
  assert.equal(row.stem,pv.prompt);
  assert.equal(row.proposedKey,q.answer.accepted[0]);
  assert.equal(row.proposedKey,q.options[q.correctIndex]);
  assert.equal(row.correctChoice,'ABCD'[q.correctIndex]);
  assert.equal(row.scienceRationale,q.scienceRationale);
  assert.equal(row.choices.length,4);
  assert.equal(row.academicApproved,false);
  assert.equal(row.formalCreditEligible,false);
  assert.equal(row.teacherSoleKeyDecision,'PENDING');
  assert.equal(row.tgsMethodScope,'PENDING');
  assert.equal(pv.dailyConceptGroup,null);
  assert.equal(pv.reviewDraft.dailyConceptMappingStatus,'PENDING_NEW_SKILL_GROUP_REVIEW');
  assert.equal(canEarnFormalCredit(q.sourceId),false);
  assert.equal(row.choices.filter(c=>c.role==='PROPOSED_KEY').length,1);
  for(let j=0;j<4;j++){
   const choice=row.choices[j],key=j===q.correctIndex;
   numOptions++;
   assert.equal(choice.text,q.options[j],q.sourceId+' choice '+j);
   assert.equal(choice.letter,'ABCD'[j]);
   assert.equal(choice.role,key?'PROPOSED_KEY':'PROPOSED_DISTRACTOR');
   assert.equal(choice.individualScienceExplanation,true);
   assert.ok(choice.contextualScienceReason.length>=50,q.sourceId+' '+choice.letter);
   assert.equal(choice.qualifiedIndependentReview,'PENDING');
   assert.equal(choice.academicApproved,false);
   assert.equal(choice.formalCreditEligible,false);
   if(!key)numFoils++;
  }
 }
 assert.equal(numFoils,144);
 assert.equal(numOptions,192);
});
test('a negative or observational statement that is true is not automatically declared scientifically false',()=>{
 const get=(suffix,letter)=>register.candidateQuestions.find(x=>x.id.endsWith('-'+suffix)).choices.find(x=>x.letter===letter);
 assert.match(get('2-9','A').contextualScienceReason,/supported|not overreach/i);
 assert.match(get('2-16','A').contextualScienceReason,/justifies|not the unjustified choice/i);
 assert.match(get('4-10','B').contextualScienceReason,/cautious|not too strong/i);
 assert.match(get('4-16','A').contextualScienceReason,/supported|does not go beyond/i);
 assert.equal(register.counts.approvedReplacements,0);
 assert.equal(register.releaseStatus,'BLOCKED');
});
