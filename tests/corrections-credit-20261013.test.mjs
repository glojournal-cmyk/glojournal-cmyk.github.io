import {mergeDailyRecordRow} from '../assets/daily-record-integrity-20261018.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mistakeReviewTask} from '../assets/mistake-review-plan-20261003.js';
const day='2026-10-13',topic='fr-y8-s01-basics';
const planned={id:'mistake-review',planDate:day,reviewSubject:'french',reviewYear:8,
 reviewQuestionIds:['q1','q2'],reviewTopicIds:[topic],reviewCompletedIds:[],target:2,progress:0,xp:15};
const wrong={subject:'french',topicId:topic,wrong:true,lastWrong:'2026-10-12'};
const evidence=(questionId,extra={})=>({questionId,subject:'french',year:8,day,correct:true,repair:false,...extra});
const state=(extra={})=>({today:day,daily:[planned],reviews:{q1:wrong,q2:wrong},...extra});
const available=(s,t)=>s==='french'&&t===topic;
test('saved correct answer evidence restores missed Corrections credit after reload',()=>{
 const result=mistakeReviewTask(state({reviews:{},formalAttemptLog:[evidence('q1'),evidence('q2')]}),{},available);
 assert.equal(result.progress,2);
 assert.deepEqual(result.reviewCompletedIds,['q1','q2']);
});
test('old assignment missing topic metadata must not change halfway through marking',()=>{
 const old={...planned};delete old.reviewTopicIds;
 const result=mistakeReviewTask(state({daily:[old],reviews:{q1:{...wrong,wrong:false,last:day},q2:wrong}}),{},available);
 assert.deepEqual(result.reviewQuestionIds,['q1','q2']);
 assert.equal(result.target,2);assert.equal(result.progress,1);
});
test('completed corrections stay complete if a topic later becomes unavailable',()=>{
 const old={...planned,reviewCompletedIds:['q1','q2'],progress:2};
 const result=mistakeReviewTask(state({daily:[old]}),{},()=>false);
 assert.equal(result.progress,2);assert.equal(result.target,2);assert.equal(result.xp,15);
});
test('only assigned correct answers on the same London day count once',()=>{
 const log=[evidence('q1'),evidence('q1'),evidence('other'),evidence('q2',{correct:false}),
 evidence('q2',{repair:true}),evidence('q2',{day:'2026-10-12'}),evidence('q2',{recoveryFor:'2026-10-12'})];
 const result=mistakeReviewTask(state({formalAttemptLog:log}),{},available);
 assert.equal(result.progress,1);assert.deepEqual(result.reviewCompletedIds,['q1']);
});
test('assessment mistakes require assessment credits, not ordinary practice evidence',()=>{
 const old={...planned,reviewSource:'assessment'};
 assert.equal(mistakeReviewTask(state({daily:[old],formalAttemptLog:[evidence('q1'),evidence('q2')]}),{}).progress,0);
});
test('non-formal games cannot credit Corrections, but dedicated vocabulary corrections can',()=>{
 const log=[evidence('q1',{formal:false}),evidence('q2',{formal:false,dailyTaskId:'mistake-review'})];
 const result=mistakeReviewTask(state({formalAttemptLog:log}),{},available);
 assert.deepEqual(result.reviewCompletedIds,['q2']);
});
test('restored credit survives JSON save and updates the real ten-task daily record',()=>{
 const source=awaitSource();
 const begin=source.indexOf('function compactDailyTasks('),end=source.indexOf('function sealDailyLog(',begin);
 const {writeDailyLog}=new Function('mergeDailyRecordRow',source.slice(begin,end)+';return {writeDailyLog};')(mergeDailyRecordRow);
 const saved=JSON.parse(JSON.stringify(state({reviews:{},formalAttemptLog:[evidence('q1'),evidence('q2')]})));
 const result=mistakeReviewTask(saved,{},available);
 const daily=[result,...Array.from({length:9},(_,i)=>({id:'other-'+i,target:1,progress:0}))];
 const history=writeDailyLog({},day,daily);
 assert.equal(history[day].total,10);assert.equal(history[day].done,1);
 assert.equal(history[day].tasks.find(t=>t.id==='mistake-review').done,true);
 assert.equal(mistakeReviewTask({...saved,daily:JSON.parse(JSON.stringify(daily))},{},available).progress,2);
});
import {readFileSync} from 'node:fs';
function awaitSource(){return readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');}
for(const filename of ['study._subject.practise-y8fix-20260920.js']){
 const code=readFileSync(new URL('../assets/'+filename,import.meta.url),'utf8');
 const signature=new Function(code.slice(code.indexOf('function mistakeBankSignature('),code.indexOf('function resolveDailyAssignment('))+';return mistakeBankSignature;')();
 const start=code.indexOf('(0,w.useEffect)(()=>{\n if(E!==`mistakes`');
 const end=code.indexOf('},[E,dailyLocked,canonicalTask',start);
 const effect=new Function('env','with(env){'+code.slice(start+'(0,w.useEffect)(()=>{'.length,end)+'}');
 const render=(loadedReview,z)=>{
  let current=state(),writes=[];
  effect({E:'mistakes',dailyLocked:true,canonicalTask:'mistake-review',V:false,loadedReview,I:[{topicId:topic}],assignment:planned,A:current.reviews,R:day,e:'french',N:8,z,
   mistakeBankSignature:signature,s:{getState:()=>current,setState:patch=>{writes.push(patch);current={...current,...patch}}}});
  return writes;
 };
 test(filename+': catalogue becoming ready cannot excuse questions before their bank loads',()=>{
  assert.deepEqual(render(signature('french',8,'mistakes',[]),[]),[]);
 });
 test(filename+': a previous subject/mode bank cannot reassign current Corrections',()=>{
  assert.deepEqual(render(signature('french',8,'standard',[{topicId:topic}]),[]),[]);
 });
 test(filename+': successfully loaded matching bank preserves every assigned question',()=>{
  assert.deepEqual(render(signature('french',8,'mistakes',[{topicId:topic}]),planned.reviewQuestionIds.map(id=>({id,topicId:topic}))),[]);
 });
 test(filename+': genuinely missing questions are still excluded after the exact bank has loaded',()=>{
  const writes=render(signature('french',8,'mistakes',[{topicId:topic}]),[]);
  assert.deepEqual(writes[0].reviewUnavailableByDay[day],['q1','q2']);
 });
}
