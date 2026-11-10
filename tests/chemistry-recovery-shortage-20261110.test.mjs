import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {year8ScienceRecoveryTopics} from '../assets/year8-science-recovery-sources-20261110.js';
import {selectDiverseRecoveryQuestions} from '../assets/recovery-question-diversity-20261025.js';
import {matchesAssignedPracticeEvidence,recordRecoveryAnswer,canRecover} from '../assets/recovery-task-ledger-20261017.js';
const oldDate='2026-11-08',today='2026-11-10',subject='chemistry';
const pinned='chem-y8-acids-indicators-ph',extra='chem-y8-working-scientifically';
const catalog=JSON.parse(readFileSync('content/catalog.json','utf8')).topics;
const questions=id=>JSON.parse(readFileSync('content/topics/'+id+'.json','utf8')).questions.filter(q=>
 q?.id&&q.formal!==false&&!q._repair&&q.status!=='preview');
const q1=questions(pinned),q2=questions(extra);
const task={id:'y8-standard-a',title:'Chemistry Practice',target:10,progress:0,
 assignedYear:8,assignedSubject:subject,assignedTopic:pinned,
 href:'/study/chemistry/practise?daily=1&locked=1&year=8&mode=standard&task=y8-standard-a&topic='+pinned};
const rank=(array,_,size)=>array.slice(0,size),progression=(array,_,size)=>array.slice(0,size);
const select=(state,bank,mode='standard')=>selectDiverseRecoveryQuestions(
 q1.slice(0,7),bank,{state,date:oldDate,day:today,taskId:task.id,
  subject,year:8,topicId:pinned,size:10,mode},rank,progression);
const initialState=()=>({
 today,seenCorrect:Object.fromEntries(q1.slice(7).map(q=>[q.id,1])),
 formalAttemptLog:[],dailyLog:{[oldDate]:{date:oldDate,tasks:[task]}},
 recoveryTaskByDay:{},recoveryReceipts:[]
});
test('all fallback sources are enabled Year 8 Chemistry, never preview or Year 9',()=>{
 const sources=year8ScienceRecoveryTopics(catalog,subject,pinned,[{topicId:pinned}]);
 assert.ok(sources.length>=3);
 assert.ok(sources.some(t=>t.topicId===extra));
 assert.ok(sources.every(t=>t.subject==='chemistry'&&Number(t.year)===8&&t.status==='enabled'));
 assert.ok(sources.every(t=>t.topicId!==pinned));
 assert.ok(sources.every(t=>!['chem-y8-earth-rocks-resources','chem-y8-energy-changes'].includes(t.topicId)));
 assert.deepEqual(year8ScienceRecoveryTopics(catalog,'latin',pinned),[]);
 assert.deepEqual(year8ScienceRecoveryTopics(catalog,'chemistry',''),[]);
});
test('reproduce Nov 8 Chemistry 0/10: seven original then ten genuine Year 8 answers',()=>{
 assert.equal(q1.length>=17,true);
 const state=initialState(),before=JSON.stringify(state);
 const original=select(state,q1);
 assert.equal(original.length,7,'old single-topic Recovery supplies only 7');
 const fromSchool=[...q1,...q2];
 const fixed=select(state,fromSchool);
 assert.equal(fixed.length,10,'new cross-topic Recovery fills original 10');
 assert.equal(new Set(fixed.map(q=>q.id)).size,10);
 assert.equal(fixed.filter(q=>q.topicId===pinned).length,7);
 assert.equal(fixed.filter(q=>q.topicId===extra).length,3);
 assert.ok(fixed.every(q=>q.formal!==false&&!q._repair&&q.status!=='preview'));
 assert.ok(fixed.every(q=>!state.seenCorrect[q.id]));
 assert.equal(JSON.stringify(state),before,'no user data changed by question selection');
});
test('ten true Chemistry answers credit Nov 8 dated assignment, never Nov 10',()=>{
 assert.equal(canRecover(today,oldDate),true,'November 10 remains inside 48h');
 const original=initialState();
 const fixed=select(original,[...q1,...q2]);
 assert.equal(fixed.length,10);
 let next=original;
 for(let i=0;i<fixed.length;i++){
  const q=fixed[i];
  assert.equal(matchesAssignedPracticeEvidence({questionId:q.id,correct:true,formal:true,
    dailyTaskId:task.id,subject,year:8,topicId:q.topicId},task,task.id),true);
  const event=recordRecoveryAnswer(next,{today,date:oldDate,taskId:task.id,
    questionId:q.id,correct:true,minimumCorrect:10});
  assert.equal(event.accepted,true);
  assert.equal(event.completed,i===9);
  next=event.state;
 }
 assert.equal(next.dailyLog[oldDate].tasks[0].progress,10);
 assert.equal(next.dailyLog[oldDate].tasks[0].done,true);
 assert.equal(next.dailyLog[oldDate].tasks[0].recovered,true);
 assert.equal(next.dailyLog[today],undefined);
 assert.equal(next.recoveryTaskByDay[oldDate][task.id].completed,true);
 assert.equal(JSON.stringify(original),JSON.stringify(initialState()));
});
test('never borrow into review, Year 9, another subject, or untagged answers',()=>{
 const state=initialState(),bank=[...q1,...q2];
 assert.equal(select(state,bank,'mistakes').length,7);
 const year9=selectDiverseRecoveryQuestions(q1.slice(0,7),bank,
  {state,date:oldDate,day:today,taskId:task.id,subject,year:9,
   topicId:pinned,size:10,mode:'standard'},rank,progression);
 assert.equal(year9.length,7);
 const other=selectDiverseRecoveryQuestions(q1.slice(0,7),bank,
  {state,date:oldDate,day:today,taskId:task.id,subject:'physics',year:8,
   topicId:pinned,size:10,mode:'standard'},rank,progression);
 assert.equal(other.length,7);
 assert.equal(matchesAssignedPracticeEvidence({questionId:q2[0].id,
  correct:true,formal:true,subject,year:8,topicId:extra},task,task.id),false);
});
test('live loader and selector contain exact science Recovery-only gates',()=>{
 const js=readFileSync('assets/study._subject.practise-y8fix-20260920.js','utf8');
 const selector=readFileSync('assets/recovery-question-diversity-20261025.js','utf8');
 assert.ok(js.includes("dailyLocked&&dailyParams.has('recover')&&assignment&&N===8&&"));
 assert.ok(js.includes("year8ScienceRecoveryTopics(I,e,pinnedTopic,n)"));
 assert.ok(js.includes("['standard','quick','mastery','year8long'].includes(E)&&pinnedTopic"));
 assert.ok(selector.includes("Number(year)===8&&['biology','chemistry','physics'].includes(subject)"));
});
