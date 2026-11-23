import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const pack=JSON.parse(readFileSync(new URL('../qa-staging/math-v312-rearranging018-024-fixedpoint-quadratic-domain-candidates-20261123.json',import.meta.url),'utf8'));
const source=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const letters=['A','B','C','D','E','F'];

function bracket(s,pos){
 assert.equal(s[pos],'{','Expected opening TeX brace '+s);
 let depth=0;
 for(let i=pos;i<s.length;i++){
  if(s[i]==='{')depth++;
  else if(s[i]==='}'&&--depth===0)return [s.slice(pos+1,i),i+1];
 }
 throw Error('Unclosed TeX group '+s);
}
function expand(tex){
 const s=tex.replace(/\s/g,'');let result='';
 for(let i=0;i<s.length;){
  const frac=s.startsWith('\\frac',i)||s.startsWith('\\dfrac',i);
  if(frac){
   const pos=i+(s.startsWith('\\dfrac',i)?6:5);
   const [n,k]=bracket(s,pos),[d,j]=bracket(s,k);
   result+='(('+expand(n)+')/('+expand(d)+'))';i=j;
  }else if(s.startsWith('\\sqrt',i)){
   const [inside,j]=bracket(s,i+5);
   result+='sqrt('+expand(inside)+')';i=j;
  }else if(s[i]==='{'){
   const [inside,j]=bracket(s,i);
   result+='('+expand(inside)+')';i=j;
  }else result+=s[i++];
 }
 return result;
}
function valueOf(tex,vars){
 const expanded=expand(tex);
 const words=[...expanded.matchAll(/sqrt|\d+(?:\.\d+)?|[a-z]|[()+\-*/^]/g)].map(m=>m[0]);
 assert.equal(words.join(''),expanded,'Unparsed formula syntax '+expanded);
 const ends=t=>/^\d|^[a-z]$|^\)$/.test(t);
 const begins=t=>/^\d|^[a-z]$|^\($|^sqrt$/.test(t);
 const tokens=[];
 for(const t of words){
  if(tokens.length&&ends(tokens.at(-1))&&begins(t))tokens.push('*');
  tokens.push(t);
 }
 let i=0;
 function atom(){
  const t=tokens[i++];
  if(t==='('){const n=add();assert.equal(tokens[i++],')');return n;}
  if(t==='sqrt'){assert.equal(tokens[i++],'(');const n=add();assert.equal(tokens[i++],')');return Math.sqrt(n);}
  if(/^\d/.test(t||''))return Number(t);
  if(/^[a-z]$/.test(t||'')){assert.ok(Object.hasOwn(vars,t),'Variable missing '+t);return vars[t];}
  throw Error('Invalid formula atom '+t);
 }
 function unary(){
  if(tokens[i]==='-'){i++;return -unary();}
  if(tokens[i]==='+'){i++;return unary();}
  return atom();
 }
 function power(){
  const a=unary();
  if(tokens[i]==='^'){i++;return a**power();}
  return a;
 }
 function mul(){
  let a=power();
  while(tokens[i]==='*'||tokens[i]==='/'){
   const op=tokens[i++],b=power();
   a=op==='*'?a*b:a/b;
  }
  return a;
 }
 function add(){
  let a=mul();
  while(tokens[i]==='+'||tokens[i]==='-'){
   const op=tokens[i++],b=mul();
   a=op==='+'?a+b:a-b;
  }
  return a;
 }
 const result=add();
 assert.equal(i,tokens.length,'Extra tokens after expression '+tex);
 return result;
}
function q18Source(stem){
 const m=stem.match(/y=\\dfrac\{(\d+)x\+(\d+)\}\{x\+(\d+)\}/);
 const range=stem.match(/x\\ge(\d+)/);
 assert.ok(m&&range,'Cannot recover Q18 coefficients and original x-domain');
 const [a,b,d]=m.slice(1).map(Number),xMin=Number(range[1]);
 assert.ok(a*d!==b,'Must not have a degenerate constant transformation');
 const disc=(a-d)**2+4*b;
 assert.ok(disc>0,'No two real fixed points');
 const positive=((a-d)+Math.sqrt(disc))/2;
 const negative=((a-d)-Math.sqrt(disc))/2;
 return {a,b,d,xMin,positive,negative,disc};
}
function q18Pair(latex){
 const m=latex.match(/^x=(.+);x_\{\\mathrm\{fixed\}\}=(.+)$/);
 assert.ok(m,'Two-part inverse and fixed point required '+latex);
 return {inverse:m[1],fixed:m[2]};
}
function q18(q){
 const S=q18Source(q.stem);
 const expectedInverse=y=>(S.d*y-S.b)/(S.a-y);
 const xSamples=[0,0.25,1,2,4,8,25,100].filter(x=>x>=S.xMin);
 assert.ok(S.positive>=S.xMin&&S.negative<S.xMin,
  'The nonnegative fixed-point branch must be unique');
 const calculated=[];
 for(const option of q.options){
  const {inverse,fixed}=q18Pair(option.latex);
  const xFixed=valueOf(fixed,{});
  const values=[];
  for(const x of xSamples){
   const y=(S.a*x+S.b)/(x+S.d);
   const value=valueOf(inverse,{y});
   assert.ok(Number.isFinite(value));
   values.push({x,y,value});
  }
  const fractionCorrect=values.every(v=>near(v.value,v.x));
  const fixedIsValid=xFixed>=S.xMin&&near((S.a*xFixed+S.b)/(xFixed+S.d),xFixed);
  const expectedFormula=option.id==='B'
    ?y=>(S.d*y+S.b)/(S.a-y)
    :option.id==='C'
    ?y=>(S.a-y)/(S.d*y-S.b)
    :expectedInverse;
  for(const probe of values)assert.ok(near(probe.value,expectedFormula(probe.y)),
    q.sourceId+' '+option.id+' formula does not reflect its alleged error');
  const wrongFixed={
   A:S.negative,
   B:S.positive,
   C:S.positive,
   D:S.positive,
   E: (-(S.a-S.d)+Math.sqrt((S.a-S.d)**2+4*S.b))/2,
   F: ((S.a-S.d)+Math.sqrt((S.a-S.d)**2+4*(S.b-1)))/2
  };
  assert.ok(near(xFixed,wrongFixed[option.id]),
   'Wrong fixed-point option cannot be derived from the described mistaken quadratic '+option.id);
  const expected={
   A:/negative root/i,
   B:/wrong sign/i,
   C:/Reverse numerator and denominator/i,
   E:/linear coefficient/i,
   F:/constant 5 by 4/i
  };
  if(option.id!=='D'){
   assert.match(option.errorPath,expected[option.id]);
   assert.ok(!fractionCorrect||!fixedIsValid,
     'Wrong option is unexpectedly a fully true inverse/fixed-point claim '+option.id);
  }
  calculated.push({id:option.id,correct:fractionCorrect&&fixedIsValid});
 }
 assert.deepEqual(calculated.filter(x=>x.correct).map(x=>x.id),['D']);
 assert.ok(near((S.a*S.positive+S.b)/(S.positive+S.d),S.positive));
 assert.equal(q.correctOptionId,'D');
}
function q24Source(stem){
 const m=stem.match(/s=ut\+\\dfrac\{(\d+)\}\{(\d+)\}at\^2/);
 assert.ok(m,'Cannot recover Q24 source equation');
 assert.match(stem,/u>0/);
 assert.match(stem,/a>0/);
 assert.match(stem,/t\\ge0/);
 const coefficient=Number(m[1])/Number(m[2]);
 assert.ok(coefficient>0,'Quadratic coefficient must be positive');
 return {coefficient};
}
function q24Pair(latex){
 const m=latex.match(/^t=(.+),(s\\ge0|s>0)$/);
 assert.ok(m,'Q24 expression and exact range must be stated '+latex);
 return {expression:m[1],zeroIncluded:m[2]==='s\\ge0'};
}
function q24(q){
 const {coefficient:c}=q24Source(q.stem);
 const calculated=[];
 for(const option of q.options){
  const {expression,zeroIncluded}=q24Pair(option.latex);
  let agrees=true;
  for(const {u,a} of [{u:2,a:3},{u:5,a:2},{u:1.5,a:.8}]){
   for(const time of [0,.25,1,3,10]){
    const s=u*time+c*a*time**2;
    const formulaValue=valueOf(expression,{u,a,s});
    const disc=u*u+4*c*a*s;
    const denom=2*c*a;
    const correct=(-u+Math.sqrt(disc))/denom;
    assert.ok(near(correct,time),'Independent quadratic inversion from source failed');
    const expected= option.id==='A'?(-u-Math.sqrt(disc))/denom:
      option.id==='B'?(u+Math.sqrt(disc))/denom:
      option.id==='C'?(-u+Math.sqrt(u*u+2*c*a*s))/denom:
      option.id==='D'?(-u+Math.sqrt(disc))/(2*denom):correct;
    assert.ok(near(formulaValue,expected),
      q.sourceId+' '+option.id+' wrong operation not reproduced at u,a,time '+[u,a,time]);
    if(!near(formulaValue,time))agrees=false;
   }
  }
  const valid=agrees&&zeroIncluded;
  const error={A:/negative quadratic-formula root/i,B:/sign of the negative u term/i,
    C:/Omit the factor of 2/i,D:/factor of 2 in the final denominator/i,
    F:/Exclude s=0/i};
  if(option.id!=='E'){
   assert.match(option.errorPath,error[option.id]);
   assert.equal(valid,false,'Incorrect option is entirely correct '+option.id);
  }
  calculated.push({id:option.id,correct:valid});
 }
 assert.deepEqual(calculated.filter(x=>x.correct).map(x=>x.id),['E']);
 assert.equal(q.correctOptionId,'E');
}
function audit(q){
 const old=source.questions.find(z=>z.sourceId===q.sourceId);
 assert.ok(old&&old.dailyEligible===false,'Original blocked source absent');
 assert.notEqual(old.stem,q.stem);
 assert.notEqual(old.revisionId,q.revisionId);
 assert.equal(q.academicQA,'pending');
 for(const prop of ['dailyEligible','masteryEligible','independentGradeCalibrated',
  'independentStudentMisconceptionCertified'])assert.equal(q[prop],false);
 assert.equal(q.options.length,6);
 assert.deepEqual(q.options.map(x=>x.id),letters);
 assert.equal(new Set(q.options.map(x=>x.latex)).size,6,'Duplicate option statement');
 assert.equal(q.correctAnswerLatex,q.options.find(x=>x.id===q.correctOptionId).latex);
 assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);
 for(const opt of q.options){
  assert.match(mathsOptionHTML(opt),/^<math xmlns=/);
  if(opt.id!==q.correctOptionId)assert.ok(opt.errorPath?.length>=35);
 }
 assert.equal(q.workedSolutionSteps.length,3);
 for(const line of q.workedSolutionSteps)assert.ok(mathsRichTextHTML(line).length>0);
 if(q.sourceId.endsWith('-018'))q18(q);
 else if(q.sourceId.endsWith('-024'))q24(q);
 else throw Error('Unexpected candidate source '+q.sourceId);
}
test('Q018 Möbius inverse and quadratic fixed point, Q024 physical-domain quadratic inverse: 12 A-F options independently checked',()=>{
 assert.equal(pack.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
 assert.equal(source.questions.length,200);
 assert.equal(source.questions.filter(q=>q.dailyEligible===true).length,0);
 assert.equal(pack.questions.length,2);
 assert.deepEqual(pack.questions.map(q=>q.sourceId.slice(-3)),['018','024']);
 for(const q of pack.questions)audit(q);
});
test('source coefficient changes, incorrect keys, false domain exclusions and fake student-credit approvals are rejected',()=>{
 const mutate={
  '018':['4x+5','5x+5'],
  '024':['\\dfrac{1}{2}at^2','\\dfrac{1}{3}at^2']
 };
 for(const q of pack.questions){
  const clone=()=>JSON.parse(JSON.stringify(q));
  const wrongKey=clone();wrongKey.correctOptionId=q.correctOptionId==='D'?'E':'D';
  assert.throws(()=>audit(wrongKey));
  const wrongOption=clone();
  wrongOption.options.find(o=>o.id!==q.correctOptionId).latex='t=999,s>0';
  assert.throws(()=>audit(wrongOption));
  const badReason=clone();
  badReason.options.find(o=>o.id!==q.correctOptionId).errorPath='Invented misconception that does not follow the arithmetic and has no plausible source step.';
  assert.throws(()=>audit(badReason));
  const alteredSource=clone();
  const [before,after]=mutate[q.sourceId.slice(-3)];
  assert.ok(alteredSource.stem.includes(before));
  alteredSource.stem=alteredSource.stem.replace(before,after);
  assert.throws(()=>audit(alteredSource));
  const forged=clone();forged.dailyEligible=true;
  assert.throws(()=>audit(forged));
 }
});
