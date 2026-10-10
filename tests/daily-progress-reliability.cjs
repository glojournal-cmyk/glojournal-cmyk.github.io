'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const TODAY='2026-10-10', YESTERDAY='2026-10-09';
class StorageMock {
 constructor(initial={},max=Infinity){this.items=new Map(Object.entries(initial));this.max=max;this.writes=[];}
 getItem(key){return this.items.has(String(key))?this.items.get(String(key)):null;}
 setItem(key,value){
  key=String(key);value=String(value);
  const entries=[...this.items.entries()].filter(([k])=>k!==key);
  const bytes=entries.reduce((n,[k,v])=>n+k.length+v.length,0)+key.length+value.length;
  if(bytes>this.max){const err=new Error('The quota has been exceeded');err.name='QuotaExceededError';throw err;}
  this.items.set(key,value);this.writes.push(key);
 }
 removeItem(key){this.items.delete(String(key));}
}
const state=(done=0,day=TODAY)=>({today:day,xp:40,daily:[
 {id:'study-session',target:10,progress:done?10:0,href:'/study'},
 {id:'french-vocab',target:30,progress:done>1?30:0,href:'/study/french/practise?daily=1&task=french-vocab'},
 {id:'latin-vocab',target:30,progress:0,href:'/study/latin/practise?daily=1&task=latin-vocab'}]});
const payload=s=>JSON.stringify({app:'lux-scholar-garden',version:10,exportedAt:new Date().toISOString(),state:s});
const snapshot=s=>JSON.stringify({savedAt:'2026-10-09T08:00:00Z',day:s.today,
 done:s.daily.filter(t=>t.progress>=t.target).length,total:s.daily.length,data:payload(s)});
