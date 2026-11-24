import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const blob=p=>{const c=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(c)+'\0').update(c).digest('hex')};
const p=read('qa-staging/math-demand-upgrade-changing-subject18-20261124.json'),reg=read(p.sourceRegister);
const R=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i),sum=a=>a.reduce((s,x)=>s+x,0),near=(a,b)=>Math.abs(a-b)<1e-9;
const F=(a,b)=>'\\frac{'+a+'}{'+b+'}';
test('18 original difficulty holds replaced; source links and credit gates intact',()=>{
 assert.equal(blob(p.sourceRegister),p.sourceRegisterBlobSha);
 const prior=reg.rows.filter(q=>q.topicId==='math-y9-changing-subject'&&q.difficultyDisposition==='BENCHMARK_OR_DIFFICULTY_REVIEW');
 assert.equal(prior.length,18);assert.deepEqual(p.questions.map(q=>q.sourceId).sort(),prior.map(q=>q.sourceId).sort());
 for(const q of p.questions){
  const old=prior.find(x=>x.sourceId===q.sourceId);
  assert.equal(q.replacesSelectedRevisionId,old.proposedFinalRevisionId);assert.equal(q.provisionalConceptFamily,old.provisionalSharedMasteryFamily);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.equal(q.options.filter(o=>o.errorPath).length,5);
  assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,q.correctAnswerLatex);
  assert.equal(q.academicQA,'pending');
  for(const f of ['dailyEligible','masteryEligible','independentGradeCalibrated','teacherTaughtConfirmed','studentMisconceptionsEmpiricallyVerified','conceptFamilyIndependentlyApproved'])assert.equal(q[f],false);
 }
});
test('rederive all eighteen keys and check permitted inverse branches',()=>{
 const e={};
 const d=7,r=3.5,A=d=>Math.PI*(2*r*d+d*d);assert.ok(near(A(d),98*Math.PI)&&near(A(2*d),3*A(d)));e[4]=F(21,2);
 const y8=R(1,10).filter(y=>R(1,8).filter(x=>Math.abs(2*x-6)===y).length===2);assert.deepEqual(y8,[2,4]);e[8]=String(sum(y8));
 const t=p=>(3*p+12)/(p+2);assert.ok(near(t(2)+t(4),8.5)&&near(t(6),15/4));e[10]=F(15,4);
 const h=x=>1+18/(x+2),roots=[3-Math.sqrt(7),3+Math.sqrt(7)];assert.ok(roots.every(x=>x>0&&near(h(x)-h(2*x),1))&&near(roots[0]*roots[1],2));e[13]='2';
 const ks=R(-20,20).filter(k=>k!==3&&(k-3)*k+2*k===12);assert.deepEqual(ks,[-3,4]);e[15]=String(sum(ks.map(k=>k*k)));
 for(const a of [2,3,4,4.001,5,5.999,6,7]){const x4=2/(a-4),x2=-2/(a-2);const valid=Number.isFinite(x4)&&x4>0&&x2>-1&&x2<-.5;assert.equal(valid,a>4&&a<6);if(valid)assert.ok(near((a*x4+6)/(x4+2),4)&&near((a*x2+6)/(x2+2),2));}e[16]='4<a<6';
 const y23=x=>(3.5*x+5)/(x+1),xs23=R(1,30).filter(x=>y23(x)>=3.6-1e-10&&y23(x)<=3.75+1e-10);assert.deepEqual(xs23,R(5,14));e[23]=String(sum(xs23));
 const h25=x=>1+6/Math.sqrt(2*x+4);assert.ok(near(h25(2)-1,2*(h25(14)-1))&&near(h25(14),1+3*Math.sqrt(2)/4));e[25]='1+\\frac{3\\sqrt{2}}{4}';
 const xs26=R(1,30).filter(x=>Number.isInteger(Math.sqrt(x+1))&&2-3/Math.sqrt(x+1)>=0&&2-3/Math.sqrt(x+1)<=1);assert.deepEqual(xs26,[3,8]);e[26]=String(sum(xs26));
 const inv27=t=>(16/t**2-1)/3;assert.ok(near(inv27(2/3)-inv27(4/3),9));e[27]=String(2/3+4/3);
 const bad28=R(-2,8).filter(y=>{if(y===3)return false;const x=1+4/(y-3)**2;return Number.isInteger(x)&&x>1&&!near(3+2/Math.sqrt(x-1),y)});assert.deepEqual(bad28,[1,2]);e[28]=String(sum(bad28));
 const h30=x=>2+10*(x+1)/(2*x+3);assert.ok(near(h30(1),6)&&near(h30(3)-h30(2),10/63));e[30]='2';
 const xs31=R(1,100).filter(x=>x%4===0&&1+(4*x+2)/(x+3)>=4&&1+(4*x+2)/(x+3)<=4.5);assert.deepEqual(xs31,[8,12,16]);e[31]=String(sum(xs31));
 const ys34=R(-5,5).filter(y=>{if(y===2)return false;const x=(2*y-2)/(2-y);return Number.isInteger(x)&&x!==-1&&x!==-2&&near(2/(1+1/(x+1)),y)});assert.deepEqual(ys34,[1,3,4]);e[34]=String(sum(ys34));
 const ys35=R(-4,8).filter(y=>{if(y===3)return false;const x=(6-5*y)/(2*y-6);return Number.isInteger(x)&&x!==-1&&x!==-2.5&&near(6/(2+3/(x+1)),y)});assert.deepEqual(ys35,[2,4,6]);e[35]=String(sum(ys35));
 const h36=x=>1+2/(1+3/x);assert.ok(near(h36(3)+h36(-6),7));e[36]=String(3*(-6));
 const xs39=R(-46,44).filter(x=>x!==-1&&Number.isInteger(2+Math.sqrt((4*x+49)/(x+1))));assert.deepEqual(xs39,[-16,0,8]);e[39]=String(sum(xs39));
 const ns40=R(1,50).filter(n=>Number.isInteger(Math.sqrt(9+4*n)));assert.deepEqual(ns40,[4,10,18,28,40]);e[40]=String(sum(ns40));
 assert.equal(Object.keys(e).length,18);
 for(const q of p.questions)assert.equal(q.correctAnswerLatex,e[Number(q.sourceId.slice(-3))],q.sourceId);
});
