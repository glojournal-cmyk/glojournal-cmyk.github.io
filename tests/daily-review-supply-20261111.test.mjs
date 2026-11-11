import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {year8SupplyGroups} from '../assets/year8-question-supply-manifest-20261111.js';
import {year8TopicSupply,preflightYear8Task,year8ReviewEligibleQuestionIds,year8ReviewInterval}
 from '../assets/question-supply-preflight-20261111.js';
import {fillDailyLockedQuestions} from '../assets/daily-locked-question-fallback-20261021.js';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';

const id='chem-y8-working-scientifically';
const groups=year8SupplyGroups[id][1],subject='chemistry';
const state=(extra={})=>({
 today:'2026-11-11',year:8,daily:[],dailyLog:{},topicStats:{},
 formalAttemptLog:[],seenCorrect:{},reviews:{},dailyVocabByDay:{},...extra
});
const finished=(n,day='2026-11-01')=>{
 const ids=groups.slice(0,n).map(g=>g[0]);
 return state({
  seenCorrect:Object.fromEntries(ids.map(id=>[id,1])),
  formalAttemptLog:ids.map(questionId=>({day,questionId,correct:true,formal:true,year:8,subject,topicId:id}))
 });
};
const catalog=JSON.parse(fs.readFileSync('content/catalog.json','utf8')).topics;
const getCatalog=(subject,year)=>catalog.filter(t=>t.subject===subject&&Number(t.year)===year);
const plan=x=>buildYear8DailyV2(x,getCatalog);

test('fresh-only assessment excludes an already-correct concept even after seven days',()=>{
 const x=finished(12),fresh=preflightYear8Task(id,x,20);
 assert.equal(fresh.available,groups.length-12);
 assert.equal(fresh.canStart,false);
 assert.equal(fresh.shortfall,20-(groups.length-12));
});

test('7-day Weakness review permits due concepts but excludes same-day and day-6 success',()=>{
 for(const [date,expected] of [['2026-11-11',groups.length-12],['2026-11-06',groups.length-12],['2026-11-04',groups.length]]){
  const x=finished(12,date),r=year8TopicSupply(id,x,{reviewAfterDays:7});
  assert.equal(r.available,expected,date);
  const allowed=year8ReviewEligibleQuestionIds(id,x,{reviewAfterDays:7});
  assert.equal(allowed.has(groups[0][0]),date==='2026-11-04');
  assert.equal(allowed.has(groups[12][0]),true);
 }
});

test('2-day scheduled Due review allows due concepts but not yesterday successes',()=>{
 const recent=finished(12,'2026-11-10'),mature=finished(12,'2026-11-09');
 assert.equal(year8TopicSupply(id,recent,{reviewAfterDays:2}).available,groups.length-12);
 assert.equal(year8TopicSupply(id,mature,{reviewAfterDays:2}).available,groups.length);
});


test('Day 2 and Day 7 scheduled recalls have different and shared due rules',()=>{
 const old=state({topicStats:{[id]:{masteryV2:{stage:'check2',due:'2026-11-10'}}}});
 assert.equal(year8ReviewInterval('due-review',id,old),2);
 old.topicStats[id].masteryV2={stage:'check7',due:'2026-11-11'};
 assert.equal(year8ReviewInterval('due-review',id,old),7);
 old.topicStats[id].masteryV2={stage:'check2',due:'2026-11-13'};
 assert.equal(year8ReviewInterval('due-review',id,old),7);
 assert.equal(year8ReviewInterval('weakness-review',id,old),7);
 const general=state({reviews:{x:{topicId:id,due:'2026-11-10'}}});
 assert.equal(year8ReviewInterval('due-review',id,general),2);
});

test('legacy undated credit is not treated as due automatically',()=>{
 const x=state({seenCorrect:{[groups[0][0]]:1}});
 const allowed=year8ReviewEligibleQuestionIds(id,x,{reviewAfterDays:7});
 assert.equal(allowed.has(groups[0][0]),false);
 assert.equal(allowed.has(groups[1][0]),true);
});

