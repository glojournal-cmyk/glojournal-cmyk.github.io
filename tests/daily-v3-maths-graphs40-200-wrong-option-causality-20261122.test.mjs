import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const questions=bank.questions.filter(q=>q.topicId==='math-y9-straight-line-graphs');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function arithmetic(source,x=0){
 const s=source.replace(/\\left|\\right/g,'')
  .replace(/\\frac{([\-0-9]+)}{([\-0-9]+)}/g,'($1/$2)')
  .replace(/\s/g,'').replace(/−/g,'-');
 const raw=s.match(/\d+(?:\.\d+)?|[x()+\-*/]/g)||[];
 assert.equal(raw.join(''),s,'Unsupported numeric geometry: '+s);
 const toks=[],end=t=>/^\d|^x$|^\)$/.test(t),start=t=>/^\d|^x$|^\($/.test(t);
 for(let i=0;i<raw.length;i++){
  if(i&&end(raw[i-1])&&start(raw[i]))toks.push('*');
  toks.push(raw[i]);
 }
 let i=0;
 function atom(){
  const t=toks[i++];
  if(t==='-')return -atom();if(t==='+')return atom();
  if(t==='('){const v=expr();assert.equal(toks[i++],')');return v}
  if(t==='x')return x;
  if(/^\d/.test(t||''))return Number(t);
  throw Error('Unexpected math token '+t+' in '+s);
 }
 function mul(){
  let v=atom();while(toks[i]==='*'||toks[i]==='/'){
   const op=toks[i++],b=atom();v=op==='*'?v*b:v/b;
  }return v;
 }
 function expr(){
  let v=mul();while(toks[i]==='+'||toks[i]==='-'){
   const op=toks[i++],b=mul();v=op==='+'?v+b:v-b;
  }return v;
 }
 const v=expr();assert.equal(i,toks.length,'Remaining geometry tokens in '+s);return v;
}
const lines=stem=>[...stem.matchAll(/\$y=([^$]+)\$/g)]
 .map(m=>({m:arithmetic(m[1],1)-arithmetic(m[1],0),b:arithmetic(m[1],0)}));
const points=stem=>[...stem.matchAll(/\$(?:[AB])?\((k|[+-]?\d+),\s*([+-]?\d+)\)\$/g)]
 .map(m=>[m[1]==='k'?null:Number(m[1]),Number(m[2])]);
