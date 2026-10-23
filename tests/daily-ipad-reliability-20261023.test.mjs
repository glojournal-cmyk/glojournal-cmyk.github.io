import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectDailyVocabulary} from '../assets/daily-vocab-20261003.js';
import {dailyVocabTotal} from '../assets/daily-vocab-total-20261020.js';
import {mergeDailyRecordRow} from '../assets/daily-record-integrity-20261018.js';
import {rebuildDatedDailyRecords} from '../assets/daily-dated-answer-reconcile-20261023.js';
import '../assets/home-journey-v2-logic-20261010.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const day='2026-10-23';
const q=(i,yr=8)=>({id:'fr-word-'+i,conceptId:'fr-y'+yr+'-concept-vocab-'+i,
  topicId:'fr-y'+yr+'-topic',year:yr,status:'enabled',formal:true,format:'typed_exact',
  prompt:'VOCAB — Give the English meaning of this French word.',
  stimulus:{text:'mot'+i,direction:'French → English'},answer:{accepted:['word'+i]}});
const y8=Array.from({length:42},(_,i)=>q(i+1));
const y9=Array.from({length:9},(_,i)=>q(i+51,9));
const oldCorrect=Object.fromEntries([...y8.slice(0,27),...y9.slice(0,2)].map(x=>[x.id,true]));
const rowFor=(date,done)=>({date,tasks:Array.from({length:10},(_,i)=>({
  id:'task-'+i,title:'Task '+i,target:10,progress:i<done?10:0,
  done:i<done,planDate:date})),done,total:10,complete:done===10});
test('Initial French set has 27 Year 7-8 plus 3 Year 9 distinct words',()=>{
 const questions=selectDailyVocabulary({subject:'french',items:y8,year9Items:y9,day,size:30,seed:'s',ledger:{}});
 assert.equal(questions.length,30);
 assert.equal(new Set(questions.map(x=>x.id)).size,30);
 assert.equal(questions.filter(x=>x._dailyYear9).length,3);
});
test('29/30 French Vocab unlocks one UNcredited final question, not 30 repeat questions',()=>{
 const last=selectDailyVocabulary({subject:'french',items:y8,year9Items:y9,day,
   size:1,seed:'s',ledger:{[day]:{french:{items:oldCorrect}}}});
 assert.equal(last.length,1);
 assert.ok(!Object.hasOwn(oldCorrect,last[0].id));
 const before=dailyVocabTotal({today:day,dailyVocabByDay:{[day]:{french:{items:oldCorrect}}}},'french',day);
 const after=dailyVocabTotal({today:day,dailyVocabByDay:{[day]:{french:{items:{...oldCorrect,[last[0].id]:true}}}}},'french',day);
 assert.equal(before.progress,29);
 assert.equal(after.progress,30);
 assert.equal(after.passed,true);
});
test('Wrong or repeated already-credited Vocab question does not falsely complete 30/30',()=>{
 const repeated=Object.keys(oldCorrect)[0];
 const state={today:day,dailyVocabByDay:{[day]:{french:{items:{...oldCorrect,[repeated]:true}}}}};
 assert.equal(dailyVocabTotal(state,'french',day).progress,29);
});
test('Saved complete 10/10 day is not expanded into 10/11 by new assigned planner',()=>{
 const before=rowFor('2026-10-21',10);
 const after={...rowFor('2026-10-21',0),tasks:[...rowFor('2026-10-21',0).tasks,
   {id:'new-mastered-check',target:20,progress:0,done:false}]};
 const merged=mergeDailyRecordRow(before,after,'2026-10-21');
 assert.equal(merged.done,10);
 assert.equal(merged.total,10);
 assert.equal(merged.complete,true);
 assert.equal(merged.tasks.length,10);
});
test('Proven full-day awarded 10/10 repairs day summary but does not invent individual question credits',()=>{
 const date='2026-10-20',row=rowFor(date,3);
 const state={today:day,formalAttemptLog:[],dailyCompleteAwarded:{[date]:true},
   dailyLog:{[date]:row}};
 const patch=rebuildDatedDailyRecords(state);
 assert.equal(patch.dailyLog[date].done,10);
 assert.equal(patch.dailyLog[date].total,10);
 assert.equal(patch.dailyLog[date].complete,true);
 assert.equal(patch.dailyLog[date].verifiedOriginalCompletionReceipt,true);
 assert.equal(patch.dailyLog[date].tasks[9].progress,0);
 assert.equal(row.done,3);
 const later=mergeDailyRecordRow(patch.dailyLog[date],row,date);
 assert.equal(later.done,10);
 assert.equal(later.tasks[9].progress,0);
});
test('No independent completion receipt: preserve 20-22 partial record until marked evidence exists',()=>{
 const date='2026-10-22';
 const state={today:day,formalAttemptLog:[],dailyCompleteAwarded:{},
   dailyLog:{[date]:rowFor(date,3)}};
 assert.equal(rebuildDatedDailyRecords(state),null);
});
test('Home display recovers same-day saved task progress without touching stored answer data',()=>{
 const state={today:day,daily:Array.from({length:10},(_,i)=>({
   id:'task-'+i,target:10,progress:0,assignedTopic:'topic-'+i,
   assignedSubject:'french',href:'/study/french/practise'})),
 dailyLog:{[day]:{date:day,tasks:Array.from({length:10},(_,i)=>({
   id:'task-'+i,target:10,progress:10,done:true,assignedTopic:'topic-'+i,
   assignedSubject:'french'}))}}};
 const journey={day:()=>day,navigationHref:x=>x,resumeCandidates:()=>[]};
 const view=globalThis.LuxHomeJourneyV2Logic.homeJourney(state,journey,{getItem:()=>null});
 assert.equal(view.count,10);
 assert.equal(view.ready,true);
 assert.equal(state.daily[9].progress,0);
});
test('History startup checks run once, not an expensive full-history scan after every answer',()=>{
 const boot=read('assets/daily-dated-answer-reconcile-boot-20261023.js');
 assert.doesNotMatch(boot,/store\.subscribe\(/);
 assert.match(boot,/checked=true/);
 assert.match(boot,/hasHydrated/);
 assert.match(boot,/2500/);
});
test('Daily Vocab route actually asks only outstanding words',()=>{
 const route=read('assets/study._subject.practise-D_PWgUd7.js');
 assert.match(route,/30-dailyVocabTotal\(s\.getState\(\),e,R\)\.progress/);
 assert.match(route,/dailyVocabTotal\(s\.getState\(\),e,l\(\)\)\.progress/);
});
