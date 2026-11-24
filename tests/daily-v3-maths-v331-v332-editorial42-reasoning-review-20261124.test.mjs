import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const blob=p=>{const c=raw(p);return createHash('sha1').update('blob '+Buffer.byteLength(c)+'\0').update(c).digest('hex')};
const reg=read('qa-staging/math-all200-reasoning-candidate-review-register-20261124.json');
const prev=read(reg.previousUnifiedRegisterPath),rescreen=read(reg.editorialRescreenPath),bank=read(reg.canonicalBankPath);
const paths=['qa-staging/math-v331-editorial20-indices-standard-form-reasoning-upgrades-20261124.json','qa-staging/math-v332-editorial22-simultaneous-reasoning-upgrades-20261124.json'];
const packs=paths.map(read),questions=packs.flatMap(p=>p.questions);
const near=(a,b)=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b));
const F=(a,b)=>'\\frac{'+a+'}{'+b+'}';
const val=s=>{const m=s.match(/^([0-9.]+)\\times10\^\{(-?\d+)\}$/);return m?Number(m[1])*10**Number(m[2]):Number(s)};
const solve=(a,b,c,d,e,f)=>[(c*e-b*f)/(a*e-b*d),(a*f-c*d)/(a*e-b*d)];
const range=n=>Array.from({length:n},(_,i)=>i+1);
test('42 actual replacement records and all 200 source IDs are covered by reasoning drafts, never approved',()=>{
 assert.equal(blob(reg.canonicalBankPath),reg.canonicalBlobSha);
 assert.equal(blob(reg.previousUnifiedRegisterPath),reg.previousUnifiedRegisterBlobSha);
 assert.equal(blob(reg.editorialRescreenPath),reg.editorialRescreenBlobSha);
 assert.equal(bank.questions.length,200);assert.equal(reg.rows.length,200);assert.equal(new Set(reg.rows.map(q=>q.sourceId)).size,200);
 assert.equal(reg.packs.length,26);assert.equal(reg.counts.versionRecords,267);assert.equal(reg.counts.reasoningSourceIds,200);assert.equal(reg.counts.editorialOnlySourceIds,0);
 assert.equal(rescreen.rows.length,42);assert.ok(rescreen.rows.every(q=>q.keyMatches&&q.uniqueCorrect&&q.distinctValues));
 const earlier=prev.rows.filter(q=>q.candidateStatus==='EDITORIAL_ONLY_REQUIRES_DIFFICULTY_REVIEW');
 assert.equal(earlier.length,42);assert.equal(questions.length,42);
 assert.deepEqual(questions.map(q=>q.sourceId).sort(),earlier.map(q=>q.sourceId).sort());
 for(const path of paths)assert.equal(blob(path),reg.packs.find(p=>p.path===path).sha);
 for(const q of questions){
  const s=bank.questions.find(x=>x.sourceId===q.sourceId),old=earlier.find(x=>x.sourceId===q.sourceId),now=reg.rows.find(x=>x.sourceId===q.sourceId);
  assert.ok(s&&old&&now);assert.equal(q.replacesOriginalRevisionId,s.revisionId);assert.equal(q.replacesEditorialRevisionId,old.selectedForNextReview.revisionId);assert.equal(now.selectedForNextReview.revisionId,q.revisionId);
  assert.notEqual(q.stem,s.stem);assert.equal(q.topicId,s.topicId);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.equal(q.options.filter(o=>o.id!==q.correctOptionId&&o.errorPath).length,5);assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,q.correctAnswerLatex);
  assert.equal(q.workedSolutionSteps.length,3);assert.equal(q.academicQA,'pending');assert.equal(q.dailyEligible,false);assert.equal(q.masteryEligible,false);
 }
 for(const q of reg.rows){assert.equal(q.candidateStatus,'REASONING_DRAFT_PRESENT');for(const f of ['academicApproval','dailyEligible','masteryEligible','importAllowed','independentGrade7Calibration','independentMasteryConceptApproval','taughtThisSchoolYearConfirmed'])assert.equal(q[f],false);}
});
test('V331: recalculate six indices and fourteen standard form answer keys',()=>{
 const ie={10:Math.pow(1024*2**8,1/6),11:Math.min(...range(30).flatMap(a=>range(30).filter(b=>9*a===11*b).map(b=>a+b))),12:range(10).flatMap(n=>range(10).filter(m=>12*n-28*m===-4).map(m=>n+m)).reduce((a,b)=>a+b,0),26:2**((21-1)/5-3),27:Math.sqrt(320**2-4*2**14),28:[-2,2].map(t=>t+3).reduce((a,b)=>a*b,1)};
 const sf={6:9e6/(3e6/3e3+6e6/6e3),7:1.2e5/(2*1.2e5/30-1.2e5/20),11:(9.6e5-200*800)/40*.85,12:6e7*(.4*.75+.6*.9),22:(8.2e6+2e5)/1.05,23:715000-485000,24:4e5*1.25*1.04-4e5*1.2,30:(4.5e3*2e5-3e8-1.5e8)/5e4,31:Math.floor((7.5e8-1.5e8)/2.4e5),32:Math.floor((3e3)**2*.8/(40*50)),37:6.825e8/(2.5e4*(.88+.12*.25)),38:(1.26e9/.9-4e4*2e4)/(5e4-2e4),39:(3.125e8*1.2**2-5e7)/4e4,40:Math.floor((8e8-1.5e4*2e4)/(2e4*.8))};
 for(const q of packs[0].questions){const n=Number(q.sourceId.slice(-3)),e=(q.sourceId.includes('STANDARD_FORM')?sf:ie)[n];assert.ok(near(val(q.correctAnswerLatex),e),q.sourceId);assert.equal(q.options.filter(o=>near(val(o.latex),e)).length,1,q.sourceId);}
});
test('V332: recalculate all twenty-two simultaneous keys and verify relevant constraints',()=>{
 const e={};let x,y,a,b;
 [x,y]=solve(2,3,19,1,-1,1);assert.ok(near(x+y,39/5));e['001']=F(39,5);
 [x,y]=solve(3,2,16,1,-2,0);e['002']=String(3*x+2*2*x-16);
 const total=(24+30+26)/2;assert.equal(total-30,10);assert.equal(total-24,16);e['003']='5:8';
 const nums=[];for(let a=1;a<=9;a++)for(let b=0;b<=9;b++)if(a+b===11&&9*(b-a)===27)nums.push(10*a+b);assert.deepEqual(nums,[47]);e['004']=String(nums[0]);
 [x,y]=solve(-1,5,0,2,3,26);assert.ok(near((x-y)/(x+y),2/3));e['009']=F(2,3);
 for(const c of [-20,0,12,40]){[x,y]=solve(1,2,c,3,-2,12-c);assert.equal(x,3);}e['010']='x';
 a=(14-2*4)/2;b=(17-3*2)/4;assert.ok(near(a+b,23/4));e['011']=F(23,4);
 [x,y]=solve(2,1,11,1,-2,-2);e['012']=String((x*x-y*y)/(x+y));e['021']=String(1**2+1-2*1);
 e['022']=String([7,-7].map(d=>solve(1,1,-3,1,-1,d)).reduce((s,[x,y])=>s+x*y,0));
 [x,y]=solve(1,1,8,1,-1,16/8);assert.ok(x>0&&y>0&&near(x/y,5/3));e['024']=F(5,3);
 [x,y]=solve(2,3,5.4,3,1,6);e['026']=String(Math.round(y*1000));
 [x,y]=solve(1,1,48,1,-2,-3);assert.ok(x+y+10===58&&x-3===2*(y-3));e['027']=String(x);
 e['028']=(90*2/5+15)/3+':'+(90*3/5-15)/3;
 [x,y]=solve(2,3,11,5,-1,7);assert.ok(near((7*x+2*y)/(3*x-4*y),-9/2));e['029']='-'+F(9,2);
 [a,b]=solve(1,1,18,1,-1,14);e['030']=String(a*b);
 for(const k of [-10,0,5,5.01,20]){[x,y]=solve(1,1,10,2,-1,k);assert.equal(x>y,k>5);}e['031']='k>5';
 const ks=[];for(let k=20;k<=32;k++){[x,y]=solve(1,1,15,3,-1,k);if(Number.isInteger(x)&&Number.isInteger(y)&&x>0&&y>0)ks.push(k);}e['032']=String(ks.length);
 [x,y]=solve(3,1,6,1,1,4);assert.equal(6*x+2*y,12);e['033']='('+x+','+y+')';
 [x,y]=solve(1,2,11,3,-1,5);e['034']=String(2*x+y-(x-y));const t=15/7;assert.ok(near((18-2*t)/(3*t),32/15));e['035']=F(32,15);
 const roots=[2+Math.sqrt(18),2-Math.sqrt(18)];assert.ok(roots.every(k=>near((k-2)**2,18)&&!near(6/(k-2),12/9)));e['036']=String(Math.round(roots.reduce((a,b)=>a+b,0)));
 assert.equal(Object.keys(e).length,22);for(const q of packs[1].questions)assert.equal(q.correctAnswerLatex,e[q.sourceId.slice(-3)],q.sourceId);
});
