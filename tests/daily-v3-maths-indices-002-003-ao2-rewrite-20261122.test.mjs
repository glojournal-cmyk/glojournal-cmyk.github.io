import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pack=JSON.parse(readFileSync(new URL(
 '../qa-staging/math-v311-indices-002-003-ao2-cross-topic-redesign-20261122.json',import.meta.url),'utf8'));
const c=id=>pack.candidates.find(q=>q.originId==='LUX-MATH-Y9-INDICES-'+id);
const close=(a,b,label='')=>assert.ok(
 Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b)),
 label+': actual '+a+', expected '+b);
const value=x=>{assert.match(x,/^-?\d+$/);return Number(x)};
const minimumWhen=predicate=>{
 for(let n=0;n<100;n++)if(predicate(n))return n;
 throw Error('no valid integer within reasonable range');
};
test('two distinct original-source IDs with separate new versions and all release gates closed',()=>{
 assert.equal(pack.status,'QA_ONLY_NOT_CANONICAL_NOT_RELEASED');
 assert.equal(pack.subjectAcademicQaApproved,0);
 assert.equal(pack.candidates.length,2);
 for(const k of ['canonicalBankModified','liveAppModified','studentCreditEnabled',
 'independentGrade7PlusCertified','actualTgsTaughtConfirmed',
 'independentMisconceptionReviewPassed','rawCanonicalBankShaVerified',
 'physicalIpadPwaQAPassed'])assert.equal(pack[k],false,k);
 assert.equal(pack.neverImportDirectly,true);
 assert.deepEqual(pack.candidates.map(x=>x.originId),
 ['LUX-MATH-Y9-INDICES-002','LUX-MATH-Y9-INDICES-003']);
 assert.equal(new Set(pack.candidates.map(x=>x.newCandidateVersionId)).size,2);
 assert.equal(new Set(pack.candidates.map(x=>x.distinctConcept)).size,2);
 for(const x of pack.candidates){
   assert.equal(x.pedagogySignoff,false);
   assert.equal(x.actualTgsTeachingEvidence,false);
   assert.equal(x.grade7Benchmark,false);
   assert.equal(x.originalBankEdited,false);
   assert.match(x.release,/HOLD_/);
   assert.match(x.gradeHypothesis,/NOT_GCSE_CALIBRATED/);
   const opts=x.replacement.options;
   assert.deepEqual(opts.map(o=>o.id),['A','B','C','D','E','F']);
   assert.equal(opts.length,6);
   assert.equal(new Set(opts.map(o=>value(o.latex))).size,6);
   assert.equal(opts.filter(o=>o.id!==x.originalCorrectOptionId&&o.wrongOperation?.length>45).length,5);
   assert.equal(opts.find(o=>o.id===x.originalCorrectOptionId).wrongOperation,null);
   opts.forEach(o=>close(value(o.latex),o.computedValue,x.originId+' '+o.id));
   assert.notEqual(x.originalAnswer,value(opts.find(o=>o.id===x.originalCorrectOptionId).latex),
       'new stem and numerical answer must not be imported as original');
   assert.ok(x.replacement.workedSolutionSteps.length>=3);
 }
 assert.equal(c('002').originalCorrectOptionId,'C');
 assert.equal(c('002').originalAnswer,3);
 assert.equal(c('003').originalCorrectOptionId,'E');
 assert.equal(c('003').originalAnswer,4);
});

test('Q2 independent calculation of original expression, comparator and first strict crossover',()=>{
 const A=n=>4**(n+3)*8**(4-n)/2**3;
 const B=n=>4**(n-2)*2**5;
 for(const n of [0,1,2,3,4,5,6,7,9,15]){
   close(A(n),2**(15-n),'original-source A(n), n='+n);
   close(B(n),2**(2*n+1),'comparison B(n), n='+n);
 }
 const actual=minimumWhen(n=>B(n)>A(n));
 assert.equal(actual,5);
 assert.ok(B(4)<A(4),'strict bound n4 excludes');
 assert.ok(B(5)>A(5),'n5 first valid');
 const expected={
   A:minimumWhen(n=>2*n+1>12-2*n), // wrong base4 to base2 in A
   B:Math.floor(14/3),             // illicit rounding down
   C:actual,
   D:minimumWhen(n=>2*n>15-n),    // omitted +1 from B
   E:minimumWhen(n=>n+3>15-n),    // wrong base4 to base2 in B
   F:minimumWhen(n=>2*n+1>18)     // wrong 4 to 8 in A
 };
 assert.deepEqual(expected,{A:3,B:4,C:5,D:6,E:7,F:9});
 for(const o of c('002').replacement.options)close(value(o.latex),expected[o.id],'Q2 '+o.id);
});

test('Q3 independently verify HCF/LCM for all n and all six distractor working pathways',()=>{
 const P=n=>4**(n+4)*8**(5-n)/2**4;
 const Q=n=>4**(n-3);
 const expP=n=>19-n,expQ=n=>2*n-6;
 const hcfExp=n=>Math.min(expP(n),expQ(n));
 const lcmExp=n=>Math.max(expP(n),expQ(n));
 for(const n of [3,4,7,9,11,15,19]){
   close(P(n),2**expP(n),'source P(n) '+n);
   close(Q(n),2**expQ(n),'source Q(n) '+n);
 }
 const admissible=Array.from({length:17},(_,i)=>i+3)
   .filter(n=>hcfExp(n)===8&&lcmExp(n)===16);
 assert.deepEqual(admissible,[11]);
 close(expP(11)+expQ(11),24,'HCF × LCM = product of powers');
 const expected={
   A:19-16,                    // use P=LCM only
   B:(8+6)/2,                 // use Q=HCF only
   C:24-15,                   // incorrect exponent 2(n−3)→2n−4
   D:23-8,                   // omit /2^4 from P and set P=HCF
   E:admissible[0],          // valid HCF and LCM
   F:16+3                   // wrong Q exponent n−3=16
 };
 assert.deepEqual(expected,{A:3,B:7,C:9,D:15,E:11,F:19});
 assert.equal(new Set(Object.values(expected)).size,6);
 for(const opt of c('003').replacement.options){
   close(value(opt.latex),expected[opt.id],'Q3 '+opt.id);
   if(opt.id!=='E'){
     const n=value(opt.latex);
     assert.ok(hcfExp(n)!==8||lcmExp(n)!==16,
       'wrong choice must actually violate a stated constraint: '+opt.id);
   }
 }
});

test('four former scaled source problems reduce to one method, not four Grade7 concepts',()=>{
 const originals=[
  {n:2,right:9,sourceId:'001'},
  {n:3,right:12,sourceId:'002'},
  {n:4,right:15,sourceId:'003'},
  {n:5,right:18,sourceId:'004'},
 ];
 for(let q=1;q<=4;q++){
   const item=originals[q-1];
   const exp=n=>2*(n+q+1)+3*(q+2-n)-(q+1);
   assert.equal(exp(item.n),item.right,item.sourceId);
   close(exp(item.n),4*q+7-item.n,item.sourceId+' source family');
 }
});
