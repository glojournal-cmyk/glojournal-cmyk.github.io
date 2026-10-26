import assert from 'node:assert/strict';
import test from 'node:test';
import {buildYear9CapacityReport} from '../scripts/year9-mastery-capacity-report-20261026.mjs';

const report=buildYear9CapacityReport();
const topic=id=>report.topics.find(x=>x.topicId===id);
test('Year 9 inventory covers all six taught-subject categories without reading learner storage',()=>{
 assert.ok(report.summary.topicFiles>=90,'do not silently drop Year 9 course files');
 for(const s of ['biology','chemistry','physics','french','latin','english'])
  assert.ok(report.summary.bySubject[s]?.topics>0,'missing Y9 subject '+s);
 assert.equal(report.topics.length,report.summary.topicFiles);
 assert.equal(new Set(report.topics.map(x=>x.file)).size,report.topics.length);
 assert.ok(report.caveats.some(x=>x.includes('NOT a learner-specific')));
});
test('French perfect negatives and comparisons each have 20 independently labelled opportunities after five answers',()=>{
 for(const id of ['fr-y9-u1-perfect-negatives','fr-y9-u2-comparatives-superlatives']){
  const row=topic(id);
  assert.ok(row,id);
  assert.equal(row.formal,25);
  assert.equal(row.afterFiveFresh,20);
  assert.equal(row.afterFiveDistinctConcepts,20);
  assert.ok(row.application>=10,'verify actual translation depth');
  assert.equal(row.flags.includes('BELOW_20_AFTER_FIVE_CORRECT'),false);
 }
});
test('Latin case-function duplicate concept variants are counted honestly',()=>{
 const row=topic('la-y9-s01-case-functions');
 assert.ok(row);
 assert.equal(row.formal,31);
 assert.equal(row.distinctConcepts,25,'old MC + typing share grammar concepts');
 assert.equal(row.afterFiveFresh,26);
 assert.ok(row.afterFiveDistinctConcepts>=20);
 assert.ok(row.translation>=3,'full Latin sentence translation added');
 assert.ok(row.multiMark>=2,'two-mark explanation rubric added');
});
test('an unrepaired small French topic is still flagged as Mastery shortfall',()=>{
 const row=topic('fr-y9-u2-perfect-vs-imperfect');
 assert.ok(row);
 assert.equal(row.formal,11);
 assert.equal(row.afterFiveFresh,6);
 assert.ok(row.flags.includes('BELOW_NOMINAL_MASTERY_20'));
 assert.ok(report.priority.some(x=>x.topicId===row.topicId));
});
test('priority is diagnostic only; per-subject totals reconcile',()=>{
 const values=Object.values(report.summary.bySubject);
 assert.equal(values.reduce((n,g)=>n+g.topics,0),report.summary.topicFiles);
 assert.equal(report.summary.below20,report.topics.filter(x=>x.formal<20).length);
 assert.equal(report.summary.below20AfterFive,report.topics.filter(x=>x.afterFiveFresh<20).length);
 assert.equal(report.summary.noApplication,report.topics.filter(x=>x.application===0).length);
 assert.ok(report.priority.every(x=>x.flags.length>0));
});
