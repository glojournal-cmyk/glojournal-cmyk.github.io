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
import {curriculumTopics,creditCurriculumAttempt} from '../assets/daily-curriculum-20261004.js';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';

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
 assert.equal(isFoodTestsQaHeld(FOOD_TESTS_QA_TOPIC),true,'exact topic string must be held for older saved Daily cards');
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

test('unmarked Food Tests remain neutral at quiz completion and review-history screens',()=>{
 const resultModule=read('assets/session-reflection-20261004.js');
 assert.ok(resultModule.includes('unmarked=false'), 'unmarked flag must not alter other subject result views');
 const start=resultModule.indexOf("if(unmarked)return h('section'");
 const end=resultModule.indexOf('const points=improvementPoints',start);
 assert.ok(start>=0&&end>start,'neutral branch must return before graded result calculations');
 const neutral=resultModule.slice(start,end);
 assert.ok(neutral.includes('Practice saved. Not a formal mark.'));
 assert.ok(neutral.includes('No right or wrong decision was made'));
 assert.ok(neutral.includes('does not earn Daily, MP, Mastery or XP credit'));
 assert.ok(!neutral.includes('String(first)'));
 assert.ok(!neutral.includes('score.percentage'));
 assert.ok(!neutral.includes('Detailed results & skill analysis'));
 for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
  const src=read(path);
  assert.ok(src.includes('unmarked:A.length>0&&A.every(isFoodTestsQaHeld)'),path);
  assert.ok(src.includes('if(A.length&&A.every(isFoodTestsQaHeld)){'),path);
  assert.ok(src.includes("u('Practice saved',{description:'Not a formal mark. No Daily / MP / Mastery credit.'})"),path);
  assert.ok(src.includes('A.filter(e=>e.formal!==!1&&!isFoodTestsQaHeld(e))'),path);
  assert.ok(src.includes('correction=G&&!G.practiceOnly?buildCorrection'),path);
  assert.ok(src.includes('!isFoodTestsQaHeld(Y)?(0,T.jsx)(ReviewProgress'),path);
  assert.ok(src.includes('!qaHeld&&window.dispatchEvent(new CustomEvent("scholar:question-answered"'),path);
 }
});

test('QA-held Food Tests cannot be newly assigned; already-started Daily records remain pinned',()=>{
 const catalog=JSON.parse(read('content/catalog.json')).topics;
 const getCatalog=(subject,year)=>catalog.filter(t=>t.subject===subject&&Number(t.year)===year);
 const biology=curriculumTopics('biology',8,getCatalog,{});
 assert.ok(biology.length>1);
 assert.equal(biology.some(t=>t.topicId===FOOD_TESTS_QA_TOPIC),false);
 const today='2026-11-22';
 const old={id:'y8-standard-a',planDate:today,assignedSubject:'biology',
   assignedYear:8,assignedTopic:FOOD_TESTS_QA_TOPIC,assignedLabel:'Food tests',
   target:10,progress:0,done:false,
   href:'/study/biology/practise?daily=1&locked=1&year=8&mode=standard&task=y8-standard-a&topic='+FOOD_TESTS_QA_TOPIC};
 const state={today,daily:[old],dailyLog:{},year:8,formalAttemptLog:[],
   reviews:{},topicStats:{},skillStats:{}};
 const fresh=buildYear8DailyV2(state,getCatalog,{}).find(t=>t.id===old.id);
 assert.ok(fresh,'Daily task should still exist');
 assert.notEqual(fresh.assignedTopic,FOOD_TESTS_QA_TOPIC,'unopened held question bank must rotate');
 assert.ok(!isFoodTestsQaHeld(fresh.assignedTopic),'reassigned topic must be eligible');
 assert.equal(old.assignedTopic,FOOD_TESTS_QA_TOPIC,'original task must not be edited');
 const started=buildYear8DailyV2({...state,daily:[{...old,progress:3}]},getCatalog,{})
   .find(t=>t.id===old.id);
 assert.equal(started.assignedTopic,FOOD_TESTS_QA_TOPIC,'started history stays pinned');
 assert.equal(started.progress,3,'historical marks are never rewritten');
});
test('neutral end-screen renders no grade or misleading XP/skill analysis',()=>{
 const source=read('assets/session-reflection-20261004.js');
 const start=source.indexOf("if(unmarked)return h('section'");
 const end=source.indexOf('const points=improvementPoints',start);
 assert.ok(start>=0&&end>start);
 // Execute only the isolated, early-return neutral view using a minimal element
 // factory. No React, browser, source data or learner store is required.
 const render=new Function('h','unmarked','backHref',source.slice(start,end)+'return null;');
 const h=(type,props,...children)=>({type,props:props||{},children});
 const node=render(h,true,'/study/biology/practise');
 assert.equal(node?.props?.['aria-label'],'Unmarked practice saved');
 const strings=[];
 const visit=x=>{
   if(typeof x==='string')strings.push(x);
   else if(Array.isArray(x))x.forEach(visit);
   else if(x&&typeof x==='object')visit(x.children);
 };
 visit(node);
 const visible=strings.join(' | ');
 assert.ok(visible.includes('Practice saved. Not a formal mark.'),visible);
 assert.ok(visible.includes('No right or wrong decision was made'),visible);
 assert.ok(visible.includes('does not earn Daily, MP, Mastery or XP credit'),visible);
 assert.equal(/First-pass correct|Session score|\d+\s*\/\s*\d+|\d+%|Detailed results & skill analysis|No missed answers/.test(visible),false,visible);
 assert.equal(render(h,false,'/study/biology/practise'),null,'nonheld subjects continue through unchanged graded renderer');
});

test('held topic is excluded from formal curriculum-credit ledger',()=>{
 const prior={'2026-11-22':{sentinel:true}};
 const result=creditCurriculumAttempt(prior,{questionId:topicQ[0].id,topicId:FOOD_TESTS_QA_TOPIC,
   task:'y8-practise',mode:'standard',day:'2026-11-22',formal:true,repair:false});
 assert.strictEqual(result,prior);
 const future=creditCurriculumAttempt(prior,{questionId:'unseen-food-20261122',topicId:FOOD_TESTS_QA_TOPIC,
   task:'y8-practise',mode:'standard',day:'2026-11-22',formal:true,repair:false});
 assert.strictEqual(future,prior);
});
