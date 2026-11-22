import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsOriginalGradeDemandDecision} from '../assets/math-study/math-v311-grade-demand-gate.js';
const load=p=>JSON.parse(readFileSync(new URL('../qa-staging/math-v311-'+p+'-20261122.json',import.meta.url),'utf8'));
const topics=['indices','standard-form','changing-subject','straight-line-graphs','simultaneous-equations'];
const originals=topics.map(t=>load('batch40-'+t+'-source-qa'));
const ind=load('indices40-independent-calculation'),sf=load('standard-form40-independent-calculation');
const cs=load('changing-subject40-independent-inverse-check'),gr=load('straight-line-graphs40-independent-geometry');
const sim=load('simultaneous40-independent-elimination');
const resultGroups=[ind.questions,sf.questions,cs.questions,gr.questions,sim.questions];
const close=(a,b,label)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b)),label+': '+a+' vs '+b);
test('all 200 original items covered exactly once by five 40-item source and calculation packs',()=>{
 const used=new Set(),families=new Map();
 for(let t=0;t<5;t++){
  const a=originals[t].sourceQuestionRows,b=resultGroups[t];
  assert.equal(a.length,40);assert.equal(b.length,40);
  assert.equal(originals[t].counts.sourceAnswerOptionMatch,40);
  assert.equal(originals[t].counts.allSixALetters,40);
  for(let i=0;i<40;i++){
   const q=a[i],r=b[i];
   assert.equal(q.sourceIndex,t*40+i+1);
   assert.equal(q.id,r.sourceId);
   assert.ok(!used.has(q.id));used.add(q.id);
   assert.equal(q.originalRegisteredCorrectOption,q.originalPrintedCorrectOption);
   assert.equal(q.originalSixOptionOrder,'ABCDEF');
   assert.deepEqual(q.extractionFlags,[]);
   assert.equal(q.eligibleForDaily,false);
   assert.equal(q.grade7PlusIndependentSignoff,false);
   assert.equal(q.independentDistractorFiveSignoff,false);
   assert.equal(q.exactSchoolAutumnTaughtSubskillSigned,false);
   assert.equal(mathsOriginalGradeDemandDecision({id:q.id}).ok,false);
   families.set(q.templateId,(families.get(q.templateId)||0)+1);
  }
 }
 assert.equal(used.size,200);
 assert.equal(families.size,50);
 assert.ok([...families.values()].every(x=>x===4));
});
test('all 40 Indices, 40 Standard Form and 40 Simultaneous values independently match source worked answers',()=>{
 assert.equal(ind.independentAnswerValuesMatchOriginalWorkedKeys,40);
 assert.equal(sf.sourceMathAnswerMatched,40);
 assert.equal(sim.computedSourceAnswerMatches,40);
 for(const q of ind.questions){assert.equal(q.matchedOriginalWorkedAnswerNumeric,true);assert.equal(q.studentCreditEligible,false)}
 for(const q of sf.questions){
  close(q.independentCalculatedNumeric,q.printedCorrectAnswerValue,q.sourceId);
  assert.equal(q.sourceGrade7PlusIndependentlyApproved,false);
 }
 for(const q of sim.questions){
  close(q.independentMathematicalValue,q.originalAnswerNumeric,q.sourceId);
  if(q.originalSystemCoefficients){
   const [a,b,c,d,e,f]=q.originalSystemCoefficients,det=a*e-b*d;
   assert.notEqual(det,0);
   const x=(c*e-b*f)/det,y=(a*f-c*d)/det;
   close(a*x+b*y,c,q.sourceId+' first');
   close(d*x+e*y,f,q.sourceId+' second');
  }
 }
 assert.equal(new Set(sf.questions.slice(32,36).map(q=>q.independentCalculatedNumeric)).size,1);
 assert.deepEqual(sim.questions.slice(24,28).map(q=>q.independentMathematicalValue),[5,5,5,5]);
});
function forward(f,p,x){
 switch(f){
  case 'simple-rational':case 'shifted-rational-original':case 'shifted-rational-secondary':
   return p[0]+(p[1]*x+p[2])/(p[3]*x+p[4]);
  case 'affine-surd':return p[0]*Math.sqrt(p[1]*x+p[2])-p[3];
  case 'shifted-reciprocal':return p[0]+p[1]/(p[2]*x+p[3]);
  case 'reciprocal-of-y':return 1/(p[0]+p[1]/(p[2]*x+p[3]));
  case 'root-reciprocal':return p[0]+Math.sqrt(p[1]/(p[2]*x+p[3]));
  case 'factor-fraction':return p[0]+p[1]*(x+p[2])/(p[3]*x+p[4]);
  case 'nested-denominator':return p[0]+p[1]/(p[2]+p[3]/(x+p[4]));
  case 'surds-of-rational':return p[0]+Math.sqrt((p[1]*x+p[2])/(p[3]*x+p[4]));
 }throw Error('no independent family expression '+f);
}
test('40 rearrangements each pass 4 independent original-equation substitution probes; printed options still unverified',()=>{
 assert.equal(cs.correctIndependentSymbolicInverseCount,40);
 assert.equal(cs.probeChecks,160);
 for(const q of cs.questions){
  assert.equal(q.checkPoints.length,4);
  for(const a of q.checkPoints){
   close(forward(q.verifiedStructuralFamily,q.sourceParameters,a.x),a.y,q.sourceId);
   close(a.recoveredX,a.x,q.sourceId+' inverse');
  }
  assert.equal(q.originalPrintedExpressionVisualComparisonNotCompleted,true);
  assert.equal(q.studentCreditEligible,false);
 }
});
test('40 coordinate geometry answers independently derived, four high-band bisector sums all 7',()=>{
 const anchors={121:11/3,125:1,129:0,133:9,137:1,141:9/4,145:9,148:33/2,149:7,153:7/2,157:7,158:7,159:7,160:7};
 for(const q of gr.questions){
  assert.ok(Number.isFinite(q.independentlyComputedNumericalAnswer));
  assert.equal(q.answerAlgorithmVerified,true);
  assert.equal(q.examGradeCalibrated,false);
  assert.equal(q.studentCreditEligible,false);
  if(Object.hasOwn(anchors,q.number))close(q.independentlyComputedNumericalAnswer,anchors[q.number],q.sourceId);
 }
 assert.deepEqual(gr.questions.slice(36,40).map(q=>q.independentlyComputedNumericalAnswer),[7,7,7,7]);
});
