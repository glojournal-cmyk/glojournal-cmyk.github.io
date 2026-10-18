// Small completion receipts, separate from the large Scholar progress file.
// A finished Recovery session must survive even when iPad localStorage is full.
const KEY = "lux-recovery-receipts-v1";
const PROGRESS_KEY = "lux-scholar-garden-v1";
const CACHE_KEYS = ["lux-practice-drafts-v1", "lux-game-visit-v1"];
const TASKS = new Set([
  "y8-practise", "y8-mastery", "year8-long-review",
  "latin-standard", "y8-standard-a", "y8-standard-b", "y8-mastery-a", "y8-mastery-b",
  "weakness-review", "due-review", "year9-light",
  "study-session", "adaptive-focus", "mistake-review",
  "french-vocab", "latin-vocab", "tend-garden", "play-game"
]);
const VOCAB = new Set(["french-vocab", "latin-vocab"]);
const dayOk = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function shrinkGameMemory() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state || typeof state !== "object" || !state.gamePractice) return false;
    delete state.gamePractice;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(parsed));
    return true;
  } catch {
    return false;
  }
}

function writeAll(data) {
  const payload = JSON.stringify(data);
  try {
    localStorage.setItem(KEY, payload);
    return true;
  } catch { /* quota — free disposable caches, never the learning record */ }
  for (const key of CACHE_KEYS) {
    try { localStorage.removeItem(key); } catch { /* already gone */ }
  }
  try {
    localStorage.setItem(KEY, payload);
    return true;
  } catch { /* still full */ }
  if (shrinkGameMemory()) {
    try {
      localStorage.setItem(KEY, payload);
      return true;
    } catch { /* still full */ }
  }
  return false;
}

export function saveRecoveryReceipt(input) {
  const date = input?.date;
  const taskId = input?.taskId;
  if (!dayOk(date) || !TASKS.has(taskId)) return false;
  const ids = [...new Set((input.questionIds || []).map((id) => String(id || "")).filter(Boolean))];
  if (!ids.length) return false;
  const all = readAll();
  const id = date + ":" + taskId;
  const prev = all[id] || {};
  const questionIds = [...new Set([...(prev.questionIds || []), ...ids])].slice(0, 80);
  const baseline = VOCAB.has(taskId)
    ? (Number.isFinite(Number(prev.baseline)) ? Number(prev.baseline)
      : (Number.isFinite(Number(input.baseline)) ? Math.max(0, Math.min(30, Number(input.baseline))) : 0))
    : null;
  all[id] = {
    date,
    taskId,
    subject: input.subject || prev.subject || null,
    topicId: input.topicId || prev.topicId || null,
    questionIds,
    ...(baseline == null ? {} : { baseline }),
    at: new Date().toISOString()
  };
  return writeAll(all);
}

export function listRecoveryReceipts() {
  return Object.values(readAll()).filter((row) => dayOk(row?.date) && TASKS.has(row?.taskId) && row.questionIds?.length);
}

// Monotonic: receipts can complete a saved task, never erase one.
export function applyRecoveryReceipts(dailyLog) {
  const base = dailyLog && typeof dailyLog === "object" ? dailyLog : {};
  let log = base;
  for (const receipt of listRecoveryReceipts()) {
    const row = log[receipt.date];
    if (!row?.tasks?.length) continue;
    const task = row.tasks.find((item) => item.id === receipt.taskId);
    if (!task) continue;
    const target = Math.max(1, Number(task.target) || 1);
    const count = receipt.questionIds.length;
    const current = Number(task.progress) || 0;
    const vocab = VOCAB.has(receipt.taskId);
    const baseline = vocab && Number.isFinite(Number(receipt.baseline)) ? Number(receipt.baseline) : current;
    const progress = Math.min(target, Math.max(current, vocab ? baseline + count : count));
    if (progress <= current && (task.done || progress < target)) continue;
    const tasks = row.tasks.map((item) => item.id === receipt.taskId
      ? { ...item, progress, done: progress >= target, ...(progress >= target ? { recovered: true, recoveredFromReceipt: true } : {}) }
      : item);
    const done = tasks.filter((item) => item.done || Number(item.progress) >= Number(item.target)).length;
    log = {
      ...log,
      [receipt.date]: { ...row, tasks, done, total: tasks.length, complete: done === tasks.length }
    };
  }
  return log;
}

export function commitRecoverySession(input) {
  const answers = Array.isArray(input?.answers) ? input.answers : [];
  const questionIds = answers
    .filter((answer) => answer && answer.questionId && answer.formal !== false && !answer.repair)
    .map((answer) => answer.questionId);
  return saveRecoveryReceipt({
    date: input?.date,
    taskId: input?.taskId,
    subject: input?.subject,
    topicId: input?.topicId,
    questionIds
  });
}

if (typeof globalThis !== "undefined") {
  globalThis.LuxRecoveryReceipt = { saveRecoveryReceipt, listRecoveryReceipts, applyRecoveryReceipts, commitRecoverySession };
}
