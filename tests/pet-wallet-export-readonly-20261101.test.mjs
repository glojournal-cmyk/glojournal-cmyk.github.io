import test from "node:test";
import assert from "node:assert/strict";
import {includePetWalletBackup, inspectPetWalletBackup, PET_WALLET_KEY} from "../assets/pet-wallet-backup-20261030.js";
import {prepareLatest30DayExport} from "../assets/latest-30-day-export-20261023.js";

const day="2026-11-01";
const tasks=Array.from({length:10},(_,i)=>({id:"task-"+i,target:10,progress:0,done:false,planDate:day}));
const state=()=>({today:day,xp:2990,daily:tasks,dailyLog:{},dailyVocabByDay:{},
 dailyCompleteAwarded:{},formalAttemptLog:[],unlockedOutfits:["scholar"],
 unlockedScenes:["glasshouse"],games:{quadCircuit:{completed:2}}});
const wallet={species:"snow-owl",masteryPoints:144,petLevels:{"snow-owl":3},
 unlockedSecrets:{"night-spider":true},mpLedger:{"mastery-a":10},
 mpTransactions:[{id:"earned1",amount:10}],futureRewards:{newItem:true}};
const originalRaw=JSON.stringify(wallet,null,2);
const storage=(raw=originalRaw)=>({
 getItem:key=>key===PET_WALLET_KEY?raw:null,
 setItem:()=>{throw Error("Read-only exporter must not touch localStorage");},
 removeItem:()=>{throw Error("Read-only exporter must not erase localStorage");}
});
const base=s=>JSON.stringify({app:"lux-scholar-garden",version:10,state:s,petCompanion:wallet});
const exportFile=(s,disk)=>prepareLatest30DayExport(()=>s,()=>base(s),{
 readJournal:async()=>[],storage:disk,isHydrated:()=>true
});

test("Scholar + Pet export carries the full untouched localStorage wallet bytes",async()=>{
 const s=state(),before=JSON.stringify(s);
 const raw=await exportFile(s,storage());
 const file=JSON.parse(raw);
 assert.equal(file.state.xp,2990);
 assert.equal(file.state.daily.length,10);
 assert.equal(file.recent30Days.days.length,30);
 assert.equal(file.petWalletBackup.version,1);
 assert.equal(file.petWalletBackup.storageKey,PET_WALLET_KEY);
 assert.equal(file.petWalletBackup.raw,originalRaw);
 assert.deepEqual(JSON.parse(file.petWalletBackup.raw),wallet);
 assert.equal(JSON.stringify(s),before);
 assert.equal(inspectPetWalletBackup(file,storage()).status,"identical");
});

test("a Scholar-only export is honest when there is no Pet wallet",async()=>{
 const file=JSON.parse(await exportFile(state(),storage(null)));
 assert.equal(file.petWalletBackup,null);
 assert.equal(inspectPetWalletBackup(file,storage(null)).status,"absent");
 assert.equal(file.state.daily.length,10);
});

test("corrupt Pet wallet prevents a misleading complete export",async()=>{
 for(const raw of ["{broken",JSON.stringify({...wallet,masteryPoints:-1}),
    JSON.stringify({...wallet,petLevels:{"snow-owl":99}})]){
  await assert.rejects(exportFile(state(),storage(raw)),/invalid|valid JSON/i);
 }
});

test("MP changes while preparing a backup trigger a consistent recapture",async()=>{
 const updated=JSON.stringify({...wallet,masteryPoints:155,mpTransactions:[
   ...wallet.mpTransactions,{id:"earned2",amount:11}]});
 let reads=0;
 const disk={...storage(),
   getItem:key=>key===PET_WALLET_KEY?(++reads===1?originalRaw:updated):null};
 const file=JSON.parse(await exportFile(state(),disk));
 assert.equal(file.petWalletBackup.raw,updated);
 assert.equal(JSON.parse(file.petWalletBackup.raw).masteryPoints,155);
 assert.ok(reads>=4);
});

test("a perpetually mutating Pet wallet fails closed instead of sending mixed snapshots",async()=>{
 let reads=0;
 const disk={...storage(),getItem:key=>{
  if(key!==PET_WALLET_KEY)return null;
  return JSON.stringify({...wallet,masteryPoints:++reads});
 }};
 await assert.rejects(exportFile(state(),disk),/Learning progress changed while exporting/i);
 assert.equal(reads,6);
});

test("older Scholar-only JSON remains explicitly legacy, with no invented MP",()=>{
 const previous={app:"lux-scholar-garden",state:state()};
 assert.equal(inspectPetWalletBackup(previous,storage()).status,"legacy");
});

test("read-only Pet inspection flags a conflicting current MP wallet without rewriting it",()=>{
 const older=includePetWalletBackup({app:"lux-scholar-garden",state:state()},storage(originalRaw));
 const currentRaw=JSON.stringify({...wallet,masteryPoints:50,mpTransactions:[{id:"spend-1",amount:-94}]});
 const current=storage(currentRaw);
 const result=inspectPetWalletBackup(older,current);
 assert.equal(result.status,"conflict");
 assert.equal(result.incoming.masteryPoints,144);
 assert.equal(JSON.parse(current.getItem(PET_WALLET_KEY)).masteryPoints,50);
});

test("an absent installed wallet and corrupted installed wallet have distinct, non-writing results",()=>{
 const envelope=includePetWalletBackup({app:"lux-scholar-garden",state:state()},storage());
 assert.equal(inspectPetWalletBackup(envelope,storage(null)).status,"install");
 assert.throws(()=>inspectPetWalletBackup(envelope,storage("{corrupted")) ,/valid JSON/i);
});

test("a Scholar pet preview does not substitute for lossless Pet raw when source wallet is absent",()=>{
 const payload={app:"lux-scholar-garden",state:state(),petCompanion:wallet};
 const created=includePetWalletBackup(payload,storage(null));
 assert.deepEqual(created.petCompanion,wallet);
 assert.equal(created.petWalletBackup,null);
 assert.equal(inspectPetWalletBackup(created,storage(null)).status,"absent");
});
