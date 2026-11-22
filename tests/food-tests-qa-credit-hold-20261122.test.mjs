import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FOOD_TESTS_QA_HOLD_IDS,FOOD_TESTS_QA_TOPIC,isFoodTestsQaHeld,canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
import {verifiedQuizSlots,reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {saveVerifiedBiologyAnswerSync} from '../assets/daily-completed-session-receipts-20261024.js';
import {addMasteryEvidence} from '../assets/mastery-v2-20261018.js';
import {scoreConceptChoices,validateConceptChoiceItem} from '../assets/food-tests-structured-concept-checks-20261122.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const bank=read('content/topics/bio-y8-food-tests.json');
const register=read('qa/academic-qa-bio-y8-food-tests-items.json');
const draft=read('qa/food-tests-structured-mark-points-draft-20261122.json');
const q=bank.questions[0];
test('All 143 food test questions are held even when enabled',()=>{
 assert.equal(bank.questions.length,143);
 assert.deepEqual([...FOOD_TESTS_QA_HOLD_IDS].sort(),bank.questions.map(x=>x.id).sort());
 assert.equal(register.approved,0);
 assert.equal(register.questionsRegister.filter(x=>x.approved||x.independentReviewerDecision!=='pending').length,0);
 for(const x of bank.questions){assert.equal(isFoodTestsQaHeld(x),true,x.id);assert.equal(canEarnFormalCredit(x),false,x.id);}
 assert.equal(isFoodTestsQaHeld({id:'future-food',topicId:FOOD_TESTS_QA_TOPIC}),true);
 assert.equal(isFoodTestsQaHeld('unrelated-maths-item'),false);
});
test('Correct answer cannot create verified Food Tests Daily slot',()=>{
 assert.deepEqual(verifiedQuizSlots([q],[{questionId:q.id,correct:true,formal:true}]),[]);
 const other={id:'other-biolog-id',topicId:'other-topic'};
 assert.equal(verifiedQuizSlots([other],[{questionId:other.id,correct:true,formal:true}]).length,1);
});
test('Locked Food Tests Daily receipt cannot change historical progress',()=>{
 const task={id:'y8-standard-a',planDate:'2026-11-22',assignedTopic:FOOD_TESTS_QA_TOPIC,assignedSubject:'biology',
  assignedYear:8,target:10,progress:3,done:false,href:'/study/biology/practise?daily=1&locked=1&task=y8-standard-a&topic=bio-y8-food-tests&mode=standard&year=8'};
 const state={today:'2026-11-22',daily:[task],formalAttemptLog:[],dailyLog:{}};
 const result=reconcileDailySession(state,{day:state.today,taskId:task.id,subject:'biology',year:8,mode:'standard',
  questions:[q],answers:[{questionId:q.id,correct:true,formal:true}]});
 assert.equal(result.changed,false);assert.equal(result.reason,'academic-qa-hold');
 assert.equal(result.progress,3);assert.strictEqual(result.daily,state.daily);
});
test('Synchronous iPad Biology receipt refuses held correct answers',()=>{
 const day='2026-11-22',state={today:day,daily:[{id:'year9-light',assignedSubject:'biology',assignedYear:9,assignedTopic:FOOD_TESTS_QA_TOPIC}]};
 assert.equal(saveVerifiedBiologyAnswerSync(state,{day,taskId:'year9-light',subject:'biology',year:9,
  questions:[q],answers:[{questionId:q.id,correct:true,formal:true,repair:false}]}),false);
});
test('Held Food Tests evidence cannot raise Mastery',()=>{
 const old={stage:'learning',roundTarget:20,attempts:[]};
 const result=addMasteryEvidence({masteryV2:old},{questionId:q.id,year:8,mode:'mastery',day:'2026-11-22',
  correct:true,formal:true,format:'mark_points'});
 assert.strictEqual(result,old);
});
test('QuizSession practice feedback remains, while XP, Daily and formal records are gated',()=>{
 for(const p of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
  const src=fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
  assert.match(src,/const qaHeld=isFoodTestsQaHeld\(Y\);const formalOk=!qaHeld&&n\.ok/);
  assert.match(src,/correct:!!formalOk/);
  assert.match(src,/correct:formalOk/);
  assert.match(src,/formal:!qaHeld&&Y\.formal!==!1/);
  assert.match(src,/!qaHeld&&x\(Y\.id,formalOk,a,/);
  assert.match(src,/qaHeld\|\|!!Y\._dailyYear8/);
  assert.match(src,/foodTestsPupilVerdict\(Y\)/);
  assert.match(src,/Practice saved\. Not a formal mark\./);
  assert.equal(src.includes('${n.model||L(Y)}'), false);
 }
});
test('All 52 structured concept drafts are unapproved and cannot score',()=>{
 assert.equal(draft.items.length,52);assert.equal(draft.approved,0);
 for(const item of draft.items){
  assert.equal(validateConceptChoiceItem(item).valid,false,item.sourceId);
  const result=scoreConceptChoices(item,{});
  assert.equal(result.formalCreditEligible,false);assert.equal(result.score,0);
 }
});
test('Even a fully specified deterministic concept check does not unlock current bank',()=>{
 const item={academicReview:'approved',parts:[{pointId:'sample::p1',approved:true,
  options:[{id:'a'},{id:'b'},{id:'c'},{id:'d'}],correctOptionId:'b'}]};
 assert.equal(validateConceptChoiceItem(item).valid,true);
 const got=scoreConceptChoices(item,{'sample::p1':'b'});
 assert.equal(got.score,1);assert.equal(got.formalCreditEligible,false);
});
