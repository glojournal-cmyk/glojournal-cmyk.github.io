import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const blob=p=>{const c=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(c)+'\0').update(c).digest('hex')};
const p=read('qa-staging/math-demand-upgrade-standard-form16-20261124.json'),reg=read(p.sourceRegister);
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const near=(a,b)=>Math.abs(a-b)<=1e-9*Math.max(Math.abs(b),1e-10);
const parse=s=>{const m=s.match(/^([1-9](?:\.\d+)?)\\times10\^\{(-?\d+)\}$/);assert.ok(m&&Number(m[1])<10,s);return Number(m[1])*10**Number(m[2])};
test('16 difficulty holds have source-linked replacements and all credit gates remain closed',()=>{
 assert.equal(blob(p.sourceRegister),p.sourceRegisterBlobSha);
 const prior=reg.rows.filter(q=>q.topicId==='math-y9-standard-form'&&q.difficultyDisposition==='BENCHMARK_OR_DIFFICULTY_REVIEW');
 assert.equal(prior.length,16);assert.deepEqual(p.questions.map(q=>q.sourceId).sort(),prior.map(q=>q.sourceId).sort());
 for(const q of p.questions){
  const old=prior.find(x=>x.sourceId===q.sourceId);
  assert.equal(q.replacesSelectedRevisionId,old.proposedFinalRevisionId);
  assert.equal(q.provisionalConceptFamily,old.provisionalSharedMasteryFamily);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(new Set(q.options.map(o=>parse(o.latex))).size,6);
  assert.equal(q.options.filter(o=>o.errorPath).length,5);
  assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,q.correctAnswerLatex);
  assert.equal(q.academicQA,'pending');
  for(const f of ['dailyEligible','masteryEligible','independentGradeCalibrated','teacherTaughtConfirmed','studentMisconceptionsEmpiricallyVerified','conceptFamilyIndependentlyApproved'])assert.equal(q[f],false);
 }
});
test('rederive sixteen answers, including all feasible integer constraints and normalized options',()=>{
 const e={};
 const feasible=range(0,30).filter(k=>45/(150000+25000*k)>=8e-5&&45/(150000+25000*k)<=9e-5);
 assert.deepEqual(feasible,[14,15,16]);e[2]=Math.max(...feasible)*25000;
 const storage=b=>(4e6-b)*50000+b*87500+3e9;
 e[3]=Math.floor((2.78e11-storage(0))/37500);assert.equal(storage(e[3]),2.78e11);assert.ok(storage(e[3]+1)>2.78e11&&e[3]>=1e6);
 e[6]=Math.min(...[3000,5000,5500,6000,7500,9000].filter(v=>1000+200+6e6/v<=2200));
 const count=(960000-200*800)/40*.85,boxes=Math.ceil(count/90);assert.ok(boxes*90>=count&&(boxes-1)*90<count);e[11]=Math.floor((840000-count*40)/800)-boxes;
 const active=300*80*.75;e[17]=(5.4e7-active*1e4*.2)/(.3*1e4);
 const mass=k=>6.4e-5*k**3*.875*2500;e[19]=Math.floor(Math.cbrt(17500/(6.4e-5*.875*2500))+1e-9);assert.ok(near(mass(e[19]),17500)&&mass(e[19]+1)>17500);
 const factor=(8.6e6-4.2e6)/(8e6-4e6),offset=factor*4e6-4.2e6;e[22]=(13e6+offset)/factor;
 e[24]=Math.abs(400000*1.2**2-500000*1.04**2);
 const cap=k=>.5*(.04*k)**3*1e9,base=.75*.04**3*1e9;assert.ok(cap(1)<5*base&&cap(2)>=5*base);e[26]=cap(2);
 const retained=k=>k*160*2.4e8*.6;assert.ok(retained(3)<7.2e10&&retained(4)>=7.2e10);e[27]=Math.ceil(7.2e10/retained(1))*180/1000;
 const N=4.5e3*2e5-3e8;e[30]=Math.max(...range(1,10).map(k=>(N-k*1e8)/5e4).filter(x=>x>0&&x<5000));
 e[31]=Math.max(...range(750,3000).filter(l=>1.5e8+l*240000+(3000-l)*120000<=7.5e8));
 e[32]=Math.max(...range(0,1500).filter(l=>l*3000+(3000-l)*2000<=7.2e6))*3000;
 const a=7e8*.9,b=2e8*.8;e[34]=a-(a+b)*2/5;assert.ok(near((a-e[34])/(b+e[34]),2/3));
 e[39]=(4e4*1e4+5e7)/1.2**2/1.25e5;assert.ok(near(e[39]*1.25e5*1.2**2-5e7,4e8));
 e[40]=Math.max(...range(15000,40000).filter(a=>a*20000+(40000-a)*16000<=7.6e8));
 assert.equal(Object.keys(e).length,16);
 for(const q of p.questions){const key=e[Number(q.sourceId.slice(-3))];assert.ok(near(parse(q.correctAnswerLatex),key),q.sourceId);assert.equal(q.options.filter(o=>near(parse(o.latex),key)).length,1,q.sourceId);}
});
