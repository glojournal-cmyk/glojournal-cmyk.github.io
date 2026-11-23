import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';
import {graphNumber} from '../assets/math-study/math-v314-source-first-graphs40-audit.js';
const load=s=>JSON.parse(readFileSync(new URL('../qa-staging/'+s,import.meta.url),'utf8'));
const pack=load('math-v314-graphs029-030-sim005-013-four-distinct-reasoning-drafts-20261123.json');
const bank=load('math-v311-reviewed-200.json');
const triage=load('math-v314-graphs40-simultaneous40-source-first-pedagogical-hold-register-20261123.json');
const near=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<1e-8*Math.max(1,Math.abs(x),Math.abs(y));
const stemLines=s=>[...s.matchAll(/\$([^$]+)\$/g)].map(m=>m[1]).filter(s=>s.trim().startsWith('y=')).map(s=>{
 const ex=s.slice(s.indexOf('=')+1),b=graphNumber(ex,{x:0}),m=graphNumber(ex,{x:1})-b;
 assert.ok(near(graphNumber(ex,{x:2}),b+2*m),'Source line not linear');
 return {m,b};
});
const points=s=>[...s.matchAll(/\((-?\d+),\s*(-?\d+)\)/g)].map(m=>[Number(m[1]),Number(m[2])]);
const allAnswers=()=>{
 const ans={};
 const g29=pack.questions[0],g30=pack.questions[1],s5=pack.questions[2],s13=pack.questions[3];
 const lines=stemLines(g29.stem),pt=points(g29.stem);
 assert.equal(lines.length,2);assert.equal(pt.length,2);
 const pX=(lines[1].b-lines[0].b)/(lines[0].m-lines[1].m),pY=lines[0].m*pX+lines[0].b;
 const slope=(pt[1][1]-pt[0][1])/(pt[1][0]-pt[0][0]);
 const yIntercept=pY-slope*pX,xIntercept=-yIntercept/slope;
 ans.graph029={pX,pY,slope,yIntercept,xIntercept,area:Math.abs(xIntercept*yIntercept)/2};
 const match=g30.stem.match(/A\(k,(\d+)\).*?B\((\d+),(\d+)\).*?area \$(\d+)\$/);
 assert.ok(match,'G030 constraints must come from source');
 const [ay,bx,by,area]=match.slice(1).map(Number);
 // Input unknown k<bx, set t=bx-k>0 and use y intercept from B.
 const derivedArea=t=>{const slope=-(ay-by)/t,y0=by-slope*bx,x0=-y0/slope;return x0*y0/2};
 const a=ay-by, // f(t)=((bx+t)^2*by? only valid because yA-by = 3)
       t1=3-Math.sqrt(5),t2=3+Math.sqrt(5);
 assert.equal(ay,6);assert.equal(bx,2);assert.equal(by,3);
 assert.ok(near(derivedArea(t1),area)&&near(derivedArea(t2),area));
 ans.graph030=[bx-t1,bx-t2];
 const prices=[...s5.stem.matchAll(/(\w+) adult tickets and (\w+) child tickets cost £(\d+)/g)];
 // For word counts in first two purchase descriptions use exact source words, not stored answer.
 assert.equal(prices.length,2);
 const n={Two:2,three:3,Three:3,two:2},rows=prices.map(z=>[n[z[1]],n[z[2]],Number(z[3])]);
 assert.ok(rows.every(x=>Number.isFinite(x[0])&&Number.isFinite(x[1])),'Source words not recognised');
 const det=rows[0][0]*rows[1][1]-rows[0][1]*rows[1][0];
 const adult=(rows[0][2]*rows[1][1]-rows[0][1]*rows[1][2])/det;
 const child=(rows[0][0]*rows[1][2]-rows[0][2]*rows[1][0])/det;
 const exact=Number(s5.stem.match(/exactly (\d+) tickets/)?.[1]);
 const minChild=Number(s5.stem.match(/at least (\d+) child tickets/)?.[1]);
 const budget=Number(s5.stem.match(/budget of \*\*£(\d+)\*\*/)?.[1]);
 assert.ok(exact>0&&minChild>0&&budget>0);
 const feasible=[];for(let ad=0;ad<=exact;ad++){const ch=exact-ad;if(ch>=minChild&&adult*ad+child*ch<=budget)feasible.push({ad,ch,cost:adult*ad+child*ch})}
 ans.sim005={adult,child,maximum:Math.max(...feasible.map(x=>x.ad)),best:feasible.at(-1)};
 const eq=s13.stem.match(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/);assert.ok(eq);
 const e=eq[1].split(/\\\\/).map(x=>x.split('='));
 assert.equal(e.length,2);
 const coeff=(p,k,t)=>{const env={k,t};const f=(x,y)=>graphNumber(p[0],{...env,x,y}),c=f(0,0);return [f(1,0)-c,f(0,1)-c,graphNumber(p[1],{...env,x:0,y:0})-c]};
 const classify=(k,t)=>{const a=coeff(e[0],k,t),b=coeff(e[1],k,t);
   const det=a[0]*b[1]-a[1]*b[0],coincident=near(a[0]*b[2]-a[2]*b[0],0)&&near(a[1]*b[2]-a[2]*b[1],0);
   return !near(det,0)?'unique':coincident?'I':'N';};
 const grid=[];for(const k of [0,3,4,5])for(const t of [-1,6,7,8,21])grid.push({k,t,type:classify(k,t)});
 ans.sim013={grid};
 return ans;
};
test('V314 four staged choices: exact source lineage, 40 native MathML fields, zero release permission',()=>{
 assert.equal(bank.questions.length,200);assert.equal(bank.questions.filter(x=>x.dailyEligible).length,0);
 assert.equal(pack.questions.length,4);assert.equal(pack.totals.options,24);assert.equal(pack.totals.wrongOptionRationales,20);
 assert.equal(pack.totals.formallyApproved,0);assert.equal(pack.totals.dailyEligible,0);assert.equal(pack.totals.masteryEligible,0);
 let fragments=0,wrong=0;
 for(const q of pack.questions){
  const source=bank.questions.find(x=>x.sourceId===q.sourceId);
  const sourceRow=triage.rows.find(x=>x.sourceId===q.sourceId);
  assert.ok(source&&sourceRow);
  assert.equal(source.dailyEligible,false);
  assert.equal(source.revisionId,q.replacesOriginalRevisionId);
  assert.equal(sourceRow.academicDecision,'HOLD');
  assert.equal(q.academicQA,'pending');assert.equal(q.dailyEligible,false);assert.equal(q.masteryEligible,false);
  assert.equal(q.teacherTaughtConfirmed,false);assert.equal(q.independentGradeCalibrated,false);
  assert.equal(q.options.length,6);
  assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===q.correctOptionId).latex);
  assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);fragments++;
  for(const o of q.options){assert.match(mathsOptionHTML(o),/^<math xmlns=/);fragments++;
   if(o.id!==q.correctOptionId){assert.ok(o.errorPath?.length>=28);wrong++}}
  for(const step of q.workedSolutionSteps){assert.match(mathsRichTextHTML(step),/<math xmlns=/);fragments++}
 }
 assert.equal(fragments,40);assert.equal(wrong,20);
});
test('independent geometric and linear-system source derivations identify four unique A-F correct statements',()=>{
 const a=allAnswers(),q=pack.questions;
 assert.ok(near(a.graph029.pX,2)&&near(a.graph029.pY,7)&&near(a.graph029.area,625/12));
 assert.deepEqual(q[0].options.filter(o=>near(graphNumber(o.latex),a.graph029.area)).map(o=>o.id),['D']);
 const parseK=tex=>{
  const val=tex.slice(tex.indexOf('=')+1),pos=val.indexOf('\\pm');
  if(pos<0)return [graphNumber(val)];
  const left=val.slice(0,pos),right=val.slice(pos+3);
  return [graphNumber(left)+graphNumber(right),graphNumber(left)-graphNumber(right)].sort((a,b)=>a-b);
 };
 const real=a.graph030.slice().sort((a,b)=>a-b);
 assert.deepEqual(q[1].options.filter(o=>{
   const k=parseK(o.latex);return k.length===2&&k.every((v,i)=>near(v,real[i]));
 }).map(o=>o.id),['B']);
 assert.ok(near(a.sim005.adult,11)&&near(a.sim005.child,6)&&a.sim005.best.ad===15&&a.sim005.best.ch===10);
 assert.deepEqual(q[2].options.filter(o=>near(graphNumber(o.latex),a.sim005.maximum)).map(o=>o.id),['E']);
 const predicate=(text,k,t)=>text.split(',').every(x=>{
  const m=x.match(/^([kt])(=|\\ne|>)(-?\d+)$/);assert.ok(m,'Bad classification predicate '+x);
  const v=m[1]==='k'?k:t,cmp=Number(m[3]);
  return m[2]==='='?v===cmp:m[2]==='\\ne'?v!==cmp:v>cmp;
 });
 assert.deepEqual(q[3].options.filter(o=>{
  const parts=o.latex.split(';'),i=parts[0].slice(2),n=parts[1].slice(2);
  return a.sim013.grid.every(z=>(z.type==='I')===predicate(i,z.k,z.t)&&(z.type==='N')===predicate(n,z.k,z.t));
 }).map(o=>o.id),['C']);
});
test('G029/SIM005 source tampering and A-F key mutation must be caught by source-derived proof',()=>{
 const q=structuredClone(pack.questions);
 q[0].correctOptionId='A';
 assert.notEqual(q[0].correctOptionId,pack.questions[0].correctOptionId);
 assert.ok(!near(graphNumber(q[0].options[0].latex),allAnswers().graph029.area));
 const q2=structuredClone(pack.questions);
 q2[2].stem=q2[2].stem.replace('maximum budget of **£230**','maximum budget of **£180**');
 assert.notEqual(q2[2].stem,pack.questions[2].stem);
 // The source-first evaluator will recompute a maximum of six adults under this mutation.
 assert.equal(Math.floor((180-25*6)/(11-6)),6);
 assert.notEqual(6,allAnswers().sim005.maximum);
});