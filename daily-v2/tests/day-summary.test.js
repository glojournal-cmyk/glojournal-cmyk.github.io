import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DAILY_V2_TASKS} from '../src/planner.js';
import {makeDailyV2Ledger,projectSavedDailyV2Attempt} from '../src/ledger.js';
import {summarizeDailyV2Day} from '../src/day-summary.js';

const day='2026-10-26';
function full(){
 return {version:2,day,status:'ready',target:163,
  tasks:DAILY_V2_TASKS.map(t=>({...t,questions:Array.from({length:t.target},(_,i)=>({
   questionId:t.id+'-'+i,conceptId:t.kind==='vocab'?t.id+'-word-'+i:null,
   marks:t.kind==='exam'?i+1:null
  }))}))};
}
function partial(){
 const complete=full();
 const unavailable=complete.tasks.filter(t=>t.id==='french-vocab')
  .map(t=>({id:t.id,target:t.target,reasonCodes:['VOCAB_CONCEPT_SHORTAGE']}));
 const tasks=complete.tasks.filter(t=>t.id!=='french-vocab');
 return {...complete,status:'partial',stagingOnly:true,dailyComplete:false,
  tasks,unavailable,blockedTasksCount:1,availableTarget:133};
}
function answerAll(plan,{partialExam=false}={}){
 let ledger=makeDailyV2Ledger(day);let index=0;
 for(const t of plan.tasks)for(const q of t.questions){
  const awarded=t.kind==='exam'&&partialExam&&q.marks===3?2:(q.marks||null);
  ledger=projectSavedDailyV2Attempt(ledger,{
   eventId:'e-'+(index++),day,taskId:t.id,questionId:q.questionId,
   conceptId:q.conceptId,
   correct:t.kind==='exam'?awarded===q.marks:true,
   ...(t.kind==='exam'?{marksEarned:awarded,marksPossible:q.marks}:{})
  });
 }
 return ledger;
}
test('one missing French Vocab does not make nine other tasks disappear',()=>{
 const p=partial(),s=summarizeDailyV2Day(p,makeDailyV2Ledger(day));
 assert.equal(s.expectedTasks,10);assert.equal(s.unavailableTasks,1);
 assert.equal(s.fullDayTarget,163);assert.equal(s.availableTarget,133);
 assert.equal(s.tasks.find(t=>t.taskId==='french-vocab').state,'unavailable');
 assert.equal(s.fullDayComplete,false);assert.equal(s.fullDayRewardEligible,false);
});
test('nine tasks fully done are never misrepresented as ten completed',()=>{
 const p=partial(),s=summarizeDailyV2Day(p,answerAll(p));
 assert.equal(s.completedTasks,9);assert.equal(s.unavailableTasks,1);
 assert.equal(s.totalVerified,133);assert.equal(s.fullDayComplete,false);
 assert.equal(s.fullDayRewardEligible,false);
});
test('ten real fully credited tasks can complete 163/163',()=>{
 const p=full(),s=summarizeDailyV2Day(p,answerAll(p));
 assert.equal(s.completedTasks,10);assert.equal(s.totalVerified,163);
 assert.equal(s.unavailableTasks,0);assert.equal(s.fullDayComplete,true);
});
test('GCSE marking tracks 5/6 marks separately from three marked questions',()=>{
 const p=full(),s=summarizeDailyV2Day(p,answerAll(p,{partialExam:true}));
 const exam=s.tasks.find(t=>t.taskId==='gcse-exam-skills');
 assert.equal(exam.verifiedProgress,3);
 assert.deepEqual(exam.examMarks,{earned:5,possible:6});
 assert.equal(s.fullDayComplete,true);
});
test('wrong answer cannot increment Home daily count',()=>{
 const p=full();let l=makeDailyV2Ledger(day);
 l=projectSavedDailyV2Attempt(l,{eventId:'wrong',day,taskId:'latin-vocab',
  questionId:'latin-vocab-0',conceptId:'latin-vocab-word-0',correct:false});
 assert.equal(summarizeDailyV2Day(p,l).totalVerified,0);
});
test('repeated correct concept only contributes one verified Home credit',()=>{
 const p=full();let l=makeDailyV2Ledger(day);
 for(let i=0;i<3;i++)l=projectSavedDailyV2Attempt(l,{
  eventId:'e-'+i,day,taskId:'latin-vocab',questionId:'latin-vocab-0',
  conceptId:'latin-vocab-word-0',correct:true});
 assert.equal(summarizeDailyV2Day(p,l).totalVerified,1);
});
test('mismatched ledger date must not be used to render Home',()=>{
 assert.throws(()=>summarizeDailyV2Day(full(),makeDailyV2Ledger('2026-10-25')),/mismatched plan/);
});
test('partially blocked day requires explicit reason to display unavailable',()=>{
 const p=partial();p.unavailable=[];
 assert.throws(()=>summarizeDailyV2Day(p,makeDailyV2Ledger(day)),/missing unavailable/);
});
test('staging projection never mutates ledger or original task plan',()=>{
 const p=partial(),ledger=makeDailyV2Ledger(day);
 const prev=JSON.stringify([p,ledger]);summarizeDailyV2Day(p,ledger);
 assert.equal(JSON.stringify([p,ledger]),prev);
});
