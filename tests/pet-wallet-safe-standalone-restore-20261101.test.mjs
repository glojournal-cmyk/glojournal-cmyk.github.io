import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {includePetWalletBackup,inspectPetWalletBackup,
 restorePetWalletBackup,PET_WALLET_KEY} from "../assets/pet-wallet-backup-20261030.js";
import {commitToStorage,validatePlainBackup} from "../assets/standalone-progress-import-20261023.js";

const SCHOLAR_KEY="lux-scholar-garden-v1";
const todaysTasks=Array.from({length:10},(_,i)=>({
 id:"task"+i,target:10,progress:i===0?10:0,done:i===0
}));
const scholar=()=>({app:"lux-scholar-garden",version:10,
 state:{xp:2862,today:"2026-11-01",daily:todaysTasks,
  dailyLog:{},dailyCompleteAwarded:{},dailyVocabByDay:{},
  formalAttemptLog:[],unlockedOutfits:["autumn"],games:{quad:{points:20}}}});
const wallet={species:"snow-owl",masteryPoints:144,
 petLevels:{"snow-owl":2,"moss-hornling":4},
 unlockedSecrets:{"night-spider":true},
 mpLedger:{"mastery-1":10},
 mpTransactions:[{id:"earn1",amount:10}],
 customRewards:{observatory:true}};
const raw=JSON.stringify(wallet,null,2);
class Storage {
 constructor(entries={}){this.map=new Map(Object.entries(entries));this.writes=[];this.failFor=null;}
 getItem(key){return this.map.get(key)??null}
 setItem(key,value){this.writes.push([key,String(value)]);
  if(key===this.failFor)throw Error("QuotaExceededError");
  this.map.set(key,String(value));
 }
 removeItem(key){this.writes.push([key,null]);this.map.delete(key)}
}
const combined=()=>includePetWalletBackup(scholar(),new Storage({[PET_WALLET_KEY]:raw}));

test("modern Scholar + Pet import restores bytes exactly, only after verified Scholar write",()=>{
 const storage=new Storage();
 const file=validatePlainBackup(JSON.stringify(combined()));
 const result=commitToStorage(file,null,storage);
 assert.equal(result.saved.xp,2862);
 assert.equal(result.petWalletStatus,"restored");
 assert.equal(storage.getItem(PET_WALLET_KEY),raw);
 assert.equal(JSON.parse(storage.getItem(SCHOLAR_KEY)).state.xp,2862);
 assert.deepEqual(JSON.parse(storage.getItem(PET_WALLET_KEY)),wallet);
 const scholarIndex=storage.writes.findIndex(([key])=>key===SCHOLAR_KEY);
 const petIndex=storage.writes.findIndex(([key])=>key===PET_WALLET_KEY);
 assert.ok(scholarIndex>=0&&petIndex>scholarIndex,
  "Pet wallet must never be written before verified Scholar state");
});

test("reimport is idempotent; no MP or pet transaction duplicated",()=>{
 const storage=new Storage();
 const file=combined();
 commitToStorage(file,null,storage);
 const before=storage.getItem(PET_WALLET_KEY);
 const count=storage.writes.filter(([key])=>key===PET_WALLET_KEY).length;
 const second=commitToStorage(file,storage.getItem(SCHOLAR_KEY),storage);
 assert.equal(second.petWalletStatus,"identical");
 assert.equal(storage.getItem(PET_WALLET_KEY),before);
 assert.equal(storage.writes.filter(([key])=>key===PET_WALLET_KEY).length,count);
});

test("a different current wallet blocks ALL writes without adjusting spent MP",()=>{
 const now=JSON.stringify({...wallet,masteryPoints:50,
  mpTransactions:[{id:"spent",amount:-94}]});
 const storage=new Storage({[PET_WALLET_KEY]:now});
 assert.throws(()=>commitToStorage(combined(),null,storage),/Pet wallet conflict/i);
 assert.equal(storage.getItem(PET_WALLET_KEY),now);
 assert.equal(storage.getItem(SCHOLAR_KEY),null);
 assert.deepEqual(storage.writes,[]);
});

test("invalid modern Pet envelope is rejected before touching Scholar history",()=>{
 const invalid={...combined(),petWalletBackup:{version:1,
  storageKey:PET_WALLET_KEY,raw:JSON.stringify({masteryPoints:-1})}};
 const storage=new Storage();
 assert.throws(()=>validatePlainBackup(JSON.stringify(invalid)),/invalid/i);
 assert.throws(()=>commitToStorage(invalid,null,storage),/invalid/i);
 assert.equal(storage.getItem(SCHOLAR_KEY),null);
 assert.deepEqual(storage.writes,[]);
});

