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
    if(nonnegative(saved.xp)<nonnegative(liveState.xp))
      throw Error("Export has older XP than current iPad progress.");
    const savedTasks=new Map(saved.daily.map(t=>[t.id,t]));
    for(const task of liveState.daily||[]){
      const output=savedTasks.get(task.id);
      if(!output || nonnegative(output.progress)<nonnegative(task.progress) ||
         nonnegative(output.target)!==nonnegative(task.target))
        throw Error("Export does not include the latest progress for "+task.id+".");
    }
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
  // New exports carry a transparent, date-scoped 30-calendar-day audit.
  // Older imports remain readable, but no newly prepared file can claim
  // that a missing day or task completion exists without source evidence.
  if(payload.recent30Days){
    const manifest=payload.recent30Days;
    if(manifest.periodDays!==30 || !Array.isArray(manifest.days) ||
       manifest.days.length!==30 || manifest.through!==saved.today ||
       manifest.days.at(-1)?.date!==saved.today ||
       manifest.days[0]?.date!==manifest.from ||
       manifest.days.some((row,i)=>i && row.date<=manifest.days[i-1].date))
      throw Error("Recent 30-day coverage manifest is incomplete.");
    const today=manifest.days.at(-1);
    if(today.total!==10 || today.done!==saved.daily.filter(t=>
      t.done===true||(Number(t.target)>0&&Number(t.progress)>=Number(t.target))).length)
      throw Error("Backup 30-day summary does not match the latest Daily Tasks.");
    for(const row of manifest.days){
      const original=saved.dailyLog[row.date];
      if(row.total!==null && row.date!==saved.today &&
         (!Array.isArray(original?.tasks)||original.tasks.length!==row.total))
        throw Error("30-day export summary lost dated tasks for "+row.date+".");
      if(row.total===null && row.status!=="no-saved-record" &&
         row.status!=="answers-without-task-record")
        throw Error("Missing Daily Records must be identified as unavailable.");
    }
  }
  return true;
}
