// QA ONLY — source-stem-derived simultaneous solutions, not a teacher or grade certification.
import {graphNumber} from './math-v314-source-first-graphs40-audit.js';
export function auditSimultaneous40(questions) {
 const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
 const check=(x,m)=>{if(!x)throw Error('SIMULTANEOUS_SOURCE_QA: '+m)};
 const pair=stem=>{
  const m=stem.match(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/);check(!!m,'missing case system');
  const arr=m[1].split(/\\\\/).map(x=>x.trim()).filter(Boolean);
  check(arr.length===2,'exactly two equations required');
  return arr.map(s=>{const eq=s.split('=');check(eq.length===2,'bad equality '+s);return eq});
 };
 const coeff=(eq,k=0)=>{
  const [left,right]=eq,g=(x,y)=>graphNumber(left,{x,y,k}),c=g(0,0),a=g(1,0)-c,b=g(0,1)-c,d=graphNumber(right,{x:0,y:0,k})-c;
  check(near(g(2,3),c+2*a+3*b),'equation not linear');return [a,b,d];
 };
 const solve=(u,v)=>{const det=u[0]*v[1]-u[1]*v[0];check(Math.abs(det)>1e-8,'singular solve');return {x:(u[2]*v[1]-u[1]*v[2])/det,y:(u[0]*v[2]-u[2]*v[0])/det}};
 const noSol=stem=>{
  const e=pair(stem),u=coeff(e[0]),v0=coeff(e[1]),v1=coeff(e[1],1),det=v=>u[0]*v[1]-u[1]*v[0];
  check(!near(det(v1),det(v0)),'parameter coefficient is degenerate');
  const k=-det(v0)/(det(v1)-det(v0)),v=coeff(e[1],k);
  check(near(det(v),0),'k not singular');
  check(!(near(u[0]*v[2]-u[2]*v[0],0)&&near(u[1]*v[2]-u[2]*v[1],0)),'coincident not no-solution');
  return k;
 };
 const tickets=stem=>{
  const m=[...stem.matchAll(/(\d+) adult tickets and (\d+) child tickets costs? £(\d+)/g)];
  check(m.length===2,'two purchases not found');const rows=m.map(z=>z.slice(1).map(Number)),s=solve(rows[0],rows[1]);
  const t=stem.match(/(?:How much do|What is the price of) (\d+) adult ticket(?:s)? and (\d+) child ticket(?:s)?/);
  check(!!t,'target tickets not found');check(s.x>0&&s.y>0,'nonpositive ticket price');
  return {answer:Number(t[1])*s.x+Number(t[2])*s.y,solution:s};
 };
 const crates=stem=>{
  const masses=[...stem.matchAll(/total mass (\d+) kg/g)].map(m=>Number(m[1]));
  check(masses.length===2,'crate totals not found');
  const s=solve([3,2,masses[0]],[2,5,masses[1]]);
  check(s.x>0&&s.y>0,'nonpositive object mass');
  let a,b;
  if(stem.includes('one crate than one box'))[a,b]=[1,-1];
  else if(stem.includes('two crates exceed'))[a,b]=[2,-1];
  else if(stem.includes('one crate and two boxes'))[a,b]=[1,2];
  else if(stem.includes('three crates exceed'))[a,b]=[3,-1];
  else throw Error('Unrecognised crate question target');
  return {answer:a*s.x+b*s.y,solution:s};
 };
 const results=[];
 for(const q of questions) {
  const num=Number(q.sourceId.match(/SIMULTANEOUS-(\d+)$/)?.[1]);
  check(num>=1&&num<=40,'unknown question ID');
  check(q.dailyEligible===false,'unauthorised student credit');
  check(q.options?.length===6&&q.options.map(o=>o.id).join('')==='ABCDEF','options not A-F');
  let answer,solution=null,method;
  if((num>=5&&num<=8)||(num>=17&&num<=20)){const v=tickets(q.stem);answer=v.answer;solution=v.solution;method='ticket-price system and third combination';}
  else if(num>=25&&num<=28){const v=crates(q.stem);answer=v.answer;solution=v.solution;method='crate and box real-world linear system';}
  else if((num>=13&&num<=16)||(num>=37&&num<=40)){answer=noSol(q.stem);method='parallel but not coincident coefficient condition';}
  else if(num>=33&&num<=36){
   const eqs=pair(q.stem),a=coeff(eqs[0]),v0=coeff(eqs[1]),v1=coeff(eqs[1],1);
   check(q.stem.includes('x=2y+1')&&near(a[0],3)&&near(a[1],2),'unknown k constrained source changed');
   const y=(a[2]-a[0])/(2*a[0]+a[1]),x=2*y+1,dk=v1[0]-v0[0];
   check(Math.abs(dk)>1e-8&&Math.abs(x)>1e-8,'k not identifiable');
   answer=(v0[2]-v0[0]*x-v0[1]*y)/(dk*x);solution={x,y};method='x=2y+1 and unknown coefficient';
  }else {
   const es=pair(q.stem).map(e=>coeff(e)),s=solve(es[0],es[1]);solution=s;
   if(num<=4)answer=s.x*s.x+s.y;
   else if(num<=12)answer=s.x*s.y;
   else if(num<=24)answer=2*s.x*s.x-s.y;
   else if(num<=32){
    const target=q.stem.match(/then find \$([^$]+)\$/);check(!!target,'derived linear request missing');
    answer=graphNumber(target[1],s);
   }else throw Error('Unhandled simultaneous '+num);
   method='2x2 elimination and evaluated output';
  }
  check(Number.isFinite(answer),'nonfinite expected answer '+num);
  const values=q.options.map(o=>({id:o.id,value:graphNumber(o.latex),error:o.errorPath||''}));
  const correct=values.filter(o=>near(o.value,answer)).map(o=>o.id);
  check(correct.length===1,'zero or multiple correct A-F '+num+': '+JSON.stringify({answer,values,correct}));
  check(correct[0]===q.correctOptionId,'incorrect stored answer key '+num);
  check(near(graphNumber(q.correctAnswerLatex),answer),'incorrect printed numeric answer '+num);
  results.push({sourceId:q.sourceId,key:correct[0],answer,solution,method,numericAlternativesDistinct:new Set(values.map(v=>v.value.toPrecision(12))).size===6,wrongOptionPaths:values.filter(v=>v.id!==correct[0]&&v.error.length>=12).length,values:values.map(v=>v.value)});
 }
 check(results.length===40,'40 original sources not all covered');return results;
}
