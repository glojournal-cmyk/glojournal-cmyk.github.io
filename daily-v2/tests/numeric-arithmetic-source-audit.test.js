import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadObjectiveReviewQueue} from '../scripts/build-objective-review-queue.mjs';

// INDEPENDENT arithmetic consistency probes derived from the published
// problem quantities, not from answer.value or the proposed mark points.
// Passing these probes does not certify educational marking decisions.
const arithmetic={
 'bio-y8-app-ber-55':5.4*24*55,
 'bio-y8-app-ber-change':5.4*24*(52-50),
 'bio-y8-app-caffeine-per-cup':315/7,
 'bio-y8-app-bmi-60-150':60/(1.50**2),
 'bio-y8-app-bmi-72-180':72/(1.80**2),
 'bio-y8-app-mean':(18+21+21)/3,
 'bio-y8-app-percentage-change':(26-20)/20*100,
 'bio-y8-app-label-fat':8*75/100,
 'bio-y8-app-label-sugar':12*45/100,
 'chem-y8-conservation-equations-challenge':12.5+7.5,
 'phys-y8-circuits-current-voltage-challenge':1.2-0.35-0.48,
 'phys-y8-energy-stores-transfers-challenge':750-420-95,
 'phys-y8-forces-newton-motion-challenge':35-12-8,
 'phys-y8-moments-levers-challenge':24*0.35/0.20,
 'phys-y8-pressure-density-fluids-challenge':1200/(0.80*0.50),
 'phys-y8-resistance-series-parallel-challenge':7.5/0.25
};
test('all 16 unapproved numeric source values and displayed models agree with independently computed arithmetic',()=>{
 const queue=loadObjectiveReviewQueue();
 const pending=queue.rows.filter(r=>r.flags.includes('INDEPENDENT_MARK_POINTS_NOT_SPECIFIED'));
 assert.equal(pending.length,16);
 assert.equal(Object.keys(arithmetic).length,16);
 for(const row of pending){
  assert.ok(Object.hasOwn(arithmetic,row.questionId),'unverified numeric problem '+row.questionId);
  const src=row.markingRubric;
  const expected=arithmetic[row.questionId];
  const tolerance=Number(src.tolerance??0);
  assert.ok(Number.isFinite(tolerance)&&tolerance>=0);
  const allowedDeviation=Math.max(tolerance,0.0000001);
  assert.ok(Math.abs(src.value-expected)<=allowedDeviation,
   'stored numeric value disagrees with question arithmetic: '+row.questionId);
  const display=String(src.modelAnswer??'');
  const match=display.match(/^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s+|$)/);
  assert.ok(match,'model answer does not start with a number: '+row.questionId);
  assert.ok(Math.abs(Number(match[1])-src.value)<=allowedDeviation,
   'model answer contradicts stored numeric value: '+row.questionId);
  assert.ok(Array.isArray(src.units)&&src.units.length>0,
   'a multi-mark numeric source must declare permitted units: '+row.questionId);
  assert.equal(row.curriculumCertified,false);
  assert.equal(row.scorerCertified,false);
  assert.equal(row.approvedForDaily,false);
 }
});
