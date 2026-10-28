import assert from "node:assert/strict";
import {recoverProgressStorage} from "../assets/backup-vault-20261011.js";

const data=new Map();let mode="ok";let writes=0;
globalThis.localStorage={
 getItem(k){return data.get(k)??null},
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
console.log("PASS: saving retry, reload, outfit/game/daily preservation and concurrent progress race");
