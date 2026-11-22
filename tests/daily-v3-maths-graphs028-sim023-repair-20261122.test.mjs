import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const draft=load('../qa-staging/math-v311-graphs-028-sim-023-wrong-option-repairs-20261122.json');
const canonicalSample=load('../qa-staging/math-v31-original-sample10.json');
const question=id=>draft.patches.find(p=>p.questionId===id);
const latexToNumber=s=>{
 const trimmed=s.trim();
 if(/^-?\d+$/.test(trimmed))return Number(trimmed);
 const fraction=/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(trimmed);
 assert.ok(fraction,'unable to evaluate question's exact A-F option '+trimmed);
 return (fraction[1]?-1:1)*Number(fraction[2])/Number(fraction[3]);
};
const approx=(actual,expected,context='')=>assert.ok(
 Math.abs(actual-expected)<1e-11*Math.max(1,Math.abs(actual),Math.abs(expected)),
 context+' actual '+actual+' expected '+expected);

test('only exact source-matched questions are proposed; school and grading remain blocked',()=>{
 assert.equal(draft.status,'QA_STAGING_NOT_ACADEMICALLY_APPROVED');
 assert.equal(draft.canonicalBankModified,false);
 assert.equal(draft.mathDailyEnabled,false);
 assert.equal(draft.studentCredit,false);
 assert.equal(draft.fullOriginal200BankDigestVerified,false);
 assert.equal(draft.teacherTaughtSubskillVerified,false);
 assert.equal(draft.independentGradeBenchmarkPassed,false);
 assert.equal(draft.externalReviewerSignoff,false);
 assert.equal(draft.devicePwaQAPassed,false);
 assert.equal(draft.originalSampleGithubBlobSha,'2638a3b0ea387189ef2a278e21803219164986a2');
 assert.deepEqual(draft.patches.map(x=>x.questionId),[
  'LUX-MATH-Y9-GRAPHS-028','LUX-MATH-Y9-SIMULTANEOUS-023']);
 for(const p of draft.patches){
  const s=canonicalSample.questions.find(q=>q.id===p.questionId);
  assert.ok(s);
  assert.equal(p.originalCorrectOptionId,s.correctOptionId);
  assert.equal(p.originalDifficultyTarget,s.difficultyTarget);
  assert.equal(p.originalStem,s.stem);
  assert.deepEqual(p.originalOptions,s.options);
  assert.deepEqual(p.originalWorkedSolutionSteps,s.workedSolutionSteps);
  assert.equal(p.replacement.stem,s.stem,'changed question stem requires independent new key QA');
  assert.equal(p.replacement.correctOptionId,s.correctOptionId);
  assert.deepEqual(p.replacement.options.map(o=>o.id),['A','B','C','D','E','F']);
  const unique=p.replacement.options.map(o=>latexToNumber(o.latex));
  assert.equal(new Set(unique).size,6);
  assert.equal(p.replacement.options.filter(o=>o.id!==s.correctOptionId).length,5);
  assert.equal(p.replacement.options.filter(o=>o.id!==s.correctOptionId&&
   typeof o.wrongOperation==='string'&&o.wrongOperation.length>65).length,5);
  assert.equal(p.fiveWrongMethodsAreMathematicallyReconstructable,true);
  assert.equal(p.fiveWrongMethodsAreVerifiedStudentMisconceptions,false);
  assert.match(p.release,/HOLD_FOR_TGS/);
 }
});

test('GRAPHS-028: independent source intersection, signed slope and all six wrong workings',()=>{
 const p=question('LUX-MATH-Y9-GRAPHS-028');
 // Source line 1 y=2(2x−3)=4x−6, line 2 y=−2(2x−13)=−4x+26.
 const px=(26+6)/(4+4),py=4*px-6;
 assert.equal(px,4); assert.equal(py,10);
 const gradientAB=(-2-2)/(6-1),wrongPositive=Math.abs(gradientAB);
 approx(gradientAB,-4/5,'segment gradient');
 const expected={
  A:px-py/wrongPositive,                 // use +4/5 instead of −4/5
  B:px-py/(-1/gradientAB),              // use positive perpendicular +5/4
  C:px-py/gradientAB,                   // exact parallel x-axis intercept
  D:py-gradientAB*px,                   // return y-intercept instead
  E:py/Math.abs(gradientAB),             // forget horizontal shift at P
  F:px-py/4                             // use gradient of line 1
 };
 assert.deepEqual(Object.keys(expected),['A','B','C','D','E','F']);
 for(const o of p.replacement.options){
   approx(latexToNumber(o.latex),expected[o.id],o.id);
   approx(o.computedValue,expected[o.id],o.id+' evidence');
 }
 approx(expected.C,16.5);
 assert.equal(p.replacement.correctOptionId,'C');
});

test('SIMULTANEOUS-023: original linear equations solved independent of source answer; 6 options',()=>{
 const p=question('LUX-MATH-Y9-SIMULTANEOUS-023');
 const det=4*(-4)-3*3,dx=25*(-4)-3*0,dy=4*0-25*3;
 const x=dx/det,y=dy/det;
 assert.equal(x,4);assert.equal(y,3);
 assert.equal(4*x+3*y,25);
 assert.equal(3*x-4*y,0);
 const expected={
  A:2*x*x+y,              // add instead of subtract
  B:x*x-y,                // omit coefficient 2
  C:2*x*y-y,              // mistake x^2 for xy
  D:2*x*x-y,              // correct
  E:(2*x)**2-y,           // square coefficient 2 as well
  F:2*x*x-2*y             // subtract 2y
 };
 for(const o of p.replacement.options){
  approx(latexToNumber(o.latex),expected[o.id],o.id);
  approx(o.computedValue,expected[o.id],o.id+' evidence');
 }
 assert.equal(expected.D,29);
 assert.equal(p.replacement.correctOptionId,'D');
 assert.match(p.difficultyReview,/not demonstrably Grade 8/);
});

test('anti-regression: three preexisting GRAPH-028 near-neighbours and SIM-023 half-answer are replaced in proposed options only',()=>{
 const G=question('LUX-MATH-Y9-GRAPHS-028'),S=question('LUX-MATH-Y9-SIMULTANEOUS-023');
 const graphOriginal=G.originalOptions.map(o=>o.latex);
 const graphProposal=G.replacement.options.map(o=>o.latex);
 assert.notDeepEqual(graphOriginal,graphProposal);
 assert.deepEqual(G.originalOptions,canonicalSample.questions.find(q=>q.id===G.questionId).options);
 assert.ok(graphOriginal.includes('\\frac{37}{2}'));
 assert.ok(!graphProposal.includes('\\frac{37}{2}'));
 assert.ok(!graphProposal.includes('\\frac{27}{2}'));
 assert.ok(!graphProposal.includes('\\frac{35}{2}'));
 const simOriginal=S.originalOptions.map(o=>o.latex);
 const simProposal=S.replacement.options.map(o=>o.latex);
 assert.ok(simOriginal.includes('\\frac{29}{2}'));
 assert.ok(!simProposal.includes('\\frac{29}{2}'));
 assert.equal(canonicalSample.status,'QA_ONLY_NOT_APPROVED');
});
