// Runs the Food Tests marking cases against the live scorer in
// assets/quiz-session-y8fix-20260920.js and the topic file on this branch.
// This records what the marker does. It does not approve any question.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quiz = readFileSync(path.join(root, "assets/quiz-session-y8fix-20260920.js"), "utf8");
const core = readFileSync(path.join(root, "assets/index-BLVOhKhN.core.js"), "utf8");
function endOf(src, at) {
  const start = src.indexOf("{", at);
  let depth = 0;
  for (let j = start; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) return j + 1; }
  }
  throw new Error("unclosed");
}
const asAt = core.indexOf("function AS(");
const iAt = quiz.indexOf("function I(e){\n const values");
const parts = [
  "function d" + core.slice(asAt + "function AS".length, endOf(core, asAt)),
  quiz.slice(iAt, endOf(quiz, iAt)),
  quiz.slice(quiz.indexOf("function CY("), endOf(quiz, quiz.indexOf("function CY("))),
  quiz.slice(quiz.indexOf("function scienceProse"), endOf(quiz, quiz.indexOf("function scienceProse"))),
  quiz.slice(quiz.indexOf("function scienceConclusionEquivalent"), endOf(quiz, quiz.indexOf("function scienceConclusionEquivalent"))),
  quiz.slice(quiz.indexOf("const MARK_SYNONYM_FAMILIES"), endOf(quiz, quiz.indexOf("function R(points,response"))),
];
const api = new Function(parts.join("\n") + "\nreturn {I, scienceProse, scienceConclusionEquivalent, d, R, CY};")();
const bank = JSON.parse(readFileSync(path.join(root, "content/topics/bio-y8-food-tests.json"), "utf8"));
const by = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
function mark(id, answer) {
  const q = by[id];
  if (q.format === "mark_points") {
    const pointResults = q.answer.markPoints.map((point, index) => api.R([point], answer, [q.answer.markPointAlternatives?.[index] || []]) === 1);
    const score = pointResults.filter(Boolean).length;
    const total = q.answer.markPoints.length;
    const ok = score >= (q.answer.requireFullMarks ? total : Math.max(1, Math.ceil(total * 0.7)));
    return { score, total, ok, pointResults };
  }
  const direct = api.I(q);
  const proseHit = !direct.some(api.CY) && direct.some((value) => api.scienceProse(value) === api.scienceProse(answer));
  const clean = (value) => api.d(String(value)).replace(/^(?:the|a|an)\s+/, "");
  const accepted = direct.map(clean).filter(Boolean);
  const given = clean(answer);
  const exact = accepted.includes(given);
  const equivalent = !exact && api.scienceConclusionEquivalent(accepted, given);
  const score = proseHit || exact || equivalent ? 1 : 0;
  return { score, total: 1, ok: score === 1, proseHit, exact, equivalent };
}
// Acceptance criteria: positive paraphrases, partial credit, negative/unsafe
// procedures. This is deliberately a RED test against the 2e556ff scorer.
// Failing does not change live content or approve any question.
const cases = [
  ["correct: plain-language fire risk + procedure",
   "Ethanol catches fire easily. Shake the sample with ethanol, then add water.", 2],
  ["correct: scientific risk + procedure",
   "Ethanol is highly flammable. Shake the sample with ethanol and then add water.", 2],
  ["correct: equivalent mixing instruction",
   "Ethanol is flammable, so we should mix the food with ethanol and then add water.", 2],
  ["correct: ignition paraphrase",
   "Alcohol ignites easily. Mix the sample with ethanol before adding water.", 2],
  ["partial: safety alone",
   "Ethanol is very flammable. Never use a naked flame.", 1],
  ["partial: procedure alone",
   "I would shake the sample with ethanol and then add water.", 1],
  ["wrong: heat ethanol over flame",
   "Heat ethanol over a flame, then add water.", 0],
  ["partial: correctly states danger but proposes flame",
   "Ethanol is flammable, so I will heat it over a naked flame before adding water.", 1],
  ["partial: correctly states danger but reverses procedure",
   "Ethanol is flammable. Pour water into the sample, then heat ethanol over a flame.", 1],
  ["partial: says ethanol flammable but only adds water",
   "Ethanol is flammable. Add only water to the sample.", 1],
  ["partial: safety correct but says without shaking",
   "Ethanol is flammable. Add ethanol and water to the food without shaking.", 1],
  ["wrong: reversed order without safety explanation",
   "Water and ethanol are mixed. Add water then ethanol.", 0]
];
const results = cases.map(([name, answer, expected]) => {
  const {score, total, ok, pointResults} = mark("bio-y8-app-ethanol-safety", answer);
  return {name, answer, expected, actual:score, total, ok,
    pointResults, pass:score===expected && total===2};
});
const failures=results.filter(row=>!row.pass);
console.log(JSON.stringify({
  kind: "food-tests-ethanol-marking-acceptance",
  source: "assets/quiz-session-y8fix-20260920.js",
  approval: "none",
  total: results.length, passed:results.length-failures.length,
  failed:failures.length, results
}, null, 2));
if(failures.length) process.exitCode=1;
