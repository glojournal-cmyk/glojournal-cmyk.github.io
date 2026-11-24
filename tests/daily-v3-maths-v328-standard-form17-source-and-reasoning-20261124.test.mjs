import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const blob=p=>{const c=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(c)+'\0').update(c).digest('hex')};
const p=read('qa-staging/math-v328-standard-form17-reasoning-replacements-20261124.json');
const bank=read(p.sourceBankPath),old=read(p.priorV323Register),v4=read(p.priorV324Pack);
const parse=s=>{const m=s.match(/^([1-9](?:\.\d+)?)\\times10\^\{(-?\d+)\}$/);assert.ok(m&&Number(m[1])<10,s);return Number(m[1])*10**Number(m[2])};
const near=(a,b)=>Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b));
test('V328: all 40 standard-form IDs represented by candidate drafts; no official approval or learner credit',()=>{
 assert.equal(blob(p.sourceBankPath),p.sourceBankBlobSha);
 assert.equal(bank.questions.length,200);
 const originals=old.rows.filter(q=>q.topicId==='math-y9-standard-form');
 assert.equal(originals.length,40);
 const pending=originals.filter(q=>q.candidateAudit.sourceIdVariants===0&&!v4.questions.some(x=>x.sourceId===q.sourceId)).map(q=>q.sourceId).sort();
 assert.equal(pending.length,17);
 assert.deepEqual(p.questions.map(q=>q.sourceId).sort(),pending);
 assert.equal(p.optionsCount,102);assert.equal(p.wrongOptionExplanationsCount,85);
 for(const q of p.questions){
  const s=bank.questions.find(x=>x.sourceId===q.sourceId);
  assert.ok(s);assert.equal(q.replacesOriginalRevisionId,s.revisionId);assert.notEqual(q.stem,s.stem);
  assert.equal(q.topicId,s.topicId);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(new Set(q.options.map(o=>parse(o.latex))).size,6);
  assert.equal(q.options.filter(o=>o.errorPath).length,5);
  assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,q.correctAnswerLatex);
  assert.equal(q.workedSolutionSteps.length,3);
  assert.equal(q.academicQA,'pending');
  for(const flag of ['dailyEligible','masteryEligible','independentGradeCalibrated','teacherTaughtConfirmed','studentMisconceptionsEmpiricallyVerified','conceptFamilyIndependentlyApproved'])assert.equal(q[flag],false);
 }
 for(const x of ['academicApprovals','dailyEligible','masteryEligible'])assert.equal(p[x],0);
});
test('V328: recalculate all 17 numerical answers, normalized options and unique correct value',()=>{
 const expected={
 '002':(2e5*3e-4)/(8e-5)-2e5,
 '003':4e6*2.5e5*(1-.72)+3e9,
 '004':3.6e5/(.024/100)*.65,
 '005':(1.8e6+1.2e6)/(1.8e6/6e3+200+1.2e6/4e3),
 '008':(9e12-3e12)/(15000-3e12/5e8-3000),
 '010':Math.ceil(253010000/40000)+Math.ceil(Math.ceil(253010000/40000)*.08),
 '017':5.4e7/(300*80*.75*10000),
 '018':3e5*(6e-4-2e-4)/(8e-4-2e-4),
 '019':6.4e-5*50**3*(1-.125),
 '020':8e7*(.9-(1-.25)*(1-.2)),
 '026':(.04)**3*.75*1e9,
 '027':7.2e10/(2.4e8*.6)/1000,
 '028':2.4e3*1e-4*5e-2*1e-3*8e3,
 '033':(32000+500)*(1500+50),
 '034':9e8*(7/9-4/9),
 '035':(6.16e8-4e7)/1.2**2,
 '036':Math.floor(Math.min((7.2e8-1.2e8)/2.5e4,4.5e8*.8/1.8e4))
 };
 assert.equal(Object.keys(expected).length,17);
 for(const q of p.questions){
  const key=expected[q.sourceId.slice(-3)];
  assert.ok(near(parse(q.correctAnswerLatex),key),q.sourceId);
  assert.equal(q.options.filter(o=>near(parse(o.latex),key)).length,1,q.sourceId);
 }
 assert.ok(6325*40000<253010000&&6326*40000>=253010000);
 assert.ok(506<6326*.08&&507>=6326*.08);
 assert.ok(20000*18000<=4.5e8*.8&&20001*18000>4.5e8*.8);
 assert.ok(20000*25000<=7.2e8-1.2e8);
 assert.ok(near((1.2**2*4e8)+4e7,6.16e8));
});
