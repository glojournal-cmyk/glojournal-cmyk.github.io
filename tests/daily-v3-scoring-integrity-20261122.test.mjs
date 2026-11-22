import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDailyV3,languageEvidence,v3ScopedQuestionEvidence,V3_TASK_SPEC,V3_APPROVED} from '../assets/daily-tasks-v3-20261122.js';
const day='2026-11-23';
const base=()=>({today:day,year:9,xp:1243,mp:89,streak:21,
  topicStats:{'la-y8-saved':{attempted:50,correct:45,masteryV2:{stage:'check2',due:day,passedMasteryAt:'2026-11-21'}}},
  recoveryTaskByDay:{'2026-11-22':{'y8-mastery-a':{items:{old:true}}}},
  recoveryVocabByDay:{'2026-11-22':{french:{items:{'old-1':true}}}},
  dailyLog:{'2026-11-21':{tasks:[{id:'latin-standard',target:10,progress:10,done:true}],done:10,total:10,complete:true}},
  formalAttemptLog:[],seenCorrect:{},reviews:{}});
const legacy=()=>[
  ['french-vocab',30,8],['latin-vocab',30,8],['latin-standard',10,8],
  ['y8-standard-a',10,8],['y8-standard-b',10,8],['y8-mastery-a',20,8],
  ['y8-mastery-b',20,8],['weakness-review',10,8],['due-review',10,8],['year9-light',15,9]
].map(([id,target,year])=>({id,planDate:day,target,progress:0,assignedYear:year,
  ...(id==='y8-standard-a'?{assignedTopic:'chem-y8-working-scientifically',assignedSubject:'chemistry'}:{})}));
