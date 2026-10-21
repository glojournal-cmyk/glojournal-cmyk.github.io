import test from 'node:test';
import assert from 'node:assert/strict';
import {replayDailyAnswerCredit} from '../assets/daily-answer-replay-20261021.js';
const day='2026-10-21',topic='la-y8-prepositions',id='latin-standard';
const task=(extra={})=>({id,planDate:day,title:'Latin · Preposition dictionary entries',
  target:10,progress:0,assignedSubject:'latin',assignedTopic:topic,assignedYear:8,
  href:`/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task=${id}&topic=${topic}`,
  ...extra});
const attempt=(i,extra={})=>({day,at:`2026-10-21T18:00:${String(i).padStart(2,'0')}Z`,
  attemptId:'marked-'+i,questionId:topic+'-'+i,correct:i%2===0,
  subject:'latin',topicId:topic,formal:true,repair:false,dailyTaskId:id,...extra});
const state=(records,t=task())=>({today:day,daily:[t],
  dailyLog:{[day]:{date:day,tasks:[{id,target:10,progress:0}],done:0,total:1,complete:false}},
  formalAttemptLog:records,xp:777,topicStats:{[topic]:{attempted:10}},masteryPoints:35});
test('Real stored Latin Prepositions 10 marked answers restore Home 10/10 without new XP',()=>{
 const original=state(Array.from({length:10},(_,i)=>attempt(i,{topicId:'la-y8-old-preposition-alias'})));
 const patch=replayDailyAnswerCredit(original);
 assert.equal(patch.daily[0].progress,10);
 assert.equal(patch.dailyLog[day].tasks[0].progress,10);
 assert.equal(patch.dailyLog[day].complete,true);
 assert.equal(original.daily[0].progress,0);
 assert.equal(original.xp,777);
 assert.equal(replayDailyAnswerCredit({...original,...patch}),null);
});
test('Historical Latin quiz with missing daily task tag can restore only exact assigned topic',()=>{
 const old=Array.from({length:10},(_,i)=>attempt(i,{dailyTaskId:null}));
 assert.equal(replayDailyAnswerCredit(state(old)).daily[0].progress,10);
 assert.equal(replayDailyAnswerCredit(state(old.map(e=>({...e,topicId:'la-y8-other',questionId:'la-y8-other-'+e.attemptId})))),null);
});
test('Never borrow other tasks, dates, subjects, recovery, informal, repairs, or vocab',()=>{
 for(const override of [{dailyTaskId:'y8-standard-a',topicId:'la-y8-other',questionId:'other-1'},
   {day:'2026-10-20'},{subject:'french'},{recoveryFor:'2026-10-20'},
   {formal:false},{repair:true},{dailyVocab:'latin'}]){
   assert.equal(replayDailyAnswerCredit(state([attempt(1,override)])),null,JSON.stringify(override));
 }
});
test('Do not count unverified page visits or XP: only marked answer journal is evidence',()=>{
 assert.equal(replayDailyAnswerCredit(state([])),null);
 assert.equal(replayDailyAnswerCredit(state([{day,questionId:'x',correct:null,dailyTaskId:id,subject:'latin'}])),null);
});
test('Need exact locked assigned link and plan date; do not duplicate real attempts',()=>{
 const events=[attempt(1),attempt(1),attempt(2),attempt(3)];
 assert.equal(replayDailyAnswerCredit(state(events)).daily[0].progress,3);
 for(const t of [task({href:'/study/latin/practise?mode=standard'}),
   task({planDate:'2026-10-20'}),task({assignedSubject:'french'})]){
   assert.equal(replayDailyAnswerCredit(state(events,t)),null);
 }
});
test('Do not overwrite stronger existing credit and other dated tasks',()=>{
 const before=state(Array.from({length:2},(_,i)=>attempt(i)),task({progress:9}));
 before.dailyLog['2026-10-20']={date:'2026-10-20',tasks:[{id,target:10,progress:7}]};
 assert.equal(replayDailyAnswerCredit(before),null);
 const later=state(Array.from({length:10},(_,i)=>attempt(i)),task({progress:9}));
 later.dailyLog=before.dailyLog;
 const patch=replayDailyAnswerCredit(later);
 assert.equal(patch.daily[0].progress,10);
 assert.equal(patch.dailyLog['2026-10-20'],before.dailyLog['2026-10-20']);
});
