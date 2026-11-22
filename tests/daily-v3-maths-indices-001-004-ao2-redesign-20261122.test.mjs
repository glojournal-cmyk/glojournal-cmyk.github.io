import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pack=JSON.parse(readFileSync(new URL(
 '../qa-staging/math-v311-indices-001-004-two-ao2-redesigns-20261122.json',import.meta.url),'utf8'));
const sourceAnswer={1:2,2:3,3:4,4:5};
const sourceExponent=(q,n)=>(2*(n+q+1)+3*(q+2-n)-(q+1));
const close=(got,want,context='')=>assert.ok(
 Number.isFinite(got)&&Math.abs(got-want)<=1e-10*Math.max(1,Math.abs(want)),
 context+' '+got+' vs '+want);

test('source is exactly the repetitive original 001–004 family, 0 approved',()=>{
 assert.equal(pack.status,'ACADEMIC_REDESIGN_CANDIDATE_ONLY_NOT_APPROVED');
 assert.deepEqual(pack.sourceFamilyOriginals,[1,2,3,4].map(n=>
  'LUX-MATH-Y9-INDICES-'+String(n).padStart(3,'0')));
 for(const [field,expected] of Object.entries({
  independentGrade7ExamCalibrated:false,teacherExactTaughtVerified:false,
  independentFiveDistractorPedagogySigned:false,rawCanonicalBankHashVerified:false,
  ipadPwaFormallyApproved:false,studentCreditAllowed:false,originalSourceModified:false,
  doNotImportWithoutNewCanonicalIds:true})){assert.equal(pack[field],expected,field)}
 for(let q=1;q<=4;q++){
  const n=sourceAnswer[q];
  const exponent=sourceExponent(q,n);
  const expected=[9,12,15,18][q-1];
  assert.equal(exponent,expected,'source Q'+q+' original base-2 equality');
 }
 assert.equal(pack.candidates.length,2);
 assert.deepEqual(pack.candidates.map(x=>x.originId),
  ['LUX-MATH-Y9-INDICES-001','LUX-MATH-Y9-INDICES-004']);
 assert.equal(new Set(pack.candidates.map(x=>x.newCandidateVersionId)).size,2);
 assert.equal(new Set(pack.candidates.map(x=>x.concept)).size,2);
 for(const item of pack.candidates){
  assert.equal(item.provisionalDemand.includes('UNCALIBRATED'),true);
  assert.match(item.taughtScope,/NOT confirmed|needs exact taught evidence/);
  assert.equal(item.replacement.correctOptionId,item.originalCorrectOptionId);
  assert.deepEqual(item.replacement.options.map(x=>x.id),['A','B','C','D','E','F']);
  assert.equal(item.replacement.options.filter(x=>x.id!==item.originalCorrectOptionId).length,5);
  assert.ok(item.replacement.options.filter(x=>x.id!==item.originalCorrectOptionId)
     .every(o=>typeof o.wrongOperation==='string'&&o.wrongOperation.length>60));
  assert.ok(item.replacement.workedSolutionSteps.length>=3);
 }
});

test('source Q1 AO2 cube/strict range independently enumerates n=2,5; all six options',()=>{
 const item=pack.candidates.find(x=>x.paperQuestion===1);
 const A=n=>4**(n+2)*8**(3-n)/2**2;
 const exponent=n=>11-n;
 for(const n of [-1,0,2,3,5,8,11]){
   close(A(n),2**exponent(n),'source base change n='+n);
 }
 const legal=Array.from({length:101},(_,i)=>i-50).filter(n=>{
   const e=exponent(n);
   return e>5&&e<12&&e>=0&&e%3===0;
 });
 assert.deepEqual(legal,[2,5]);
 const correct=legal.reduce((a,b)=>a+b,0);
 assert.equal(correct,7);
 const withInclusiveTop=[...legal,11-12].reduce((a,b)=>a+b,0);
 const withBelow=[...legal,11-3].reduce((a,b)=>a+b,0);
 const squares=Array.from({length:101},(_,i)=>i-50).filter(n=>
   exponent(n)>5&&exponent(n)<12&&exponent(n)%2===0).reduce((a,b)=>a+b,0);
 const parameterDivisibility=Array.from({length:101},(_,i)=>i-50).filter(n=>
   exponent(n)>5&&exponent(n)<12&&n%3===0).reduce((a,b)=>a+b,0);
 const oneValid=5;
 const expected={A:withInclusiveTop,B:correct,C:withBelow,D:squares,E:parameterDivisibility,F:oneValid};
 assert.deepEqual(expected,{A:6,B:7,C:15,D:9,E:3,F:5});
 assert.equal(new Set(Object.values(expected)).size,6);
 for(const option of item.replacement.options)
   assert.equal(Number(option.latex),expected[option.id],'source Q1 '+option.id);
});

test('source Q4 AO2 general identity 2^(23−n), every option has an independently derived error ratio',()=>{
 const item=pack.candidates.find(x=>x.paperQuestion===4);
 const F=n=>4**(n+5)*8**(6-n)/2**5;
 for(const n of [-6,-3,0,1,5,13,19,26]){
   close(F(n),2**(23-n),'Q4 original n='+n);
   close(F(n+3)/F(n),1/8,'Q4 general shift at n='+n);
 }
 // Wrong ratio from changing only 4 factor, only 8 factor, and sign/step errors.
 const factorFour=4**3,factorEight=8**(-3);
 close(factorFour*factorEight,1/8);
 const expected={A:2**3,B:2**-1,C:1,D:factorFour*factorEight,E:factorFour,F:factorEight};
 assert.equal(new Set(Object.values(expected)).size,6);
 assert.deepEqual(expected,{A:8,B:0.5,C:1,D:0.125,E:64,F:1/512});
 for(const option of item.replacement.options)
   close(option.computedRatio,expected[option.id],'Q4 '+option.id);
 assert.equal(item.replacement.correctOptionId,'D');
 assert.equal(item.originalCorrectOptionId,'D');
});
