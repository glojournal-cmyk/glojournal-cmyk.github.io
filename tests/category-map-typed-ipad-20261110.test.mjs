import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scoreCategoryMapText} from '../assets/category-map-marking-20261110.js';
const q=JSON.parse(readFileSync('content/topics/chem-y8-working-scientifically.json','utf8'))
 .questions.find(q=>q.id==='chem-y8-working-scientifically-challenge');
test('the actual iPad screenshot answer is genuinely correct, not 0/4',()=>{
 const text='Correct answer: independent variable: deliberately changed factor; dependent variable: measured outcome; control variables: factor held constant; anomaly: unusual result outside the pattern.';
 assert.equal(q.format,'sorting');
 const grade=scoreCategoryMapText(q.answer,text);
 assert.equal(grade.ok,true);
 assert.equal(grade.score,4);
 assert.equal(grade.total,4);
});
test('incorrect mappings and missing fields cannot pass a four-mark question',()=>{
 const wrong='independent variable: measured outcome; dependent variable: deliberately changed factor; control variable: factor held constant; anomaly: unusual result outside the pattern';
 const grade=scoreCategoryMapText(q.answer,wrong);
 assert.equal(grade.ok,false);
 assert.equal(grade.score,2);
 const missing=scoreCategoryMapText(q.answer,'independent variable: deliberately changed factor');
 assert.equal(missing.score,1);
 assert.equal(missing.ok,false);
 assert.equal(scoreCategoryMapText(q.answer,'' ).score,0);
});
test('several statements in one category require every correct statement',()=>{
 const q2=JSON.parse(readFileSync('content/topics/bio-y8-practical-conclusions.json','utf8'))
   .questions.find(q=>q.id==='bio-y8-app-conclusion-explanation');
 const ok=scoreCategoryMapText(q2.answer,
  'explanation: another factor later limited the rate, light was initially limiting; conclusion: rate rose then levelled');
 assert.equal(ok.ok,true);
 assert.equal(ok.score,3);
 const no=scoreCategoryMapText(q2.answer,'conclusion: rate rose then levelled; explanation: light was initially limiting');
 assert.equal(no.ok,false);
 assert.equal(no.score,2);
});