const gradient=(a,b)=>(b[1]-a[1])/(b[0]-a[0]);
const cross=(a,b)=>{const x=(b.b-a.b)/(a.m-b.m);return [x,a.m*x+a.b]};
const through=(p,m)=>({m,b:p[1]-m*p[0]});
const bisector=(a,b)=>{
 const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],m=-1/gradient(a,b);
 return {...through(mid,m),mid};
};
function reproduceWrong(q,option){
 const n=Number(q.sourceId.slice(-3)),e=lines(q.stem),p=points(q.stem),r=option.errorPath;
 let P,m,mseg,mid,bis,desired,mKnown;
 if(n<=4){
  P=p[2];mseg=gradient(p[0],p[1]);m=-1/mseg;desired=P[0]-P[1]/m;
  const f={
   'Reverse the sign of the required gradient.':P[0]+P[1]/m,
   'Invert the required gradient.':P[0]-P[1]*m,
   'Use the gradient perpendicular to the required one.':P[0]-P[1]/mseg,
   'Find the other axis intercept.':P[1]-m*P[0],
   'Give the known point’s x-coordinate.':P[0],
   'Give the known point’s y-coordinate.':P[1],
   'Reverse the sign of the final intercept.':-desired,
   'Give the gradient instead of the intercept.':m
  };
  if(Object.hasOwn(f,r))return f[r];
 }
 if(n>=5&&n<=8){
  bis=bisector(p[0],p[1]);mid=bis.mid;m=bis.m;mseg=gradient(p[0],p[1]);desired=bis.b;
  const f={
   'Reverse the sign of the required gradient.':mid[1]+m*mid[0],
   'Invert the required gradient.':mid[1]-mid[0]/m,
   'Use the gradient perpendicular to the required one.':mid[1]-mseg*mid[0],
   'Find the other axis intercept.':-desired/m,
   'Give the known point’s x-coordinate.':mid[0],
   'Give the known point’s y-coordinate.':mid[1],
   'Reverse the sign of the final intercept.':-desired,
   'Give the gradient instead of the intercept.':m,
   'Multiply the height by the slope and add the known x-coordinate.':mid[1]*m+mid[0]
  };
  if(Object.hasOwn(f,r))return f[r];
 }
 if(n>=9&&n<=12){
  P=cross(e[0],e[1]);m=e[2].m;desired=P[1]-m*P[0];
  const f={
   'Reverse the sign of the required gradient.':P[1]+m*P[0],
   'Invert the required gradient.':P[1]-P[0]/m,
   'Use the gradient perpendicular to the required one.':P[1]+P[0]/m,
   'Find the other axis intercept.':-desired/m,
   'Give the known point’s x-coordinate.':P[0],
   'Give the known point’s y-coordinate.':P[1]
  };
  if(Object.hasOwn(f,r))return f[r];
 }
 if(n>=13&&n<=16){
  P=cross(e[0],e[1]);mKnown=e[2].m;m=-1/mKnown;desired=P[0]-P[1]/m;
  const f={
   'Reverse the sign of the required gradient.':P[0]+P[1]/m,
   'Invert the required gradient.':P[0]-P[1]*m,
   'Use the gradient perpendicular to the required one.':P[0]-P[1]/mKnown,
   'Find the other axis intercept.':P[1]-m*P[0],
   'Give the known point’s x-coordinate.':P[0]
  };
  if(Object.hasOwn(f,r))return f[r];
 }
 if(n>=17&&n<=20){
  bis=bisector(p[0],p[1]);mseg=gradient(p[0],p[1]);P=bis.mid;
  const xAt=(pt,m)=>cross(through(pt,m),e[0])[0];
  const f={
   'Use the segment gradient.':xAt(P,mseg),
   'Change the gradient sign without taking its reciprocal.':xAt(P,-mseg),
   'Pass the perpendicular through A instead of the midpoint.':xAt(p[0],bis.m),
   'Pass the perpendicular through B instead of the midpoint.':xAt(p[1],bis.m),
   'Pass the perpendicular through the origin instead of the midpoint.':xAt([0,0],bis.m)
  };
  if(Object.hasOwn(f,r))return f[r];
 }
 if(n>=21&&n<=24){
  mKnown=e[0].m;const b=e[0].b;mid=[-b/(2*mKnown),b/2];m=-1/mKnown;
  desired=mid[1]-m*mid[0];
  const f={
   'Reverse the sign of the required gradient.':mid[1]+m*mid[0],
   'Invert the required gradient.':mid[1]-mid[0]/m,
   'Use the gradient perpendicular to the required one.':mid[1]-mKnown*mid[0],
   'Find the other axis intercept.':-desired/m,
   'Give the known point’s x-coordinate.':mid[0]
  };
  if(Object.hasOwn(f,r))return f[r];
 }
 if(n>=25&&n<=28){
  P=cross(e[0],e[1]);mseg=gradient(p[0],p[1]);m=mseg;
  desired=P[0]-P[1]/m;
  const f={
   'Reverse the sign of the required gradient.':P[0]+P[1]/m,
   'Invert the required gradient.':P[0]-P[1]*m,
   'Use the gradient perpendicular to the required one.':P[0]+P[1]*m,
   'Find the other axis intercept.':P[1]-m*P[0],
   'Give the known point’s x-coordinate.':P[0]
  };
  if(Object.hasOwn(f,r))return f[r];
  if(n===28){
   // Dedicated adversarial explanations explicitly specify these erroneous steps.
   if(r.startsWith('Take the absolute value of the rise'))return P[0]-P[1]/Math.abs(mseg);
   if(r.startsWith('Use gradient +5/4 of the line perpendicular'))return P[0]+P[1]*mseg;
   if(r.startsWith('Calculate and report the y-intercept'))return P[1]-mseg*P[0];
   if(r.startsWith('Drop the horizontal translation'))return -P[1]/mseg;
   if(r.startsWith('Use the slope 4 of the first given'))return P[0]-P[1]/e[0].m;
  }
 }
 if(n>=29&&n<=32){
  mKnown=e[0].m;const B=p[1],rise=p[0][1]-p[1][1],correct=B[0]-rise*mKnown;
  const f={
   'Use the original gradient.':B[0]+rise/mKnown,
   'Reverse the horizontal displacement.':B[0]+rise*mKnown,
   'Give the run instead of the unknown coordinate.':correct-B[0],
   'Multiply the rise by the gradient.':B[0]-rise/mKnown,
   'Use the height of A as the rise.':B[0]-p[0][1]*mKnown
  };
  if(Object.hasOwn(f,r))return f[r];
 }
 if(n>=33&&n<=36){
  P=cross(e[0],e[1]);mseg=gradient(p[0],p[1]);m=-1/mseg;
  const f={
   'Reverse the sign of the required gradient.':P[0]+P[1]/m,
   'Invert the required gradient.':P[0]-P[1]*m,
   'Use the gradient perpendicular to the required one.':P[0]-P[1]/mseg,
   'Find the other axis intercept.':P[1]-m*P[0],
   'Give the known point’s x-coordinate.':P[0]
  };
  if(Object.hasOwn(f,r))return f[r];
 }
 if(n>=37){
  bis=bisector(p[0],p[1]);P=cross(bis,e[0]);
  const f={
   'Give the sum of the coordinates.':P[0]+P[1],
   'Stop at the x-coordinate.':P[0],
   'Stop at the y-coordinate.':P[1],
   'Multiply the coordinates without the required geometric step.':P[0]*P[1],
   'Subtract the coordinates of P.':P[1]-P[0],
   'Use the squared distance instead of the requested quantity.':P[0]*P[0]+P[1]*P[1],
   'Use the area instead of the requested quantity.':Math.abs(P[0]*P[1])/2,
   'Use the gradient instead of the requested quantity.':P[1]/P[0]
  };
  if(Object.hasOwn(f,r))return f[r];
 }
 throw Error(q.sourceId+' '+option.id+' lacks a causal graph wrong-operation proof: '+r);
}
test('200 graph wrong alternatives are source-derived, numerically reproduce their stated misconceptions',()=>{
 assert.equal(questions.length,40);
 let checked=0;
 for(const q of questions){
  assert.equal(q.dailyEligible,false);
  for(const o of q.options.filter(o=>o.id!==q.correctOptionId)){
   const computed=reproduceWrong(q,o);
   const printed=arithmetic(o.latex);
   assert.ok(near(computed,printed),q.sourceId+' '+o.id+': '+o.errorPath+
    '\nWrong route gives '+computed+', option is '+printed);
   checked++;
  }
 }
 assert.equal(checked,200);
});
test('the 12 perpendicular-bisector variants stay blocked from Autumn credit',()=>{
 const ids=new Set([5,6,7,8,17,18,19,20,37,38,39,40]);
 const held=questions.filter(q=>ids.has(Number(q.sourceId.slice(-3))));
 assert.equal(held.length,12);
 assert.ok(held.every(q=>q.dailyEligible===false));
});
