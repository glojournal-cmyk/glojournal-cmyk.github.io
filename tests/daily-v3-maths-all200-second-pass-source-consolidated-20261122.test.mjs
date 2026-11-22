import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsOriginalGradeDemandDecision} from '../assets/math-study/math-v311-grade-demand-gate.js';
const doc=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-all200-second-pass-consolidated-qa-20261122.json',import.meta.url),'utf8'));
test('all five independent 40-topic Maths source second passes reconcile exact 200 and 1200 original option statuses',()=>{
 const s=doc.statistics;
 assert.equal(doc.status,'ALL200_ORIGINAL_5X40_SECOND_PASS_SOURCE_QA_RECONCILED_NO_FORMAL_APPROVAL');
 assert.equal(s.sourceQuestions,200);
 assert.equal(s.sourceOptionSlots,1200);
 assert.equal(s.sourceNumericallyReadable,693);
 assert.equal(s.sourceMathVisuallyUnresolved,507);
 assert.equal(s.sourceCorrectReadable,129);
 assert.equal(s.sourceCorrectVisualUnresolved,71);
 assert.equal(s.sourceWrongReadable,564);
 assert.equal(s.sourceWrongVisualUnresolved,436);
 assert.equal(s.sourceCorrectReadable+s.sourceCorrectVisualUnresolved,200);
 assert.equal(s.sourceWrongReadable+s.sourceWrongVisualUnresolved,1000);
 assert.equal(s.sourceWrongOperationMathCandidates,111);
 assert.equal(s.sourceWrongOperationCandidateReadable,109);
 assert.equal(s.sourceWrongOperationCandidateMathLayoutUnresolved,2);
 assert.equal(s.independentFormalAcademicApproved,0);
 assert.equal(s.studentCreditApproved,0);
 assert.equal(doc.topicStatistics.length,5);
 assert.deepEqual(doc.topicStatistics.map(x=>x.sourceQuestions),[40,40,40,40,40]);
 assert.deepEqual(doc.topicStatistics.map(x=>x.sourceOptionSlots),[240,240,240,240,240]);
 assert.deepEqual(doc.topicStatistics.map(x=>x.typesetUnresolved),[98,8,240,113,48]);
 assert.deepEqual(doc.topicStatistics.map(x=>x.mathWrongPathCandidates),[4,107,0,0,0]);
 assert.deepEqual(doc.topicStatistics.map(x=>x.mathWrongPathStillVisual),[2,0,0,0,0]);
 assert.deepEqual([s.grade7PlusUpgrades,s.sourceContextOrDuplicatesRewrites,s.sourceTaughtScopeQuarantine,s.potentialExternalGradeBenchmark],
  [79,17,80,24]);
});
test('200 source original IDs unique, six original slots per item, 0 visual and teacher signoffs, fail-closed Maths credit',()=>{
 const rows=doc.originalQuestionDecisions;
 assert.equal(rows.length,200);
 assert.equal(new Set(rows.map(r=>r.originalId)).size,200);
 for(let i=0;i<200;i++){
  const q=rows[i];
  assert.equal(q.question,i+1);
  assert.ok(q.originalId.startsWith('LUX-MATH-Y9-'));
  assert.equal(q.rawPdfChoiceNumericReadable.length+q.rawPdfChoiceMathStillNeedsVisual.length,6);
  assert.deepEqual([...q.rawPdfChoiceNumericReadable,...q.rawPdfChoiceMathStillNeedsVisual].sort(),['A','B','C','D','E','F']);
  assert.equal(q.originalRenderedPdfOptionMathVisuallyVerified,false);
  assert.equal(q.independentGrade7PlusApproved,false);
  assert.equal(q.actualYear9AutumnTaughtSigned,false);
  assert.equal(q.independentFiveDistractorPedagogyApproved,false);
  assert.equal(q.studentCreditAllowed,false);
  assert.equal(mathsOriginalGradeDemandDecision({id:q.originalId}).ok,false,q.originalId);
  assert.ok(q.mathematicalWrongOperationCandidateChoices.every(x=>x!==q.sourcePrintedCorrectLetter));
  assert.ok(q.wrongOperationCandidateButUnreliableOriginalMathLayout.every(x=>
    q.mathematicalWrongOperationCandidateChoices.includes(x)&&q.rawPdfChoiceMathStillNeedsVisual.includes(x)));
 }
});
test('original Indices Q6 and Q8 giant wrong value sources remain visually blocked even though an error operation can be constructed',()=>{
 const q6=doc.originalQuestionDecisions[5],q8=doc.originalQuestionDecisions[7];
 assert.deepEqual(q6.wrongOperationCandidateButUnreliableOriginalMathLayout,['D']);
 assert.deepEqual(q8.wrongOperationCandidateButUnreliableOriginalMathLayout,['E']);
 assert.equal(doc.statistics.sourceWrongOperationCandidateMathLayoutUnresolved,2);
});
