export * from "./index-BLVOhKhN.core.js";
import { C as store, U as collectibles, Ut as todayKey } from "./index-BLVOhKhN.core.js";

const FRENCH_DAILY_HREF = "/session/french-vocab";

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

  // v9 -> v10 previously fabricated a perfect consecutive run ending on migration day.
  const today = todayKey();
  const expected = new Set(Array.from({ length: peDays.length }, (_, i) => shiftDay(today, -i)));
  if (!peDays.every((day) => expected.has(day))) return null;

  const fromHistory = [...new Set((state.history || [])
    .filter((entry) => entry?.kind === "pe_complete" && entry?.at)
    .map((entry) => localDayFromIso(entry.at))
    .filter(Boolean))];

  // If history supports every date, this can be a genuine run. Otherwise keep only verifiable dates.
  return fromHistory.length < peDays.length ? fromHistory : null;
}

function normalizeDaily(daily) {
  if (!Array.isArray(daily)) return daily;
  let changed = false;
  const next = daily.map((task) => {
    if (task?.id === "french-vocab" && task.href !== FRENCH_DAILY_HREF) {
      changed = true;
      return { ...task, href: FRENCH_DAILY_HREF, detail: "Eight verified French vocabulary questions." };
    }
    return task;
  });
  return changed ? next : daily;
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
    // PE reward progress is based on different PE days only. Never allow session count to act as days.
    if ((state.peSessions || 0) !== peCount) patch.peSessions = peCount;
  }

  const daily = normalizeDaily(state.daily);
  if (daily !== state.daily) patch.daily = daily;

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

  // A failed 0-star attempt must not consume the day's first rewarded completion slot.
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

  // Formal progression counts a qualifying 2-3★ completion once per game per calendar day.
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

store.setState({
  hydrateDay: patchedHydrateDay,
  recordPe: patchedRecordPe,
  recordGame: patchedRecordGame,
});

normalizeState();
store.subscribe(() => normalizeState());
store.persist?.onFinishHydration?.(() => normalizeState());
