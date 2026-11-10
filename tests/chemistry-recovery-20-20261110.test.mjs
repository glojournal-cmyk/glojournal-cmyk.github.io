import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {year8ScienceRecoveryTopics} from '../assets/year8-science-recovery-sources-20261110.js';
import {selectDiverseRecoveryQuestions} from '../assets/recovery-question-diversity-20261025.js';
import {canRecover,recordRecoveryAnswer,matchesAssignedPracticeEvidence} from '../assets/recovery-task-ledger-20261017.js';

const topic='chem-y8-acids-indicators-ph',date='2026-11-09',today='2026-11-10';
const catalog=JSON.parse(readFileSync('content/catalog.json','utf8')).topics;
const load=id=>JSON.parse(readFileSync('content/topics/'+id+'.json','utf8')).questions.filter(q=>
 q?.id&&q.status!=='preview'&&q.status!=='disabled'&&q.formal!==false&&!q._repair);
const pinned=load(topic);
const altTopics=year8ScienceRecoveryTopics(catalog,'chemistry',topic,[{topicId:topic}]);
const fromOther=altTopics.flatMap(t=>load(t.topicId));
const task={id:'y8-mastery-a',title:'Chemistry Mastery',target:20,progress:0,
 assignedYear:8,assignedSubject:'chemistry',assignedTopic:topic,
 href:'/study/chemistry/practise?daily=1&locked=1&year=8&mode=mastery&task=y8-mastery-a&topic='+topic};
const rank=(qs,_,n)=>qs.slice(0,n),progress=(qs,_,n)=>qs.slice(0,n);
const state=()=>({today,seenCorrect:Object.fromEntries(pinned.slice(14).map(q=>[q.id,1])),
 formalAttemptLog:[],dailyLog:{[date]:{date,tasks:[task]}},recoveryTaskByDay:{},recoveryReceipts:[]});
const choose=(s,bank)=>selectDiverseRecoveryQuestions(pinned.slice(0,14),bank,
 {state:s,date,taskId:task.id,subject:'chemistry',year:8,topicId:topic,
  size:20,mode:'mastery',day:today},rank,progress);

test('Nov 9 Year 8 Chemistry Mastery 0/20 has real source-backed fallback from 14',()=>{
 assert.equal(canRecover(today,date),true);
 assert.ok(altTopics.length>=3);
 assert.ok(pinned.length>=20);
 const s=state(),before=JSON.stringify(s);
 const original=choose(s,pinned);
 assert.ok(original.length<20,'assigned-bank-only cannot produce 20 independent concepts');
 const full=choose(s,[...pinned,...fromOther]);
 assert.equal(full.length,20,'retain 20/20 original target');
 assert.ok(full.filter(q=>q.topicId===topic).length<=14);
 assert.ok(full.some(q=>q.topicId!==topic));
 assert.equal(new Set(full.map(q=>q.id)).size,20);
 assert.equal(new Set(full.map(q=>q.conceptId||q.id)).size,20,'all 20 Mastery questions must test different concepts');
 assert.ok(full.every(q=>!s.seenCorrect[q.id]&&q.formal!==false&&q.status!=='preview'&&!q._repair));
 assert.ok(full.every(q=>q.topicId===topic||altTopics.some(t=>t.topicId===q.topicId)));
 assert.equal(JSON.stringify(s),before,'selection never rewrites progress');
});

test('20 actually correct Year 8 answers credit Nov 9 only, no fabricated completion',()=>{
 let s=state();
 const full=choose(s,[...pinned,...fromOther]);
 assert.equal(full.length,20);
 for(let i=0;i<full.length;i++){
  const q=full[i];
  assert.equal(matchesAssignedPracticeEvidence({dailyTaskId:task.id,
   questionId:q.id,topicId:q.topicId,subject:'chemistry',year:8,correct:true,formal:true},
   task,task.id),true);
  const res=recordRecoveryAnswer(s,{today,date,taskId:task.id,questionId:q.id,
   correct:true,minimumCorrect:20});
  assert.equal(res.accepted,true);
  assert.equal(res.completed,i===19);
  s=res.state;
 }
 assert.equal(s.dailyLog[date].tasks[0].progress,20);
 assert.equal(s.dailyLog[date].tasks[0].done,true);
 assert.equal(s.dailyLog[date].tasks[0].recovered,true);
 assert.equal(s.dailyLog[today],undefined);
 assert.equal(s.recoveryTaskByDay[date][task.id].completed,true);
});


test('post-selector Year 8 Mastery concept guard still receives all 20 questions',async()=>{
 const {enforceDistinctYear8MasteryAfterRetry}=await import('../assets/daily-locked-question-fallback-20261021.js');
 const state0=state();
 const source=[...pinned,...fromOther];
 const selected=choose(state0,source);
 const guarded=enforceDistinctYear8MasteryAfterRetry(selected,source,{
   locked:true,year:8,mode:'mastery',seenCorrect:state0.seenCorrect,creditedIds:[]
 });
 assert.equal(guarded.length,20,'nothing lost at final 20/14 iPad guard');
 assert.equal(new Set(guarded.map(q=>q.conceptId||q.id)).size,20);
});
