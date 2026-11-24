import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const blob=p=>{const c=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(c)+'\0').update(c).digest('hex')};
const p=read('qa-staging/math-demand-upgrade-straight-line-graphs20-20261124.json'),reg=read(p.sourceRegister);
const near=(a,b)=>Math.abs(a-b)<1e-9,R=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),sum=a=>a.reduce((s,x)=>s+x,0);
const dist=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
const area=(a,b,c)=>Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
const inter=(m,c,n,d)=>{const x=(d-c)/(m-n);return [x,m*x+c]};
const val=s=>{let m=s.match(/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/);if(m)return (m[1]?-1:1)*Number(m[2])/Number(m[3]);m=s.match(/^(\d+):(\d+)$/);if(m)return Number(m[1])/Number(m[2]);if(s==='2-\\frac{\\sqrt{10}}{5}')return 2-Math.sqrt(10)/5;if(s==='\\frac{\\sqrt{10}}{5}')return Math.sqrt(10)/5;if(s==='\\frac{2\\sqrt{10}}{5}')return 2*Math.sqrt(10)/5;return Number(s)};
test('twenty original graph difficulty holds replaced; source links and credit gates intact',()=>{
 assert.equal(blob(p.sourceRegister),p.sourceRegisterBlobSha);
 const prior=reg.rows.filter(q=>q.topicId==='math-y9-straight-line-graphs'&&q.difficultyDisposition==='BENCHMARK_OR_DIFFICULTY_REVIEW');
 assert.equal(prior.length,20);
 assert.deepEqual(p.questions.map(q=>q.sourceId).sort(),prior.map(q=>q.sourceId).sort());
 for(const q of p.questions){
  const old=prior.find(x=>x.sourceId===q.sourceId);
  assert.equal(q.replacesSelectedRevisionId,old.proposedFinalRevisionId);
  assert.equal(q.provisionalConceptFamily,old.provisionalSharedMasteryFamily);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  const values=q.options.map(o=>val(o.latex));assert.ok(values.every(Number.isFinite));
  assert.ok(values.every((v,i)=>values.every((w,j)=>i===j||!near(v,w))),q.sourceId);
  assert.equal(q.options.filter(o=>o.errorPath).length,5);
  assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,q.correctAnswerLatex);
  assert.equal(q.academicQA,'pending');
  for(const f of ['dailyEligible','masteryEligible','independentGradeCalibrated','teacherTaughtConfirmed','studentMisconceptionsEmpiricallyVerified','conceptFamilyIndependentlyApproved'])assert.equal(q[f],false);
 }
});
test('rederive twenty graph keys and check coordinate constraints and boundaries',()=>{
 const A=[11/5,27/5],B=[3,5];assert.ok(near((B[1]-A[1])/(B[0]-A[0]),-.5));
 const ks=R(2,15).filter(k=>{const m=(k+2)/(k-1);return m>1&&m<=1.75&&2-m<=2/3+1e-10});assert.deepEqual(ks,R(5,10));
 const P=[0,4.5],Q=[12,0];assert.equal(dist(P,[-2,1]),dist(P,[4,5]));assert.equal(area([0,0],P,Q),27);
 const ns=R(0,20).filter(n=>12+3*n+10<=4+5*n&&12+3*n<24+2*n&&12+3*n<=48);assert.deepEqual(ns,[9,10,11]);
 const a=t=>1.25*t+10,b=t=>1.5*t+5;assert.equal(a(8),20);assert.equal(a(24),40);assert.equal(a(40),60);assert.equal(b(32)-a(32),3);assert.ok(a(40.01)<1.5*40.01&&b(31.99)-a(31.99)<3);
 const k=2-Math.sqrt(10)/5,small=(2-k)*(6-3*k)/2,whole=area([0,1],[0,7],[2,5]);assert.ok(near(small/(whole-small),1/9));
 const counts=R(0,5).map(x=>R(2*x+2,14-x).filter(y=>(x+y)%2===0).length);assert.deepEqual(counts,[7,5,4,2,1,0]);
 const p17=[9/4,13/4],q17=[-13/4,-9/4];assert.ok(near(dist(p17,[0,0]),dist(p17,[6,2]))&&near(dist(p17,[0,0]),dist(q17,[0,0])));assert.notEqual(p17[0],q17[0]);
 const k19=R(1,10).filter(k=>R(-5,10).filter(x=>(x-2)**2+(k-3)**2===13).length===2);assert.deepEqual(k19,[1,5,6]);
 const good20=x=>Math.abs(dist([x,0],[2,3])-dist([x,0],[6,1]))<=20&&Math.abs(dist([x,0],[2,3])-dist([x,0],[-2,1]))<=12;assert.ok(good20(.5)&&good20(2.5)&&!good20(.499)&&!good20(2.501));
 const bs=[9-3*Math.sqrt(3),9+3*Math.sqrt(3)];assert.ok(bs.every(b=>b>0&&near(2/(36/b)+3/b,1)));
 const xs25=R(0,20).filter(x=>{const v=[2*x+3,5*x-9,4*x-5];return Math.max(...v)-Math.min(...v)<=6&&v[0]<Math.max(...v)});assert.deepEqual(xs25,[5,6]);
 const p28=inter(-1,7,2,-1);assert.ok(near(p28[1]-p28[0],5/3));
 const p33=inter(2,-2,-1,5);
 const p35=inter(-.75,6,.5,0),q35=inter(-.75,6,2,0);assert.ok(near(p35[0],2*p35[1])&&near(q35[1],2*q35[0]));
 const ns36=R(1,100).filter(n=>{const a=n<=5?6+2*n:n+11;return a<3*n&&a<20+.5*n});assert.deepEqual(ns36,R(6,17));
 const p37=[-2,-4],q37=[2,4];assert.equal(dist(p37,[-1,4]),dist(p37,[5,0]));assert.equal(dist(q37,[-1,4])-dist(q37,[5,0]),-16);
 const p38=[4,9],q38=[16,-9];assert.equal(area([0,0],[6,0],p38),area([0,0],[6,0],q38));
 const p39=[5,6];assert.ok(near(dist([1,2],p39)/dist(p39,[7,8]),4));
 const p40=inter(2,1,-1,7),q40=inter(2,1,1,4),r40=p40.map((v,i)=>v+3*(q40[i]-v));assert.deepEqual(r40,[5,11]);
 const e={3:area([0,0],A,B),4:sum(ks),5:dist([4,5],Q),10:sum(ns),11:40-32,14:k,15:sum(counts),17:q17[0],19:sum(k19),20:2.5-.5,23:sum(bs),25:sum(xs25),28:area([0,7],[0,5/3],p28),33:(2*p33[0]+2)*10,35:Math.sqrt(dist(p35,q35)/100),36:ns36.length,37:dist(p37,q37),38:(q38[1]-p38[1])/(q38[0]-p38[0]),39:11*11/2,40:(r40[1]+q40[1])/(r40[0]+q40[0])};
 assert.equal(Object.keys(e).length,20);
 for(const q of p.questions){const key=e[Number(q.sourceId.slice(-3))];assert.ok(near(val(q.correctAnswerLatex),key),q.sourceId);assert.equal(q.options.filter(o=>near(val(o.latex),key)).length,1,q.sourceId);}
});
