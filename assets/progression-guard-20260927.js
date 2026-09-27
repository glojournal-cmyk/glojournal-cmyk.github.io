import { C as store, st as getTopicCatalog } from "./index-BLVOhKhN.js?v=20260926-verbs";

const VERSION = "20260927-foundation-first-1";
const SUBJECTS = ["latin", "french", "biology", "chemistry", "physics"];
const LABELS = {
  latin: "Latin",
  french: "French",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
};

// Daily progression is deliberately conservative. Year 9 remains available for
// deliberate school study, but the automatic Daily/Adaptive queue must finish
// and retain Year 8 foundations first.
const LATIN_YEAR8_ORDER = [
  "la-y8-stage-1-vocabulary",
  "la-y8-stage-2-vocabulary",
  "la-y8-stage-3-vocabulary",
  "la-y8-core-verbs",
  "la-y8-nouns-and-dictionary-entries",
  "la-y8-present-person-and-number",
  "la-y8-prepositions",
  "la-y8-stage-4-vocabulary",
  "la-y8-stage-5-vocabulary",
  "la-y8-stage-6-vocabulary",
  "la-y8-stage-7-vocabulary",
  "la-y8-stage-8-vocabulary",
  "la-y8-stage-9-vocabulary",
  "la-y8-stage-10-vocabulary",
  "la-y8-stage-11-vocabulary",
  "la-y8-stage-12-vocabulary",
  "la-y8-adjective-agreement",
  "la-y8-personal-pronouns",
  "la-y8-ille-singular",
  "la-y8-ille-plural",
  "la-y8-nouns-with-genitives",
  "la-y8-set-text-translation",
  "la-y8-perfect-cues",
];

const STRONG_FOUNDATION_RE = /present-person-and-number|present-tense|regular-present|core-verbs|verb-forms/i;
const ADVANCED_TENSE_RE = /perfect|imperfect|pluperfect|past-tense|future-tense|conditional/i;

function numericRank(topicId = "") {
  const id = String(topicId);
  const french = id.match(/^fr-y8-s(\d+)-/i);
  if (french) return Number(french[1]);
  const generic = id.match(/(?:^|[-_])(?:s|c|p|b|t|u|topic)?(\d+)(?:[-_]|$)/i);
  return generic ? Number(generic[1]) : 9999;
}

function catalogue(subject) {
  let topics = [];
  try {
    topics = (getTopicCatalog(subject, 8) || []).filter((topic) =>
      topic?.topicId && topic?.status !== "disabled" && Number(topic?.enabled ?? topic?.questions ?? 1) > 0
    );
  } catch {}

  if (subject === "latin") {
    const rank = new Map(LATIN_YEAR8_ORDER.map((id, index) => [id, index]));
    return [...topics].sort((a, b) =>
      (rank.get(a.topicId) ?? 9999) - (rank.get(b.topicId) ?? 9999) ||
      String(a.topicId).localeCompare(String(b.topicId))
    );
  }

  if (subject === "french") {
    return [...topics].sort((a, b) =>
      numericRank(a.topicId) - numericRank(b.topicId) || String(a.topicId).localeCompare(String(b.topicId))
    );
  }

  // Science banks commonly carry numbered topic IDs. Prefer that teaching
  // sequence; otherwise preserve the bank order rather than invent a new one.
  return topics.map((topic, index) => ({ topic, index })).sort((a, b) => {
    const ar = numericRank(a.topic.topicId);
    const br = numericRank(b.topic.topicId);
    if (ar !== 9999 || br !== 9999) return ar - br || a.index - b.index;
    return a.index - b.index;
  }).map(({ topic }) => topic);
}

function subjectFromTopic(topicId = "") {
  const id = String(topicId);
  if (/^(la|latin)-y8-/i.test(id)) return "latin";
  if (/^(fr|french)-y8-/i.test(id)) return "french";
  if (/^(bio|biology)-y8-/i.test(id)) return "biology";
  if (/^(chem|chemistry)-y8-/i.test(id)) return "chemistry";
  if (/^(phys|physics)-y8-/i.test(id)) return "physics";
  return null;
}

