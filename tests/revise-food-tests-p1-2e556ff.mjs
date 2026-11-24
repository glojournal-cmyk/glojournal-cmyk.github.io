// Draft revision of five Food Tests P1 items. Not an approval.
// Run from the repository root: node tests/revise-food-tests-p1-2e556ff.mjs
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const topicPath = path.join(root, "content/topics/bio-y8-food-tests.json");
const data = JSON.parse(await readFile(topicPath, "utf8"));
const already = data.questions.find((q) => q.id === "bio-y8-app-ethanol-safety");
if (already && String(already.prompt).includes("must not be heated")) {
  console.log(JSON.stringify({ alreadyApplied: true }));
  process.exit(0);
}
const sha = (q) => createHash("sha256").update(JSON.stringify({
  format: q.format ?? null,
  prompt: q.prompt ?? null,
  stimulus: q.stimulus ?? null,
  options: q.options ?? null,
  answer: q.answer ?? null,
  taskLabel: q.task?.label ?? null,
  taskInstruction: q.task?.instruction ?? null,
})).digest("hex");
const before = new Map(data.questions.map((q) => [q.id, sha(q)]));
const byId = new Map(data.questions.map((q) => [q.id, q]));
const BATH = "a container of hot water used to heat Benedict's test evenly and safely";

function replaceFalseStatement(steps, replacement) {
  return (steps || []).map((step) => /required indirect heating method for ethanol|safer, even way to heat/.test(step) ? replacement : step);
}

for (const id of ["bio-y8-food-tests-water-bath-mc", "bio-y8-food-tests-water-bath-name"]) {
  const q = byId.get(id);
  const lead = q.format === "mc_single" ? "Which scientific term matches this description: " : "Name the scientific term: ";
  q.prompt = lead + BATH + ".";
  q.stimulus = { text: BATH };
  q.feedback.short = "water bath: " + BATH + ".";
  q.feedback.remember = "water bath = " + BATH + ". The ethanol emulsion test does not heat the ethanol.";
  q.feedback.steps = replaceFalseStatement(q.feedback.steps, "Check the precise source statement: " + BATH + ".");
}

const explain = byId.get("bio-y8-food-tests-water-bath-explain");
explain.prompt = "State two points about a water bath in food tests: what it is used for, and whether the ethanol emulsion test heats ethanol.";
explain.answer = {
  mode: "mark_points",
  totalMarks: 2,
  markPoints: ["heats Benedict's test evenly in hot water", "the ethanol emulsion test does not heat the ethanol"],
  modelAnswer: "A water bath heats Benedict's test evenly and safely. The ethanol emulsion test does not heat the ethanol.",
};
explain.feedback = {
  short: "Heat Benedict's test in a water bath. Do not heat ethanol in the emulsion test.",
  steps: [
    "Credit a point for heating Benedict's test evenly in hot water.",
    "Credit a separate point for stating that the ethanol emulsion test does not heat the ethanol.",
    "Do not accept heating ethanol as a required step of the emulsion test.",
    "Both points are required.",
  ],
  commonError: "Describing a water bath as the required way to heat ethanol.",
  remember: "water bath = " + BATH + ". The ethanol emulsion test does not heat the ethanol.",
};

const safety = byId.get("bio-y8-app-ethanol-safety");
safety.prompt = "Explain why ethanol must not be heated over a naked flame, and state how the ethanol emulsion test is carried out.";
safety.answer = {
  mode: "mark_points",
  totalMarks: 2,
  markPoints: ["ethanol is highly flammable", "shake the sample with ethanol, then add water, without heating the ethanol"],
  modelAnswer: "Ethanol is highly flammable, so it must not be heated over a naked flame. In the emulsion test, shake the sample with ethanol and then add water.",
};
safety.feedback = {
  short: "Ethanol is highly flammable and is not heated. Shake the sample with ethanol, then add water.",
  steps: [
    "ethanol is highly flammable, so do not heat it over a naked flame",
    "the emulsion test shakes the sample with ethanol and then adds water",
    "heating ethanol is not a required step",
    "Both points are required.",
  ],
  commonError: "Saying that the emulsion test requires ethanol to be heated.",
  remember: "Ethanol is highly flammable. The emulsion test does not heat it: shake with ethanol, then add water.",
};

