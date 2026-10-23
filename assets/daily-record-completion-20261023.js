// Read-only completion evidence for Home and the native 30-day record.
// A daily-complete award is issued only when all 10 assigned tasks were done.
// Keep it separate from the task-by-task dailyLog, which can have missing or
// mismatched rows after a date rollover, plan migration, or Safari quota error.
// Never write progress, infer individual question marks or grant XP here.
export function hasDailyCompletionReceipt(state, date) {
  return !!date && state?.dailyCompleteAwarded?.[date] === true;
}
export function hasLiveTenTaskCompletion(state, date) {
  return state?.today === date &&
    Array.isArray(state?.daily) && state.daily.length === 10 &&
    state.daily.every(task => Number(task?.target) > 0 &&
      Number(task?.progress) >= Number(task.target));
}
export function savedRowComplete(state, date) {
  const row = state?.dailyLog?.[date];
  return !!row && (row.complete === true ||
    (Number(row.total) > 0 && Number(row.done) >= Number(row.total)));
}
export function datedDailyStatus(state, date) {
  if (hasDailyCompletionReceipt(state, date) ||
      hasLiveTenTaskCompletion(state, date) ||
      savedRowComplete(state, date)) return 'done';
  const row = state?.dailyLog?.[date];
  if (row?.tasks?.some(task => task?.done === true ||
      Number(task?.progress) > 0) ||
      state?.formalAttemptLog?.some(answer =>
        answer?.day === date || answer?.recoveryFor === date)) return 'partial';
  return 'unopened';
}
export function datedDailyLabel(state, date) {
  const status = datedDailyStatus(state, date);
  if (status === 'done') {
    const row = state?.dailyLog?.[date];
    if (savedRowComplete(state, date) && Number(row?.total) > 0)
      return `Completed · ${row.done}/${row.total}`;
    if (hasLiveTenTaskCompletion(state, date))
      return 'Completed · 10/10 today';
    return 'Completed · saved daily-complete receipt';
  }
  const row = state?.dailyLog?.[date];
  if (status === 'partial') return Number(row?.total) > 0
    ? `Partly completed · ${Number(row.done) || 0}/${row.total}`
    : 'Partly completed';
  return 'Not opened';
}
