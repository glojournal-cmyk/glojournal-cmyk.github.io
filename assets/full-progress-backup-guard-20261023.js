// Validate that an exported Scholar file contains the dated evidence used by
// the real ten-task Home and 30-day Record. Read-only: no credit or restore.
const record = value => value && typeof value==="object" && !Array.isArray(value);
const nonnegative = value => Math.max(0,Number(value)||0);
export function assertFullProgressBackup(payload, liveState) {
  const saved=payload?.state;
  if(payload?.app!=="lux-scholar-garden" || !record(saved))
    throw Error("Invalid Scholar Garden progress export.");
  if(!Array.isArray(saved.daily) || saved.daily.length!==10 ||
     new Set(saved.daily.map(t=>t?.id)).size!==10)
    throw Error("Incomplete export: expected the 10 current Daily Tasks, not an older 6-task snapshot.");
  for(const key of ["dailyLog","dailyCompleteAwarded","dailyVocabByDay"]) {
    if(!record(saved[key]))
      throw Error("Incomplete export: "+key+" is missing. Do not restore this partial file.");
  }
  if(!Array.isArray(saved.formalAttemptLog))
    throw Error("Incomplete export: marked-answer history is missing.");
  if(liveState && record(liveState)) {
    if(saved.today!==liveState.today)
      throw Error("Backup day does not match the currently loaded progress.");
    for(const [day,completed] of Object.entries(liveState.dailyCompleteAwarded||{})) {
      if(completed===true && saved.dailyCompleteAwarded[day]!==true)
        throw Error("Missing saved full-day completion receipt for "+day+".");
    }
    for(const [day,source] of Object.entries(liveState.dailyLog||{})) {
      if(!record(source)||!Array.isArray(source.tasks))continue;
      const target=saved.dailyLog[day];
      if(!record(target)||!Array.isArray(target.tasks))
        throw Error("Missing dated task record for "+day+".");
      const byId=new Map(target.tasks.map(t=>[t.id,t]));
      for(const t of source.tasks) {
        const copy=byId.get(t.id);
        if(!copy || nonnegative(copy.progress)<nonnegative(t.progress))
          throw Error("Dated record "+day+" has lost completed question progress.");
      }
    }
  }
  return true;
}
