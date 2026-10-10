'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync('assets/phase2-quest-map-20261010.js','utf8');
const c=vm.createContext({Date});vm.runInContext(s,c);
const select=c.LuxPhase2QuestMap.model,day='2026-10-10';
const J={day:()=>day,navigationHref:h=>h.startsWith('/')?h:null,resumeCandidates:()=>[]};
const rows=Array.from({length:10},(_,i)=>({id:'t'+i,title:i===3?'Biology Cell structure':'Quest '+i,
 target:10,progress:i<3?10:i===3?2:0,href:i===3?'/study/biology/practise?daily=1&task=t3':'/study/latin/practise'}));
test('ten authentic stars with partial credit and real next link',()=>{
 const m=select({today:day,daily:rows},J);
 assert.equal(m.ready,true);assert.equal(m.count,3);assert.equal(m.rows.length,10);
 assert.equal(m.focus,'t3');assert.equal(m.rows[3].progress,2);
 assert.match(m.rows[3].href,/biology\/practise/);
});
test('saved question resume highlights its existing task',()=>{
 const m=select({today:day,daily:rows},{...J,resumeCandidates:()=>[{daily:true,dailyTaskId:'t7',planDate:day}]});
 assert.equal(m.focus,'t7');assert.equal(m.rows[7].done,false);
});
test('stale or six-task plan cannot create false stars',()=>{
 assert.equal(select({today:day,daily:rows.slice(0,6)},J).ready,false);
 assert.equal(select({today:'2026-10-09',daily:rows},J).ready,false);
});
test('all complete counts ten without awarding anything',()=>{
 const complete=rows.map(r=>({...r,progress:10}));const before=JSON.stringify(complete);
 const m=select({today:day,xp:200,daily:complete},J);
 assert.equal(m.count,10);assert.equal(m.focus,null);assert.equal(JSON.stringify(complete),before);
 assert.doesNotMatch(s,/localStorage\.setItem\s*\(|\.award\s*\(|\.setState\s*\(|\.bumpDaily\s*\(/);
});
test('Home V2 remains disabled, original artwork and fallback remain',()=>{
 const home=fs.readFileSync('index.html','utf8'),fallback=fs.readFileSync('404.html','utf8');
 assert.equal(home,fallback);assert.doesNotMatch(home,/\/assets\/home-journey-v2-20261010\.js/);
 assert.match(home,/\/art\/doll\/day\.png/);
 assert.match(s,/chosen-reward-goal/);assert.match(s,/Continue studying/);
 for(const path of ['index.html','study/index.html']){
  const h=fs.readFileSync(path,'utf8');assert.match(h,/phase2-quest-map-20261010\.js/);
  assert.match(h,/phase2-quest-map-20261010\.css/);
 }
});