test("Scholar quota failure cannot create a new pet wallet",()=>{
 const storage=new Storage();storage.failFor=SCHOLAR_KEY;
 assert.throws(()=>commitToStorage(combined(),null,storage),/Import not verified/i);
 assert.equal(storage.getItem(PET_WALLET_KEY),null);
 assert.equal(storage.getItem(SCHOLAR_KEY),null);
 assert.ok(storage.writes.every(([key])=>key!==PET_WALLET_KEY));
});

test("Pet quota failure rolls back newly saved Scholar and does not change MP",()=>{
 const storage=new Storage();storage.failFor=PET_WALLET_KEY;
 assert.throws(()=>commitToStorage(combined(),null,storage),/Import not verified/i);
 assert.equal(storage.getItem(SCHOLAR_KEY),null);
 assert.equal(storage.getItem(PET_WALLET_KEY),null);
 assert.ok(storage.writes.some(([key])=>key===SCHOLAR_KEY));
 assert.ok(storage.writes.findIndex(([key])=>key===PET_WALLET_KEY)>
  storage.writes.findIndex(([key])=>key===SCHOLAR_KEY));
});

test("failed Pet import restores PREVIOUS Scholar bytes, not just an empty key",()=>{
 const existing=JSON.stringify({state:{xp:16,today:"2026-11-01",
  daily:todaysTasks,dailyLog:{},dailyCompleteAwarded:{},
  dailyVocabByDay:{},formalAttemptLog:[]},version:10});
 const storage=new Storage({[SCHOLAR_KEY]:existing});
 storage.failFor=PET_WALLET_KEY;
 assert.throws(()=>commitToStorage(combined(),existing,storage),/Import not verified/i);
 assert.equal(storage.getItem(SCHOLAR_KEY),existing);
 assert.equal(storage.getItem(PET_WALLET_KEY),null);
});

test("concurrent Pet tab creation during Scholar import cannot overwrite current wallet",()=>{
 const current=JSON.stringify({...wallet,masteryPoints:55,mpTransactions:[{id:"new",amount:55}]});
 const storage=new Storage();
 const origSet=storage.setItem.bind(storage);
 storage.setItem=(key,value)=>{
   origSet(key,value);
   if(key===SCHOLAR_KEY)storage.map.set(PET_WALLET_KEY,current);
 };
 assert.throws(()=>commitToStorage(combined(),null,storage),/Import not verified/i);
 assert.equal(storage.getItem(SCHOLAR_KEY),null);
 assert.equal(storage.getItem(PET_WALLET_KEY),current);
 assert.ok(storage.writes.every(([key])=>key!==PET_WALLET_KEY));
});

test("empty or legacy envelope never invents a Pet reward",()=>{
 const storage=new Storage();
 const noWallet={...scholar(),petWalletBackup:null};
 const result=commitToStorage(noWallet,null,storage);
 assert.equal(result.petWalletStatus,"absent");
 assert.equal(storage.getItem(PET_WALLET_KEY),null);
});

test("Home legacy import refuses modern combined backup rather than claiming full restore",()=>{
 const s=readFileSync("assets/daily-progress-save.js","utf8");
 const start=s.indexOf("async function restore(data, name, externalSafetyConfirmed=false)");
 const stop=s.indexOf("function mount()",start);
 assert.ok(start>0&&stop>start);
 const block=s.slice(start,stop);
 assert.match(block,/incoming\?\.petWalletBackup!==undefined/);
 assert.match(block,/import-progress\.html/);
 assert.ok(block.indexOf("incoming?.petWalletBackup!==undefined")<
   block.indexOf("store.getState().importProgress"),
   "legacy restore must be blocked before mutating the learner store");
});

test("standalone safety copy preserves the raw Pet wallet, not a lossy preview",()=>{
 const s=readFileSync("assets/standalone-progress-import-20261023.js","utf8");
 const start=s.indexOf("function collectSafetySnapshot(raw){");
 const stop=s.indexOf("function previewDetails()",start);
 assert.ok(start>0&&stop>start);
 const collect=new Function("localStorage","includePetWalletBackup","PAIRS",
  s.slice(start,stop)+"\nreturn collectSafetySnapshot;")(
  new Storage({[PET_WALLET_KEY]:raw}),includePetWalletBackup,[]);
 const result=JSON.parse(collect(JSON.stringify({state:scholar().state,version:10})));
 assert.equal(result.petWalletBackup.raw,raw);
 assert.equal(result.state.xp,2862);
});
