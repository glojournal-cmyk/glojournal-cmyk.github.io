import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {year8SupplyGroups} from '../assets/year8-question-supply-manifest-20261111.js';
import {year8TopicSupply,preflightYear8Task,year8SupplyBySubject,forecastYear8Tasks}
 from '../assets/question-supply-preflight-20261111.js';
import {fillDailyLockedQuestions} from '../assets/daily-locked-question-fallback-20261021.js';

const root='content/topics';
const files=fs.readdirSync(root).filter(f=>/^(?:bio|chem|phys|fr|la)-y8.*\.json$/.test(f));
const eligible=q=>!!q.id&&q.status!=='disabled'&&q.status!=='preview'&&q.status!=='draft'&&
 q.preview!==true&&q.formal!==false&&!q._repair;
const active=d=>Number(d.year)===8&&!['disabled','preview'].includes(d.status);
const make=(d,subject='chemistry')=>({today:'2026-11-11',seenCorrect:{},daily:[],dailyLog:{},...d});

test('every active Year 8 JSON source matches the generated exact concept-ID inventory',()=>{
 const expected={};
 for(const f of files){
  const d=JSON.parse(fs.readFileSync(root+'/'+f,'utf8'));
  if(!active(d))continue;
  const map=new Map();
  for(const q of d.questions||[])if(eligible(q)){
   const key=String(q.conceptId||q.id);
   if(!map.has(key))map.set(key,[]);
   map.get(key).push(q.id);
  }
  if(map.size)expected[d.topicId]=[d.subject,[...map.values()]];
 }
 assert.deepEqual(Object.keys(year8SupplyGroups).sort(),Object.keys(expected).sort());
 for(const [topic,groups] of Object.entries(expected)){
  assert.deepEqual(year8SupplyGroups[topic],groups,topic+' source inventory drift');
  assert.ok(groups[1].every(ids=>new Set(ids).size===ids.length),topic+' duplicate question ID');
 }
});
test('saved source-correct variant exhausts the whole concept (no MC/typed inflation)',()=>{
 const topic='chem-y8-working-scientifically';
 const source=year8SupplyGroups[topic];
 assert.ok(source&&source[1].length>=20);
 const first=source[1][0],state=make({seenCorrect:{[first[0]]:1}});
 const result=year8TopicSupply(topic,state);
 assert.equal(result.total,source[1].length);
 assert.equal(result.mastered,1);
 assert.ok(!result.remaining.some(g=>g.some(id=>first.includes(id))));
 assert.equal(result.available,result.total-1);
});
test('20-slot shortage is flagged at assignment time, with original target untouched',()=>{
 const topic='chem-y8-working-scientifically',groups=year8SupplyGroups[topic][1];
 assert.ok(groups.length>=27);
 const seen=Object.fromEntries(groups.slice(0,groups.length-14).map(ids=>[ids[0],1]));
 const state=make({seenCorrect:seen});
 const before=JSON.stringify(state);
 const failed=preflightYear8Task(topic,state,20);
 assert.equal(failed.available,14);
 assert.equal(failed.canStart,false);
 assert.equal(failed.shortfall,6);
 assert.equal(failed.target,20);
 assert.equal(JSON.stringify(state),before);
});
test('same-day independently pinned work reserves capacity, own task excluded',()=>{
 const topic='chem-y8-working-scientifically';
 const state=make({daily:[{id:'y8-standard-a',planDate:'2026-11-11',assignedTopic:topic,
  assignedSubject:'chemistry',assignedYear:8,target:10,href:'/study/chemistry/practise'}]});
 const own=year8TopicSupply(topic,state,{countReservations:true,taskId:'y8-standard-a'});
 const other=year8TopicSupply(topic,state,{countReservations:true,taskId:'y8-standard-b'});
 assert.equal(other.available,Math.max(0,own.available-10));
});
test('historically verified correct IDs and true Recovery proofs count, wrong answers do not',()=>{
 const topic='chem-y8-working-scientifically',groups=year8SupplyGroups[topic][1];
 const task={id:'y8-mastery-a',planDate:'2026-11-09',assignedTopic:topic,
  assignedSubject:'chemistry',assignedYear:8,target:20,
  href:'/study/chemistry/practise?daily=1&locked=1&year=8&mode=mastery&task=y8-mastery-a&topic='+topic,
  verifiedCorrectAssignment:['2026-11-09','y8-mastery-a','chemistry',topic,8,'mastery',20].join('|'),
  verifiedCorrectIds:[groups[1][0]]};
 const state=make({dailyLog:{'2026-11-09':{tasks:[task]}},
  recoveryTaskByDay:{'2026-11-09':{'y8-mastery-a':{items:{[groups[2][0]]:true,[groups[3][0]]:false}}}}});
 assert.equal(year8TopicSupply(topic,state).mastered,2);
});
test('strict Mastery tail scan looks beyond 120 variants of already represented concepts',()=>{
 const q=(i,c)=>({id:'z'+i,conceptId:'unique-'+c,topicId:'bio-y8-test',formal:true,status:'enabled'});
 const many=Array.from({length:120},(_,i)=>q(i,Math.floor(i/8)));
 const tail=Array.from({length:15},(_,i)=>q(120+i,15+i));
 const all=[...many,...tail];
 const rank=(rows,subject,limit)=>rows.slice(0,limit);
 const result=fillDailyLockedQuestions(all.slice(0,20),all,{
   locked:true,mode:'mastery',size:20,topicId:'bio-y8-test',subject:'biology',requireDistinctConcepts:true
 },rank,rank);
 assert.equal(result.length,20);
 assert.equal(new Set(result.map(x=>x.conceptId)).size,20);
 assert.ok(result.some(x=>Number(x.id.slice(1))>=120));
});
test('7-day stress forecast never writes hypothetical credits into learner state',()=>{
 const topic='chem-y8-working-scientifically',state=make({});
 const before=JSON.stringify(state);
 const forecast=forecastYear8Tasks(state,mock=>[
  {id:'y8-mastery-a',assignedYear:8,assignedTopic:topic,target:20,
   href:'/study/chemistry/practise?mode=mastery'}
 ],7);
 assert.equal(forecast.length,7);
 assert.equal(forecast[0].warnings.length,0);
 assert.ok(forecast.slice(1).some(day=>day.warnings.some(w=>w.reason==='shortage')));
 assert.equal(JSON.stringify(state),before);
});
test('summary covers five actual subject sources and never claims unknown source ready',()=>{
 const rows=year8SupplyBySubject(make({}));
 for(const subject of ['biology','chemistry','physics','latin','french']){
  assert.ok(rows[subject]?.topics>0,subject);
  assert.ok(rows[subject].available>0,subject);
 }
 const unknown=preflightYear8Task('chem-y8-invented',make({}),20);
 assert.equal(unknown.known,false);
 assert.equal(unknown.canStart,false);
});
