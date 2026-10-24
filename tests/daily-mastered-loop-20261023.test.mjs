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

test('Oct 23 iPad regression: original eight completed tasks restored, only vocab unfinished',()=>{
  // This reproduces the later screenshot: an already-completed French 20/20
  // was given a new topic, Mastery A became 0/20, and Latin weak 10/10 and
  // the Year 9 French 15/15 were switched to unrelated physics 0/10, 15/15.
  const input=state('2026-10-23');
  const task=(id,subject,topic,target,progress,mode='standard')=>({
    id,planDate:input.today,assignedSubject:subject,assignedTopic:topic,
    assignedYear:id==='year9-light'?9:8,assignedLabel:topic,
    href:`/study/${subject}/practise?daily=1&locked=1&year=8&mode=${mode}&task=${id}&topic=${topic}`,
    target,progress
  });
  input.daily=[
    {id:'latin-vocab',target:30,progress:0,planDate:day},
    {id:'french-vocab',target:30,progress:29,planDate:day},
    task('latin-standard','latin','la-y8-stage-1-vocabulary',10,10),
    task('y8-standard-a','biology','bio-y8-food-tests',10,10),
    task('y8-standard-b','biology','bio-y8-digestion-absorption',10,10),
    task('y8-mastery-a','french','fr-y8-s12-ks3-extension-irregular-verbs',20,0,'mastery'),
    task('y8-mastery-b','french','fr-y8-s03-daily-routine-toolkit',20,20,'mastery'),
    task('weakness-review','physics','phys-y8-forces',10,10,'weak'),
    task('due-review','latin','la-y8-miscellaneous-words',5,5,'due'),
    task('year9-light','physics','phys-y9-kinetic',15,15)
  ];
  // The photographed, completed Weakness receipt provides the evidence gate;
  // this test must not grant recovery to a 0/10 unverified Weakness task.
  // Earlier saved records, where present, are never thrown away.
  input.dailyLog[day]={date:day,tasks:input.daily.map(t=>({...t}))};
  const restored=buildYear8DailyV2(input,get);
  assert.equal(restored.length,10,'restore the original ten daily tasks, not an eleventh make-up set');
  const expected=[
    ['latin-vocab',null,0,30],['french-vocab',null,29,30],
    ['latin-standard','la-y8-stage-1-vocabulary',10,10],
    ['y8-standard-a','bio-y8-food-tests',10,10],
    ['y8-standard-b','bio-y8-digestion-absorption',10,10],
    ['y8-mastery-a','la-y8-miscellaneous-words',20,20],
    ['y8-mastery-b','fr-y8-s12-ks3-extension-irregular-verbs',20,20],
    ['weakness-review','la-y8-core-verbs',10,10],
    ['due-review','la-y8-preposition-dictionary-entries',10,10],
    ['year9-light','fr-y9-u1-paris-travel',15,15]
  ];
  for(const [id,topic,progress,target] of expected){
    const row=lookup(restored,id);
    assert.ok(row,id+' must remain present');
    if(topic)assert.equal(row.assignedTopic,topic,id+' must not rotate to a different topic');
    assert.equal(row.progress,progress,id+' must show recorded completed answers');
    assert.equal(row.target,target,id+' must preserve its original question count');
  }
  assert.equal(restored.filter(t=>t.progress===t.target).length,8);
  assert.equal(lookup(restored,'y8-mastery-topup-a'),undefined);
  assert.equal(lookup(restored,'y8-mastery-topup-b'),undefined);
  assert.ok(restored.every(t=>t.planDate===day));
  assert.equal(lookup(restored,'french-vocab').progress,29,'do not mark French vocab 30/30');
  assert.equal(lookup(restored,'latin-vocab').progress,0,'do not mark Latin vocab 30/30');
  assert.ok(!input.formalAttemptLog.length,'repair must not fabricate attempts');
  const next=buildYear8DailyV2({...input,daily:restored,today:'2026-10-24'},get);
  assert.equal(lookup(next,'y8-mastery-a').target,20,'new schedule starts tomorrow');
  assert.equal(lookup(next,'y8-mastery-b').target,20);
  assert.equal(next.length,10);
});

test('Oct 23 screenshot restore never grants completion to an unrelated blank app',()=>{
  const empty=state();
  const normal=buildYear8DailyV2(empty,get);
  assert.equal(normal.filter(t=>t.progress>=t.target).length,0);
  assert.equal(normal.length,10);
  assert.equal(lookup(normal,'y8-mastery-b').target,20);
});

