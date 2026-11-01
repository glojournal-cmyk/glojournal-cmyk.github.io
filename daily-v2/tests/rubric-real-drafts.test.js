import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fingerprintDailyV2Source} from '../src/bank-adapter.js';
import {previewDailyV2Rubric,recordDailyV2RubricReview} from '../src/rubric-review.js';
function get(name,id) {
 const topic=JSON.parse(readFileSync(new URL('../content/mastery/'+name+'.json',import.meta.url),'utf8'));
 const question=topic.questions.find(q=>q.id===id);
 assert.ok(question,'question exists in actual content');
 return {topic,question};
}
test('actual Biology 4-mark question can record staged 2/4 with distinct evidence',()=>{
 const {topic,question}=get('biology-y8-photosynthesis','bio-y8-v2mb-19');
 assert.equal(question.answer.totalMarks,4);
 const answer='Different lamps might differ in light intensity. Temperature needs controlling.';
 const preview=previewDailyV2Rubric(topic,question,answer);
 assert.equal(preview.marksEarned,null);
 const a=recordDailyV2RubricReview({
  topic,question,studentResponse:answer,sourceFingerprint:fingerprintDailyV2Source(topic,question),
  reviewerId:'qa-manual-reviewer',reviewId:'staging-4mark-pointcheck',
  pointAwards:[0,1,1,0],
  reviewerNotes:['No mention of independent wavelength','Light intensity confounding recognized',
   'Temperature confounding recognized','No experimental control plan']
 });
 assert.equal(a.marksEarned,2);assert.equal(a.marksPossible,4);
 assert.equal(a.releaseGrade,false);
});
test('actual French extended response is not graded by exact model-text matching',()=>{
 const {topic,question}=get('french-y8-reflexive-routines','fr-y8-v2mb-19');
 const p=previewDailyV2Rubric(topic,question,question.answer.modelAnswer);
 assert.equal(p.modelAnswerMatch,true);
 assert.equal(p.marksEarned,null);assert.equal(p.releaseGrade,false);
});
test('actual Latin alternate word order must be reviewed rather than falsely failed',()=>{
 const {topic,question}=get('latin-y8-verb-tenses','la-y8-v2mb-20');
 const p=previewDailyV2Rubric(topic,question,'The master entered after the woman was making food and the boy was playing.');
 assert.equal(p.status,'review-required');
 assert.equal(p.correct,null);
});
test('actual Physics calculation cannot receive guessed fraction score without explicit review',()=>{
 const {topic,question}=get('physics-y8-series-parallel','phys-y8-v2mb-15');
 const p=previewDailyV2Rubric(topic,question,'A is 0.8 A, B is 0.4 A.');
 assert.equal(p.marksPossible,4);assert.equal(p.marksEarned,null);
});
test('a real question source change invalidates an already staged review',()=>{
 const {topic,question}=get('chemistry-y8-acids-neutralisation','chem-y8-v2mb-17');
 const revised={...question,answer:{...question.answer,markPoints:[...question.answer.markPoints]}};
 revised.answer.markPoints[0]='Altered answer key';
 assert.throws(()=>recordDailyV2RubricReview({
  topic,question:revised,studentResponse:'Neutral but salt remains.',
  sourceFingerprint:fingerprintDailyV2Source(topic,question),reviewerId:'qa',
  reviewId:'review',pointAwards:revised.answer.markPoints.map(()=>0),
  reviewerNotes:revised.answer.markPoints.map(()=>'Not evidenced')
 }),/stale question/);
});