function statSummary(raw = {}) {
  const attempted = Math.max(0, Number(raw.attempted) || 0);
  const correct = Math.max(0, Math.min(attempted, Number(raw.correct) || 0));
  const accuracy = attempted ? correct / attempted : 0;
  const productionCorrect = Math.max(
    0,
    Number(raw.productionCorrect) || 0,
    Array.isArray(raw.productionIds) ? new Set(raw.productionIds).size : 0
  );
  const dates = new Set(
    (Array.isArray(raw.recentOutcomes) ? raw.recentOutcomes : [])
      .filter((row) => row && row.correct !== false)
      .map((row) => row.date || row.day || (row.at ? String(row.at).slice(0, 10) : null))
      .filter(Boolean)
  );
  return { attempted, correct, accuracy, productionCorrect, days: dates.size };
}

function topicMature(state, subject, topicId) {
  const stat = statSummary(state.topicStats?.[topicId] || {});
  const isLanguage = subject === "latin" || subject === "french";
  const strong = STRONG_FOUNDATION_RE.test(topicId);

  // "Mastered once" is not enough to move the automatic queue on. Mature means
  // accurate retrieval, independent production for languages, and success on
  // more than one day so a same-session streak cannot unlock harder material.
  const enoughAttempts = stat.attempted >= (strong ? 12 : 10);
  const accurate = stat.accuracy >= (strong ? 0.9 : 0.85);
  const produced = !isLanguage || stat.productionCorrect >= (strong ? 2 : 1);
  const spaced = stat.days >= 2;
  return enoughAttempts && accurate && produced && spaced;
}

function skillMature(state, skillId) {
  const raw = state.skillStats?.[skillId];
  if (!raw) return false;
  const attempted = Math.max(0, Number(raw.attempted) || 0);
  const correct = Math.max(0, Math.min(attempted, Number(raw.correct) || 0));
  const accuracy = attempted ? correct / attempted : 0;
  const productionCorrect = Math.max(0, Number(raw.productionCorrect) || 0);
  const retentionPasses = Math.max(0, Number(raw.retentionPasses) || 0);
  const recentDates = new Set((Array.isArray(raw.recentOutcomes) ? raw.recentOutcomes : [])
    .filter((row) => row && row.correct !== false)
    .map((row) => row.date || row.day || (row.at ? String(row.at).slice(0, 10) : null))
    .filter(Boolean));
  return attempted >= 6 && accuracy >= 0.85 && productionCorrect >= 1 && (retentionPasses >= 1 || recentDates.size >= 2);
}

function presentFoundationMature(state, subject) {
  if (subject === "latin") {
    const topicReady = topicMature(state, "latin", "la-y8-present-person-and-number");
    const skill = state.skillStats?.["latin:tense:present"];
    return topicReady && (!skill || skillMature(state, "latin:tense:present"));
  }
  if (subject === "french") {
    const presentSkills = ["french:tense:present", "french:verbs:regular-present"]
      .filter((id) => state.skillStats?.[id]);
    if (!presentSkills.length) return false;
    return presentSkills.every((id) => skillMature(state, id));
  }
  return true;
}

function firstImmature(state, subject) {
  const topics = catalogue(subject);
  return topics.find((topic) => !topicMature(state, subject, topic.topicId)) || null;
}

function topicIndex(subject, topicId) {
  if (!topicId) return -1;
  return catalogue(subject).findIndex((topic) => topic.topicId === topicId);
}

