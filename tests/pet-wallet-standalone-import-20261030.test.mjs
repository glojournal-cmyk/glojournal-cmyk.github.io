import test from "node:test";
import assert from "node:assert/strict";
import {commitToStorage,validatePlainBackup} from "../assets/standalone-progress-import-20261023.js";
import {includePetWalletBackup,PET_WALLET_KEY} from "../assets/pet-wallet-backup-20261030.js";

const KEY="lux-scholar-garden-v1";
const tasks=Array.from({length:10},(_,i)=>({id:"task-"+i,target:10,progress:0,done:false}));
const progress=()=>({app:"lux-scholar-garden",version:10,
 state:{xp:2862,today:"2026-10-30",daily:tasks,dailyLog:{},
 dailyCompleteAwarded:{},dailyVocabByDay:{},formalAttemptLog:[]}});
const pet={species:"snow-owl",masteryPoints:144,petLevels:{"snow-owl":2,"moss-hornling":4},
 unlockedSecrets:{"snow-owl":true},mpLedger:{first:10},mpTransactions:[{id:"one",amount:10}]};
const petRaw=JSON.stringify(pet);
function disk(rows=[],failKey=null){
 const data=new Map(rows);
 return {getItem:k=>data.has(k)?data.get(k):null,
  setItem:(k,v)=>{if(k===failKey)throw Error("quota denied");data.set(k,String(v))},
  removeItem:k=>data.delete(k)};
}
const file=()=>includePetWalletBackup(progress(),disk([[PET_WALLET_KEY,petRaw]]));
test("standalone Scholar import safely restores a modern combined JSON on empty device",()=>{
 const source=validatePlainBackup(JSON.stringify(file())),storage=disk();
 const result=commitToStorage(source,null,storage);
 assert.equal(result.saved.xp,2862);
 assert.equal(storage.getItem(PET_WALLET_KEY),petRaw);
 assert.equal(JSON.parse(storage.getItem(KEY)).state.xp,2862);
 assert.ok(result.linkedCount>=1);
 // Reimporting never duplicates MP, rewards or unlocks.
 commitToStorage(source,storage.getItem(KEY),storage);
 assert.equal(storage.getItem(PET_WALLET_KEY),petRaw);
 assert.equal(JSON.parse(storage.getItem(PET_WALLET_KEY)).masteryPoints,144);
});
test("standalone import never replaces an existing pet with different earned/spent MP",()=>{
 const now=JSON.stringify({...pet,masteryPoints:37,mpTransactions:[{id:"spent",amount:-107}]});
 const storage=disk([[PET_WALLET_KEY,now]]);
 commitToStorage(file(),null,storage);
 assert.equal(storage.getItem(PET_WALLET_KEY),now);
});
test("standalone import rolls back Pet wallet when Scholar progress fails to save",()=>{
 const storage=disk([],KEY);
 assert.throws(()=>commitToStorage(file(),null,storage),/not verified/i);
 assert.equal(storage.getItem(PET_WALLET_KEY),null);
 assert.equal(storage.getItem(KEY),null);
});
test("standalone import rejects malformed bundled wallet before any state mutation",()=>{
 const storage=disk();
 const bad={...progress(),petWalletBackup:{version:1,storageKey:PET_WALLET_KEY,
  raw:'{"petLevels":{"snow-owl":0}}'}};
 assert.throws(()=>validatePlainBackup(JSON.stringify(bad)),/invalid/i);
 assert.throws(()=>commitToStorage(bad,null,storage),/invalid/i);
 assert.equal(storage.getItem(KEY),null);
});
test("old Scholar-only backups stay valid and never erase an existing wallet",()=>{
 const storage=disk([[PET_WALLET_KEY,petRaw]]);
 const prior=validatePlainBackup(JSON.stringify(progress()));
 commitToStorage(prior,null,storage);
 assert.equal(storage.getItem(PET_WALLET_KEY),petRaw);
});

test("legacy JSON cannot silently merge secret unlocks into an existing Pet wallet",()=>{
 const current=JSON.stringify({species:"moss-hornling",masteryPoints:7,
   petLevels:{"moss-hornling":4},unlockedSecrets:{},mpTransactions:[{id:"spent",amount:-5}]});
 const storage=disk([[PET_WALLET_KEY,current]]);
 const legacy={...progress(),petCompanion:{species:"snow-owl",masteryPoints:144,
   petLevels:{"snow-owl":2},unlockedSecrets:{"snow-owl":true,"night-spider":true}}};
 const result=commitToStorage(validatePlainBackup(JSON.stringify(legacy)),null,storage);
 assert.equal(result.saved.xp,2862);
 assert.equal(storage.getItem(PET_WALLET_KEY),current,
   "import must never alter MP, levels, transactions OR hidden unlocks without consent");
});
test("a valid legacy Pet companion can still be restored onto an empty device",()=>{
 const storage=disk();
 const legacy={...progress(),petCompanion:pet};
 const result=commitToStorage(validatePlainBackup(JSON.stringify(legacy)),null,storage);
 assert.equal(result.saved.xp,2862);
 assert.deepEqual(JSON.parse(storage.getItem(PET_WALLET_KEY)),pet);
});

test("a concurrent Pet tab creating a wallet after import preview must not be overwritten",()=>{
 const current=JSON.stringify({species:"moss-hornling",masteryPoints:74,
   petLevels:{"moss-hornling":5},unlockedSecrets:{"night-spider":true}});
 const rows=new Map();
 let checks=0,writes=0;
 const storage={
   getItem:k=>{
     if(k===PET_WALLET_KEY && ++checks===2) rows.set(k,current);
     return rows.get(k)??null;
   },
   setItem:(k,v)=>{if(k===PET_WALLET_KEY)writes++;rows.set(k,String(v))},
   removeItem:k=>rows.delete(k)
 };
 const outcome=commitToStorage(file(),null,storage);
 assert.equal(outcome.saved.xp,2862);
 assert.equal(rows.get(PET_WALLET_KEY),current);
 assert.equal(writes,0,"concurrent live wallet must not be replaced");
 assert.equal(outcome.linkedCount,0);
});
