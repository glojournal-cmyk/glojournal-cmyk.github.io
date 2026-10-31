import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {includePetWalletBackup,inspectPetWalletBackup,restorePetWalletBackup,
  PET_WALLET_KEY} from "../assets/pet-wallet-backup-20261030.js";

// Synthetic learner, with the REAL Pet localStorage key and current shape.
const payload=()=>({app:"lux-scholar-garden",version:10,
  state:{xp:2862,today:"2026-10-30",daily:[]}});
const wallet={species:"snow-owl",masteryPoints:144,
  petLevels:{"moss-hornling":4,"snow-owl":2},
  unlockedSecrets:{"snow-owl":true},mpLedger:{"mastery-topic":10},
  mpTransactions:[{id:"earn-1",amount:10}],
  careByPet:{"snow-owl":{energy:88}},customUnknownFutureProperty:{saved:true}};
const raw=JSON.stringify(wallet,null,2);
const disk=(seed=[])=>{
 const map=new Map(seed);
 return {getItem:k=>map.has(k)?map.get(k):null,
  setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),
  entries:()=>[...map.entries()]};
};
test("full Scholar JSON includes a byte-identical Pet wallet, not just a pet preview",()=>{
 const storage=disk([[PET_WALLET_KEY,raw]]);
 const file=includePetWalletBackup(payload(),storage);
 assert.equal(file.petWalletBackup.storageKey,PET_WALLET_KEY);
 assert.equal(file.petWalletBackup.raw,raw);
 assert.deepEqual(JSON.parse(file.petWalletBackup.raw),wallet);
 assert.equal(file.state.xp,2862);
 assert.deepEqual(storage.entries(),[[PET_WALLET_KEY,raw]],"export must not mutate wallet");
});
test("a fresh install restores MP, owl, levels, transactions, and unknown future fields exactly",()=>{
 const file=includePetWalletBackup(payload(),disk([[PET_WALLET_KEY,raw]]));
 const blank=disk();
 assert.equal(inspectPetWalletBackup(file,blank).status,"install");
 assert.deepEqual(restorePetWalletBackup(file,blank),{status:"restored",changed:true});
 assert.equal(blank.getItem(PET_WALLET_KEY),raw);
 assert.deepEqual(JSON.parse(blank.getItem(PET_WALLET_KEY)),wallet);
 assert.deepEqual(restorePetWalletBackup(file,blank),{status:"identical",changed:false},
  "reimport must never add MP or duplicate transactions");
});
test("a different wallet on iPad always wins without silent MP or unlock merging",()=>{
 const current={...wallet,masteryPoints:50,mpTransactions:[{id:"spend-1",amount:-94}]};
 const currentRaw=JSON.stringify(current);
 const storage=disk([[PET_WALLET_KEY,currentRaw]]);
 const backup=includePetWalletBackup(payload(),disk([[PET_WALLET_KEY,raw]]));
 assert.equal(inspectPetWalletBackup(backup,storage).status,"conflict");
 assert.deepEqual(restorePetWalletBackup(backup,storage),{status:"conflict",changed:false});
 assert.equal(storage.getItem(PET_WALLET_KEY),currentRaw,
  "an older high-MP wallet must not resurrect previously spent points");
});
test("legacy Scholar JSON never invents or removes a Pet wallet",()=>{
 const before=disk([[PET_WALLET_KEY,raw]]);
 assert.equal(inspectPetWalletBackup(payload(),before).status,"legacy");
 assert.deepEqual(restorePetWalletBackup(payload(),before),{status:"legacy",changed:false});
 const absent=includePetWalletBackup(payload(),disk());
 assert.equal(absent.petWalletBackup,null);
 assert.deepEqual(restorePetWalletBackup(absent,before),{status:"absent",changed:false});
 assert.equal(before.getItem(PET_WALLET_KEY),raw);
});
test("invalid incoming wallet cannot be imported or overwrite current data",()=>{
 const storage=disk([[PET_WALLET_KEY,raw]]);
 const corrupted={...payload(),petWalletBackup:{version:1,storageKey:PET_WALLET_KEY,
  raw:'{"masteryPoints":-9}'}};
 assert.throws(()=>inspectPetWalletBackup(corrupted,storage),/invalid/i);
 assert.throws(()=>restorePetWalletBackup(corrupted,storage),/invalid/i);
 assert.equal(storage.getItem(PET_WALLET_KEY),raw);
});
test("corrupt existing wallet is never replaced or silently reset",()=>{
 const bad='{"masteryPoints":"not-a-number","petLevels":{"snow-owl":-1}}';
 const storage=disk([[PET_WALLET_KEY,bad]]);
 const file=includePetWalletBackup(payload(),disk([[PET_WALLET_KEY,raw]]));
 assert.throws(()=>restorePetWalletBackup(file,storage),/invalid/i);
 assert.equal(storage.getItem(PET_WALLET_KEY),bad);
});
test("unreadable live wallet blocks a misleading complete export",()=>{
 const storage=disk([[PET_WALLET_KEY,'{"petLevels":null}']]);
 assert.throws(()=>includePetWalletBackup(payload(),storage),/invalid/i);
 assert.equal(storage.getItem(PET_WALLET_KEY),'{"petLevels":null}');
});
test("quota failure leaves the only backup and an empty wallet untouched",()=>{
 const storage=disk();
 storage.setItem=()=>{throw Object.assign(new Error("quota exceeded"),{name:"QuotaExceededError"})};
 const file=includePetWalletBackup(payload(),disk([[PET_WALLET_KEY,raw]]));
 assert.throws(()=>restorePetWalletBackup(file,storage),/quota exceeded/);
 assert.equal(storage.getItem(PET_WALLET_KEY),null);
 assert.equal(file.petWalletBackup.raw,raw);
});
test("live exporter and importer actually call the combined-wallet protection functions",()=>{
 const exporter=readFileSync(new URL("../assets/latest-30-day-export-20261023.js",import.meta.url),"utf8");
 const importer=readFileSync(new URL("../assets/daily-progress-save.js",import.meta.url),"utf8");
 assert.match(exporter,/const file=includePetWalletBackup/);
 assert.match(exporter,/JSON\.stringify\(latestWallet\)/);
 assert.match(importer,/inspectPetWalletBackup\(JSON\.parse\(data\)\)/);
 assert.match(importer,/currentData=JSON\.stringify\(includePetWalletBackup/);
 const durability=importer.indexOf("if(!correct)return status");
 const walletRestore=importer.indexOf("petResult=restorePetWalletBackup");
 assert.ok(durability>=0&&walletRestore>durability,
   "Pet wallet must never be installed before verified Scholar restore");
});
