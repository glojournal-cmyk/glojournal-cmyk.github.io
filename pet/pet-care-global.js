import { C as store } from "/assets/index-BLVOhKhN.core.js?v=20260930-daily5";
import { awardBond, localDayKey } from "/pet/pet-care-state.js?v=20260927-care2";

const STUDY_SESSION_IDS = new Set(["study-session", "adaptive-focus"]);
let previousTasks = null;
let previousBosses = null;

function taskSnapshot(state = {}) {
  const out = new Map();
  for (const task of Array.isArray(state.daily) ? state.daily : []) {
    if (!task?.id) continue;
    const target = Math.max(1, Number(task.target) || 1);
    const progress = Math.max(0, Number(task.progress) || 0);
    out.set(String(task.id), { id: String(task.id), done: progress >= target, progress, target });
  }
  return out;
}

function bossSnapshot(state = {}) {
  const weeks = state?.weeklyBoss?.weeks && typeof state.weeklyBoss.weeks === "object" ? state.weeklyBoss.weeks : {};
  const out = new Map();
  for (const [week, raw] of Object.entries(weeks)) {
    const row = raw && typeof raw === "object" ? raw : {};
    out.set(String(week), {
      passed: row.passed === true,
      missionId: String(row.missionId || "weekly-boss"),
    });
  }
  return out;
}

function syncDailyBond(state) {
  const next = taskSnapshot(state);
  if (previousTasks == null) {
    previousTasks = next;
    return;
  }

  const day = state?.today || localDayKey();
  const previous = previousTasks;
  previousTasks = next;

  for (const [id, row] of next) {
    const before = previous.get(id);
    if (!row.done || !before || before.done) continue;
    const isStudySession = STUDY_SESSION_IDS.has(id);
    awardBond(isStudySession ? 2 : 1, {
      key: `${isStudySession ? "study" : "quest"}:${day}:${id}`,
      reason: isStudySession ? "Study session complete" : "Today's quest complete",
      moodDelta: isStudySession ? 2 : 1,
      bypassDailyCap: true,
    });
  }
}

function syncWeeklyBossBond(state) {
  const next = bossSnapshot(state);
  if (previousBosses == null) {
    previousBosses = next;
    return;
  }

  const previous = previousBosses;
  previousBosses = next;
  for (const [week, row] of next) {
    const before = previous.get(week);
    if (!row.passed || before?.passed) continue;
    awardBond(4, {
      key: `weekly-boss:${week}:${row.missionId}`,
      reason: "Weekly Boss cleared",
      moodDelta: 5,
      bypassDailyCap: true,
    });
  }
}

function sync() {
  try {
    const state = store.getState?.() || {};
    syncDailyBond(state);
    syncWeeklyBossBond(state);
  } catch {}
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    sync();
  });
}

sync();
store.subscribe?.(schedule);

window.addEventListener("pageshow", schedule);
window.addEventListener("focus", schedule);
