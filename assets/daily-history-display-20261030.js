// Read-only Daily History presentation. Never edit saved learner evidence.
export const CORE_DAILY_TASK_IDS = Object.freeze([
  'latin-vocab','french-vocab','latin-standard','y8-standard-a','y8-standard-b',
  'y8-mastery-a','y8-mastery-b','weakness-review','due-review','year9-light'
]);
const ARCHIVED_OLD_DAILY_IDS = new Set([
  'study-session','year8-long-review','tend-garden','play-game'
]);
const nonnegative = value => Math.max(0, Number(value) || 0);
const completed = task => task?.done === true ||
  (Number(task?.target) > 0 && nonnegative(task.progress) >= Number(task.target));

// The iPad 26/28 October emergency backups preserve four older Daily IDs in
// addition to the 10 active assignments. Retain all 14 for export/recovery;
// only the presentation of a complete, unambiguous canonical set uses 10.
export function dailyHistorySummary(row, date) {
  const tasks = Array.isArray(row?.tasks) ? row.tasks.filter(task => task && typeof task.id === 'string' && task.id) : [];
  const savedTotal = nonnegative(row?.total) || tasks.length;
  const savedDone = nonnegative(row?.done);
  const coreIds = new Set(CORE_DAILY_TASK_IDS);
  const extra = tasks.filter(task => !coreIds.has(task.id));
  const plain = {total:savedTotal,done:savedDone,extraSavedRecords:0,canonicalOnly:false,
    includesOldTasks:tasks.length > 10 && extra.some(task => ARCHIVED_OLD_DAILY_IDS.has(task.id))};
  if (date < '2026-10-24' || (tasks.length <= 10 && savedTotal <= 10)) return plain;
  const core = tasks.filter(task => coreIds.has(task.id));
  // Only strip the FOUR documented archived task identities. A legitimate
  // Mastery top-up or any unknown extra must remain visible for investigation.
  if (core.length !== 10 || new Set(core.map(task => task.id)).size !== 10 ||
      extra.some(task => !ARCHIVED_OLD_DAILY_IDS.has(task.id))) return plain;
  return {
    total:10,
    done:core.filter(completed).length,
    extraSavedRecords:extra.length,
    canonicalOnly:true,
    includesOldTasks:false
  };
}
