import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const sha=p=>{const content=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(content)+'\0').update(content).digest('hex')};
const report=read('qa-staging/math-v323-canonical200-all-topics-hold-dispositions-source-exact-20261124.json');
const bank=read('qa-staging/math-v311-reviewed-200.json');
const triage=read('qa-staging/math-v311-200-item-grade-demand-triage-20261122.json');
const versions=read('qa-staging/math-v322-all-versioned-candidate-packs-200-source-dedup-and-credit-deny-20261124.json');
const grade=read('qa-staging/math-v314-prior24-retain-grade-demand-reclassification-20261123.json');
const changes=read('qa-staging/math-v315-indices40-standardform40-source-exact-pedagogical-hold-and-12-risk-corrections-20261123.json');
const family=read('qa-staging/math-v313-rearranging025-040-concept-consolidation-no-credit-20261123.json');
const mapBank=new Map(bank.questions.map(q=>[q.sourceId,q]));
const mapTriage=new Map(triage.rows.map(q=>[q.id,q]));
const mapVersions=new Map(versions.rows.map(q=>[q.sourceId,q]));
const mapGrade=new Map(grade.rows.map(q=>[q.sourceId,q]));
const mapCorrections=new Map(changes.correctedHistoricalRisks.map(q=>[q.sourceId,q]));
const mapFamily=new Map(family.items.map(q=>[q.sourceId,q]));
test('V323 exact 200 original source IDs, unchanged all topic counts, formal approval zero and Git-pinned reviewer evidence',()=>{
 assert.equal(report.kind,'V323_CANONICAL_200_FULL_SOURCE_DISPOSITION_AND_CANDIDATE_COVERAGE_WITH_ZERO_APPROVAL');
 assert.equal(report.canonicalSourcePath,'qa-staging/math-v311-reviewed-200.json');
 assert.equal(sha(report.canonicalSourcePath),report.canonicalSourceGitBlobSha);
 assert.equal(report.sourceUnmodified,true);
 assert.equal(bank.questions.length,200);
 assert.equal(report.rows.length,200);
 assert.equal(report.counts.canonical,200);
 assert.equal(report.counts.academicApprovals,0);
 assert.equal(report.counts.fullyCertifiedMasteryConcepts,0);
 assert.equal(report.counts.studentDailyEligible,0);
 assert.equal(report.counts.studentMasteryEligible,0);
 assert.equal(report.counts.realIpadAcceptances,0);
 assert.equal(report.schoolYear9Pdf,'SKIPPED_PER_USER_INSTRUCTION');
 assert.equal(report.releaseDecision,'BLOCKED_0_OF_200_DO_NOT_IMPORT_MERGE_DEPLOY_OR_SCORE');
 const countBy={};
 for(const row of report.rows)countBy[row.topicId]=(countBy[row.topicId]||0)+1;
 assert.deepEqual(countBy,report.counts.topicCounts);
 assert.deepEqual(Object.values(countBy).sort(),[40,40,40,40,40]);
 assert.equal(mapBank.size,200);
 assert.equal(mapTriage.size,200);
 assert.equal(report.evidenceSources.length,5);
 for(const ref of report.evidenceSources)assert.equal(sha(ref.path),ref.gitBlobSha,'Evidence blob changed '+ref.path);
});
test('every one of 200 formal source decisions matches current stem, full existing answer key, triage and no student credit',()=>{
 const expectedTriage={UPGRADE_STEM_FOR_G7PLUS:79,QUARANTINE_TAUGHT_SCOPE:80,REWRITE_CONTEXT_OR_DUPLICATE:17,RETAIN_FOR_EXTERNAL_BENCHMARK:24};
 assert.deepEqual(report.counts.sourceOriginalTriage,expectedTriage);
 const seen=new Set(),count={};
 for(const row of report.rows){
  const source=mapBank.get(row.sourceId),tri=mapTriage.get(row.sourceId);
  assert.ok(source&&tri&&!seen.has(row.sourceId));seen.add(row.sourceId);
  assert.equal(source.revisionId,row.sourceRevisionId);
  assert.equal(source.topicId,row.topicId);
  assert.equal(source.stem,row.sourceStem);
  assert.equal(source.correctOptionId,row.correctOptionId);
  assert.equal(source.correctAnswerLatex,row.correctAnswerLatex);
  assert.equal(source.options.length,6);
  assert.equal(row.optionCount,6);
  assert.equal(row.originalProvisionalGrade,tri.originalProvisionalGrade);
  assert.equal(row.originalTriageAction,tri.triageAction);
  assert.equal(row.originalTriageRisk,tri.sourceFamilyRisk);
  assert.equal(row.sourceTemplateId,tri.sourceTemplateId);
  assert.ok(row.sourceAcademicRiskRouting.length>35);
  assert.equal(row.originalDailyEligible,false);
  assert.equal(row.academicApproval,'NOT_APPROVED');
  assert.equal(row.independentGrade7Calibration,false);
  assert.equal(row.taughtThisSchoolYearConfirmed,false);
  assert.equal(row.empiricallyReliableWrongChoicesConfirmed,false);
  assert.equal(row.independentMasteryConceptApproval,false);
  assert.equal(row.realIpadPwaAccepted,false);
  assert.equal(row.sourceConceptCreditEligible,false);
  assert.equal(row.dailyEligible,false);
  assert.equal(row.masteryEligible,false);
  assert.equal(row.releaseDecision,'HOLD');
  count[row.originalTriageAction]=(count[row.originalTriageAction]||0)+1;
 }
 assert.deepEqual(count,expectedTriage);
 assert.equal(seen.size,200);
});
test('87 staged source IDs, 45 reasoning, 42 editorial-only, 113 without full staging candidate, no silent import',()=>{
 assert.deepEqual(report.counts.candidateCoverage,{withDraft:87,reasoning:45,editorialOnly:42,withoutDraft:113});
 const seen=new Set();let covered=0,reason=0,editorialOnly=0,none=0,mixed=0;
 for(const row of report.rows){
  const v=mapVersions.get(row.sourceId),q=row.candidateAudit;
  assert.ok(!seen.has(row.sourceId));seen.add(row.sourceId);
  assert.equal(q.sourceIdVariants,v?.totalVersionedQARecords??0);
  assert.equal(q.reasoningVersions,v?.reasoningDrafts??0);
  assert.equal(q.editorialVersions,v?.originalWordingEditorialDrafts??0);
  assert.equal(q.latestReasoningReviewRevisionId,v?.latestReasoningReviewCandidate??null);
  assert.equal(q.mixedRevisionEditorialRequiresReQA,v?.editorialMustNotBeMergedIntoReasoningWithoutNewSourceSpecificQA??false);
  assert.equal(row.dailyEligible,false);
  if(q.sourceIdVariants){covered++;if(q.reasoningVersions)reason++;else editorialOnly++;}
  else none++;
  if(q.mixedRevisionEditorialRequiresReQA)mixed++;
 }
 assert.equal(covered,87);assert.equal(reason,45);assert.equal(editorialOnly,42);assert.equal(none,113);assert.equal(mixed,12);
});
test('24 AQA AO re-screens, 12 obsolete historical risk retractions and 16 changing-subject family holds remain exact-source and unapproved',()=>{
 assert.deepEqual(report.counts.specificEvidenceUpdates,{gradeRescreen:24,staleRiskCorrection:12,conceptFamilyHold:16});
 const gradeIDs=new Set(),correctionIDs=new Set(),familyIDs=new Set();
 for(const row of report.rows)for(const flag of row.sourceSpecificQAUpdates){
  if(flag.kind==='AQA_AO_GRADE_DEMAND_RESCREEN'){
   const source=mapGrade.get(row.sourceId);assert.ok(source);
   assert.equal(flag.review,source.secondPassPedagogicalAction);
   assert.equal(flag.formalGrade7Approved,false);
   gradeIDs.add(row.sourceId);
  }else if(flag.kind==='RETRACT_OUTDATED_ORIGINAL_FAMILY_RISK'){
   const source=mapCorrections.get(row.sourceId);assert.ok(source);
   assert.equal(flag.review,source.correctedFlag);
   assert.equal(flag.priorRisk,source.previousRisk);
   assert.equal(flag.formalGrade7Approved,false);
   correctionIDs.add(row.sourceId);
  }else if(flag.kind==='SIXTEEN_SOURCE_FOUR_CONCEPT_FAMILY_HOLD'){
   assert.ok(mapFamily.has(row.sourceId));
   assert.equal(flag.formalConceptApproved,false);
   familyIDs.add(row.sourceId);
  }else assert.fail('Unsupported source-specific reviewer evidence');
 }
 assert.equal(gradeIDs.size,24);assert.equal(correctionIDs.size,12);assert.equal(familyIDs.size,16);
 assert.equal(grade.rows.length,24);
 assert.equal(changes.correctedHistoricalRisks.length,12);
 assert.equal(family.items.length,16);
});
test('adversarial score unlock and source answer mutation violate the held source-evidence ledger',()=>{
 const original=report.rows.find(x=>x.sourceId.endsWith('STANDARD_FORM-025'));
 assert.ok(original);
 const tampered={...original,dailyEligible:true};
 assert.notEqual(tampered.dailyEligible,original.dailyEligible);
 const modified={...original,correctOptionId:original.correctOptionId==='A'?'B':'A'};
 assert.notEqual(modified.correctOptionId,mapBank.get(original.sourceId).correctOptionId);
});