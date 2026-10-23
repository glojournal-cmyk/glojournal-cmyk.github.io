import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addMasteryEvidence,coveredTopic,eligibleFreshQuestions,masteryStage} from '../assets/mastery-v2-20261018.js';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';
import {prepareUnopenedRecovery,recordRecoveryAnswer} from '../assets/recovery-task-ledger-20261017.js';
import {selectDailyVocabulary} from '../assets/daily-vocab-20261003.js';

const subjects=['latin','french','biology','chemistry','physics'];
const catalog=subjects.flatMap(subject=>Array.from({length:4},(_,i)=>({
  subject,year:8,topicId:`${subject}-y8-t${i+1}`,title:`Topic ${i+1}`,status:'enabled',enabled:40,
  formats:{typed_short:20}
}))).concat(subjects.map(subject=>({subject,year:9,topicId:`${subject}-y9-t1`,title:'Year 9',status:'enabled',enabled:40})));
const get=(subject,year)=>catalog.filter(t=>t.subject===subject&&t.year===year);

test('legacy coverage and mastered status survive; a new round advances separately',()=>{
  const legacy={attempted:30,correct:16,state:'mastered'};
  assert.equal(coveredTopic({topicStats:{'latin-y8-t1':legacy}},'latin-y8-t1'),true);
  assert.equal(masteryStage(legacy),'mastered');
  let row={};
  for(let i=0;i<20;i++)row={masteryV2:addMasteryEvidence(row,{day:'2026-10-19',year:8,mode:'mastery',questionId:'q'+i,correct:i<17,format:i<3?'typed_short':'mc_single'})};
  assert.equal(row.masteryV2.stage,'check2');assert.equal(row.masteryV2.due,'2026-10-21');
  const unchanged=addMasteryEvidence(row,{day:'2026-10-20',year:8,mode:'due',questionId:'early',correct:true});
  assert.deepEqual(unchanged,row.masteryV2);
  for(let i=0;i<5;i++)row={masteryV2:addMasteryEvidence(row,{day:'2026-10-21',year:8,mode:'retention',questionId:'r'+i,correct:i<4})};
  assert.equal(row.masteryV2.stage,'check7');assert.equal(row.masteryV2.due,'2026-10-26');
  for(let i=0;i<5;i++)row={masteryV2:addMasteryEvidence(row,{day:'2026-10-26',year:8,mode:'due',questionId:'s'+i,correct:i<4})};
  assert.equal(masteryStage(row),'mastered');
});

test('a repeated correct question does not reappear in Standard or Mastery',()=>{
  const questions=[{id:'known'},{id:'wrong'},{id:'new'},{id:'future'}];
  const state={today:'2026-10-19',seenCorrect:{known:1},reviews:{future:{due:'2026-10-21'}}};
  assert.deepEqual(eligibleFreshQuestions(questions,state,'standard').map(q=>q.id),['wrong','new']);
  assert.deepEqual(eligibleFreshQuestions(questions,state,'mastery').map(q=>q.id),['wrong','new']);
  assert.equal(eligibleFreshQuestions(questions,state,'due').length,4);
});

test('a correct word is withheld until the rest of its vocabulary pool is answered',()=>{
  // The 21 October rule prioritises full-bank coverage over repeating a
  // previously correct word, even when a scheduled review becomes due.
  // Incorrect due mistakes still have their own priority review queue.
  const items=Array.from({length:40},(_,i)=>({id:'fr-word-'+i,conceptId:'fr-y8-concept-vocab-'+i,
    topicId:'fr-y8-vocab',format:'typed_exact',status:'enabled',
    prompt:'Translate into English: mot'+i,stimulus:{text:'mot'+i},
    answer:{accepted:['word '+i]}}));
  const rows=selectDailyVocabulary({subject:'french',items,day:'2026-10-19',seenCorrect:{'fr-word-0':1}});
  assert.equal(rows.length,30);assert.ok(!rows.some(q=>q.id==='fr-word-0'));
  const review={ 'fr-word-0':{due:'2026-10-21',last:'2026-10-19',wrong:false} };
  const waiting=selectDailyVocabulary({subject:'french',items,day:'2026-10-21',seenCorrect:{'fr-word-0':1},reviews:review});
  assert.equal(waiting.length,30);
  assert.ok(!waiting.some(q=>q.id==='fr-word-0'), 'one correct word must not displace 39 unseen words');
  const fullCycle=Object.fromEntries(items.map(q=>[q.id,q.id==='fr-word-0'?1:2]));
  const dueAfterCycle=selectDailyVocabulary({subject:'french',items,day:'2026-10-21',seenCorrect:fullCycle,reviews:review});
  assert.ok(dueAfterCycle.some(q=>q.id==='fr-word-0'), 'once the bank cycles, a due word can return');
});

