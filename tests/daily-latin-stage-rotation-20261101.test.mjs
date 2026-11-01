import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';

const ids=[
  'la-y8-stage-1-vocabulary','la-y8-stage-2-vocabulary',
  'la-y8-stage-3-vocabulary','la-y8-core-verbs',
  'la-y8-nouns-and-dictionary-entries','la-y8-present-person-and-number'
];
const catalog=ids.map((topicId,i)=>({
  subject:'latin',year:8,topicId,title:'Stage '+(i+1),
  status:'enabled',enabled:35,formats:{typed_short:20}
}));
const get=(subject,year)=>subject==='latin'&&year===8?catalog:[];

function state(extra={}){
  return {today:'2026-11-01',year:8,daily:[],dailyLog:{},
    topicStats:{},formalAttemptLog:[],reviews:{},dailyVocabByDay:{},...extra};
}
const topic=(plan,id='latin-standard')=>plan.find(t=>t.id===id)?.assignedTopic;
const saved=(date,id,topicId,progress=0)=>({
  id,planDate:date,assignedSubject:'latin',assignedYear:8,
  assignedTopic:topicId,assignedLabel:topicId,
  href:'/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task='+id+'&topic='+topicId,
  progress,target:10
});
const dailyRow=(date,id,topicId)=>({tasks:[saved(date,id,topicId)]});

test('unseen Year 8 Latin starts at Stage 1 with a stable same-day assignment',()=>{
  const input=state();
  const plan=buildYear8DailyV2(input,get);
  assert.equal(topic(plan),ids[0]);
  assert.equal(topic(buildYear8DailyV2(input,get)),ids[0]);
  assert.equal(plan.find(t=>t.id==='latin-standard').target,10);
});

test('prior Stage 1 and Stage 2 assignments cause a different Latin Standard topic',()=>{
  const input=state({dailyLog:{
    '2026-10-31':dailyRow('2026-10-31','latin-standard',ids[0]),
    '2026-10-30':dailyRow('2026-10-30','latin-standard',ids[1])
  }});
  const before=JSON.stringify(input);
  assert.equal(topic(buildYear8DailyV2(input,get)),ids[2]);
  assert.equal(JSON.stringify(input),before,'planning cannot change saved student evidence');
});

test('a recent Mastery, Standard or review assignment also discourages repeated Latin topics',()=>{
  const input=state({dailyLog:{
    '2026-10-31':dailyRow('2026-10-31','y8-mastery-a',ids[0]),
    '2026-10-30':dailyRow('2026-10-30','due-review',ids[1])
  }});
  assert.equal(topic(buildYear8DailyV2(input,get)),ids[2]);
});

test('already-started same-day Latin assignment must not be reassigned or lose credit',()=>{
  const old=saved('2026-11-01','latin-standard',ids[0],4);
  const input=state({daily:[old],dailyLog:{
    '2026-10-31':dailyRow('2026-10-31','latin-standard',ids[0]),
    '2026-10-30':dailyRow('2026-10-30','latin-standard',ids[1])
  }});
  const row=buildYear8DailyV2(input,get).find(t=>t.id==='latin-standard');
  assert.equal(row.assignedTopic,ids[0]);
  assert.equal(row.progress,4);
  assert.equal(row.target,10);
});

test('an incomplete Stage 1 does not monopolise Standard after other stages have coverage',()=>{
  const input=state({topicStats:Object.fromEntries(ids.slice(1).map(id=>[id,{attempted:10}])),
    dailyLog:{'2026-10-31':dailyRow('2026-10-31','latin-standard',ids[0])}});
  assert.equal(topic(buildYear8DailyV2(input,get)),ids[1]);
});

test('mastery Day 2/7 due review can still return to Stage 1',()=>{
  const input=state({topicStats:{[ids[0]]:{masteryV2:{stage:'check2',due:'2026-11-01'}}}});
  const plan=buildYear8DailyV2(input,get);
  assert.equal(topic(plan,'due-review'),ids[0]);
  assert.equal(topic(plan,'latin-standard'),ids[1]);
});

test('six-day exposure window permits later re-review instead of permanently banning Stage 1',()=>{
  const input=state({dailyLog:{
    '2026-10-25':dailyRow('2026-10-25','latin-standard',ids[0])
  }});
  assert.equal(topic(buildYear8DailyV2(input,get)),ids[0]);
});


