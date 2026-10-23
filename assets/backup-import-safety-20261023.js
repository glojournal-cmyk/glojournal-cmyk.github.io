// Safety checks for transferring old and new Scholar backup files.
// This module is read-only and never fabricates missing daily completions.
const isRecord=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||""))?String(s):"";
export function latestStudyEvidence(state={}) {
  let days=[];
  for(const key of ["studyDays","activityDays"]) {
    for(const day of (Array.isArray(state[key])?state[key]:[])) if(date(day))days.push(day);
  }
  for(const key of ["dailyLog","dailyVocabByDay","dailyCompleteAwarded"]) {
    for(const [day,value] of Object.entries(isRecord(state[key])?state[key]:{})) {
      if(date(day)&&(key!=="dailyCompleteAwarded" || value===true))days.push(day);
    }
  }
  for(const row of (Array.isArray(state.formalAttemptLog)?state.formalAttemptLog:[])) {
    if(date(row?.day))days.push(row.day);
  }
  // A 0/10 task reset, login, or export timestamp is not study evidence.
  if((state.daily||[]).some(t=>Number(t?.progress)>0)&&date(state.today))days.push(state.today);
  return days.sort().at(-1)||"";
}
export function assessImport(backup,current={}) {
  if(backup?.app!=="lux-scholar-garden"||!isRecord(backup.state)||
     !Number.isFinite(Number(backup.state.xp))||!Array.isArray(backup.state.daily))
    throw Error("Not a valid Scholar Garden progress backup.");
  const source=backup.state;
  const legacy=source.daily.length!==10 || !isRecord(source.dailyLog) ||
      !Array.isArray(source.formalAttemptLog);
  const savedDay=latestStudyEvidence(source);
  const liveDay=latestStudyEvidence(current);
  const currentXp=Math.max(0,Number(current.xp)||0);
  const incomingXp=Math.max(0,Number(source.xp)||0);
  const currentHasProgress=currentXp>0||!!liveDay||
    (Array.isArray(current.history)&&current.history.length>0);
  const newerOnDevice=currentHasProgress&&(
    (liveDay && (!savedDay || liveDay>savedDay)) ||
    currentXp>incomingXp ||
    Object.entries(current.dailyCompleteAwarded||{}).some(([day,done])=>
      done===true&&source.dailyCompleteAwarded?.[day]!==true) ||
    Object.entries(current.dailyLog||{}).some(([day,row])=> {
      if(!isRecord(row))return false;
      const incoming=source.dailyLog?.[day];
      // Never replace a real dated history row with missing/incomplete history.
      if(!isRecord(incoming))return true;
      if(row.complete && !incoming.complete)return true;
      return (row.tasks||[]).some(t=>Number(t.progress)>0 &&
        !(incoming.tasks||[]).some(u=>u.id===t.id&&Number(u.progress)>=Number(t.progress)));
    })
  );
  return {legacy,savedDay,liveDay,currentXp,incomingXp,
    currentHasProgress,newerOnDevice,canReplace:!newerOnDevice};
}