function preflight(storage){
 const ctx=vm.createContext({localStorage:storage,sessionStorage:new StorageMock(),window:{Storage:StorageMock},Storage:StorageMock});
 vm.runInContext(file('assets/progress-preflight-20261007.js'),ctx,{timeout:4000});
}
function planner(){
 const source=file('assets/index-BLVOhKhN.js'),i=source.indexOf('function buildAdaptiveDaily(state) {'),j=source.indexOf('\nlet normalizing =',i);
 assert.ok(i>=0&&j>i,'canonical daily planner present');
 const definitions=[
 "const todayKey=()=> '2026-10-10',DAILY_SUBJECTS=['latin','french','biology','chemistry','physics'],SUBJECT_LABELS={latin:'Latin'},YEAR8_MASTERY_SUBJECTS=['latin','french'],FRENCH_DAILY_HREF='/study/french/practise';",
 "const curriculumFocusAllowed=()=>true,topicMatchesYear=()=>true,adaptiveFocus=()=>({subject:'latin',topicId:'la-y8-x',reason:'foundation'}),topicTitle=()=>'Basics',errorLabel=()=>'',topicAttemptsToday=()=>0,focusAttemptsToday=()=>0;",
 "const year8ReviewPlan=()=>({subject:'latin',topicId:'la-y8-x',label:'Latin',topicLabel:'Basics',href:'/study/latin/practise?mode=standard',ready:true}),completedYear8ReviewEvidence=()=>null,vocabGateState=()=>({correct:0,progress:0,attempts:0});",
 "const firstUnmastered=()=>({subject:'latin',topicId:'la-y8-x'}),year8AssignedPool=()=>[],year8TopicRank=()=>0,year8AssignedTitle=()=>'Year 8 topic',year8AssignedHref=()=>'/study/latin/practise?mode=standard';",
 "const assignedCurriculumPick=()=>({subject:'latin',topicId:'la-y8-x',year:8,position:1,total:2,topicLabel:'Basics'}),mistakeReviewTask=()=>({id:'mistake-review',title:'Previous mistakes',target:1,progress:1,href:'/study',planDate:'2026-10-10'}),focusHref=()=>'/study/latin/practise?mode=standard';"
 ].join('\n');
 const ctx=vm.createContext({});
 vm.runInContext(definitions+'\n'+source.slice(i,j)+'\nthis.plan=buildAdaptiveDaily',ctx,{timeout:4000});
 return ctx.plan;
}
function navigation(storage){
 const ctx=vm.createContext({localStorage:storage,URL,URLSearchParams,Intl,Date});
 vm.runInContext(file('assets/journey-navigation-20261004.js'),ctx,{timeout:4000});
 return ctx.LuxJourney;
}
function backupHarness(storage,live){
 const source=file('assets/daily-progress-save.js'),i=source.indexOf('const SNAPSHOT_KEY'),j=source.indexOf('store.subscribe(',i);
 const a=source.indexOf('function summary('),b=source.indexOf('function savedCopy(',a);
 assert.ok(i>=0&&j>i&&a>=0&&b>a);
 const statuses=[];
 const ctx=vm.createContext({localStorage:storage,store:{getState:()=>live},clearTimeout:()=>{},
  document:{getElementById:()=>({set textContent(x){statuses.push(x)}})},Date,JSON});
 vm.runInContext(source.slice(i,j)+'\n'+source.slice(a,b)+'\nfunction refreshCopies(){}',ctx,{timeout:4000});
 return {save:()=>ctx.autoSave(),statuses};
}
test('all ten daily tasks remain; yesterday game/garden/focus credits reset',()=>{
 const run=planner();
 const s={...state(),year:8,wateredOn:YESTERDAY,daily:[
  {id:'adaptive-focus',planDate:YESTERDAY,progress:4},
  {id:'tend-garden',planDate:YESTERDAY,progress:1,target:1,title:'Water',href:'/garden'},
  {id:'play-game',planDate:YESTERDAY,progress:1,target:1,title:'Game',href:'/play'}]};
 const rows=run(s);
 const ids=['mistake-review','study-session','french-vocab','latin-vocab','adaptive-focus',
   'year8-long-review','y8-practise','y8-mastery','tend-garden','play-game'];
 assert.deepEqual(Array.from(rows.map(x=>x.id)),ids);
 for(const id of ['adaptive-focus','tend-garden','play-game']){
  assert.equal(rows.find(t=>t.id===id).progress,0,id);
  assert.equal(rows.find(t=>t.id===id).planDate,TODAY);
 }
 s.daily=rows;s.wateredOn=TODAY;s.dailyGamePlayedByDay={[TODAY]:true};
 const next=run(s);
 assert.equal(next.find(t=>t.id==='tend-garden').progress,1);
 assert.equal(next.find(t=>t.id==='play-game').progress,1);
});
test('opening a healthy App does not erase previous backups or history',()=>{
 const original={
  'lux-scholar-garden-v1':JSON.stringify({state:state(2),version:10}),
  'lux-progress-auto-v1':snapshot(state(2)),
  'lux-progress-auto-v1-previous':snapshot(state(1,YESTERDAY)),
  'lux-progress-before-restore-v1':snapshot(state(1,YESTERDAY)),
  'lux-daily-manual-backup-v1':snapshot(state(1,YESTERDAY)),
  'lux-day-log-v1':'{"records":7}',
  'lux-assessment-v1-recovery':'{"results":[1]}'
 };
 const storage=new StorageMock(original);preflight(storage);
 for(const [key,value] of Object.entries(original))assert.equal(storage.getItem(key),value,key);
});
test('quota failure is observable and last good backups survive',()=>{
 const raw=JSON.stringify({state:state(1),version:10});
 const storage=new StorageMock({'lux-scholar-garden-v1':raw,'lux-progress-auto-v1':snapshot(state(1))});
 preflight(storage);
 storage.max=[...storage.items].reduce((n,[k,v])=>n+k.length+v.length,0);
 assert.throws(()=>storage.setItem('lux-scholar-garden-v1','x'.repeat(raw.length+100)),/quota/i);
 assert.equal(storage.getItem('lux-scholar-garden-v1'),raw);
 assert.ok(storage.getItem('lux-progress-auto-v1'));
});
test('corrupt main can recover from backup while original is quarantined',()=>{
 const storage=new StorageMock({'lux-scholar-garden-v1':'{broken','lux-progress-auto-v1':snapshot(state(2))});
 preflight(storage);
 assert.equal(JSON.parse(storage.getItem('lux-scholar-garden-v1')).state.daily[1].progress,30);
 assert.equal(storage.getItem('lux-scholar-garden-v1-unreadable'),'{broken');
});
test('assessment review completion counts saved reviewCompletedIds after reload',()=>{
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const row={id:'mistake-review',reviewSource:'assessment',planDate:day,target:3,progress:1,
  reviewQuestionIds:['a','b','c'],reviewCompletedIds:['a']};
 const s={today:day,daily:[row]};
 const storage=new StorageMock({
  'lux-scholar-garden-v1':JSON.stringify({state:s,version:10}),
  'lux-assessment-v1':JSON.stringify({dailyReviewCredits:{[day]:{b:true,c:true}}})
 });
 const J=navigation(storage);
 assert.equal(J.garden().daily[0].progress,3);
 assert.equal(J.withReviewCredits(s).daily[0].progress,3);
});
test('Continue skips completed and expired daily drafts',()=>{
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const key=JSON.stringify(['latin',8,10,'','y8-practise','standard','y8-practise','',day]);
 const draft={version:1,j:1,base:[{id:'a'},{id:'b'}],savedAt:Date.now(),daily:true,dailyTaskId:'y8-practise',planDate:day};
 const storage=new StorageMock({'lux-practice-drafts-v1':JSON.stringify({[key]:draft})});
 const J=navigation(storage);
 const current={today:day,daily:[{id:'y8-practise',target:10,progress:5,
  href:'/study/latin/practise?daily=1&locked=1&year=8&mode=standard&task=y8-practise'}]};
 assert.equal(J.resumeCandidates(current).length,1);
 assert.equal(J.resumeCandidates({...current,daily:[{...current.daily[0],progress:10}]}).length,0);
 storage.setItem('lux-practice-drafts-v1',JSON.stringify({[key]:{...draft,planDate:YESTERDAY}}));
 assert.equal(J.resumeCandidates(current).length,0);
});
test('auto backup deduplicates unchanged progress and keeps stronger same-day state',()=>{
 const storage=new StorageMock(),live={...state(1),exportProgress(){return payload(this)}};
 const h=backupHarness(storage,live);
 h.save();const writes=storage.writes.filter(k=>k==='lux-progress-auto-v1').length;
 h.save();assert.equal(storage.writes.filter(k=>k==='lux-progress-auto-v1').length,writes);
 const prior=storage.getItem('lux-progress-auto-v1');
 live.daily[0].progress=0;h.save();
 assert.equal(storage.getItem('lux-progress-auto-v1'),prior);
});
test('auto backup keeps prior-day restore point when saving new-day work',()=>{
 const storage=new StorageMock({'lux-progress-auto-v1':snapshot(state(2,YESTERDAY))});
 const live={...state(1,TODAY),exportProgress(){return payload(this)}};
 const h=backupHarness(storage,live);h.save();
 assert.equal(JSON.parse(storage.getItem('lux-progress-auto-v1')).day,TODAY);
 assert.equal(JSON.parse(storage.getItem('lux-progress-auto-v1-previous')).day,YESTERDAY);
 live.daily[1].progress=30;h.save();
 assert.equal(JSON.parse(storage.getItem('lux-progress-auto-v1-previous')).day,YESTERDAY);
});
test('restore safeguards old progress and refuses to import when safeguard cannot fit',()=>{
 const source=file('assets/daily-progress-save.js'),i=source.indexOf('function restore('),j=source.indexOf('function mount(',i);
 let imported=false,reloaded=false;const live={...state(2),exportProgress(){return payload(this)},importProgress(){imported=true;return {ok:true}}};
 const storage=new StorageMock();
 const ctx=vm.createContext({store:{getState:()=>live},localStorage:storage,
  BEFORE_RESTORE_KEY:'lux-progress-before-restore-v1',
  summary:x=>({day:x.today,done:x.daily.filter(t=>t.progress>=t.target).length,total:x.daily.length}),
  confirm:()=>true,status:()=>{},location:{reload:()=>{reloaded=true}},Date,JSON});
 vm.runInContext(source.slice(i,j)+'\nthis.restoreTest=restore',ctx,{timeout:4000});
 ctx.restoreTest(payload(state(0)),'Backup');
 assert.equal(imported,true);assert.equal(reloaded,true);
 assert.equal(JSON.parse(storage.getItem('lux-progress-before-restore-v1')).done,2);
 ctx.localStorage=new StorageMock({},1);imported=false;reloaded=false;
 ctx.restoreTest(payload(state(0)),'Backup');
 assert.equal(imported,false);assert.equal(reloaded,false);
});
