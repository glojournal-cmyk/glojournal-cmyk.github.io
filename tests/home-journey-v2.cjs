'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const file=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const DAY='2026-10-10';
function model(){
 const storage={data:{},getItem(k){return this.data[k]??null}};
 const context=vm.createContext({URL,URLSearchParams,Date,Intl,localStorage:storage});
 vm.runInContext(file('assets/journey-navigation-20261004.js'),context,{timeout:5000});
 vm.runInContext(file('assets/home-journey-v2-logic-20261010.js'),context,{timeout:5000});
 const J=context.LuxJourney,logic=context.LuxHomeJourneyV2Logic;
 assert.ok(J&&logic);
 const tasks=[
  ['mistake-review',1,'/study/latin/practise?daily=1&task=mistake-review'],
  ['study-session',10,'/study/biology/practise?daily=1&task=study-session'],
  ['french-vocab',30,'/study/french/practise?daily=1&task=french-vocab'],
  ['latin-vocab',30,'/study/latin/practise?daily=1&task=latin-vocab'],
  ['adaptive-focus',4,'/study/biology/practise?daily=1&task=adaptive-focus'],
  ['year8-long-review',25,'/study/latin/practise?daily=1&task=year8-long-review'],
  ['y8-practise',10,'/study/latin/practise?daily=1&task=y8-practise'],
  ['y8-mastery',25,'/study/latin/practise?daily=1&task=y8-mastery'],
  ['tend-garden',1,'/garden'],
  ['play-game',1,'/play']
 ].map(([id,target,href])=>({id,title:id,target,progress:0,href,planDate:DAY}));
 return {storage,context,J,logic,tasks,build:(state,when=Date.parse('2026-10-10T12:00:00Z'))=>
  logic.homeJourney(state,J,storage,when)};
}

test('full daily plan uses all ten official tasks, not prerendered six',()=>{
 const {build,tasks}=model();
 const res=build({today:DAY,daily:tasks});
 assert.equal(res.ready,true);
 assert.equal(res.rows.length,10);
 assert.equal(res.total,10);
 assert.equal(res.count,0);
 assert.equal(res.next.kind,'task');
 assert.equal(res.next.title,'mistake-review');
 assert.ok(res.next.href.startsWith('/study/latin/practise'));
});
test('legacy six and yesterday snapshots cannot show misleading task count',()=>{
 const {build,tasks}=model();
 assert.equal(build({today:DAY,daily:tasks.slice(0,6)}).ready,false);
 assert.equal(build({today:'2026-10-09',daily:tasks}).ready,false);
 assert.equal(build({today:DAY,daily:[]}).ready,false);
});
test('a partially credited task links to the actual unfinished task',()=>{
 const {build,tasks}=model();
 const current=tasks.map((task,i)=>({...task,progress:i<4?task.target:(i===4?2:0)}));
 const res=build({today:DAY,daily:current});
 assert.equal(res.count,4);
 assert.equal(res.next.kind,'task');
 assert.equal(res.next.title,'adaptive-focus');
 assert.match(res.next.href,/task=adaptive-focus/);
 assert.equal(res.rows[4].progress,2);
});
test('resume the saved current-day question, not just open the subject homepage',()=>{
 const {storage,build,tasks}=model();
 const key=JSON.stringify(['biology',8,10,'','adaptive-focus','standard','adaptive-focus','',DAY]);
 const savedAt=Date.parse('2026-10-10T11:00:00Z');
 storage.data['lux-practice-drafts-v1']=JSON.stringify({
  [key]:{version:1,j:1,base:[{id:'q1'},{id:'q2'},{id:'q3'}],savedAt,daily:true,
    dailyTaskId:'adaptive-focus',planDate:DAY,href:'/study/biology/practise?daily=1&task=adaptive-focus'}
 });
 const res=build({today:DAY,daily:tasks});
 assert.equal(res.next.kind,'resume');
 assert.match(res.next.subtitle,/Question 2 \/ 3/);
 assert.match(res.next.href,/biology\/practise/);
 assert.match(res.next.href,/task=adaptive-focus/);
});
test('ignore completed or expired daily drafts',()=>{
 const {storage,build,tasks}=model();
 const key=JSON.stringify(['biology',8,10,'','adaptive-focus','standard','adaptive-focus','',DAY]);
 storage.data['lux-practice-drafts-v1']=JSON.stringify({
  [key]:{version:1,j:1,base:[{id:'q1'},{id:'q2'},{id:'q3'}],
    savedAt:Date.parse('2026-10-10T11:00:00Z'),daily:true,
    dailyTaskId:'adaptive-focus',planDate:DAY,href:'/study/biology/practise?daily=1&task=adaptive-focus'}
 });
 const current=tasks.map(t=>t.id==='adaptive-focus'?{...t,progress:t.target}:t);
 assert.equal(build({today:DAY,daily:current}).next.kind,'task');
 const expired=JSON.parse(storage.data['lux-practice-drafts-v1']);
 expired[key].planDate='2026-10-09';
 storage.data['lux-practice-drafts-v1']=JSON.stringify(expired);
 assert.equal(build({today:DAY,daily:tasks}).next.kind,'task');
});
test('all ten complete displays a completion state without rewarding again',()=>{
 const {build,tasks}=model();
 const res=build({today:DAY,daily:tasks.map(t=>({...t,progress:t.target}))});
 assert.equal(res.count,10);
 assert.equal(res.next.kind,'complete');
 assert.equal(res.next.href,'/garden');
});
test('pet preview respects selected species, saved MP and evolution level',()=>{
 const {build,tasks,storage}=model();
 storage.data['lux-pet-companion-v1']=JSON.stringify({
  species:'moss-hornling',petLevels:{'moss-hornling':3},masteryPoints:100
 });
 const res=build({today:DAY,daily:tasks});
 assert.equal(res.reward.level,3);
 assert.equal(res.reward.goal,140);
 assert.equal(res.reward.remaining,40);
 assert.match(res.reward.label,/40 MP/);
});
test('stable Home keeps original artwork and leaves rolled-back V2 disabled',()=>{
 const html=file('index.html');
 const css=file('assets/home-journey-v2-20261010.css');
 const ui=file('assets/home-journey-v2-20261010.js');
 // Home V2 was rolled back after a blank-screen incident; never silently
 // reactivate it just because a new shared logo CSS stylesheet was added.
 assert.doesNotMatch(html,/\/assets\/home-journey-v2-20261010\.css/);
 assert.doesNotMatch(html,/\/assets\/home-journey-v2-20261010\.js/);
 assert.match(html,/\/assets\/index-BLVOhKhN\.js/);
 assert.match(html,/lux-celestial-b-brand-20261010\.css/);
 assert.match(html,/\/art\/doll\/day\.png/);
 assert.match(html,/img class="scholar-idle|class="scholar-idle/);
 assert.match(css,/@media\(min-width:768px\)/);
 assert.match(css,/data-lux-v2-stage/);
 assert.match(ui,/lux-v2-all-tasks/);
 assert.match(ui,/Today's learning journey/);
 assert.match(ui,/const wasOpen=/);
 assert.match(ui,/!window\.__luxAppReady/,"never edit React SSR before hydration");
 assert.doesNotMatch(ui,/\bstore\.setState\s*\(/,'home display cannot change learning data');
 assert.doesNotMatch(ui,/\baward\s*\(/,'home display cannot award XP');
});
