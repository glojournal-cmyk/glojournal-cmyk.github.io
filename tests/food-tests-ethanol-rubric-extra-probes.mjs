// Academic probes outside the 22 green cases. A failing run means the
// current rubric still mis-scores a correct or contradictory answer.
// This does not approve any question and does not change the scorer.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(path.join(root, "assets/food-tests-ethanol-rubric-20261122.js"), "utf8");
const score = new Function(src.replace("export ", "") + "\nreturn scoreFoodTestsEthanolSafety")();
const cases = [
  ["caution against premixing should not cancel a correct method", "Ethanol is flammable. Shake the sample with ethanol then add water. Do not mix ethanol and water before shaking.", 2],
  ["past participle shaken, water was then added", "The food sample was shaken with ethanol. Water was then added. Ethanol is flammable.", 2],
  ["after expresses the correct order", "Ethanol is flammable. Add water after shaking the sample with ethanol.", 2],
  ["non-flammable contradicts safety", "Ethanol is non-flammable. Shake the sample with ethanol then add water.", 1],
  ["will not catch fire is still a denial", "The ethanol will not catch fire. Shake the sample with ethanol, then add water.", 1],
];
const results = cases.map(([name, answer, expected]) => {
  const got = score(answer);
  return { name, expected, actual: got.score, pointResults: got.pointResults, pass: got.score === expected };
});
const failed = results.filter((row) => !row.pass);
console.log(JSON.stringify({ kind: "ethanol-extra-probes", passed: results.length - failed.length, total: results.length, results }, null, 2));
if (failed.length) process.exitCode = 1;
