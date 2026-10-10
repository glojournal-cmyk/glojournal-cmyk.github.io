'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('assets/home-continue-20261010.js','utf8');
const context=vm.createContext({Date});
vm.runInContext(code,context);
const choose=context.LuxHomeContinue.choose;
const DAY='2026-10-10';
const rows=Array.from({length:10},(_,i)=>({id:'t'+i,title:i===1?'Biology Cell structure':'Task '+i,target:10,
 progress:i===0?10:0,href:i===1?'/study/biology/practise?daily=1&task=t1':'/study/latin/practise'}));
const J={day:()=>DAY,navigationHref:s=>typeof s==='string'&&/^\/(study|garden|assessment|play)(\/|\?|$)/.test(s)?s:null,resumeCandidates:()=>[]};
test('unfinished Biology task, never default to Latin',()=>{
 const m=choose({today:DAY,daily:rows},J);
 assert.equal(m.kind,'task');assert.match(m.href,/biology\/practise/);
});
test('saved Biology question 2 of 10 resumes precisely',()=>{
 const draft={daily:true,planDate:DAY,href:'/study/biology/practise?daily=1&task=t1',title:'Biology Cell structure',index:1,total:10};
 const m=choose({today:DAY,daily:rows},{...J,resumeCandidates:()=>[draft]});
 assert.equal(m.kind,'resume');assert.match(m.detail,/Question 2 of 10/);
});
test('stale six-task SSR, yesterday and corrupt links are not trusted',()=>{
 assert.equal(choose({today:DAY,daily:rows.slice(0,6)},J).href,'/study/');
 assert.equal(choose({today:'2026-10-09',daily:rows},J).href,'/study/');
 assert.equal(choose({today:DAY,daily:rows.map(t=>({...t,href:'https://bad.example'}))},J).href,'/study/');
});
test('completed plan opens garden, practice shortcut remains study',()=>{
 const m=choose({today:DAY,daily:rows.map(t=>({...t,progress:10}))},J);
 assert.equal(m.kind,'complete');assert.equal(m.href,'/garden');assert.equal(m.practiceHref,'/study/');
});
test('assessment draft resumes without converting Practise to test shortcut',()=>{
 const draft={daily:false,href:'/assessment/?paper=french',title:'French test',index:2,total:10};
 const m=choose({today:DAY,daily:rows},{...J,resumeCandidates:()=>[draft]});
 assert.equal(m.kind,'resume');assert.equal(m.practiceHref,'/study/');
});
test('navigation patch cannot award XP or store progress',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/\/assets\/home-continue-20261010\.js\?v=20261010-resume1/);
 assert.doesNotMatch(html,/\/assets\/home-journey-v2-20261010\.js/);
 assert.match(code,/__luxAppReady/);
 assert.doesNotMatch(code,/\bsetState\s*\(|\bawardXP\s*\(|localStorage\.setItem\s*\(/);
});
