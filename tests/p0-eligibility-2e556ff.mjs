// Characterization tests for Lux et Labor commit 2e556ff.
// Documents current P0 behaviour. Does not modify the app or main.
// Rerun: node p0-eligibility-2e556ff.mjs
const COMMIT = "2e556ffcb48f6c7346b3b663f8058f57271b643d";
const EXPECTED = {
  "mastery-v2-20261018.js": "5ddf9bd5e165294928d543ec8132b58a911b9fc96bd468e85c5acda933a8c92d",
  "daily-session-credit-20261021.js": "a802fdb1e7307cfe5f249753c756b07b7e553005de84906da54da7118e36c05d",
  "daily-curriculum-20261004.js": "12f17bea7f61f7fcb99f8e9cb02514dcfe000462f405bee862699edc2fee9489",
  "index-BLVOhKhN.core.js": "565e190951fd139fe860849c46b8bdeb2d3cb5d2076d15438cf2272918ebe4e2",
};
const BASE = `https://raw.githubusercontent.com/glojournal-cmyk/glojournal-cmyk.github.io/${COMMIT}`;
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";

const files = {
  "mastery-v2-20261018.js": "/assets/mastery-v2-20261018.js",
  "daily-session-credit-20261021.js": "/assets/daily-session-credit-20261021.js",
  "daily-curriculum-20261004.js": "/assets/daily-curriculum-20261004.js",
  "index-BLVOhKhN.core.js": "/assets/index-BLVOhKhN.core.js",
};
const dir = path.join(tmpdir(), `lux-p0-${COMMIT.slice(0, 12)}`);
await mkdir(dir, { recursive: true });
const hashes = {};
const here = path.dirname(fileURLToPath(import.meta.url));
for (const [name, rel] of Object.entries(files)) {
  const localCandidates = [
    path.resolve(here, "..", rel.slice(1)),
    path.resolve(rel.slice(1)),
  ];
  let buf = null;
  for (const candidate of localCandidates) {
    try { buf = await readFile(candidate); break; } catch { /* try next */ }
  }
  if (!buf) {
    const res = await fetch(BASE + rel);
    if (!res.ok) throw new Error(`fetch ${rel} ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  }
  const hash = createHash("sha256").update(buf).digest("hex");
  if (hash !== EXPECTED[name]) throw new Error(`sha256 mismatch ${name}: ${hash}`);
  hashes[name] = hash;
  await writeFile(path.join(dir, name), buf);
}
const mastery = await import(pathToFileURL(path.join(dir, "mastery-v2-20261018.js")).href);
const credit = await import(pathToFileURL(path.join(dir, "daily-session-credit-20261021.js")).href);
const curriculum = await import(pathToFileURL(path.join(dir, "daily-curriculum-20261004.js")).href);
const core = await (await import("node:fs/promises")).readFile(path.join(dir, "index-BLVOhKhN.core.js"), "utf8");
const marker = "recordAttempt:(n,r,i,a)=>";
const at = core.indexOf(marker);
if (at < 0) throw new Error("recordAttempt not found");
let depth = 0, end = -1;
for (let j = core.indexOf("{", at); j < core.length; j++) {
  if (core[j] === "{") depth++;
  else if (core[j] === "}") { depth--; if (depth === 0) { end = j + 1; break; } }
}
const recordSrc = "const recordAttempt=" + core.slice(at + "recordAttempt:".length, end);
function runAttempt(meta) {
  const calls = [];
  const state = {
    seenTotal: {}, seenCorrect: {}, reviews: {}, topicStats: {}, typedErrors: { accent: 0 },
    questionsToday: 0, activity: {}, studyDays: [], loginDays: [], subjectQuestions: {},
    daily: [{ id: "study-session", target: 10, progress: 0 }], dailyCompleteAwarded: {}, lastTopic: null,
  };
  state.bumpDaily = (id, n = 1) => {
    calls.push(["bump", id, n]);
    state.daily = state.daily.map((task) => task.id === id ? { ...task, progress: Math.min(task.target, task.progress + n) } : task);
  };
  state.award = (kind) => { calls.push(["award", kind]); return { awarded: kind }; };
  const t = () => state;
  const e = (patch) => Object.assign(state, patch);
  const bound = eval(`(function(t,e,qT,DS,NT,FT){ ${recordSrc}; return recordAttempt; })`)(
    t, e, () => null, () => "2026-11-22", () => "practising", (days) => days
  );
  const returned = bound("UNAPPROVED-1", true, "biology", meta);
  return {
    questionsToday: state.questionsToday,
    studySession: state.daily[0].progress,
    calls: calls.filter((c) => c[0] !== "set"),
    returned,
  };
}

const day = "2026-11-22";
const topic = "bio-y8-food-tests";
const href = `/study/biology/practise?daily=1&locked=1&year=8&mode=standard&task=y8-standard-a&topic=${topic}`;
const dailyState = () => ({
  today: day,
  formalAttemptLog: [],
  daily: [{ id: "y8-standard-a", planDate: day, assignedTopic: topic, assignedSubject: "biology", assignedYear: 8, target: 10, progress: 0, href }],
});
const out = [];
function observe(id, actual, note) { out.push({ id, ...actual, note }); }
function expect(id, ok, actual) { if (!ok) throw new Error(id + " " + JSON.stringify(actual)); out.push({ id, ok: true, actual }); }

{
  const result = credit.reconcileDailySession(dailyState(), {
    day, taskId: "y8-standard-a", subject: "biology", year: 8, mode: "standard",
    questions: [{ id: "UNAPPROVED-1", topicId: topic }],
    answers: [{ questionId: "UNAPPROVED-1", correct: true }],
  });
  expect("current.daily.missing-flag-credits", result.changed === true && result.progress === 1, { progress: result.progress, reason: result.reason });
  const again = credit.reconcileDailySession({ today: day, daily: result.daily, formalAttemptLog: [{ day, dailyTaskId: "y8-standard-a", subject: "biology", year: 8, correct: true, questionId: "UNAPPROVED-1", topicId: topic, attemptId: "same-daily" }] }, {
    day, taskId: "y8-standard-a", subject: "biology", year: 8, mode: "standard",
    questions: [{ id: "UNAPPROVED-1", topicId: topic }],
    answers: [{ questionId: "UNAPPROVED-1", correct: true }],
  });
  expect("current.daily.same-receipt-does-not-double", again.changed === false && again.progress === 1, { progress: again.progress, reason: again.reason });
}
{
  const result = credit.reconcileDailySession(dailyState(), {
    day, taskId: "y8-standard-a", subject: "biology", year: 8, mode: "standard",
    questions: [{ id: "UNAPPROVED-1", topicId: topic, formal: false }],
    answers: [{ questionId: "UNAPPROVED-1", correct: true, formal: false }],
  });
  expect("current.daily.explicit-formal-false-no-progress", result.changed === false && result.progress === 0, { progress: result.progress, reason: result.reason });
}

function masteryEntry(n, overrides = {}) {
  return { questionId: "G" + n, attemptId: "e" + n, day, year: 8, mode: "mastery", masteryTarget: 20, correct: true, format: "typed_short", assisted: true, guided: true, ...overrides };
}
let stat = {};
for (let n = 1; n <= 20; n++) stat = { masteryV2: mastery.addMasteryEvidence(stat, masteryEntry(n)) };
expect("current.mastery.assisted-typed-short-reaches-check2", stat.masteryV2.stage === "check2" && stat.masteryV2.due === "2026-11-24", { stage: stat.masteryV2.stage, due: stat.masteryV2.due });
const once = mastery.addMasteryEvidence({}, masteryEntry(1));
const twice = mastery.addMasteryEvidence({ masteryV2: once }, masteryEntry(1));
expect("current.mastery.same-attempt-id-does-not-double", once.attempts.length === 1 && twice.attempts.length === 1, { once: once.attempts.length, twice: twice.attempts.length });

const beforeDue = { masteryV2: mastery.addMasteryEvidence(stat, { questionId: "R1", day: "2026-11-23", year: 8, mode: "retention", correct: true, assisted: true, format: "mc_single" }) };
expect("current.mastery.retention-before-due-does-not-advance", beforeDue.masteryV2.stage === "check2" && (beforeDue.masteryV2.checks || []).length === 0, { stage: beforeDue.masteryV2.stage, checks: beforeDue.masteryV2.checks });

const ignored = { masteryV2: mastery.addMasteryEvidence(stat, masteryEntry(99, { day: "2026-11-24" })) };
expect("current.mastery.more-mastery-mode-does-not-skip-checks", ignored.masteryV2.stage === "check2", { stage: ignored.masteryV2.stage });

const blocked = { masteryV2: mastery.addMasteryEvidence(stat, { questionId: "BLOCK", day: "2026-11-24", year: 8, mode: "retention", correct: true, formal: false, assisted: true }) };
expect("current.mastery.explicit-formal-false-retention-ignored", blocked.masteryV2.stage === "check2" && !blocked.masteryV2.checks?.length, { stage: blocked.masteryV2.stage, checks: blocked.masteryV2.checks });

function retain(from, onDay, correctCount) {
  let s = from;
  for (let n = 1; n <= 5; n++) {
    s = { masteryV2: mastery.addMasteryEvidence(s, { questionId: onDay + "-R" + n, day: onDay, year: 8, mode: "retention", correct: n <= correctCount, assisted: true, guided: true, format: "mc_single" }) };
  }
  return s;
}
const check7 = retain(stat, "2026-11-24", 4);
expect("current.mastery.assisted-4of5-advances-check7", check7.masteryV2.stage === "check7" && check7.masteryV2.due === "2026-11-29", { stage: check7.masteryV2.stage, due: check7.masteryV2.due });
const mastered = retain(check7, "2026-11-29", 4);
expect("current.mastery.assisted-retention-reaches-mastered", mastered.masteryV2.stage === "mastered" && mastered.masteryV2.masteredAt === "2026-11-29", { stage: mastered.masteryV2.stage, masteredAt: mastered.masteryV2.masteredAt });

const picked = curriculum.selectProgressionQuestions([
  { id: "bare", format: "typed_short" },
  { id: "closed", formal: false, format: "typed_short" },
  { id: "preview", status: "preview", format: "typed_short" },
], "standard", 10).map((q) => q.id);
expect("current.selector.missing-flag-admitted", JSON.stringify(picked) === JSON.stringify(["bare"]), picked);

const ledger = curriculum.creditCurriculumAttempt({}, { questionId: "UNAPPROVED-1", topicId: topic, day, mode: "standard", task: "y8-practise" });
expect("current.curriculum.missing-flag-recorded", ledger?.[day]?.["y8-practise"]?.[topic]?.foundation?.["UNAPPROVED-1"] === true, ledger);

const attempts = {
  omittedFormal: runAttempt({}),
  explicitFormalFalse: runAttempt({ formal: false }),
  excludeGeneralDaily: runAttempt({ formal: true, excludeGeneralDaily: true }),
};
expect("current.upstream.omitted-formal-bumps-and-asks-practice-xp", attempts.omittedFormal.questionsToday === 1 && attempts.omittedFormal.studySession === 1 && attempts.omittedFormal.returned.awarded === "practice_first_correct", attempts.omittedFormal);
expect("current.upstream.formal-false-still-asks-practice-xp", attempts.explicitFormalFalse.questionsToday === 0 && attempts.explicitFormalFalse.studySession === 0 && attempts.explicitFormalFalse.returned.awarded === "practice_first_correct", attempts.explicitFormalFalse);

const report = {
  commit: COMMIT,
  kind: "characterization-of-current-behaviour",
  not: ["acceptance-of-a-fix", "ipad-e2e", "academic-qa-allowlist"],
  sha256: hashes,
  practiceXpPolicy: "practice_first_correct is requested even when formal is false. This observation is not by itself a Daily/Mastery defect. Practice XP stays a separate policy from formal credit.",
  cases: out,
};
console.log(JSON.stringify(report, null, 2));
