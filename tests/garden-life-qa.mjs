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

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
if (!html.includes("/assets/garden-life-20261007.js?v=20261007-loading6")) throw new Error("homepage is not loading the living garden");
if (!html.includes("garden-life-20261007.css?v=20261007-loading6")) throw new Error("homepage is missing the living garden css");

console.log("garden-life-qa ok");
