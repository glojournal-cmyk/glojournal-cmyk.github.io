import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync(new URL("../assets/garden-life-20261007.js", import.meta.url), "utf8");
const sandbox = { localStorage: { getItem() { return null; }, setItem() {} }, setTimeout() {}, clearTimeout() {}, setInterval() {}, addEventListener() {} };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox, { filename: "garden-life-20261007.js" });
const api = sandbox.LuxGardenLife;
if (!api?.syncLife) throw new Error("LuxGardenLife missing");

const today = "2026-10-07";
let life = api.blankLife();
let step = api.syncLife(life, { studyDays: ["2026-09-01", "2026-09-02", "2026-10-07"], wateredOn: today, waterCount: 4 }, today);
if (step.life.basilDays.join() !== "2026-10-07") throw new Error("historical days must not fill the pot: " + step.life.basilDays);
if (step.life.basilDays.length !== 1) throw new Error("today should be stage 1");
if (step.life.bookmarkOn !== "2026-10-07") throw new Error("first study day should leave the bookmark");
if (!step.grew) throw new Error("today should count as growth");

step = api.syncLife(step.life, { studyDays: ["2026-09-01", "2026-09-02", "2026-10-07"], wateredOn: today, waterCount: 9 }, today);
if (step.life.basilDays.length !== 1 || step.grew) throw new Error("watering or a repeat must not grow the basil");

step = api.syncLife(step.life, { studyDays: ["2026-09-01", "2026-10-07", "2026-10-08"] }, "2026-10-08");
if (step.life.basilDays.join() !== "2026-10-07,2026-10-08") throw new Error("next study day should be stage 2");

let many = step.life;
for (let n = 9; n <= 20; n++) {
  const day = "2026-10-" + String(n).padStart(2, "0");
  many = api.syncLife(many, { studyDays: many.basilDays.concat([day]) }, day).life;
}
if (many.basilDays.length !== 7) throw new Error("basil must stop at 7, got " + many.basilDays.length);
if (many.secondDays.length !== 7) throw new Error("the next seven study days belong to the second pot, got " + many.secondDays.length);

let pots = api.blankLife();
let days = [];
for (let n = 1; n <= 8; n++) {
  const day = "2026-11-" + String(n).padStart(2, "0");
  days.push(day);
  pots = api.syncLife(pots, { studyDays: days.slice() }, day).life;
}
if (pots.basilDays.length !== 7 || pots.secondDays.join() !== "2026-11-08") {
  throw new Error("the seventh day cuts the sprig, and only the eighth starts the second pot: " + pots.secondDays);
}
if (api.changeOf(pots, "2026-11-07", true) !== "sprig") throw new Error("finishing the first pot should put the sprig on the desk");
if (api.changeOf(pots, "2026-11-08", true) !== "second") throw new Error("the next day should grow the second pot");
if (api.scoreLine("Correct 8 / 10. +12 XP") !== "8/10 · +12XP") throw new Error("score line should keep the mark and the XP");
if (!/second pot is waiting/i.test(api.plantLine(0, "second"))) throw new Error("an empty second pot should be waiting, not grown");

const quiet = api.weatherOf({ activity: {}, peDays: [], gameXpToday: 0 }, today);
if (quiet !== "still") throw new Error("empty day should be still, got " + quiet);
const minded = api.weatherOf({ activity: { [today]: 12 }, peDays: [today], gameXpToday: 4, gameRewardByDay: { [today]: { forma: 1 } } }, today);
if (minded !== "mind") throw new Error("a long study set should beat PE and one game, got " + minded);
const body = api.weatherOf({ activity: { [today]: 2 }, peDays: [today] }, today);
if (body !== "body") throw new Error("PE should beat a short set, got " + body);
const spark = api.weatherOf({ activity: {}, gameRewardByDay: { [today]: { forma: 1 } } }, today);
if (spark !== "spark") throw new Error("a game alone should light the lantern, got " + spark);

const pic = api.picture(step.life, { wateredOn: "2026-10-08", activity: { "2026-10-08": 4 } }, "2026-10-08");
if (pic.stage !== 2 || !pic.wet || pic.weather !== "mind") throw new Error("picture mismatch " + JSON.stringify(pic));
if (!api.potSvg(0, false).includes("ellipse") || !api.potSvg(7, true).includes("Sprig") && !api.potSvg(7, true).includes("translate(96")) throw new Error("pot art missing");
if (api.STAGE_LINES.length !== 8) throw new Error("need a line for stages 0 through 7");

if (!/pepper and lemon/i.test(api.replyFor("pot", { stage: 5, wet: false }))) throw new Error("stage 5 touch should smell of basil");
if (!/drop runs off/i.test(api.replyFor("pot", { stage: 2, wet: true }))) throw new Error("wet leaves should mention a drop");
if (!/still ahead/i.test(api.replyFor("pip", { stage: 1 }, 4))) throw new Error("locked stage should stay ahead");
if (api.replyFor("pip", { stage: 3 }, 2) !== api.STAGE_LINES[2]) throw new Error("a reached pip should recall that stage");
if (!/already wet/i.test(api.replyFor("water", { wet: true }))) throw new Error("watering twice should not pretend to pour again");
if (!/finds the soil/i.test(api.replyFor("water", { wet: false }))) throw new Error("first water of the day should pour");
if (!api.potSvg(3, true).includes("lux-sway") || !api.potSvg(3, true).includes("lux-dew")) throw new Error("pot should sway and show dew");

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
if (!html.includes("/assets/garden-life-20261007.js?v=20261007-loading8")) throw new Error("homepage is not loading the living garden");
if (!html.includes("garden-life-20261007.css?v=20261007-loading8")) throw new Error("homepage is missing the living garden css");

console.log("garden-life-qa ok");
