
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';
import {latinDailyUncreditedConcepts} from '../assets/latin-daily-capacity-20261107.js';
const topics=JSON.parse(fs.readFileSync('content/catalog.json','utf8')).topics;
const catalog=(s,y)=>topics.filter(t=>t.subject===s&&Number(t.year)===y);
const s1='la-y8-stage-1-vocabulary',s2='la-y8-stage-2-vocabulary',s3='la-y8-stage-3-vocabulary';
const qs=id=>JSON.parse(fs.readFileSync('content/topics/'+id+'.json','utf8')).questions.filter(q=>q.id&&q.status!=='disabled'&&q.status!=='preview'&&q.formal!==false&&!q._repair);
const done=arr=>Object.fromEntries(arr.flatMap(t=>qs(t).map(q=>[q.id,1])));
const day='2026-11-07';
const old=(progress=0)=>({id:'latin-standard',planDate:day,assignedSubject:'latin',assignedYear:8,assignedTopic:s1,assignedLabel:'Stage 1 vocabulary',progress,target:10,href:'/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task=latin-standard&topic='+s1});
const state=(x={})=>({today:day,year:8,daily:[],dailyLog:{},topicStats:{},formalAttemptLog:[],reviews:{},dailyVocabByDay:{},seenCorrect:{},...x});
const latin=x=>buildYear8DailyV2(x,catalog).find(t=>t.id==='latin-standard');

test('source holds 72 Stage 1 variants over 12 concepts, not an empty file',()=>{
 assert.equal(qs(s1).length,72);assert.equal(latinDailyUncreditedConcepts(s1,{}),12);
 assert.equal(latinDailyUncreditedConcepts(s1,done([s1])),0);
 assert.equal(latinDailyUncreditedConcepts('unknown',{}),null);
});
test('old correctly answered Stage 1 rotates to Stage 2 without changing saved state',()=>{
 const x=state({seenCorrect:done([s1])}),before=JSON.stringify(x),t=latin(x);
 assert.equal(t.assignedTopic,s2);assert.equal(t.target,10);assert.equal(t.progress,0);
 assert.equal(JSON.stringify(x),before);
});
test('only nine remaining distinct concepts is not enough for 10/10',()=>{
 const concepts=[...new Set(qs(s1).map(q=>q.conceptId))];
 const seenCorrect=Object.fromEntries(qs(s1).filter(q=>concepts.slice(0,3).includes(q.conceptId)).map(q=>[q.id,1]));
 assert.equal(latinDailyUncreditedConcepts(s1,seenCorrect),9);
 assert.equal(latin(state({seenCorrect})).assignedTopic,s2);
});
test('depleted Stage 1 and 2 route to Stage 3, never award recycled answers',()=>{
 assert.equal(latin(state({seenCorrect:done([s1,s2])})).assignedTopic,s3);
});
test('unopened same-day Stage 1 may rotate; partially done task must remain unchanged',()=>{
 const seenCorrect=done([s1]);
 const empty=latin(state({daily:[old()],seenCorrect}));
 assert.equal(empty.assignedTopic,s2);assert.equal(empty.progress,0);
 const started=latin(state({daily:[old(3)],seenCorrect}));
 assert.equal(started.assignedTopic,s1);assert.equal(started.progress,3);
});
test('even a wrong, marked same-day answer prevents unsafe reassignment',()=>{
 const x=state({daily:[old()],seenCorrect:done([s1]),formalAttemptLog:[{
 day,dailyTaskId:'latin-standard',subject:'latin',year:8,topicId:s1,
 questionId:qs(s1)[0].id,correct:false,formal:true,repair:false,mode:'standard'}]});
 assert.equal(latin(x).assignedTopic,s1);
});
test('single root JS identity, only versioned child planner',()=>{
 const root=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
 assert.ok(root.includes('latinrotation=20261101a&latincapacity=20261107a'));
 for(const p of ['index.html','404.html','study/latin/practise/index.html'])
  assert.ok(!fs.readFileSync(p,'utf8').includes('latincapacity=20261107a'));
});
