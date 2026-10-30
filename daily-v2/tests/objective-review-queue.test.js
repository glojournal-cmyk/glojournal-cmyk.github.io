import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadObjectiveReviewQueue,buildObjectiveReviewQueue,reviewQueueCsv}
 from '../scripts/build-objective-review-queue.mjs';

const queue=loadObjectiveReviewQueue();
test('review queue includes every real objective question, but none is teacher/scorer approved',()=>{
 assert.equal(queue.schemaVersion,1);
 assert.equal(queue.rows.length,191);
 assert.equal(queue.summary.sourceQuestions,191);
 assert.deepEqual(queue.summary.byMode,{
  numeric:46,pair_map:115,category_map:8,unordered_required_groups:22});
 assert.deepEqual(queue.summary.technicalPreview,{
  eligible:191,fullPreview:191,reviewRequired:0,errors:0,negativeFalseFull:0});
 assert.equal(queue.summary.curriculumCertified,0);
 assert.equal(queue.summary.scorerCertified,0);
 assert.equal(queue.summary.approvedForDaily,0);
 assert.equal(queue.summary.releaseReady,false);
 assert.equal(queue.summary.learnerDataRead,false);
 assert.equal(queue.summary.duplicateIds.length,0);
 for(const r of queue.rows){
  assert.equal(r.curriculumDecision,'pending');
  assert.equal(r.scorerDecision,'pending');
  assert.equal(r.curriculumCertified,false);
  assert.equal(r.scorerCertified,false);
  assert.equal(r.approvedForDaily,false);
  assert.equal(r.curriculumReviewer,'');
  assert.equal(r.scorerReviewer,'');
  assert.equal(r.curriculumEvidence,'');
  assert.equal(r.scoringEvidence,'');
  assert.match(r.sourceFingerprint,/^fnv1a32-[0-9a-f]{8}$/);
  assert.match(r.sourceSha256,/^[0-9a-f]{64}$/);
  assert.ok(r.sourceFile.startsWith('content/topics/'));
  assert.ok(r.prompt?.trim());
  assert.ok(r.markingRubric?.mode);
 }
});
test('real marks and areas for human educational review are preserved in worksheet',()=>{
 const byId=new Map(queue.rows.map(r=>[r.questionId,r]));
 const energy=byId.get('bio-y8-app-ber-55');
 assert.equal(energy.answerMode,'numeric');
 assert.equal(energy.markCeiling,2);
 assert.ok(energy.flags.includes('WORKING_METHOD_MARKS_NEED_REVIEW'));
 assert.ok(energy.flags.includes('NUMERIC_TOLERANCE_AND_UNITS_REVIEW'));
 const enzymes=byId.get('bio-y8-app-enzyme-pathways');
 assert.equal(enzymes.markCeiling,6);
 assert.ok(enzymes.flags.includes('TWO_INDEPENDENT_COMPONENTS_PER_PAIR'));
 const food=byId.get('bio-y8-app-food-test-match');
 assert.equal(food.markCeiling,8);
 assert.ok(food.flags.includes('TWO_INDEPENDENT_COMPONENTS_PER_PAIR'));
 const harms=byId.get('bio-y8-app-alcohol-foetus');
 assert.equal(harms.markCeiling,2);
 assert.ok(harms.flags.includes('OVERLAPPING_ACCEPTED_ALTERNATIVES'));
});
test('different prompt/answer/topic metadata changes immutable review source digest',()=>{
 const topic={topicId:'unit-science',subject:'biology',year:8,status:'enabled',
  questions:[{id:'unit-q1',topicId:'unit-science',status:'enabled',
   prompt:'What is the value?',format:'calculation',
   answer:{mode:'numeric',value:4,units:[],tolerance:0}}]};
 const make=()=>buildObjectiveReviewQueue([{sourceFile:'content/topics/unit-science.json',topic}]);
 const original=make().rows[0];
 topic.questions[0].answer.value=5;
 const adjusted=make().rows[0];
 assert.notEqual(original.sourceSha256,adjusted.sourceSha256);
 assert.notEqual(original.sourceFingerprint,adjusted.sourceFingerprint);
 assert.equal(adjusted.curriculumDecision,'pending');
 assert.equal(adjusted.scorerDecision,'pending');
});
test('disabled, preview and other-subject questions are never reviewable Daily V2 supply',()=>{
 const topic={topicId:'unit-science',subject:'biology',year:8,status:'enabled',
  questions:[
   {id:'enabled',topicId:'unit-science',status:'enabled',prompt:'Value?',
    answer:{mode:'numeric',value:4}},
   {id:'disabled',topicId:'unit-science',status:'disabled',prompt:'Value?',
    answer:{mode:'numeric',value:4}},
   {id:'preview',topicId:'unit-science',status:'preview',prompt:'Value?',
    answer:{mode:'numeric',value:4}}
  ]};
 const english={...topic,subject:'english',topicId:'unit-english',
  questions:[{...topic.questions[0],topicId:'unit-english',id:'other'}]};
 const q=buildObjectiveReviewQueue([{sourceFile:'content/topics/english.json',topic:english},
  {sourceFile:'content/topics/biology.json',topic}]);
 assert.deepEqual(q.rows.map(r=>r.questionId),['enabled']);
 assert.equal(q.summary.approvedForDaily,0);
});
test('CSV exports actual rubric and escaped values without dangerous spreadsheet formulas',()=>{
 const csv=reviewQueueCsv(queue);
 assert.ok(csv.includes('"sourceFingerprint"'));
 assert.ok(csv.includes('"curriculumDecision"'));
 assert.ok(csv.includes('"pending"'));
 assert.equal(csv.split('\r\n').length,queue.rows.length+2);
 const injected=buildObjectiveReviewQueue([{
  sourceFile:'content/topics/qa.csv-test.json',
  topic:{topicId:'csv-topic',subject:'physics',year:8,status:'enabled',
   questions:[{id:'qa-csv',topicId:'csv-topic',status:'enabled',
    prompt:'=HYPERLINK("https://invalid.test","click")',
    answer:{mode:'numeric',value:7,units:[]}}]}
 }]);
 const safe=reviewQueueCsv(injected);
 assert.ok(safe.includes('"\'=HYPERLINK(""https://invalid.test"",""click"")"'));
 assert.ok(!safe.includes('"=HYPERLINK('));
});
test('queue generation is deterministic and duplicate IDs are visible as blockers',()=>{
 const a=loadObjectiveReviewQueue();
 assert.equal(JSON.stringify(a),JSON.stringify(queue));
 const topic={topicId:'q',subject:'biology',year:8,status:'enabled',questions:[
  {id:'duplicate',topicId:'q',prompt:'Q1',answer:{mode:'numeric',value:1}},
  {id:'duplicate',topicId:'q',prompt:'Q2',answer:{mode:'numeric',value:2}}
 ]};
 const r=buildObjectiveReviewQueue([{sourceFile:'content/topics/q.json',topic}]);
 assert.deepEqual(r.summary.duplicateIds,['duplicate']);
 assert.equal(r.summary.technicalPreview.errors,1);
 assert.equal(r.summary.approvedForDaily,0);
});
