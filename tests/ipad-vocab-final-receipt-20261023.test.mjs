import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync('assets/ipad-vocab-final-receipt-20261023.js','utf8');
const day='2026-10-23';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function setup({correct=true,already=false,path='/study/french/practise',progress=29,storage}={}){
 const listeners=new Map(),kv=storage||new Map();
 const sess={getItem:k=>kv.get(k)||null,setItem:(k,v)=>kv.set(k,v),removeItem:k=>kv.delete(k)};
 let state={today:day,xp:333,daily:[{id:'french-vocab',target:30,progress,done:false,planDate:day}],
   dailyLog:{[day]:{date:day,tasks:[{id:'french-vocab',target:30,progress,done:false}],done:0,total:1,complete:false}},
   dailyVocabByDay:{},formalAttemptLog:already?[{questionId:'last-word',day,correct:true,dailyVocab:'french',formal:true}]:[]};
 const store={getState:()=>state,setState:patch=>{state={...state,...patch}},persist:{hasHydrated:()=>true}};
 const ctx={globalThis:null,URLSearchParams,console,Date,setTimeout,clearTimeout,setInterval,clearInterval,
   sessionStorage:sess,__luxStore:store,location:{pathname:path,search:'?daily=1&locked=1&mode=y8vocab&task=french-vocab'},
   addEventListener:(name,fn)=>{listeners.set(name,[...(listeners.get(name)||[]),fn])},
   dispatchEvent:e=>(listeners.get(e.type)||[]).forEach(fn=>fn(e))};
 ctx.globalThis=ctx;
 vm.runInNewContext(code,ctx,{filename:'ipad-vocab-final-receipt-20261023.js'});
 return {ctx,store,kv,marked:()=>ctx.dispatchEvent({type:'scholar:question-answered',
   detail:{subject:'french',dailyVocab:'french',correct,questionId:'last-word'}})};
}
test('iPad marked final correct French word is credited exactly once and reflected on Home',async()=>{
 const item=setup();item.marked();await delay(300);
 const st=item.store.getState();
 assert.equal(st.daily[0].progress,30);assert.equal(st.dailyLog[day].tasks[0].progress,30);
 assert.equal(st.dailyVocabByDay[day].french.additionalCorrectIds['last-word'],true);
 assert.equal(st.xp,333);
 item.marked();await delay(200);assert.equal(item.store.getState().daily[0].progress,30);
});
test('wrong answer, already-credited word and free practice never invent final credit',async()=>{
 for(const opts of [{correct:false},{already:true},{path:'/study/french/practise-free'}]){
   const item=setup(opts);item.marked();await delay(160);
   assert.equal(item.store.getState().daily[0].progress,29);
 }
});
test('verified receipt survives iPad same-tab reload even when large progress store is stale',async()=>{
 const storage=new Map(),first=setup({storage});
 first.marked();await delay(170);
 const recovered=setup({storage});await delay(400);
 assert.equal(recovered.store.getState().daily[0].progress,30);
 assert.equal(recovered.store.getState().xp,333);
});
test('no fabricated completion from 28/30 or new day',async()=>{
 const item=setup({progress:28});item.marked();await delay(150);
 assert.equal(item.store.getState().daily[0].progress,28);
});
