import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';
import {reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
import {replayDailyAnswerCredit} from '../assets/daily-answer-replay-20261021.js';

const day='2026-10-24';
const subjects=['latin','french','biology','chemistry','physics'];
const catalog=subjects.flatMap(s=>Array.from({length:3},(_,i)=>({
  subject:s,year:8,topicId:s+'-y8-t'+i,title:'Topic '+i,status:'enabled',enabled:45,
}))).concat(subjects.map(s=>({
  subject:s,year:9,topicId:s+'-y9-new',title:'New topic',status:'enabled',enabled:40,
})));
const get=(s,y)=>catalog.filter(t=>t.subject===s&&t.year===y);
const state=()=>({today:day,year:9,daily:[],dailyLog:{},
  topicStats:{},formalAttemptLog:[],dailyVocabByDay:{},reviews:{}});
const find=(rows,id)=>rows.find(t=>t.id===id);
const ev=(task,questionId,correct,at)=>({
  day,questionId,correct,at,attemptId:'marked-'+at,formal:true,repair:false,
  subject:task.assignedSubject,topicId:task.assignedTopic,dailyTaskId:task.id,
  mode:'standard'
});

test('Oct 24 onward: a wrong formal Standard answer is recorded but earns zero Home credits',()=>{
  const start=state(),plan=buildYear8DailyV2(start,get);
  const task=find(plan,'y8-standard-a');
  assert.ok(task?.assignedTopic);
  const attempts=[ev(task,'q0',false,'0'),ev(task,'q1',true,'1')];
  const previous=plan.map(t=>t.id===task.id?{...t,progress:2}:t);
  const next=buildYear8DailyV2({...start,daily:previous,formalAttemptLog:attempts},get);
  assert.equal(find(next,task.id).progress,1,'one correct, one wrong must display 1/10');
  assert.equal(find(next,task.id).correctOnlyEvidence,true);
  assert.equal(attempts.length,2,'retain both learning events');
  const replay=replayDailyAnswerCredit({...start,daily:plan,formalAttemptLog:attempts});
  assert.equal(find(replay.daily,task.id).progress,1,'replay must not credit incorrect');
  const questions=attempts.map(e=>({id:e.questionId,topicId:task.assignedTopic,formal:true}));
  const result=reconcileDailySession({...start,daily:plan},{
    day,taskId:task.id,subject:task.assignedSubject,year:task.assignedYear,
    mode:'standard',questions,answers:attempts});
  assert.equal(result.progress,1,'quiz receipt must count correct answers only');
});

test('Oct 24 onward: a failed 20-question Mastery set cannot claim 20/20',()=>{
  const start=state(),plan=buildYear8DailyV2(start,get),task=find(plan,'y8-mastery-a');
  assert.ok(task?.assignedTopic);
  const questions=Array.from({length:20},(_,i)=>({id:'q'+i,topicId:task.assignedTopic,formal:true}));
  const receipt={
    day,taskId:task.id,subject:task.assignedSubject,year:task.assignedYear,
    mode:'mastery',questions,
    answers:questions.map((q,i)=>({questionId:q.id,correct:i<17,formal:true}))
  };
  const result=reconcileDailySession({...start,daily:plan},receipt);
  assert.equal(result.progress,17);
  assert.equal(find(result.daily,task.id).progress,17);
  assert.equal(result.changed,true);
  assert.equal(reconcileDailySession({...start,daily:plan},{
    ...receipt,answers:receipt.answers.map(a=>({...a,correct:false}))
  }).changed,false,'20 wrong answers must never earn progress');
});

test('Current-day dated record may correct old inflated attempts without erasing prior dates',()=>{
  const start=state(),plan=buildYear8DailyV2(start,get),task=find(plan,'y8-standard-a');
  const events=[ev(task,'q0',false,'0'),ev(task,'q1',true,'1')];
  const previous=plan.map(t=>t.id===task.id?{...t,progress:2}:t);
  const corrected=buildYear8DailyV2({...start,daily:previous,formalAttemptLog:events},get);
  const oldLog={date:day,done:0,total:plan.length,complete:false,
    tasks:plan.map(t=>({...t,progress:t.id===task.id?2:0}))};
  const js=readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
  const a=js.indexOf('function compactDailyTasks('),b=js.indexOf('function sealDailyLog(',a);
  assert.ok(a>0&&b>a);
  const write=new Function('mergeDailyRecordRow','todayKey',
    js.slice(a,b)+';return writeDailyLog;')((old,row)=>({
      ...old,tasks:old.tasks.map(t=>{
        const incoming=row.tasks.find(x=>x.id===t.id);
        return incoming?{...t,progress:Math.max(t.progress,incoming.progress)}:t;
      })
    }),()=>day);
  const prior={'2026-10-23':{done:8,total:10,complete:false},[day]:oldLog};
  const next=write(prior,day,corrected);
  assert.equal(next[day].tasks.find(t=>t.id===task.id).progress,1);
  assert.equal(next['2026-10-23'],prior['2026-10-23']);
});
