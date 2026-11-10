import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {latinRecoveryYear8Sources} from '../assets/latin-recovery-topic-pool-20261107.js';
import {selectDiverseRecoveryQuestions} from '../assets/recovery-question-diversity-20261025.js';
import {fillDailyLockedQuestions} from '../assets/daily-locked-question-fallback-20261021.js';
import {matchesAssignedPracticeEvidence,recordRecoveryAnswer} from '../assets/recovery-task-ledger-20261017.js';

const date='2026-11-06',today='2026-11-07',s1='la-y8-stage-1-vocabulary',
      s2='la-y8-stage-2-vocabulary',s3='la-y8-stage-3-vocabulary';
const all=JSON.parse(readFileSync('content/catalog.json','utf8')).topics;
const y8=all.filter(t=>t.subject==='latin'&&Number(t.year)===8);
const q=id=>JSON.parse(readFileSync('content/topics/'+id+'.json','utf8')).questions.filter(q=>
  !!q.id&&q.status==='enabled'&&q.preview!==true&&q.formal!==false&&!q._repair);
const scored=ids=>Object.fromEntries(ids.flatMap(id=>q(id).map(row=>[row.id,1])));
const task={id:'latin-standard',target:5,progress:0,assignedTopic:s1,
  assignedYear:8,assignedSubject:'latin',href:'/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task=latin-standard&topic='+s1};
const state=patch=>({today,seenCorrect:{},formalAttemptLog:[],
  recoveryTaskByDay:{},recoveryReceipts:[],
  dailyLog:{[date]:{date,tasks:[task]}},...patch});
const rank=(rows,subject,n)=>rows.slice(0,n),progression=(rows,mode,n)=>rows.slice(0,n);
const select=(st,loaded,size=5)=>selectDiverseRecoveryQuestions(
  fillDailyLockedQuestions(loaded.filter(x=>x.topicId===s1),loaded,{
    locked:true,mode:'standard',size,subject:'latin',topicId:s1,correctIds:[]},rank,progression),
  loaded,{state:st,date,taskId:'latin-standard',subject:'latin',year:8,
    topicId:s1,size,mode:'standard',day:today},rank,progression);

test('all 12 enabled Year 8 stages can supply alternate words; skip scored-out banks',()=>{
 const sources=latinRecoveryYear8Sources(y8,s1,scored([s1,s2]),12);
 assert.equal(sources[0].topicId,s3);
 assert.equal(sources.length,10);
 assert.ok(sources.every(t=>Number(t.year)===8&&t.status==='enabled'&&
   /^la-y8-stage-(?:[1-9]|1[0-2])-vocabulary$/.test(t.topicId)));
 assert.equal(latinRecoveryYear8Sources(y8,s1,scored([s1,s2]),2).length,2);
 assert.equal(latinRecoveryYear8Sources(y8,s1,scored([s1,s2]),0).length,0);
});

test('Nov 6 Latin 0/5 Recovery uses five fresh Stage 3 words when Stage 1/2 were all correct',()=>{
 const st=state({seenCorrect:scored([s1,s2])}),before=JSON.stringify(st);
 const original=q(s1);
 assert.equal(select(st,original).length,0,'reproduces the originally empty single-bank Recovery');
 const expanded=[...q(s1),...q(s2),...q(s3)];
 const offered=select(st,expanded,5);
 assert.equal(offered.length,5);
 assert.equal(new Set(offered.map(x=>x.conceptId)).size,5,'five independent words');
 assert.ok(offered.every(x=>x.topicId===s3),'only actual Stage 3 Year 8 source questions');
 assert.ok(offered.every(x=>!st.seenCorrect[x.id]));
 assert.equal(JSON.stringify(st),before,'never rewrite historical dated task, progress or ledger');
});

test('a mastered Latin word cannot return under a different direction or format',()=>{
 const bank=[...q(s1),...q(s3)];
 const correct={...scored([s1]),[q(s3)[0].id]:1};
 const st=state({seenCorrect:correct});
 const out=select(st,bank,5);
 assert.equal(out.length,5);
 assert.ok(out.every(x=>x.conceptId!==q(s3)[0].conceptId));
 assert.equal(new Set(out.map(x=>x.conceptId)).size,5);
});

test('two dated Recovery cards never borrow each others marked questions',()=>{
 const loaded=[...q(s1),...q(s3)];
 const first=q(s3)[0];
 const st=state({seenCorrect:scored([s1]),formalAttemptLog:[
  {day:today,recoveryFor:date,dailyTaskId:'y8-standard-a',subject:'latin',
   year:8,topicId:s3,formal:true,correct:false,questionId:first.id}
 ]});
 const out=select(st,loaded,5);
 assert.equal(out.length,5);
 assert.ok(out.every(x=>x.conceptId!==first.conceptId));
});

test('review Recovery stays restricted to its original assigned review pool',()=>{
 const st=state({seenCorrect:scored([s1])}),bank=[...q(s1),...q(s3)];
 const allowed=q(s1)[0],out=selectDiverseRecoveryQuestions(
  [allowed],bank,{state:st,date,taskId:'latin-standard',subject:'latin',year:8,
   topicId:s1,size:5,mode:'mistakes',reviewQuestionIds:[allowed.id],day:today},rank,progression);
 assert.deepEqual(out,[],'do not silently turn a mistake review into Stage 3 revision');
});

test('live iPad Latin Practice loader brings additional Year 8 banks only to dated Recovery',()=>{
 const js=readFileSync('assets/study._subject.practise-y8fix-20260920.js','utf8');
 assert.ok(js.includes('dailyLocked&&dailyParams.has(\'recover\')&&assignment&&N===8&&e===\'latin\''));
 assert.ok(js.includes('latinRecoveryYear8Sources(I,pinnedTopic,s.getState()?.seenCorrect,8)'));
 assert.ok(js.includes('...fallbacks.filter(t=>!known.has(t.topicId))'));
 assert.ok(js.includes('recovery-question-diversity-20261025.js?v=20261110-science-recovery1'));
});

test('five correctly marked Stage 3 fallback words credit Nov 6 original Latin task, not Nov 7',()=>{
 const seenCorrect=scored([s1,s2]),st=state({seenCorrect}),before=JSON.stringify(st);
 const offered=select(st,[...q(s1),...q(s3)],5);
 assert.equal(offered.length,5);
 let next=st;
 for(let i=0;i<offered.length;i++){
  const question=offered[i];
  const event={dailyTaskId:'latin-standard',subject:'latin',year:8,
    topicId:question.topicId,questionId:question.id,correct:true,formal:true};
  assert.equal(matchesAssignedPracticeEvidence(event,task,'latin-standard'),true,
    'dated task ID and subject permit the genuine Year 8 fallback topic');
  const result=recordRecoveryAnswer(next,{today,date,taskId:'latin-standard',
    questionId:question.id,correct:true,minimumCorrect:5});
  assert.equal(result.accepted,true);
  assert.equal(result.completed,i===4);
  next=result.state;
 }
 assert.equal(next.dailyLog[date].tasks[0].progress,5);
 assert.equal(next.dailyLog[date].tasks[0].recovered,true);
 assert.equal(next.recoveryTaskByDay[date]['latin-standard'].completed,true);
 assert.equal(next.dailyLog[today],undefined,'missed day only: do not credit today');
 assert.equal(JSON.stringify(st),before,'read-only original state');
 assert.equal(next.recoveryAwarded,undefined,'selection never manufactures rewards');
});
