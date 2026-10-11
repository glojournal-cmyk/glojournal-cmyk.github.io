import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const core=readFileSync(new URL("../assets/index-BLVOhKhN.core.js",import.meta.url),"utf8");
const start=core.indexOf("let d=()=>{let e=a.partialize"), end=core.indexOf(",f=i.setState",start);
assert.ok(start>0&&end>start,"Zustand persistence guard must exist");
const factory=new Function("a","r","u","window","CustomEvent",core.slice(start,end)+";return d;");
class Event{constructor(type,props){this.type=type;this.detail=props.detail}}

test("Quota exceeded does not abort an answer and an event warns that progress is unsaved",()=>{
 const events=[],win={__luxStoreQuotaFailed:false,dispatchEvent:e=>events.push(e.detail)};
 const storage={setItem:()=>{throw Object.assign(new Error("The quota has been exceeded"),{name:"QuotaExceededError"})}};
 const persist=factory({partialize:x=>x,version:10,name:"lux-scholar-garden-v1"},()=>({xp:2862}),storage,win,Event);
 assert.doesNotThrow(persist);assert.doesNotThrow(persist);
 assert.deepEqual(events,[{saved:false,quota:true}]);assert.equal(win.__luxStoreQuotaFailed,true);
 storage.setItem=()=>true;
 assert.doesNotThrow(persist);assert.equal(win.__luxStoreQuotaFailed,false);
 assert.deepEqual(events.at(-1),{saved:true});
});
test("Unexpected persistence exceptions remain visible",()=>{
 const win={dispatchEvent:()=>{}};
 const persist=factory({partialize:x=>x,version:10,name:"lux-scholar-garden-v1"},()=>({}),{setItem:()=>{throw Error("Disk corruption")}},win,Event);
 assert.throws(persist,/Disk corruption/);
});

const saveCode=readFileSync(new URL("../assets/daily-progress-save.js",import.meta.url),"utf8");
const a=saveCode.indexOf("function freeDuplicateBackups()"),b=saveCode.indexOf("\nasync function save()",a);
assert.ok(a>0&&b>a,"Safe storage cleanup must exist");
const cleanCode=saveCode.slice(a,b);
function cleanupFixture({exported=true,approve=true,saveWorks=true}={}){
 const initial=JSON.stringify({state:{xp:2748,today:"2026-10-10",daily:[{id:"french-vocab",progress:20,target:30}]}});
 const db={"lux-scholar-garden-v1":initial,"lux-progress-auto-v1":"latest automatic copy",
  "lux-progress-auto-v1-previous":"older snapshot","lux-daily-manual-backup-v1":"old manual"};
 const getItem=k=>db[k]||null;let status="";
 const live={xp:2862,today:"2026-10-11",daily:[{id:"french-vocab",progress:3,target:30}]};
 const store={getState:()=>live,setState:()=>{if(saveWorks)db["lux-scholar-garden-v1"]=JSON.stringify({state:live})}};
 const localStorage={getItem,removeItem:k=>delete db[k]};
 const fn=new Function("store","localStorage","document","confirm","status","AUTO_KEY","SNAPSHOT_KEY","currentExportShared","QUOTA_RETRY_MS",
   "let lastAutoAttemptAt=0,quotaRetryAfter=0;"+cleanCode+";return freeDuplicateBackups;")(
    store,localStorage,{getElementById:()=>({hidden:false})},()=>approve,msg=>status=msg,
    "lux-progress-auto-v1","lux-daily-manual-backup-v1",exported,600000
 );
 fn();
 return {db,status};
}
test("No export and cancelled confirmation never remove a backup",()=>{
 for(const options of [{exported:false},{approve:false}]){
  const {db}=cleanupFixture(options);
  assert.ok(db["lux-progress-auto-v1-previous"]);
  assert.ok(db["lux-daily-manual-backup-v1"]);
 }
});
test("Confirmed cleanup preserves current state and latest automatic backup",()=>{
 const {db,status}=cleanupFixture();
 assert.equal(db["lux-progress-auto-v1"],"latest automatic copy");
 assert.equal(JSON.parse(db["lux-scholar-garden-v1"]).state.xp,2862);
 assert.equal(db["lux-progress-auto-v1-previous"],undefined);
 assert.equal(db["lux-daily-manual-backup-v1"],undefined);
 assert.match(status,/verified in iPad storage/i);
});
test("Cleanup never falsely claims current progress was saved if storage still fails",()=>{
 const {db,status}=cleanupFixture({saveWorks:false});
 assert.equal(db["lux-progress-auto-v1"],"latest automatic copy");
 assert.equal(JSON.parse(db["lux-scholar-garden-v1"]).state.xp,2748);
 assert.match(status,/could not be verified/i);
});

test("Error boundary never deletes backup storage or forces reload on quota",()=>{
 const start=core.indexOf("function Pc({error:e})"),end=core.indexOf("function Fc(",start);
 assert.ok(start>0&&end>start);
 const boundary=core.slice(start,end);
 assert.doesNotMatch(boundary,/luxReleaseStorage|location\\.reload\\(|lux_quota_reload/);
 assert.match(boundary,/Do not clear data or reinstall/);
});
