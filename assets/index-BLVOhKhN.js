export * from "./index-BLVOhKhN.core.js";
import {
  C as store,
  U as collectibles,
  Ut as todayKey,
  Ot as frenchVocab,
  bt as latinVocab,
  ht as englishVocab,
  yt as latinLegacyQuestions,
  Dt as frenchLegacyQuestions,
  Nt as biologyLegacyQuestions,
  st as getTopicCatalog,
} from "./index-BLVOhKhN.core.js";

const SUBJECTS = ["latin", "french", "biology", "chemistry", "physics", "english"];
const SUBJECT_LABELS = {
  latin: "Latin",
  french: "French",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  english: "English",
};
const FRENCH_DAILY_HREF = "/session/french-vocab";
const MASTERY_MIN_ATTEMPTS = 6;
const MASTERY_ACCURACY = 0.85;
const SECURE_MIN_ATTEMPTS = 5;
const SECURE_ACCURACY = 0.8;

// Keep Cat Companion as a genuine multi-day reward even if games are replayed heavily.
const cat = collectibles.find((item) => item.id === "cat-companion");
if (cat) {
  cat.needIf = { ...(cat.needIf || {}), studyDays: Math.max(7, cat.needIf?.studyDays || 0) };
  cat.need = "Play 3 different learning games and complete 12 qualifying learning games across different days, and study on 7 different days";
}

