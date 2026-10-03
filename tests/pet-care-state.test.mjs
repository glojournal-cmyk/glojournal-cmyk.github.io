import assert from "node:assert/strict";
globalThis.localStorage = (() => {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    clear() { data.clear(); },
  };
})();

globalThis.CustomEvent = class {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};

globalThis.window = { dispatchEvent() {} };

const mod = await import("../pet/pet-care-state.js?v=20261003-care1");
const t0 = new Date("2026-09-27T12:00:00").getTime();

let summary = mod.getCareSummary({ now: t0 });
assert.ok(summary.care.bond === 0, "new pet starts at 0 Bond");
assert.ok(summary.care.energy === 100, "new pet starts at 100 Energy");

let result = mod.performPetAction("pat", { now: t0 });
assert.ok(result.ok && result.bondGained === 1, "first pat earns 1 Bond");

result = mod.performPetAction("pat", { now: t0 + 1000 });
assert.ok(!result.ok && result.code === "daily-limit", "pat reward is limited daily");

for (let i = 0; i < 3; i += 1) {
  mod.awardBond(2, { key: `study:${i}`, now: t0 + 2000 + i });
}
mod.awardBond(5, { key: "evolution", now: t0 + 6000 });
summary = mod.getCareSummary({ now: t0 + 7000 });
assert.ok(summary.care.bond === 8, "daily Bond cap is 8");

const raw = JSON.parse(localStorage.getItem(mod.PET_KEY));
raw.care.bond = 30;
raw.care.energy = 60;
raw.care.lastEnergyUpdateAt = t0;
raw.care.daily = { day: "2026-09-27", bondEarned: 0, actionCounts: {}, rewardKeys: {} };
raw.careByPet[raw.species] = raw.care;
localStorage.setItem(mod.PET_KEY, JSON.stringify(raw));

result = mod.performPetAction("play", { now: t0 });
assert.ok(result.ok && result.energy === 48 && result.bondGained === 2, "play costs 12 Energy and earns 2 Bond");

summary = mod.getCareSummary({ now: t0 + 60 * 60 * 1000 });
assert.ok(summary.care.energy === 54, "Energy regenerates by 6 per hour");

console.log("pet-care-state tests passed");

const savedSpecies = JSON.parse(localStorage.getItem(mod.PET_KEY));
savedSpecies.species = "moon-puff";
localStorage.setItem(mod.PET_KEY, JSON.stringify(savedSpecies));
assert.equal(mod.getCareSummary({now:t0}).care.bond, 0, "Each companion starts with its own Bond");
assert.equal(mod.performPetAction("pat", {now:t0}).bondGained, 1);
savedSpecies.species = "moss-hornling";
const afterSwitch = JSON.parse(localStorage.getItem(mod.PET_KEY));
afterSwitch.species = "moss-hornling";
localStorage.setItem(mod.PET_KEY, JSON.stringify(afterSwitch));
assert.equal(mod.getCareSummary({now:t0}).care.bond, 32, "Switching back preserves the original companion's Bond");
