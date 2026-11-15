import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {latinRecoveryYear8Sources,latinRecoveryYear8ExtendedSources}
  from '../assets/latin-recovery-topic-pool-20261107.js';
import {year8SupplyGroups} from '../assets/year8-question-supply-manifest-20261111.js';
import {year8CorrectQuestionIds,year8TopicSupply}
  from '../assets/question-supply-preflight-20261111.js';
import {selectDiverseRecoveryQuestions}
  from '../assets/recovery-question-diversity-20261025.js';
import {recordRecoveryAnswer,matchesAssignedPracticeEvidence}
  from '../assets/recovery-task-ledger-20261017.js';

const assigned='la-y8-stage-1-vocabulary';
const missed='2026-11-12',today='2026-11-14';
const catalog=JSON.parse(readFileSync('content/catalog.json','utf8')).topics;
const questions=topicId=>JSON.parse(
  readFileSync('content/topics/'+topicId+'.json','utf8')
).questions.filter(q=>q.id&&q.status==='enabled'&&q.preview!==true&&
  q.formal!==false&&!q._repair);
const rank=(rows,subject,n)=>rows.slice(0,n);
const progression=(rows,mode,n)=>rows.slice(0,n);
const stageGroups=Object.entries(year8SupplyGroups).filter(([id])=>
  /^la-y8-stage-(?:[1-9]|1[0-2])-vocabulary$/.test(id));
const allStagesMastered=Object.fromEntries(stageGroups.flatMap(([,source])=>
  source[1].map(ids=>[ids[0],1])));
const task={id:'latin-standard',target:10,progress:6,
  assignedTopic:assigned,assignedYear:8,assignedSubject:'latin',
  href:'/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task=latin-standard&topic='+assigned};
const makeState=()=>({today,seenCorrect:{...allStagesMastered},formalAttemptLog:[],
  dailyLog:{[missed]:{date:missed,tasks:[{...task}]}},
  recoveryTaskByDay:{},recoveryReceipts:[],reviews:{}});
const extras=state=>latinRecoveryYear8ExtendedSources(
  catalog,assigned,id=>year8TopicSupply(id,state,{
    correctIds:year8CorrectQuestionIds(state,'latin')}),12);

test('fully mastered twelve Latin vocabulary stages do not exhaust other real Year 8 content',()=>{
  const state=makeState();
  assert.equal(stageGroups.length,12);
  assert.equal(latinRecoveryYear8Sources(catalog,assigned,state.seenCorrect,12).length,0);
  const available=extras(state);
  assert.ok(available.length>=4,'source-backed Year 8 grammar and translation topics remain');
  assert.ok(available.every(t=>t.subject==='latin'&&Number(t.year)===8&&
    t.status==='enabled'&&!/stage-\d+-vocabulary/.test(t.topicId)));
  assert.ok(available.every(t=>year8TopicSupply(t.topicId,state).available>0));
});

test('November 12 Recovery at 6/10 can obtain four unused original Year 8 Latin concepts',()=>{
  const state=makeState(),before=JSON.stringify(state);
  const available=extras(state);
  const bank=[...questions(assigned),...available.slice(0,5).flatMap(t=>questions(t.topicId))];
  const offered=selectDiverseRecoveryQuestions([],bank,{
    state,date:missed,taskId:'latin-standard',subject:'latin',year:8,
    topicId:assigned,size:4,mode:'standard',day:today,
  },rank,progression);
  assert.equal(offered.length,4);
  assert.equal(new Set(offered.map(q=>q.conceptId||q.id)).size,4);
  assert.ok(offered.every(q=>q.topicId!==assigned&&
    !state.seenCorrect[q.id]&&q.formal!==false&&q.status==='enabled'));
  assert.equal(JSON.stringify(state),before,'question selection does not change grades or history');
  let updated=state;
  for(let i=0;i<offered.length;i++){
    const q=offered[i];
    assert.equal(matchesAssignedPracticeEvidence({
      dailyTaskId:'latin-standard',subject:'latin',year:8,topicId:q.topicId,
      questionId:q.id,correct:true,formal:true},task,'latin-standard'),true);
    const result=recordRecoveryAnswer(updated,{today,date:missed,taskId:'latin-standard',
      questionId:q.id,correct:true,minimumCorrect:4});
    assert.equal(result.accepted,true);
    assert.equal(result.completed,i===3);
    updated=result.state;
  }
  assert.equal(updated.dailyLog[missed].tasks[0].progress,10);
  assert.equal(updated.dailyLog[missed].tasks[0].recovered,true);
  assert.equal(updated.dailyLog[today],undefined,'do not credit today');
  assert.equal(updated.recoveryAwarded,undefined,'do not manufacture rewards');
});

test('fallback never borrows Year 9, disabled, preview or an unknown inventory',()=>{
 const s=makeState(),supply=id=>year8TopicSupply(id,s),invalid=[
  {subject:'latin',year:9,status:'enabled',topicId:'la-y9-core-verbs'},
  {subject:'latin',year:8,status:'disabled',topicId:'la-y8-prepositions'},
  {subject:'latin',year:8,status:'preview',topicId:'la-y8-core-verbs'},
  {subject:'french',year:8,status:'enabled',topicId:'fr-y8-s01-quick-rules'},
  {subject:'latin',year:8,status:'enabled',topicId:'la-y8-made-up-source'},
 ];
 assert.deepEqual(latinRecoveryYear8ExtendedSources(invalid,assigned,supply,12),[]);
 assert.deepEqual(latinRecoveryYear8ExtendedSources(catalog,assigned,supply,0),[]);
});

test('iPad route performs bounded lazy fallback without changing original target',()=>{
 const js=readFileSync('assets/study._subject.practise-y8fix-20260920.js','utf8');
 assert.ok(js.includes("latinRecoveryYear8Sources(I,pinnedTopic,s.getState()?.seenCorrect,12)"));
 assert.ok(js.includes("await import('./question-supply-preflight-20261111.js')"));
 assert.ok(js.includes("latinRecoveryYear8ExtendedSources(I,pinnedTopic"));
 assert.ok(js.includes("countReservations:false"));
 assert.ok(js.includes('Your earlier correct answers are preserved on the missed date'));
 assert.ok(!js.includes('target:progress,progress,done:true,cappedBecauseQuestionBankExhausted:true'));
});