function isTooDeep(state, subject, topicId, frontier) {
  if (!topicId || !frontier) return false;
  if ((subject === "latin" || subject === "french") && ADVANCED_TENSE_RE.test(topicId) && !presentFoundationMature(state, subject)) return true;
  const current = topicIndex(subject, topicId);
  const allowed = topicIndex(subject, frontier.topicId);
  return current >= 0 && allowed >= 0 && current > allowed;
}

function titleFor(subject, frontier) {
  return `${LABELS[subject] || subject} foundation · ${frontier?.title || frontier?.topicId || "Year 8"}`;
}

function foundationHref(subject, frontier, mode = "standard", task = "foundation-first") {
  const params = new URLSearchParams();
  params.set("daily", "1");
  params.set("locked", "1");
  params.set("year", "8");
  params.set("mode", mode);
  params.set("task", task);
  if (frontier?.topicId) params.set("topic", frontier.topicId);
  return `/study/${subject}/practise?${params.toString()}`;
}

function taskSubject(task = {}) {
  if (SUBJECTS.includes(task.assignedSubject)) return task.assignedSubject;
  if (SUBJECTS.includes(task.reviewSubject)) return task.reviewSubject;
  if (SUBJECTS.includes(task.focusSubject)) return task.focusSubject;
  const href = String(task.href || "");
  return SUBJECTS.find((subject) => href.includes(`/study/${subject}/`)) || subjectFromTopic(task.assignedTopic || task.reviewTopic || task.focusTopic);
}

function taskTopic(task = {}) {
  return task.assignedTopic || task.reviewTopic || task.focusTopic || (() => {
    try { return new URL(String(task.href || ""), location.origin).searchParams.get("topic"); } catch { return null; }
  })();
}

function taskIsAutomaticYear9(task = {}) {
  const href = String(task.href || "");
  if (!href.includes("daily=1")) return false;
  if (/year=9(?:&|$)/.test(href)) return true;
  return /-y9-/i.test(String(taskTopic(task) || ""));
}

function taskNeedsFoundation(state, task, frontier) {
  const subject = taskSubject(task);
  if (!subject || !frontier) return false;
  const topicId = taskTopic(task);
  return taskIsAutomaticYear9(task) || isTooDeep(state, subject, topicId, frontier);
}

function modeForTask(state, task, subject, frontier) {
  const stat = statSummary(state.topicStats?.[frontier.topicId] || {});
  const enoughPractice = stat.attempted >= 10;
  if (task.id === "y8-mastery") return enoughPractice ? "mastery" : "standard";
  if (task.id === "year8-long-review") return enoughPractice ? "year8long" : "standard";
  return "standard";
}

let patching = false;
let lastSignature = "";

function patchDaily() {
  if (patching) return;
  const state = store.getState?.();
  if (!state || !Array.isArray(state.daily)) return;

  const frontiers = Object.fromEntries(SUBJECTS.map((subject) => [subject, firstImmature(state, subject)]));
  const signature = JSON.stringify({
    day: state.today,
    frontiers: Object.fromEntries(SUBJECTS.map((subject) => [subject, frontiers[subject]?.topicId || null])),
    daily: state.daily.map((task) => [task.id, task.href, task.assignedTopic, task.reviewTopic, task.focusTopic, task.foundationGuard]),
  });
  if (signature === lastSignature) return;
  lastSignature = signature;

  let changed = false;
  const nextDaily = state.daily.map((task) => {
    const subject = taskSubject(task);
    const frontier = subject ? frontiers[subject] : null;
    if (!subject || !frontier || !taskNeedsFoundation(state, task, frontier)) return task;

    const mode = modeForTask(state, task, subject, frontier);
    const next = {
      ...task,
      title: titleFor(subject, frontier),
      detail: `Foundation first: this Year 8 topic must be mature before the daily queue moves deeper. Mature = accurate retrieval + spaced success${subject === "latin" || subject === "french" ? " + independent production" : ""}.`,
      href: foundationHref(subject, frontier, mode, task.id || "foundation-first"),
      progress: 0,
      planDate: state.today,
      foundationGuard: VERSION,
      foundationYear: 8,
      foundationTopic: frontier.topicId,
    };

    if (task.assignedSubject || task.id === "y8-practise" || task.id === "y8-mastery") {
      next.assignedSubject = subject;
      next.assignedTopic = frontier.topicId;
      next.assignedLabel = frontier.title || frontier.topicId;
    }
    if (task.reviewSubject || task.id === "year8-long-review") {
      next.reviewSubject = subject;
      next.reviewTopic = frontier.topicId;
    }
    if (task.focusSubject || task.id === "study-session" || task.id === "adaptive-focus") {
      next.focusSubject = subject;
      next.focusTopic = frontier.topicId;
      next.focusReason = "foundation";
    }
    return next;
  });

  for (let i = 0; i < nextDaily.length; i += 1) {
    if (nextDaily[i] !== state.daily[i]) { changed = true; break; }
  }
  if (!changed) return;

  patching = true;
  try {
    store.setState({ daily: nextDaily });
  } finally {
    patching = false;
  }
}

