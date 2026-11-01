import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Run the actual automatic-backup signature function, not a replacement
// algorithm. Entirely synthetic records; never read real learner storage.
const source=readFileSync(new URL("../assets/daily-progress-save.js",import.meta.url),"utf8");
const start=source.indexOf("function backupSignature(data) {");
const end=source.indexOf("\nlet autoSaveBusy=false;",start);
assert.ok(start>0&&end>start,"production autosave signature is present");
const backupSignature=new Function(source.slice(start,end)+"\nreturn backupSignature;")();

const full=()=>({
 app:"lux-scholar-garden",version:10,exportedAt:"2026-10-31T09:00:00.000Z",
 state:{
  xp:2862,today:"2026-10-31",
  daily:Array.from({length:10},(_,i)=>({id:i?"t"+i:"french-vocab",target:30,progress:i,done:false})),
  dailyCompleteAwarded:{"2026-10-30":true},
  dailyLog:{"2026-10-30":{tasks:[{id:"french-vocab",target:30,progress:30}]}},
  recoveryVocabByDay:{"2026-10-29":{french:{items:{"v-001":true}}}},
  collectibles:["herb","owl"],unlockedOutfits:["library"],unlockedScenes:["glasshouse"],
  games:{"quad-circuit":{points:42}},
  rewardLedgerByDay:{"2026-10-31":{"practice":4}}
 },
 petWalletBackup:{version:1,storageKey:"lux-pet-companion-v1",
   raw:JSON.stringify({masteryPoints:144,petLevels:{"snow-owl":2},
     unlockedSecrets:{"snow-owl":true},mpTransactions:[]})},
 recent30Days:{periodDays:30,through:"2026-10-31",
  capturedAt:"2026-10-31T09:00:00.000Z",
  days:[{date:"2026-10-30",done:10,total:10,status:"completed"},
        {date:"2026-10-31",done:0,total:10,status:"partial"}]}
});

test("unchanged learning and Pet data does not create a new backup every 15 seconds",()=>{
 const a=full(),b=structuredClone(a);
 b.exportedAt="2026-10-31T09:00:15.000Z";
 b.recent30Days.capturedAt="2026-10-31T09:00:15.000Z";
 assert.equal(backupSignature(JSON.stringify(a)),backupSignature(JSON.stringify(b)));
 assert.equal(a.recent30Days.capturedAt,"2026-10-31T09:00:00.000Z",
   "signature must never alter the exported JSON itself");
});

test("real XP, task completion and dated Recovery proof still force a new backup",()=>{
 const original=backupSignature(JSON.stringify(full()));
 for(const mutate of [
  s=>{s.state.xp++},
  s=>{s.state.daily[0].progress++},
  s=>{s.state.dailyCompleteAwarded["2026-10-29"]=true},
  s=>{s.state.recoveryVocabByDay["2026-10-29"].french.items["v-002"]=true},
  s=>{s.recent30Days.days[1].done=1},
  s=>{s.recent30Days.days[1].status="completed"},
 ]){
  const next=full();mutate(next);
  assert.notEqual(backupSignature(JSON.stringify(next)),original);
 }
});

test("Pet MP, owl unlocks, wardrobe and game reward changes still force backup",()=>{
 const original=backupSignature(JSON.stringify(full()));
 for(const mutate of [
  s=>{const pet=JSON.parse(s.petWalletBackup.raw);pet.masteryPoints=154;
      s.petWalletBackup.raw=JSON.stringify(pet)},
  s=>{const pet=JSON.parse(s.petWalletBackup.raw);pet.unlockedSecrets["night-spider"]=true;
      s.petWalletBackup.raw=JSON.stringify(pet)},
  s=>{s.state.unlockedOutfits.push("winter")},
  s=>{s.state.unlockedScenes.push("night")},
  s=>{s.state.games["quad-circuit"].points=44},
  s=>{s.state.rewardLedgerByDay["2026-10-31"].practice=6}
 ]){
  const next=full();mutate(next);
  assert.notEqual(backupSignature(JSON.stringify(next)),original);
 }
});

test("legacy files without a 30-day manifest and malformed input remain safe",()=>{
 const a=full(),b=full();delete a.recent30Days;delete b.recent30Days;
 b.exportedAt="2026-11-01T10:00:00Z";
 assert.equal(backupSignature(JSON.stringify(a)),backupSignature(JSON.stringify(b)));
 assert.equal(backupSignature("{broken"),"{broken");
});