function localDayFromIso(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDay(day, offset) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function verifiedLegacyPeDays(state) {
  const peDays = Array.isArray(state.peDays) ? [...new Set(state.peDays)] : [];
  const sessions = Math.max(0, state.peSessions || 0);
  if (!peDays.length || peDays.length !== sessions) return null;

  const today = todayKey();
  const expected = new Set(Array.from({ length: peDays.length }, (_, i) => shiftDay(today, -i)));
  if (!peDays.every((day) => expected.has(day))) return null;

  const fromHistory = [...new Set((state.history || [])
    .filter((entry) => entry?.kind === "pe_complete" && entry?.at)
    .map((entry) => localDayFromIso(entry.at))
    .filter(Boolean))];

  return fromHistory.length < peDays.length ? fromHistory : null;
}

function slug(value) {
  return String(value || "topic")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "topic";
}

function legacyTopicId(subject, topic) {
  const prefix = subject === "biology" ? "bio" : subject === "chemistry" ? "chem" : subject === "physics" ? "phys" : subject === "english" ? "eng" : subject;
  return `${prefix}-legacy-${slug(topic)}`;
}

const QUESTION_META = new Map();
function addQuestionMeta(items, subject, isVocab = false) {
  for (const item of items || []) {
    if (!item?.id) continue;
    QUESTION_META.set(item.id, {
      subject,
      topicId: legacyTopicId(subject, item.topic || (isVocab ? "vocabulary" : "core")),
      topicTitle: item.topic || (isVocab ? "Vocabulary" : "Core"),
    });
  }
}
addQuestionMeta(latinVocab, "latin", true);
addQuestionMeta(frenchVocab, "french", true);
addQuestionMeta(englishVocab, "english", true);
addQuestionMeta(latinLegacyQuestions, "latin");
addQuestionMeta(frenchLegacyQuestions, "french");
addQuestionMeta(biologyLegacyQuestions, "biology");

function inferSubjectFromTopic(topicId) {
  const id = String(topicId || "").toLowerCase();
  if (id.startsWith("la-") || id.startsWith("latin")) return "latin";
  if (id.startsWith("fr-") || id.startsWith("french")) return "french";
  if (id.startsWith("bio-") || id.startsWith("bi-")) return "biology";
  if (id.startsWith("chem-") || id.startsWith("ch-")) return "chemistry";
  if (id.startsWith("phys-") || id.startsWith("ph-")) return "physics";
  if (id.startsWith("eng-") || id.startsWith("en-")) return "english";
  return null;
}

function inferAttemptMeta(questionId, subject, meta = {}) {
  const known = QUESTION_META.get(questionId) || {};
  const resolvedSubject = SUBJECTS.includes(subject) ? subject : known.subject || inferSubjectFromTopic(meta.topicId);
  const topicId = meta.topicId || known.topicId || (resolvedSubject ? legacyTopicId(resolvedSubject, "general") : null);
  return {
    ...meta,
    subject: resolvedSubject,
    topicId,
    topicTitle: meta.topicTitle || known.topicTitle || null,
  };
}

function isVisible(el) {
  if (!el || el.disabled) return false;
  const rect = el.getBoundingClientRect?.();
  if (!rect || rect.width <= 0 || rect.height <= 0) return false;
  const style = window.getComputedStyle?.(el);
  return !style || (style.display !== "none" && style.visibility !== "hidden");
}

function isIndependentProduction(meta) {
  if (meta?.production === true) return true;
  if (meta?.production === false) return false;
  const format = String(meta?.format || "");
  if (["typed_exact", "typed_short", "controlled_translation", "extended_response", "practical_design", "mark_points", "calculation", "spelling_restore", "unordered_set"].includes(format)) return true;
  if (["mc_single", "matching", "sorting", "diagram_label", "word_tiles", "sequence"].includes(format)) return false;
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  return [...document.querySelectorAll("main form input:not([type='hidden']), main form textarea")].some(isVisible);
}

function diagnoseError(subject, topicId, errorKind, format, topicTitle) {
  if (!errorKind || errorKind === "none") return null;
  const text = `${topicId || ""} ${topicTitle || ""}`.toLowerCase();
  if (errorKind === "blank") return "incomplete";
  if (errorKind === "partial") return "incomplete";
  if (subject === "latin") {
    if (errorKind === "spelling") return "spelling";
    if (/case|dative|ablative|accusative|nominative|genitive|declen|preposition/.test(text)) return "case";
    if (/person|number/.test(text)) return "person-number";
    if (/tense|perfect|imperfect|present|pluperfect|verb/.test(text)) return errorKind === "ending" ? "verb-ending" : "tense";
    if (/vocab|noun|adjective|pronoun|word/.test(text)) return "vocabulary";
    if (/translat|sentence|comprehension|passage/.test(text)) return "translation";
    return errorKind === "ending" ? "ending" : "grammar/concept";
  }
  if (subject === "french") {
    if (errorKind === "spelling" || errorKind === "accent") return errorKind;
    if (/negat|pas de|article/.test(text)) return "negative/article";
    if (/gender|mascul|femin|article/.test(text)) return "gender/article";
    if (/agree|adjective|plural/.test(text)) return "agreement";
    if (/tense|imperfect|present|perfect|past|future|verb/.test(text)) return errorKind === "ending" ? "verb-ending" : "tense";
    if (/order|sentence|translat|phrase/.test(text)) return "word-order/translation";
    if (/vocab|word|town|school|family|food|time|opinion/.test(text)) return "vocabulary";
    return errorKind === "ending" ? "agreement/ending" : "grammar/concept";
  }
  if (["biology", "chemistry", "physics"].includes(subject)) {
    if (format === "calculation") return "calculation";
    if (/unit|measure|convert/.test(text)) return "unit/measurement";
    if (/name|identify|term|definition|vocab/.test(text)) return "terminology";
    return "concept";
  }
  if (subject === "english") {
    if (/evidence|quote|explain|analysis/.test(text)) return "evidence/explanation";
    if (/term|technique|language/.test(text)) return "terminology";
    return "concept";
  }
  return errorKind;
}

function errorLabel(value) {
  return String(value || "").replace(/[-/]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dominantError(stat) {
  const entries = Object.entries(stat?.errorTypes || {}).filter(([, count]) => count > 0);
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function questionTopicId(item, subject) {
  return item?.topicId || legacyTopicId(subject, item?.topic || "general");
}

function rankAdaptiveQuestions(items, subject, size = 10) {
  const state = store.getState();
  const today = todayKey();
  const seen = state.seenTotal || {};
  const recent = new Set((state.recentQuestionIds || []).slice(-8));
  const rows = (items || []).map((item, index) => {
    const topicId = questionTopicId(item, subject);
    const stat = normalizeTopicStat(state.topicStats?.[topicId] || {});
    const review = state.reviews?.[item.id];
    const due = !!review?.due && review.due <= today;
    const unseen = !(seen[item.id] > 0);
    const mastered = stat.state === "mastered";
    const weak = !mastered && stat.attempted >= 2 && (stat.accuracy < MASTERY_ACCURACY || stat.productionCorrect < 1);
    return { item, index, topicId, stat, review, due, unseen, mastered, weak, recent: recent.has(item.id) };
  });

  const byNeed = (a, b) =>
    Number(a.recent) - Number(b.recent) ||
    (a.review?.due || "9999-12-31").localeCompare(b.review?.due || "9999-12-31") ||
    a.stat.accuracy - b.stat.accuracy ||
    (seen[a.item.id] || 0) - (seen[b.item.id] || 0) ||
    a.index - b.index;

  const buckets = {
    due: rows.filter((r) => r.due).sort(byNeed),
    weak: rows.filter((r) => !r.due && r.weak).sort(byNeed),
    new: rows.filter((r) => !r.due && !r.weak && r.unseen).sort(byNeed),
    mastered: rows.filter((r) => !r.due && r.mastered).sort(byNeed),
    other: rows.filter((r) => !r.due && !r.weak && !r.unseen && !r.mastered).sort(byNeed),
  };

  const target = Math.max(1, Math.min(Number(size) || 10, rows.length));
  const quotas = {
    due: Math.ceil(target * 0.4),
    weak: Math.ceil(target * 0.3),
    new: Math.max(1, Math.round(target * 0.2)),
    mastered: target >= 5 ? 1 : 0,
  };
  const picked = [];
  const ids = new Set();
  const take = (name, count) => {
    for (const row of buckets[name]) {
      if (picked.length >= target || count <= 0) break;
      if (ids.has(row.item.id)) continue;
      ids.add(row.item.id);
      picked.push({ ...row, bucket: name });
      count -= 1;
    }
  };
  take("due", quotas.due);
  take("weak", quotas.weak);
  take("new", quotas.new);
  take("mastered", quotas.mastered);
  for (const name of ["due", "weak", "new", "other", "mastered"]) take(name, target - picked.length);

  const leftovers = rows.filter((row) => !ids.has(row.item.id)).sort(byNeed);
  const ordered = [...picked, ...leftovers.map((row) => ({ ...row, bucket: "other" }))];
  return ordered.map((row, index) => ({ ...row.item, _adaptiveRank: index, _adaptiveBucket: row.bucket }));
}

function topicState(attempted, correct, productionCorrect) {
  const accuracy = attempted > 0 ? correct / attempted : 0;
  if (attempted >= MASTERY_MIN_ATTEMPTS && accuracy >= MASTERY_ACCURACY && productionCorrect > 0) return "mastered";
  if (attempted >= SECURE_MIN_ATTEMPTS && accuracy >= SECURE_ACCURACY) return "secure";
  if (attempted >= 2 || correct > 0) return "practising";
  return "learning";
}

function normalizeTopicStat(stat = {}) {
  const attempted = Math.max(0, Number(stat.attempted) || 0);
  const correct = Math.max(0, Math.min(attempted, Number(stat.correct) || 0));
  const productionIds = Array.isArray(stat.productionIds) ? [...new Set(stat.productionIds)].slice(-20) : [];
  const productionCorrect = Math.max(Number(stat.productionCorrect) || 0, productionIds.length);
  const accuracy = attempted ? correct / attempted : 0;
  return {
    ...stat,
    attempted,
    correct,
    accuracy,
    productionAttempted: Math.max(0, Number(stat.productionAttempted) || 0),
    productionCorrect,
    productionIds,
    state: topicState(attempted, correct, productionCorrect),
    masteryRule: 1,
  };
}

function topicTitle(state, topicId, subject) {
  try {
    const catalog = getTopicCatalog(subject, state.year);
    const found = catalog?.find((topic) => topic.topicId === topicId);
    if (found?.title) return found.title;
  } catch {}
  return String(topicId || "Focus topic")
    .replace(/^(latin|french|bio|chem|phys|eng)-legacy-/, "")
    .replace(/^(la|fr|bio|chem|phys|eng)-y\d+-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferReviewSubject(questionId, review) {
  return review?.subject || inferSubjectFromTopic(review?.topicId) || QUESTION_META.get(questionId)?.subject || null;
}

function adaptiveFocus(state) {
  const today = todayKey();
  const due = [];
  for (const [questionId, review] of Object.entries(state.reviews || {})) {
    if (!review?.due || review.due > today) continue;
    const subject = inferReviewSubject(questionId, review);
    if (!SUBJECTS.includes(subject)) continue;
    due.push({ questionId, subject, topicId: review.topicId || QUESTION_META.get(questionId)?.topicId || null });
  }

  if (due.length) {
    const counts = new Map();
    for (const item of due) counts.set(item.subject, (counts.get(item.subject) || 0) + 1);
    const subject = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const subjectDue = due.filter((item) => item.subject === subject);
    const topicCounts = new Map();
    for (const item of subjectDue) if (item.topicId) topicCounts.set(item.topicId, (topicCounts.get(item.topicId) || 0) + 1);
    const topicId = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return { subject, topicId, reason: "due", dueCount: subjectDue.length };
  }

  const weak = Object.entries(state.topicStats || {})
    .map(([topicId, raw]) => ({ topicId, ...normalizeTopicStat(raw), subject: inferSubjectFromTopic(topicId) }))
    .filter((item) => SUBJECTS.includes(item.subject) && item.attempted >= 2 && item.state !== "mastered")
    .sort((a, b) => {
      const aProdPenalty = a.productionCorrect > 0 ? 0 : 0.08;
      const bProdPenalty = b.productionCorrect > 0 ? 0 : 0.08;
      return (a.accuracy - aProdPenalty) - (b.accuracy - bProdPenalty) || b.attempted - a.attempted;
    });
  if (weak.length) return { subject: weak[0].subject, topicId: weak[0].topicId, reason: "weak", accuracy: weak[0].accuracy, errorType: dominantError(weak[0]) };

  if (SUBJECTS.includes(state.lastSubject)) return { subject: state.lastSubject, topicId: state.lastTopic || null, reason: "continue" };
  const rotation = ["latin", "biology", "chemistry", "physics", "french", "english"];
  return { subject: rotation[new Date().getDay() % rotation.length], topicId: null, reason: "rotate" };
}

function focusHref(focus, state) {
  if (focus.subject === "french" && state.year === 9) return FRENCH_DAILY_HREF;
  const base = `/study/${focus.subject}/practise`;
  if (focus.reason === "due") return `${base}?mode=due`;
  if (focus.reason === "weak") return `${base}?mode=weak`;
  return base;
}

function buildAdaptiveDaily(state) {
  const previous = new Map((state.daily || []).map((task) => [task.id, task]));
  const existingPlan = previous.get("study-session");
  const locked = existingPlan?.planDate === state.today && SUBJECTS.includes(existingPlan.focusSubject);
  const focus = locked
    ? { subject: existingPlan.focusSubject, topicId: existingPlan.focusTopic || null, reason: existingPlan.focusReason || "continue", dueCount: existingPlan.focusDueCount || 0, accuracy: existingPlan.focusAccuracy, errorType: existingPlan.focusErrorType || null }
    : adaptiveFocus(state);
  const label = SUBJECT_LABELS[focus.subject] || "Study";
  const title = locked ? existingPlan.title : focus.reason === "due"
    ? `Review due ${label}`
    : focus.reason === "weak" && focus.topicId
      ? `Strengthen ${topicTitle(state, focus.topicId, focus.subject)}`
      : `Continue ${label}`;
  const detail = locked ? existingPlan.detail : focus.reason === "due"
    ? `${focus.dueCount} review item${focus.dueCount === 1 ? "" : "s"} due · use spaced review.`
    : focus.reason === "weak"
      ? `${Math.round((focus.accuracy || 0) * 100)}% so far · build towards ≥85%${focus.errorType ? ` · main issue: ${errorLabel(focus.errorType)}` : ""}.`
      : `Eight focused questions in ${label}.`;

  const studyProgress = Math.min(8, existingPlan?.progress || 0);
  const oldFocusProgress = previous.get("adaptive-focus")?.progress || 0;
  const frenchCarry = focus.subject === "french" ? (previous.get("french-vocab")?.progress || 0) : 0;
  const focusProgress = Math.min(4, Math.max(oldFocusProgress, frenchCarry));
  const garden = previous.get("tend-garden") || { id: "tend-garden", title: "Water your plants", detail: "Tend the Scholar’s Garden.", href: "/garden", target: 1, progress: 0, xp: 10 };
  const game = previous.get("play-game") || { id: "play-game", title: "Play a quick game", detail: "One short learning game.", href: "/play", target: 1, progress: 0, xp: 10 };

  return [
    { id: "study-session", title, detail, href: locked ? existingPlan.href : focusHref(focus, state), target: 8, progress: studyProgress, xp: 10, planDate: state.today, focusSubject: focus.subject, focusTopic: focus.topicId, focusReason: focus.reason, focusDueCount: focus.dueCount || 0, focusAccuracy: focus.accuracy, focusErrorType: focus.errorType || null },
    { id: "adaptive-focus", title: `${label} focus`, detail: "Four questions in today’s priority subject. Mastery needs ≥85% plus one independent typed or spelled answer.", href: locked ? existingPlan.href : focusHref(focus, state), target: 4, progress: focusProgress, xp: 10, planDate: state.today, focusSubject: focus.subject, focusTopic: focus.topicId, focusReason: focus.reason },
    { ...garden, progress: Math.min(garden.target || 1, garden.progress || 0) },
    { ...game, progress: Math.min(game.target || 1, game.progress || 0) },
  ];
}

let normalizing = false;
function normalizeState() {
  if (normalizing) return;
  const state = store.getState();
  const patch = {};

  const verified = verifiedLegacyPeDays(state);
  if (verified) {
    patch.peDays = verified;
    patch.peSessions = verified.length;
  } else {
    const peCount = Array.isArray(state.peDays) ? state.peDays.length : 0;
    if ((state.peSessions || 0) !== peCount) patch.peSessions = peCount;
  }

  const normalizedTopics = {};
  let topicsChanged = false;
  for (const [topicId, raw] of Object.entries(state.topicStats || {})) {
    const next = normalizeTopicStat(raw);
    normalizedTopics[topicId] = next;
    if (raw.masteryRule !== 1 || raw.state !== next.state || raw.accuracy !== next.accuracy || !Array.isArray(raw.productionIds)) topicsChanged = true;
  }
  if (topicsChanged) patch.topicStats = normalizedTopics;

  const stateForDaily = { ...state, ...(patch.topicStats ? { topicStats: patch.topicStats } : {}) };
  const daily = buildAdaptiveDaily(stateForDaily);
  if (JSON.stringify(daily) !== JSON.stringify(state.daily || [])) patch.daily = daily;

  if (Object.keys(patch).length) {
    normalizing = true;
    store.setState(patch);
    normalizing = false;
  }
}

const initial = store.getState();
const originalHydrateDay = initial.hydrateDay;
const originalRecordPe = initial.recordPe;
const originalRecordGame = initial.recordGame;
const originalRecordAttempt = initial.recordAttempt;
const originalRecordSpelling = initial.recordSpelling;
const originalBumpDaily = initial.bumpDaily;

function patchedHydrateDay(...args) {
  const result = originalHydrateDay(...args);
  normalizeState();
  return result;
}

function patchedRecordPe(...args) {
  const result = originalRecordPe(...args);
  const after = store.getState();
  const peCount = Array.isArray(after.peDays) ? after.peDays.length : 0;
  if ((after.peSessions || 0) !== peCount) store.setState({ peSessions: peCount });
  return result;
}

function patchedRecordGame(gameId, points, stars, level) {
  const before = store.getState();
  const day = todayKey();
  const beforeCount = before.gameRewardByDay?.[day]?.[gameId] || 0;
  const beforeQualifying = before.qualifyingGamePlays || 0;
  const qualifyingByDay = { ...(before.qualifyingGameByDay || {}) };
  const dayQualifying = { ...(qualifyingByDay[day] || {}) };
  const alreadyQualifiedToday = !!dayQualifying[gameId];

  const result = originalRecordGame(gameId, points, stars, level);
  const after = store.getState();
  const patch = {};

  if (stars <= 0) {
    const ledger = { ...(after.gameRewardByDay || {}) };
    const dayLedger = { ...(ledger[day] || {}) };
    if ((dayLedger[gameId] || 0) !== beforeCount) {
      if (beforeCount > 0) dayLedger[gameId] = beforeCount;
      else delete dayLedger[gameId];
      ledger[day] = dayLedger;
      patch.gameRewardByDay = ledger;
    }
  }

  if (stars >= 2) {
    const increment = alreadyQualifiedToday ? 0 : 1;
    dayQualifying[gameId] = true;
    qualifyingByDay[day] = dayQualifying;
    patch.qualifyingGameByDay = qualifyingByDay;
    patch.qualifyingGamePlays = beforeQualifying + increment;
  } else if ((after.qualifyingGamePlays || 0) !== beforeQualifying) {
    patch.qualifyingGamePlays = beforeQualifying;
  }

  if (Object.keys(patch).length) store.setState(patch);
  return result;
}

function patchedRecordAttempt(questionId, correct, subject, meta = {}) {
  const before = store.getState();
  const resolved = inferAttemptMeta(questionId, subject, meta || {});
  const production = isIndependentProduction(resolved);

  // Keep core XP/review scheduling, but stop its old streak-only topic mastery from running.
  const coreMeta = { ...meta, topicId: undefined };
  const result = originalRecordAttempt(questionId, correct, subject, coreMeta);
  const after = store.getState();

  if (!resolved.topicId) return result;
  const current = normalizeTopicStat(before.topicStats?.[resolved.topicId] || {});
  const isRepair = !!meta?.repair;
  const attempted = current.attempted + (isRepair ? 0 : 1);
  const correctCount = current.correct + (!isRepair && correct ? 1 : 0);
  const productionIds = [...(current.productionIds || [])];
  if (!isRepair && production && correct && !productionIds.includes(questionId)) productionIds.push(questionId);
  const productionCorrect = productionIds.length;
  const errorKind = meta?.errorKind && meta.errorKind !== "none" ? meta.errorKind : null;
  const errorType = !correct && !isRepair ? diagnoseError(resolved.subject, resolved.topicId, errorKind, meta?.format, resolved.topicTitle || meta?.topicTitle) : null;
  const errors = { ...(current.errors || {}) };
  const errorTypes = { ...(current.errorTypes || {}) };
  if (errorKind && !isRepair) errors[errorKind] = (errors[errorKind] || 0) + 1;
  if (errorType) errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
  const review = after.reviews?.[questionId];
  const accuracy = attempted ? correctCount / attempted : 0;
  const repairs = { attempted: (current.repairs?.attempted || 0) + (isRepair ? 1 : 0), correct: (current.repairs?.correct || 0) + (isRepair && correct ? 1 : 0) };
  const nextState = topicState(attempted, correctCount, productionCorrect);
  const recentOutcomes = isRepair
    ? [...(current.recentOutcomes || [])]
    : [...(current.recentOutcomes || []), { date: todayKey(), correct: !!correct }].slice(-20);
  const nextTopic = {
    ...current,
    attempted,
    correct: correctCount,
    accuracy,
    productionAttempted: current.productionAttempted + (!isRepair && production ? 1 : 0),
    productionCorrect,
    productionIds: productionIds.slice(-20),
    state: nextState,
    due: review?.due || current.due,
    errors,
    errorTypes,
    lastErrorType: errorType || current.lastErrorType || null,
    repairs,
    recentOutcomes,
    masteredAt: nextState === "mastered" ? (current.state === "mastered" && current.masteredAt ? current.masteredAt : todayKey()) : current.masteredAt || null,
    masteryRule: 1,
    lastAttempt: todayKey(),
  };
  const reviews = { ...(after.reviews || {}) };
  if (review) reviews[questionId] = { ...review, subject: resolved.subject, topicId: resolved.topicId, production: !!production, repair: isRepair, errorType: errorType || review.errorType || null };
  if (isRepair && meta?.repairOf && reviews[meta.repairOf]) {
    const original = reviews[meta.repairOf];
    const day = todayKey();
    reviews[meta.repairOf] = {
      ...original,
      stage: correct ? Math.max(1, original.stage || 0) : Math.max(0, (original.stage || 1) - 1),
      streak: correct ? Math.max(1, original.streak || 0) : 0,
      due: shiftDay(day, 2),
      last: day,
      retriedToday: day,
      repairedBy: questionId,
      repairCorrect: !!correct,
    };
  }
  const recentQuestionIds = [...(after.recentQuestionIds || []).filter((id) => id !== questionId), questionId].slice(-20);
  store.setState({
    topicStats: { ...(after.topicStats || {}), [resolved.topicId]: nextTopic },
    reviews,
    recentQuestionIds,
    lastTopic: resolved.topicId,
    lastSubject: resolved.subject || subject,
  });

  const focus = store.getState().daily?.find((task) => task.id === "adaptive-focus");
  if (focus && focus.focusSubject === (resolved.subject || subject)) originalBumpDaily("adaptive-focus", 1);
  normalizeState();
  return result;
}

function patchedRecordSpelling(questionId, correct) {
  const result = originalRecordSpelling(questionId, correct);
  if (!correct) return result;
  const after = store.getState();
  const known = QUESTION_META.get(questionId);
  if (!known?.topicId) return result;
  const current = normalizeTopicStat(after.topicStats?.[known.topicId] || {});
  const productionIds = current.productionIds.includes(questionId) ? current.productionIds : [...current.productionIds, questionId].slice(-20);
  const productionCorrect = productionIds.length;
  const next = {
    ...current,
    productionCorrect,
    productionIds,
    state: topicState(current.attempted, current.correct, productionCorrect),
    masteryRule: 1,
    lastProduction: todayKey(),
  };
  store.setState({ topicStats: { ...(after.topicStats || {}), [known.topicId]: next } });
  normalizeState();
  return result;
}

store.setState({
  hydrateDay: patchedHydrateDay,
  recordPe: patchedRecordPe,
  recordGame: patchedRecordGame,
  recordAttempt: patchedRecordAttempt,
  recordSpelling: patchedRecordSpelling,
});

function applyPracticeModeFromUrl() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (!/^\/study\/[^/]+\/practise\/?$/.test(window.location.pathname)) return;
  const mode = new URL(window.location.href).searchParams.get("mode");
  if (mode !== "due" && mode !== "weak") return;
  const key = `${window.location.pathname}${window.location.search}`;
  if (applyPracticeModeFromUrl.lastKey === key) return;
  const wanted = mode === "due" ? "Due Review" : "Weakness Review";
  const button = [...document.querySelectorAll("main button")].find((node) => node.textContent?.includes(wanted));
  if (!button) return;
  applyPracticeModeFromUrl.lastKey = key;
  button.click();
}
applyPracticeModeFromUrl.lastKey = "";

normalizeState();
store.subscribe(() => normalizeState());
store.persist?.onFinishHydration?.(() => normalizeState());

if (typeof document !== "undefined") {
  queueMicrotask(applyPracticeModeFromUrl);
  new MutationObserver(applyPracticeModeFromUrl).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", () => {
    applyPracticeModeFromUrl.lastKey = "";
    applyPracticeModeFromUrl();
  });
}


function subjectForTopic(topicId) {
  return inferSubjectFromTopic(topicId);
}

function daysAgoKey(days) {
  return shiftDay(todayKey(), -days);
}

function calendarWeekStart() {
  const d = new Date();
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function improvementDelta(stat) {
  const outcomes = Array.isArray(stat?.recentOutcomes) ? stat.recentOutcomes.slice(-10) : [];
  if (outcomes.length < 6) return null;
  const split = Math.max(3, Math.floor(outcomes.length / 2));
  const prior = outcomes.slice(0, split);
  const recent = outcomes.slice(split);
  if (prior.length < 3 || recent.length < 3) return null;
  const mean = (items) => items.reduce((sum, item) => sum + (item.correct ? 1 : 0), 0) / items.length;
  return mean(recent) - mean(prior);
}

function minCorrectToMaster(attempted, correct) {
  if (attempted >= MASTERY_MIN_ATTEMPTS && attempted > 0 && correct / attempted >= MASTERY_ACCURACY) return 0;
  let n = 0;
  while (n < 50 && (attempted + n < MASTERY_MIN_ATTEMPTS || (correct + n) / Math.max(1, attempted + n) < MASTERY_ACCURACY)) n += 1;
  return n;
}

function progressNextAction(row) {
  if (row.dueCount > 0) return `Complete ${row.dueCount} due review${row.dueCount === 1 ? "" : "s"}.`;
  if (row.state === "mastered") return "Keep it fresh with occasional retrieval.";
  if (row.attempted === 0) return "Start with the core questions.";
  if (row.accuracy < MASTERY_ACCURACY || row.attempted < MASTERY_MIN_ATTEMPTS) {
    const more = minCorrectToMaster(row.attempted, row.correct);
    return more > 0 ? `Aim for ${more} more correct recall${more === 1 ? "" : "s"} without new errors.` : "Build accuracy to at least 85%.";
  }
  if (row.productionCorrect < 1) return "Add one independent typed or spelled answer.";
  return "One more strong retrieval session.";
}

function buildProgressDashboard(state, subject, year = state?.year) {
  const catalog = (() => {
    try { return getTopicCatalog(subject, year) || []; } catch { return []; }
  })();
  const today = todayKey();
  const weekStart = calendarWeekStart();
  const topicIds = new Set(catalog.map((topic) => topic.topicId));
  const titleMap = new Map(catalog.map((topic) => [topic.topicId, topic.title]));

  // Include legacy topic stats for the selected subject so old revision work remains visible.
  for (const topicId of Object.keys(state.topicStats || {})) {
    if (subjectForTopic(topicId) === subject) topicIds.add(topicId);
  }

  const reviewByTopic = new Map();
  let dueReviews = 0;
  for (const [questionId, review] of Object.entries(state.reviews || {})) {
    const reviewSubject = inferReviewSubject(questionId, review);
    if (reviewSubject !== subject) continue;
    const topicId = review.topicId || QUESTION_META.get(questionId)?.topicId || null;
    if (!topicId) continue;
    const entry = reviewByTopic.get(topicId) || { dueCount: 0, nextDue: null };
    if (review.due) {
      if (!entry.nextDue || review.due < entry.nextDue) entry.nextDue = review.due;
      if (review.due <= today) { entry.dueCount += 1; dueReviews += 1; }
    }
    reviewByTopic.set(topicId, entry);
  }

  const topics = [...topicIds].map((topicId) => {
    const stat = normalizeTopicStat(state.topicStats?.[topicId] || {});
    const review = reviewByTopic.get(topicId) || { dueCount: 0, nextDue: null };
    const errorType = dominantError(stat);
    const improvement = improvementDelta(stat);
    const row = {
      topicId,
      title: titleMap.get(topicId) || topicTitle(state, topicId, subject),
      state: stat.state,
      attempted: stat.attempted,
      correct: stat.correct,
      accuracy: stat.attempted ? stat.correct / stat.attempted : 0,
      productionAttempted: stat.productionAttempted || 0,
      productionCorrect: stat.productionCorrect || 0,
      productionOk: (stat.productionCorrect || 0) > 0,
      dueCount: review.dueCount,
      nextDue: review.nextDue,
      errorType,
      errorCount: errorType ? (stat.errorTypes?.[errorType] || 0) : 0,
      improvement,
      masteredAt: stat.masteredAt || null,
      lastAttempt: stat.lastAttempt || null,
      repairs: stat.repairs || { attempted: 0, correct: 0 },
    };
    row.nextAction = progressNextAction(row);
    return row;
  });

  const attemptedTopics = topics.filter((row) => row.attempted > 0);
  const attempted = attemptedTopics.reduce((sum, row) => sum + row.attempted, 0);
  const correct = attemptedTopics.reduce((sum, row) => sum + row.correct, 0);
  const accuracy = attempted ? correct / attempted : 0;
  const mastered = topics.filter((row) => row.state === "mastered");
  const secure = topics.filter((row) => row.state === "secure");
  const productionTopics = topics.filter((row) => row.productionOk).length;

  const weakest = attemptedTopics
    .filter((row) => row.state !== "mastered")
    .sort((a, b) => b.dueCount - a.dueCount || a.accuracy - b.accuracy || b.attempted - a.attempted)
    .slice(0, 3);

  const improving = attemptedTopics
    .filter((row) => typeof row.improvement === "number" && row.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement || b.attempted - a.attempted)
    .slice(0, 3);

  const recentMastered = mastered
    .filter((row) => row.masteredAt)
    .sort((a, b) => String(b.masteredAt).localeCompare(String(a.masteredAt)))
    .slice(0, 3);

  const errorTotals = {};
  for (const row of attemptedTopics) {
    const stat = state.topicStats?.[row.topicId] || {};
    for (const [kind, count] of Object.entries(stat.errorTypes || {})) errorTotals[kind] = (errorTotals[kind] || 0) + count;
  }
  const errorPatterns = Object.entries(errorTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, label: errorLabel(type), count }));

  const activity7 = Array.from({ length: 7 }, (_, index) => {
    const date = daysAgoKey(6 - index);
    const d = new Date(`${date}T12:00:00`);
    return { date, label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()], value: state.activity?.[date] || 0, studied: (state.studyDays || []).includes(date) };
  });

  return {
    subject,
    weekStudyDays: (state.studyDays || []).filter((date) => date >= weekStart && date <= today).length,
    accuracy,
    attempted,
    correct,
    dueReviews,
    totalTopics: topics.length,
    exploredTopics: attemptedTopics.length,
    masteredCount: mastered.length,
    secureCount: secure.length,
    productionTopics,
    weakest,
    improving,
    recentMastered,
    errorPatterns,
    topics: topics.sort((a, b) => b.dueCount - a.dueCount || ({ learning: 0, practising: 1, secure: 2, mastered: 3 }[a.state] - ({ learning: 0, practising: 1, secure: 2, mastered: 3 }[b.state])) || a.accuracy - b.accuracy || a.title.localeCompare(b.title)),
    activity7,
  };
}

export { rankAdaptiveQuestions, buildProgressDashboard };
