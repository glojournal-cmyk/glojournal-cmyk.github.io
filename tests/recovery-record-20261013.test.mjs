import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reconcileRecoveredTaskHistory} from '../assets/recovery-task-ledger-20261017.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const practice=read('assets/study._subject.practise-y8fix-20260920.js');
const runtime=read('assets/index-BLVOhKhN.js');
const params=new URLSearchParams('recover=2026-10-12&task=french-vocab');
const size=new Function('globalThis',practice.slice(practice.indexOf('function recoveryPracticeSize('),practice.indexOf('function qp('))+';return recoveryPracticeSize')({LuxRecoveryVocabSource:(s,d,subject)=>({task:{progress:s.dailyLog?.[d]?.tasks.find(t=>t.id===subject+'-vocab')?.progress||0}})});
function fixture(progress=0){return {today:'2026-10-13',daily:[],dailyLog:{'2026-10-12':{date:'2026-10-12',done:9,total:10,complete:false,tasks:[{id:'french-vocab',title:'French vocab',target:30,progress,done:false},...Array.from({length:9},(_,i)=>({id:'other-'+i,title:'Other task '+i,target:1,progress:1,done:true}))]}},recoveryVocabByDay:{}}}
test('a completely missed Vocab session supplies all 35 recovery questions',()=>assert.equal(size('french',params,fixture()),35));
test('new recovery sets only ask for the remaining correct answers',()=>{
 assert.equal(size('french',params,fixture(20)),15);
 const s=fixture();s.recoveryVocabByDay['2026-10-12']={french:{originalCount:0,totalNeeded:35,items:Object.fromEntries(Array.from({length:30},(_,i)=>['q'+i,true]))}};
 assert.equal(size('french',params,s),5);
 s.recoveryVocabByDay['2026-10-12'].french.items.wrong=false;
 assert.equal(size('french',params,s),5);
});
test('ordinary daily vocabulary still has 30 questions',()=>assert.equal(size('french',new URLSearchParams(),fixture()),30));
test('existing 30-question recovery draft remains resumable',()=>{
 const fn=new Function('globalThis',practice.slice(practice.indexOf('function recoveryPracticeSize('),practice.indexOf('function qp('))+';return recoveryPracticeSize')({LuxPracticeDrafts:{key:(_s,_y,size)=>size,read:key=>key===30?({j:12,base:Array(30)}):null}});
 assert.equal(fn('french',params,fixture()),30);
 assert.match(practice,/E===`y8vocab`\?recoverySize:/);
});
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.textContent='';this.className='';this.isConnected=false;this.scrollTop=0;this.offsetTop=0;this.style={};}
 append(...nodes){for(const n of nodes)n.isConnected=true;this.children.push(...nodes)}
 appendChild(node){this.append(node);return node}
 replaceChildren(...nodes){this.children=nodes}
 setAttribute(){} addEventListener(){} focus(){}
 querySelector(selector){const cls=selector.replace(/^\./,'').split('.');return this.children.find(n=>cls.every(c=>n.className?.split(' ').includes(c)))||this.children.map(n=>n.querySelector?.(selector)).find(Boolean)}
}
function calendar(state){
 const listeners=[],root=new Element('html');
 const document={createElement:t=>new Element(t),documentElement:root,body:{classList:{add(){},remove(){}}}};
 const window={addEventListener(){}};
 const store={getState:()=>state,subscribe:fn=>listeners.push(fn)};
 const from=runtime.indexOf('function reconcileRecoveredVocabHistory('),to=runtime.indexOf('function normalizeState(',from);
 const recordFrom=runtime.indexOf('function recordDayStatus('),recordTo=runtime.indexOf('function luxGlanceShortLabel(',recordFrom);
 const fn=new Function('store','document','window','history','todayKey','shiftDay','formatRecordDate','compactDailyTasks','findRecoveryVocabSource','reconcileRecoveredTaskHistory',runtime.slice(from,to)+runtime.slice(recordFrom,recordTo)+';mountDailyRecord();');
 fn(store,document,window,{state:{},pushState(){},back(){}},()=>state.today,(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10),d=>({weekday:'Day',label:d}),x=>x,()=>null,reconcileRecoveredTaskHistory);
 window.__luxOpenDailyRecord();
 const text=node=>[node.textContent,...node.children.map(text)].join('\n');
 return {text:()=>text(root),update:()=>listeners.forEach(f=>f())};
}
test('30 day record derives completed recovery and correct day total from stale log',()=>{
 const s=fixture();s.recoveryVocabByDay['2026-10-12']={french:{completed:true}};
 const before=JSON.stringify(s),view=calendar(s);
 assert.match(view.text(),/All done · 10\/10/);
 assert.match(view.text(),/1 finished · 0 unfinished/);
 assert.equal(JSON.stringify(s),before,'render must not mutate or award student progress');
});
test('record updates while open when Recovery proof arrives',()=>{
 const s=fixture(),view=calendar(s);assert.match(view.text(),/1 still to do · 9\/10/);
 s.recoveryVocabByDay['2026-10-12']={french:{completed:true}};view.update();
 assert.match(view.text(),/All done · 10\/10/);
});
test('partial recovery cannot claim the missed day is complete',()=>{
 const s=fixture();s.recoveryVocabByDay['2026-10-12']={french:{completed:false,totalNeeded:35,items:Object.fromEntries(Array.from({length:30},(_,i)=>['q'+i,true]))}};
 const view=calendar(s);assert.match(view.text(),/1 still to do · 9\/10/);assert.doesNotMatch(view.text(),/All done · 10\/10/);
});
test('completed proof still counts beyond the two-day recovery entry window',()=>{
 const s=fixture();s.today='2026-10-16';s.recoveryVocabByDay['2026-10-12']={french:{completed:true}};
 assert.match(calendar(s).text(),/All done · 10\/10/);
});
test('completing French does not falsely finish unfinished Latin',()=>{
 const s=fixture();s.dailyLog['2026-10-12'].tasks[1]={id:'latin-vocab',title:'Latin vocab',target:30,progress:0,done:false};s.recoveryVocabByDay['2026-10-12']={french:{completed:true}};
 assert.match(calendar(s).text(),/1 still to do · 9\/10/);
});
test('an incomplete set has a direct date-preserving recovery continuation',()=>{
 const src=read('assets/recovery-progress-20261012.js');assert.match(src,/href=recoveryReplay\(location.href\)/);assert.match(src,/Continue recovery · /);assert.match(src,/more needed to credit/);
});

test('old 35-question and new smaller recovery drafts keep their saved size',()=>{
 const helper=practice.slice(practice.indexOf('function recoveryPracticeSize('),practice.indexOf('function qp('));
 for(const savedSize of [35,15,5]){
  const fn=new Function('globalThis',helper+';return recoveryPracticeSize')({LuxPracticeDrafts:{key:(_s,_y,size)=>size,read:key=>key===savedSize?({savedAt:100,j:1}):null}});
  assert.equal(fn('french',params,fixture()),savedSize);
 }
});
test('both practice entry files use the same recovery sizing',()=>{
 const base=read('assets/study._subject.practise-D_PWgUd7.js');
 assert.equal(base.slice(base.indexOf('function recoveryPracticeSize('),base.indexOf('function qp(')),practice.slice(practice.indexOf('function recoveryPracticeSize('),practice.indexOf('function qp(')));
});
