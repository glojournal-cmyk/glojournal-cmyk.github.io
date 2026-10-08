import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../assets/daily-task-presentation-20261004.js", import.meta.url), "utf8");
const start = source.indexOf("function hearthShift");
const end = source.indexOf("const KEPT_KEY");
const context = {};
vm.runInContext(source.slice(start, end), vm.createContext(context));
const { hearthShift, hearthStreak, hearthLine } = context;

assert.equal(hearthShift("2026-10-08", -1), "2026-10-07");
assert.equal(hearthShift("2026-10-01", -1), "2026-09-30");
assert.equal(hearthStreak(["2026-10-06", "2026-10-07", "2026-10-08"], "2026-10-08", true), 3);
assert.equal(hearthStreak(["2026-10-07"], "2026-10-08", false), 1);
assert.equal(hearthStreak(["2026-10-06"], "2026-10-08", false), 0);
assert.equal(hearthStreak(["2026-10-08"], "2026-10-08", true), 1);
assert.match(hearthLine(3, false, 2), /2 tasks left.*becomes 4/);
assert.match(hearthLine(0, false, 1), /1 task left.*chain starts/);
assert.match(hearthLine(1, true, 0), /Come back tomorrow to make it 2/);
assert.match(hearthLine(4, true, 0), /grows only if tomorrow is finished too/);
console.log("DAILY_HEARTH_QA passed");