test('Oct 23 dated Record becomes the original eight completions without losing the erroneous previous snapshot',()=>{
  const input=state(day);
  const r=(id,topic,progress,target)=>({id,assignedTopic:topic,progress,target,planDate:day});
  input.daily=[r('latin-vocab',null,0,30),r('french-vocab',null,29,30),
    r('latin-standard','la-y8-stage-1-vocabulary',10,10),
    r('y8-standard-a','bio-y8-food-tests',10,10),
    r('y8-standard-b','bio-y8-digestion-absorption',10,10),
    r('y8-mastery-a','fr-y8-s12-ks3-extension-irregular-verbs',0,20),
    r('y8-mastery-b','fr-y8-s03-daily-routine-toolkit',20,20),
    r('weakness-review','phys-y8-forces',10,10),
    r('due-review','la-y8-miscellaneous-words',5,5),
    r('year9-light','phys-y9-kinetic',15,15)];
  input.dailyLog[day]={date:day,tasks:input.daily.map(t=>({...t}))};
  const repaired=buildYear8DailyV2(input,get);
  assert.equal(repaired.filter(x=>x.restoredOriginalDaily).length,8);
  const js=readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
  const start=js.indexOf('function compactDailyTasks(');
  const end=js.indexOf('function sealDailyLog(',start);
  assert.ok(start>0&&end>start);
  const merge=(left,right)=>right;
  const write=new Function('mergeDailyRecordRow',js.slice(start,end)+';return writeDailyLog;')(merge);
  const first=write(input.dailyLog,day,repaired);
  const row=first[day];
  assert.equal(row.total,10);
  assert.equal(row.done,8);
  assert.equal(row.complete,false);
  assert.equal(row.restoredOct23Record,true);
  assert.equal(row.tasks.find(t=>t.id==='y8-mastery-b').progress,20);
  assert.equal(row.tasks.find(t=>t.id==='y8-mastery-b').assignedTopic,
    'fr-y8-s12-ks3-extension-irregular-verbs');
  assert.equal(row.tasks.find(t=>t.id==='weakness-review').assignedTopic,'la-y8-core-verbs');
  assert.equal(row.tasks.find(t=>t.id==='weakness-review').progress,10);
  assert.ok(row.preRestoreTasks?.some(t=>
    t.id==='y8-mastery-a'&&t.assignedTopic==='fr-y8-s12-ks3-extension-irregular-verbs'));
  assert.deepEqual(write(first,day,repaired),first,'normalization must be idempotent');
});

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
  assert.equal(updated.length,11,'an active 5-question legacy check requires an EXTRA 20-question set today');
  assert.equal(lookup(updated,'y8-mastery-topup-a').target,20);
  assert.equal(lookup(updated,'y8-mastery-topup-a').progress,0);
  assert.equal(urlMode(lookup(updated,'y8-mastery-topup-a')),'mastery');
  assert.notEqual(lookup(updated,'y8-mastery-topup-a').assignedTopic,'latin-y8-t0');
  assert.ok(updated.every(t=>t.progress<=t.target));
});

test('iPad screenshot: completed 5/5 recall remains, with a new full 20 instead of a fake 20/20',()=>{
  const input=state();
  input.topicStats['latin-y8-t0']={masteryV2:{stage:'check7',due:day}};
  input.daily=[
    {id:'y8-mastery-a',planDate:day,assignedSubject:'latin',assignedYear:8,
      assignedTopic:'latin-y8-t0',assignedLabel:'Miscellaneous words',masteryCheck:true,
      href:'/study/latin/practise?daily=1&locked=1&year=8&mode=due&task=y8-mastery-a&topic=latin-y8-t0',
      progress:5,target:5},
    {id:'y8-mastery-b',planDate:day,assignedSubject:'french',assignedYear:8,
      assignedTopic:'french-y8-t1',assignedLabel:'Irregular verbs',masteryCheck:false,
      href:'/study/french/practise?daily=1&locked=1&year=8&mode=mastery&task=y8-mastery-b&topic=french-y8-t1',
      progress:20,target:20}
  ];
  const plan=buildYear8DailyV2(input,get);
  assert.equal(plan.length,11);
  assert.equal(lookup(plan,'y8-mastery-a').progress,5);
  assert.equal(lookup(plan,'y8-mastery-a').target,5);
  assert.match(lookup(plan,'y8-mastery-a').title,/recall/);
  assert.equal(lookup(plan,'y8-mastery-b').progress,20);
  assert.equal(lookup(plan,'y8-mastery-b').target,20);
  assert.match(lookup(plan,'y8-mastery-b').title,/Mastery B/);
  const extra=lookup(plan,'y8-mastery-topup-a');
  assert.equal(extra.progress,0,'the five recall answers cannot complete the new set');
  assert.equal(extra.target,20);
  assert.match(extra.title,/Mastery A/);
  const savedAgain=buildYear8DailyV2({...input,daily:plan},get);
  assert.equal(lookup(savedAgain,extra.id).assignedTopic,extra.assignedTopic,
    'a reload must not rotate the make-up assignment');
  const questions=allQ(extra.assignedTopic,20);
  const verified=reconcileDailySession({...input,daily:plan},{
    day,taskId:extra.id,subject:extra.assignedSubject,year:8,mode:'mastery',questions,
    answers:questions.map(q=>({questionId:q.id,correct:true,formal:true}))
  });
  assert.equal(verified.changed,true);
  assert.equal(lookup(verified.daily,extra.id).progress,20);
  assert.equal(lookup(verified.daily,'y8-mastery-a').progress,5);
  assert.equal(lookup(verified.daily,'y8-mastery-b').progress,20);
  const marked=questions.map((q,i)=>({
    day,questionId:q.id,attemptId:'topup'+i,topicId:extra.assignedTopic,
    dailyTaskId:extra.id,mode:'mastery',formal:true,correct:i<17,
    format:'typed_short',subject:extra.assignedSubject
  }));
  const replay=replayDailyAnswerCredit({...input,daily:plan,formalAttemptLog:marked});
  assert.equal(lookup(replay.daily,extra.id).progress,20);
  assert.equal(lookup(replay.daily,'y8-mastery-a').progress,5);
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
  const release='20261024-correct-credit1';
  const previous='20261024-correct-credit1';
  assert.ok(read('assets/index-BLVOhKhN.js').includes('year8-daily-v2-20261018.js?v='+release));
  assert.ok(read('assets/quiz-session-y8fix-20260920.js').includes('daily-session-credit-20261021.js?v='+previous));
  assert.ok(read('assets/daily-answer-replay-boot-20261021.js').includes('daily-answer-replay-20261021.js?v=20261024-correct-credit1'));
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
