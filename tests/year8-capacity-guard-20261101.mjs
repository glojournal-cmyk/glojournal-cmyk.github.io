import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fillDailyLockedQuestions,enforceDistinctYear8MasteryAfterRetry} from '../assets/daily-locked-question-fallback-20261021.js';
const rank=(rows,subject,limit)=>rows.slice(0,limit);
const progression=(rows,mode,limit)=>rows.slice(0,limit);
const q=(n,conceptId,format='typed_exact')=>({id:'q'+n,conceptId,format,topicId:'la-y8-case-role-introduction',
   subject:'latin',year:8,status:'enabled',formal:true,prompt:'Prompt '+n,answer:{mode:'exact_or_equivalent',accepted:['answer']}});

test('30 question IDs for 15 concepts cannot falsely fill 20 Mastery opportunities',()=>{
 const items=Array.from({length:30},(_,i)=>q(i+1,'concept-'+Math.floor(i/2),i%2?'typed_exact':'mc_single'));
 const result=fillDailyLockedQuestions(items.slice(0,20),items,
     {locked:true,mode:'mastery',size:20,topicId:'la-y8-case-role-introduction',subject:'latin',requireDistinctConcepts:true},rank,progression);
 assert.equal(result.length,15);
 assert.equal(new Set(result.map(x=>x.conceptId)).size,result.length);
});

test('wide search backfills twenty distinct concepts beyond the initial ranked selection',()=>{
 const items=Array.from({length:48},(_,i)=>q(i+1,'concept-'+Math.floor(i/2)));
 const result=fillDailyLockedQuestions(items.slice(0,20),items,
     {locked:true,mode:'mastery',size:20,topicId:'la-y8-case-role-introduction',subject:'latin',requireDistinctConcepts:true},rank,progression);
 assert.equal(result.length,20);
 assert.equal(new Set(result.map(x=>x.conceptId)).size,20);
 assert.ok(result.some(x=>Number(x.id.slice(1))>20));
});

test('credited question excludes same concept variants and reserved IDs stay excluded',()=>{
 const items=Array.from({length:48},(_,i)=>q(i+1,'concept-'+Math.floor(i/2)));
 const result=fillDailyLockedQuestions(items.slice(1,21),items,
     {locked:true,mode:'mastery',size:20,topicId:'la-y8-case-role-introduction',subject:'latin',
      correctIds:['q1'],reservedIds:['q10'],requireDistinctConcepts:true},rank,progression);
 assert.equal(result.length,20);
 assert.ok(!result.some(x=>x.id==='q1'||x.id==='q2'||x.id==='q10'));
 assert.equal(new Set(result.map(x=>x.conceptId)).size,20);
});

test('legacy Standard and unlocked practice unchanged',()=>{
 const items=[q(1,'same'),q(2,'same'),q(3,'other')];
 const result=fillDailyLockedQuestions(items,items,
     {locked:true,mode:'standard',size:3,subject:'latin',topicId:'la-y8-case-role-introduction'},rank,progression);
 assert.deepEqual(result.map(x=>x.id),['q1','q2','q3']);
 assert.deepEqual(fillDailyLockedQuestions(items,items,
     {locked:false,mode:'mastery',size:3,subject:'latin',requireDistinctConcepts:true},rank,progression),items);
});

test('fully used bank remains empty rather than marked complete',()=>{
 const items=Array.from({length:24},(_,i)=>q(i+1,'concept-'+i));
 const result=fillDailyLockedQuestions(items,items,
   {locked:true,mode:'mastery',size:20,topicId:'la-y8-case-role-introduction',subject:'latin',
    requireDistinctConcepts:true,correctIds:items.map(q=>q.id)},rank,progression);
 assert.equal(result.length,0);
});

test('real Year 8 topic JSON cannot yield repeated concepts in strict preview',()=>{
 for(const id of ['bio-y8-ber','bio-y8-continuous-variation','bio-y8-correlation','bio-y8-mixed-exam',
    'la-y8-stage-1-vocabulary','la-y8-case-role-introduction']){
   const d=JSON.parse(fs.readFileSync('content/topics/'+id+'.json','utf8'));
   const questions=d.questions.filter(x=>x.status==='enabled'&&x.preview!==true&&x.formal!==false&&!x._repair);
   const picked=fillDailyLockedQuestions(questions.slice(0,20),questions,
     {locked:true,mode:'mastery',size:20,topicId:id,subject:d.subject,requireDistinctConcepts:true},rank,progression);
   assert.ok(picked.length<=20,id);
   assert.equal(new Set(picked.map(q=>q.conceptId||q.id)).size,picked.length,id);
   assert.equal(new Set(picked.map(q=>q.id)).size,picked.length,id);
   assert.ok(picked.every(q=>q.topicId===id),id);
 }
});

test('practice runtime never shrinks target or auto-completes an exhausted Daily task',()=>{
 const code=fs.readFileSync('assets/study._subject.practise-y8fix-20260920.js','utf8');
 assert.ok(code.includes('Not enough fresh Year 8 questions'));
 assert.ok(code.includes('requireDistinctConcepts:dailyLocked&&N===8&&E===\x60mastery\x60'));
 assert.ok(code.includes('Your correct answers, assignment, original target, XP/MP and Recovery record are unchanged.'));
 assert.ok(!code.includes('target:progress,progress,done:true,cappedBecauseQuestionBankExhausted:true'));
 assert.ok(!code.includes('s.setState({daily,dailyLog});'));
 assert.ok(code.includes('sessionSnapshot.current'));
 assert.ok(code.includes('selectUnfinishedDailyQuestions'));
});

test('post-retry guard removes previously credited concept variants and duplicates',()=>{
 const loaded=[q(1,'concept-A'),q(2,'concept-A'),q(3,'concept-B'),q(4,'concept-B'),q(5,'concept-C')];
 const result=enforceDistinctYear8MasteryAfterRetry(
   [loaded[1],loaded[2],loaded[3],loaded[4]],loaded,
   {locked:true,year:8,mode:'mastery',creditedIds:['q1']});
 assert.deepEqual(result.map(x=>x.id),['q3','q5']);
 const year9=enforceDistinctYear8MasteryAfterRetry([loaded[1],loaded[2],loaded[3]],loaded,
   {locked:true,year:9,mode:'mastery',creditedIds:['q1']});
 assert.deepEqual(year9.map(x=>x.id),['q2','q3','q4']);
});
