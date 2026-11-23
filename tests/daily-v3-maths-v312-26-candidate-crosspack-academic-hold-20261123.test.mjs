import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const fromPath=p=>JSON.parse(readFileSync(new URL('../qa-staging/'+p,import.meta.url),'utf8'));
const bank=fromPath('math-v311-reviewed-200.json');
const previous=fromPath('math-v312-22-candidate-academic-review-ledger-20261123.json');
const ledger=fromPath('math-v312-26-candidate-academic-review-ledger-20261123.json');
const paths=[
 'math-v312-indices005-008-reasoning-replacement-candidates-20261123.json',
 'math-v312-standard-form013-016-reasoning-replacement-candidates-20261123.json',
 'math-v312-rearranging009-011-017-inverse-domain-reasoning-candidates-20261123.json',
 'math-v312-rearranging012-015-distinct-reasoning-candidates-20261123.json',
 'math-v312-rearranging018-024-fixedpoint-quadratic-domain-candidates-20261123.json',
 'math-v312-rearranging001-004-inverse-model-reasoning-candidates-20261123.json',
 'math-v312-rearranging005-008-radical-inverse-reasoning-candidates-20261123.json'
];
const packs=paths.map(fromPath),letters=['A','B','C','D','E','F'];

test('26 standalone Maths candidates in 7 files maintain independent revisions, full six-option semantics and zero Daily/Mastery permission',()=>{
 assert.equal(bank.questions.length,200);
 assert.equal(bank.questions.filter(x=>x.dailyEligible===true).length,0);
 assert.equal(previous.items.length,22);
 assert.equal(ledger.kind,'INDEPENDENTLY_VERIFIABLE_VERSIONED_26_CANDIDATE_ACADEMIC_REVIEW_LEDGER_ALL_HOLD');
 assert.equal(ledger.schoolCurriculumPdf,'SKIPPED_PER_USER_INSTRUCTION_NOT_AN_ACCEPTANCE_BLOCKER');
 assert.equal(ledger.releaseDisposition,'26/26_UNAPPROVED_NO_DAILY_NO_MASTERY');
 assert.equal(ledger.sourceBankUnmodified,true);
 assert.equal(ledger.sourceBankBlobSha,previous.sourceBankBlobSha);
 assert.equal(ledger.previousSnapshotBlobSha,'2490e8acfc1f1f0dac7dfbdb357d32c81e51cc95');
 assert.equal(ledger.previousSnapshotPath,'qa-staging/math-v312-22-candidate-academic-review-ledger-20261123.json');
 assert.equal(ledger.manifest.length,7);
 assert.equal(ledger.items.length,26);
 assert.equal(ledger.totals.sourceBankQuestions,200);
 assert.equal(ledger.totals.candidatePacks,7);
 assert.equal(ledger.totals.candidates,26);
 assert.equal(ledger.totals.wrongOptions,130);
 assert.equal(ledger.totals.fullSixOptionChoices,156);
 assert.equal(ledger.totals.formallyApproved,0);
 assert.equal(ledger.totals.dailyEnabled,0);
 assert.equal(ledger.totals.masteryEnabled,0);
 const bySource=new Map(bank.questions.map(q=>[q.sourceId,q]));
 const byId=new Map(ledger.items.map(q=>[q.sourceId,q]));
 assert.equal(bySource.size,200);
 assert.equal(byId.size,26,'Duplicate candidate source IDs');
 for(const prior of previous.items){
  const next=byId.get(prior.sourceId);
  assert.ok(next,'Earlier candidate silently removed '+prior.sourceId);
  for(const key of ['sourceId','revisionId','replacesRevisionId','topicId','packPath','academicDecision'])
   assert.equal(next[key],prior[key],'Old candidate identity or academic HOLD modified');
  assert.ok(prior.conceptOverlapReviewGroups.every(g=>next.conceptOverlapReviewGroups.includes(g)),
   'A previously documented conceptual overlap was removed');
 }
 let matched=0;
 for(let i=0;i<paths.length;i++){
  const pack=packs[i],manifest=ledger.manifest[i],sourcePath='qa-staging/'+paths[i];
  const expected=i===4?2:4;
  assert.equal(manifest.path,sourcePath);
  assert.equal(manifest.questionCount,expected);
  assert.equal(pack.questions.length,expected);
  assert.equal(pack.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
  for(const q of pack.questions){
   const original=bySource.get(q.sourceId),row=byId.get(q.sourceId);
   assert.ok(original&&row,'Missing source or academic row '+q.sourceId);
   assert.equal(original.dailyEligible,false);
   assert.equal(q.replacesRevisionId,original.revisionId);
   assert.equal(row.oldBankRevisionId,original.revisionId);
   assert.equal(row.revisionId,q.revisionId);
   assert.equal(row.replacesRevisionId,q.replacesRevisionId);
   assert.equal(row.packPath,sourcePath);
   assert.equal(row.topicId,q.topicId);
   assert.notEqual(q.stem,original.stem);
   assert.notEqual(q.revisionId,original.revisionId);
   assert.equal(q.academicQA,'pending');
   assert.equal(q.independentGradeCalibrated,false);
   assert.equal(q.independentStudentMisconceptionCertified,false);
   assert.equal(q.dailyEligible,false);
   assert.equal(q.masteryEligible,false);
   assert.deepEqual(q.options.map(o=>o.id),letters);
   assert.equal(q.options.length,6);
   assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
   assert.equal(q.options.filter(o=>o.id!==q.correctOptionId).length,5);
   assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===q.correctOptionId)?.latex);
   assert.ok(q.options.filter(o=>o.id!==q.correctOptionId)
    .every(o=>typeof o.errorPath==='string'&&o.errorPath.length>=15),
    'Unexplained wrong alternative '+q.sourceId);
   assert.equal(row.options,6);
   assert.equal(row.wrongOptions,5);
   assert.equal(row.statedCorrectOption,q.correctOptionId);
   assert.equal(row.grade7PlusExternalBenchmark,'NOT_VERIFIED');
   assert.equal(row.realStudentMisconceptionEvidence,'NOT_VERIFIED');
   assert.equal(row.independentPedagogicalReviewer,null);
   assert.equal(row.academicDecision,'HOLD');
   assert.equal(row.dailyEligible,false);
   assert.equal(row.masteryEligible,false);
   matched++;
  }
 }
 assert.equal(matched,26);
});

