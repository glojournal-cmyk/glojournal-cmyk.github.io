import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assertFullProgressBackup} from "../assets/full-progress-backup-guard-20261023.js";

const source=readFileSync(new URL("../assets/daily-progress-save.js",import.meta.url),"utf8");
const a=source.indexOf('async function save('),b=source.indexOf('function previewRestore(',a);
assert.ok(a>0&&b>a,"Current manual JSON export and restore-preview implementations must exist");
const direct=new Function(
  "store","document","navigator","File","status","summary",
  "putBackup","MANUAL_KEY","refreshCopies","assertFullProgressBackup","requestJsonDownload","prepareLatest30DayExport",
  source.slice(a,b)+";return save;"
);
const state={
  xp:2862,today:"2026-10-11",
  daily:[{id:"french-vocab",progress:3,target:30},...Array.from({length:9},(_,i)=>({id:"daily-"+i,progress:0,target:10}))],
  dailyLog:{},dailyCompleteAwarded:{},dailyVocabByDay:{},formalAttemptLog:[]
};
const payload={app:"lux-scholar-garden",version:10,state};
class MockFile {
  constructor(data,name,options){this.data=data[0];this.name=name;this.type=options.type;}
}
function fixture({onShare=async()=>{},canShare=true,exported=payload}={}){
  const buttons={ "daily-save-button":{disabled:false},"daily-share-button":{disabled:false} };
  const current={...state,exportProgress:()=>JSON.stringify(exported)};
  let downloaded=[],shared=[],saved=[],messages=[];
  const save=direct(
    {getState:()=>current},
    {getElementById:id=>buttons[id]||null},
    {canShare:()=>canShare,share:async value=>{shared.push(value);return onShare(value);}},
    MockFile,
    (...args)=>messages.push(args),
    s=>({day:s.today,total:s.daily.length,done:s.daily.filter(t=>t.progress>=t.target).length}),
    async (key,value)=>{saved.push({key,value});},
    "lux-daily-manual-backup-v1",
    ()=>{},
    assertFullProgressBackup,
    (data,filename)=>{downloaded.push({data,filename});},
    async (getState,getBase)=> {
      // Handler test: exercise real blocking guard. The independently
      // tested 30-day/journal builder has its own integration regression.
      const parsed=JSON.parse(getBase());
      assertFullProgressBackup(parsed,getState());
      return JSON.stringify({...parsed,exportedAt:new Date().toISOString()});
    }
  );
  return {save,buttons,downloads:()=>downloaded,shares:()=>shared,backups:()=>saved,
    message:()=>messages.at(-1)?.[0]||""};
}
test("Default button downloads a verified full JSON without invoking device share",async()=>{
  const f=fixture();await f.save();
  assert.equal(f.shares().length,0);
  assert.equal(f.downloads().length,1);
  const data=JSON.parse(f.downloads()[0].data);
  assert.equal(data.state.xp,2862);
  assert.equal(data.state.today,"2026-10-11");
  assert.equal(data.state.daily.length,10);
  assert.equal(data.state.daily[0].progress,3);
  assert.deepEqual(data.state.formalAttemptLog,[]);
  assert.match(f.downloads()[0].filename,/^scholar-garden-2026-10-11-\d{6}\.json$/);
  assert.equal(f.backups().length,1,"Only after requesting the file, record manual backup");
  assert.equal(f.buttons["daily-save-button"].disabled,false);
  assert.match(f.message(),/JSON download requested/);
});
test("Explicit iPad share invokes Files share for a complete validated JSON",async()=>{
  const f=fixture();await f.save("share");
  assert.equal(f.shares().length,1);
  const file=f.shares()[0].files[0];
  assert.equal(file.type,"application/json");
  assert.equal(JSON.parse(file.data).state.xp,2862);
  assert.equal(f.downloads().length,0);
  assert.equal(f.buttons["daily-share-button"].disabled,false);
  assert.match(f.message(),/Check that you actually saved/);
});
test("Cancelled share neither claims export nor creates manual backup",async()=>{
  const f=fixture({onShare:()=>Promise.reject(Object.assign(new Error("cancelled"),{name:"AbortError"}))});
  await f.save("share");
  assert.equal(f.shares().length,1);
  assert.equal(f.downloads().length,0);
  assert.equal(f.backups().length,0);
  assert.equal(f.buttons["daily-share-button"].disabled,false);
  assert.match(f.message(),/Share cancelled/);
});
test("Denied iPad share falls back to a JSON download, not silent failure",async()=>{
  const f=fixture({canShare:false});await f.save("share");
  assert.equal(f.shares().length,0);
  assert.equal(f.downloads().length,1);
  assert.equal(JSON.parse(f.downloads()[0].data).state.daily[0].progress,3);
  assert.match(f.message(),/download requested instead/);
});
test("A partial outdated export is blocked before download, share or backup",async()=>{
  const f=fixture({exported:{app:"lux-scholar-garden",state:{xp:2862,daily:[]}}});
  await f.save();
  assert.equal(f.downloads().length,0);
  assert.equal(f.shares().length,0);
  assert.equal(f.backups().length,0);
  assert.match(f.message(),/Export failed: Incomplete export/);
  assert.equal(f.buttons["daily-save-button"].disabled,false);
});
