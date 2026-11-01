import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {otherYear8DailyReservations,excludeOtherYear8Reservations}
 from '../assets/daily-question-reservations-20261101.js';
import {fillDailyLockedQuestions} from '../assets/daily-locked-question-fallback-20261021.js';

const DAY='2026-11-01';
const q=(i,concept='concept-'+i)=>({
 id:'q'+i,conceptId:concept,topicId:'bio-y8-test',subject:'biology',year:8,
 prompt:'Question '+i,format:i%2?'typed_exact':'mc_single',formal:true,status:'enabled',
 answer:{mode:'exact_or_equivalent',accepted:['example']}
});
const task=(id,target=10,overrides={})=>({
 id,planDate:DAY,assignedSubject:'biology',assignedYear:8,
 assignedTopic:'bio-y8-test',target,progress:0,
 href:'/study/biology/practise?daily=1&locked=1&year=8&mode='+
     (id.includes('mastery')?'mastery':'standard')+
     '&task='+id+'&topic=bio-y8-test',...overrides
});
const opts=(id,extra={})=>({
 day:DAY,taskId:id,subject:'biology',year:8,topicId:'bio-y8-test',...extra
});
const state=(tasks,more={})=>({today:DAY,daily:tasks,
 formalAttemptLog:[],dailyLog:{[DAY]:{tasks}},...more});
