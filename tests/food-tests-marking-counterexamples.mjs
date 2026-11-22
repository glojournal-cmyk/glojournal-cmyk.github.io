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
const cases = [
  ["bio-y8-food-tests-water-bath-explain", "Benedict’s is heated in hot water; ethanol is not heated for the emulsion test.", 2, 2],
  ["bio-y8-food-tests-water-bath-explain", "A hot-water bath heats Benedict’s reagent.", 1, 2],
  ["bio-y8-app-ethanol-safety", "Ethanol catches fire easily. Shake the sample with ethanol, then add water.", 0, 2],
  ["bio-y8-app-ethanol-safety", "Heat ethanol over a flame, then add water.", 0, 2],
  ["bio-y8-app-ethanol-safety", "Ethanol is highly flammable. Shake the sample with ethanol and then add water.", 1, 2],
  ["bio-y8-food-tests-brick-red-name", "brick red", 1, 1],
  ["bio-y8-food-tests-brick-red-name", "green, yellow, orange or brick-red", 0, 1],
];
const observed = cases.map(([id, answer, score, total]) => {
  const result = mark(id, answer);
  const pass = result.score === score && result.total === total;
  if (!pass) throw new Error(id + " expected " + score + "/" + total + " got " + JSON.stringify(result));
  return { id, answer, ...result };
});
console.log(JSON.stringify({ observed: observed.map(({ id, score, total, ok, pointResults }) => ({ id, score, total, ok, pointResults })) }, null, 2));