test('thirteen pairwise concept-overlap risk alerts are retained, and no duplicate ID can create an extra Mastery concept',()=>{
 const pairs={
  'INTEGER_OPTIMISATION_CROSS_TOPIC':['LUX-MATH-Y9-INDICES-008','LUX-MATH-Y9-STANDARD_FORM-013'],
  'INVERSE_OUTPUT_EXCLUSION':['LUX-MATH-Y9-REARRANGING-009','LUX-MATH-Y9-REARRANGING-013'],
  'INVERSE_INPUT_CONSTRAINT_RANGE':['LUX-MATH-Y9-REARRANGING-010','LUX-MATH-Y9-REARRANGING-012'],
  'PARAMETER_NONUNIQUE_INVERSE':['LUX-MATH-Y9-REARRANGING-011','LUX-MATH-Y9-REARRANGING-015'],
  'QUADRATIC_BRANCH_SELECTION_WITH_DOMAIN':['LUX-MATH-Y9-REARRANGING-014','LUX-MATH-Y9-REARRANGING-024'],
  'INVERSE_RATIONAL_BOUNDED_RANGE':['LUX-MATH-Y9-REARRANGING-001','LUX-MATH-Y9-REARRANGING-012'],
  'OBSERVATION_FIT_BEFORE_INVERSION':['LUX-MATH-Y9-REARRANGING-002','LUX-MATH-Y9-REARRANGING-013'],
  'RADICAL_INVERSE_DOMAIN_CHOICE':['LUX-MATH-Y9-REARRANGING-003','LUX-MATH-Y9-REARRANGING-014'],
  'AREA_INVERSE_GEOMETRY_CROSS_TOPIC':['LUX-MATH-Y9-REARRANGING-004','LUX-MATH-Y9-STANDARD_FORM-016'],
  'TWO_ROOT_VS_RECIPROCAL_RADICAL_INVERSION':['LUX-MATH-Y9-REARRANGING-005','LUX-MATH-Y9-REARRANGING-006'],
  'RADICAL_QUADRATIC_BRANCH_SELECTION':['LUX-MATH-Y9-REARRANGING-006','LUX-MATH-Y9-REARRANGING-024'],
  'NESTED_RADICAL_FRACTIONAL_INVERSE':['LUX-MATH-Y9-REARRANGING-007','LUX-MATH-Y9-REARRANGING-003'],
  'MULTIVALUED_ROOT_DOMAIN':['LUX-MATH-Y9-REARRANGING-008','LUX-MATH-Y9-REARRANGING-014']
 };
 const observed={};
 for(const item of ledger.items)for(const g of item.conceptOverlapReviewGroups)
  (observed[g]??=[]).push(item.sourceId);
 assert.equal(ledger.totals.conceptOverlapReviewGroups,13);
 assert.equal(ledger.totals.overlapFlaggedCandidateRows,19);
 assert.equal(ledger.items.filter(q=>q.conceptOverlapReviewGroups.length>0).length,19);
 assert.deepEqual(Object.keys(observed).sort(),Object.keys(pairs).sort());
 for(const [group,ids]of Object.entries(pairs)){
  assert.deepEqual(observed[group].slice().sort(),ids.slice().sort(),
   'Concept review pair disappeared '+group);
 }
});
