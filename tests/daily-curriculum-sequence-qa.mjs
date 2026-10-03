import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync("assets/index-BLVOhKhN.js", "utf8");
const catalog = JSON.parse(fs.readFileSync("content/catalog.json", "utf8"));
const segment = source.slice(source.indexOf("const YEAR8_ASSIGNED_SUBJECTS ="), source.indexOf("let normalizing = false;"));
const context = {
  URLSearchParams,
  Number,
  Math,
  SUBJECT_LABELS: { latin: "Latin", french: "French", biology: "Biology", chemistry: "Chemistry", physics: "Physics" },
  YEAR8_MASTERY_SUBJECTS: ["latin", "french"],
  DAILY_SUBJECTS: ["latin", "french", "biology", "chemistry", "physics"],
  getTopicCatalog: (subject, year) => catalog.topics.filter((row) => row.subject === subject && row.year === year),
  normalizeTopicStat: (raw) => ({ attempted: raw.attempted || 0, state: raw.state || "learning", recentOutcomes: raw.recentOutcomes || [] }),
  topicTitle: (_state, id) => catalog.topics.find((row) => row.topicId === id)?.title || id,
  todayKey: () => "2026-09-27",
  adaptiveFocus: () => ({ subject: "biology", reason: "continue" }),
  focusAttemptsToday: () => 0,
  focusHref: () => "/study/biology/practise",
  vocabGateState: () => ({ correct: 0, attempts: 0, progress: 0 }),
  topicMatchesYear: () => true,
  FRENCH_DAILY_HREF: "",
};
vm.createContext(context);
vm.runInContext(`${segment}\nthis.plan = buildAdaptiveDaily; this.review = year8ReviewPlan;`, context);

const state = { today: "2026-09-27", year: 9, daily: [], topicStats: {
  "la-y8-perfect-cues": { attempted: 20, state: "practising" },
} };
const review = context.review(state);
const plan = context.plan(state);
const languageTasks = plan.filter((task) => task.id === "year8-long-review" || task.id === "y8-mastery");
assert(languageTasks.some((task) => task.reviewSubject === "latin" || task.assignedSubject === "latin"));
for (const task of languageTasks) {
  const topic = task.reviewTopic || task.assignedTopic;
  if ((task.reviewSubject || task.assignedSubject) === "latin") assert.equal(topic, "la-y8-stage-1-vocabulary");
  assert.match(task.title, /[Pp]racti[cs]e/);
  assert.match(task.href, /mode=standard/);
  assert.equal(new URLSearchParams(task.href.split("?")[1]).get("task"), task.id);
  assert.equal(task.progress, 0);
}
assert.equal(review.topicId, review.subject === "latin" ? "la-y8-stage-1-vocabulary" : "fr-y8-s01-quick-rules");

// An old random perfect-tense assignment is replaced, while completed work is retained.
const previous = { ...state, daily: [
  { id: "year8-long-review", planDate: state.today, reviewSubject: "latin", reviewTopic: "la-y8-perfect-cues", href: "/study/latin/practise?mode=year8long", progress: 0 },
  { id: "y8-mastery", planDate: state.today, assignedSubject: "latin", assignedTopic: "la-y8-perfect-cues", assignedLabel: "Perfect cues", href: "/study/latin/practise?mode=mastery", progress: 0 },
] };
const repaired = context.plan(previous);
assert.equal(repaired.find((task) => task.id === "year8-long-review").reviewTopic, review.topicId);
assert.equal(repaired.find((task) => task.id === "y8-mastery").assignedTopic,
  repaired.find((task) => task.id === "y8-mastery").assignedSubject === "latin" ? "la-y8-stage-1-vocabulary" : "fr-y8-s01-quick-rules");

const withPractice = { ...state, topicStats: { ...state.topicStats,
  "la-y8-stage-1-vocabulary": { attempted: 10, state: "practising", recentOutcomes: Array.from({ length: 10 }, () => ({ date: state.today })) },
} };
const readyPlan = context.plan(withPractice);
const latinReady = readyPlan.find((task) => task.reviewSubject === "latin" || task.assignedSubject === "latin");
assert.match(latinReady.href, /mode=(year8long|mastery)/);
if (latinReady.id === "y8-mastery") assert.equal(latinReady.progress, 0, "Practice attempts must not complete mastery");

const frenchPractice = { ...state, topicStats: { ...state.topicStats,
  "fr-y8-s01-quick-rules": { attempted: 10, state: "practising", recentOutcomes: Array.from({ length: 10 }, () => ({ date: state.today })) },
} };
const readyMastery = context.plan(frenchPractice).find((task) => task.id === "y8-mastery");
assert.equal(readyMastery.assignedTopic, "fr-y8-s01-quick-rules");
assert.equal(readyMastery.progress, 0);
assert.equal(readyMastery.masteryStartAttempts, 10);
const afterTwo = context.plan({ ...frenchPractice, daily: [readyMastery], topicStats: { ...frenchPractice.topicStats,
  "fr-y8-s01-quick-rules": { attempted: 12, state: "practising", recentOutcomes: Array.from({ length: 12 }, () => ({ date: state.today })) },
} }).find((task) => task.id === "y8-mastery");
assert.equal(afterTwo.progress, 2);

console.log("DAILY_CURRICULUM_SEQUENCE_QA passed: foundation first, old advanced assignment repaired, practice prerequisite");
