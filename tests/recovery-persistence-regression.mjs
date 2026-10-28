import assert from "node:assert/strict";
import {recoverProgressStorage} from "../assets/backup-vault-20261011.js";

const data=new Map();let mode="ok";let writes=0;let backupReadFault=false;
globalThis.localStorage={
 getItem(k){if(backupReadFault&&k==="lux-progress-auto-v1")throw Error("backup read failed");return data.get(k)??null},
 setItem(k,v){writes++;if(mode==="quota")throw Object.assign(new Error("quota"),{name:"QuotaExceededError"});if(mode==="no-op")return;data.set(k,v)},
 removeItem(k){data.delete(k)}
};
const state={xp:7902,unlockedOutfits:["day","halloween"],gameRewardByDay:{"2026-10-27":{game:1}},dailyLog:{"2026-10-27":{done:10,total:10}}};
const options={name:"lux-scholar-garden-v1",version:10,partialize:x=>x};
const store={
 getState:()=>state,
 setState:()=>{const snapshot=JSON.stringify({state,version:10});globalThis.localStorage.setItem(options.name,snapshot)},
 persist:{hasHydrated:()=>true,getOptions:()=>options}
};
const expected=()=>JSON.stringify({state,version:10});
assert.equal(await recoverProgressStorage(store),true,"normal recovery saves full state");
assert.equal(data.get(options.name),expected(),"outfits, games, daily records retained");
const attempts=writes;
assert.equal(await recoverProgressStorage(store),true,"already-saved data are verified");
assert.equal(writes,attempts,"verified state never needlessly rewritten");
state.xp++;
mode="quota";
assert.equal(await recoverProgressStorage(store),false,"quota failure not reported as saved");
assert.notEqual(data.get(options.name),expected(),"unsaved XP is not represented as durable");
mode="no-op";
assert.equal(await recoverProgressStorage(store),false,"silent dropped write detected");
mode="ok";
assert.equal(await recoverProgressStorage(store),true,"retry saves latest in-memory state");
assert.equal(data.get(options.name),expected(),"latest state retained after successful retry");
// Simulate an app restart by reading only the actual persisted bytes.
const reloaded=JSON.parse(data.get(options.name)).state;
assert.equal(reloaded.xp,state.xp,"XP must survive reload");
assert.deepEqual(reloaded.unlockedOutfits,state.unlockedOutfits,"outfit unlocks must survive reload");
assert.deepEqual(reloaded.gameRewardByDay,state.gameRewardByDay,"game receipts must survive reload");
assert.deepEqual(reloaded.dailyLog,state.dailyLog,"Daily completion must survive reload");

// Simulate a concurrent new answer arriving while the retry is writing.
let injected=false;
const originalSetState=store.setState;
store.setState=()=>{
  const prior=expected();
  globalThis.localStorage.setItem(options.name,prior);
  if(!injected){state.xp+=5;injected=true;}
};
state.xp+=1;
assert.equal(await recoverProgressStorage(store),false,"stale save must never be reported as current");
assert.notEqual(data.get(options.name),expected(),"concurrent progress must remain unsaved until retried");
store.setState=originalSetState;
assert.equal(await recoverProgressStorage(store),true,"concurrent newer answer should be saved on next retry");
assert.equal(JSON.parse(data.get(options.name)).state.xp,state.xp,"newest XP must survive retry");
// A damaged optional backup must not prevent saving the current learner state.
backupReadFault=true;
state.xp+=1;
assert.equal(await recoverProgressStorage(store),true,"optional backup read error must not block saving");
assert.equal(JSON.parse(data.get(options.name)).state.xp,state.xp,"latest learner XP survives backup read fault");
backupReadFault=false;
// A full primary store may be blocked by an obsolete backup occupying storage.
// The verified archive should release only that backup, then save the live state.
data.set("lux-progress-auto-v1",JSON.stringify({app:"lux-scholar-garden",savedAt:"2026-10-27T12:00:00Z",data:JSON.stringify({app:"lux-scholar-garden",state:{xp:100,daily:[]}})}));
const preserved=data.get("lux-progress-auto-v1");
const underlyingSet=globalThis.localStorage.setItem;
let archiveCleared=false;
globalThis.localStorage.setItem=(key,value)=>{
 if(key===options.name&&!archiveCleared)throw Object.assign(new Error("quota exceeded"),{name:"QuotaExceededError"});
 return underlyingSet(key,value);
};
globalThis.localStorage.removeItem=(key)=>{if(key==="lux-progress-auto-v1"){archiveCleared=true;data.delete(key);}else data.delete(key)};
state.xp+=1;
// This test cannot emulate IndexedDB archival in Node, so verify that an
// unavailable IndexedDB does NOT silently delete the original backup.
assert.equal(await recoverProgressStorage(store),false,"quota remains a failure when archive is unavailable");
assert.equal(data.get("lux-progress-auto-v1"),preserved,"backup must be retained when no verified archive exists");
globalThis.localStorage.setItem=underlyingSet;
assert.equal(await recoverProgressStorage(store),true,"live state saves after capacity is available");
assert.equal(JSON.parse(data.get(options.name)).state.xp,state.xp,"latest XP is saved after recovery");
console.log("PASS: saving retry, reload, outfit/game/daily preservation and concurrent progress race");
