import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsOriginalGradeDemandDecision} from '../assets/math-study/math-v311-grade-demand-gate.js';
const read=n=>JSON.parse(readFileSync(new URL('../qa-staging/math-v311-'+n+'-20261122.json',import.meta.url),'utf8'));
const orig=read('batch40-changing-subject-source-qa'),prev=read('changing-subject40-independent-inverse-check');
const dom=read('changing-subject40-inverse-domains-and-uniqueness');
const worked=read('changing-subject40-full-worked-source-derivations');
const options=read('changing-subject40-original-240-option-typeset-risk');
const approx=(a,b,label='')=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),label+' '+a+' versus '+b);
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
function forward(f,p,x){
 switch(f){
 case 'simple-rational':case 'shifted-rational-original':case 'shifted-rational-secondary':{
   const [s,a,b,c,d]=p;return s+(a*x+b)/(c*x+d)}
 case 'affine-surd':{const [a,b,c,d]=p;return a*Math.sqrt(b*x+c)-d}
 case 'shifted-reciprocal':{const [s,a,b,c]=p;return s+a/(b*x+c)}
 case 'reciprocal-of-y':{const [s,a,b,c]=p;return 1/(s+a/(b*x+c))}
 case 'root-reciprocal':{const [s,a,b,c]=p;return s+Math.sqrt(a/(b*x+c))}
 case 'factor-fraction':{const [s,a,b,c,d]=p;return s+a*(x+b)/(c*x+d)}
 case 'nested-denominator':{const [s,a,b,c,d]=p;return s+a/(b+c/(x+d))}
 case 'surds-of-rational':{const [s,a,b,c,d]=p;return s+Math.sqrt((a*x+b)/(c*x+d))}
 }throw Error('Unknown independently transcribed formula '+f);
}
function inverse(f,p,y){
 switch(f){
 case 'simple-rational':case 'shifted-rational-original':case 'shifted-rational-secondary':{
   const [s,a,b,c,d]=p,z=y-s;return (b-d*z)/(c*z-a)}
 case 'affine-surd':{const [a,b,c,d]=p;return (((y+d)/a)**2-c)/b}
 case 'shifted-reciprocal':{const [s,a,b,c]=p;return (a/(y-s)-c)/b}
 case 'reciprocal-of-y':{const [s,a,b,c]=p;return (a/(1/y-s)-c)/b}
 case 'root-reciprocal':{const [s,a,b,c]=p;return (a/(y-s)**2-c)/b}
 case 'factor-fraction':{const [s,a,b,c,d]=p,z=y-s;return (a*b-d*z)/(c*z-a)}
 case 'nested-denominator':{const [s,a,b,c,d]=p;return c/(a/(y-s)-b)-d}
 case 'surds-of-rational':{const [s,a,b,c,d]=p,z=(y-s)**2;return (b-d*z)/(c*z-a)}
 }throw Error('Unknown inverse type '+f);
}
function validX(f,p,x){
 if(!Number.isFinite(x))return false;
 switch(f){
 case 'simple-rational':case 'shifted-rational-original':case 'shifted-rational-secondary':return !near(p[3]*x+p[4],0);
 case 'affine-surd':return p[1]*x+p[2]>=-1e-11;
 case 'shifted-reciprocal':return !near(p[2]*x+p[3],0);
 case 'reciprocal-of-y':{
  const [s,a,b,c]=p,d=b*x+c;
  return !near(d,0)&&!near(s+a/d,0);
 }
 case 'root-reciprocal':return p[2]*x+p[3]>0;
 case 'factor-fraction':return !near(p[3]*x+p[4],0);
 case 'nested-denominator':{
  const [s,a,b,c,d]=p,h=x+d;
  return !near(h,0)&&!near(b+c/h,0);
 }
 case 'surds-of-rational':{
  const [s,a,b,c,d]=p,z=c*x+d;return !near(z,0)&&(a*x+b)/z>=-1e-11;
 }
 }throw Error('unhandled '+f);
}
function validY(r,y){
 if(!Number.isFinite(y))return false;
 if(r.excludedInverseOutputYValues.some(q=>near(y,q)))return false;
 if(r.inverseOutputYMinInclusive!==null&&y<r.inverseOutputYMinInclusive-1e-11)return false;
 if(r.inverseOutputYMinExclusive!==null&&y<=r.inverseOutputYMinExclusive+1e-11)return false;
 return true;
}
test('40 original source identities, four independent worked algebra steps and every source option remain blocked',()=>{
 assert.equal(orig.sourceQuestionRows.length,40);
 assert.equal(prev.questions.length,40);
 assert.equal(dom.fortySourceRecords.length,40);
 assert.equal(worked.workedSolutions.length,40);
 assert.equal(options.sourceOriginalOptions.length,240);
 assert.equal(options.totals.originalWrongOptionSlots,200);
 assert.equal(options.totals.fullyVisuallyVerifiedMathExpressions,0);
 assert.equal(options.totals.independentFiveWrongCalculationPathsApproved,0);
 assert.equal(options.studentCreditEnabled,false);
 let t=0;
 const byTemplate=new Map();
 for(let i=0;i<40;i++){
  const q=orig.sourceQuestionRows[i],p=prev.questions[i],r=dom.fortySourceRecords[i],w=worked.workedSolutions[i],o=options.originalQuestionSummary[i];
  assert.equal(q.sourceIndex,81+i);
  assert.equal(q.id,p.sourceId);
  assert.equal(q.id,r.originalId);
  assert.equal(q.id,w.sourceId);
  assert.equal(q.id,o.originalId);
  assert.equal(q.originalPrintedCorrectOption,w.originalPrintedCorrectLetter);
  assert.equal(q.originalPrintedCorrectOption,r.originalCorrectAnswerLetter);
  assert.equal(q.originalPrintedCorrectOption,o.originalCorrectLetter);
  assert.deepEqual(r.actualSourceParameters,p.sourceParameters);
  assert.deepEqual(w.sourceCoefficients,p.sourceParameters);
  assert.ok(w.workedAlgebraSteps.length>=4);
  assert.ok(typeof w.independentDerivedModelAnswer==='string'&&w.independentDerivedModelAnswer.startsWith('x='));
  assert.equal(r.independentFourInverseProbeChecksPassed,true);
  assert.equal(r.eligibleForDailyCredit,false);
  assert.equal(o.originalSixMathematicalOptionExpressionsFullyVisualVerified,false);
  assert.equal(o.fullAcademicQaApproved,false);
  assert.equal(mathsOriginalGradeDemandDecision({id:q.id}).ok,false);
  assert.equal(q.triageAction,'QUARANTINE_TAUGHT_SCOPE');
  byTemplate.set(q.templateId,(byTemplate.get(q.templateId)||0)+1);
  const choices=options.sourceOriginalOptions.filter(x=>x.originalSourceId===q.id);
  assert.equal(choices.length,6);
  assert.deepEqual(choices.map(x=>x.optionLetter),['A','B','C','D','E','F']);
  assert.equal(choices.filter(x=>x.isOriginalKey).length,1);
  assert.equal(choices.find(x=>x.isOriginalKey).optionLetter,q.originalPrintedCorrectOption);
  for(const opt of choices){
   assert.ok(opt.originalPDFExtractedSnippet.includes('\n'));
   assert.equal(opt.originalPaperEquationAndOptionVisuallyValidated,false);
   assert.equal(opt.independentlyReconstructedMathematicalError,false);
   assert.equal(opt.studentXPMPMasteryCreditAllowed,false);
   t++;
  }
 }
 assert.equal(t,240);
 assert.equal(byTemplate.size,10);
 assert.ok([...byTemplate.values()].every(v=>v===4));
});
test('Each of 40 originals has a unique valid inverse at all finite tested x, including negative valid values',()=>{
 let probes=0;
 const xs=[-40,-10,-7,-5,-3,-2,-1,0,0.25,1,3,7,17,100];
 for(let i=0;i<40;i++){
  const r=dom.fortySourceRecords[i],p=prev.questions[i],f=p.verifiedStructuralFamily,params=p.sourceParameters;
  for(const x of xs){
    if(!validX(f,params,x))continue;
    const y=forward(f,params,x);
    assert.ok(Number.isFinite(y),p.sourceId+' expected finite y at x='+x);
    assert.ok(validY(r,y),p.sourceId+' source range unexpectedly rejects x='+x+' y='+y);
    const x2=inverse(f,params,y);
    approx(x,x2,p.sourceId+' x='+x);
    assert.ok(validX(f,params,x2),p.sourceId+' recovered x must remain defined');
    probes++;
  }
 }
 assert.ok(probes>360,'wide positive/negative source equation sample coverage: '+probes);
});
test('Root branches and source inverse forbidden Y values are genuine domain restrictions, not dispensable formatting',()=>{
 const by=dom.fortySourceRecords;
 const counts={root:0,forbiddenY:0,reciprocalY:0,nested:0};
 for(let i=0;i<40;i++){
  const r=by[i],p=prev.questions[i],f=p.verifiedStructuralFamily,z=p.sourceParameters;
  for(const y of r.excludedInverseOutputYValues){
    assert.equal(validY(r,y),false,r.originalId+' forbidden y '+y);
    counts.forbiddenY++;
  }
  for(const x of r.excludedOriginalInputXPoints){
    assert.equal(validX(f,z,x),false,r.originalId+' forbidden input x '+x);
  }
  if(r.nonzeroMobiusDeterminant!==null){
    let det;
    if(r.shape==='FACTOR_RATIONAL_MOBIUS')det=z[1]*(z[4]-z[2]*z[3]);
    else if(r.shape==='PRINCIPAL_ROOT_OF_MOBIUS')det=z[1]*z[4]-z[2]*z[3];
    else det=z[1]*z[4]-z[2]*z[3];
    assert.notEqual(det,0);
    approx(det,r.nonzeroMobiusDeterminant,r.originalId+' determinant');
  }
  if(['AFFINE_PRINCIPAL_SQUARE_ROOT','PRINCIPAL_ROOT_OF_RECIPROCAL','PRINCIPAL_ROOT_OF_MOBIUS'].includes(r.shape)){
    counts.root++;
    const boundary=r.inverseOutputYMinInclusive??r.inverseOutputYMinExclusive;
    assert.ok(Number.isFinite(boundary));
    assert.equal(validY(r,boundary-1),false,r.originalId+' root lower-branch');
    const wrongInverseX=inverse(f,z,boundary-1);
    const possibleForward=forward(f,z,wrongInverseX);
    assert.ok(Number.isFinite(possibleForward));
    assert.ok(!near(possibleForward,boundary-1),'squaring negative branch must not create an admitted root');
  }
  if(r.shape==='INVERSE_OF_RECIPROCAL'){
    counts.reciprocalY++;
    assert.ok(r.excludedInverseOutputYValues.some(x=>near(x,0)));
    assert.equal(r.excludedOriginalInputXPoints.length,2);
  }
  if(r.shape==='NESTED_DENOMINATOR'){
    counts.nested++;
    assert.equal(r.excludedOriginalInputXPoints.length,2);
    assert.equal(r.excludedInverseOutputYValues.length,2);
  }
 }
 assert.deepEqual(counts,{root:12,forbiddenY:40,reciprocalY:4,nested:4});
 assert.equal(dom.statistics.squareRootPrincipalBranchQuestions,12);
 assert.equal(dom.statistics.originalInverseOutputAsymptoteOrForbiddenYQuestions,32);
});
