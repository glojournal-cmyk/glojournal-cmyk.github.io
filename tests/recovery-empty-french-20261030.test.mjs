import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {selectDiverseRecoveryQuestions} from '../assets/recovery-question-diversity-20261025.js';

const q=(id,topic,prompt=id)=>({id,topicId:topic,prompt,formal:true,format:'typed_exact'});
const sample=()=>({
 today:'2026-10-30',seenCorrect:{answered:1},reviews:{},
 dailyLog:{'2026-10-29':{tasks:[
  {id:'y8-standard-a',assignedSubject:'french',assignedTopic:'assigned',assignedYear:8,target:5,progress:0},
  {id:'y8-standard-b',assignedSubject:'french',assignedTopic:'assigned',assignedYear:8,target:5,progress:0}
 ]}}
});
const option=(state,mode='standard')=>({
 state,date:'2026-10-29',taskId:'y8-standard-a',subject:'french',
 year:8,topicId:'assigned',size:5,day:'2026-10-30',mode
});
const rank=(items,_subject,n)=>items.slice(0,n);
const progression=items=>items;
const pick=(rows,state,mode)=>selectDiverseRecoveryQuestions([],rows,option(state,mode),rank,progression).map(x=>x.id);

test('exhausted assigned French bank draws genuinely unused same-year fallback',()=>{
 const state=sample();
 const got=pick([q('answered','assigned'),q('new1','other'),q('new2','other')],state);
 assert.deepEqual(got,['new1','new2']);
 assert.equal(state.dailyLog['2026-10-29'].tasks[0].progress,0,'selection never rewrites saved progress');
});
test('use assigned-topic questions first; fallback only fills shortage',()=>{
 const got=pick([q('assigned1','assigned'),q('assigned2','assigned'),q('new1','other')],sample());
 assert.deepEqual(got,['assigned1','assigned2','new1']);
});
test('past correct answers, duplicate prompts and other Recovery card are excluded',()=>{
 const state=sample();
 state.formalAttemptLog=[{questionId:'otherTask',subject:'french',dailyTaskId:'y8-standard-b',recoveryFor:'2026-10-29',correct:false,formal:true}];
 const got=pick([q('answered','assigned'),q('otherTask','other'),q('new1','other','same prompt'),q('new2','other','same prompt')],state);
 assert.deepEqual(got,['new1']);
});
test('ordinary practice and review tasks do not silently cross assigned topics',()=>{
 const rows=[q('answered','assigned'),q('new1','other')];
 assert.deepEqual(pick(rows,sample(),'due'),[]);
 assert.deepEqual(selectDiverseRecoveryQuestions([],rows,
  {...option(sample()),date:null},rank,progression),[]);
});
test('the Recovery screen loads Year 8 alternatives and never auto-caps a missed-day task',()=>{
 const script=fs.readFileSync(new URL('../assets/study._subject.practise-y8fix-20260920.js',import.meta.url),'utf8');
 assert.match(script,/fallbackIds=new Set\(/);
 assert.match(script,/assignment&&N===8&&e==='french'/);
 assert.match(script,/dailyQuestionShortage/);
 assert.doesNotMatch(script,/target:progress,progress,done:true,cappedBecauseQuestionBankExhausted:true/);
 assert.match(script,/Your saved answers and original target are preserved/);
 assert.match(script,/the task is not automatically marked complete/);
 assert.match(script,/recoveryTaskProof/);
});

test('the runtime router, preload map and static French/Latin pages all use the same recovered module',()=>{
 const core=fs.readFileSync(new URL('../assets/index-BLVOhKhN.core.js',import.meta.url),'utf8');
 const french=fs.readFileSync(new URL('../study/french/practise/index.html',import.meta.url),'utf8');
 const latin=fs.readFileSync(new URL('../study/latin/practise/index.html',import.meta.url),'utf8');
 const modulePath='study._subject.practise-y8fix-20260920.js?v=20261026-bio-year9-savefix2&ux=20261013-corrections2&uxfix=20261022-priority-ux1&vocabcap=20261023-repair10-v1&recoveryfix=20261030-empty1';
 assert.ok(core.includes('./'+modulePath),'router actually loads the fixed bundle');
 assert.ok(core.includes('assets/study._subject.practise-D_PWgUd7.js?v=20261026-bio-year9-savefix2'),'shared science preload remains available');
 for(const [subject,page] of [['french',french],['latin',latin]]){
   assert.equal(page.split('/assets/'+modulePath).length-1,2,subject+' preload and SSR manifest must match router');
 }
 // Science's longstanding dependency-map entry is not the dynamic route import.
});
test('dated Recovery cannot accidentally adopt the current date unfinished retry receipt',()=>{
 const script=fs.readFileSync(new URL('../assets/study._subject.practise-y8fix-20260920.js',import.meta.url),'utf8');
 assert.match(script,/state:dailyParams\.has\('recover'\)\?null:s\.getState\(\),receipt:retryData/);
});

test('legacy missed-day assignments without subject metadata still resolve from the saved route',()=>{
 const script=fs.readFileSync(new URL('../assets/study._subject.practise-y8fix-20260920.js',import.meta.url),'utf8');
 const start=script.indexOf('function resolveDailyAssignment(');
 const end=script.indexOf('function E()',start);
 assert.ok(start>0&&end>start,'assignment resolver is available');
 const resolve=Function('URL','URLSearchParams',script.slice(start,end)+';return resolveDailyAssignment')(URL,URLSearchParams);
 const tasks=[{id:'y8-standard-a',href:'/study/french/practise?daily=1&locked=1&year=8&mode=standard&task=y8-standard-a',target:5}];
 const params=new URLSearchParams('daily=1&locked=1&task=y8-standard-a&recover=2026-10-29');
 assert.equal(resolve('french',params,[],{'2026-10-29':{tasks}}),tasks[0]);
 assert.equal(resolve('latin',params,[],{'2026-10-29':{tasks}}),null);
});

test('two French Recovery cards reserve separate windows with real size-limited ranking',()=>{
 const state=sample();
 const rows=Array.from({length:35},(_,i)=>q('q'+i,'assigned'));
 const a=selectDiverseRecoveryQuestions(rows,rows,{...option(state),size:5},rank,progression);
 const b=selectDiverseRecoveryQuestions(rows,rows,{...option(state),taskId:'y8-standard-b',size:5},rank,progression);
 assert.deepEqual(a.map(x=>x.id),['q0','q1','q2','q3','q4']);
 assert.deepEqual(b.map(x=>x.id),['q5','q6','q7','q8','q9']);
 assert.equal(new Set([...a,...b].map(x=>x.id)).size,10);
});

test('404 fallback and French Recovery route share the same app singleton as Home',()=>{
 const home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const fallback=fs.readFileSync(new URL('../404.html',import.meta.url),'utf8');
 const french=fs.readFileSync(new URL('../study/french/practise/index.html',import.meta.url),'utf8');
 const latin=fs.readFileSync(new URL('../study/latin/practise/index.html',import.meta.url),'utf8');
 const canonical=home.match(/\/assets\/index-BLVOhKhN\.js\?v=[^"'<>\s]+/)?.[0];
 assert.ok(canonical,'Home has one canonical app entrypoint');
 assert.equal(fallback,home,'404 may not initialize a different learner state');
 for(const [name,page] of [['french',french],['latin',latin]]){
   assert.ok(page.includes(canonical),name+' must use Home app singleton');
   assert.equal([...page.matchAll(/\/assets\/index-BLVOhKhN\.js\?v=[^"'<>\s]+/g)].every(m=>m[0]===canonical),true);
 }
});
