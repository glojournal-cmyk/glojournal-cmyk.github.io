import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const rows=bank.questions.filter(q=>q.topicId==='math-y9-indices');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));
function fields(re,s){
 const m=s.match(re);assert.ok(m,'Failed to parse source constraints: '+re+' '+s);
 return m.slice(1).map(Number);
}
function number(tex){
 const raw=tex.replace(/\s/g,'');
 if(/^-?\d+(?:\.\d+)?$/.test(raw))return Number(raw);
 const m=raw.match(/^(-?)\\frac\{(-?\d+)\}\{(-?\d+)\}$/);
 assert.ok(m,'Unsupported revised candidate numerical choice: '+raw);
 return (m[1]?-1:1)*Number(m[2])/Number(m[3]);
}
function calculatedFromStem(q){
 const s=q.stem,n=Number(q.sourceId.slice(-3));let answer;
 if(n<=4){
  const a=fields(/4\^\{n\+(\d+)\}/,s)[0],
   b=fields(/8\^\{(\d+)-n\}/,s)[0],
   d=fields(/2\^(\d+)/,s)[0],K=2*a+3*b-d;
  if(n===1){
   const [lower,upper]=fields(/2\^(\d+)<A\(n\)<2\^\{(\d+)\}/,s);
   const solutions=[];
   for(let k=-50;k<=50;k++){
    const exponent=K-k;
    if(exponent>lower&&exponent<upper&&exponent>=0&&exponent%3===0)
      solutions.push(k);
   }
   answer=solutions.reduce((total,k)=>total+k,0);
   assert.equal(solutions.length,2,'Unexpected number of perfect cubes');
  }else if(n===2){
   const [offset,power]=fields(/B\(n\)=4\^\{n-(\d+)\}\\times2\^(\d+)/,s);
   answer=Array.from({length:100},(_,k)=>k)
    .find(k=>2*(k-offset)+power>K-k);
   assert.ok(Number.isInteger(answer)&&answer>=0);
  }else if(n===3){
   const offset=fields(/Q\(n\)=4\^\{n-(\d+)\}/,s)[0],
    [low,high]=fields(/(\d+)\\le n\\le(\d+)/,s),
    hcf=fields(/highest common factor is \$2\^(\d+)\$/,s)[0],
    lcm=fields(/lowest common multiple is \$2\^\{(\d+)\}\$/,s)[0];
   const matches=[];
   for(let k=low;k<=high;k++){
    const p=K-k,r=2*(k-offset);
    if(Math.min(p,r)===hcf&&Math.max(p,r)===lcm)matches.push(k);
   }
   assert.equal(matches.length,1,'GCD/LCM source must have unique integer solution');
   answer=matches[0];
  }else{
   const shift=fields(/F\(n\+(\d+)\)/,q.options[0].latex)[0];
   const expected=2**(-shift);
   // The original prompt asks which statement holds for every n, and choices
   // are symbolic. Compare six derived multiplicative factors, not their text.
   const choices=q.options.map(o=>{
    let factor=o.latex.split('=')[1].replace('F(n)','');
    if(!factor)factor='1';
    return {id:o.id,value:number(factor)};
   });
   for(const k of [-7,-2,0,1,4,8]){
    const F=v=>2**(K-v);
    assert.ok(near(F(k+shift)/F(k),expected));
   }
   assert.equal(new Set(choices.map(o=>o.value)).size,6);
   assert.deepEqual(choices.filter(o=>near(o.value,expected)).map(o=>o.id),[q.correctOptionId]);
   return {symbolic:true,answer:expected};
  }
 }else if(n<=8){
  const [a,b]=fields(/4\^\{(\d+)\}\\times 8\^\{-(\d+)\}/,s),
   d=fields(/2\^\{-(\d+)\}/,s)[0];
  answer=2**(2*(2*a-3*b)+d);
 }else if(n<=12){
  const p=[...s.matchAll(/x\^\{(-?\d+)\}y\^\{(-?\d+)\}/g)]
   .map(m=>[Number(m[1]),Number(m[2])]);
  assert.equal(p.length,2);
  const [a,b]=p[0],[c,d]=p[1];
  answer=2**(2*a-c)*4**(2*b-d);
 }else if(n<=16||n>=21&&n<=24){
  const p=[...s.matchAll(/x\^\{(-?\d+)\}y\^\{(-?\d+)\}/g)]
   .map(m=>[Number(m[1]),Number(m[2])]);
  assert.equal(p.length,3);
  const [a,b]=p[0],[c,d]=p[1],[e,f]=p[2];
  const x=(e+c)/a,y=(f+d)/b;
  assert.ok(near(x,y),'Power identities conflict');
  answer=x;
 }else if(n<=20){
  const total=fields(/=([0-9]+)\$/,s)[0];
  answer=Math.log2(total/5)/2;
  assert.ok(Number.isInteger(answer));
 }else if(n<=28){
  const k=fields(/A\}\{B\}=2\^\{(-?\d+)\}/,s)[0],N=k+3;
  answer=N*N-2*N;
 }else if(n<=32){
  const power=fields(/=2\^\{(\d+)\}/,s)[0];
  answer=(power-5)/2;assert.ok(Number.isInteger(answer));
 }else if(n<=36){
  const p=[...s.matchAll(/x\^\{(-?\d+)\}y\^\{(-?\d+)\}/g)]
   .map(m=>[Number(m[1]),Number(m[2])]);
  assert.equal(p.length,2);
  const [a,b]=p[0],[c,d]=p[1];
  const x=(a+c)/3,y=(-d-b)/2;
  assert.ok(near(x,y),'Fractional-power identities inconsistent');
  answer=x;
 }else{
  const power=fields(/=2\^\{(\d+)\}/,s)[0],N=(power-5)/2;
  assert.ok(Number.isInteger(N));
  answer=N*N-N;
 }
 assert.ok(Number.isFinite(answer),'No finite source answer '+q.sourceId);
 return {symbolic:false,answer};
}
test('all 40 revised indices candidates solved from stem, six choices unique and one correct',()=>{
 assert.equal(rows.length,40);let checkedNumeric=0;
 for(const q of rows){
  const {answer,symbolic}=calculatedFromStem(q);
  assert.equal(q.dailyEligible,false);
  assert.equal(q.options.length,6);
  if(symbolic)continue;
  const key=number(q.correctAnswerLatex);
  assert.ok(near(answer,key),q.sourceId+' wrong candidate key: '+answer+' vs '+key);
  const values=q.options.map(o=>({id:o.id,v:number(o.latex)}));
  assert.ok(values.every((a,i)=>values.every((b,j)=>i===j||!near(a.v,b.v)),
    q.sourceId+' equivalent numeric options');
  assert.deepEqual(values.filter(o=>near(o.v,answer)).map(o=>o.id),[q.correctOptionId],
    q.sourceId+' wrong option mapping');
  checkedNumeric+=values.length;
 }
 assert.equal(checkedNumeric,39*6);
});
test('12 advanced fractional/surd Indices items stay unavailable until taught and calibrated',()=>{
 const held=rows.filter(q=>Number(q.sourceId.slice(-3))>=29);
 assert.equal(held.length,12);
 assert.ok(held.every(q=>q.dailyEligible===false));
});
