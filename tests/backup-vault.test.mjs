import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const vaultSource=readFileSync(new URL("../assets/backup-vault-20261011.js",import.meta.url),"utf8")
  .replace(/^export /gm,"");
function environment({failure=false}={}){
 const queueMicrotask=fn=>Promise.resolve().then(fn);
 const data=new Map(),storeNames=new Set();
 const db={
  objectStoreNames:{contains:name=>storeNames.has(name)},
  createObjectStore:name=>storeNames.add(name),
  transaction(){
   const tx={oncomplete:null,onerror:null,onabort:null,
    objectStore:()=>({
     put:(value,key)=>{
      if(failure){queueMicrotask(()=>{tx.error=new Error("Vault full");tx.onerror?.()});return}
      data.set(key,structuredClone(value));queueMicrotask(()=>tx.oncomplete?.());
     },
     get:key=>{const req={result:null,onsuccess:null,onerror:null};queueMicrotask(()=>{req.result=data.get(key)??null;req.onsuccess?.()});return req}
    })};
   return tx;
  }
 };
 const indexedDB={open:()=>{const req={result:null,onupgradeneeded:null,onsuccess:null,onerror:null};queueMicrotask(()=>{req.result=db;req.onupgradeneeded?.();req.onsuccess?.()});return req}};
 const storage=new Map();
 const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,v)=>storage.set(key,v),removeItem:key=>storage.delete(key)};
 const globalThis={};
 const create=new Function("indexedDB","localStorage","globalThis",
   vaultSource+";return {readBackup,putBackup,migrateOldBackups,AUTO_KEY,PREVIOUS_KEY,MANUAL_KEY};");
 return {vault:create(indexedDB,localStorage,globalThis),localStorage,data,globalThis};
}
function snapshot(xp,date="2026-10-10"){return {savedAt:date+"T22:00:00.000Z",day:date,done:6,total:10,
 data:JSON.stringify({app:"lux-scholar-garden",state:{xp,today:date,daily:[{id:"french-vocab",progress:20,target:30}]}})}}
test("Migrates backups only after verified IndexedDB write; never deletes primary Scholar progress",async()=>{
 const {vault,localStorage,data}=environment();
 localStorage.setItem("lux-scholar-garden-v1",JSON.stringify({state:{xp:2862}}));
 localStorage.setItem(vault.AUTO_KEY,JSON.stringify(snapshot(2748)));
 localStorage.setItem(vault.MANUAL_KEY,JSON.stringify(snapshot(544,"2026-09-30")));
 const migrated=await vault.migrateOldBackups();
 assert.equal(migrated.moved,2);
 assert.equal(localStorage.getItem(vault.AUTO_KEY),null);
 assert.equal(localStorage.getItem(vault.MANUAL_KEY),null);
 assert.equal(JSON.parse(localStorage.getItem("lux-scholar-garden-v1")).state.xp,2862);
 assert.equal(JSON.parse((await vault.readBackup(vault.AUTO_KEY)).data).state.xp,2748);
 assert.ok(data.has(vault.MANUAL_KEY));
});
test("Failed IndexedDB write leaves every local backup untouched",async()=>{
 const {vault,localStorage}=environment({failure:true});
 const backup=snapshot(2748);localStorage.setItem(vault.AUTO_KEY,JSON.stringify(backup));
 const result=await vault.migrateOldBackups();
 assert.equal(result.failed,1);assert.deepEqual(JSON.parse(localStorage.getItem(vault.AUTO_KEY)),backup);
});
test("A newer saved local backup always wins over an older vault copy",async()=>{
 const {vault,localStorage}=environment();
 await vault.putBackup(vault.AUTO_KEY,snapshot(2748));
 const newer=snapshot(2862,"2026-10-11");localStorage.setItem(vault.AUTO_KEY,JSON.stringify(newer));
 const found=await vault.readBackup(vault.AUTO_KEY);
 assert.equal(JSON.parse(found.data).state.xp,2862);
});
test("Corrupted backup cannot be stored over a valid copy",async()=>{
 const {vault}=environment();await vault.putBackup(vault.AUTO_KEY,snapshot(2748));
 await assert.rejects(vault.putBackup(vault.AUTO_KEY,{data:"broken"}),/Invalid backup/);
 assert.equal(JSON.parse((await vault.readBackup(vault.AUTO_KEY)).data).state.xp,2748);
});
