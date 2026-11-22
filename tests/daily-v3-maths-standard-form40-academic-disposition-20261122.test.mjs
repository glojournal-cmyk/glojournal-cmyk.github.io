import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>JSON.parse(readFileSync(new URL('../qa-staging/math-v311-'+p+'-20261122.json',import.meta.url),'utf8'));
const report=load('standard-form40-academic-disposition-all-originals');
const source=load('batch40-standard-form-source-qa');
const opts=load('standard-form40-original-200-distractor-operation-candidates');
test('all 40 Standard Form original academic decisions preserve source identity and never enable credit',()=>{
 assert.equal(report.status,'COMPLETE_STANDARD_FORM_40_ORIGINAL_QA_DISPOSITION_ALL_STUDENT_CREDITS_BLOCKED');
 assert.equal(report.fortyOriginalQuestionDecisions.length,40);
 assert.equal(report.tenOriginalTemplateDecisions.length,10);
 assert.equal(report.availableForDailyCredit,false);
 assert.equal(report.independentlyApprovedOriginals,0);
 assert.equal(report.originalQuestionBankUnchanged,true);
 let paths=0,undemonstrated=0,unsafe=0;
 for(let i=0;i<40;i++){
  const q=report.fortyOriginalQuestionDecisions[i],original=source.sourceQuestionRows[i];
  assert.equal(q.originalQuestion,41+i);
  assert.equal(q.originalId,original.id);
  assert.equal(q.sourceTemplate,original.templateId);
  assert.equal(q.originalCorrectLetter,original.originalPrintedCorrectOption);
  assert.equal(q.originalTriage,original.triageAction);
  assert.equal(q.creditAllowed,false);
  assert.equal(q.independentTeacherPedagogyApproved,false);
  assert.equal(q.independentAQA7PlusCertified,false);
  assert.equal(q.tgsAutumnActualTaughtVerified,false);
  assert.equal(q.exactOriginalOptionVisualCertified,false);
  const a=q.sourceOriginalFiveWrongLetterStatus;
  assert.equal(a.arithmeticallyReproduced.length+a.wrongValueNoModeledError.length+a.unresolvedOriginalMath.length,5);
  assert.equal(new Set([...a.arithmeticallyReproduced,...a.wrongValueNoModeledError,...a.unresolvedOriginalMath]).size,5);
  paths+=a.arithmeticallyReproduced.length;
  undemonstrated+=a.wrongValueNoModeledError.length;
  unsafe+=a.unresolvedOriginalMath.length;
  const candidates=opts.allSourceOptions.filter(o=>o.originalSourceId===q.originalId);
  assert.equal(candidates.length,6);
  assert.deepEqual(a.arithmeticallyReproduced,candidates.filter(o=>o.classification==='WRONG_VALUE_REPRODUCIBLE_FROM_SPECIFIC_ALGEBRA_OPERATION').map(o=>o.originalOption));
 }
 assert.deepEqual([paths,undemonstrated,unsafe],[107,85,8]);
});
test('Standard Form 40 source actions are exactly 20 upgrades, 12 rewrites, 8 school scope quarantine; none self-approved',()=>{
 const tally=report.summary;
 assert.deepEqual([tally.sourceOriginalQuestions,tally.fullWrongOptionSlots,
 tally.arithmeticallyReproducedErrorModelSlots,tally.numericalWrongButUnmodelledSlots,
 tally.visuallyAmbiguousOriginalChoiceSlots,tally.upgradeOriginals,
 tally.rewriteOriginals,tally.schoolScopeHoldOriginals,
 tally.independentlyAcademicApprovedOriginals],[40,200,107,85,8,20,12,8,0]);
 assert.equal(report.tenOriginalTemplateDecisions.filter(x=>x.action.startsWith('UPGRADE')).length,5);
 assert.equal(report.tenOriginalTemplateDecisions.filter(x=>x.action.startsWith('REWRITE')).length,3);
 assert.equal(report.tenOriginalTemplateDecisions.filter(x=>x.action.startsWith('QUARANTINE')).length,2);
 assert.deepEqual(report.tenOriginalTemplateDecisions.map(x=>x.originalQuestionNumbers[0]),
  [41,45,49,53,57,61,65,69,73,77]);
 for(const family of report.tenOriginalTemplateDecisions){
  assert.equal(family.sourceQuestionsCount,4);
  assert.equal(family.independentGradeCalibrationPassed,false);
  assert.equal(family.actualAutumnTaughtProven,false);
 }
});
