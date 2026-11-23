import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const pack=JSON.parse(readFileSync(new URL('../qa-staging/math-v312-rearranging019-022-composite-reciprocal-reasoning-candidates-20261123.json',import.meta.url),'utf8'));
const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const letters=['A','B','C','D','E','F'];
function brace(s,i){
 assert.equal(s[i],'{','missing group');
 let depth=0;
 for(let k=i;k<s.length;k++){
  if(s[k]==='{')depth++;
  else if(s[k]==='}'&&--depth===0)return [s.slice(i+1,k),k+1];
 }
 throw Error('Missing closing TeX brace');
}
function expand(tex){
 const s=tex.replace(/\s/g,'');let o='';
 for(let i=0;i<s.length;){
  if(s.startsWith('\\frac',i)||s.startsWith('\\dfrac',i)){
   const [a,k]=brace(s,i+(s.startsWith('\\dfrac',i)?6:5)),[b,j]=brace(s,k);
   o+='(('+expand(a)+')/('+expand(b)+'))';i=j;
  }else if(s.startsWith('\\sqrt',i)){
   const [inside,j]=brace(s,i+5);o+='sqrt('+expand(inside)+')';i=j;
  }else if(s[i]==='{'){
   const [inside,j]=brace(s,i);o+='('+expand(inside)+')';i=j;
  }else o+=s[i++];
 }
 return o;
}
function evalTex(tex,variables={}){
 const exp=expand(tex),tokens0=[...exp.matchAll(/sqrt|\d+(?:\.\d+)?|[a-z]|[()+\-*/^]/g)].map(m=>m[0]);
 assert.equal(tokens0.join(''),exp,'unsupported TeX: '+tex);
 const ends=t=>/^\d|^[a-z]$|^\)$/.test(t);
 const starts=t=>/^\d|^[a-z]$|^\($|^sqrt$/.test(t);
 const tokens=[];
 for(let k=0;k<tokens0.length;k++){
  if(k&&ends(tokens0[k-1])&&starts(tokens0[k]))tokens.push('*');
  tokens.push(tokens0[k]);
 }
 let i=0;
 function atom(){
  const t=tokens[i++];
  if(t==='('){const v=sum();assert.equal(tokens[i++],')');return v;}
  if(t==='sqrt'){assert.equal(tokens[i++],'(');const v=sum();assert.equal(tokens[i++],')');return Math.sqrt(v);}
  if(/^\d/.test(t||''))return Number(t);
  if(/^[a-z]$/.test(t||'')){assert.ok(Object.hasOwn(variables,t),'missing variable '+t);return variables[t];}
  throw Error('Bad token '+t);
 }
 function unary(){
  if(tokens[i]==='-'){i++;return -unary();}
  if(tokens[i]==='+'){i++;return unary();}
  return atom();
 }
 function power(){
  const v=unary();if(tokens[i]==='^'){i++;return v**power();}return v;
 }
 function product(){
  let v=power();
  while(tokens[i]==='*'||tokens[i]==='/'){
   const op=tokens[i++],next=power();v=op==='*'?v*next:v/next;
  }
  return v;
 }
 function sum(){
  let v=product();
  while(tokens[i]==='+'||tokens[i]==='-'){
   const op=tokens[i++],next=product();v=op==='+'?v+next:v-next;
  }
  return v;
 }
 const v=sum();assert.equal(i,tokens.length,'unexpected residual algebra');
 return v;
}
function splitOption(q,o){
 const n=Number(q.sourceId.slice(-3)),s=o.latex;
 if(n===21){
  const m=s.match(/^k=(.+);x=(.+),(.+)$/);
  assert.ok(m,'parameter, inverse and domain must all appear '+s);
  return {k:evalTex(m[1]),expr:m[2],condition:m[3]};
 }
 const m=s.match(/^x=(.+),(.+)$/);
 assert.ok(m,'inverse and domain must both appear '+s);
 return {expr:m[1],condition:m[2]};
}
function range(s,variable){
 const re=new RegExp('^(.+?)(\\\\le|<)'+variable+'(\\\\le|<)(.+)$');
 const m=s.replace(/\s/g,'').match(re);
 assert.ok(m,'missing complete interval '+s);
 return {low:evalTex(m[1]),lowClosed:m[2]==='\\le',high:evalTex(m[4]),highClosed:m[3]==='\\le'};
}
function assertInterval(o,expected){
 assert.ok(near(o.low,expected.low));
 assert.equal(o.lowClosed,expected.lowClosed);
 assert.ok(near(o.high,expected.high));
 assert.equal(o.highClosed,expected.highClosed);
}
function source19(q){
 const s=q.stem,m=s.match(/\\frac\{1\}\{y\}=(\d+)\+\\frac\{(\d+)\}\{(\d+)x\+(\d+)\}/);
 assert.ok(m,'Q19 reciprocal source not parseable');
 const [k,n,a,d]=m.slice(1).map(Number),minMatch=s.match(/x\\ge(\d+)/);
 assert.ok(minMatch&&Number(minMatch[1])===0&&k===1);
 const threshold=s.match(/y\\ge\\frac\{(\d+)\}\{(\d+)\}/);
 assert.ok(threshold,'Q19 must declare extra inequality');
 const thresholdValue=Number(threshold[1])/Number(threshold[2]);
 const y=x=>1/(k+n/(a*x+d));
 const max=1/k,min=y(0),inv=y=>((n*y/(1-k*y))-d)/a;
 assert.ok(thresholdValue>min&&thresholdValue<max);
 const xAtThreshold=inv(thresholdValue);
 assert.ok(xAtThreshold>=0&&near(y(xAtThreshold),thresholdValue));
 return {k,n,a,d,y,min,max,thresholdValue,inv,xAtThreshold};
}
function check19(q){
 const s=source19(q),values=[s.xAtThreshold,s.xAtThreshold+1,5,10,100].filter(x=>x>=s.xAtThreshold);
 for(const o of q.options){
  const v=splitOption(q,o),R=range(v.condition,'y');
  assertInterval(R,{low:o.id==='A'?s.min:s.thresholdValue,lowClosed:o.id!=='B',high:s.max,highClosed:o.id==='E'});
  for(const x of values){
   const y=s.y(x),actual=evalTex(v.expr,{y});
   const expected=o.id==='C'?2*(2*y+1)/(3*(1-y)):
    o.id==='D'?2*(2*y-1)/(3*(y-1)):s.inv(y);
   assert.ok(near(actual,expected),'Q19 '+o.id+' source-derived error calculation');
   if(o.id==='F')assert.ok(near(actual,x),'Q19 source inverse mismatch');
  }
 }
 assert.equal(q.correctOptionId,'F');
}
function source20(q){
 const m=q.stem.match(/f\(t\)=\\frac\{(\d+)t\+(\d+)\}\{(\d+)t\+(\d+)\}/);
 assert.ok(m&&q.stem.includes('z=f(f(x))'),'Q20 genuine composition source required');
 const [a,b,c,d]=m.slice(1).map(Number),f=t=>(a*t+b)/(c*t+d);
 assert.ok(a*d-b*c>0&&c>0&&d>0);
 const composite=x=>f(f(x)),min=composite(0),max=f(a/c);
 assert.ok(max>min);
 const inverse=z=>{
  // First invert f, then invert it again to undo f(f(x)).
  const invertF=y=>(d*y-b)/(a-c*y);
  return invertF(invertF(z));
 };
 return {a,b,c,d,f,composite,min,max,inverse};
}
function check20(q){
 const s=source20(q),probes=[0,1,2,5,10,100];
 for(const o of q.options){
  const v=splitOption(q,o),R=range(v.condition,'z');
  assertInterval(R,{low:s.min,lowClosed:o.id!=='C',high:s.max,highClosed:o.id==='D'});
  for(const x of probes){
   const z=s.composite(x),actual=evalTex(v.expr,{z});
   const expected=o.id==='A'?(105*z+39)/(40-104*z):
    o.id==='B'?(105*z-39)/(104*z-40):
    o.id==='F'?(40-104*z)/(105*z-39):s.inverse(z);
   if(o.id==='F'&&x===0){
    assert.ok(!Number.isFinite(actual),'Q20 reciprocal inverse must fail at valid x=0');
    continue;
   }
   assert.ok(near(actual,expected),'Q20 '+o.id+' wrong-operation value mismatch '+x);
   if(o.id==='E')assert.ok(near(actual,x),'Q20 full two-stage inversion fails '+x);
  }
 }
 assert.equal(q.correctOptionId,'E');
}
function source21(q){
 const m=q.stem.match(/\\frac\{1\}\{y\}=\\frac\{(\d+)\}\{(\d+)x\+(\d+)\}\+k/);
 assert.ok(m,'Q21 source is not a parameterised reciprocal');
 const [numer,a,d]=m.slice(1).map(Number),maxm=q.stem.match(/approaches \$\\frac\{(\d+)\}\{(\d+)\}\$/);
 assert.ok(maxm&&q.stem.includes('k>0')&&q.stem.includes('x\\ge0'));
 const max=Number(maxm[1])/Number(maxm[2]),k=1/max;
 const y=x=>1/(k+numer/(a*x+d));
 const min=y(0);
 const inverse=y=>((numer*y/(1-k*y))-d)/a;
 assert.ok(near(k,2)&&near(min,1/3));
 return {numer,a,d,k,min,max,y,inverse};
}
function check21(q){
 const s=source21(q),samples=[0,1,2,5,20,100];
 for(const o of q.options){
  const v=splitOption(q,o),R=range(v.condition,'y');
  assert.ok(near(v.k,o.id==='C'?s.max:s.k),'Wrong inferred parameter must match displayed operation');
  assertInterval(R,{low:s.min,lowClosed:o.id!=='D',high:s.max,highClosed:o.id==='E'});
  for(const x of samples){
   const y=s.y(x),actual=evalTex(v.expr,{y});
   const expected=o.id==='B'?4*(3*y+1)/(5*(1-2*y)):
    o.id==='F'?4*(3*y-1)/(5*(2*y-1)):s.inverse(y);
   assert.ok(near(actual,expected),'Q21 '+o.id+' param/inverse wrong route mismatch');
   if(o.id==='A')assert.ok(near(actual,x));
  }
 }
 assert.equal(q.correctOptionId,'A');
}
function source22(q){
 const m=q.stem.match(/\\frac\{1\}\{y\}=(\d+)\+\\frac\{(\d+)\}\{x\^2\+(\d+)\}/),b=q.stem.match(/x\\ge(\d+)/);
 assert.ok(m&&b,'Q22 source quadratic reciprocal is missing');
 const [k,n,d]=m.slice(1).map(Number);
 assert.equal(Number(b[1]),0);
 const y=x=>1/(k+n/(x*x+d)),min=y(0),max=1/k,correctInverse=y=>Math.sqrt(n*y/(1-k*y)-d);
 assert.ok(near(min,4/9)&&near(max,1));
 return {k,n,d,y,min,max,correctInverse};
}
function check22(q){
 const s=source22(q),probes=[0,.2,1,2,5,20];
 for(const o of q.options){
  const v=splitOption(q,o),R=range(v.condition,'y');
  assertInterval(R,{low:s.min,lowClosed:o.id!=='C',high:s.max,highClosed:o.id==='D'});
  for(const x of probes){
   const y=s.y(x),actual=evalTex(v.expr,{y});
   const expected=o.id==='A'?Math.sqrt((9*y+4)/(1-y)):
    o.id==='B'?Math.sqrt((9*y-4)/(y-1)):
    o.id==='E'?(9*y-4)/(1-y):s.correctInverse(y);
   if(o.id==='B'&&x>0){
    assert.ok(Number.isNaN(actual),'Wrong denominator creates imaginary radical above lower endpoint');
    continue;
   }
   assert.ok(near(actual,expected),'Q22 '+o.id+' source-derived wrong operation mismatch');
   if(o.id==='F')assert.ok(near(actual,x),'Q22 positive root not valid on source');
  }
 }
 assert.equal(q.correctOptionId,'F');
}
const errorReason={
  19:{A:/omit the extra output condition/i,B:/Exclude the permitted threshold/i,C:/wrong sign/i,D:/Reverse the sign/i,E:/Include the unattainable limiting value/i},
  20:{A:/wrong sign/i,B:/Reverse the sign/i,C:/Exclude x=0/i,D:/upper asymptote/i,F:/Invert the final formula/i},
  21:{B:/wrong sign/i,C:/confusing k with its reciprocal/i,D:/Exclude the allowed x=0/i,E:/non-attained limiting output/i,F:/reversing the sign/i},
  22:{A:/wrong sign/i,B:/Reverse the sign/i,C:/Exclude the valid endpoint/i,D:/never-attained limit/i,E:/forget to take the non-negative square root/i}
};
function inspect(q){
 const original=bank.questions.find(x=>x.sourceId===q.sourceId);
 assert.ok(original&&original.dailyEligible===false,'Old bank must stay blocked');
 assert.equal(q.replacesRevisionId,original.revisionId);
 assert.notEqual(q.revisionId,original.revisionId);
 assert.notEqual(q.stem,original.stem);
 assert.equal(q.academicQA,'pending');
 for(const k of ['dailyEligible','masteryEligible','independentGradeCalibrated','independentStudentMisconceptionCertified'])
  assert.equal(q[k],false,'Never forge academic or Daily credit '+q.sourceId);
 assert.equal(q.options.length,6);
 assert.deepEqual(q.options.map(o=>o.id),letters);
 assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
 assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===q.correctOptionId).latex);
 const n=Number(q.sourceId.slice(-3));
 for(const o of q.options){
  assert.match(mathsOptionHTML(o),/^<math xmlns=/);
  if(o.id!==q.correctOptionId){
   assert.ok(typeof o.errorPath==='string'&&o.errorPath.length>=35);
   assert.match(o.errorPath,errorReason[n][o.id],'Misleading causal error route '+q.sourceId+' '+o.id);
  }
 }
 assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);
 assert.equal(q.workedSolutionSteps.length,3);
 for(const line of q.workedSolutionSteps){
  assert.ok(line.length>35);
  assert.ok(mathsRichTextHTML(line).includes('<math xmlns='));
 }
 if(n===19)check19(q);
 else if(n===20)check20(q);
 else if(n===21)check21(q);
 else if(n===22)check22(q);
 else throw Error('Unknown candidate '+q.sourceId);
}
test('Q19–22 source-derived inverse/composition/parameter/quadratic math: 24 complete A–F claims checked',()=>{
 assert.equal(pack.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
 assert.equal(pack.questions.length,4);
 assert.equal(bank.questions.length,200);
 assert.deepEqual(pack.questions.map(q=>q.sourceId.slice(-3)),['019','020','021','022']);
 for(const q of pack.questions)inspect(q);
 assert.ok(bank.questions.every(q=>q.dailyEligible===false));
});
test('changed source, wrong key, false domain, bad wrong-route explanation and forged learner credit all fail',()=>{
 const swaps={
  '019':['\\frac{4}{5}','\\frac{3}{5}'],
  '020':['4t+3','5t+3'],
  '021':['\\frac{1}{2}','\\frac{1}{3}'],
  '022':['\\frac{5}{x^2+4}','\\frac{6}{x^2+4}']
 };
 for(const q of pack.questions){
  const copy=()=>JSON.parse(JSON.stringify(q));
  const fakeKey=copy();fakeKey.correctOptionId=q.correctOptionId==='F'?'A':'F';
  assert.throws(()=>inspect(fakeKey));
  const fakeOption=copy();fakeOption.options.find(o=>o.id!==q.correctOptionId).latex='x=999, y>0';
  assert.throws(()=>inspect(fakeOption));
  const fakeDomain=copy();fakeDomain.options.find(o=>o.id===q.correctOptionId).latex+=';y\\ne999';
  assert.throws(()=>inspect(fakeDomain));
  const fakeReason=copy();fakeReason.options.find(o=>o.id!==q.correctOptionId).errorPath='Unsupported arbitrary explanation unrelated to the actual wrong calculation.';
  assert.throws(()=>inspect(fakeReason));
  const changedSource=copy(),[before,after]=swaps[q.sourceId.slice(-3)];
  assert.ok(changedSource.stem.includes(before));
  changedSource.stem=changedSource.stem.replace(before,after);
  assert.throws(()=>inspect(changedSource));
  const forged=copy();forged.dailyEligible=true;
  assert.throws(()=>inspect(forged));
 }
});
