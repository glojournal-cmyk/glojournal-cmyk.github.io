import fs from "node:fs";
import path from "node:path";

const corePath = "assets/index-BLVOhKhN.core.js";
const wrapperPath = "assets/index-BLVOhKhN.js";
const core = fs.readFileSync(corePath, "utf8");
const wrapper = fs.readFileSync(wrapperPath, "utf8");

const outfits = [
  ["companion-moss-hornling", 1],
  ["companion-moon-puff", 2],
  ["companion-inkling", 3],
  ["companion-sprig-dragon", 4],
  ["companion-pebble-wisp", 5],
  ["companion-star-toadlet", 7],
  ["companion-velvet-batling", 9],
  ["companion-antler-bean", 12],
  ["companion-mothling", 15],
  ["companion-bloom-snail", 20],
];

const errors = [];
const checks = [];
const ok = (name, pass, detail = "") => {
  checks.push({ name, pass, detail });
  if (!pass) errors.push(name + (detail ? `: ${detail}` : ""));
};

for (const [id, target] of outfits) {
  const marker = `id:\`${id}\``;
  const i = core.indexOf(marker);
  const slice = i >= 0 ? core.slice(i, i + 620) : "";
  ok(`${id} definition`, i >= 0);
  ok(`${id} category`, slice.includes("category:\`Companion\`"));
  ok(`${id} locked target`, slice.includes(`needIf:{companionMasteries:${target}}`), `expected ${target}`);
  const asset = path.join("art", "doll", `${id}.webp`);
  ok(`${id} asset exists`, fs.existsSync(asset), asset);
  if (fs.existsSync(asset)) {
    const buf = fs.readFileSync(asset);
    ok(`${id} valid WebP`, buf.length > 1000 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP", `${buf.length} bytes`);
  }
}

ok("exact companion count", (core.match(/id:\`companion-[^\`]+\`/g) || []).length === 10);
ok("new player companion outfits start locked", core.includes("unlockedOutfits:[\`day\`]"));
ok(
  "baseline initialized once from current mastered topics",
  wrapper.includes("if (state.companionWardrobeBaselineMastered == null)") &&
    wrapper.includes("patch.companionWardrobeBaselineMastered = Object.values(state.topicStats || {}).filter((row) => row?.state === \"mastered\").length")
);
ok(
  "companion mastery progress subtracts baseline",
  core.includes("companionMasteries:Math.max(0,MwM(n)-Math.max(0,Number(e.companionWardrobeBaselineMastered??MwM(n))))")
);
ok("companion mastery metric is supported", core.includes("\`companionMasteries\`"));
ok("unlock text identifies new Masteries", core.includes("new Masteries"));

fs.mkdirSync("test-results", { recursive: true });
fs.writeFileSync(
  "test-results/companion-wardrobe-qa.json",
  JSON.stringify({ passed: errors.length === 0, checks, errors }, null, 2)
);

if (errors.length) {
  console.error("Companion Wardrobe QA failed:");
  for (const error of errors) console.error("-", error);
  process.exit(1);
}

console.log(`Companion Wardrobe QA passed: ${checks.length} checks, 10 locked outfits, assets and mastery baseline verified.`);