function showNotice(subject, frontier) {
  const id = "foundation-first-notice";
  document.getElementById(id)?.remove();
  const box = document.createElement("div");
  box.id = id;
  box.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;max-width:min(92vw,620px);padding:12px 16px;border-radius:14px;background:#fffdf6;color:#17384d;box-shadow:0 12px 36px rgba(0,0,0,.18);font:600 14px/1.35 system-ui,sans-serif;border:1px solid rgba(23,56,77,.15)";
  box.textContent = `Foundation first · ${LABELS[subject] || subject}: ${frontier?.title || frontier?.topicId || "Year 8"}. The daily queue will not jump ahead until this is mature.`;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4200);
}

function guardDailyClick(event) {
  const anchor = event.target?.closest?.("a[href]");
  if (!anchor) return;
  let url;
  try { url = new URL(anchor.href, location.origin); } catch { return; }
  if (url.origin !== location.origin || url.searchParams.get("daily") !== "1") return;

  const subject = SUBJECTS.find((name) => url.pathname.includes(`/study/${name}/`));
  if (!subject) return;
  const state = store.getState?.();
  if (!state) return;
  const frontier = firstImmature(state, subject);
  if (!frontier) return;

  const year = Number(url.searchParams.get("year") || state.year || 9);
  const topic = url.searchParams.get("topic");
  if (year <= 8 && !isTooDeep(state, subject, topic, frontier)) return;

  event.preventDefault();
  event.stopPropagation();
  showNotice(subject, frontier);
  location.href = foundationHref(subject, frontier, "standard", url.searchParams.get("task") || "foundation-first");
}

function guardCurrentDailyRoute() {
  if (!location.pathname.includes("/practise")) return;
  const params = new URLSearchParams(location.search);
  if (params.get("daily") !== "1") return;
  const subject = SUBJECTS.find((name) => location.pathname.includes(`/study/${name}/`));
  if (!subject) return;
  const state = store.getState?.();
  if (!state) return;
  const frontier = firstImmature(state, subject);
  if (!frontier) return;
  const year = Number(params.get("year") || state.year || 9);
  const topic = params.get("topic");
  if (year <= 8 && !isTooDeep(state, subject, topic, frontier)) return;
  const safe = foundationHref(subject, frontier, "standard", params.get("task") || "foundation-first");
  if (`${location.pathname}${location.search}` !== safe) location.replace(safe);
}

function boot() {
  patchDaily();
  guardCurrentDailyRoute();
  document.addEventListener("click", guardDailyClick, true);
  store.subscribe?.(() => {
    window.clearTimeout(boot._timer);
    boot._timer = window.setTimeout(() => {
      patchDaily();
      guardCurrentDailyRoute();
    }, 40);
  });
  window.addEventListener("pageshow", () => {
    patchDaily();
    guardCurrentDailyRoute();
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
