import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const questions=bank.questions.filter(q=>q.topicId==='math-y9-simultaneous-equations');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function numeric(tex){
 const s=tex.replace(/\s/g,'');
 if(/^-?\d+(?:\.\d+)?$/.test(s))return Number(s);
 const m=s.match(/^(-?)\\frac\{(-?\d+)\}\{(-?\d+)\}$/);
 assert.ok(m,'Candidate choice must be readable numeric: '+tex);
 return (m[1]?-1:1)*Number(m[2])/Number(m[3]);
}
function solve(a,b,c,d,e,f){
 const det=a*e-b*d;assert.notEqual(det,0,'No unique ordinary x/y');
 return {x:(c*e-b*f)/det,y:(a*f-c*d)/det};
}
function sourceQuantities(q){
 const n=Number(q.sourceId.slice(-3)),s=q.stem;
 if(n>=5&&n<=8||n>=17&&n<=20){
  const vals=[...s.matchAll(/(\d+) adult tickets? and (\d+) child tickets? costs? £(\d+)/g)]
   .map(m=>m.slice(1).map(Number));
  assert.equal(vals.length,2,'Ticket costs must come from actual question');
  const [a,b,c]=vals[0],[d,e,f]=vals[1],
   m=s.match(/(?:How much do|What is the price of) (\d+) adult tickets? and (\d+) child tickets?/);
  assert.ok(m,'Actual ticket combination unparseable');
  return {...solve(a,b,c,d,e,f),u:+m[1],v:+m[2],first:c};
 }
 if(n>=25&&n<=28){
  const masses=[...s.matchAll(/total mass (\d+) kg/g)].map(m=>+m[1]);
  assert.equal(masses.length,2);
  return {...solve(3,2,masses[0],2,5,masses[1]),first:masses[0]};
 }
 if(n>=33&&n<=36){
  const m=s.match(/\\begin\{cases\}\s*3x\+2y=(\d+)\\\\\s*kx-3y=(\d+)\\end\{cases\}/);
  assert.ok(m,'Parameter source not understood');
  assert.match(s,/x=2y\+1/);
  const y=(Number(m[1])-3)/8,x=2*y+1;
  return {x,y,first:+m[1],second:+m[2]};
 }
 if(n>=13&&n<=16){
  const m=s.match(/\\begin\{cases\}\s*(\d+)x\+(\d+)y=(\d+)\\\\\s*kx\+(\d+)y=(\d+)\\end\{cases\}/);
  assert.ok(m,'Basic no-solution source not understood');
  const [a,b,c,d,e]=m.slice(1).map(Number);
  return {a,b,c,d,e,first:c};
 }
 if(n>=37){
  const m=s.match(/\\begin\{cases\}2x\+3y=(\d+)\\\\\(k\+(\d+)\)x\+\(2k\+(\d+)\)y=(\d+)\\end\{cases\}/);
  assert.ok(m,'Higher no-solution source not understood');
  const [c,u,v,e]=m.slice(1).map(Number);
  return {a:2,b:3,c,u,v,e,first:c};
 }
 const m=s.match(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/);
 assert.ok(m,'Actual equation system missing');
 const lines=m[1].split('\\\\');assert.equal(lines.length,2);
 const readLinear=line=>{
  if(line.startsWith('\\dfrac')){
   const fraction=line.match(/\\dfrac\{(\d+)x\+(\d+)y\}\{(\d+)\}=\\dfrac\{(-?\d+)\}\{(\d+)\}/);
   assert.ok(fraction,'Clearing denominator equation unparseable '+line);
   const [a,b,den,c,cden]=fraction.slice(1).map(Number);
   return {a:a/den,b:b/den,c:c/cden,firstCleared:c};
  }
  const regular=line.match(/(\d+)x([+-])(\d+)y=(-?\d+)/);
  assert.ok(regular,'Linear equation unparseable '+line);
  return {a:+regular[1],b:(regular[2]==='-'?-1:1)*Number(regular[3]),c:+regular[4]};
 };
 const first=readLinear(lines[0]),second=readLinear(lines[1]);
 return {...solve(first.a,first.b,first.c,second.a,second.b,second.c),
   first:first.c,firstCleared:first.firstCleared};
}
function modelMisconception(q,choice,data){
 const n=Number(q.sourceId.slice(-3)),label=choice.errorPath,
  {x,y,first}=data;
 const f=(xx,yy)=>{
  if(n<=4)return xx*xx+yy;
  if(n>=9&&n<=12)return xx*yy;
  if(n>=21&&n<=24)return 2*xx*xx-yy;
  if(n>=29&&n<=32)return (n-25)*xx+(n-24)*yy;
  throw Error('No final-expression family '+n);
 };
 if(n<=4||n>=9&&n<=12||n>=21&&n<=24||n>=29&&n<=32){
  const formulas={
   'Swap the values of x and y in the final expression.':()=>f(y,x),
   'Stop after finding x.':()=>x,'Stop after finding y.':()=>y,
   'Give the first equation’s right-hand side.':()=>first,
   'Use the first right-hand side as x.':()=>f(first,y),
   'Give the sum of the coordinates.':()=>x+y,
   'Give their difference.':()=>x-y,
   'Reverse the sign of x.':()=>f(-x,y),
   'Reverse the sign of y.':()=>f(x,-y),
   'Clear the common denominator by multiplying the first equation by 4, obtaining 4x+5y=29; then report the new right-hand side 29 instead of the requested product xy.':()=>data.firstCleared,
  };
  if(Object.hasOwn(formulas,label))return formulas[label]();
  // Specific worked-mistake explanations in repaired Q23.
  if(n===23){
   const other={
    A:2*x*x+y,
    B:x*x-y,
    C:2*x*y-y,
    E:(2*x)**2-y,
    F:2*x*x-2*y
   };
   assert.match(label,/\$.*\$/,'Q23 explicit algebraic route must remain in evidence');
   if(Object.hasOwn(other,choice.id))return other[choice.id];
  }
 }
 if(n>=5&&n<=8||n>=17&&n<=20){
  const {u,v}=data;
  const f={
   'Exchange the adult and child prices.':u*y+v*x,
   'Count the adult tickets only.':u*x,
   'Count the child tickets only.':v*y,
   'Price one of each ticket.':x+y,
   'Give the child unit price.':y,
   'Give the adult unit price.':x
  };
  if(Object.hasOwn(f,label))return f[label];
 }
 if(n>=25&&n<=28){
  const expression=(a,b)=>n===25?a-b:n===26?2*a-b:n===27?a+2*b:3*a-b;
  const f={
   'Give the mass of a crate only.':x,
   'Give the mass of a box only.':y,
   'Swap crate and box masses.':expression(y,x),
   'Use the opposite sign for the boxes.':n===27?x-2*y:n===26?2*x+y:n===28?3*x+y:x+y,
   'Add one of each.':x+y,
   'Give the first load’s mass.':first
  };
  if(Object.hasOwn(f,label))return f[label];
 }
 if(n>=33&&n<=36){
  const C=data.second;
  const f={
   'Move −3y with the wrong sign.':(C-3*y)/x,
   'Omit the y-term.':C/x,
   'Divide by y instead of x.':(C+3*y)/y,
   'Stop at kx.':C+3*y,
   'Swap the solved coordinates in the parameter equation.':(C+3*x)/y
  };
  if(Object.hasOwn(f,label))return f[label];
 }
 if(n>=13&&n<=16){
  const {a,b,c,d,e}=data;
  if(label.startsWith('Match the ratio of x-coefficients')||
    label==='Match the constant ratio rather than both coefficient ratios.')return a*e/c;
  if(label.startsWith('Treat the change in the y coefficient'))return a+(d-b);
  if(label.startsWith('Confuse parallel and perpendicular'))return -(b*d)/a;
  if(label.startsWith('Keep the x coefficient')||
    label==='Leave the x-coefficient unchanged.')return a;
  if(label.startsWith("Use the second equation's y coefficient"))return a*d;
  if(label==='Halve the x-coefficient when the y-coefficient doubles.')return a/2;
  if(label==='Double the y-coefficient and report that as k.')return d;
  if(label==='Change sign when scaling the x-coefficient.')return -a*d/b;
 }
 if(n>=37){
  const {a,b,c,e,u,v}=data,root=(b*u-a*v)/(2*a-b);
  const f={
   'Move the constant term 2v with the wrong sign.':(b*u+a*v)/(2*a-b),
   'Reverse the difference when isolating k.':-root,
   'Match x-coefficients and constants without checking the y-coefficients.':a*e/c-u,
   'Match y-coefficients and constants without checking the x-coefficients.':(b*e/c-v)/2,
   'Equate the two new coefficients instead of comparing their ratios.':u-v
  };
  if(Object.hasOwn(f,label))return f[label];
 }
 throw Error(q.sourceId+' option '+choice.id+' has no auditable causal error route: '+label);
}
test('Simultaneous revised wrong options: all 200 have a source-specific causal arithmetic reproduction',()=>{
 assert.equal(questions.length,40);
 let tested=0;
 for(const q of questions){
  assert.equal(q.dailyEligible,false,'No academic approval implied by wrong-option arithmetic');
  const source=sourceQuantities(q);
  assert.equal(q.options.length,6);
  for(const choice of q.options.filter(o=>o.id!==q.correctOptionId)){
   const actual=numeric(choice.latex);
   const reproduced=modelMisconception(q,choice,source);
   assert.ok(near(actual,reproduced),q.sourceId+' '+choice.id+': '+choice.errorPath+
    '\nActual '+actual+' but stated wrong operation yields '+reproduced);
   tested++;
  }
 }
 assert.equal(tested,200);
});
test('Q11 F must identify 29 as cleared-denominator total, not original equation RHS 29/4',()=>{
 const q=questions.find(q=>q.sourceId==='LUX-MATH-Y9-SIMULTANEOUS-011');
 assert.ok(q);
 const source=sourceQuantities(q),option=q.options.find(o=>o.id==='F');
 assert.equal(source.first,29/4);
 assert.equal(source.firstCleared,29);
 assert.equal(numeric(option.latex),29);
 assert.match(option.errorPath,/Clear the common denominator/);
 assert.doesNotMatch(option.errorPath,/^Give the first equation’s right-hand side\.$/);
 assert.equal(q.dailyEligible,false);
});
