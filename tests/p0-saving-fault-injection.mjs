import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

// Run the actual bundled Zustand persistence middleware inside a small mocked environment.
// This is a fault-injection regression test, not an iPad hardware test.
const source=fs.readFileSync(new URL("../assets/index-BLVOhKhN.core.js",import.meta.url),"utf8");
const start=source.indexOf("vw=(e,t)=>(n,r,i)=>");
const end=source.indexOf(",yw={daily_complete:",start);
assert(start>=0&&end>start,"Bundled persistence function not found");
const middleware=source.slice(start,end).replace(/^vw=/,"");
const statuses=[];
const backing=new Map();
let mode="ok";
const storage={
  getItem(k){if(mode==="read-error")throw Error("read blocked");return backing.get(k)??null},
  setItem(k,v){if(mode==="quota")throw Object.assign(Error("quota exceeded"),{name:"QuotaExceededError"});if(mode==="silent")return;if(mode==="generic")throw Error("disk blocked");backing.set(k,v)},
  removeItem(k){backing.delete(k)}
};
const window={localStorage:storage,dispatchEvent(e){statuses.push(e.detail)},__luxStoreQuotaFailed:false};
const ctx=vm.createContext({window,gw:fn=>({getItem:k=>{const v=fn().getItem(k);return v?JSON.parse(v):null},setItem:(k,v)=>fn().setItem(k,JSON.stringify(v)),removeItem:k=>fn().removeItem(k)}),_w:fn=>(...args)=>Promise.resolve().then(()=>fn(...args)),CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},console,JSON,Error,String,Promise,Number,Object,Set,Map});
const persist=vm.runInContext("("+middleware+")",ctx);
function serialize(obj){return JSON.stringify(obj)}
function store(){
 let state;
 const api={setState(update){state={...state,...update}},getState(){return state}};
 const creator=persist((set,get)=>({xp:0,gameRewardByDay:{},unlockedOutfits:["day"],setXP:x=>set({xp:x})}),{name:"test-scholar"});
 state=creator(update=>api.setState(update),()=>state,api);
 return {api,get:()=>state};
}
const s=store();
await new Promise(resolve=>s.api.persist.onFinishHydration(resolve));
assert.equal(s.api.persist.hasHydrated(),true,"hydration completed before tests");
s.get().setXP(12);
assert.equal(JSON.parse(backing.get("test-scholar")).state.xp,12,"normal write saved");
mode="quota";s.get().setXP(13);
assert.equal(JSON.parse(backing.get("test-scholar")).state.xp,12,"quota must not replace durable state");
assert.equal(window.__luxStoreQuotaFailed,true,"quota failure flagged");
assert(statuses.some(x=>x.saved===false&&x.quota===true),"quota failure signalled");
mode="ok";s.get().setXP(14);
assert.equal(JSON.parse(backing.get("test-scholar")).state.xp,14,"retry catches up");
assert.equal(window.__luxStoreQuotaFailed,false,"success clears failure");
mode="silent";assert.throws(()=>s.get().setXP(15),/verification failed/,"silent write detected");
assert.equal(JSON.parse(backing.get("test-scholar")).state.xp,14,"silent write does not change durable state");
mode="generic";assert.throws(()=>s.get().setXP(16),/disk blocked/,"general IO errors detected");
assert(statuses.some(x=>x.saved===false&&x.quota===false),"general save failure signalled");
mode="ok";s.get().setXP(17);
assert.equal(JSON.parse(backing.get("test-scholar")).state.xp,17,"save recovers");
console.log("PASS: normal, quota, read-back mismatch, non-quota error and retry");
