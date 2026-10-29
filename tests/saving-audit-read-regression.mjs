import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
const html=fs.readFileSync(new URL("../saving-audit.html",import.meta.url),"utf8");
for(const key of ["unlockedOutfits","equippedOutfit","unlockedScenes","equippedScene","gameRewardByDay","qualifyingGameByDay","rewardLedgerByDay","masteryPoints","mpLedger","petLevels","dailyCompleteAwarded"]){
 assert.ok(html.includes(key),"Audit missing saved field: "+key);
}
assert.ok(html.includes("Number.isFinite(state.xp)"),"Main save must validate XP rather than only JSON parse");
assert.ok(html.includes("Number.isFinite(pet.masteryPoints)"),"Pet save must validate MP rather than only JSON parse");
const start=html.indexOf("function read(key){"),end=html.indexOf("function run(){",start);
assert.ok(start>0&&end>start,"Audit read function missing");
function check(getItem){return vm.runInNewContext(html.slice(start,end)+"\nread('test')",{localStorage:{getItem}})}
assert.equal(check(()=>JSON.stringify({state:{xp:144}})).valid,true);
assert.equal(check(()=>"{bad").valid,false);
assert.equal(check(()=>"[1,2]").valid,false);
const failed=check(()=>{throw new Error("Storage blocked")});
assert.equal(failed.valid,false);
assert.match(failed.error,/Storage access failed/);
console.log("PASS: Audit fields, valid/corrupt JSON and blocked storage reads");
