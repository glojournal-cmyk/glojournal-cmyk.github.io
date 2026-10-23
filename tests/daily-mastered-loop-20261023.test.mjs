import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';
import {addMasteryEvidence,masteryStage} from '../assets/mastery-v2-20261018.js';
import {reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {replayDailyAnswerCredit} from '../assets/daily-answer-replay-20261021.js';

const day='2026-10-23';
const subjects=['latin','french','biology','chemistry','physics'];
const catalog=subjects.flatMap(s=>Array.from({length:5},(_,i)=>({
  subject:s,year:8,topicId:s+'-y8-t'+i,title:'Topic '+i,
  status:'enabled',enabled:45,formats:{typed_short:20}
}))).concat(subjects.map(s=>({
  subject:s,year:9,topicId:s+'-y9-new',title:'New topic',
  status:'enabled',enabled:40,formats:{typed_short:20}
})));
const get=(subject,year)=>catalog.filter(t=>t.subject===subject&&t.year===year);
function state(date=day){
  return {today:date,year:9,daily:[],dailyLog:{},topicStats:{},
    formalAttemptLog:[],dailyVocabByDay:{},reviews:{}};
}
const lookup=(rows,id)=>rows.find(t=>t.id===id);
const urlMode=t=>new URL(t.href,'https://scholar.invalid').searchParams.get('mode');
const allQ=(topic,n)=>Array.from({length:n},(_,i)=>({
  id:'q'+i,topicId:topic,formal:true,format:'typed_short'
}));

test('original ten assignments remain with 165 items when no delayed checks are due',()=>{
  const plan=buildYear8DailyV2(state(),get);
  assert.equal(plan.length,10);
  assert.equal(plan.reduce((n,t)=>n+t.target,0),165);
  for(const id of ['y8-mastery-a','y8-mastery-b']){
    assert.equal(lookup(plan,id).target,20);
    assert.equal(urlMode(lookup(plan,id)),'mastery');
  }
});

test('three overdue checks do not replace the two 20-question Daily Mastery slots',()=>{
  const input=state();
  for(const [topic,stage] of [['latin-y8-t0','check7'],['french-y8-t0','check2'],['biology-y8-t0','check2']])
    input.topicStats[topic]={masteryV2:{stage,due:day}};
  const plan=buildYear8DailyV2(input,get);
  const checks=plan.filter(t=>t.masteryCheck===true);
  assert.equal(checks.length,1,'Day 2/7 recall belongs to independent Due Review');
  assert.equal(checks[0].id,'due-review');
  assert.equal(checks[0].target,5);
  assert.equal(urlMode(checks[0]),'due');
  for(const id of ['y8-mastery-a','y8-mastery-b']){
    const mastery=lookup(plan,id);
    assert.equal(mastery.target,20, id+' remains a full 20-question daily set');
    assert.equal(urlMode(mastery),'mastery');
    assert.equal(mastery.masteryCheck,false);
    assert.ok(!['latin-y8-t0','french-y8-t0','biology-y8-t0'].includes(mastery.assignedTopic));
  }
  assert.equal(plan.reduce((n,t)=>n+t.target,0),160,
    'Only the separate Due Review shrinks from ten to five questions');
  for(const id of ['latin-standard','y8-standard-a','y8-standard-b'])
    assert.ok(!checks.some(c=>c.assignedTopic===lookup(plan,id).assignedTopic),
      'Do not consume a pending recall topic for Standard');
});

test('unopened legacy five-question Mastery check upgrades to the real 20-question Mastery',()=>{
  const input=state();
  input.topicStats['latin-y8-t0']={masteryV2:{stage:'check2',due:day}};
  input.daily=[{id:'y8-mastery-a',planDate:day,assignedSubject:'latin',
    assignedTopic:'latin-y8-t0',assignedLabel:'Topic 0',masteryCheck:true,
    href:'/study/latin/practise?daily=1&mode=due&task=y8-mastery-a',
    progress:0,target:5}];
  const updated=buildYear8DailyV2(input,get);
  const mastery=lookup(updated,'y8-mastery-a');
  assert.equal(mastery.target,20);
  assert.equal(urlMode(mastery),'mastery');
  assert.equal(mastery.masteryCheck,false);
  assert.notEqual(mastery.assignedTopic,'latin-y8-t0');
});

test('started legacy five-question check keeps its credited work without affecting the other Mastery',()=>{
  const input=state();
  input.topicStats['latin-y8-t0']={masteryV2:{stage:'check2',due:day}};
  input.daily=[{id:'y8-mastery-a',planDate:day,assignedSubject:'latin',
    assignedTopic:'latin-y8-t0',assignedLabel:'Topic 0',masteryCheck:true,
    href:'/study/latin/practise?daily=1&mode=due&task=y8-mastery-a',
    progress:2,target:5}];
  const updated=buildYear8DailyV2(input,get);
  assert.equal(lookup(updated,'y8-mastery-a').target,5);
  assert.equal(lookup(updated,'y8-mastery-a').progress,2);
  assert.equal(urlMode(lookup(updated,'y8-mastery-a')),'due');
  assert.equal(lookup(updated,'y8-mastery-b').target,20);
  assert.equal(urlMode(lookup(updated,'y8-mastery-b')),'mastery');
  assert.ok(updated.every(t=>t.progress<=t.target));
});

test('a pending check does not appear early or get mistaken for a new Mastery',()=>{
  const input=state();
  input.topicStats['latin-y8-t0']={masteryV2:{stage:'check2',due:'2026-10-25'}};
  const plan=buildYear8DailyV2(input,get);
  assert.ok(!plan.some(t=>t.masteryCheck));
  assert.ok(!plan.filter(t=>t.id.startsWith('y8-mastery-'))
    .some(t=>t.assignedTopic==='latin-y8-t0'));
});

test('20 genuine marked answers count 20/20 even if the Mastery passing score is not met',()=>{
  const initial=state();
  const plan=buildYear8DailyV2(initial,get);
  const mastery=lookup(plan,'y8-mastery-a');
  const events=allQ(mastery.assignedTopic,20).map((q,i)=>({
    day,questionId:q.id,attemptId:'a'+i,topicId:mastery.assignedTopic,
    dailyTaskId:mastery.id,mode:'mastery',formal:true,correct:i<16,
    format:'typed_short',subject:mastery.assignedSubject
  }));
  const failed={...initial,daily:plan,formalAttemptLog:events};
  const replan=buildYear8DailyV2(failed,get);
  assert.equal(lookup(replan,mastery.id).progress,20);
  const replay=replayDailyAnswerCredit(failed);
  assert.equal(lookup(replay.daily,mastery.id).progress,20);
  const questions=allQ(mastery.assignedTopic,20);
  const receipt=reconcileDailySession(failed,{
    day,taskId:mastery.id,subject:mastery.assignedSubject,year:8,mode:'mastery',
    questions,answers:questions.map((q,i)=>({
      questionId:q.id,correct:i<16,formal:true,repair:false
    }))
  });
  assert.equal(lookup(receipt.daily,mastery.id).progress,20);
  assert.deepEqual(receipt.dailyLog,{});
});

test('17/20 including three independent answers completes daily gate',()=>{
  const initial=state(),plan=buildYear8DailyV2(initial,get);
  const task=lookup(plan,'y8-mastery-a'),topic=task.assignedTopic;
  let stat={};
  const events=[];
  for(let i=0;i<20;i++){
    const answer={day,year:8,mode:'mastery',questionId:'m'+i,
      correct:i<17,format:i<3?'typed_short':'mc_single',formal:true};
    stat={masteryV2:addMasteryEvidence(stat,answer)};
    events.push({...answer,topicId:topic,subject:task.assignedSubject,
      dailyTaskId:task.id,attemptId:'m-attempt'+i});
  }
  assert.equal(stat.masteryV2.stage,'check2');
  assert.equal(stat.masteryV2.passedMasteryAt,day);
  const now={...initial,daily:plan,topicStats:{[topic]:stat},formalAttemptLog:events};
  const replan=buildYear8DailyV2(now,get);
  assert.equal(lookup(replan,task.id).progress,20);
  assert.equal(lookup(replan,task.id).target,20);
  const replay=replayDailyAnswerCredit(now);
  assert.equal(lookup(replay.daily,task.id).progress,20);
});

test('real Day 2 and Day 7 results change the topic to Mastered',()=>{
  let stat={};
  for(let i=0;i<20;i++){
    stat={masteryV2:addMasteryEvidence(stat,{day:'2026-10-19',year:8,
      mode:'mastery',questionId:'q'+i,correct:i<17,
      format:i<3?'typed_short':'mc_single'})};
  }
  assert.equal(stat.masteryV2.stage,'check2');
  assert.equal(stat.masteryV2.due,'2026-10-21');
  for(let i=0;i<5;i++){
    stat={masteryV2:addMasteryEvidence(stat,{day:'2026-10-21',year:8,
      mode:'due',questionId:'check2-'+i,correct:i<4})};
  }
  assert.equal(stat.masteryV2.stage,'check7');
  assert.equal(stat.masteryV2.due,'2026-10-26');
  for(let i=0;i<5;i++){
    stat={masteryV2:addMasteryEvidence(stat,{day:'2026-10-26',year:8,
      mode:'due',questionId:'check7-'+i,correct:i<4})};
  }
  assert.equal(masteryStage(stat),'mastered');
  assert.equal(stat.masteryV2.masteredAt,'2026-10-26');
});

test('failed recall is returned to reinforcement, not falsely Mastered',()=>{
  let stat={masteryV2:{stage:'check7',due:day}};
  for(let i=0;i<5;i++)
    stat={masteryV2:addMasteryEvidence(stat,{day,year:8,mode:'due',
      questionId:'failed-'+i,correct:i<3})};
  assert.equal(masteryStage(stat),'needs-reinforcement');
  assert.notEqual(masteryStage(stat),'mastered');
});

test('iPad route and replay boot reference this same version',()=>{
  const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
  const release='20261023-fixed-two20-v1';
  const previous='20261023-mastery-count20-v1';
  assert.ok(read('assets/index-BLVOhKhN.js').includes('year8-daily-v2-20261018.js?v='+release));
  assert.ok(read('assets/quiz-session-y8fix-20260920.js').includes('daily-session-credit-20261021.js?v='+previous));
  assert.ok(read('assets/daily-answer-replay-boot-20261021.js').includes('daily-answer-replay-20261021.js?v='+previous));
  assert.ok(read('assets/study._subject.practise-y8fix-20260920.js').includes('E===\`due\`&&dailyLocked&&assignment?.masteryCheck?5'.replaceAll('\\','')));
});


test('two genuinely marked appearances of one question can complete a 20-event Mastery',()=>{
  let stat={};
  for(let i=0;i<20;i++){
    stat={masteryV2:addMasteryEvidence(stat,{day,year:8,mode:'mastery',
      questionId:'repeated-'+(i%10),attemptId:'marked-'+i,
      correct:i<17,format:i<3?'typed_short':'mc_single',formal:true})};
  }
  assert.equal(stat.masteryV2.stage,'check2');
  assert.equal(stat.masteryV2.passedMasteryAt,day);
  const same=addMasteryEvidence(stat,{day,year:8,mode:'mastery',
    questionId:'repeated-0',attemptId:'marked-0',correct:true,format:'typed_short'});
  assert.deepEqual(same,stat.masteryV2,'same marked event may not count twice');
});