test('an empty weakness score is not evidence that Stage 1 or 2 is weak',()=>{
  const plan=buildYear8DailyV2(state(),get);
  const weak=plan.find(t=>t.id==='weakness-review');
  const due=plan.find(t=>t.id==='due-review');
  assert.match(weak.detail,/no recorded weak topic/);
  assert.match(due.detail,/nothing due today/);
  assert.notEqual(weak.assignedTopic,due.assignedTopic,
    'one unlearned topic should not be assigned to both review slots');
});

test('a genuine weak topic already reserved for Mastery is not assigned twice',()=>{
  const input=state({topicStats:{[ids[3]]:{attempted:12,correct:4,accuracy:1/3}}});
  const plan=buildYear8DailyV2(input,get);
  const weak=plan.find(t=>t.id==='weakness-review');
  assert.ok(plan.some(t=>t.id.startsWith('y8-mastery-')&&t.assignedTopic===ids[3]));
  assert.notEqual(weak.assignedTopic,ids[3]);
  assert.match(weak.detail,/Consolidation/);
});

test('no-due review rotates between subjects with real catalog choices',()=>{
  const allSubjects=['latin','french','biology','chemistry','physics'];
  const mixed=allSubjects.flatMap(subject=>Array.from({length:6},(_,i)=>({
    subject,year:8,topicId:subject+'-y8-topic-'+i,title:'Topic '+i,
    status:'enabled',enabled:35,formats:{typed_short:20}
  })));
  const getMixed=(subject,year)=>year===8?mixed.filter(t=>t.subject===subject):[];
  const past={};const dueSubjects=new Set(),weakSubjects=new Set();
  const date=d=>'2026-11-'+String(d).padStart(2,'0');
  for(let n=1;n<=7;n++){
    const d=date(n);
    const plan=buildYear8DailyV2(state({today:d,dailyLog:past}),getMixed);
    const due=plan.find(t=>t.id==='due-review'),weak=plan.find(t=>t.id==='weakness-review');
    assert.match(due.detail,/nothing due today/);
    assert.match(weak.detail,/no recorded weak topic/);
    dueSubjects.add(due.assignedSubject);
    weakSubjects.add(weak.assignedSubject);
    past[d]={tasks:plan.filter(t=>t.assignedTopic).map(t=>({
      id:t.id,assignedTopic:t.assignedTopic,
      assignedSubject:t.assignedSubject,assignedYear:t.assignedYear
    }))};
  }
  assert.ok(dueSubjects.size>=2,'Consolidation should not always be Latin');
  assert.ok(weakSubjects.size>=2,'Unknown-accuracy review should not always be Latin');
});

test('a partly answered weakness review keeps the same date and score',()=>{
  const old=saved('2026-11-01','weakness-review',ids[1],5);
  const plan=buildYear8DailyV2(state({daily:[old]}),get);
  const weak=plan.find(t=>t.id==='weakness-review');
  assert.equal(weak.assignedTopic,ids[1]);
  assert.equal(weak.progress,5);
});

test('iPad keeps single app module identity and refreshes only the Latin planner import',()=>{
  const active=readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
  const version='year8-daily-v2-20261018.js?v=20261025-scorefix2&latinrotation=20261101a';
  assert.ok(active.includes(version),'root must import updated Latin planner');
  const oldRoot='/assets/index-BLVOhKhN.js?v=20261026-bio-year9-savefix2&ux=20261013-corrections2&uxfix=20261022-priority-ux1&mpverify=20261030-save-retry3-modeguard2';
  for(const route of ['index.html','404.html','study/index.html',
    'study/latin/index.html','study/latin/practise/index.html']){
    const html=readFileSync(new URL('../'+route,import.meta.url),'utf8');
    assert.equal(html.split(oldRoot).length-1,4,
      route+' must retain one shared runtime URL across hydration and routes');
    assert.ok(!html.includes('&latinrotation=20261101a'),
      route+' must not fork root runtime version');
  }
  for(const module of ['study._subject.practise-D_PWgUd7.js',
    'quiz-session-rWAnuDVj.js','quiz-session-y8fix-20260920.js']){
    const js=readFileSync(new URL('../assets/'+module,import.meta.url),'utf8');
    assert.ok(js.includes(oldRoot.replace('/assets/','./')),
      module+' must import the same root URL');
  }
});