const bank=Array.from({length:40},(_,i)=>q(i+1));
const pick=ids=>bank.filter(q=>ids.has(q.id)).map(q=>q.id);
test('two same-topic Daily tasks reserve separate sets BEFORE any answers',()=>{
 const s=state([task('y8-standard-a'),task('y8-standard-b')]);
 const a=otherYear8DailyReservations(s,bank,opts('y8-standard-a'));
 const b=otherYear8DailyReservations(s,bank,opts('y8-standard-b'));
 assert.deepEqual(pick(a),bank.slice(10,20).map(q=>q.id));
 assert.deepEqual(pick(b),bank.slice(0,10).map(q=>q.id));
 const aAllowed=excludeOtherYear8Reservations(bank.slice(0,20),a);
 const bAllowed=excludeOtherYear8Reservations(bank.slice(0,20),b);
 assert.equal(aAllowed.length,10);
 assert.equal(bAllowed.length,10);
 assert.equal(aAllowed.some(x=>bAllowed.includes(x)),false);
 assert.deepEqual(otherYear8DailyReservations(s,bank,opts('y8-standard-b')),b);
 assert.deepEqual(s.daily[0].progress,0,'read-only; cannot mutate saved progress');
});
test('a 30-question bank with only 15 concepts cannot feed two disjoint 10-slot sets',()=>{
 const variants=Array.from({length:30},(_,i)=>q(i+1,'concept-'+Math.floor(i/2)));
 const s=state([task('y8-standard-a'),task('y8-standard-b')]);
 const a=otherYear8DailyReservations(s,variants,opts('y8-standard-a'));
 const b=otherYear8DailyReservations(s,variants,opts('y8-standard-b'));
 const aFamily=new Set(excludeOtherYear8Reservations(variants,a).map(q=>q.conceptId));
 const bFamily=new Set(excludeOtherYear8Reservations(variants,b).map(q=>q.conceptId));
 assert.equal(aFamily.size,10);assert.equal(bFamily.size,5);
 assert.ok([...aFamily].every(f=>!bFamily.has(f)));
});
test('a marked wrong answer belongs to its original task even if it is outside the usual partition',()=>{
 const tasks=[task('y8-standard-a'),task('y8-standard-b',10)];
 const s=state(tasks,{formalAttemptLog:[{
  day:DAY,dailyTaskId:'y8-standard-b',questionId:'q2',
  subject:'biology',year:8,topicId:'bio-y8-test',formal:true,correct:false
 }]});
 const a=otherYear8DailyReservations(s,bank,opts('y8-standard-a'));
 const b=otherYear8DailyReservations(s,bank,opts('y8-standard-b'));
 assert.ok(a.has('q2'),'never steal from marked wrong retry task B');
 assert.ok(!b.has('q2'),'B retains original wrong question for retry');
 const aResult=excludeOtherYear8Reservations(bank,a);
 assert.ok(!aResult.some(q=>q.id==='q2'));
 assert.deepEqual(s.formalAttemptLog[0].questionId,'q2');
});
test('only strictly assignment-verified correct IDs reserve other task questions',()=>{
 const tasks=[task('y8-standard-a'),task('y8-standard-b')];
 const b=tasks[1],mode='standard';
 const verifiedKey=[DAY,b.id,'biology','bio-y8-test',8,mode,b.target].join('|');
 b.verifiedCorrectAssignment=verifiedKey;b.verifiedCorrectIds=['q5'];
 const s=state(tasks);
 assert.equal(otherYear8DailyReservations(s,bank,opts('y8-standard-a')).has('q5'),true);
 const forged=state(tasks.map(t=>({...t,verifiedCorrectAssignment:'wrong-scope'})));
 const baseline=otherYear8DailyReservations(forged,bank,opts('y8-standard-a'));
 assert.equal(baseline.has('q5'),false,'a forged receipt is not proof to reserve q5 for task B; original deterministic slot belongs to A');
});
test('read-only two-day Recovery proof protects its still-unfinished source question',()=>{
 const oldDay='2026-10-31';
 const s=state([task('y8-standard-a')],{
  recoveryTaskByDay:{[oldDay]:{'y8-standard-a':{items:{q17:false},completed:false}}},
  dailyLog:{[DAY]:{tasks:[task('y8-standard-a')]},
   [oldDay]:{tasks:[task('y8-standard-a',10,{planDate:oldDay})]}}
 });
 const reserved=otherYear8DailyReservations(s,bank,opts('y8-standard-a'));
 assert.ok(reserved.has('q17'));
 const byRecovery=otherYear8DailyReservations(s,bank,opts('y8-standard-a',{recoveryDate:oldDay}));
 assert.equal(byRecovery.size,0,'Recovery loads own dated question pool, not today partition');
 const tooOld=state(s.daily,{
  recoveryTaskByDay:{'2026-10-29':{'y8-standard-a':{items:{q17:false},completed:false}}},
  dailyLog:{[DAY]:{tasks:s.daily},'2026-10-29':{tasks:[task('y8-standard-a',10,{planDate:'2026-10-29'})]}}
 });
 assert.equal(otherYear8DailyReservations(tooOld,bank,opts('y8-standard-a')).has('q17'),false);
});
test('different topics, different subjects, Year 9, and foreign dates cannot reserve current Year 8 bank',()=>{
 const t=task('y8-standard-a');
 const s=state([t,task('y8-standard-b',10,{assignedTopic:'bio-y8-other'})]);
 assert.equal(otherYear8DailyReservations(s,bank,opts(t.id)).size,0);
 assert.equal(otherYear8DailyReservations(s,bank,opts(t.id,{year:9})).size,0);
 assert.equal(otherYear8DailyReservations(s,bank,opts(t.id,{day:'2026-10-31'})).size,0);
 assert.equal(otherYear8DailyReservations(s,bank,opts(t.id,{taskId:'not-pinned'})).size,0);
});
test('planner reservations also constrain ranked fallback plus post-retry selector',()=>{
 const tasks=[task('y8-mastery-a',20),task('y8-mastery-b',20)];
 const s=state(tasks);
 const reserve=otherYear8DailyReservations(s,bank,opts('y8-mastery-a'));
 const rank=(items,subject,n)=>items.slice(0,n);
 const progression=(items,mode,n)=>items.slice(0,n);
 const rows=fillDailyLockedQuestions(bank.slice(0,24),bank,{
   locked:true,mode:'mastery',size:20,topicId:'bio-y8-test',subject:'biology',
   requireDistinctConcepts:true,reservedIds:reserve
 },rank,progression);
 assert.equal(rows.length,20);
 assert.ok(rows.every(q=>!reserve.has(q.id)));
 assert.equal(new Set(rows.map(q=>q.conceptId)).size,20);
 assert.deepEqual(excludeOtherYear8Reservations([...rows,bank[20]],reserve),rows);
});
test('production Practice route applies guard before and after unfinished retry, without rewriting Daily',()=>{
 const c=fs.readFileSync('assets/study._subject.practise-y8fix-20260920.js','utf8');
 assert.ok(c.includes('dailyReservations=otherYear8DailyReservations('));
 assert.ok(c.includes('reservedIds:dailyReservations'));
 assert.ok(c.includes('safeU=excludeOtherYear8Reservations(enforceDistinctYear8MasteryAfterRetry('));
 assert.ok(c.includes('creditedIds:dailyCorrectQuestionIds'));
 assert.ok(!c.includes('target:progress,progress,done:true,cappedBecauseQuestionBankExhausted:true'));
});
