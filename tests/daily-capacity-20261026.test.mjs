import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {dailyTopicPool,compatibleDailyTopic} from '../assets/daily-capacity-scope-20261026.js';
import {dailySupplement,extendDailyCapacity} from '../assets/daily-supplement-20261026.js';
import {fillDailyLockedQuestions} from '../assets/daily-locked-question-fallback-20261021.js';
import {reconcileDailySession} from '../assets/daily-session-credit-20261021.js';
const catalog=JSON.parse(fs.readFileSync('content/catalog.json'));
const school=JSON.parse(gunzipSync(Buffer.from(Array.from({length:12},(_,i)=>fs.readFileSync(`content/school-update-20260919/runtime-${String(i).padStart(2,'0')}.txt`,'utf8')).join(''),'base64')));
const delta=JSON.parse(fs.readFileSync('content/school-update-20260926/delta.json'));
const banks=new Map(catalog.topics.map(t=>{try{return[t.topicId,JSON.parse(fs.readFileSync(`content/topics/${t.topicId}.json`)).questions||[]]}catch{return[t.topicId,[]]}}));
for(const t of school.t)banks.set(t.id,t.q.map(q=>({id:q.i,topicId:t.id,subject:t.s,year:t.y,format:q.f,prompt:q.p,answer:q.a,stimulus:q.s||{},status:'enabled'})));
for(const t of delta.topics||[])banks.set(t.topicId,t.questions||[]);
const valid=q=>q?.id&&q.prompt&&q.answer&&q.formal!==false&&!q._repair&&!['disabled','preview'].includes(q.status);
for(const [id,qs] of banks)banks.set(id,extendDailyCapacity(qs).filter(valid));
const choose=(pool,topic,size=20,correctIds=[])=>fillDailyLockedQuestions([],pool,{locked:true,mode:'mastery',topicId:topic,size,correctIds},x=>x,(x,m,n)=>x.slice(0,n));
const report=[];
test('Every enabled five-subject topic has a real compatible pool for a 20-question assignment',()=>{
 for(const t of catalog.topics.filter(t=>['latin','french','biology','chemistry','physics'].includes(t.subject)&&t.status==='enabled'&&t.enabled>0)){
  const scope=dailyTopicPool(catalog.topics.filter(x=>x.subject===t.subject&&x.year===t.year),t.topicId);
  const pool=scope.flatMap(x=>banks.get(x.topicId)||[]);
  const selected=choose(pool,t.topicId);
  report.push({topic:t.topicId,own:(banks.get(t.topicId)||[]).length,compatibleUnique:new Set(pool.map(q=>q.id)).size,selected:selected.length});
  assert.equal(selected.length,20,t.topicId);
  assert.equal(new Set(selected.map(q=>q.id)).size,20);
 }
});
test('Latin depleted topic can finish its remaining two slots with unused related questions',()=>{
 const id='la-y8-perfect-patterns',own=banks.get(id),pool=dailyTopicPool(catalog.topics,id).flatMap(t=>banks.get(t.topicId)||[]);
 const selected=choose(pool,id,2,new Set(own.map(q=>q.id)));
 assert.equal(selected.length,2);assert.ok(selected.every(q=>!own.some(x=>x.id===q.id)));
 assert.ok(selected.every(q=>compatibleDailyTopic(id,q.topicId)));
});
test('Cross-year, cross-subject, disabled and preview questions cannot fill a shortage',()=>{
 const topic='la-y8-perfect-patterns';const rows=[{id:'other',topicId:'phys-y9-p1'},{id:'next-year',topicId:'la-y9-s01-regular-verbs'},{id:'disabled',topicId:topic,status:'disabled'},{id:'preview',topicId:topic,status:'preview'}];assert.equal(choose(rows,topic).length,0);
});
test('A related Latin answer credits only its assigned day and task, exactly once',()=>{
 const day='2026-10-26',taskId='latin-standard',topic='la-y8-perfect-patterns';
 const task={id:taskId,planDate:day,assignedSubject:'latin',assignedYear:8,assignedTopic:topic,target:10,progress:8,href:`/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task=${taskId}&topic=${topic}`};
 const questions=(banks.get('la-y8-perfect-cues')||[]).slice(0,2);
 const receipt={day,taskId,subject:'latin',year:8,mode:'standard',questions,answers:questions.map(q=>({questionId:q.id,correct:true,formal:true}))};
 const state={today:day,daily:[task],dailyLog:{}};
 const first=reconcileDailySession(state,receipt);assert.equal(first.progress,10);assert.equal(first.daily[0].target,10);
 const again=reconcileDailySession({...state,daily:first.daily},receipt);assert.equal(again.progress,10);
 assert.equal(reconcileDailySession(state,{...receipt,day:'2026-10-25'}).changed,false);
});
test('Exhaustion never mutates target or marks incomplete tasks done',()=>{
 for(const name of ['D_PWgUd7','y8fix-20260920']){
 const source=fs.readFileSync(`assets/study._subject.practise-${name}.js`,'utf8');
 assert.ok(!source.includes('target:progress,progress,done:true'));
 assert.ok(source.includes('dailyTopicPool(I,pinnedTopic)'));
 }
});
test('50 original supplements have stable unique IDs and usable answer keys',()=>{
 assert.equal(dailySupplement.length,50);assert.equal(new Set(dailySupplement.map(q=>q.id)).size,50);
 for(const q of dailySupplement){assert.ok(valid(q));assert.ok(q.answer.accepted.length);assert.equal(q.year,9);}
});
test.after(()=>{if(process.env.CAPACITY_REPORT)fs.writeFileSync(process.env.CAPACITY_REPORT,JSON.stringify(report,null,2));});
