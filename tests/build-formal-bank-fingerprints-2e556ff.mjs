// Rebuild the formal-bank fingerprint inventory and the default Live Daily map.
// Run from a checkout of commit 2e556ff or the QA branch that still contains
// those source files: node tests/build-formal-bank-fingerprints-2e556ff.mjs
// Writes qa/*.jsonl and qa/*.json next to the repository root.
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COMMIT = "2e556ffcb48f6c7346b3b663f8058f57271b643d";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const independentFormats = ["typed_exact","typed_short","typed_equivalent","spelling_restore","controlled_translation","mark_points","extended_response","practical_design","calculation","unordered_set"];
const regressionIds = new Set(["T1-073","T1-075","bio-y8-app-bmi-60-150","chem-y8-energy-changes-profile-exo-apply"]);
const regressionRef = "tests/academic-qa-food-numeric-20261122.test.mjs@" + COMMIT;

const sha = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const readJson = async (rel) => JSON.parse(await readFile(path.join(root, rel), "utf8"));

function markScheme(q) {
  return { format: q.format ?? null, prompt: q.prompt ?? null, stimulus: q.stimulus ?? null, options: q.options ?? null, answer: q.answer ?? null };
}
function catalogReasons(topic) {
  const reasons = [];
  if (topic.status !== "enabled") reasons.push("status:" + topic.status);
  const enabled = Number(topic.enabled ?? topic.questions ?? 0);
  if (enabled < 15) reasons.push("enabled-below-15");
  if (topic.formats && !independentFormats.some((f) => Number(topic.formats[f]) > 0)) reasons.push("no-independent-format");
  return reasons;
}

const catalog = await readJson("content/catalog.json");
const seen = new Set();
const catalogTopics = [];
for (const topic of catalog.topics || []) {
  const key = topic.subject + "\0" + topic.year + "\0" + topic.topicId;
  if (seen.has(key)) continue;
  seen.add(key);
  catalogTopics.push(topic);
}
const defaultYear8 = new Set();
const excludedYear8 = [];
for (const topic of catalogTopics.filter((t) => Number(t.year) === 8)) {
  const reasons = catalogReasons(topic);
  if (reasons.length) excludedYear8.push({ topicId: topic.topicId, subject: topic.subject, reasons });
  else defaultYear8.add(topic.topicId);
}
const year9Ids = catalogTopics.filter((t) => Number(t.year) === 9).map((t) => t.topicId);

const rows = [];
function addQuestion(q, meta) {
  if (!q || typeof q !== "object" || !q.id) return;
  const covered = regressionIds.has(q.id) || String(q.id).startsWith("bio-y8-food-tests-case-");
  const inPool = defaultYear8.has(meta.topicId);
  rows.push({
    questionId: q.id,
    conceptId: q.conceptId ?? null,
    sourceFile: meta.sourceFile,
    subject: meta.subject ?? null,
    year: meta.year ?? null,
    topicId: meta.topicId ?? null,
    format: q.format ?? null,
    status: q.status ?? null,
    preview: q.preview ?? null,
    formalField: Object.prototype.hasOwnProperty.call(q, "formal") ? "present" : "absent",
    markSchemeSha256: sha(markScheme(q)),
    feedbackSha256: sha(q.feedback ?? null),
    qaEvidence: covered ? [regressionRef] : [],
    qaStatus: covered ? "regression-covered" : "not-recorded",
    approvalEvidence: "none",
    liveDaily: inPool ? "default-year8-pool" : "outside-default-pool",
  });
}

const topicDir = path.join(root, "content/topics");
for (const name of (await readdir(topicDir)).filter((n) => n.endsWith(".json")).sort()) {
  const data = JSON.parse(await readFile(path.join(topicDir, name), "utf8"));
  if (!Array.isArray(data.questions)) continue;
  for (const q of data.questions) addQuestion(q, { sourceFile: "content/topics/" + name, subject: data.subject, year: data.year, topicId: data.topicId });
}
const maths = await readJson("assets/math-study/math-y9-indices.json");
for (const q of maths.questions || []) addQuestion(q, { sourceFile: "assets/math-study/math-y9-indices.json", subject: "maths", year: q.year ?? 9, topicId: q.topicId || "math-y9-indices" });