const plan=()=>buildDailyV3(base(),legacy());
const entry=(task,id,correct=true,extra={})=>({
  day,year:task.assignedYear,subject:task.assignedSubject,topicId:task.assignedTopic,
  dailyTaskId:task.id,questionId:id,correct,formal:true,repair:false,recoveryFor:null,
  mode:'standard',...extra
});
test('scope: only one genuine dated correct per independently approved Standard B concept',()=>{
 const b=plan().find(x=>x.id==='y8-standard-b');
 assert.equal(b.assignedYear,9);
 const ids=b.approvedQuestionIds;
 const first=ids.map((id,i)=>entry(b,id,i!==0));
 const s={...base(),daily:plan(),formalAttemptLog:[...first,first[1],first[2],
    entry(b,ids[0],false),entry(b,'unapproved-y9',true),
    entry(b,ids[1],true,{repair:true}),entry(b,ids[2],true,{recoveryFor:'2026-11-22'}),
    entry(b,ids[3],true,{assisted:true})]};
 const counted=v3ScopedQuestionEvidence(s,b,day);
 assert.equal(counted.attempts,10);
 assert.equal(counted.correct,9);
 assert.equal(counted.completed,false);
 const rebuilt=buildDailyV3(s,legacy());
 assert.equal(rebuilt.find(x=>x.id===b.id).progress,9);
 assert.equal(rebuilt.find(x=>x.id===b.id).done,false);
 s.formalAttemptLog.push(entry(b,ids[0],true));
 assert.equal(v3ScopedQuestionEvidence(s,b,day).correct,10);
 assert.equal(buildDailyV3(s,legacy()).find(x=>x.id===b.id).done,true);
});
test('wrong year, other subject, other topic, other day or different Daily task cannot leak credit to Standard B',()=>{
 const b=plan().find(x=>x.id==='y8-standard-b');
 const id=b.approvedQuestionIds[0];
 for(const bad of [{year:8},{subject:'latin'},{topicId:'wrong'},{day:'2026-11-22'},
   {dailyTaskId:'year9-light'},{scaffolded:true},{hintUsed:true},{formal:false},
   {repair:true},{recoveryFor:'2026-11-22'}]){
   assert.equal(v3ScopedQuestionEvidence({...base(),formalAttemptLog:[entry(b,id,true,bad)]},b,day).correct,0,JSON.stringify(bad));
 }
});
test('Languages only counts five approved original-question concepts in EACH correct subject and assigned topic',()=>{
 const orig=plan();
 const x=orig.find(t=>t.id==='languages-standard'),split=x.languageSplit;
 const mk=(subject,id,correct=true,extra={})=>({
   day,year:8,subject,topicId:split[subject].topicId,dailyTaskId:'languages-standard',
   questionId:id,correct,formal:true,repair:false,...extra
 });
 const latin=split.latin.approvedQuestionIds.map(id=>mk('latin',id));
 const french=split.french.approvedQuestionIds.map(id=>mk('french',id));
 const s={...base(),daily:orig,formalAttemptLog:[...latin,...latin,...french.slice(0,3),
  mk('french',split.french.approvedQuestionIds[3],false),
  mk('french',split.french.approvedQuestionIds[4],true,{hintUsed:true})]};
 const e=languageEvidence(s,day);
 assert.equal(e.latin.correct,5);
 assert.equal(e.french.correct,3);
 assert.equal(e.progress,8);
 assert.equal(e.completed,false);
 const update=buildDailyV3(s,legacy()).find(x=>x.id==='languages-standard');
 assert.equal(update.progress,8);
 s.formalAttemptLog.push(...french.slice(3));
 assert.equal(languageEvidence(s,day).completed,true);
 assert.equal(buildDailyV3(s,legacy()).find(x=>x.id==='languages-standard').progress,10);
});
test('V3 planner never changes original XP, MP, streak, Mastery, Recovery, seenCorrect or completed historic Daily receipt',()=>{
 const seed=base(),copy=JSON.stringify(seed);
 const first=buildDailyV3(seed,legacy());
 assert.deepEqual(first.map(x=>x.id),V3_TASK_SPEC.map(x=>x[0]));
 assert.equal(JSON.stringify(seed),copy,'planner must be pure (no data writes)');
 const snap={...seed,daily:JSON.parse(JSON.stringify(first))};
 const before={xp:snap.xp,mp:snap.mp,streak:snap.streak,mastery:JSON.stringify(snap.topicStats),
   recovery:JSON.stringify(snap.recoveryTaskByDay),history:JSON.stringify(snap.dailyLog)};
 buildDailyV3(snap,legacy());
 assert.equal(snap.xp,before.xp);
 assert.equal(snap.mp,before.mp);
 assert.equal(snap.streak,before.streak);
 assert.equal(JSON.stringify(snap.topicStats),before.mastery);
 assert.equal(JSON.stringify(snap.recoveryTaskByDay),before.recovery);
 assert.equal(JSON.stringify(snap.dailyLog),before.history);
});
test('persisted V3 assignments survive JSON round trip and cannot be reassigned after a marked wrong answer',()=>{
 const first=plan();
 const b=first.find(t=>t.id==='y8-standard-b');
 const pinned=JSON.parse(JSON.stringify(first));
 const s={...base(),daily:pinned,formalAttemptLog:[entry(b,b.approvedQuestionIds[0],false)]};
 const reread=buildDailyV3(s,legacy(),{...V3_APPROVED,year9Standard:[]});
 const unchanged=reread.find(t=>t.id==='y8-standard-b');
 assert.equal(unchanged.assignedTopic,b.assignedTopic);
 assert.deepEqual(unchanged.approvedQuestionIds,b.approvedQuestionIds);
 assert.equal(unchanged.progress,0);
 assert.equal(unchanged.done,false);
});

test('cross-task duplicate question credited in Standard A or Year9 Light cannot inflate Standard B or Languages',()=>{
 const tasks=plan(),b=tasks.find(t=>t.id==='y8-standard-b'),l=tasks.find(t=>t.id==='languages-standard');
 const id=b.approvedQuestionIds[0],lId=l.languageSplit.latin.approvedQuestionIds[0];
 const events=[
   entry(b,id,true,{dailyTaskId:'year9-light'}),
   entry(b,id,true),
   {day,year:8,subject:'latin',topicId:l.languageSplit.latin.topicId,
     dailyTaskId:'latin-standard',questionId:lId,correct:true,formal:true},
   {day,year:8,subject:'latin',topicId:l.languageSplit.latin.topicId,
     dailyTaskId:'languages-standard',questionId:lId,correct:true,formal:true}
 ];
 const s={...base(),daily:tasks,formalAttemptLog:events};
 assert.equal(v3ScopedQuestionEvidence(s,b,day).correct,0);
 assert.equal(languageEvidence(s,day).latin.correct,0);
 assert.equal(s.xp,1243);assert.equal(s.mp,89);
});
