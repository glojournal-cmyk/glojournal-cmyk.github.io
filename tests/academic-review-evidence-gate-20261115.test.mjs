import test from 'node:test';
import assert from 'node:assert/strict';
import {isQuestionBankPath,indexQuestions,fingerprintQuestion,
  compareQuestionBanks,evidenceIssues} from '../scripts/academic-review-evidence-gate-20261115.mjs';

const q={id:'test-1',prompt:'State density.',answer:{accepted:['mass / volume']},
  marks:1,feedback:{steps:['Density is mass divided by volume.']}};
const make=(questions)=>({subject:'physics',year:9,groups:[{title:'Density',questions}]});

test('catches assessment and topic bank edits without sweeping other assets',()=>{
  assert.equal(isQuestionBankPath('assessment/banks/physics.json'),true);
  assert.equal(isQuestionBankPath('content/topics/phys-y9-a.json'),true);
  assert.equal(isQuestionBankPath('study/latin/data.json'),true);
  assert.equal(isQuestionBankPath('assets/pet/manifest.json'),false);
  assert.equal(isQuestionBankPath('assessment/app-v2.js'),false);
});
test('indexes nested exam groups and flags duplicate IDs',()=>{
  const a=indexQuestions(make([q,{...q}]));
  assert.equal(a.questions.size,1);
  assert.ok(a.errors.includes('duplicate_question_id:test-1'));
});
test('answer variants, feedback and marks changes all invalidate previous review',()=>{
  for(const patch of [
    {answer:{accepted:['volume / mass']}},
    {marks:2},
    {feedback:{steps:['This is an incorrect teaching explanation.']}}
  ]) assert.notEqual(fingerprintQuestion(q),fingerprintQuestion({...q,...patch}));
});
test('a content change needs new fingerprint-matched evidence',()=>{
  const changed=compareQuestionBanks(make([q]),make([{...q,marks:2}]),'assessment/test.json');
  assert.equal(changed.changed.length,1);
  assert.equal(changed.changed[0].kind,'changed');
  assert.equal(evidenceIssues(changed.changed,{reviews:[]})[0].reason,
    'missing_independent_academic_review_evidence');
});
test('review cannot be reused after answer changes or without required checks',()=>{
  const item={file:'assessment/test.json',id:q.id,fingerprint:fingerprintQuestion(q)};
  const review={...item,reviewer:'Independent reviewer',reviewDate:'2026-11-15',
    sourceReference:'School revision guide, dated November 2026',
    reviewNotes:'Independently cross-checked concept, alternatives and marks.',
    checks:{curriculumFit:true,scientificOrLinguisticAccuracy:true,
      answerAndReasonableAlternatives:true,markingFairness:true,
      explanationQuality:true}};
  assert.equal(evidenceIssues([item],{reviews:[review]}).length,0);
  assert.equal(evidenceIssues([item],{reviews:[{...review,fingerprint:'old'}]}).length,1);
  assert.equal(evidenceIssues([item],{reviews:[{...review,checks:{}}]})[0].reason,
    'incomplete_academic_review_evidence');
});
test('deleted questions are reported but do not become phantom approved questions',()=>{
  const d=compareQuestionBanks(make([q]),make([]),'assessment/test.json');
  assert.equal(d.changed.length,0);
  assert.deepEqual(d.removed,[{file:'assessment/test.json',id:'test-1'}]);
});
