import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/loading-recovery-20261007.js','utf8');
function environment(){const attrs=new Set(),listeners={},timers=[];let observer;const body=[];const root={setAttribute:k=>attrs.add(k),removeAttribute:k=>attrs.delete(k),hasAttribute:k=>attrs.has(k)};const document={documentElement:root,body:{append:p=>body.push(p)},getElementById:id=>body.find(p=>p.id===id),createElement:()=>({style:{},children:[],setAttribute(){},append(...n){this.children.push(...n)},addEventListener(k,fn){this[k]=fn},remove(){body.splice(body.indexOf(this),1)}})};const context={document,window:{addEventListener:(k,fn)=>listeners[k]=fn},MutationObserver:class{constructor(fn){observer=fn}observe(){}},setTimeout:fn=>(timers.push(fn),timers.length),clearTimeout(){},URL,Date,location:{href:'https://example.test/study?daily=1',replace(url){this.replaced=url}}};return {context,attrs,listeners,timers,body,mutate:()=>observer()};}
let e=environment();vm.runInNewContext(source,e.context);e.listeners['lux:app-ready']();assert(e.attrs.has('data-lux-ready'));e.attrs.delete('data-lux-ready');e.mutate();assert(e.attrs.has('data-lux-ready'),'React root replacement keeps readiness');e.timers[0]();assert.equal(e.body.length,0);
e=environment();vm.runInNewContext(source,e.context);e.timers[0]();assert.equal(e.body.length,1,'failed module shows recovery instead of spinner');assert.match(e.body[0].children[1].textContent,/has not been cleared/);e.body[0].children[2].click();assert.match(e.context.location.replaced,/daily=1&reload=/);e.listeners['lux:app-ready']();assert.equal(e.body.length,0,'late successful mount removes recovery');
const index=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');const block=index.slice(index.indexOf('// Readiness comes'),index.indexOf('\nif(typeof window!=="undefined"&&window.addEventListener){window.addEventListener("scholar:learning-changed"'));
let hydrated=false,finish;const attrs=new Set();const context={window:{__luxAppReady:true,addEventListener(){}},document:{documentElement:{hasAttribute:k=>attrs.has(k),setAttribute:k=>attrs.add(k)}},store:{persist:{hasHydrated:()=>hydrated,onFinishHydration:fn=>finish=fn}},MutationObserver:class{observe(){}},setTimeout:fn=>fn()};vm.runInNewContext(block,context);assert(attrs.has('data-lux-ready'),'mounted shell is shown even when saved progress has not hydrated');hydrated=true;finish();assert(attrs.has('data-lux-ready'),'saved state readiness has no XP/header/catalog dependency');
const preflight=fs.readFileSync('assets/progress-preflight-20261007.js','utf8');
function runPreflight(storage){const memory={...storage};vm.runInNewContext(preflight,{localStorage:{getItem:k=>Object.prototype.hasOwnProperty.call(memory,k)?memory[k]:null,setItem:(k,v)=>{memory[k]=v},removeItem:k=>{delete memory[k]}}});return memory;}
const healthy={state:{xp:40,today:'2026-10-07',daily:[]},version:10};
let kept=runPreflight({'lux-scholar-garden-v1':JSON.stringify(healthy)});
assert.equal(kept['lux-scholar-garden-v1'],JSON.stringify(healthy),'readable progress is not rewritten');
assert.equal(kept['lux-scholar-garden-v1-unreadable'],undefined);
const backup=JSON.stringify({savedAt:'2026-10-07T10:00:00Z',data:JSON.stringify({app:'lux-scholar-garden',version:10,state:{xp:80,today:'2026-10-06',daily:[{id:'latin-vocab',target:30,progress:12}]}})});
let repaired=runPreflight({'lux-scholar-garden-v1':'{broken','lux-progress-auto-v1':backup});
assert.equal(repaired['lux-scholar-garden-v1-unreadable'],'{broken','unreadable blob is kept aside');
assert.equal(JSON.parse(repaired['lux-scholar-garden-v1']).state.xp,80,'automatic backup is restored into the app save');
let cleared=runPreflight({'lux-scholar-garden-v1':'not-json'});
assert.equal(cleared['lux-scholar-garden-v1'],undefined,'unreadable save cannot block the next boot');
assert.equal(cleared['lux-scholar-garden-v1-unreadable'],'not-json');
assert(!/localStorage|removeItem|clearStorage/.test(source),'recovery does not modify saved data');console.log('LOADING_RECOVERY_QA passed: mount, hydration, root replacement, failure recovery, late load, saved data untouched');
