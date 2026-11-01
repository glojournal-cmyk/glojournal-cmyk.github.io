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

test('iPad entrypoints must fetch refreshed Latin planner modules',()=>{
  const active=readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
  assert.ok(active.includes('year8-daily-v2-20261018.js?v=20261025-scorefix2&latinrotation=20261101a'));
  for(const route of ['index.html','404.html','study/index.html',
    'study/latin/index.html','study/latin/practise/index.html']){
    const html=readFileSync(new URL('../'+route,import.meta.url),'utf8');
    const old='mpverify=20261030-save-retry3-modeguard2';
    assert.equal(html.split(old).length-1,4,route+' existing four script refs intact');
    assert.equal(html.split(old+'&latinrotation=20261101a').length-1,4,
      route+' must fetch refreshed root');
  }
});