const brick = byId.get("bio-y8-food-tests-brick-red-name");
brick.answer.accepted = ["brick-red", "brick red", "brickred"];
brick.feedback.commonError = "Giving the whole positive colour range, such as green, yellow or orange, when the question asks for the strong positive result.";

const changed = [...before.keys()].filter((id) => before.get(id) !== sha(byId.get(id)));
const expected = new Set(["bio-y8-food-tests-water-bath-mc","bio-y8-food-tests-water-bath-name","bio-y8-food-tests-water-bath-explain","bio-y8-app-ethanol-safety","bio-y8-food-tests-brick-red-name"]);
if (changed.length !== expected.size || changed.some((id) => !expected.has(id))) throw new Error("unexpected edits: " + changed.join(","));

const basic = new Set(["bio-y8-food-tests-iodine-solution-mc","bio-y8-food-tests-benedict-s-solution-mc","bio-y8-food-tests-biuret-solution-mc","bio-y8-food-tests-ethanol-emulsion-test-mc","bio-y8-food-tests-blue-black-mc","bio-y8-food-tests-brick-red-mc","bio-y8-food-tests-lilac-or-purple-mc","bio-y8-food-tests-cloudy-white-emulsion-mc","bio-y8-food-tests-water-bath-mc"]);
const ethanol = new Set(["bio-y8-food-tests-water-bath-mc","bio-y8-food-tests-water-bath-name","bio-y8-food-tests-water-bath-explain","bio-y8-app-ethanol-safety"]);
const rows = data.questions.map((q) => {
  const findings = [];
  if (ethanol.has(q.id)) findings.push({ severity: "P1", status: "revised-awaiting-independent-review", issue: "Removed the claim that heating ethanol is required." });
  if (q.id === "bio-y8-food-tests-brick-red-name") findings.push({ severity: "P1", status: "revised-awaiting-independent-review", issue: "Strong positive result now accepts only brick-red, brick red and brickred." });
  if (basic.has(q.id)) findings.push({ severity: "P2", status: "open", issue: "Foundation MCQ still has at least one out-of-topic distractor." });
  if (q.id.startsWith("bio-y8-food-tests-case-")) findings.push({ severity: "P2", status: "open", issue: "Scenario item in a 16-combination set repeated four times. Concept link not added." });
  if (q.format === "mark_points") findings.push({ severity: "open", status: "not-tested", issue: "No markPointAlternatives. Equivalent wording has not been tested." });
  const open = findings.some((f) => f.status === "open" || f.status === "not-tested");
  return {
    questionId: q.id,
    format: q.format,
    originalFingerprint: before.get(q.id),
    revisedFingerprint: before.get(q.id) === sha(q) ? null : sha(q),
    contentChanged: before.get(q.id) !== sha(q),
    qaFindings: findings,
    testEvidence: [],
    independentReviewerDecision: "pending",
    academicStatus: findings.length === 0 ? "not-individually-reviewed" : open ? "needs-revision" : "revised-awaiting-independent-review",
    approved: false,
  };
});
const register = {
  commitBase: "2e556ffcb48f6c7346b3b663f8058f57271b643d",
  topicFile: "content/topics/bio-y8-food-tests.json",
  round: "1-revision-draft",
  decision: "not-approved",
  approved: 0,
  questions: rows.length,
  not: ["independent-round-2", "permission-to-merge-main", "permission-to-disable-the-live-topic"],
  meaning: "No finding means the item has not been individually verified. It does not mean the item is wrong, and it is not approval.",
  fingerprint: "sha256 of JSON {format,prompt,stimulus,options,answer,taskLabel,taskInstruction}. Status is not part of the hash.",
  changedQuestionIds: changed,
  counts: {
    contentChanged: rows.filter((r) => r.contentChanged).length,
    needsRevision: rows.filter((r) => r.academicStatus === "needs-revision").length,
    revisedAwaitingIndependentReview: rows.filter((r) => r.academicStatus === "revised-awaiting-independent-review").length,
    notIndividuallyReviewed: rows.filter((r) => r.academicStatus === "not-individually-reviewed").length,
  },
  questionsRegister: rows,
};
await writeFile(topicPath, JSON.stringify(data, null, 2) + "\n");
await writeFile(path.join(root, "qa/academic-qa-bio-y8-food-tests-items.json"), JSON.stringify(register, null, 2) + "\n");
console.log(JSON.stringify(register.counts));
