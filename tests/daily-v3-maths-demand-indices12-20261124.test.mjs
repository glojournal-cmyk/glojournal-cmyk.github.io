import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const blob=p=>{const c=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(c)+'\0').update(c).digest('hex')};
const p=read('qa-staging/math-demand-upgrade-indices12-20261124.json');
const reg=read(p.sourceRegister);
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>i+a);
const sum=a=>a.reduce((s,x)=>s+x,0);
const near=(a,b)=>Math.abs(a-b)<1e-8;
test('12 original indices difficulty holds replaced; source links and credit gates preserved',()=>{
 assert.equal(blob(p.sourceRegister),p.sourceRegisterBlobSha);
 const prior=reg.rows.filter(q=>q.topicId==='math-y9-indices'&&q.difficultyDisposition==='BENCHMARK_OR_DIFFICULTY_REVIEW');
 assert.equal(prior.length,12);
 assert.deepEqual(p.questions.map(q=>q.sourceId).sort(),prior.map(q=>q.sourceId).sort());
 for(const q of p.questions){
  const old=prior.find(x=>x.sourceId===q.sourceId);
  assert.equal(q.replacesSelectedRevisionId,old.proposedFinalRevisionId);
  assert.equal(q.provisionalConceptFamily,old.provisionalSharedMasteryFamily);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.equal(q.options.filter(o=>o.errorPath).length,5);
  assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,q.correctAnswerLatex);
  assert.equal(q.academicQA,'pending');
  for(const f of ['dailyEligible','masteryEligible','independentGradeCalibrated','teacherTaughtConfirmed','studentMisconceptionsEmpiricallyVerified','conceptFamilyIndependentlyApproved'])assert.equal(q[f],false);
 }
});
test('rederive 12 upgraded keys and verify constraints',()=>{
 const e={};
 const n2=range(0,18).filter(n=>3*n-16>0&&3*n-16<=23&&(20+n)%2===0&&(18-n)%3!==0);assert.deepEqual(n2,[8,10]);e[2]=String(sum(n2));
 const pairs15=range(-20,20).flatMap(n=>range(-20,20).filter(k=>7*n-2*k===22&&n+k===7).map(k=>[n,k]));assert.deepEqual(pairs15,[[4,3]]);e[15]='('+pairs15[0].join(',')+')';
 const pairs18=range(1,5).flatMap(n=>range(0,n-1).filter(m=>3**(n+2)-3**n+3**(m+1)-3**m===702).map(m=>[n,m]));assert.deepEqual(pairs18,[[4,3]]);e[18]=String(sum(pairs18[0].map(n=>2**n)));
 const E=t=>(5**(t+2)+5**(t+1))/5**(2*t);const n20=(5-3)/2,m20=(5+3)/2;assert.ok(near(E(n20)*E(m20),36/125)&&near(E(n20)/E(m20),125));e[20]=String(n20*n20+m20*m20);
 const y=Math.sqrt(8/2),x=2*y;assert.equal(x*x/y**3,2);assert.equal(x**3/y**2,16);e[21]=String(x*x+y*y);
 const opts23=[['(x^{-6}y^{-9})^{-1/4}',(x,y)=>(x**-6*y**-9)**-.25],['(x^{-6}y^{-9})^{-1/2}',(x,y)=>(x**-6*y**-9)**-.5],['(x^{-6}y^{-9})^{1/4}',(x,y)=>(x**-6*y**-9)**.25],['(x^{-6}y^{-8})^{-1/4}',(x,y)=>(x**-6*y**-8)**-.25],['(x^{-4}y^{-9})^{-1/4}',(x,y)=>(x**-4*y**-9)**-.25],['(x^{-2}y^{-3})^{-1/4}',(x,y)=>(x**-2*y**-3)**-.25]];
 const samples=[1,2,4,8].map(x=>[x,(16/x**2)**(1/3)]);const valid23=opts23.filter(([s,f])=>samples.every(([x,y])=>near(f(x,y),8)));assert.equal(valid23.length,1);e[23]=valid23[0][0];
 const pairs26=range(0,6).flatMap(n=>range(0,10).filter(m=>3*n+2*m===20).map(m=>[n,m]));const mx=Math.max(...pairs26.map(([n,m])=>n*m));const best=pairs26.filter(([n,m])=>n*m===mx);assert.deepEqual(best,[[4,4]]);e[26]=String(2**(3*best[0][0]-2*best[0][1]-3));
 const p29=(1-10)/3,q29=10+p29,H=(n,p,q)=>Math.sqrt(2**(4*n+6))*8**(1-n)/2**(p*n+q);assert.ok(near(H(2,p29,q29),8)&&near(H(-1,p29,q29),1/8));e[29]=String(p29*q29);
 e[34]=String(Math.min(...range(-20,20).flatMap(a=>range(-20,20).filter(b=>a&&b&&12*a+8*b===0).map(b=>a*a+b*b))));
 const ab=range(1,30).flatMap(a=>range(1,30).filter(b=>a>b&&3*a-2*b===6).map(b=>[a,b]));assert.deepEqual(ab,[[4,3]]);e[35]=String(sum(ab[0].map(n=>2**n)));
 const c=n=>Math.min(...range(0,5).flatMap(a=>range(0,5).filter(b=>(4*n+2+a)%6===0&&(n+1+b)%6===0).map(b=>a+b)));
 const costs=range(0,10).map(c);assert.deepEqual(costs,[9,4,5,6,1,2,9,4,5,6,1]);e[39]=String(sum(range(0,10).filter(n=>costs[n]===Math.min(...costs))));
 const n40=(25-5)/20,G=n=>2**(2*n*n-3*n+8);assert.ok(near(G(n40-3)/G(n40+2),32));e[40]=String(G(n40));
 assert.equal(Object.keys(e).length,12);
 for(const q of p.questions)assert.equal(q.correctAnswerLatex,e[Number(q.sourceId.slice(-3))],q.sourceId);
});
