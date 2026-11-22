import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsOriginalGradeDemandDecision} from '../assets/math-study/math-v311-grade-demand-gate.js';
const load=n=>JSON.parse(readFileSync(new URL('../qa-staging/math-v311-'+n+'-20261122.json',import.meta.url),'utf8'));
const source=load('batch40-straight-line-graphs-source-qa');
const math=load('straight-line-graphs40-independent-geometry');
const orig=load('straight-line-graphs-240-source-options-qa-ledger');
const audit=load('straight-line-graphs40-source240-option-and-curriculum-holds');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
test('All 40 original Graphs source IDs and 240 literal original options are traceable with 0 academic or credit approval',()=>{
 assert.equal(source.sourceQuestionRows.length,40);
 assert.equal(math.questions.length,40);
 assert.equal(orig.choices.length,240);
 assert.equal(audit.sourceQuestionDecisions.length,40);
 assert.equal(audit.source240ChoiceReviews.length,240);
 assert.equal(audit.summary.sourceSchoolScopeQuarantine,20);
 assert.equal(audit.summary.sourceUpgradeStems,4);
 assert.equal(audit.summary.sourcePotentialGradeBenchmark,16);
 for(let i=0;i<40;i++){
  const q=source.sourceQuestionRows[i],m=math.questions[i],r=audit.sourceQuestionDecisions[i];
  assert.equal(q.sourceIndex,121+i);
  assert.equal(r.originalId,q.id);
  assert.equal(r.originalPrintedCorrectLetter,q.originalPrintedCorrectOption);
  assert.equal(r.independentCalculatedSourceValue,m.independentlyComputedNumericalAnswer);
  assert.equal(r.originalTriage,q.triageAction);
  assert.equal(r.studentCreditAllowed,false);
  assert.equal(r.independentGrade7PlusApproved,false);
  assert.equal(r.originalRenderProofAccepted,false);
  assert.equal(mathsOriginalGradeDemandDecision({id:q.id}).ok,false);
  assert.equal(audit.source240ChoiceReviews.filter(x=>x.originalId===q.id).length,6);
 }
});
test('Strict unaltered source Graphs parser proves 127 readable integer strings, holds 113 multiline math and 17 original correct-key expressions',()=>{
 let n=0,amb=0,keyYes=0,keyAmb=0,bad=0,badAmb=0;
 for(let i=0;i<240;i++){
  const s=orig.choices[i],r=audit.source240ChoiceReviews[i];
  const x=s.sourceOptionTextFromPdf.replace(/\u2212/g,'-').trim();
  const m=x.match(/^([A-F])\.[ \t]*(-?\d+(?:\.\d+)?)[ \t]*$/);
  const value=m?Number(m[2]):null;
  assert.equal(r.originalId,s.originalSourceId);
  assert.equal(r.sourceCorrectKey,s.sourceKey);
  assert.equal(r.optionLetter,s.sourceOptionLetter);
  assert.equal(r.strictlyReadSingleLineInteger,value);
  assert.equal(r.visuallyTypesetFractionAndMathematicsVerified,false);
  assert.equal(r.teacherSignedMisconceptionPlausibility,false);
  assert.equal(r.creditAllowed,false);
  const ans=math.questions[s.originalQ-121].independentlyComputedNumericalAnswer;
  if(value===null){amb++;if(s.sourceKey)keyAmb++;else badAmb++}
  else{
   n++;
   if(s.sourceKey){keyYes++;assert.ok(near(value,ans))}
   else{bad++;assert.ok(!near(value,ans))}
  }
 }
 assert.deepEqual([n,amb,keyYes,keyAmb,bad,badAmb],[127,113,23,17,104,96]);
});
test('All four higher-labelled source bisector variants return precisely 7, still unverified Spring skill and full release hold',()=>{
 const q=math.questions.filter(x=>x.number>=157);
 assert.equal(q.length,4);
 assert.deepEqual(q.map(x=>x.independentlyComputedNumericalAnswer),[7,7,7,7]);
 for(const p of q){
  assert.ok(p.sourceRisks.some(x=>x==='SPRING_PERPENDICULAR_BISECTOR_NOT_AUTUMN'));
  assert.equal(p.studentCreditEligible,false);
  assert.equal(p.examGradeCalibrated,false);
 }
 assert.equal(audit.summary.formalApprovedOriginalQuestions,0);
 assert.equal(audit.summary.independentlySignedOriginalDistractors,0);
});
