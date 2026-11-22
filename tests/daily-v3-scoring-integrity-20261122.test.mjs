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
 assert.equal(v3ScopedQuestionEvidence(s,b,day).correct,9,
   'a later correct retry cannot wash a wrong first answer into Daily credit');
 assert.equal(buildDailyV3(s,legacy()).find(x=>x.id===b.id).done,false);
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
 assert.equal(languageEvidence(s,day).completed,false,
   'a corrected or post-hint retry cannot replace the first formal result');
 assert.equal(buildDailyV3(s,legacy()).find(x=>x.id==='languages-standard').progress,8);
});
test('first formal answer wins: wrong and hinted Language or Year9 attempts cannot be overwritten',()=>{
 const tasks=plan(),standard=tasks.find(t=>t.id==='y8-standard-b');
 const langs=tasks.find(t=>t.id==='languages-standard');
 for(const first of [{correct:false},{correct:true,hintUsed:true},
   {correct:true,assisted:true},{correct:true,scaffolded:true}]){
  const id=standard.approvedQuestionIds[0];
  const early=entry(standard,id,first.correct,first);
  const later=entry(standard,id,true);
  const e=v3ScopedQuestionEvidence({...base(),daily:tasks,formalAttemptLog:[early,later]},standard,day);
  assert.equal(e.correct,0,'Year9 retry credit forbidden: '+JSON.stringify(first));
  assert.equal(e.completed,false);
  const lid=langs.languageSplit.latin.approvedQuestionIds[0];
  const item=(payload)=>({day,year:8,subject:'latin',
    topicId:langs.languageSplit.latin.topicId,
    dailyTaskId:'languages-standard',questionId:lid,
    correct:true,formal:true,...payload});
  const proof=languageEvidence({...base(),daily:tasks,
    formalAttemptLog:[item(first),item({correct:true})]},day);
  assert.equal(proof.latin.correct,0,'Language retry credit forbidden: '+JSON.stringify(first));
 }
});
test('BLOCKED Languages Standard cannot be turned into 10/10 by tagged but unapproved formal answers',()=>{
 const initial=buildDailyV3(base(),legacy(),{
   ...V3_APPROVED,languageGrammar:{latin:[],french:[]}
 });
 const denied=initial.find(t=>t.id==='languages-standard');
 assert.equal(denied.supplyBlocked,true);
 const forged=['latin','french'].flatMap(subject=>Array.from({length:5},(_,i)=>({
   day,year:8,subject,topicId:'fictional-topic',
   dailyTaskId:'languages-standard',questionId:'unapproved-'+subject+'-'+i,
   correct:true,formal:true,repair:false
 })));
 const state={...base(),daily:initial,formalAttemptLog:forged};
 const result=languageEvidence(state,day);
 assert.deepEqual(result,{latin:{attempts:0,correct:0},
   french:{attempts:0,correct:0},progress:0,completed:false});
 const rebuilt=buildDailyV3(state,legacy(),{
   ...V3_APPROVED,languageGrammar:{latin:[],french:[]}
 }).find(t=>t.id==='languages-standard');
 assert.equal(rebuilt.supplyBlocked,true);
 assert.equal(rebuilt.progress,0);
 assert.equal(rebuilt.done,false);
});
test('missing or incomplete saved Language 5+5 concept assignments cannot count unassigned replay events',()=>{
 const plan=buildDailyV3(base(),legacy()),task=plan.find(t=>t.id==='languages-standard');
 assert.equal(task.supplyBlocked,undefined);
 const events=['latin','french'].flatMap(subject=>
   task.languageSplit[subject].approvedQuestionIds.map(id=>({
     day,year:8,subject,topicId:task.languageSplit[subject].topicId,
     dailyTaskId:'languages-standard',questionId:id,correct:true,formal:true
   })));
 assert.equal(languageEvidence({...base(),daily:plan,formalAttemptLog:events},day).completed,true);
 for(const corrupted of [
   {...task,supplyBlocked:true},
   {...task,languageSplit:null},
   {...task,languageSplit:{...task.languageSplit,latin:{...task.languageSplit.latin,
       approvedConceptByQuestion:{}}}},
   {...task,languageSplit:{...task.languageSplit,french:{...task.languageSplit.french,
       approvedQuestionIds:task.languageSplit.french.approvedQuestionIds.slice(0,4)}}},
   {...task,dailyV3:false},
   {...task,planDate:'2026-11-22'}
 ]){
   const changed=plan.map(t=>t.id===task.id?corrupted:t);
   const e=languageEvidence({...base(),daily:changed,formalAttemptLog:events},day);
   assert.equal(e.progress,0,JSON.stringify(corrupted?.languageSplit?.latin?.approvedQuestionIds));
   assert.equal(e.completed,false);
 }
});
test('Year 9 Due Review pins actual due member IDs and independently distinct concepts',()=>{
 const ids=Array.from({length:10},(_,i)=>'due-variant-'+i);
 const topic={academicQA:'approved',taughtVerified:true,subject:'chemistry',year:9,
   topicId:'chem-y9-synthetic-due',title:'Synthetic approved due',
   concepts:ids.map((id,i)=>({conceptId:'due-concept-'+i,
     ids:['not-due-primary-'+i,id]}))};
 const reviews=Object.fromEntries(ids.map(id=>[id,{due:'2026-11-22'}]));
 const state={...base(),reviews};
 const manifest={...V3_APPROVED,year9Due:[topic]};
 const tasks=buildDailyV3(state,legacy(),manifest);
 const due=tasks.find(t=>t.id==='due-review');
 assert.equal(due.assignedYear,9);
 assert.deepEqual(due.approvedQuestionIds,ids,
   'must choose the reviewed due alternative, not an unrelated primary ID');
 assert.equal(Object.keys(due.approvedConceptByQuestion).length,10);
 assert.equal(new Set(Object.values(due.approvedConceptByQuestion)).size,10);
 const answers=ids.map(id=>({day,year:9,subject:'chemistry',topicId:topic.topicId,
   dailyTaskId:'due-review',questionId:id,correct:true,formal:true}));
 const populated={...state,daily:tasks,formalAttemptLog:answers};
 assert.equal(v3ScopedQuestionEvidence(populated,due,day).correct,10);
 const rebuilt=buildDailyV3(populated,legacy(),manifest).find(t=>t.id==='due-review');
 assert.equal(rebuilt.progress,10);
 assert.equal(rebuilt.done,true);
 const wrongIds=answers.map(x=>({...x,questionId:'not-due-primary-'+x.questionId.slice(-1)}));
 assert.equal(v3ScopedQuestionEvidence({...populated,formalAttemptLog:wrongIds},due,day).correct,0,
   'not-due alternatives cannot count as the pinned assignment');
});
test('blocked and malformed Year 9 Daily task cannot mint credit from replayed answers',()=>{
 const b=plan().find(t=>t.id==='y8-standard-b');
 const events=b.approvedQuestionIds.map(id=>entry(b,id,true));
 const state={...base(),daily:plan(),formalAttemptLog:events};
 assert.equal(v3ScopedQuestionEvidence(state,b,day).correct,10);
 for(const bad of [
   {...b,supplyBlocked:true},
   {...b,planDate:'2026-11-22'},
   {...b,approvedConceptByQuestion:{}},
   {...b,approvedQuestionIds:b.approvedQuestionIds.slice(0,9)},
   {...b,dailyV3:false},
   {...b,assignedYear:8}
 ]){
   const x=v3ScopedQuestionEvidence(state,bad,day);
   assert.equal(x.correct,0,'unsigned/scoped card must never earn credit');
   assert.equal(x.completed,false);
 }
});
test('missing formal:true cannot be treated as independently marked Language or Year 9 credit',()=>{
 const tasks=plan(),b=tasks.find(t=>t.id==='y8-standard-b');
 const l=tasks.find(t=>t.id==='languages-standard');
 const bEntry=entry(b,b.approvedQuestionIds[0],true,{formal:undefined});
 assert.equal(v3ScopedQuestionEvidence({...base(),daily:tasks,formalAttemptLog:[bEntry]},b,day).correct,0);
 for(const subject of ['latin','french']){
   const id=l.languageSplit[subject].approvedQuestionIds[0];
   const attempt={day,year:8,subject,topicId:l.languageSplit[subject].topicId,
     dailyTaskId:'languages-standard',questionId:id,correct:true};
   const info=languageEvidence({...base(),daily:tasks,formalAttemptLog:[attempt]},day);
   assert.equal(info[subject].correct,0,'missing formal answer marking must not count');
   assert.equal(info.completed,false);
 }
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
