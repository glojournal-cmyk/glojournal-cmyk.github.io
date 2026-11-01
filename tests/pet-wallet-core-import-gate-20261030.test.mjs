import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Exercise the actual runtime wrapper rather than a copied substitute.
const runtime=readFileSync(new URL("../assets/index-BLVOhKhN.js",import.meta.url),"utf8");
const start=runtime.indexOf("function patchedImportProgress(");
const end=runtime.indexOf("function patchedResetAll",start);
assert.ok(start>0&&end>start,"real Scholar import wrapper is available");
const wrapper=runtime.slice(start,end);
function fixture(existingPet=null){
 const data=new Map();
 if(existingPet!==null)data.set("lux-pet-companion-v1",existingPet);
 const writes=[],events=[];
 const localStorage={
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>{writes.push([key,value]);data.set(key,String(value))},
  removeItem:key=>data.delete(key)
 };
 let imported=0;
 const fakeWindow={dispatchEvent:e=>events.push(e.type)};
 class CustomEvent{constructor(type,info){this.type=type;this.detail=info?.detail}}
 const originalImportProgress=()=>{imported++;return {ok:true}};
 const fn=new Function("localStorage","window","originalImportProgress",
   "PET_REWARD_KEY","CustomEvent",wrapper+";return patchedImportProgress;")(
   localStorage,fakeWindow,originalImportProgress,"lux-pet-companion-v1",CustomEvent);
 return {fn,localStorage,writes,events,count:()=>imported};
}
const backup=(modern=false)=>JSON.stringify({app:"lux-scholar-garden",
 state:{xp:2862,daily:[]},petCompanion:{masteryPoints:144,
 petLevels:{"snow-owl":2},unlockedSecrets:{"snow-owl":true}},
 ...(modern?{petWalletBackup:{version:1,storageKey:"lux-pet-companion-v1",
   raw:JSON.stringify({masteryPoints:144,petLevels:{"snow-owl":2}})}}:{})});
test("legacy Scholar import cannot overwrite existing spent/current Pet wallet",()=>{
 const newer=JSON.stringify({masteryPoints:50,petLevels:{"snow-owl":5},
   unlockedSecrets:{"snow-owl":true},mpTransactions:[{id:"spent",amount:-94}]});
 const f=fixture(newer);
 assert.equal(f.fn(backup(false)).ok,true);
 assert.equal(f.count(),1);
 assert.equal(f.localStorage.getItem("lux-pet-companion-v1"),newer);
 assert.equal(f.writes.length,0,"legacy pet data must never touch existing wallet");
 assert.equal(f.events.length,0,"no fake MP restored event");
});
test("new combined file defers Pet wallet handling to verified outer importer",()=>{
 const f=fixture();
 assert.equal(f.fn(backup(true)).ok,true);
 assert.equal(f.localStorage.getItem("lux-pet-companion-v1"),null);
 assert.equal(f.writes.length,0);
 assert.equal(f.events.length,0);
});
test("old plain JSON still restores Pet on a fresh device without an existing wallet",()=>{
 const f=fixture();
 assert.equal(f.fn(backup(false)).ok,true);
 const restored=JSON.parse(f.localStorage.getItem("lux-pet-companion-v1"));
 assert.equal(restored.masteryPoints,144);
 assert.equal(restored.unlockedSecrets["snow-owl"],true);
 assert.ok(f.events.includes("scholar:pet-changed"));
});
