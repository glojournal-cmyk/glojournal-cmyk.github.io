import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const fromPath=p=>JSON.parse(readFileSync(new URL('../qa-staging/'+p,import.meta.url),'utf8'));
const bank=fromPath('math-v311-reviewed-200.json');
const ledger=fromPath('math-v312-16-candidate-academic-review-ledger-20261123.json');
const packPaths=[
 'math-v312-indices005-008-reasoning-replacement-candidates-20261123.json',
 'math-v312-standard-form013-016-reasoning-replacement-candidates-20261123.json',
 'math-v312-rearranging009-011-017-inverse-domain-reasoning-candidates-20261123.json',
 'math-v312-rearranging012-015-distinct-reasoning-candidates-20261123.json'
];
const packs=packPaths.map(fromPath);
const qualify=p=>'qa-staging/'+p;
const letters=['A','B','C','D','E','F'];

test('16 standalone revised replacements: no source collisions, correct revision lineage, and no formal approval or student credit',()=>{
 assert.equal(bank.questions.length,200);
 assert.equal(bank.questions.filter(q=>q.dailyEligible===true).length,0);
 assert.equal(ledger.kind,'INDEPENDENTLY_VERIFIABLE_VERSIONED_16_CANDIDATE_ACADEMIC_REVIEW_LEDGER_ALL_HOLD');
 assert.equal(ledger.schoolCurriculumPdf,'SKIPPED_PER_USER_INSTRUCTION_NOT_AN_ACCEPTANCE_BLOCKER');
 assert.equal(ledger.releaseDisposition,'16/16_UNAPPROVED_NO_DAILY_NO_MASTERY');
 assert.equal(ledger.manifest.length,4);
 assert.equal(ledger.items.length,16);
 assert.equal(ledger.totals.sourceBankQuestions,200);
 assert.equal(ledger.totals.candidatePacks,4);
 assert.equal(ledger.totals.candidates,16);
 assert.equal(ledger.totals.wrongOptions,80);
 assert.equal(ledger.totals.fullSixOptionChoices,96);
 assert.equal(ledger.totals.formallyApproved,0);
 assert.equal(ledger.totals.dailyEnabled,0);
 assert.equal(ledger.totals.masteryEnabled,0);
 const sourceMap=new Map(bank.questions.map(q=>[q.sourceId,q]));
 const reviewedMap=new Map(ledger.items.map(q=>[q.sourceId,q]));
 assert.equal(sourceMap.size,200);
 assert.equal(reviewedMap.size,16,'No duplicate educational ledger IDs');
 let total=0;
 for(let i=0;i<packs.length;i++){
  const pack=packs[i],path=qualify(packPaths[i]),manifest=ledger.manifest[i];
  assert.equal(manifest.path,path);
  assert.equal(manifest.questionCount,4);
  assert.equal(pack.questions.length,4);
  assert.equal(pack.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
  for(const q of pack.questions){
   const source=sourceMap.get(q.sourceId),register=reviewedMap.get(q.sourceId);
   assert.ok(source&&register,'Candidate source or register missing '+q.sourceId);
   assert.equal(source.dailyEligible,false);
   assert.equal(register.packPath,path);
   assert.equal(register.revisionId,q.revisionId);
   assert.equal(register.replacesRevisionId,source.revisionId);
   assert.equal(q.replacesRevisionId,source.revisionId);
   assert.equal(register.oldBankRevisionId,source.revisionId);
   assert.equal(register.topicId,q.topicId);
   assert.equal(q.academicQA,'pending');
   assert.equal(q.independentGradeCalibrated,false);
   assert.equal(q.independentStudentMisconceptionCertified,false);
   assert.equal(q.dailyEligible,false);
   assert.equal(q.masteryEligible,false);
   assert.equal(q.options.length,6);
   assert.deepEqual(q.options.map(o=>o.id),letters);
   assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
   assert.equal(q.options.filter(o=>o.id!==q.correctOptionId).length,5);
   assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===q.correctOptionId)?.latex);
   assert.ok(q.options.filter(o=>o.id!==q.correctOptionId)
    .every(o=>typeof o.errorPath==='string'&&o.errorPath.length>=15),
    q.sourceId+' unsupported wrong option');
   assert.equal(register.options,6);
   assert.equal(register.wrongOptions,5);
   assert.equal(register.statedCorrectOption,q.correctOptionId);
   assert.equal(register.grade7PlusExternalBenchmark,'NOT_VERIFIED');
   assert.equal(register.realStudentMisconceptionEvidence,'NOT_VERIFIED');
   assert.equal(register.independentPedagogicalReviewer,null);
   assert.equal(register.academicDecision,'HOLD');
   assert.equal(register.dailyEligible,false);
   assert.equal(register.masteryEligible,false);
   total++;
  }
 }
 assert.equal(total,16);
});

test('cross-topic or within-topic overlap risks are flagged, not counted as 16 distinct mastered concepts',()=>{
 const known={
  'INVERSE_OUTPUT_EXCLUSION':['LUX-MATH-Y9-REARRANGING-009','LUX-MATH-Y9-REARRANGING-013'],
  'INVERSE_INPUT_CONSTRAINT_RANGE':['LUX-MATH-Y9-REARRANGING-010','LUX-MATH-Y9-REARRANGING-012'],
  'PARAMETER_NONUNIQUE_INVERSE':['LUX-MATH-Y9-REARRANGING-011','LUX-MATH-Y9-REARRANGING-015'],
  'INTEGER_OPTIMISATION_CROSS_TOPIC':['LUX-MATH-Y9-INDICES-008','LUX-MATH-Y9-STANDARD_FORM-013']
 };
 assert.equal(ledger.totals.conceptOverlapReviewGroups,4);
 assert.equal(ledger.totals.overlapFlaggedCandidateRows,8);
 const byGroup={};
 for(const row of ledger.items){
  assert.ok(row.conceptOverlapReviewGroups.length<=1,
    'Unexpected unreviewed multi-group item '+row.sourceId);
  for(const group of row.conceptOverlapReviewGroups){
   (byGroup[group]??=[]).push(row.sourceId);
  }
 }
 assert.deepEqual(Object.keys(byGroup).sort(),Object.keys(known).sort());
 for(const [group,ids]of Object.entries(known)){
  assert.deepEqual(byGroup[group].slice().sort(),ids.slice().sort(),
    'A conceptual overlap was silently dropped: '+group);
 }
});
