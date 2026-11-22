import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {
  FOOD_TESTS_QA_HOLD_IDS, FOOD_TESTS_QA_TOPIC,
  isFoodTestsQaHeld, canEarnFormalCredit, foodTestsPupilVerdict, saveHeldPracticeCompletion
} from '../assets/food-tests-qa-credit-gate-20261122.js';
import {verifiedQuizSlots,reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {saveVerifiedBiologyAnswerSync} from '../assets/daily-completed-session-receipts-20261024.js';
import {addMasteryEvidence} from '../assets/mastery-v2-20261018.js';
import {curriculumTopics,creditCurriculumAttempt} from '../assets/daily-curriculum-20261004.js';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';
import {preflightYear8Task} from '../assets/question-supply-preflight-20261111.js';
import {canAssignVerifiedYear8Mastery} from '../assets/year8-mastery-source-capacity-20261103.js';

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
  assert.ok(src.includes('saved?.unmarkedCompleted&&A.length&&A.every(isFoodTestsQaHeld)'),path);
  assert.ok(src.includes('if(ce&&A.length&&A.every(isFoodTestsQaHeld))return;let resumeURL'),path);
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

test('real catalog still provides two independent unheld 20-question Year 8 Mastery slots',()=>{
 const full=JSON.parse(read('content/catalog.json')).topics;
 const getCatalog=(subject,year)=>full.filter(t=>t.subject===subject&&Number(t.year)===year);
 const date='2026-11-22',state={today:date,year:9,daily:[],dailyLog:{},
    topicStats:{},formalAttemptLog:[],reviews:{},skillStats:{}};
 const plan=buildYear8DailyV2(state,getCatalog,{});
 const masteries=['y8-mastery-a','y8-mastery-b'].map(id=>plan.find(t=>t.id===id));
 assert.equal(masteries.length,2);
 for(const m of masteries){
   assert.ok(m,'both Mastery IDs must remain present');
   assert.equal(m.target,20,m.id);
   assert.notEqual(m.supplyBlocked,true,m.id);
   assert.equal(new URL(m.href,'https://scholar.invalid').searchParams.get('mode'),'mastery',m.id);
   assert.ok(m.assignedTopic,m.id);
   assert.equal(isFoodTestsQaHeld(m.assignedTopic),false,m.id);
   assert.equal(canAssignVerifiedYear8Mastery(m.assignedTopic),true,m.assignedTopic);
   assert.equal(preflightYear8Task(m.assignedTopic,state,20).canStart,true,m.assignedTopic);
 }
 assert.notEqual(masteries[0].assignedTopic,masteries[1].assignedTopic,'Mastery must use independent bank families');
 assert.ok(plan.filter(t=>t.assignedTopic===FOOD_TESTS_QA_TOPIC).length===0,
   'new plan must never route to held Food Tests');
});

test('iPad unmarked completion reports saved only after durable draft-save acknowledgment',async()=>{
 const data={base:[{id:'bio-y8-food-tests-test'}],sessionLog:[],ce:false,unmarkedCompleted:true};
 const calls=[];
 assert.equal(await saveHeldPracticeCompletion({save:async(k,v)=>{calls.push([k,v]);return true;}},'held-practice',data),true);
 assert.equal(calls.length,1);
 assert.equal(calls[0][0],'held-practice');
 assert.strictEqual(calls[0][1],data);
 assert.equal(await saveHeldPracticeCompletion({save:()=>false},'held-practice',data),false);
 assert.equal(await saveHeldPracticeCompletion({save:()=>undefined},'held-practice',data),false);
 assert.equal(await saveHeldPracticeCompletion({save:()=>{throw Error('quota exceeded')}},'held-practice',data),false);
 assert.equal(await saveHeldPracticeCompletion(null,'held-practice',data),false);
 assert.equal(await saveHeldPracticeCompletion({save:()=>true},'',data),false);
 let confirm;
 const pending=saveHeldPracticeCompletion({save:()=>new Promise(resolve=>{confirm=resolve})},'held-practice',data,300);
 await Promise.resolve();
 await Promise.resolve();
 assert.equal(typeof confirm,'function');
 confirm(true);
 assert.equal(await pending,true,'completion waits for the actual save result');
 assert.equal(await saveHeldPracticeCompletion({save:()=>new Promise(()=>{})},'held-practice',data,15),false,
   'stalled IndexedDB/localStorage save must fail closed instead of trapping Finish');
});

test('both quiz routes must await persisted practice before showing a saved result',()=>{
 for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
  const src=read(path),start=src.indexOf('if(A.length&&A.every(isFoodTestsQaHeld)){');
  const end=src.indexOf('// The result card must reconcile actual checked answers',start);
  assert.ok(start>0&&end>start,path);
  const branch=src.slice(start,end);
  assert.ok(src.includes('async function pe()'),path);
  assert.ok(branch.includes('const savedPractice=await saveHeldPracticeCompletion'),path);
  assert.ok(branch.includes('ce:!1,unmarkedCompleted:!0,sessionLog,J'),path);
  assert.ok(branch.includes('setFinishFailure(\'Practice could not be saved. Keep this page open and retry Finish.\')'),path);
  assert.ok(branch.includes('if(!savedPractice){'),path);
  const save=branch.indexOf('const savedPractice=await saveHeldPracticeCompletion');
  const fail=branch.indexOf('if(!savedPractice){');
  const final=branch.indexOf('le(!0)');
  const toast=branch.indexOf("u('Practice saved'");
  assert.ok(save>=0&&fail>save&&final>fail&&toast>final,
   'never transition to result or toast until save success');
  const failed=branch.slice(fail,final);
  assert.ok(failed.includes('setDraftError(true)')&&failed.includes('return;'),
   'failed save must leave the question visible and allow retry');
 }
});

