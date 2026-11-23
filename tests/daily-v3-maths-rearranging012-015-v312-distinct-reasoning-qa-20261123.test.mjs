import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const pack=JSON.parse(readFileSync(new URL('../qa-staging/math-v312-rearranging012-015-distinct-reasoning-candidates-20261123.json',import.meta.url),'utf8'));
const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const letters=['A','B','C','D','E','F'];
function texExpression(tex,variables={}){
 const src=tex.replace(/\s/g,'');
 function brace(s,p){
  assert.equal(s[p],'{','Expected TeX group in '+tex);
  let d=0;
  for(let i=p;i<s.length;i++){
   if(s[i]==='{')d++;
   if(s[i]==='}'&&--d===0)return [s.slice(p+1,i),i+1];
  }
  throw Error('Unclosed TeX group in '+tex);
 }
 function unwrap(s){
  let out='';
  for(let i=0;i<s.length;){
   if(s.startsWith('\\frac',i)||s.startsWith('\\dfrac',i)){
    let start=i+(s.startsWith('\\dfrac',i)?6:5);
    const [a,j]=brace(s,start),[b,k]=brace(s,j);
    out+='(('+unwrap(a)+')/('+unwrap(b)+'))';i=k;
   }else if(s.startsWith('\\sqrt',i)){
    const [a,j]=brace(s,i+5);
    out+='sqrt('+unwrap(a)+')';i=j;
   }else if(s[i]==='{'){
    const [a,j]=brace(s,i);out+='('+unwrap(a)+')';i=j;
   }else out+=s[i++];
  }
  return out;
 }
 const expanded=unwrap(src),raw=expanded.match(/sqrt|\d+(?:\.\d+)?|[a-z()+\-*/]/g)||[];
 assert.equal(raw.join(''),expanded,'Unsupported algebra evaluator input '+tex);
 const tokens=[],ends=t=>/^\d|^[a-z]$|^\)$/.test(t),
   starts=t=>/^\d|^[a-z]$|^\($|^sqrt$/.test(t);
 for(let i=0;i<raw.length;i++){
  if(i&&ends(raw[i-1])&&starts(raw[i]))tokens.push('*');
  tokens.push(raw[i]);
 }
 let i=0;
 function atom(){
  const t=tokens[i++];
  if(t==='('){const value=expression();assert.equal(tokens[i++],')');return value;}
  if(t==='sqrt'){
   assert.equal(tokens[i++],'(');const value=expression();
   assert.equal(tokens[i++],')');return Math.sqrt(value);
  }
  if(/^\d/.test(t||''))return Number(t);
  if(/^[a-z]$/.test(t||'')){
   assert.ok(Object.hasOwn(variables,t),'Unknown algebra input '+t);
   return variables[t];
  }
  throw Error('Bad algebra token '+t+' in '+tex);
 }
 function unary(){
  if(tokens[i]==='-'){i++;return -unary();}
  if(tokens[i]==='+'){i++;return unary();}
  return atom();
 }
 function product(){
  let value=unary();
  while(tokens[i]==='*'||tokens[i]==='/'){
   const sign=tokens[i++],rhs=unary();
   value=sign==='*'?value*rhs:value/rhs;
  }
  return value;
 }
 function expression(){
  let value=product();
  while(tokens[i]==='+'||tokens[i]==='-'){
   const sign=tokens[i++],rhs=product();
   value=sign==='+'?value+rhs:value-rhs;
  }
  return value;
 }
 const result=expression();
 assert.equal(i,tokens.length,'Unexpected leftover algebra tokens in '+tex);
 return result;
}
function getPlainInverse(option){
 const fragments=option.latex.split(',').map(x=>x.trim());
 assert.equal(fragments.length,2,'Requires formula AND exact domain/range: '+option.latex);
 const m=fragments[0].match(/^x=(.+)$/);
 assert.ok(m,'Must explicitly make x the subject: '+option.latex);
 return {expr:m[1],condition:fragments[1]};
}
function bounded(s){
 const m=s.replace(/\s/g,'').match(/^(-?\d+)(<|\\le)y(<|\\le)(-?\d+)$/);
 assert.ok(m,'Unsupported closed/open range '+s);
 return {lo:Number(m[1]),loStrict:m[2]==='<',hi:Number(m[4]),hiClosed:m[3]==='\\le'};
}
function excluded(s){
 const m=s.replace(/\s/g,'').match(/^y\\ne(-?\d+)$/);
 assert.ok(m,'Missing exact excluded y '+s);return Number(m[1]);
}
function lower(s){
 const m=s.replace(/\s/g,'').match(/^y(\\ge|>|\\le|<)(-?\d+)$/);
 assert.ok(m,'Missing nonnegative output range '+s);
 return {operator:m[1],boundary:Number(m[2])};
}
function fromStem(q){
 const n=Number(q.sourceId.slice(-3)),s=q.stem;
 if(n===12){
  const m=s.match(/y=(\d+)\+\\frac\{(\d+)\}\{(\d+)x\+(\d+)\}/),min=s.match(/x\\ge(\d+)/);
  assert.ok(m&&min,'Q12 source formula/domain missing');
  const [a,b,c,d]=m.slice(1).map(Number),xMin=Number(min[1]);
  assert.ok(b>0&&c>0&&d+c*xMin>0);
  return {a,b,c,d,xMin,lo:a,hi:a+b/(c*xMin+d)};
 }
 if(n===13){
  assert.match(s,/y=a\+\\frac\{b\}\{x\+(\d+)\}/);
  const shift=Number(s.match(/y=a\+\\frac\{b\}\{x\+(\d+)\}/)[1]);
  const m=s.match(/When \$x=(\d+)\$, \$y=(\d+)\$; when \$x=(\d+)\$, \$y=(\d+)\$/);
  assert.ok(m,'Q13 observed pairs missing');
  const [x1,y1,x2,y2]=m.slice(1).map(Number);
  const b=(y1-y2)/(1/(x1+shift)-1/(x2+shift));
  const a=y1-b/(x1+shift);
  assert.ok(near(a,1)&&near(b,18));
  return {shift,x1,y1,x2,y2,a,b};
 }
 if(n===14){
  const m=s.match(/y=\(x-(\d+)\)\^2\+(\d+)/),d=s.match(/x\\ge(\d+)/);
  assert.ok(m&&d,'Q14 squared shift/branch missing');
  const [shift,constant]=m.slice(1).map(Number),minimum=Number(d[1]);
  assert.equal(shift,minimum,'Branch point must match input lower restriction');
  return {shift,constant,minimum};
 }
 if(n===15){
  const m=s.match(/y=\(k-(\d+)\)x\+(\d+)k/);
  assert.ok(m,'Q15 exceptional parameter cannot be derived');
  const [critical,multiplier]=m.slice(1).map(Number);
  return {critical,multiplier,exceptionalY:critical*multiplier};
 }
 throw Error('Unexpected source question '+q.sourceId);
}
function verifyOption(q,o,source){
 const n=Number(q.sourceId.slice(-3)),id=o.id;
 if(n===12){
  const {a,b,c,d,lo,hi}=source,{expr,condition}=getPlainInverse(o);
  const expectedRange={lo,loStrict:true,hi,hiClosed:true};
  if(id==='B')expectedRange.loStrict=false;
  if(id==='C')expectedRange.hiClosed=false;
  assert.deepEqual(bounded(condition),expectedRange,'Q12 wrong endpoint route '+id);
  for(const y of [2.2,2.5,3,4.4,hi]){
   const base=(b-d*(y-a))/(c*(y-a));
   const expected=id==='D'?(b+d*a+d*y)/(c*(y-a)):
     id==='E'?(b-d*(y-a))/(c*(y+a)):
     id==='F'?1/base:base;
   const actual=texExpression(expr,{y});
   if(!Number.isFinite(expected)||!Number.isFinite(actual))continue;
   assert.ok(near(actual,expected),'Q12 '+id+' formula not caused by its declared wrong operation at y='+y);
  }
  return;
 }
 if(n===13){
  const {a,b,shift,y1,y2}=source,{expr,condition}=getPlainInverse(o);
  const exclusion=id==='B'?-a:id==='E'?y1:id==='F'?y2:a;
  assert.ok(near(excluded(condition),exclusion),'Q13 wrong excluded value '+id);
  for(const y of [2,4,7,8,10,25]){
   const wrong=id==='B'?b/(y+a)-shift:
     id==='C'?b/(y-a)+shift:
     id==='D'?(b/3)/(y-a)-shift:
     b/(y-a)-shift;
   assert.ok(near(texExpression(expr,{y}),wrong),'Q13 wrong formula route '+id+' at y='+y);
  }
  return;
 }
 if(n===14){
  const {shift,constant}=source,{expr,condition}=getPlainInverse(o);
  const expectedCondition=id==='D'?{operator:'>',boundary:constant}:
    id==='E'?{operator:'\\le',boundary:constant}:
    {operator:'\\ge',boundary:constant};
  assert.deepEqual(lower(condition),expectedCondition,'Q14 wrong interval '+id);
  for(const y of [constant,constant+1,constant+9,constant+100]){
   const root=Math.sqrt(y-constant);
   const wrong=id==='B'?shift-root:
     id==='C'?shift+Math.sqrt(y+constant):
     id==='F'?root-shift:shift+root;
   assert.ok(near(texExpression(expr,{y}),wrong),'Q14 wrong branch/rearrangement '+id);
  }
  return;
 }
 if(n===15){
  const m=o.latex.replace(/\s/g,'').match(/^k\\ne(\d+):x=(.+);k=(\d+):y(=|\\ne)(\d+)$/);
  assert.ok(m,'Q15 should state inverse and exceptional case '+o.latex);
  const [exclude,expr,exception,operator,value]=[Number(m[1]),m[2],Number(m[3]),m[4],Number(m[5])];
  const {critical,multiplier,exceptionalY}=source;
  assert.equal(exclude,critical);assert.equal(exception,critical);
  assert.equal(operator,id==='F'?'\\ne':'=');
  const expectedSpecial=id==='A'?critical:id==='E'?0:exceptionalY;
  assert.equal(value,expectedSpecial,'Q15 exception is inconsistent with its exact displayed distractor');
  for(const k of [-4,-1,0,1,2,4,5,8]){
   for(const x of [-3,0,1,6]){
    const y=(k-critical)*x+multiplier*k;
    const expected=id==='B'?(y+multiplier*k)/(k-critical):
      id==='C'?(y-multiplier*k)/(critical-k):
      (y-multiplier*k)/(k-critical);
    assert.ok(near(texExpression(expr,{k,y}),expected),'Q15 '+id+' wrong algebra route at k='+k+' x='+x);
   }
  }
  assert.equal((critical-critical)*123+multiplier*critical,exceptionalY);
  assert.notEqual(exceptionalY,0);
  return;
 }
 throw Error('Unmodeled wrong option '+q.sourceId);
}
const expectedReason={
  12:{B:/never-attained limit/i,C:/endpoint as excluded/i,D:/wrong sign/i,E:/wrong sign/i,F:/Invert the final fraction/i},
  13:{B:/a=-1/i,C:/wrong sign/i,D:/multiply by 2 rather than by 6/i,E:/observed y=7/i,F:/observed y=4/i},
  14:{B:/negative square-root branch/i,C:/wrong sign/i,D:/vertex x=3/i,E:/Reverse the inequality/i,F:/wrong sign/i},
  15:{A:/output value/i,B:/wrong sign/i,C:/Reverse the sign/i,E:/whole right-hand side is zero/i,F:/Reverse the exceptional existence condition/i}
};
function inspect(q){
 const previous=bank.questions.find(p=>p.sourceId===q.sourceId);
 assert.ok(previous&&previous.dailyEligible===false);
 assert.notEqual(previous.revisionId,q.revisionId);
 assert.notEqual(previous.stem,q.stem);
 assert.equal(q.academicQA,'pending');
 for(const field of ['dailyEligible','masteryEligible','independentGradeCalibrated','independentStudentMisconceptionCertified'])
  assert.equal(q[field],false,'No fabricated credit or independent reviewer: '+q.sourceId+' '+field);
 assert.equal(q.options.length,6);
 assert.deepEqual(q.options.map(x=>x.id),letters);
 assert.equal(new Set(q.options.map(x=>x.latex)).size,6);
 assert.equal(q.correctAnswerLatex,q.options.find(x=>x.id===q.correctOptionId).latex);
 const n=Number(q.sourceId.slice(-3)),expectedKey=n===15?'D':'A';
 assert.equal(q.correctOptionId,expectedKey);
 const source=fromStem(q);
 for(const o of q.options){
  verifyOption(q,o,source);
  if(o.id!==q.correctOptionId){
   assert.ok(typeof o.errorPath==='string'&&o.errorPath.length>=35,'Unexplained wrong answer '+o.id);
   assert.match(o.errorPath,expectedReason[n][o.id],'Wrong-method rationale does not match displayed mathematical route');
  }else assert.equal(o.errorPath,undefined);
  assert.match(mathsOptionHTML(o),/^<math xmlns=/);
 }
 assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);
 assert.equal(q.workedSolutionSteps.length,3);
 for(const step of q.workedSolutionSteps){
  assert.ok(step.length>=35);
  assert.ok(mathsRichTextHTML(step).length>0);
 }
 // Independent inverse-domain proofs on actual original input states.
 if(n===12){
  for(const x of [0,.1,1,2,5,20,100]){
   const {a,b,c,d,lo,hi}=source,y=a+b/(c*x+d);
   assert.ok(y>lo&&y<=hi);
   const p=getPlainInverse(q.options[0]);
   assert.ok(near(texExpression(p.expr,{y}),x));
  }
 }else if(n===13){
  for(const x of [-8,-4,-1,0,1,4,9,30]){
   if(near(x+source.shift,0))continue;
   const y=source.a+source.b/(x+source.shift);
   assert.ok(!near(y,source.a));
   const formula=getPlainInverse(q.options[0]);
   assert.ok(near(texExpression(formula.expr,{y}),x));
  }
 }else if(n===14){
  for(const x of [source.shift,source.shift+1,source.shift+2,source.shift+5,source.shift+25]){
   const y=(x-source.shift)**2+source.constant;
   assert.ok(y>=source.constant);
   assert.ok(near(texExpression(getPlainInverse(q.options[0]).expr,{y}),x));
  }
 }else if(n===15){
  const {critical,multiplier,exceptionalY}=source;
  const key=q.options.find(o=>o.id===q.correctOptionId);
  const expression=key.latex.match(/:x=([^;]+);/)[1];
  for(const k of [-4,-1,0,1,2,4,5,8])for(const x of [-5,0,1,6]){
   const y=(k-critical)*x+multiplier*k;
   assert.ok(near(texExpression(expression,{k,y}),x));
  }
  assert.equal((critical-critical)*0+multiplier*critical,exceptionalY);
  assert.equal((critical-critical)*17+multiplier*critical,exceptionalY);
  assert.ok((critical-critical)*17+multiplier*critical!==exceptionalY+1);
 }
}
test('four different revised rearranging reasoning candidates: all 24 answer formulas, exclusions and exceptional parameter claims checked from source',()=>{
 assert.equal(pack.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
 assert.equal(pack.questions.length,4);
 assert.equal(bank.questions.length,200);
 assert.deepEqual(pack.questions.map(q=>q.sourceId.slice(-3)),['012','013','014','015']);
 for(const q of pack.questions)inspect(q);
 assert.ok(bank.questions.every(q=>q.dailyEligible===false));
});
test('every candidate rejects changed key, false range, corrupted algebra, changed source numbers and forged approval',()=>{
 const corrupt={
  '012':['6','8'],
  '013':['$y=7$','$y=9$'],
  '014':['(x-3)','(x-4)'],
  '015':['+2k','+4k']
 };
 for(const q of pack.questions){
  const clone=()=>JSON.parse(JSON.stringify(q));
  const key=clone();key.correctOptionId=key.correctOptionId==='A'?'B':'A';
  assert.throws(()=>inspect(key));
  const interval=clone();interval.options.find(o=>o.id===interval.correctOptionId).latex+=';y\\ne999';
  assert.throws(()=>inspect(interval));
  const wrong=clone();wrong.options.find(o=>o.id!==wrong.correctOptionId).latex='x=999';
  assert.throws(()=>inspect(wrong));
  const explain=clone();explain.options.find(o=>o.id!==explain.correctOptionId).errorPath='Generic invented explanation with no causal route.';
  assert.throws(()=>inspect(explain));
  const source=clone();const [a,b]=corrupt[q.sourceId.slice(-3)];
  assert.ok(source.stem.includes(a));
  source.stem=source.stem.replace(a,b);
  assert.throws(()=>inspect(source));
  const credit=clone();credit.dailyEligible=true;assert.throws(()=>inspect(credit));
 }
});
