import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const staged=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-standard-form-density-7-repairs-20261122.json',import.meta.url),'utf8'));
const old=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-pedagogical-repair-candidates-20261122.json',import.meta.url),'utf8'));
const orig=JSON.parse(readFileSync(new URL('../qa-staging/math-v31-original-sample10.json',import.meta.url),'utf8'));
const by=n=>staged.patches.find(p=>p.questionId.endsWith('STANDARD_FORM-'+n));
const value=latex=>{
 const m=/^([0-9]+(?:\.[0-9]+)?)\\times10\^\{(-?\d+)\}$/.exec(latex);
 assert.ok(m,'invalid standard-form latex '+latex);
 const coeff=Number(m[1]),exp=Number(m[2]);
 assert.ok(coeff>=1&&coeff<10,'non-normalised mantissa '+latex);
 return coeff*10**exp;
};
const close=(a,b,label='')=>assert.ok(
 Math.abs(a-b)<=1e-11*Math.max(1,Math.abs(a),Math.abs(b)),
 label+': '+a+' != independently reconstructed '+b);
const cases={
 '001':()=>{const mass=(2e12)*(3e-12);return {A:mass/2,B:mass/200,C:(4e12)*(3e-12)/20,D:mass,E:(2e12)*(2e-12)/20,F:mass/20}},
 '002':()=>{const A=3e13*4e-12,B=1e13*4e-12,combined=A+B;return {A:A/400,B:B/400,C:combined/100,D:combined/200,E:combined/400,F:(3e13+1e13)*4e-13/400}},
 '003':()=>{const mass=(4e14)*(5e-12);return {A:mass/2000,B:mass*.2/2000,C:mass*.8/2000,D:mass*.8**2/2000,E:mass*.8/200,F:(4e14)*(5e-13)*.8/2000}},
 '004':()=>{const rho=.6,v=5000,bead=6e-12,mass=rho*v;return {A:mass/bead,B:rho*500/bead,C:rho*50000/bead,D:mass/1e-12,E:rho/bead,F:mass/6e-10}},
 '018':()=>{const massA=2e12*3e-11,massB=1e12*2e-11,total=massA+massB,kept=total*.8;return {A:total/200,B:kept/200,C:massA*.8/200,D:total*.2/200,E:kept/2000,F:kept/20}},
 '019':()=>{const mass=2e12*3e-11;return {A:mass/120,B:mass*.75/200,C:mass*.75/120,D:mass*.25/120,E:mass*.75**2/120,F:mass*.75/1200}},
 '020':()=>{const mass=2e13*3e-12,remaining=mass*.75,target=.06*1500;return {A:target-remaining,B:target-mass,C:target,D:target-mass*.5,E:target-mass*.25,F:.04*1500-remaining}},
};
test('seven original IDs retain source letters, full 35 error rationales and zero authorization',()=>{
 assert.equal(staged.status,'QA_STAGING_CANDIDATES_NOT_APPROVED');
 for(const field of ['canonicalBankModified','studentCredit','independentTeacherTaughtConfirmed',
   'independentGcseGradeBenchmarkConfirmed','independentMisconceptionTeacherSignoff',
   'deviceRenderVerified','originalFullRaw200BankAvailable'])assert.equal(staged[field],false,field);
 assert.deepEqual(staged.patches.map(p=>p.questionId),
  ['001','002','003','004','018','019','020'].map(n=>'LUX-MATH-Y9-STANDARD_FORM-'+n));
 assert.deepEqual(staged.patches.map(p=>p.originalCorrectKey),['F','E','C','A','B','C','A']);
 assert.deepEqual(staged.patches.map(p=>p.sourceDifficultyProvisional),
  ['G7','G7','G7','G7','G8','G8','G8']);
 assert.equal(staged.patches.reduce((n,p)=>n+p.replacement.options.filter(o=>o.id!==p.originalCorrectKey).length,0),35);
 const repaired017=old.patches.find(p=>p.questionId==='LUX-MATH-Y9-STANDARD_FORM-017');
 const original017=orig.questions.find(q=>q.id===repaired017.questionId);
 assert.equal(repaired017.originalCorrectOptionId,'C');
 assert.equal(original017.correctOptionId,'C');
 close(repaired017.verification.answerValueGramsPerCm3,0.3);
});
for(const [id,fn] of Object.entries(cases)){
 test('recalculate STANDARD_FORM-'+id+': six A-F values, five specific wrong paths',()=>{
  const row=by(id);
  assert.ok(row,'missing source question '+id);
  assert.deepEqual(row.replacement.options.map(x=>x.id),['A','B','C','D','E','F']);
  const options=row.replacement.options;
  assert.equal(new Set(options.map(x=>value(x.latex))).size,6);
  const errors=options.filter(x=>x.id!==row.originalCorrectKey);
  assert.equal(errors.length,5);
  assert.ok(errors.every(x=>typeof x.misconception==='string'&&x.misconception.length>44));
  assert.equal(options.find(x=>x.id===row.originalCorrectKey).misconception,null);
  assert.ok(row.replacement.workedSolutionSteps.length>=2);
  const expected=fn();
  assert.deepEqual(Object.keys(expected),['A','B','C','D','E','F']);
  for(const option of options)close(value(option.latex),expected[option.id],id+' choice '+option.id);
  close(expected[row.originalCorrectKey],row.candidateCorrectValue,id+' correct key');
  assert.equal(row.review,'PENDING_INDEPENDENT_ACADEMIC_QA');
 });
}
test('original four densities are 300/400/500/600, not retroactively rewritten',()=>{
 const origDensity=[(2e12*3e-9)/2e1,(3e13*4e-9)/3e2,(4e14*5e-9)/4e3,(5e15*6e-9)/5e4];
 origDensity.forEach((x,i)=>close(x,[300,400,500,600][i],'original source Q'+(41+i)));
 assert.deepEqual(['001','002','003','004'].map(n=>by(n).candidateCorrectValue),[.3,.4,.8,5e14]);
 assert.ok(staged.patches.every(p=>p.review!=='approved'));
});
test('original filtered pairs repeat 300/30; candidate task units are explicitly distinguished',()=>{
 const origDensity=[(2e11*3e-7*.75)/1.5e2,(2e12*3e-8*.75)/1.5e3,
  (2e13*3e-9*.75)/1.5e2,(2e14*3e-10*.75)/1.5e3];
 origDensity.forEach((x,i)=>close(x,[300,30,300,30][i],'original Q'+(57+i)));
 assert.deepEqual([
  old.patches.find(p=>p.questionId.endsWith('STANDARD_FORM-017')).verification.answerValueGramsPerCm3,
  by('018').candidateCorrectValue,by('019').candidateCorrectValue],[.3,.32,.375]);
 close(by('020').candidateCorrectValue,45,'Q60 candidate asks additional mass in grams');
});