test('reserve same-day capacity separately and preserve original learner state',()=>{
 const x=finished(12,'2026-11-01');
 x.daily=[{id:'y8-standard-a',planDate:x.today,assignedTopic:id,assignedSubject:subject,assignedYear:8,target:10}];
 const before=JSON.stringify(x);
 const r=preflightYear8Task(id,x,20,{taskId:'due-review',reviewAfterDays:2,countReservations:true});
 assert.equal(r.available,groups.length-10);
 assert.equal(JSON.stringify(x),before);
});

test('review fallback uses distinct concepts, only date-eligible original IDs',()=>{
 const x=finished(12,'2026-11-10');
 const allowed=year8ReviewEligibleQuestionIds(id,x,{reviewAfterDays:7});
 const loaded=JSON.parse(fs.readFileSync('content/topics/'+id+'.json','utf8')).questions
   .filter(q=>q.id&&q.status!=='disabled'&&q.status!=='preview'&&q.formal!==false&&!q._repair);
 const ranked=(qs,sub,n)=>qs.slice(0,n);
 const result=fillDailyLockedQuestions(loaded.slice(0,12),loaded,
  {locked:true,mode:'weak',size:10,topicId:id,subject,
   requireDistinctConcepts:true,allowedIds:allowed},ranked,ranked);
 assert.equal(result.length,10);
 assert.equal(new Set(result.map(q=>q.conceptId||q.id)).size,10);
 assert.ok(result.every(q=>allowed.has(q.id)));
 assert.ok(result.every(q=>!groups.slice(0,12).some(g=>g.includes(q.id))));
});

test('completely exhausted Year 8 banks do not cause unverified topic fallback',()=>{
 const ids=Object.values(year8SupplyGroups).flatMap(([,gs])=>gs.map(g=>g[0]));
 const x=state({seenCorrect:Object.fromEntries(ids.map(q=>[q,1]))});
 const tasks=plan(x),byId=Object.fromEntries(tasks.map(t=>[t.id,t]));
 for(const taskId of ['latin-standard','y8-standard-a','y8-standard-b',
   'y8-mastery-a','y8-mastery-b','weakness-review','due-review']){
  assert.equal(byId[taskId]?.supplyBlocked,true,taskId+' should be blocked rather than present an empty quiz');
  assert.equal(byId[taskId]?.progress,0);
  assert.notEqual(byId[taskId]?.done,true);
 }
});

test('already-started locked Daily task remains pinned rather than silently reassigned',()=>{
 const x=finished(12,'2026-11-10');
 const saved={id:'weakness-review',planDate:x.today,assignedTopic:id,assignedSubject:subject,
  assignedYear:8,assignedLabel:'Working scientifically',target:10,progress:2,
  href:'/study/chemistry/practise?daily=1&locked=1&year=8&mode=weak&task=weakness-review&topic='+id};
 x.daily=[saved];
 const task=plan(x).find(t=>t.id==='weakness-review');
 assert.equal(task?.assignedTopic,id);
 assert.ok(task?.progress>=2);
});

test('live Practice routes apply exactly the same spaced-repetition evidence gate',()=>{
 for(const path of ['assets/study._subject.practise-y8fix-20260920.js',
  'assets/study._subject.practise-D_PWgUd7.js']){
  const src=fs.readFileSync(path,'utf8');
  assert.match(src,/year8ReviewEligibleQuestionIds/);
  assert.match(src,/allowedIds:reviewEligibleIds/);
  assert.match(src,/reviewAfterDays:year8ReviewInterval\(canonicalTask,pinnedTopic,s\.getState\(\),R\)/);
  assert.match(src,/!dailyParams.has\('recover'\)/);
  assert.match(src,/reviewEligibleIds\.has\(String\(q\?\.id\)\)/);
 }
});
