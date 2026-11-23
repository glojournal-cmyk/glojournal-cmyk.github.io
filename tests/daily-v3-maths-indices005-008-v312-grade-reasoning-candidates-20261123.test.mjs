import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const candidates=JSON.parse(readFileSync(new URL('../qa-staging/math-v312-indices005-008-reasoning-replacement-candidates-20261123.json',import.meta.url),'utf8'));
const original=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const letters=['A','B','C','D','E','F'];
const num=x=>{
 assert.match(x,/^(0|[1-9]\d*)$/,'Candidate MCQ option must be exact nonnegative integer');
 return Number(x);
};
function matchNumbers(regex,source){
 const m=source.match(regex);
 assert.ok(m,'Cannot independently derive source parameters from '+source);
 return m.slice(1).map(Number);
}
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const product=xs=>xs.reduce((a,b)=>a*b,1);
const integers=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
function prove(q){
 const n=Number(q.sourceId.slice(-3)),s=q.stem;
 let actual=[],wrong={},reasonMatch={};
 if(n===5){
  assert.match(s,/sum/);
  assert.match(s,/not\*\* divisible by \$64\$/i);
  const [lo,hi]=matchNumbers(/integers \$(\d+)\\le n\\le(\d+)\$/,/,s);
  const [a,b,c]=[
    matchNumbers(/4\^\{n\+(\d+)\}/,s)[0],
    matchNumbers(/8\^\{(\d+)-n\}/,s)[0],
    matchNumbers(/2\^(\d+)/,s)[0]
  ];
  const exponent=k=>2*(k+a)+3*(b-k)-c;
  const power=k=>2**exponent(k);
  actual=integers(lo,hi).filter(k=>Number.isInteger(power(k))&&
   power(k)%16===0&&power(k)%64!==0);
  wrong={
    B:sum(integers(lo,hi).filter(k=>exponent(k)>4&&exponent(k)<6)),
    C:sum(integers(lo,hi).filter(k=>power(k)===16)),
    D:sum(integers(lo,hi).filter(k=>exponent(k)>=4&&exponent(k)<=6)),
    E:sum(integers(lo,hi).filter(k=>{
      const e=exponent(k)+c;return e===4||e===5;
    })),
    F:actual.length
  };
  reasonMatch={
    B:/exponent strictly greater than 4/,
    C:/equal to 16/,
    D:/Allow 64/,
    E:/Ignore the divisor 2\^5/,
    F:/Count the two/
  };
  assert.deepEqual(actual,[3,4]);
  return {correct:sum(actual),wrong,reasonMatch};
 }
 if(n===6){
  assert.match(s,/product/);
  const [lo,hi]=matchNumbers(/integers \$(\d+)\\le n\\le(\d+)\$/,/,s);
  const [a,b]=[
    matchNumbers(/8\^\{n-(\d+)\}/,s)[0],
    matchNumbers(/4\^\{n-(\d+)\}/,s)[0]
  ];
  const [boundLo,boundHi]=matchNumbers(/2\^(\d+)<X\(n\)\\le2\^(\d+)/,s);
  const exponent=k=>3*(k-a)-2*(k-b);
  const allowed=k=>exponent(k)>boundLo&&exponent(k)<=boundHi;
  actual=integers(lo,hi).filter(k=>allowed(k)&&exponent(k)%2===0);
  wrong={
    A:sum(actual),
    B:product(integers(lo,hi).filter(allowed)),
    D:product(integers(lo,hi).filter(k=>exponent(k)>=boundLo&&
      exponent(k)<=boundHi&&exponent(k)%2===0)),
    E:product(integers(lo,hi).filter(k=>allowed(k)&&Math.abs(exponent(k)%2)===1)),
    F:product(integers(lo,hi).filter(k=>{
      const wrongly=3*(k-a)-(k-b);
      return wrongly>boundLo&&wrongly<=boundHi&&wrongly%2===0;
    }))
  };
  reasonMatch={
    A:/add them instead of multiplying/,
    B:/Ignore the perfect-square/,
    D:/Ignore the strict lower bound/,
    E:/odd powers/,
    F:/Convert 4\^\(n-4\) incorrectly/
  };
  assert.deepEqual(actual,[2,4]);
  return {correct:product(actual),wrong,reasonMatch};
 }
 if(n===7){
  assert.match(s,/perfect cube/);
  assert.match(s,/perfect sixth power/);
  const [lo,hi]=matchNumbers(/integers \$(\d+)\\le n\\le(\d+)\$/,/,s);
  const [a,b]=[
    matchNumbers(/2\^\{n\+(\d+)\}/,s)[0],
    matchNumbers(/3\^\{2n\+(\d+)\}/,s)[0]
  ];
  const cube=k=>(k+a)%3===0&&(2*k+b)%3===0;
  const sixth=k=>(k+a)%6===0&&(2*k+b)%6===0;
  const cubes=integers(lo,hi).filter(cube);
  const sixthPowers=cubes.filter(sixth);
  actual=cubes.filter(k=>!sixth(k));
  wrong={
    A:sum(cubes),C:sum(sixthPowers),D:actual.length,
    E:product(actual),F:sum(integers(lo,hi).filter(k=>k%2===1))
  };
  reasonMatch={
    A:/forget to exclude/,
    C:/Select the sixth powers/,
    D:/count instead of the sum/,
    E:/multiply these values/,
    F:/every odd n/
  };
  assert.deepEqual(actual,[5,11,17]);
  return {correct:sum(actual),wrong,reasonMatch};
 }
 if(n===8){
  assert.match(s,/greatest possible/);
  const [power]=matchNumbers(/4\^\{(\d+)\}/,s);
  assert.match(s,/positive integers/);
  assert.match(s,/p\\ge q/);
  const target=2*power;
  const feasible=integers(1,target).map(q=>({q,p:target-3*q}))
    .filter(z=>z.p>=z.q&&z.p>0);
  const best=feasible.reduce((best,z)=>z.p*z.q>best.p*best.q?z:best,feasible[0]);
  actual=[best.p,best.q];
  const incorrect4=integers(1,target).map(q=>({q,p:target-2*q}))
    .filter(z=>z.p>=z.q&&z.p>0).map(z=>z.p*z.q);
  wrong={
    A:feasible.find(z=>z.p===z.q).p**2,
    B:feasible.find(z=>z.q===1).p,
    C:Math.max(...incorrect4),
    E:(target/2)**2,
    F:best.p+best.q
  };
  reasonMatch={
    A:/Assume p=q/,
    B:/Maximise p alone/,
    C:/Treat 8 as 4/,
    E:/Treat 8 as 2/,
    F:/report p\+q/
  };
  assert.deepEqual(actual,[12,4]);
  return {correct:best.p*best.q,wrong,reasonMatch};
 }
 throw Error('Unknown replacement ID '+q.sourceId);
}
function check(q){
 assert.equal(q.academicQA,'pending');
 assert.equal(q.dailyEligible,false);
 assert.equal(q.masteryEligible,false);
 assert.equal(q.independentGradeCalibrated,false);
 assert.equal(q.teacherTaughtConfirmed,false);
 assert.equal(q.independentStudentMisconceptionCertified,false);
 assert.equal(q.options.length,6);
 assert.deepEqual(q.options.map(o=>o.id),letters);
 assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
 const old=original.questions.find(o=>o.sourceId===q.sourceId);
 assert.ok(old&&old.dailyEligible===false,'Original staging source must exist but remain blocked');
 assert.notEqual(q.stem,old.stem,'Candidate must be a genuine question rewrite');
 assert.notEqual(q.revisionId,old.revisionId);
 const proof=prove(q);
 assert.equal(num(q.correctAnswerLatex),proof.correct,q.sourceId+' wrong correct answer');
 assert.equal(num(q.options.find(o=>o.id===q.correctOptionId).latex),proof.correct);
 const other=q.options.filter(o=>o.id!==q.correctOptionId);
 assert.equal(other.length,5);
 for(const o of other){
  assert.ok(proof.reasonMatch[o.id],
    q.sourceId+' unexpected alternative '+o.id);
  assert.match(o.errorPath,proof.reasonMatch[o.id],q.sourceId+' '+o.id+' ambiguous misconception');
  assert.equal(num(o.latex),proof.wrong[o.id],
    q.sourceId+' '+o.id+' incorrect wrong-step calculation');
  assert.notEqual(num(o.latex),proof.correct);
 }
 assert.match(mathsRichTextHTML(q.stem),/Math\/MathML/);
 for(const o of q.options)assert.match(mathsOptionHTML(o),/Math\/MathML/);
 assert.ok(q.workedSolutionSteps.length>=3);
 for(const step of q.workedSolutionSteps){
  assert.ok(step.length>=35);
  assert.match(mathsRichTextHTML(step),/Math\/MathML/);
 }
}
test('four distinct replacement question types each have independently enumerated answers and five causal wrong paths',()=>{
 assert.equal(candidates.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
 assert.equal(candidates.questions.length,4);
 assert.deepEqual(candidates.questions.map(q=>Number(q.sourceId.slice(-3))),[5,6,7,8]);
 for(const q of candidates.questions)check(q);
 assert.equal(original.questions.filter(q=>q.dailyEligible===true).length,0);
});
test('adversarial incorrect keys, changed wrong choices, and forged educational approvals fail closed',()=>{
 for(const originalCandidate of candidates.questions){
  const clone=()=>JSON.parse(JSON.stringify(originalCandidate));
  const incorrectKey=clone();incorrectKey.correctAnswerLatex='999';
  assert.throws(()=>check(incorrectKey));
  const wrongChoice=clone();
  const wrong=wrongChoice.options.find(o=>o.id!==wrongChoice.correctOptionId);
  wrong.latex='999';
  assert.throws(()=>check(wrongChoice));
  const forged=clone();forged.dailyEligible=true;
  assert.throws(()=>check(forged));
 }
});
