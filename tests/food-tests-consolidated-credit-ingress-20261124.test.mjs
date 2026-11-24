import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isFoodTestsQaHeld,FOOD_TESTS_QA_TOPIC} from '../assets/food-tests-qa-credit-gate-20261122.js';
import {curriculumTopics,curriculumAssignment,selectProgressionQuestions,creditCurriculumAttempt} from '../assets/daily-curriculum-20261004.js';
import {reconcileDailySession,verifiedQuizSlots} from '../assets/daily-session-credit-20261021.js';
import {addMasteryEvidence} from '../assets/mastery-v2-20261018.js';
import {saveVerifiedBiologyAnswerSync,saveCompletedDailyReceipt} from '../assets/daily-completed-session-receipts-20261024.js';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const c=JSON.parse(raw('qa/food-tests-143-consolidated-held-candidate-20261124.json'));
const units=c.rotation.units, day='2026-11-24';
const other='other-biology-topic', alias='display-wrapper-id';
const task={id:'y8-standard-a',planDate:day,assignedSubject:'biology',assignedYear:8,assignedTopic:other,target:10,progress:0,done:false,href:'/study/biology/practise?daily=1&locked=1&task=y8-standard-a&topic='+other+'&mode=standard&year=8'};
const state={today:day,daily:[task],dailyLog:{},formalAttemptLog:[]};
const receipt={day,taskId:task.id,subject:'biology',year:8,mode:'standard'};
test('all 190 direct and wrapped IDs excluded from curriculum selection and ledger; unrelated Biology unaffected',()=>{
 assert.equal(units.length,190);
 const ledger={history:{old:true}};
 const q={id:'unrelated-id',topicId:other,format:'mc_single',formal:true,status:'enabled'};
 const common={day,task:'y8-practise',mode:'standard',topicId:other,formal:true};
 for(const u of units){
  for(const candidate of [{...q,id:u.id},{...q,id:alias,sourceId:u.sourceId,pointId:u.id}]){
   assert.deepEqual(selectProgressionQuestions([candidate,q],'standard',10).map(x=>x.id),[q.id]);
   assert.deepEqual(selectProgressionQuestions([candidate],'mastery',20),[]);
   assert.strictEqual(creditCurriculumAttempt(ledger,{...common,...candidate,questionId:candidate.id}),ledger);
  }
 }
 assert.notStrictEqual(creditCurriculumAttempt(ledger,{...common,questionId:q.id}),ledger);
 const held={topicId:FOOD_TESTS_QA_TOPIC,title:'Food tests',status:'enabled',enabled:143};
 const allowed={topicId:other,title:'Other',status:'enabled',enabled:30};
 const catalog=()=>[held,allowed];
 assert.deepEqual(curriculumTopics('biology',8,catalog).map(t=>t.topicId),[other]);
 const old={...task,assignedTopic:FOOD_TESTS_QA_TOPIC,progress:3};
 assert.equal(curriculumAssignment({...state,year:8},2,old,catalog).topicId,FOOD_TESTS_QA_TOPIC);
 assert.equal(old.progress,3);
});
test('all 190 direct and wrapped answers and journal events leave daily progress and Mastery unchanged',()=>{
 const mastery={stage:'learning',roundTarget:20,attempts:[]};
 for(const u of units){
  const q={id:alias,topicId:other};
  for(const id of [u.id,alias]){
   const question={...q,id};
   const answer={questionId:id,correct:true,formal:true,...(id===alias?{pointId:u.id,sourceId:u.sourceId}:{})};
   assert.deepEqual(verifiedQuizSlots([question],[answer]),[]);
   assert.strictEqual(reconcileDailySession(state,{...receipt,questions:[question],answers:[answer]}).daily,state.daily);
   const event={...answer,day,dailyTaskId:task.id,subject:'biology',year:8,topicId:other};
   assert.strictEqual(reconcileDailySession({...state,formalAttemptLog:[event]},{...receipt,questions:[],answers:[]}).daily,state.daily);
   assert.strictEqual(addMasteryEvidence({masteryV2:mastery},{...event,mode:'mastery',format:'typed_short'}),mastery);
  }
 }
 assert.equal(reconcileDailySession(state,{...receipt,questions:[{id:alias,topicId:other}],answers:[{questionId:alias,correct:true,formal:true}]}).progress,1);
 assert.equal(task.progress,0);assert.deepEqual(mastery.attempts,[]);
});
test('all 190 direct/wrapped held responses refuse Safari compact receipt persistence',async()=>{
 const t={...task,id:'year9-light',assignedYear:9,href:'/study/biology/practise?daily=1&locked=1&task=year9-light&topic='+other+'&mode=standard&year=9'};
 const st={...state,daily:[t]}, base={...receipt,taskId:t.id,year:9};
 for(const u of units){
  for(const id of [u.id,alias]){
   const data={...base,questions:[{id,topicId:other}],answers:[{questionId:id,correct:true,formal:true,...(id===alias?{pointId:u.id,sourceId:u.sourceId}:{})}]};
   assert.equal(saveVerifiedBiologyAnswerSync(st,data),false);
   assert.equal(await saveCompletedDailyReceipt(st,data),false);
  }
 }
 assert.equal(t.progress,0);
});
// Extract only the actual entry guards, with a trap for any store access.
// This is not a full Zustand/browser integration test.
const index=raw('assets/index-BLVOhKhN.js');
function prefix(start,end,tail){
 const a=index.indexOf(start),b=index.indexOf(end,a);assert.ok(a>=0&&b>a);
 return index.slice(a,b)+tail;
}
test('actual store ingress returns before state read for every direct or wrapped held unit',()=>{
 const guard=prefix('function patchedRecordAttempt(','  const before = store.getState();','  return store.getState();\n}');
 let reads=0;
 const f=new Function('isFoodTestsQaHeld','store',guard+'\nreturn patchedRecordAttempt;')(isFoodTestsQaHeld,{getState(){reads++;return 'unrelated';}});
 for(const u of units){
  for(const [id,meta] of [[u.id,{}],[alias,{sourceId:u.sourceId,pointId:u.id}]]){
   const r=f(id,true,'biology',meta);assert.equal(r.formalCredit,false);assert.equal(r.awarded,0);
  }
 }
 assert.equal(reads,0);
 assert.equal(f('unrelated-id',true,'biology',{}),'unrelated');assert.equal(reads,1);
});
test('actual reward entry guards deny held topic before any XP or MP write',()=>{
 const mp=prefix('function awardMasteryPoints(','  try {','  return 123;\n}');
 const first=prefix('function awardFirstTopicMastery(','  const state = store.getState();','  return 123;\n}');
 const retention=prefix('function awardMasteryRetention(','  const reward = patchedAward','  return 123;\n}');
 const f=new Function('isFoodTestsQaHeld','window',mp+'\n'+first+'\n'+retention+'\nreturn [awardMasteryPoints,awardFirstTopicMastery,awardMasteryRetention];')(isFoodTestsQaHeld,{});
 assert.equal(f[0]('mastery',FOOD_TESTS_QA_TOPIC),0);
 assert.equal(f[1](FOOD_TESTS_QA_TOPIC,'biology','Food tests','secure','mastered'),null);
 assert.equal(f[2](FOOD_TESTS_QA_TOPIC,'biology','Food tests'),null);
 assert.equal(f[0]('mastery',other),123);assert.equal(f[1](other,'biology','Other','secure','mastered'),123);assert.equal(f[2](other,'biology','Other'),123);
});
