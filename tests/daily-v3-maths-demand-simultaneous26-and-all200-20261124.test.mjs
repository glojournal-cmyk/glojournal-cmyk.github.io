import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const blob=p=>{const c=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(c)+'\0').update(c).digest('hex')};
const reg=read('qa-staging/math-all200-post-demand-upgrade-candidate-register-20261124.json');
const prior=read(reg.sourceRegister);
const p=read('qa-staging/math-demand-upgrade-simultaneous26-20261124.json');
const near=(a,b)=>Math.abs(a-b)<1e-8,R=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i),sum=a=>a.reduce((s,x)=>s+x,0);
const S=(a,b,c,d,e,f)=>[(c*e-b*f)/(a*e-b*d),(a*f-c*d)/(a*e-b*d)];
const val=s=>{let m=s.match(/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/);if(m)return(m[1]?-1:1)*Number(m[2])/Number(m[3]);m=s.match(/^(\d+):(\d+)$/);if(m)return Number(m[1])/Number(m[2]);return Number(s)};
test('all 92 original difficulty holds mapped to source-linked current candidates; 200 unique IDs remain unapproved',()=>{
 assert.equal(blob(reg.sourceRegister),reg.sourceRegisterBlobSha);
 assert.equal(reg.rows.length,200);assert.equal(new Set(reg.rows.map(q=>q.sourceId)).size,200);
 const old=prior.rows.filter(q=>q.difficultyDisposition==='BENCHMARK_OR_DIFFICULTY_REVIEW');
 assert.equal(old.length,92);
 const found=new Set();
 for(const pack of reg.packs){assert.equal(blob(pack.path),pack.sha);const data=read(pack.path);assert.equal(data.questions.length,pack.count);for(const q of data.questions){
  assert.ok(!found.has(q.sourceId));found.add(q.sourceId);
  const o=old.find(x=>x.sourceId===q.sourceId),current=reg.rows.find(x=>x.sourceId===q.sourceId);assert.ok(o&&current);
  assert.equal(q.replacesSelectedRevisionId,o.proposedFinalRevisionId);
  assert.equal(current.latestCandidateRevisionId,q.revisionId);assert.equal(current.latestCandidateRecordPath,pack.path);assert.equal(current.latestCandidateBlobSha,pack.sha);
  assert.equal(q.options.length,6);assert.equal(new Set(q.options.map(o=>o.latex)).size,6);assert.equal(q.options.filter(o=>o.errorPath).length,5);
  assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,q.correctAnswerLatex);
  assert.equal(q.academicQA,'pending');for(const f of ['dailyEligible','masteryEligible','independentGradeCalibrated','teacherTaughtConfirmed','conceptFamilyIndependentlyApproved'])assert.equal(q[f],false);
 }}
 assert.deepEqual([...found].sort(),old.map(q=>q.sourceId).sort());
 for(const row of reg.rows){assert.equal(row.academicApproval,false);assert.equal(row.importAllowed,false);assert.equal(row.dailyEligible,false);assert.equal(row.masteryEligible,false);if(!found.has(row.sourceId))assert.equal(row.latestCandidateRevisionId,row.proposedFinalRevisionId);}
 assert.equal(reg.counts.formalApprovals,0);
});
test('rederive 26 simultaneous keys and check all numeric choices are distinct',()=>{
 const e={};let [x,y]=S(3,2,16,1,-2,0);e[2]=(x-4)**2+(y-8)**2;
 const A=(22-3)/2,B=24-A,C=30-B;assert.ok(near(A+(A+C)/2,22));e[3]=B/C;
 const nums=R(1,9).flatMap(a=>R(1,9).filter(b=>9*(b-a)===27&&a*b===28).map(b=>10*a+b));assert.deepEqual(nums,[47]);e[4]=nums[0];
 [x,y]=S(7,4,31,3,-2,5);e[7]=(23*x+2*y)/(-x-8*y);
 const [n,f]=S(1,1,120,24,36,3600);e[8]=f+Math.max(...R(0,n).filter(i=>12*i<=180&&n-i>=42));
 const ks9=R(1,60).filter(k=>{const [x,y]=S(-1,5,0,2,3,k);return Number.isInteger(x)&&Number.isInteger(y)&&x>0&&y>0&&(x+y)%4===0});assert.deepEqual(ks9,[26,52]);e[9]=sum(ks9);
 const cs=R(-30,40).filter(c=>{const [x,y]=S(1,2,c,3,-2,12-c);return Number.isInteger(x)&&Number.isInteger(y)&&x>0&&y>0&&x+y>2&&x+y<=8&&y%3!==0});assert.deepEqual(cs,[5,7,11,13]);e[10]=sum(cs);
 const aa=(14-2*4)/2,bb=(17-3*2)/4;e[11]=(14/aa)*(17/bb)/2;
 [x,y]=S(2,1,11,1,-2,-2);const [u,v]=S(1,1,x+y,1,-1,3*(x*x-y*y)/(x+y));assert.ok(u>0&&v>0);e[12]=u*v;
 const singular=[-3,3].filter(k=>k*k-5===4&&4*k+4!==16);assert.deepEqual(singular,[-3]);e[15]=sum(singular);
 const ks16=R(1,12).filter(k=>{const [x,y]=S(2,1,9,k,-1,3);return Number.isInteger(x)&&Number.isInteger(y)&&x>0&&y>0&&x<y});assert.deepEqual(ks16,[4,10]);e[16]=sum(ks16);
 const [a,b]=S(3,2,740,2,5,970);e[17]=Math.max(...R(2,7).map(h=>a*h+b*(10-h)));
 const [lo,hi]=S(1,1,750,8,20,16*750),[lo2,hi2]=S(1,1,150,8,20,15.2*750-16*600);assert.ok(lo>=0&&hi>=0&&lo2>=0&&hi2>=0);e[18]=hi+hi2;
 const feasible=R(13,21).map(k=>({k,b:31-k,rev:93+2*k})).sort((a,b)=>Math.abs(a.rev-118)-Math.abs(b.rev-118));assert.equal(feasible[0].rev,119);e[19]=feasible[0].k*feasible[0].b;
 const [pen,book]=S(2,3,17,4,1,19);e[20]=Math.max(...R(3,7).filter(p=>p*pen*1.25+(10-p)*book*.8<=39.6+1e-9));
 const roots=[2,5];assert.equal(sum(roots),7);assert.equal(sum(roots.map(x=>x*x)),29);e[23]=sum(roots.map(x=>x**3));
 [x,y]=S(1,1,8,1,-1,2);e[24]=(x+y)*Math.sqrt(100/(x*x-y*y));
 const [box,part]=S(2,5,37,3,4,38);e[25]=Math.max(...R(1,30).filter(n=>4*n>=23&&box*n+part*23<=160));
 const [block,rod]=S(2,3,5.4,3,1,6);const [blocks,rods]=S(1,1,12,block,rod,12);assert.ok(near(blocks,4)&&near(rods,8));const ex=Math.max(...R(0,8).filter(i=>12.15+i*(block-rod)<=16));e[26]=Math.round(1000*(12.15+ex*(block-rod)));
 const [ageA,ageB]=S(1,1,48,1,-2,-3);e[27]=R(0,50).find(t=>ageA+t<=1.5*(ageB+t));
 const totals=R(1,150).flatMap(t=>R(1,t-1).filter(a=>a>=15&&t-a>=6&&5*(a-15)===2*t&&5*(a+6)===3*t).map(a=>t));assert.deepEqual(totals,[105]);e[28]=totals[0];
 [x,y]=S(3,2,16,1,-2,2);e[30]=x*x+y*y;
 const xx=R(-10,10).filter(x=>x*x+6-3*x===4);assert.deepEqual(xx,[1,2]);e[33]=sum(xx);
 [x,y]=S(1,2,11,3,-1,5);const [pp,qq]=S(x,y,10,-y,x,-5);e[34]=pp*pp+qq*qq;
 const oldx=45/7,oldy=30/7,k=(18-oldy)/oldx;[x,y]=S(k,1,18,1,2,22);e[35]=x/oldx;
 [x,y]=S(3,2,12,8,-1,18);e[37]=x+y;
 assert.equal(Object.keys(e).length,26);
 for(const q of p.questions){const n=Number(q.sourceId.slice(-3)),v=q.options.map(o=>val(o.latex));assert.ok(near(val(q.correctAnswerLatex),e[n]),q.sourceId);assert.ok(v.every(Number.isFinite));assert.ok(v.every((x,i)=>v.every((y,j)=>i===j||!near(x,y))),q.sourceId);assert.equal(v.filter(x=>near(x,e[n])).length,1);}
});
