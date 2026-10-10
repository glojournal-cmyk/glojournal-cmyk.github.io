'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('assets/study-navigation-v2-20261010.js','utf8');
const begin=source.indexOf('function snapshot(){');
const end=source.indexOf('\nfunction repaint(){',begin);
assert.ok(begin>=0&&end>begin);
const construct=new Function('localStorage','globalThis','appearance',source.slice(begin,end)+'\nreturn snapshot;');
const DAY='2026-10-10';
const rows=Array.from({length:10},(_,i)=>({id:'t'+i,title:'Task '+i,
 target:10,progress:0,href:'/study/biology/practise?daily=1&task=t'+i}));
function model(state,drafts=[]){
 const J={day:()=>DAY,safeHref:s=>/^\/(study|garden|assessment)/.test(s)?s:null,
 navigationHref:s=>s&&/^\/(study|garden|assessment)/.test(s)?s:null,
 resumeCandidates:()=>drafts};
 return construct({getItem:()=>JSON.stringify({state})},{LuxJourney:J},()=>({scholar:'/art/doll/day.png',outfit:'Day Uniform'}))();
}
test('all ten real daily tasks completed opens Garden, not homepage',()=>{
 const m=model({today:DAY,year:8,daily:rows.map(x=>({...x,progress:10}))});
 assert.equal(m.valid,true);assert.equal(m.complete,true);assert.equal(m.done,10);
 assert.equal(m.href,'/garden');assert.equal(m.paused,false);
});
test('a saved paused Biology question takes priority if not finished',()=>{
 const d={daily:true,planDate:DAY,href:'/study/biology/practise?daily=1&task=t1',
 index:1,total:10};
 const m=model({today:DAY,daily:rows},[d]);
 assert.equal(m.paused,true);assert.match(m.href,/biology\/practise/);
});
test('six-task legacy and yesterday snapshots cannot display fake ten-star completion',()=>{
 for(const state of [{today:DAY,daily:rows.slice(0,6)},{today:'2026-10-09',daily:rows}]){
  const m=model(state);
  assert.equal(m.valid,false);assert.equal(m.complete,false);assert.equal(m.done,0);
  assert.equal(m.href,'#lux-study-subjects-v2');
 }
});
test('Study scene stays compact and without pet',()=>{
 assert.doesNotMatch(source,/lux-path-hero-pet/);
 assert.match(source,/d\.complete\?"All ten stars lit"/);
 assert.match(fs.readFileSync('study/index.html','utf8'),/study-navigation-v2-20261010\.js\?v=20261010-quest-complete1/);
});