test('future plan has two different same-subject Standard topics and retains assigned topic on reload',()=>{
  const state={today:'2026-10-19',daily:[],topicStats:{'latin-y8-t1':{attempted:10,correct:8}},formalAttemptLog:[],dailyVocabByDay:{}};
  const first=buildYear8DailyV2(state,get);
  assert.equal(first.length,10);assert.equal(first.reduce((sum,t)=>sum+t.target,0),165);
  assert.equal(first.find(t=>t.id==='latin-vocab').target,30);
  const [a,b]=['y8-standard-a','y8-standard-b'].map(id=>first.find(t=>t.id===id));
  assert.equal(a.assignedSubject,b.assignedSubject);assert.notEqual(a.assignedTopic,b.assignedTopic);
  const frozen=buildYear8DailyV2({...state,daily:first,topicStats:{...state.topicStats,[a.assignedTopic]:{attempted:11,correct:11}}},get);
  assert.equal(frozen.find(t=>t.id==='y8-standard-a').assignedTopic,a.assignedTopic);
  assert.equal(frozen.find(t=>t.id==='y8-standard-b').assignedTopic,b.assignedTopic);
});

test('a new learner has ten reachable tasks and one answer credits only its assigned task',()=>{
  const base={today:'2026-10-19',daily:[],topicStats:{},formalAttemptLog:[],dailyVocabByDay:{}};
  const plan=buildYear8DailyV2(base,get);
  assert.ok(plan.every(t=>t.href&&t.target>0));
  const mastery=plan.find(t=>t.id==='y8-mastery-a');
  assert.ok(mastery.assignedTopic&&mastery.href.includes('/practise'));
  const standard=plan.find(t=>t.id==='y8-standard-a');
  const answer={day:base.today,topicId:standard.assignedTopic,questionId:'q1',attemptId:'attempt1',
    dailyTaskId:standard.id,mode:'standard',formal:true};
  const updated=buildYear8DailyV2({...base,daily:plan,formalAttemptLog:[answer]},get);
  assert.equal(updated.find(t=>t.id===standard.id).progress,1);
  assert.equal(updated.filter(t=>t.progress>0).length,1);
});

test('an unopened future day creates ten dated assignments and recovery credits only that day',()=>{
  const state={today:'2026-10-21',daily:[],dailyLog:{'2026-10-17':{date:'2026-10-17',done:10,total:10,tasks:[]}},
    topicStats:{},formalAttemptLog:[],dailyVocabByDay:{}};
  const plan=buildYear8DailyV2({...state,today:'2026-10-19'},get);
  const prepared=prepareUnopenedRecovery(state,'2026-10-19','2026-10-21',plan);
  assert.equal(prepared.created,true);assert.equal(prepared.state.dailyLog['2026-10-19'].tasks.length,10);
  assert.equal(prepared.state.dailyLog['2026-10-17'].done,10);
  let progress=prepared.state;
  for(let i=0;i<10;i++)progress=recordRecoveryAnswer(progress,{today:'2026-10-21',date:'2026-10-19',
    taskId:'y8-standard-a',questionId:'unique-'+i,correct:i%2===0}).state;
  assert.equal(progress.dailyLog['2026-10-19'].tasks.find(t=>t.id==='y8-standard-a').done,true);
  assert.equal(progress.dailyLog['2026-10-17'].done,10);
  assert.equal(progress.today,'2026-10-21');
});