test('actual iPad practice-drafts store keeps unmarked completion after a simulated browser restart',async()=>{
 // Execute the real production draft-storage IIFE with IndexedDB unavailable,
 // as on Safari private/restricted devices. localStorage fallback must verify.
 const src=read('assets/practice-drafts-20261004.js');
 const localRows=new Map(),sessionRows=new Map();
 const store=rows=>({
   getItem:k=>rows.has(k)?rows.get(k):null,
   setItem:(k,v)=>{rows.set(k,String(v));},
   removeItem:k=>{rows.delete(k);}
 });
 const local=store(localRows),session=store(sessionRows);
 const open=()=>{
  const sandbox={localStorage:local,sessionStorage:session,URL,Intl,Date,
    Promise,setTimeout,clearTimeout,console};
  vm.runInNewContext(src,sandbox,{filename:'practice-drafts-20261004.js'});
  return sandbox.LuxPracticeDrafts;
 };
 const first=open(),key='food-tests-held-completion-20261122';
 const payload={base:[topicQ[0]],rr:[],j:0,N:'iodine solution',G:{
    practiceOnly:true,ok:false,model:'Practice saved. Not a formal mark.'
   },sessionLog:[{questionId:topicQ[0].id,formal:false,correct:false}],
   ce:false,unmarkedCompleted:true,href:'/study/biology/practise?topic=bio-y8-food-tests',title:'Food Tests'};
 assert.equal(await saveHeldPracticeCompletion(first,key,payload,2500),true);
 assert.equal(first.read(key)?.unmarkedCompleted,true,'record must be retrievable immediately');
 const before=localRows.get('lux-practice-drafts-v1');
 assert.ok(before&&before.includes('unmarkedCompleted'),'verified fallback must contain completed practice');
 const restored=open().read(key);
 assert.equal(restored?.unmarkedCompleted,true,'new app instance must reopen unmarked completion');
 assert.equal(restored?.ce,false,'destructive draft-clear flag must be absent');
 assert.equal(restored?.sessionLog?.[0]?.formal,false,'history remains explicitly ungraded');
 assert.equal(restored?.base?.[0]?.id,topicQ[0].id);
 assert.equal(await saveHeldPracticeCompletion(first,key,{...payload,ce:true}),false,
   'helper must refuse legacy ce:true which would DELETE the saved draft');
 assert.equal(localRows.get('lux-practice-drafts-v1'),before,
   'rejected destructive completion must leave storage byte-for-byte unchanged');
});