const known = new Set(rows.map((r) => r.questionId));
const delta = await readJson("content/school-update-20260926/delta.json");
let deltaAdded = 0;
for (const topic of delta.topics || []) {
  for (const q of topic.questions || []) {
    if (!q?.id || known.has(q.id)) continue;
    known.add(q.id);
    deltaAdded++;
    addQuestion(q, { sourceFile: "content/school-update-20260926/delta.json", subject: topic.subject, year: topic.year, topicId: topic.topicId });
  }
}

const poolRows = rows.filter((r) => r.liveDaily === "default-year8-pool");
const summary = {
  commit: COMMIT,
  kind: "formal-bank-fingerprint-inventory",
  not: ["academic-approval-list", "academic-rejection-list", "permission-to-deploy-a-credit-gate"],
  approvalEvidenceMeaning: "none means no per-question academic approval record is stored here. It does not mean the question was judged wrong, and it must not be used to disable the existing bank.",
  fingerprint: "sha256 of JSON {format,prompt,stimulus,options,answer}. feedbackSha256 is separate.",
  questions: rows.length,
  distinctQuestionIds: new Set(rows.map((r) => r.questionId)).size,
  approvalEvidence: { none: rows.length },
  qaStatus: rows.reduce((acc, r) => (acc[r.qaStatus] = (acc[r.qaStatus] || 0) + 1, acc), {}),
  liveDaily: rows.reduce((acc, r) => (acc[r.liveDaily] = (acc[r.liveDaily] || 0) + 1, acc), {}),
  formalField: rows.reduce((acc, r) => (acc[r.formalField] = (acc[r.formalField] || 0) + 1, acc), {}),
  defaultYear8PoolQuestions: poolRows.length,
  defaultYear8PoolTopics: defaultYear8.size,
};
const sourceMap = {
  commit: COMMIT,
  kind: "live-daily-question-source-map",
  not: ["academic-approval-list", "ipad-e2e", "complete-vocab-or-recovery-enumeration"],
  chain: [
    "assets/index-BLVOhKhN.js buildYear8DailyV2(state, getTopicCatalog, readCurriculumLearning())",
    "readCurriculumLearning() reads localStorage lux-topic-learning-v1. This map uses an empty object, the fresh-profile default.",
    "assets/daily-curriculum-20261004.js curriculumTopics(subject, 8, getTopicCatalog, learning)",
    "getTopicCatalog is core function EC: content/catalog.json topics for that subject and year",
    "A Year 8 topic enters the default pool only when status is enabled, enabled questions are at least 15, and formats contain an independent recall format.",
    "Opening the locked route loads the topic with core function TC: fetch /content/topics/${topicId}.json, then merge content/school-update-20260926/delta.json when that topic id is present.",
    "Year 9 curriculumTopics requires learning[topicId] === true. With an empty learning map, no Year 9 topic is in the default Daily pool.",
  ],
  defaultYear8: {
    topics: defaultYear8.size,
    questions: poolRows.length,
    bySubject: poolRows.reduce((acc, r) => (acc[r.subject] = (acc[r.subject] || 0) + 1, acc), {}),
  },
  excludedYear8: {
    topics: excludedYear8.length,
    reasonCounts: excludedYear8.reduce((acc, row) => { for (const reason of row.reasons) acc[reason] = (acc[reason] || 0) + 1; return acc; }, {}),
  },
  year9CatalogTopics: year9Ids.length,
  year9DefaultDaily: "not drawn unless the device learning flag marks the topic taught",
  schoolDelta20260926: { topics: (delta.topics || []).length, questionIdsAddedBeyondTopicFiles: deltaAdded, draw: "merged only when that topic id is loaded; these sampled topics are Year 9" },
  separateSourcesNotEnumerated: [
    "Year 8 Latin and French vocab tasks use mode=y8vocab and assets/daily-vocab-20261003.js. They are not the topic JSON pool.",
    "Recovery, exam-revision and V8 focused practice use other loaders and are not this default Daily pool.",
  ],
  excludedYear8Topics: excludedYear8,
};
await mkdir(path.join(root, "qa"), { recursive: true });
await writeFile(path.join(root, "qa/formal-bank-fingerprints-2e556ff.jsonl"), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
await writeFile(path.join(root, "qa/formal-bank-fingerprints-2e556ff.summary.json"), JSON.stringify(summary, null, 2) + "\n");
await writeFile(path.join(root, "qa/live-daily-source-map-2e556ff.json"), JSON.stringify(sourceMap, null, 2) + "\n");
console.log(JSON.stringify({ questions: rows.length, defaultYear8Questions: poolRows.length, defaultYear8Topics: defaultYear8.size, deltaAdded }, null, 2));
