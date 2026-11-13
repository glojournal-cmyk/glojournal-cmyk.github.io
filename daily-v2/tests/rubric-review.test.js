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

test('real Biology mark_points source can enter manual point-by-point review with no auto marks',async()=>{
 const {readFileSync}=await import('node:fs');
 const real=JSON.parse(readFileSync(new URL('../../content/topics/bio-y8-balanced-diet.json',import.meta.url),'utf8'));
 const question=real.questions.find(x=>x.id==='bio-y8-balanced-diet-balanced-diet-explain');
 assert.equal(question.answer.mode,'mark_points');
 assert.equal(question.answer.markPoints.length,1);
 const preview=previewDailyV2Rubric(real,question,'A balanced diet has all essential nutrients.');
 assert.equal(preview.status,'review-required');
 assert.equal(preview.sourceAnswerMode,'mark_points');
 assert.equal(preview.marksEarned,null);
 assert.equal(preview.correct,null);
 assert.equal(preview.releaseGrade,false);
 const reviewed=recordDailyV2RubricReview({
  topic:real,question,studentResponse:'A balanced diet has all essential nutrients.',
  sourceFingerprint:preview.sourceFingerprint,reviewerId:'test-independent-reviewer',
  reviewId:'test-biology-001',pointAwards:[1],
  reviewerNotes:['Reviewer explicitly checked the criterion against the submitted response']
 });
 assert.equal(reviewed.marksEarned,1);
 assert.equal(reviewed.marksPossible,1);
 assert.equal(reviewed.autoGraded,false);
 assert.equal(reviewed.releaseGrade,false);
});
test('real source mark_points reviewer cannot grant grade from word match or missing notes',async()=>{
 const {readFileSync}=await import('node:fs');
 const real=JSON.parse(readFileSync(new URL('../../content/topics/bio-y8-balanced-diet.json',import.meta.url),'utf8'));
 const question=real.questions.find(x=>x.id==='bio-y8-balanced-diet-carbohydrate-explain');
 const sourceFingerprint=fingerprintDailyV2Source(real,question);
 const preview=previewDailyV2Rubric(real,question,question.answer.modelAnswer);
 assert.equal(preview.marksEarned,null,'matching the published answer is not automatic credit');
 assert.throws(()=>recordDailyV2RubricReview({
  topic:real,question,studentResponse:question.answer.modelAnswer,sourceFingerprint,
  reviewerId:'reviewer',reviewId:'test',pointAwards:[1],reviewerNotes:['']
 }),/reviewer evidence/);
});
test('source mark_points cannot be reviewed if its explicit mark ceiling conflicts with point count',()=>{
 const p={...q,id:'mismatched-source-1',answer:{mode:'mark_points',markPoints:['first','second'],totalMarks:3}};
 assert.throws(()=>previewDailyV2Rubric(topic,p,'first second'),/invalid scored mark-point rubric/);
});
test('editing an existing source mark point after preview invalidates the manual review receipt',async()=>{
 const {readFileSync}=await import('node:fs');
 const real=JSON.parse(readFileSync(new URL('../../content/topics/bio-y8-balanced-diet.json',import.meta.url),'utf8'));
 const question=real.questions.find(x=>x.id==='bio-y8-balanced-diet-balanced-diet-explain');
 const original=fingerprintDailyV2Source(real,question);
 const altered={...question,answer:{...question.answer,markPoints:['changed scientific criterion']}};
 assert.throws(()=>recordDailyV2RubricReview({
  topic:real,question:altered,studentResponse:'Some nutrients',
  sourceFingerprint:original,reviewerId:'reviewer',reviewId:'r1',
  pointAwards:[0],reviewerNotes:['No point met']
 }),/stale question/);
});

test('actual Physics three-mark energy explanation supports explicit manual 2/3 recording only',async()=>{
 const {readFileSync}=await import('node:fs');
 const real=JSON.parse(readFileSync(new URL('../../content/topics/phys-y8-energy-stores-transfers.json',import.meta.url),'utf8'));
 const question=real.questions.find(x=>x.id==='phys-y8-energy-stores-transfers-conservation-apply');
 assert.equal(question.answer.mode,'numeric');
 assert.equal(question.answer.totalMarks,3);
 assert.equal(question.answer.markPoints.length,3);
 const preview=previewDailyV2Rubric(real,question,
  '180 J left, it was transferred as heat.');
 assert.equal(preview.marksEarned,null);
 assert.equal(preview.marksPossible,3);
 assert.equal(preview.sourceAnswerMode,'numeric');
 assert.equal(preview.releaseGrade,false);
 const reviewed=recordDailyV2RubricReview({
  topic:real,question,studentResponse:'180 J left, it was transferred as heat.',
  sourceFingerprint:preview.sourceFingerprint,reviewerId:'qa-test-only',
  reviewId:'qa-energy-three-criteria',
  pointAwards:[1,1,0],reviewerNotes:[
   'Reviewer manually confirmed 500 minus 320',
   'Reviewer manually confirmed energy transferred elsewhere',
   'Conservation/non-destruction claim not stated'
  ]
 });
 assert.equal(reviewed.marksEarned,2);
 assert.equal(reviewed.marksPossible,3);
 assert.equal(reviewed.fullCredit,false);
 assert.equal(reviewed.autoGraded,false);
 assert.equal(reviewed.releaseGrade,false);
});
test('2/3-mark numeric without individual markPoints cannot be manually guessed or released',async()=>{
 const {readFileSync}=await import('node:fs');
 const real=JSON.parse(readFileSync(new URL('../../content/topics/phys-y8-moments-levers.json',import.meta.url),'utf8'));
 const question=real.questions.find(x=>x.id==='phys-y8-moments-levers-challenge');
 assert.equal(question.answer.totalMarks,3);
 assert.ok(!question.answer.markPoints?.length);
 assert.throws(()=>previewDailyV2Rubric(real,question,'42 N'),/invalid scored mark-point rubric/);
});
test('numeric reviewer cannot award 2/2 on changed source or omit independent point notes',async()=>{
 const {readFileSync}=await import('node:fs');
 const real=JSON.parse(readFileSync(new URL('../../content/topics/phys-y8-moments-levers.json',import.meta.url),'utf8'));
 const question=real.questions.find(x=>x.id==='phys-y8-moments-levers-direction-apply');
 const response='8 N m clockwise, because the moments act in the same direction.';
 const preview=previewDailyV2Rubric(real,question,response);
 assert.equal(preview.markPoints.length,2);
 const input={topic:real,question,studentResponse:response,
  sourceFingerprint:preview.sourceFingerprint,reviewerId:'qa-reviewer',
  reviewId:'qa-two-point',pointAwards:[1,1],
  reviewerNotes:['direction checked','sum and clockwise checked']};
 assert.equal(recordDailyV2RubricReview(input).marksEarned,2);
 assert.throws(()=>recordDailyV2RubricReview({...input,reviewerNotes:['','yes']}),
  /reviewer evidence/);
 const altered={...question,answer:{...question.answer,units:['N']}};
 assert.throws(()=>recordDailyV2RubricReview({...input,question:altered}),
  /stale question/);
});
