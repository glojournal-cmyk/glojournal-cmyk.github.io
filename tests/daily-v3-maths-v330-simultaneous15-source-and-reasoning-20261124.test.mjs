import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const blob=p=>{const c=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(c)+'\0').update(c).digest('hex')};
const p=read('qa-staging/math-v330-simultaneous15-reasoning-replacements-20261124.json');
const bank=read(p.sourceBankPath),old=read(p.priorV323Register),v4=read(p.priorV324Pack);
const solve=(a,b,c,d,e,f)=>{const det=a*e-b*d;assert.notEqual(det,0);return [(c*e-b*f)/det,(a*f-c*d)/det]};
const near=(a,b)=>Math.abs(a-b)<1e-9;
test('V330 completes simultaneous equations source draft coverage while withholding credit',()=>{
 assert.equal(blob(p.sourceBankPath),p.sourceBankBlobSha);
 assert.equal(bank.questions.length,200);
 const originals=old.rows.filter(q=>q.topicId==='math-y9-simultaneous-equations');
 assert.equal(originals.length,40);
 const pending=originals.filter(q=>q.candidateAudit.sourceIdVariants===0&&!v4.questions.some(x=>x.sourceId===q.sourceId)).map(q=>q.sourceId).sort();
 assert.equal(pending.length,15);
 assert.deepEqual(p.questions.map(q=>q.sourceId).sort(),pending);
 assert.equal(p.optionsCount,90);assert.equal(p.wrongOptionExplanationsCount,75);
 for(const q of p.questions){
  const s=bank.questions.find(x=>x.sourceId===q.sourceId);
  assert.ok(s);assert.equal(q.replacesOriginalRevisionId,s.revisionId);assert.notEqual(q.stem,s.stem);assert.equal(q.topicId,s.topicId);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.equal(q.options.filter(o=>o.errorPath).length,5);assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,q.correctAnswerLatex);assert.equal(q.workedSolutionSteps.length,3);assert.equal(q.academicQA,'pending');
  for(const flag of ['dailyEligible','masteryEligible','independentGradeCalibrated','teacherTaughtConfirmed','studentMisconceptionsEmpiricallyVerified','conceptFamilyIndependentlyApproved'])assert.equal(q[flag],false);
 }
 for(const flag of ['academicApprovals','dailyEligible','masteryEligible'])assert.equal(p[flag],0);
});
test('V330 independently derives fifteen simultaneous equation keys and checks context/domain constraints',()=>{
 const e={};
 const [a,c]=solve(2,3,39,3,2,36/.8);assert.ok(a>0&&c>0);e['006']=String(4*a+c);
 const [x7,y7]=solve(7,4,31,3,-2,5);e['007']=String(Math.round(17*x7+6*y7));
 const [n8,f8]=solve(1,1,120,24,36,3600);assert.ok(Number.isInteger(n8)&&Number.isInteger(f8)&&n8>=10);e['008']=(n8-10)/10+':'+(f8+10)/10;
 assert.equal(2*6-3*4,0);assert.equal(2*8,16);e['015']='\\text{Infinitely many solutions only when }k=4';
 const x16=9/3,k16=(3+x16)/x16;assert.ok(near(2*x16+x16,9)&&near(k16*x16-x16,3));e['016']=String(k16);
 const [a17,b17]=solve(3,2,740,2,5,970);assert.ok(Number.isInteger(a17)&&Number.isInteger(b17)&&a17>0&&b17>0);e['017']=String(4*(a17+b17));
 const [a18,b18]=solve(1,1,750,8,20,16*750);assert.ok(a18>=0&&b18>=0);e['018']=String(b18);
 const pairs=[];for(let b=0;b<=31;b++)if(3*b+5*(31-b)===118)pairs.push(b);assert.equal(pairs.length,0);e['019']='\\text{Impossible with whole-number quantities}';
 const [p20,n20]=solve(2,3,17,4,1,19);e['020']=String(3*p20*1.25+2*n20*.8);
 e['023']=String((7**2-29)/2);assert.equal(2+5,7);assert.equal(2**2+5**2,29);
 const [b25,p25]=solve(2,5,37,3,4,38);e['025']=String(b25+p25);
 e['037']='('+(3*(6/2)-1)+','+12*(6/2)+')';
 for(const k of [-5,0,1.2,1.6,5/3,2,10]){const [x,y]=solve(1,1,6,k,1,10);assert.equal(x>1e-9&&y>1e-9,k>5/3);}e['038']='k>\\frac{5}{3}';
 const roots39=[(-2+Math.sqrt(4+60))/2,(-2-Math.sqrt(4+60))/2];assert.ok(roots39.every(x=>x*(x+2)===15));e['039']=String(roots39.reduce((a,b)=>a+b,0));
 const roots40=[2,-2].map(d=>solve(1,1,8,1,-1,d));assert.ok(roots40.every(([x,y])=>x+y===8&&Math.abs(x-y)===2));e['040']=String(roots40.reduce((s,[x])=>s+x*x,0));
 assert.equal(Object.keys(e).length,15);
 for(const q of p.questions)assert.equal(q.correctAnswerLatex,e[q.sourceId.slice(-3)],q.sourceId);
});
