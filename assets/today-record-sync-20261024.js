// Restore already-SAVED same-day task credit to the live Home plan.
// No answer, score, XP, or historical record is created by this display reconciliation.
const safeProgress = (task) => Math.min(Math.max(1, Number(task?.target)||1),
  Math.max(0, Number(task?.progress)||0));
const identityFields = ['assignedSubject','assignedTopic','assignedYear',
  'focusSubject','focusTopic','reviewSubject','reviewTopic'];
function sameAssignment(live, saved) {
  if (!live || !saved || live.id !== saved.id ||
      Number(live.target) !== Number(saved.target) || !(Number(live.target)>0)) return false;
  // A remapped task ID must not inherit another topic's saved answers.
  for (const key of identityFields) {
    const a=live[key],b=saved[key];
    if ((a!=null || b!=null) && String(a??'') !== String(b??'')) return false;
  }
  if (live.href && saved.href) {
    try {
      const a=new URL(live.href,'https://gloria.invalid');
      const b=new URL(saved.href,'https://gloria.invalid');
      if (a.pathname!==b.pathname) return false;
      for (const key of ['task','mode','year','topic','recover']) {
        if (a.searchParams.get(key)!==b.searchParams.get(key)) return false;
      }
    } catch { return false; }
  }
  return true;
}
export function syncTodayFromDatedRecord(daily, row, date) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'') ||
    !Array.isArray(daily) || daily.length !== 10 ||
    !Array.isArray(row?.tasks) || row.tasks.length !== 10 ||
    row.date!==date) return daily;
  const records = new Map(row.tasks.map(task=>[task?.id,task]));
  let changed=false;
  const reconciled=daily.map(task=>{
    if(task?.planDate!==date) return task;
    const saved=records.get(task.id);
    if(!sameAssignment(task,saved))return task;
    // From 24 Oct, current verified CORRECT-only answer evidence overrides
    // older attempt-based credit. Never re-inflate the corrected count.
    if (task.correctOnlyEvidence===true && saved.correctOnlyEvidence!==true)
      return task;
    const fromRecord=safeProgress(saved),live=safeProgress(task);
    if(fromRecord<=live)return task;
    // Carry the independently verified correct-question proof back to Home
    // with the progress. Otherwise the next Daily rebuild could fall from
    // 10/10 to the six journal events Safari managed to retain.
    let verified=null;
    try{
      const mode=new URL(task.href,'https://gloria.invalid').searchParams.get('mode');
      const key=[date,task.id,task.assignedSubject,task.assignedTopic,
        Number(task.assignedYear),mode,Number(task.target)].join('|');
      if(saved.verifiedCorrectAssignment===key&&
         Array.isArray(saved.verifiedCorrectIds)&&
         new Set(saved.verifiedCorrectIds).size>=fromRecord)
        verified={verifiedCorrectIds:saved.verifiedCorrectIds.slice(0,60),
          verifiedCorrectAssignment:key,correctOnlyEvidence:true};
    }catch{}
    changed=true;
    return {...task,progress:fromRecord,done:fromRecord>=Number(task.target),
      ...(verified||{})};
  });
  return changed?reconciled:daily;
}
