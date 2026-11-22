import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const candidate=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-pedagogical-repair-candidates-20261122.json',import.meta.url),'utf8'));
const byId=id=>candidate.patches.find(p=>p.questionId.endsWith(id));
const fromLatex=latex=>{
  const match=/^([0-9]+(?:\.[0-9]+)?)\\times 10\^\{(-?\d+)\}$/.exec(latex);
  assert.ok(match,'candidate option not parseable: '+latex);
  return Number(match[1])*10**Number(match[2]);
};
const same=(a,b)=>assert.ok(Math.abs(a-b)<1e-11,a+' != '+b);

test('candidate is staging-only, no learner credit, with exact two question IDs',()=>{
  assert.equal(candidate.status,'QA_STAGING_NOT_ACADEMIC_APPROVED');
  assert.equal(candidate.applyToCanonicalBank,false);
  assert.equal(candidate.studentCredit,false);
  assert.equal(candidate.academicQAGate,'BLOCKED');
  assert.deepEqual(candidate.patches.map(p=>p.questionId),[
    'LUX-MATH-Y9-STANDARD_FORM-017','LUX-MATH-Y9-REARRANGING-023'
  ]);
});
test('density: unique A-F, C correct and five reconstructable arithmetic mistakes',()=>{
  const patch=byId('STANDARD_FORM-017');
  const options=patch.replacement.options;
  assert.equal(options.length,6);
  assert.deepEqual(options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.ok(options.every(o=>o.id==='C'||o.misconception?.length>20));
  const map=Object.fromEntries(options.map(o=>[o.id,fromLatex(o.latex)]));
  assert.equal(new Set(Object.values(map)).size,6);
  const total=(2*10**11)*(3*10**-10),after=total*(1-0.25),volume=1.5*10**2;
  same(total,60);same(after,45);same(volume,150);
  same(map.C,after/volume);same(map.A,after/15);same(map.B,total*0.50/volume);
  same(map.D,total*0.25/volume);same(map.E,after/100);same(map.F,total/volume);
  assert.equal(patch.originalCorrectOptionId,'C');
});
test('rational rearrangement: correct option unchanged and domain-safe inverse',()=>{
  const patch=byId('REARRANGING-023');
  assert.equal(patch.originalCorrectOptionId,'D');
  assert.equal(patch.replacement.workedSolutionSteps.length,2);
  const full=patch.replacement.workedSolutionSteps.join(' ');
  assert.ok(full.includes('x\\ne-6'));
  assert.ok(full.includes('y\\ne5'));
  for(const x of patch.verification.testValuesForX){
    const y=1+(4*x+5)/(x+6);
    same((11-6*y)/(y-5),x);
  }
});
