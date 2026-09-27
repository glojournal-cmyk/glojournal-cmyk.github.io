import { C as store } from "/assets/index-BLVOhKhN.core.js?v=20260926-verbs";
import { awardBond, getPetSnapshot, localDayKey } from "/pet/pet-care-state.js?v=20260927-care1";

const STUDY_SESSION_IDS = new Set(["study-session", "adaptive-focus"]);
let previousTasks = null;
let previousLevels = null;

function taskSnapshot(state = {}) {
  const out = new Map();
  for (const task of Array.isArray(state.daily) ? state.daily : []) {
    if (!task?.id) continue;
    const target = Math.max(1, Number(task.target) || 1);
    const progress = Math.max(0, Number(task.progress) || 0);
    out.set(String(task.id), {
      id: String(task.id),
      done: progress >= target,
      progress,
      target,
    });
  }
  return out;
}

function stageSnapshot(pet) {
  const levels = pet?.petLevels && typeof pet.petLevels === "object" ? pet.petLevels : {};
  return Object.fromEntries(Object.entries(levels).map(([id, level]) => [id, Math.max(1, Math.min(5, Number(level) || 1))]));
}

function syncDailyBond(state) {
  const next = taskSnapshot(state);
  if (previousTasks == null) {
    previousTasks = next;
    return;
  }

  const day = state?.today || localDayKey();
  for (const [id, row] of next) {
    const before = previousTasks.get(id);
    if (!row.done || !before || before.done) continue;

    const isStudySession = STUDY_SESSION_IDS.has(id);
    awardBond(isStudySession ? 2 : 1, {
      key: `${isStudySession ? "study" : "quest"}:${day}:${id}`,
      reason: isStudySession ? "Study session complete" : "Today's quest complete",
    });
  }

  previousTasks = next;
}

function syncEvolutionBond(pet) {
  const next = stageSnapshot(pet);
  if (previousLevels == null) {
    previousLevels = next;
    return;
  }

  // Bond writes dispatch another pet-changed event synchronously. Record the
  // new levels first so the nested event cannot reward the same evolution twice.
  const previous = previousLevels;
  previousLevels = next;
  for (const [species, level] of Object.entries(next)) {
    const before = Math.max(1, Number(previous[species]) || 1);
    if (level <= before) continue;
    for (let stage = before + 1; stage <= level; stage++) {
      awardBond(5, {
        key: `evolve:${species}:${stage}`,
        reason: "Companion evolution",
      });
    }
  }
}

function refreshBaseline() {
  try {
    syncDailyBond(store.getState?.() || {});
  } catch {}
  try {
    syncEvolutionBond(getPetSnapshot({ persistRecovery: false }));
  } catch {}
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    try {
      syncDailyBond(store.getState?.() || {});
    } catch {}
  });
}

refreshBaseline();
store.subscribe?.(schedule);

window.addEventListener("scholar:pet-changed", (event) => {
  try {
    syncEvolutionBond(event.detail || getPetSnapshot({ persistRecovery: false }));
  } catch {}
});

window.addEventListener("storage", (event) => {
  if (event.key !== "lux-pet-companion-v1") return;
  try {
    previousLevels = stageSnapshot(getPetSnapshot({ persistRecovery: false }));
  } catch {}
});
