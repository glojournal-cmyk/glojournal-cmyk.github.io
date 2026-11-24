import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const blob=p=>{const c=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(c)+'\0').update(c).digest('hex')};
const p=read('qa-staging/math-v329-changing-subject15-reasoning-replacements-20261124.json');
const bank=read(p.sourceBankPath),old=read(p.priorV323Register);
const near=(a,b)=>Math.abs(a-b)<1e-8;
const F=(a,b)=>'\\frac{'+a+'}{'+b+'}';
test('V329: all 40 changing-subject source IDs have staged candidates; canonical bank and credit holds intact',()=>{
 assert.equal(blob(p.sourceBankPath),p.sourceBankBlobSha);
 assert.equal(bank.questions.length,200);
 const originals=old.rows.filter(q=>q.topicId==='math-y9-changing-subject');
 assert.equal(originals.length,40);
 const pending=originals.filter(q=>q.candidateAudit.sourceIdVariants===0).map(q=>q.sourceId).sort();
 assert.equal(pending.length,15);
 assert.deepEqual(p.questions.map(q=>q.sourceId).sort(),pending);
 assert.equal(p.optionsCount,90);assert.equal(p.wrongOptionExplanationsCount,75);
 for(const q of p.questions){
  const s=bank.questions.find(x=>x.sourceId===q.sourceId);
  assert.ok(s);assert.equal(q.replacesOriginalRevisionId,s.revisionId);assert.notEqual(q.stem,s.stem);assert.equal(q.topicId,s.topicId);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.equal(q.options.filter(o=>o.errorPath).length,5);
  assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,q.correctAnswerLatex);
  assert.equal(q.workedSolutionSteps.length,3);
  assert.equal(q.academicQA,'pending');
  for(const flag of ['dailyEligible','masteryEligible','independentGradeCalibrated','teacherTaughtConfirmed','studentMisconceptionsEmpiricallyVerified','conceptFamilyIndependentlyApproved'])assert.equal(q[flag],false);
 }
 for(const flag of ['academicApprovals','dailyEligible','masteryEligible'])assert.equal(p[flag],0);
});
test('V329: derive fifteen keys and test inverse domains, excluded outputs and substitution',()=>{
 const e={};
 const a16=3;assert.ok([0,1,-3].every(x=>(a16*x+6)/(x+2)===3));e['016']='0';
 const a23=(4*(2+1)-5)/2;assert.equal(a23,3.5);assert.notEqual(5-a23,0);e['023']=F(7,2);
 const y25=1+6/Math.sqrt(2*16+4),new25=(36/(2*(y25-1))**2-4)/2;assert.ok(near(new25,2.5));e['025']=F(5,2);
 for(const y of [-100,-1,0,1,1.99]){const x=9/(2-y)**2-1;assert.ok(x>-1&&near(2-3/Math.sqrt(x+1),y));}e['026']='y<2';
 e['027']=String((16/1**2-1)/3-(16/2**2-1)/3);
 const bad28=[1,4,5,7,6,9].filter(y=>{const x=1+4/(y-3)**2;return !near(3+2/Math.sqrt(x-1),y)});assert.deepEqual(bad28,[1]);e['028']=String(bad28[0]);
 const a30=(6-2)*(2+3)/2,x30=(a30-9)/(6-a30);assert.ok(near(2+a30*(x30+1)/(2*x30+3),5));e['030']='-'+F(1,4);
 const x31=(3*3-2)/(4-3);assert.ok(near(1+(4*x31+2)/(x31+3),4)&&1+(4*(x31-.01)+2)/(x31-.01+3)<4);e['031']=String(x31);
 const roots32=[3+Math.sqrt(19),3-Math.sqrt(19)];assert.ok(roots32.every(x=>x!==-1&&x!==2&&near((2*x+3)/(x+1),(x+4)/(x-2))));e['032']=String(Math.round(roots32[0]+roots32[1]));
 const bad34=[0,1,3,4,-2].filter(y=>{const x=(2*y-2)/(2-y);return x===-1||x===-2||!near(2/(1+1/(x+1)),y)});assert.deepEqual(bad34,[0]);e['034']=String(bad34[0]);
 const k35=(6/2-2)*3,x35=k35/(6/4-2)-1;assert.ok(near(6/(2+k35/(x35+1)),4));e['035']=String(x35);
 const inv36=y=>3/(2/(y-1)-1);e['036']=String(inv36(5)-inv36(2));
 for(const y of [1,1.5,1.99,2.01,3,5,100]){const t=(y-1)**2,x=(6-2*t)/(t-1);assert.ok(x!==-2&&near(1+Math.sqrt((x+6)/(x+2)),y));}
 e['038']='x=\\frac{6-2(y-1)^2}{(y-1)^2-1},\\quad y\\ge1,\\ y\\ne2';
 const bad39=[2,3,4,5,6,7].filter(y=>{const t=(y-2)**2;if(t===4)return true;const x=(9-t)/(t-4);return x===-1||!near(2+Math.sqrt((4*x+9)/(x+1)),y)});assert.deepEqual(bad39,[4]);e['039']=String(bad39[0]);
 const old40=4/(4**2-9),new40=4/(5**2-9);assert.ok(near(new40/old40,7/16));e['040']='7:16';
 assert.equal(Object.keys(e).length,15);
 for(const q of p.questions)assert.equal(q.correctAnswerLatex,e[q.sourceId.slice(-3)],q.sourceId);
});
