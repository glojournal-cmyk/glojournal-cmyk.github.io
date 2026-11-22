import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const data=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const qs=data.questions.filter(q=>q.topicId==='math-y9-indices');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function fields(re,stem){
 const match=stem.match(re);
 assert.ok(match,'Cannot derive misconception inputs from actual Indices stem '+re+' in '+stem);
 return match.slice(1).map(Number);
}
function numeric(tex){
 const s=tex.replace(/\s/g,'');
 if(/^-?\d+(?:\.\d+)?$/.test(s))return Number(s);
 const match=s.match(/^(-?)\\frac\{(-?\d+)\}\{(-?\d+)\}$/);
 assert.ok(match,'Unsupported numerical option: '+tex);
 return (match[1]?-1:1)*Number(match[2])/Number(match[3]);
}
function mathsError(q,option){
 const n=Number(q.sourceId.slice(-3)),s=q.stem,r=option.errorPath;
 let a,b,c,d,e,f,R;
 if(n===1){
  const K=2*fields(/4\^\{n\+(\d+)\}/,s)[0]+
   3*fields(/8\^\{(\d+)-n\}/,s)[0]-fields(/2\^(\d+)/,s)[0];
  if(r.startsWith('Treat the strict upper bound'))
   return [6,9,12].reduce((sum,exponent)=>sum+K-exponent,0);
  if(r.startsWith('Include exponent 3'))
   return [6,9,3].reduce((sum,exponent)=>sum+K-exponent,0);
  if(r.startsWith('Test perfect squares'))
   return [6,8,10].reduce((sum,exponent)=>sum+K-exponent,0);
  if(r.startsWith('Require n itself'))return 3;
  if(r.startsWith('Find n=5'))return K-6;
 }
 if(n===2){
  const a=fields(/4\^\{n\+(\d+)\}/,s)[0],
   b=fields(/8\^\{(\d+)-n\}/,s)[0],d=fields(/2\^(\d+)/,s)[0],
   K=2*a+3*b-d,
   [offset,power]=fields(/B\(n\)=4\^\{n-(\d+)\}\\times2\^(\d+)/,s);
  const first=(lhs,rhs)=>Array.from({length:100},(_,k)=>k).find(k=>lhs(k)>rhs(k));
  if(r.startsWith('Incorrectly convert the 4 in A'))
   return first(k=>2*(k-offset)+power,k=>a+k+3*(b-k)-d);
  if(r.startsWith('Correctly derive 3n'))
   return Math.floor((K-(power-2*offset))/3);
  if(r.startsWith('Omit the +1'))return first(k=>2*k,k=>K-k);
  if(r.startsWith('Incorrectly convert 4^(n'))
   return first(k=>k-offset+power,k=>K-k);
  if(r.startsWith('Mistake 4 in A'))return first(k=>2*(k-offset)+power,k=>3*a+3*b-d);
 }
 if(n===3){
  const a=fields(/4\^\{n\+(\d+)\}/,s)[0],
   b=fields(/8\^\{(\d+)-n\}/,s)[0],
   d=fields(/2\^(\d+)/,s)[0],
   offset=fields(/Q\(n\)=4\^\{n-(\d+)\}/,s)[0],
   H=fields(/highest common factor is \$2\^(\d+)\$/,s)[0],
   L=fields(/lowest common multiple is \$2\^\{(\d+)\}\$/,s)[0],
   K=2*a+3*b-d;
  if(r.startsWith('Use only P'))return K-L;
  if(r.startsWith('Use only Q'))return (H+2*offset)/2;
  if(r.startsWith('Use HCF×LCM'))return H+L-(K-2*offset+2);
  if(r.startsWith('Omit division'))return K+d-H;
  if(r.startsWith('Convert 4^(n'))return L+offset;
 }
 if(n===4){
  if(r.startsWith('Reverse the sign'))return 8;
  if(r.startsWith('Correctly notice F'))return 1/2;
  if(r.startsWith('Assume the +n'))return 1;
  if(r.startsWith('Keep only the increase'))return 4**3;
  if(r.startsWith('Keep only the fall'))return 8**-3;
 }
 if(n>=5&&n<=8){
  [a,b]=fields(/4\^\{(\d+)\}\\times 8\^\{-(\d+)\}/,s);
  d=fields(/2\^\{-(\d+)\}/,s)[0];
  let power;
  if(r==='Omit the outer square.')power=2*a-3*b+d;
  if(r==='Subtract the magnitude of the negative denominator exponent.')
   power=2*(2*a-3*b)-d;
  if(r==='Treat the negative power of eight as positive.')
   power=2*(2*a+3*b)+d;
  if(r==='Square the power of four only.')power=4*a-3*b+d;
  if(r==='Ignore the denominator.')power=2*(2*a-3*b);
  if(r==='Convert four and eight to base two without scaling their exponents.')
   power=2*(a-b)+d;
  if(power!==undefined)return 2**power;
 }
 if(n>=9&&n<=12){
  const pairs=[...s.matchAll(/x\^\{(-?\d+)\}y\^\{(-?\d+)\}/g)]
   .map(m=>[Number(m[1]),Number(m[2])]);
  assert.equal(pairs.length,2);[a,b]=pairs[0];[c,d]=pairs[1];
  let power;
  if(r==='Use y=2 rather than y=4.')power=2*a-c+2*b-d;
  if(r==='Add both denominator exponents instead of subtracting them.')
   power=2*a+c+2*(2*b+d);
  if(r==='Omit the outer square.')power=a-c+2*(b-d);
  if(r==='Square only the x factor.')power=2*a-c+2*(b-d);
  if(r==='Ignore the denominator.')power=2*a+4*b;
  if(r==='Take the reciprocal of the final answer.')
   power=-(2*a-c+2*(2*b-d));
  if(power!==undefined)return 2**power;
 }
 if(n>=13&&n<=16||n>=21&&n<=24||n>=33&&n<=36){
  let pairs=[...s.matchAll(/x\^\{(-?\d+)\/?\d*\}y\^\{(-?\d+)\/?\d*\}/g)]
   .map(m=>[Number(m[1]),Number(m[2])]);
  if(n>=33)pairs=[[3,-2],...pairs.slice(1)];
  assert.equal(pairs.length,3);
  [a,b]=pairs[0];[c,d]=pairs[1];[e,f]=pairs[2];
  if(r==='Ignore the denominator power of x.')return e/a;
  if(r==='Move the subtracted x-exponent with the wrong sign.')return (e-c)/a;
  if(r==='Ignore the denominator power of y.')return f/b;
  if(r==='Move the subtracted y-exponent with the wrong sign.')return (f-d)/b;
  if(r==='Report the multiple of n in the x-equation before division.')return e+c;
 }
 if(n>=17&&n<=20){
  const total=fields(/=(\d+)\$/,s)[0],N=Math.log2(total/5)/2;
  if(r==='Read the exponent of two as n rather than 2n.')return 2*N;
  if(r==='Halve the base-four exponent a second time.')return N/2;
  if(r==='Take the reciprocal of the isolated power of four.')return -N;
  if(r==='Give the value of the power instead of its exponent.')return 4**N;
  if(r==='Report the exponent of the second term.')return 2*N+2;
 }
 if(n>=25&&n<=28){
  const k=fields(/A\}\{B\}=2\^\{(-?\d+)\}/,s)[0],N=k+3,
   target=value=>value*value-2*value;
  if(r==='Stop after finding n.')return N;
  if(r==='Forget to subtract 2n.')return N*N;
  if(r==='Read 2n as 2.')return N*N-2;
  if(r==='Add the second term.')return N*N+2*N;
  if(r==='Treat the exponent of B as 2n+3, adding one after the conversion.')
   return target(k+4);
  if(r==='Read the requested expression as n squared plus two.')return N*N+2;
  if(r==='Drop +2 in the denominator exponent.')return target(k+1);
  if(r==='Fail to distribute the minus sign to +2 in the denominator exponent.')
   return target(k-1);
  if(r==='Square n−2 instead of calculating n(n−2).')return (N-2)**2;
 }
 if(n>=29&&n<=32||n>=37){
  R=fields(/=2\^\{(\d+)\}/,s)[0];
  const N=(R-5)/2,target=value=>n>=37?value*value-value:value;
  if(r==='Drop +6 from subtracting 3(n−2).')return target((R+1)/2);
  if(r==='Use −3n−6 in place of −3(n−2).')return target((R+7)/2);
  if(r==='Omit −4 from the power of sixteen.')return target((R-9)/2);
  if(r==='Drop +3 from the square-root exponent.')return target((R-2)/2);
  if(r==='Halve the constant but leave 2n unchanged in the square-root exponent.')
   return target((R-5)/3);
  if(r==='Reverse the subtraction when isolating n.')return target((5-R)/2);
  if(n===37){
   if(r.startsWith('After solving n=2, mistakenly evaluate'))return N*N-2*N;
   if(r.startsWith('After equating 2n+5'))return target(R-5);
   if(r.startsWith('After finding n=2, omit'))return N*N;
   if(r.startsWith('After finding n=2, change'))return N*N+N;
   if(r.startsWith('Ignore the square-root exponent halving'))return target((R-8)/3);
  }
 }
 throw Error(q.sourceId+' choice '+option.id+' missing independent erroneous-arithmetic model: '+r);
}
test('200 revised Indices A–F wrong choices reproduce their described mistaken exponent operations',()=>{
 assert.equal(qs.length,40);
 let tested=0;
 for(const q of qs){
  assert.equal(q.dailyEligible,false,'Causality alone is not independent educational QA');
  for(const choice of q.options.filter(o=>o.id!==q.correctOptionId)){
   const model=mathsError(q,choice);
   let optionText=choice.latex;
   if(optionText.includes('F(n)')){
    assert.equal(Number(q.sourceId.slice(-3)),4);
    optionText=optionText.split('=')[1].replace('F(n)','');
    if(!optionText)optionText='1';
   }
   const printed=numeric(optionText);
   assert.ok(near(model,printed),q.sourceId+' '+choice.id+
    ': stated error produces '+model+', printed choice '+printed+
    '\n'+choice.errorPath);
   tested++;
  }
 }
 assert.equal(tested,200);
});
