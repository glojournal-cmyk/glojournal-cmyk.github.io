import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assertFullProgressBackup} from "../assets/full-progress-backup-guard-20261023.js";
const source=readFileSync(new URL("../assets/daily-progress-save.js",import.meta.url),"utf8");
const a=source.indexOf("async function save()"),b=source.indexOf("function previewRestore(",a);
assert.ok(a>0&&b>a,"Direct progress export code must be present");
const direct=new Function("store","document","navigator","File","status","summary","putBackup","MANUAL_KEY","refreshCopies","assertFullProgressBackup",source.slice(a,b)+";return save;");
const payload={app:"lux-scholar-garden",state:{xp:2862,today:"2026-10-11",
 daily:[{id:"french-vocab",progress:3,target:30},
   ...Array.from({length:9},(_,i)=>({id:"daily-"+i,progress:0,target:10}))],
 dailyLog:{},dailyCompleteAwarded:{},dailyVocabByDay:{},formalAttemptLog:[]}};
class MockFile{constructor(data,name,opts){this.data=data[0];this.name=name;this.type=opts.type}}
function make(share){
 const button={disabled:false};
 const store={getState:()=>({...payload.state,exportProgress:()=>JSON.stringify(payload)})};
 const document={getElementById:()=>button};
 let shared=0,stored=0,message="";
 const navigator={canShare:()=>true,share:async()=>{shared++;return share()}};
 const save=direct(store,document,navigator,MockFile,m=>message=m,
   state=>({day:state.today,total:state.daily.length,done:0}),
   async()=>{stored++},"lux-daily-manual-backup-v1",()=>{},assertFullProgressBackup);
 return {save,button,shared:()=>shared,stored:()=>stored,message:()=>message};
}
test("Current progress opens Files share without writing a duplicate to localStorage first",async()=>{
 const f=make(()=>Promise.resolve());await f.save();
 assert.equal(f.shared(),1);assert.equal(f.button.disabled,false);
 assert.match(f.message(),/Verify the JSON file/);
 assert.doesNotMatch(source.slice(a,b),/localStorage\.setItem/);
});
test("Cancelled share does not falsely claim progress was exported",async()=>{
 const f=make(()=>Promise.reject(Object.assign(new Error("cancelled"),{name:"AbortError"})));
 await f.save();
 assert.equal(f.shared(),1);assert.equal(f.stored(),0);
 assert.match(f.message(),/Share cancelled/);
});
test("Direct file export retains current XP and all daily task credits",async()=>{
 let captured=null;
 const button={disabled:false};
 const save=direct({getState:()=>({...payload.state,exportProgress:()=>JSON.stringify(payload)})},
  {getElementById:()=>button},
  {canShare:()=>true,share:async o=>{captured=o.files[0]}},MockFile,()=>{},
  state=>({day:state.today,total:1,done:0}),async()=>{},"manual",()=>{},assertFullProgressBackup);
 await save();
 const stored=JSON.parse(captured.data);
 assert.equal(stored.state.xp,2862);
 assert.equal(stored.state.daily[0].progress,3);
 assert.equal(captured.type,"application/json");
});
