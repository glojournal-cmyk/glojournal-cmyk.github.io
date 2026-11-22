import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load=relative=>JSON.parse(readFileSync(new URL(relative,import.meta.url),'utf8'));
const pack=load('../qa-staging/math-v311-indices037-sim013-verified-options-20261122.json');
const sample=load('../qa-staging/math-v31-original-sample10.json');
const key=id=>sample.questions.find(q=>q.id===id);
const find=(id,scope)=>pack.entries.find(e=>e.questionId===id&&e.scope===scope);
const close=(a,b,label='')=>assert.ok(
 Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-11*Math.max(1,Math.abs(a),Math.abs(b)),
 label+': '+String(a)+' != '+String(b));
const fromLatex=s=>{
 if(/^-?\d+$/.test(s))return Number(s);
 const m=/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(s);
 assert.ok(m,'cannot parse exact rational choice '+s);
 return (m[1]?-1:1)*Number(m[2])/Number(m[3]);
};
test('source is pinned; all three candidate records are quarantined and full A–F',()=>{
 assert.equal(pack.status,'QA_STAGING_NOT_APPROVED');
 assert.equal(pack.baseSourceBlobSha,'2638a3b0ea387189ef2a278e21803219164986a2');
 for(const gate of ['canonicalOriginal200BankModified','appliedToLiveApp','mathDailyEnabled','studentCredit',
 'independentGradeCalibration','exactTgsSchoolTaughtSubskillConfirmed',
 'empiricalStudentErrorEvidence','independentAcademicReviewerSigned','actualPwaBrowserQA']){
  assert.equal(pack[gate],false,gate);
 }
 assert.equal(pack.entries.length,3);
 assert.equal(new Set(pack.entries.map(e=>e.candidateVersionId)).size,3);
 assert.equal(pack.entries.filter(e=>e.questionId==='LUX-MATH-Y9-SIMULTANEOUS-013').length,2);
 assert.match(pack.prohibition,/NEVER import/);
 assert.equal(pack.entries.filter(e=>e.scope==='PROPOSED_REPLACEMENT_FOR_GRADE_UPLIFT'&&
    e.importInstruction==='MUST_ASSIGN_NEW_CANONICAL_ID_AND_INDEPENDENT_SOURCE_SHA_BEFORE_IMPORT').length,1);
 assert.ok(pack.entries.every(e=>e.independentApproval==='NOT_GRANTED'));
 assert.deepEqual(pack.entries.map(e=>e.scope),
 ['ORIGINAL_STEM_OPTION_REPAIR','ORIGINAL_STEM_OPTION_REPAIR','PROPOSED_REPLACEMENT_FOR_GRADE_UPLIFT']);
 for(const entry of pack.entries){
  const original=key(entry.questionId);
  assert.ok(original,entry.questionId);
  assert.deepEqual(entry.original,original,'source contents must never silently change');
  assert.equal(entry.replacement.correctOptionId,original.correctOptionId);
  assert.deepEqual(entry.replacement.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(entry.replacement.options.length,6);
  assert.equal(entry.replacement.options.filter(o=>o.id!==original.correctOptionId).length,5);
  assert.ok(entry.replacement.options.filter(o=>o.id!==original.correctOptionId)
    .every(o=>typeof o.wrongOperation==='string'&&o.wrongOperation.length>=55));
  const numbers=entry.replacement.options.map(o=>fromLatex(o.latex));
  assert.equal(new Set(numbers).size,6,'must not duplicate options');
  for(const option of entry.replacement.options)close(fromLatex(option.latex),option.value,option.id);
  assert.equal(entry.replacement.options.find(o=>o.id===original.correctOptionId).wrongOperation,null);
  assert.match(entry.verification.formalQA,/PENDING|HOLD/);
  if(entry.scope==='ORIGINAL_STEM_OPTION_REPAIR')assert.equal(entry.replacement.stem,original.stem);
  else assert.notEqual(entry.replacement.stem,original.stem);
 }
});
test('INDICES-037: base-2 laws give n=2; independently calculate five distinct wrong methods',()=>{
 const e=find('LUX-MATH-Y9-INDICES-037','ORIGINAL_STEM_OPTION_REPAIR');
 assert.ok(e);
 const exponent=n=> (n+3)+4*(n-1)-3*(n-2);
 const originalLHS=n=>Math.sqrt(2**(2*n+6))*16**(n-1)/8**(n-2);
 const n=(9-5)/2;
 close(n,2);
 close(exponent(n),9);
 close(originalLHS(n),2**9);
 const mistakenNoSquareRootHalving=n=>(2*n+6)+4*(n-1)-3*(n-2);
 const wrongN=(9-8)/3;
 close(mistakenNoSquareRootHalving(wrongN),9);
 const expected={
  A:n*n-2*n,      // incorrect n²−2n
  B:4*4-4,        // forgot divide 2 after 2n=4
  C:n*n,          // omit subtraction
  D:n*n+n,        // flipped minus to plus
  E:wrongN**2-wrongN,  // ignored radical halving
  F:n*n-n
 };
 assert.deepEqual(Object.keys(expected),['A','B','C','D','E','F']);
 assert.equal(expected.F,2);
 for(const opt of e.replacement.options){
  close(fromLatex(opt.latex),expected[opt.id],opt.id+' maths independently derived');
  close(opt.value,expected[opt.id],opt.id+' metadata');
 }
 assert.equal(e.replacement.correctOptionId,'F');
 // Prior one-option staging exists separately; this is a complete A-F proposal, not a merge.
});
test('SIMULTANEOUS-013 exact original: k=4 only inconsistent value, five reconstructed wrong routes',()=>{
 const e=find('LUX-MATH-Y9-SIMULTANEOUS-013','ORIGINAL_STEM_OPTION_REPAIR');
 assert.ok(e);
 const originalFirst={x:2,y:3,c:7},second=k=>({x:k,y:6,c:15});
 const determinant=k=>originalFirst.x*second(k).y-originalFirst.y*second(k).x;
 const k=originalFirst.x*(6/3);
 close(k,4);
 close(determinant(k),0);
 assert.notEqual(originalFirst.c*(6/3),second(k).c,'parallel distinct, not coincident');
 const expected={
  A:2*(15/7),        // match variable coefficient to constants
  B:2+(6-3),         // additive error in scaling
  C:2*(6/3),         // correct proportionality
  D:-9,              // perpendicular condition: product of slopes = −1
  E:2,               // fail to scale x coefficient
  F:2*6              // treat 6, not 6/3, as factor
 };
 close((-2/3)*(-expected.D/6),-1,'perpendicular wrong-path check');
 for(const opt of e.replacement.options){
  close(fromLatex(opt.latex),expected[opt.id],opt.id+' original error path');
  if(opt.id!=='C')assert.notEqual(determinant(opt.value),0,
      'all proposed wrong answers must fail parallel condition: '+opt.id);
 }
 assert.equal(e.replacement.correctOptionId,'C');
 assert.match(e.verification.formalQA,/HOLD/);
});
test('SIMULTANEOUS-013 stronger alternative: solve variable coefficient ratio and show no coincident lines',()=>{
 const e=find('LUX-MATH-Y9-SIMULTANEOUS-013','PROPOSED_REPLACEMENT_FOR_GRADE_UPLIFT');
 assert.ok(e);
 const determinant=k=>2*(2*k-2)-3*(k+1);
 const k=(3+4)/(4-3); // 3k+3=4k−4 => k=7
 close(k,7);
 close(determinant(k),0);
 const factor=(k+1)/2;
 close(factor,4);
 assert.notEqual(7*factor,15,'same LHS factor must have different RHS');
 const expected={
  A:-1,            // mistakenly expand 2k−2 as 2k+2
  B:5,             // expand 2(2k−2) as 4k−2
  C:7,             // correct ratio
  D:2*(15/7)-1,    // equate coefficient ratio to constant ratio
  E:1/2,           // enforce perpendicular rather than parallel slopes
  F:-7             // do not reverse sign when dividing −k=−7
 };
 close(((-2/3)*(-(expected.E+1)/(2*expected.E-2))),-1,'incorrect perpendicular');
 close(3*(expected.A+1),2*(2*expected.A+2),'A faulty expansion');
 close(3*(expected.B+1),4*expected.B-2,'B faulty expansion');
 close((expected.D+1)/2,15/7,'D matching RHS');
 for(const o of e.replacement.options){
  close(fromLatex(o.latex),expected[o.id],o.id+' candidate error path');
  if(o.id!=='C')assert.notEqual(determinant(o.value),0,'wrong value must give unique intersection');
 }
 assert.equal(e.replacement.correctOptionId,'C');
 assert.equal(e.verification.canonicalStemChanged,true);
 assert.match(e.verification.formalQA,/HOLD/);
});
