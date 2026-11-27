import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pack=JSON.parse(readFileSync(new URL(
 '../qa-staging/math-v311-standard-form-033-036-distinct-replacements-20261122.json',
 import.meta.url),'utf8'));
const asNum=latex=>{
 const m=/^([0-9]+(?:\.[0-9]+)?)\\times10\^\{(-?\d+)\}$/.exec(latex);
 assert.ok(m, 'not proper standard form: '+latex);
 const coefficient=Number(m[1]),exponent=Number(m[2]);
 assert.ok(coefficient>=1&&coefficient<10, 'mantissa not normalised '+latex);
 return coefficient*10**exponent;
};
const close=(got,want)=>assert.ok(Math.abs(got-want)<=Math.max(1,Math.abs(want))*1e-12,
  got+' does not equal independently reconstructed '+want);
const bySuffix=s=>pack.patches.find(p=>p.questionId.endsWith('STANDARD_FORM-'+s));

test('four source replacements stay QA-only; preserve original A-F answer letters',()=>{
 assert.equal(pack.status,'DRAFT_ACADEMIC_REPAIR_ONLY_BLOCKED');
 assert.equal(pack.applyToCanonicalBank,false);
 assert.equal(pack.mathDailyEnabled,false);
 assert.equal(pack.studentCredit,false);
 assert.equal(pack.teacherTaughtConfirmed,false);
 assert.equal(pack.independentGradeCalibrated,false);
 assert.equal(pack.independentDistractorApproved,false);
 assert.match(pack.schoolYear9OfficialCurriculum.url,/Year-9-Maths-2026-2027\.pdf/);
 assert.equal(pack.schoolYear9OfficialCurriculum.reversePercentagesTerm,'Spring');
 assert.equal(pack.schoolYear9OfficialCurriculum.compoundPercentageChangeTerm,'Spring');
 for(const p of pack.patches){
  assert.equal(p.curriculumSafety.autumnMathDailyEligible,false);
  assert.equal(p.curriculumSafety.exactMethodActuallyTaught,false);
  assert.equal(p.curriculumSafety.reviewerMustResolveBeforeRelease,true);
 }
 assert.equal(bySuffix('035').curriculumSafety.officialTermScope,'SPRING_REVERSE_PERCENTAGE');
 assert.equal(bySuffix('036').curriculumSafety.officialTermScope,'SPRING_COMPOUND_PERCENTAGE_CHANGE');
 assert.equal(pack.patches.length,4);
 assert.deepEqual(pack.patches.map(p=>p.questionId),[33,34,35,36].map(n=>
  'LUX-MATH-Y9-STANDARD_FORM-'+String(n).padStart(3,'0')));
 assert.deepEqual(pack.patches.map(p=>p.originalCorrectOptionId),['B','F','C','B']);
 const correctValues=[];
 for(const row of pack.patches){
   assert.equal(row.originalCorrectOptionId,row.replacement.correctOptionId);
   assert.equal(row.originalDifficultyTarget,'G8-9');
   assert.equal(row.independentFinalQaRequired.length,5);
   const choices=row.replacement.options;
   assert.deepEqual(choices.map(c=>c.id),['A','B','C','D','E','F']);
   assert.equal(choices.filter(c=>c.id===row.replacement.correctOptionId).length,1);
   assert.equal(choices.filter(c=>c.id!==row.replacement.correctOptionId&&
      typeof c.misconception==='string'&&c.misconception.length>45).length,5);
   assert.equal(new Set(choices.map(c=>asNum(c.latex))).size,6);
   assert.ok(row.replacement.workedSolutionSteps.length>=3);
   close(asNum(choices.find(c=>c.id===row.replacement.correctOptionId).latex),row.calculatedCorrectGrams);
   correctValues.push(row.calculatedCorrectGrams);
 }
 assert.equal(new Set(correctValues).size,4,
  'repair must remove original four-identical-answer scaling flaw');
});

test('original Q73-76 answer collision is independent arithmetic, not a claimed typo',()=>{
 for(const k of [9,10,11,12]){
   const original=(6*10**k+2*10**(k-1))*0.9/(5*10**(k-5));
   close(original,111600);
 }
 assert.deepEqual(pack.originalAllFourResultsGrams,[111600,111600,111600,111600]);
});

test('Q73/Standard Form 033: independently recompute key B and five wrong paths',()=>{
 const row=bySuffix('033'),mass=6e9+2e8,packets=5e7;
 const expected={
  A:mass/packets,
  B:mass*0.90/packets,
  C:mass*1.10/packets,
  D:6e9*0.9/packets,
  E:mass*0.10/packets,
  F:mass*0.90/5e6
 };
 for(const option of row.replacement.options)close(asNum(option.latex),expected[option.id]);
 close(expected.B,111.6);
});

test('Q74/Standard Form 034: independently recompute key F and five wrong paths',()=>{
 const row=bySuffix('034'),start=7e9,reserved=2e8,count=4e7;
 const expected={
  A:start*0.85/count,
  B:(start*(0.85**2)-reserved)/count,
  C:(start*0.85+reserved)/count,
  D:(start-reserved)*0.85/count,
  E:(start*0.15-reserved)/count,
  F:(start*0.85-reserved)/count
 };
 for(const option of row.replacement.options)close(asNum(option.latex),expected[option.id]);
 close(expected.F,143.75);
});

test('Q75/Standard Form 035: independently recompute reverse percentage and five wrong paths',()=>{
 const row=bySuffix('035'),finalMass=4e6*210,addition=1.2e8,retained=finalMass-addition;
 const expected={
  A:retained,
  B:retained/0.20,
  C:retained/0.80,
  D:(finalMass+addition)/0.80,
  E:retained*0.80,
  F:finalMass/0.80
 };
 for(const option of row.replacement.options)close(asNum(option.latex),expected[option.id]);
 close(expected.C,9e8);
 close(expected.C*0.80+addition,finalMass);
});

test('Q76/Standard Form 036: independently recompute successive losses and five wrong paths',()=>{
 const row=bySuffix('036'),mass=4.5e9,count=3e7;
 const expected={
  A:mass*(1-0.20-0.25)/count,
  B:mass*0.80*0.75/count,
  C:mass*0.75/count,
  D:mass*0.80/count,
  E:mass*0.20*0.75/count,
  F:mass*0.80*1.25/count
 };
 for(const option of row.replacement.options)close(asNum(option.latex),expected[option.id]);
 close(expected.B,90);
});
