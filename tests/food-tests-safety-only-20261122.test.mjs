import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  FOOD_TESTS_QA_HOLD_IDS, FOOD_TESTS_QA_TOPIC,
  isFoodTestsQaHeld, canEarnFormalCredit, foodTestsPupilVerdict
} from '../assets/food-tests-qa-credit-gate-20261122.js';
import {verifiedQuizSlots,reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {saveVerifiedBiologyAnswerSync} from '../assets/daily-completed-session-receipts-20261024.js';
import {addMasteryEvidence} from '../assets/mastery-v2-20261018.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const bank=JSON.parse(read('content/topics/bio-y8-food-tests.json'));
const topicQ=bank.questions;

test('exactly the existing 143 Food Tests questions are on academic hold',()=>{
 assert.equal(topicQ.length,143);
 assert.deepEqual([...FOOD_TESTS_QA_HOLD_IDS].sort(),topicQ.map(q=>q.id).sort());
 for(const q of topicQ){
  assert.equal(isFoodTestsQaHeld(q),true,q.id);
  assert.equal(canEarnFormalCredit(q),false,q.id);
  const reply=foodTestsPupilVerdict(q);
  assert.equal(reply.practiceOnly,true);
  assert.equal(reply.formalCredit,false);
  assert.equal(reply.errorKind,'unmarked');
  assert.equal(reply.score,null);
  assert.equal(reply.total,null);
  assert.equal(reply.pointResults,null);
  assert.equal(reply.model,'Practice saved. Not a formal mark.');
 }
 const other={id:'unrelated-biology-question',topicId:'bio-y8-nutrition'};
 assert.equal(isFoodTestsQaHeld(other),false);
 assert.equal(foodTestsPupilVerdict(other),null);
 assert.equal(isFoodTestsQaHeld({id:'future',topicId:FOOD_TESTS_QA_TOPIC}),true);
});

test('new held Food Tests answers cannot earn verified Daily slots or Mastery evidence',()=>{
 const q=topicQ[0];
 assert.deepEqual(verifiedQuizSlots([q],[{questionId:q.id,correct:true,formal:true}]),[]);
 const old={stage:'learning',attempts:[]};
 assert.strictEqual(addMasteryEvidence({masteryV2:old},{
  questionId:q.id,year:8,mode:'mastery',day:'2026-11-22',
  correct:true,formal:true,format:'mark_points'
 }),old);
 const state={today:'2026-11-22',daily:[{
  id:'y8-standard-a',planDate:'2026-11-22',assignedTopic:FOOD_TESTS_QA_TOPIC,
  assignedSubject:'biology',assignedYear:8,target:10,progress:3,done:false
 }],formalAttemptLog:[],dailyLog:{}};
 const result=reconcileDailySession(state,{day:'2026-11-22',taskId:'y8-standard-a',subject:'biology',year:8,
  mode:'standard',questions:[q],answers:[{questionId:q.id,correct:true,formal:true}]});
 assert.equal(result.changed,false);
 assert.equal(result.reason,'academic-qa-hold');
 assert.equal(result.progress,3);
 assert.strictEqual(result.daily,state.daily);
 assert.equal(saveVerifiedBiologyAnswerSync(state,{
  day:'2026-11-22',taskId:'y8-standard-a',subject:'biology',year:8,
  questions:[q],answers:[{questionId:q.id,correct:true,formal:true,repair:false}]
 }),false);
});

test('both live quiz bundles bypass untrusted marking and suppress answer leaks and new credit',()=>{
 for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
  const src=read(path);
  assert.ok(src.includes('n=qaHeld?foodTestsPupilVerdict(Y):B(Y,t,a'),path);
  assert.ok(src.includes('practiceOnly:qaHeld'),path);
  assert.ok(src.includes("officialAnswer:qaHeld?'':(n.model||L(Y))"),path);
  assert.ok(src.includes("staticExplanation:qaHeld?'':"),path);
  assert.ok(src.includes('correct:!!formalOk'),path);
  assert.ok(src.includes('formal:!qaHeld&&Y.formal!==!1'),path);
  assert.ok(src.includes('!qaHeld&&x(Y.id,formalOk,a,'),path);
  assert.ok(src.includes('!qaHeld&&!formalOk&&!Y._repair'),path);
  assert.ok(src.includes('!qaHeld&&_&&(n.ok?ee:h)()'),path);
  assert.ok(src.includes('...(G.practiceOnly?[]:G.ok?'),path);
  assert.ok(src.includes('!G.practiceOnly&&correction?.missingWords.length'),path);
  assert.ok(src.includes('!G.practiceOnly&&!G.ok&&correction?.reason'),path);
  assert.ok(src.includes('!G.practiceOnly&&!G.ok&&correction?.rule'),path);
  assert.ok(src.includes('G.practiceOnly?`Practice saved. Not a formal mark.`'),path);
  assert.ok(src.includes('G&&!isFoodTestsQaHeld(Y)&&B(Y,e,a).ok'),path);
  assert.equal(src.includes('n.ok&&!Y._repair&&Y.formal!==!1&&se'),false,path);
 }
});

test('this isolated patch does not import the unreviewed 99-point draft or heuristic rubric repairs',()=>{
 for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
  const src=read(path);
  assert.equal(src.includes('food-tests-structured-concept-checks'),false);
  assert.equal(src.includes('food-tests-remaining-37-rubric'),false);
  assert.equal(src.includes('food-tests-six-guarded-rubric'),false);
  assert.equal(src.includes('food-tests-ethanol-rubric'),false);
 }
});
