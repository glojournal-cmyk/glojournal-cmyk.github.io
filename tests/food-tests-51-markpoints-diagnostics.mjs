// Academic QA diagnostic for the 51 Food Tests mark_points items other
// than the ethanol-safety question (which has a separate 62-case suite).
// Uses production R() matchers from both QuizSession bundles, without
// changing question data, feedback, scoring policies, or approval records.
// Run: node tests/food-tests-51-markpoints-diagnostics.mjs
// To save inspectable results: node tests/food-tests-51-markpoints-diagnostics.mjs --write
// If you want a non-zero process exit on academic mismatches: add --strict
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => readFileSync(path.join(root, rel), "utf8");
const bank = JSON.parse(read("content/topics/bio-y8-food-tests.json"));
const fixture = JSON.parse(read("qa/food-tests-51-markpoints-probes.json"));
const scorerPaths = [
  "assets/quiz-session-y8fix-20260920.js",
  "assets/quiz-session-rWAnuDVj.js",
];

function endOf(src, at) {
  const start = src.indexOf("{", at);
  if (start < 0) throw new Error("Expected function body");
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error("Unclosed scorer function");
}
function loadScorer(pathname) {
  const source = read(pathname);
  const start = source.indexOf("const MARK_SYNONYM_FAMILIES");
  const pointScorer = source.indexOf("function R(points,response");
  if (start < 0 || pointScorer < 0) {
    throw new Error("Could not extract mark_points scorer from " + pathname);
  }
  // Mirrors the actual Biology mark_points branch:
  // R([point], studentResponse, [answer.markPointAlternatives?.[index] || []])
  return new Function(source.slice(start, endOf(source, pointScorer)) +
    "\nreturn R;")();
}
const scorers = scorerPaths.map(loadScorer);
const rowsInBank = bank.questions.filter(q =>
  q.format === "mark_points" && q.id !== "bio-y8-app-ethanol-safety");
const byId = new Map(rowsInBank.map(q => [q.id, q]));
if (rowsInBank.length !== 51 || fixture.rows.length !== 51 ||
    new Set(fixture.rows.map(x => x.questionId)).size !== 51 ||
    fixture.rows.some(row => !byId.has(row.questionId))) {
  throw new Error("51-question test coverage is missing, duplicated or stale");
}
function mark(scorer, question, response) {
  return question.answer.markPoints.map((point, index) =>
    scorer([point], response,
      [question.answer.markPointAlternatives?.[index] || []]) === 1);
}
const rows = fixture.rows.map(item => {
  const q = byId.get(item.questionId);
  const total = q.answer.markPoints.length;
  const probes = [
    ["model", q.answer.modelAnswer || q.answer.markPoints.join("; "), total],
    ["paraphrase", item.paraphraseFull, total],
    ["contradiction", item.contradiction, 0],
  ];
  if (total > 1) probes.splice(2, 0,
    ["single-point", q.answer.markPoints[0], 1]);
  return {
    questionId: item.questionId,
    marks: total,
    cases: probes.map(([kind, answer, expected]) => {
      const pointResults = scorers.map(r => mark(r, q, answer));
      if (JSON.stringify(pointResults[0]) !== JSON.stringify(pointResults[1])) {
        throw new Error("Two QuizSession bundles disagree: " + q.id + " " + kind);
      }
      const actual = pointResults[0].filter(Boolean).length;
      return { kind, answer, expected, actual,
        pointResults: pointResults[0], pass: actual === expected };
    }),
  };
});
const cases = rows.flatMap(q => q.cases);
const byType = Object.fromEntries(
  ["model", "paraphrase", "single-point", "contradiction"].map(kind => {
    const subset = cases.filter(c => c.kind === kind);
    return [kind, {
      cases: subset.length,
      pass: subset.filter(c => c.pass).length,
      fail: subset.filter(c => !c.pass).length,
    }];
  })
);
const summary = {
  questions: rows.length,
  cases: cases.length,
  pass: cases.filter(c => c.pass).length,
  fail: cases.filter(c => !c.pass).length,
  byType,
  underCreditQuestionIds: rows.filter(r =>
    r.cases.some(c => c.kind === "paraphrase" && !c.pass))
    .map(r => r.questionId),
  overCreditQuestionIds: rows.filter(r =>
    r.cases.some(c => c.kind === "contradiction" && !c.pass))
    .map(r => r.questionId),
  affectedQuestions: rows.filter(r => r.cases.some(c => !c.pass)).length,
};
if (summary.questions !== 51 || summary.cases !== 196) {
  throw new Error("Expected exactly 51 questions and 196 cases");
}
const result = {
  kind: "food-tests-51-markpoints-node-diagnostic",
  fixturePath: "qa/food-tests-51-markpoints-probes.json",
  scorerPaths,
  academicApproval: 0,
  independentAcademicQA: "pending",
  notes: [
    "Not an approval or an instruction to change main.",
    "Academic expectations for individual paraphrases and contradictions require independent verification.",
    "A model response passing does not establish broad marking fairness.",
  ],
  summary, rows,
};
if (process.argv.includes("--write")) {
  writeFileSync(path.join(root, "qa/food-tests-51-markpoints-node-result.json"),
    JSON.stringify(result, null, 2) + "\n");
}
console.log(JSON.stringify({kind:result.kind,summary,approved:0},null,2));
if (process.argv.includes("--strict") && summary.fail) process.exitCode = 1;
