import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fingerprintDailyV2Source} from '../src/bank-adapter.js';
import {previewDailyV2Rubric,recordDailyV2RubricReview} from '../src/rubric-review.js';
const topic={topicId:'bio-test-rubric',subject:'biology',year:8};
const q={
 id:'bio-long-4',topicId:'bio-test-rubric',prompt:'Explain absorption through villi',
 format:'extended_response',stimulus:{text:'damaged villi'},
 answer:{mode:'rubric_review',requiresSemanticAssessment:true,totalMarks:4,
 accepted:['Villi have a large surface area, thin epithelium and blood supply that maintains a concentration gradient.'],
 modelAnswer:'Villi have a large surface area, thin epithelium and blood supply that maintains a concentration gradient.',
 markPoints:['large surface area','thin membrane or short diffusion path','blood supply removes absorbed nutrients','concentration gradient maintained']}
};
const review=(changes={})=>({
 topic,question:q,studentResponse:'Villi have thin walls and large surface area.',
 sourceFingerprint:fingerprintDailyV2Source(topic,q),
 reviewerId:'independent-qa-reviewer',reviewId:'qa-review-001',
 pointAwards:[1,1,0,0],
 reviewerNotes:['Explained enlarged area','Thin wall described','Blood not mentioned','Gradient not explained'],
 ...changes
});
test('matching published model answer is only a hint, never automatic credit',()=>{
 const p=previewDailyV2Rubric(topic,q,q.answer.modelAnswer);
 assert.equal(p.status,'review-required');assert.equal(p.modelAnswerMatch,true);
 assert.equal(p.marksEarned,null);assert.equal(p.releaseGrade,false);
});
test('short response does not automatically receive marks for keyword mentions',()=>{
 const p=previewDailyV2Rubric(topic,q,'Villi do NOT increase surface area.');
 assert.equal(p.marksEarned,null);assert.equal(p.correct,null);
 assert.equal(p.modelAnswerMatch,false);
});
test('manual reviewer may record 2/4 independent, fully justified point awards',()=>{
 const r=recordDailyV2RubricReview(review());
 assert.equal(r.marksEarned,2);assert.equal(r.marksPossible,4);
 assert.equal(r.fullCredit,false);assert.equal(r.autoGraded,false);
 assert.equal(r.releaseGrade,false);assert.equal(r.points[2].awarded,0);
});
test('all four explicitly reviewed point awards can be recorded without live credit',()=>{
 const r=recordDailyV2RubricReview(review({pointAwards:[1,1,1,1],
 reviewerNotes:['area','thin wall','blood transport','gradient']}));
 assert.equal(r.marksEarned,4);assert.equal(r.fullCredit,true);
 assert.equal(r.releaseGrade,false);
});
test('partial review cannot guess missing point decisions',()=>{
 assert.throws(()=>recordDailyV2RubricReview(review({pointAwards:[1,0]})),/one explicit award/);
});
test('negative or fractional point awards are rejected',()=>{
 assert.throws(()=>recordDailyV2RubricReview(review({pointAwards:[1,1,-1,0]})),/0 or 1/);
 assert.throws(()=>recordDailyV2RubricReview(review({pointAwards:[1,0.5,0,0]})),/0 or 1/);
});
test('all decisions need a written reviewer explanation',()=>{
 assert.throws(()=>recordDailyV2RubricReview(review({reviewerNotes:['area','','no blood','no gradient']})),/reviewer evidence/);
});
test('source checksum invalidates grading after question source changes',()=>{
 const altered={...q,answer:{...q.answer,markPoints:[...q.answer.markPoints]}};
 altered.answer.markPoints[0]='only one membrane';
 assert.throws(()=>recordDailyV2RubricReview(review({question:altered})),/stale question/);
});
test('staging record requires a reviewer and unique review ID',()=>{
 assert.throws(()=>recordDailyV2RubricReview(review({reviewerId:''})),/reviewer and review IDs/);
 assert.throws(()=>recordDailyV2RubricReview(review({reviewId:''})),/reviewer and review IDs/);
});
test('correct French accent omission is a model-match hint but not automatic awarding',()=>{
 const fr={topicId:'fr-rubric',subject:'french',year:8};
 const fq={...q,id:'fr-rubric-1',topicId:'fr-rubric',answer:{
  ...q.answer,modelAnswer:'Je me suis levée à sept heures.',
  accepted:['Je me suis levée à sept heures.'],markPoints:['past tense','pronoun','time','past participle'],totalMarks:4}};
 const p=previewDailyV2Rubric(fr,fq,'Je me suis levee a sept heures');
 assert.equal(p.modelAnswerMatch,true);assert.equal(p.marksEarned,null);
});
test('question of a different identity/topic may not be graded',()=>{
 assert.throws(()=>previewDailyV2Rubric(topic,{...q,topicId:'wrong-topic'},'answer'),/question identity/);
});
test('missing semantic rubric never allows marks, even if model text matches',()=>{
 assert.throws(()=>previewDailyV2Rubric(topic,{...q,answer:{...q.answer,requiresSemanticAssessment:false}},
  q.answer.modelAnswer),/rubric_review/);
});
