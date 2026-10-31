import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditBackupFile} from "../assets/backup-file-audit-20261031.js";
import {includePetWalletBackup,PET_WALLET_KEY} from "../assets/pet-wallet-backup-20261030.js";

const mockStorage=(wallet=null)=>({
 getItem:key=>key===PET_WALLET_KEY?wallet:null,
 setItem:()=>{throw Error("Read-only audit MUST NEVER write to device storage");},
 removeItem:()=>{throw Error("Read-only audit MUST NEVER remove progress");}
});
const pet={species:"snow-owl",masteryPoints:144,petLevels:{"snow-owl":2},
 unlockedSecrets:{"snow-owl":true},mpTransactions:[{id:"q1",amount:10}]};
const rawWallet=JSON.stringify(pet,null,2);
const day=i=>new Date(Date.UTC(2026,9,2+i)).toISOString().slice(0,10);
const full=()=>includePetWalletBackup({
 app:"lux-scholar-garden",version:10,
 exportedAt:"2026-10-31T10:00:00Z",
 state:{xp:2862,today:"2026-10-31",
  daily:Array.from({length:10},(_,i)=>({id:"t"+i,target:10,progress:i===0?10:0,done:i===0})),
  dailyLog:{"2026-10-30":{tasks:[{id:"t0",target:10,progress:10}]}},
  dailyCompleteAwarded:{"2026-10-30":true},
  dailyVocabByDay:{"2026-10-30":{french:{items:{bonjour:true}}}},
  formalAttemptLog:[{day:"2026-10-30",questionId:"q1",correct:true}],
  recoveryVocabByDay:{"2026-10-29":{latin:{completed:true}}},
  recoveryAwarded:{"2026-10-29:latin":true},
  unlockedOutfits:["day","library"],unlockedScenes:["garden","winter"],
  collectibles:["owl"],games:{"quad-circuit":{points:24}}
 },
 recent30Days:{periodDays:30,from:"2026-10-02",through:"2026-10-31",
  capturedAt:"2026-10-31T10:00:00Z",
  days:Array.from({length:30},(_,i)=>({date:day(i),status:"partial"}))}
},mockStorage(rawWallet));

test("complete downloaded Scholar JSON is audited without changing current XP or Pet MP",()=>{
 const original=full(),disk=mockStorage(rawWallet);
 const report=auditBackupFile(JSON.stringify(original),disk);
 assert.equal(report.status,"complete",report.message);
 assert.match(report.message,/No progress|verified/i);
 assert.deepEqual(Object.fromEntries(report.facts),{
  "Scholar XP":2862,"Study date":"2026-10-31","Daily tasks":"10 (1 complete)",
  "Saved dated records":1,"Formal answer history":1,"Recovery days":1,
  "Recovery award records":1,"Owned outfits":2,"Owned backgrounds":2,
  "Collectibles":1,"Games saved":1,"30-day manifest":"present",
  "Lossless Pet wallet":"included","Pet MP":144,"Pet levels":1,
  "Secret pets unlocked":1,"MP transactions":1
 });
 assert.equal(original.petWalletBackup.raw,rawWallet);
});

test("older/current deployed Scholar-only JSON prominently warns about missing Pet MP wallet",()=>{
 const backup=full();delete backup.petWalletBackup;
 const report=auditBackupFile(JSON.stringify(backup),mockStorage(rawWallet));
 assert.equal(report.status,"warning");
 assert.match(report.message,/cannot guarantee Pet MP/i);
 assert.equal(Object.fromEntries(report.facts)["Lossless Pet wallet"],"not included");
});

test("corrupt Pet envelope and partial Daily state never report complete",()=>{
 const corrupt=full();corrupt.petWalletBackup.raw='{"masteryPoints":-10}';
 const bad=auditBackupFile(JSON.stringify(corrupt),mockStorage(rawWallet));
 assert.equal(bad.status,"invalid");
 const partial=full();partial.state.daily=partial.state.daily.slice(0,6);
 const report=auditBackupFile(JSON.stringify(partial),mockStorage(rawWallet));
 assert.equal(report.status,"warning");assert.match(report.message,/10-task/i);
 assert.equal(auditBackupFile("{broken",mockStorage(rawWallet)).status,"invalid");
});

test("Pet diagnostic JSON is recognised but never mistaken for the full Scholar backup",()=>{
 const diagnostic={app:"lux-scholar-garden",type:"pet-wallet-diagnostic",
  petCompanion:pet,petWalletStorageRaw:rawWallet};
 const found=auditBackupFile(JSON.stringify(diagnostic),mockStorage());
 assert.equal(found.status,"pet-diagnostic");
 assert.match(found.message,/NOT a complete Scholar learning backup/);
 const mismatch={...diagnostic,petCompanion:{...pet,masteryPoints:2}};
 assert.equal(auditBackupFile(JSON.stringify(mismatch),mockStorage()).status,"invalid");
});

test("actual Home backup panel exposes separate read-only Verify button that cannot import",()=>{
 const source=readFileSync(new URL("../assets/daily-progress-save.js",import.meta.url),"utf8");
 assert.match(source,/id="daily-verify-file-button"/);
 assert.match(source,/id="daily-verify-file"/);
 assert.match(source,/id="daily-verify-result"/);
 assert.match(source,/auditBackupFile\(await file\.text\(\),localStorage\)/);
 const start=source.indexOf("panel.querySelector('#daily-verify-file').addEventListener");
 const end=source.indexOf("panel.querySelector('#daily-restore-apply')",start);
 assert.ok(start>0&&end>start,"Verify handler precedes explicit Import action");
 assert.doesNotMatch(source.slice(start,end),/importProgress\(|restore\(|setItem\(|putBackup\(/);
});

test("standalone Import safety JSON includes original Pet wallet bytes, not just a preview",()=>{
 const source=readFileSync(new URL("../assets/standalone-progress-import-20261023.js",import.meta.url),"utf8");
 const start=source.indexOf("function collectSafetySnapshot(raw){");
 const end=source.indexOf("\nfunction previewDetails()",start);
 assert.ok(start>0&&end>start);
 const collect=new Function("localStorage","includePetWalletBackup",
  source.slice(start,end)+"\nreturn collectSafetySnapshot;")(
   mockStorage(rawWallet),includePetWalletBackup);
 const data=JSON.parse(collect(JSON.stringify({state:full().state,version:10})));
 assert.equal(data.petWalletBackup.raw,rawWallet);
 assert.equal(data.petWalletBackup.storageKey,PET_WALLET_KEY);
 assert.equal(data.state.xp,2862);
});
