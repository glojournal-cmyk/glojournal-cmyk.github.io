
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
 assert.equal(t.assignedTopic,'la-y8-stage-8-vocabulary');assert.equal(t.target,10);assert.equal(t.progress,0);
 assert.equal(JSON.stringify(x),before);
});
test('only nine remaining distinct concepts is not enough for 10/10',()=>{
 const concepts=[...new Set(qs(s1).map(q=>q.conceptId))];
 const seenCorrect=Object.fromEntries(qs(s1).filter(q=>concepts.slice(0,3).includes(q.conceptId)).map(q=>[q.id,1]));
 assert.equal(latinDailyUncreditedConcepts(s1,seenCorrect),9);
 assert.equal(latin(state({seenCorrect})).assignedTopic,'la-y8-stage-8-vocabulary');
});
test('depleted Stage 1 and 2 route to Stage 3, never award recycled answers',()=>{
 assert.equal(latin(state({seenCorrect:done([s1,s2])})).assignedTopic,'la-y8-stage-8-vocabulary');
});
test('unopened same-day Stage 1 may rotate; partially done task must remain unchanged',()=>{
 const seenCorrect=done([s1]);
 const empty=latin(state({daily:[old()],seenCorrect}));
 assert.equal(empty.assignedTopic,'la-y8-stage-8-vocabulary');assert.equal(empty.progress,0);
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

test('all twelve original Year 8 vocab stages rotate over twelve days even without stored history',()=>{
 const assigned=[];
 const epoch=Date.UTC(2026,9,19);
 for(let i=0;i<12;i++){
  const d=new Date(epoch+i*86400000).toISOString().slice(0,10);
  const row=latin(state({today:d}));
  assigned.push(row.assignedTopic);
  assert.equal(row.target,10,d+' must keep 10-answer target');
 }
 assert.equal(new Set(assigned).size,12,'do not trap all dates in Stage 1–4');
 assert.deepEqual(assigned,Array.from({length:12},(_,i)=>'la-y8-stage-'+(i+1)+'-vocabulary'));
});

test('recent Stage 1 exposure is avoided even when mastery/coverage is missing',()=>{
 const today='2026-10-31'; // calendar rotation would otherwise favour Stage 1
 const x=state({today,dailyLog:{'2026-10-30':{tasks:[{
   id:'latin-standard',assignedSubject:'latin',assignedYear:8,
   assignedTopic:s1,target:10,progress:0}]}}});
 assert.notEqual(latin(x).assignedTopic,s1);
});

test('a dormant repeated Stage 1 same-day card is rerouted, but verified answers stay pinned',()=>{
 const dailyLog={'2026-11-06':{tasks:[{
  id:'latin-standard',assignedTopic:s1,assignedSubject:'latin',assignedYear:8,
  progress:0,target:10}]}};
 const changed=latin(state({daily:[old()],dailyLog}));
 assert.notEqual(changed.assignedTopic,s1);
 const kept=latin(state({daily:[old(2)],dailyLog}));
 assert.equal(kept.assignedTopic,s1);
 assert.equal(kept.progress,2);
});

test('untaught Year 8 stages remain locked out of Standard rotation',()=>{
 const learning={'la-y8-stage-8-vocabulary':false};
 const x=state();
 const original=latin(x);
 const filtered=buildYear8DailyV2(x,catalog,learning)
   .find(t=>t.id==='latin-standard');
 assert.equal(original.assignedTopic,'la-y8-stage-8-vocabulary');
 assert.notEqual(filtered.assignedTopic,original.assignedTopic);
 assert.equal(filtered.assignedYear,8);
});

test('prior-correct alternate versions also make a Latin concept non-fresh',()=>{
 const q=qs(s1).find(item=>item.conceptId);
 const partial={[q.id]:1};
 assert.equal(latinDailyUncreditedConcepts(s1,partial),11,
  'one correct direction is enough to retire this concept from NEW Daily credit');
});

test('Stage 4–12 inventory is source-backed and independently answerable',()=>{
 for(let n=4;n<=12;n++){
  const stage='la-y8-stage-'+n+'-vocabulary';
  const count=new Set(qs(stage).map(q=>q.conceptId)).size;
  assert.equal(latinDailyUncreditedConcepts(stage,{}),count);
  assert.ok(count>=10,stage+' insufficient verified concepts');
 }
});
