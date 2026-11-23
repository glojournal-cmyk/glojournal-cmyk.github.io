import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const pack=JSON.parse(readFileSync(new URL('../qa-staging/math-v312-rearranging001-004-inverse-model-reasoning-candidates-20261123.json',import.meta.url),'utf8'));
const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const letters=['A','B','C','D','E','F'];
function extractGroup(s,pos){
 assert.equal(s[pos],'{','TeX expected open brace');
 let depth=0;
 for(let i=pos;i<s.length;i++){
  if(s[i]==='{')depth++;
  if(s[i]==='}'&&--depth===0)return [s.slice(pos+1,i),i+1];
 }
 throw Error('TeX has no matching group '+s);
}
function expand(tex){
 const s=tex.replace(/\s/g,'').replace(/\\pi/g,'P');
 let out='';
 for(let i=0;i<s.length;){
  const isFraction=s.startsWith('\\frac',i)||s.startsWith('\\dfrac',i);
  if(isFraction){
   const pos=i+(s.startsWith('\\dfrac',i)?6:5);
   const [top,j]=extractGroup(s,pos),[bottom,k]=extractGroup(s,j);
   out+='(('+expand(top)+')/('+expand(bottom)+'))';i=k;
  }else if(s.startsWith('\\sqrt',i)){
   const [rad,j]=extractGroup(s,i+5);
   out+='sqrt('+expand(rad)+')';i=j;
  }else if(s[i]==='{'){
   const [inside,j]=extractGroup(s,i);
   out+='('+expand(inside)+')';i=j;
  }else out+=s[i++];
 }
 return out;
}
function evaluate(tex,vars={}){
 const expanded=expand(tex),raw=[...expanded.matchAll(/sqrt|\d+(?:\.\d+)?|[a-zA-Z]|[()+\-*/^]/g)].map(m=>m[0]);
 assert.equal(raw.join(''),expanded,'Unrecognized math expression '+tex);
 const ends=x=>/^\d|^[a-zA-Z]$|^\)$/.test(x);
 const starts=x=>/^\d|^[a-zA-Z]$|^\($|^sqrt$/.test(x);
 const tokens=[];
 for(const t of raw){
  if(tokens.length&&ends(tokens.at(-1))&&starts(t))tokens.push('*');
  tokens.push(t);
 }
 const input={P:Math.PI,...vars};
 let i=0;
 function atom(){
  const t=tokens[i++];
  if(t==='('){const v=add();assert.equal(tokens[i++],')');return v;}
  if(t==='sqrt'){assert.equal(tokens[i++],'(');const v=add();assert.equal(tokens[i++],')');return Math.sqrt(v);}
  if(/^\d/.test(t||''))return Number(t);
  if(/^[a-zA-Z]$/.test(t||'')){
   assert.ok(Object.hasOwn(input,t),'Missing algebra input '+t);return input[t];
  }
  throw Error('Unexpected algebra token '+t);
 }
 function unary(){
  if(tokens[i]==='-'){i++;return -unary();}
  if(tokens[i]==='+'){i++;return unary();}
  return atom();
 }
 function power(){
  const v=unary();
  if(tokens[i]==='^'){i++;return v**power();}
  return v;
 }
 function product(){
  let v=power();
  while(tokens[i]==='*'||tokens[i]==='/'){
   const op=tokens[i++],next=power();
   v=op==='*'?v*next:v/next;
  }
  return v;
 }
 function add(){
  let v=product();
  while(tokens[i]==='+'||tokens[i]==='-'){
   const op=tokens[i++],next=product();
   v=op==='+'?v+next:v-next;
  }
  return v;
 }
 const v=add();
 assert.equal(i,tokens.length,'Unparsed trailing algebra content '+tex);
 return v;
}
function optionStatement(option){
 const part=option.latex.split(',').map(s=>s.trim());
 assert.equal(part.length,2,'A-F needs formula and full output restriction '+option.latex);
 const m=part[0].match(/^([xr])=(.+)$/);
 assert.ok(m,'Not a rearrangement '+option.latex);
 return {letter:option.id,variable:m[1],expr:m[2],condition:part[1]};
}
function numericInterval(condition){
 const m=condition.replace(/\s/g,'').match(/^(.+?)(\\le|<)y(\\le|<)(\d+)$/);
 assert.ok(m,'Unsupported interval '+condition);
 return {lo:evaluate(m[1]),leftClosed:m[2]==='\\le',hi:Number(m[4]),rightClosed:m[3]==='\\le'};
}
function domainSimple(cond){
 const s=cond.replace(/\s/g,'');
 const m=s.match(/^y\\ne(-?\d+)$/);
 if(m)return {kind:'excluded',value:Number(m[1])};
 if(s==='y>0')return {kind:'positive',zero:false};
 if(s==='y\\ge0')return {kind:'positive',zero:true};
 const r=s.match(/^0<y\\le\\frac\{1\}\{\\sqrt\{(\d+)\}\}$/);
 if(r)return {kind:'positiveWithCeiling',bound:1/Math.sqrt(Number(r[1]))};
 throw Error('Unrecognized exact output domain '+cond);
}
const reason={
  1:{B:/minus sign of 7/i,C:/sign of the x coefficient/i,D:/Exclude the allowed x=0/i,E:/Include y=4/i,F:/Invert the final inverse formula/i},
  2:{A:/wrong sign/i,C:/Reverse the sign/i,D:/first observed output/i,E:/second observed output/i,F:/incorrect lower bound/i},
  3:{A:/omit the necessary squaring/i,B:/wrong sign/i,D:/Allow y=0/i,E:/reciprocal squared/i,F:/Silently impose x≥0/i},
  4:{A:/factor of 2/i,B:/wrong sign/i,C:/Exclude r=0/i,E:/Divide by 2πd squared/i,F:/omit the stronger minimum/i}
};
function prove(q){
 const n=Number(q.sourceId.slice(-3)),s=q.stem,options=q.options.map(optionStatement);
 assert.equal(options.length,6);
 const allowed=options.filter(o=>o.letter===q.correctOptionId);
 assert.equal(allowed.length,1);
 if(n===1){
  const m=s.match(/y=\\frac\{(\d+)x\+(\d+)\}\{x\+(\d+)\}/),bound=s.match(/x\\ge(\d+)/);
  assert.ok(m&&bound,'Missing source coefficients for fractional inverse');
  const [a,b,d]=m.slice(1).map(Number);
  assert.equal(Number(bound[1]),0);
  assert.ok(a*d>b&&b>0);
  const min=b/d,max=a;
  const xSamples=[0,.3,1,2,5,10,40];
  for(const o of options){
   const expectedRange={lo:min,leftClosed:o.letter!=='D',hi:max,rightClosed:o.letter==='E'};
   const declared=numericInterval(o.condition);
   assert.ok(near(declared.lo,expectedRange.lo));
   assert.equal(declared.leftClosed,expectedRange.leftClosed);
   assert.equal(declared.hi,expectedRange.hi);
   assert.equal(declared.rightClosed,expectedRange.rightClosed);
   for(const x of xSamples){
    const y=(a*x+b)/(x+d);
    const expected=o.letter==='B'?(d*y+b)/(a-y):
      o.letter==='C'?(d*y-b)/(y-a):
      o.letter==='F'?(a-y)/(d*y-b):
      (d*y-b)/(a-y);
    const answer=evaluate(o.expr,{y});
    if(o.letter==='F'&&near(d*y-b,0)){
     assert.ok(!Number.isFinite(answer),'Reciprocal should have a false pole at admitted x=0');
     continue;
    }
    assert.ok(near(answer,expected),'Q1 '+o.letter+' wrong path formula mismatch at x='+x);
    if(o.letter==='A')assert.ok(near(answer,x));
   }
  }
  assert.equal(q.correctOptionId,'A');
 }else if(n===2){
  const m=s.match(/y=\\frac\{px\+q\}\{x\+(\d+)\}/),pair=[...s.matchAll(/y=(\d+)\$ when \$x=(\d+)/g)];
  assert.ok(m,'Original calibration relation missing');
  assert.equal(pair.length,2,'Need two independent actual observations');
  const d=Number(m[1]),[y1,x1]=pair[0].slice(1).map(Number),[y2,x2]=pair[1].slice(1).map(Number);
  assert.notEqual(x1,x2);
  const p=(y2*(x2+d)-y1*(x1+d))/(x2-x1);
  const q0=y1*(x1+d)-p*x1;
  assert.ok(!near(p*d,q0),'Would be constant and noninvertible');
  const samples=[-10,-5,-3,-1,0,1,2,4,11];
  for(const o of options){
   if(o.letter==='F'){
    assert.ok(o.condition.replace(/\s/g,'')==='y>3');
   }else{
    const declared=domainSimple(o.condition);
    assert.equal(declared.kind,'excluded');
    const intended=o.letter==='D'?y1:o.letter==='E'?y2:p;
    assert.ok(near(declared.value,intended),'Q2 '+o.letter+' false excluded y origin');
   }
   for(const x of samples){
    if(near(x,-d))continue;
    const y=(p*x+q0)/(x+d);
    assert.ok(!near(y,p));
    const expected=o.letter==='A'?(d*y+q0)/(p-y):
      o.letter==='C'?(d*y-q0)/(y-p):
      (d*y-q0)/(p-y);
    const answer=evaluate(o.expr,{y});
    assert.ok(near(answer,expected),'Q2 '+o.letter+' incorrect formula');
    if(o.letter==='B')assert.ok(near(answer,x));
   }
  }
  assert.equal(q.correctOptionId,'B');
 }else if(n===3){
  const m=s.match(/y=\\frac\{\\sqrt\{x\+(\d+)\}\}\{x\+(\d+)\}/),
   start=s.match(/x>(-\d+)/);
  assert.ok(m&&start,'Cannot read radical rational source domain');
  const shift=Number(m[1]),denShift=Number(m[2]);
  assert.equal(shift,denShift);
  assert.equal(Number(start[1]),-shift);
  const probes=[-shift+.1,-shift+.5,-1,0,1,6,40].filter(x=>x>-shift);
  for(const o of options){
   const interval=domainSimple(o.condition);
   if(o.letter==='F'){
    assert.equal(interval.kind,'positiveWithCeiling');
    assert.ok(near(interval.bound,1/Math.sqrt(shift)));
   }else{
    assert.equal(interval.kind,'positive');
    assert.equal(interval.zero,o.letter==='D');
   }
   for(const x of probes){
    const y=Math.sqrt(x+shift)/(x+shift);
    assert.ok(y>0);
    const expected=o.letter==='A'?1/y-shift:
      o.letter==='B'?1/(y*y)+shift:
      o.letter==='E'?y*y-shift:
      1/(y*y)-shift;
    const answer=evaluate(o.expr,{y});
    assert.ok(near(answer,expected),'Q3 '+o.letter+' error route mismatch');
    if(o.letter==='C')assert.ok(near(answer,x));
   }
  }
  assert.equal(q.correctOptionId,'C');
 }else if(n===4){
  assert.match(s,/outer circle/);
  assert.match(s,/inner circle/);
  assert.match(s,/r\\ge0/);
  assert.match(s,/d>0/);
  assert.match(s,/A=\\pi\(\(r\+d\)\^2-r\^2\)/);
  for(const o of options){
   const cond=o.condition.replace(/\s/g,'');
   const target=o.letter==='C'?'A>\\pid^2':
     o.letter==='F'?'A\\ge0':'A\\ge\\pid^2';
   assert.equal(cond,target,'Q4 '+o.letter+' incorrectly labelled feasible area constraint');
   for(const d of [0.5,1,2,4]){
    for(const r of [0,.25,1,3,10]){
     const A=Math.PI*((r+d)**2-r*r);
     const expected=o.letter==='A'?(A-Math.PI*d*d)/(Math.PI*d):
       o.letter==='B'?(A+Math.PI*d*d)/(2*Math.PI*d):
       o.letter==='E'?(A-Math.PI*d*d)/(2*Math.PI*d*d):
       (A-Math.PI*d*d)/(2*Math.PI*d);
     const actual=evaluate(o.expr,{A,d});
     assert.ok(near(actual,expected),'Q4 '+o.letter+' wrong expansion/division route at '+JSON.stringify({r,d}));
     if(o.letter==='D')assert.ok(near(actual,r));
    }
   }
  }
  assert.equal(q.correctOptionId,'D');
 }else throw Error('Unknown case '+q.sourceId);
 for(const o of q.options.filter(x=>x.id!==q.correctOptionId)){
  assert.ok(typeof o.errorPath==='string'&&o.errorPath.length>=35);
  assert.match(o.errorPath,reason[n][o.id],'Error path does not describe the wrong mathematical step '+q.sourceId+' '+o.id);
 }
}
function audit(q){
 const source=bank.questions.find(o=>o.sourceId===q.sourceId);
 assert.ok(source&&source.dailyEligible===false);
 assert.notEqual(source.stem,q.stem);
 assert.equal(source.revisionId,q.replacesRevisionId);
 assert.notEqual(source.revisionId,q.revisionId);
 assert.equal(q.academicQA,'pending');
 for(const field of ['dailyEligible','masteryEligible','independentGradeCalibrated','independentStudentMisconceptionCertified'])
  assert.equal(q[field],false,'Forged academic credit '+q.sourceId+' '+field);
 assert.deepEqual(q.options.map(o=>o.id),letters);
 assert.equal(q.options.length,6);
 assert.equal(new Set(q.options.map(o=>o.latex)).size,6,'Duplicate A-F claim');
 assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===q.correctOptionId).latex);
 assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);
 for(const option of q.options)assert.match(mathsOptionHTML(option),/^<math xmlns=/);
 assert.equal(q.workedSolutionSteps.length,3);
 for(const step of q.workedSolutionSteps){
  assert.ok(step.length>=35);
  assert.ok(mathsRichTextHTML(step).length>0);
 }
 prove(q);
}
test('four distinct Changing Subject inverse-modelling candidates have source-derived keys, six exclusive A-F choices and causal wrong claims',()=>{
 assert.equal(pack.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
 assert.equal(pack.questions.length,4);
 assert.equal(bank.questions.length,200);
 assert.deepEqual(pack.questions.map(q=>q.sourceId.slice(-3)),['001','002','003','004']);
 for(const q of pack.questions)audit(q);
 assert.ok(bank.questions.every(q=>q.dailyEligible===false));
});
test('corrupt formula, false key, false domain, changed stem numbers or fabricated educational authorization must fail',()=>{
 const swaps={
  '001':['4x+7','5x+7'],
  '002':['y=4$ when $x=2','y=5$ when $x=2'],
  '003':['\\sqrt{x+3}','\\sqrt{x+4}'],
  '004':['(r+d)^2','(r+2d)^2']
 };
 for(const question of pack.questions){
  const copy=()=>JSON.parse(JSON.stringify(question));
  const wrongKey=copy();wrongKey.correctOptionId=question.correctOptionId==='A'?'E':'A';
  assert.throws(()=>audit(wrongKey));
  const wrongOption=copy();wrongOption.options.find(o=>o.id!==question.correctOptionId).latex='x=999,y>0';
  assert.throws(()=>audit(wrongOption));
  const falseRange=copy();falseRange.options.find(o=>o.id===question.correctOptionId).latex+=';y\\ne999';
  assert.throws(()=>audit(falseRange));
  const falseReason=copy();falseReason.options.find(o=>o.id!==question.correctOptionId).errorPath='Generic unsupported claim with no mathematical wrong step.';
  assert.throws(()=>audit(falseReason));
  const wrongSource=copy();const [oldText,newText]=swaps[question.sourceId.slice(-3)];
  assert.ok(wrongSource.stem.includes(oldText));
  wrongSource.stem=wrongSource.stem.replace(oldText,newText);
  assert.throws(()=>audit(wrongSource));
  const credit=copy();credit.dailyEligible=true;
  assert.throws(()=>audit(credit));
 }
});
