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

// Merge two existing records without inventing answers or adding XP. The
// previously saved state always supplies missing older evidence.
const unionDates=(left,right)=>
 [...new Set([...(Array.isArray(left)?left:[]),...(Array.isArray(right)?right:[])])].sort();
const maxCounts=(left,right)=>{
 const out={...(isRecord(left)?left:{})};
 for(const [key,value] of Object.entries(isRecord(right)?right:{}))
   out[key]=Math.max(Number(out[key])||0,Number(value)||0);
 return out;
};
const mergeByLatest=(left,right)=>{
 const out={...(isRecord(left)?left:{})};
 for(const [key,value] of Object.entries(isRecord(right)?right:{})) {
   const before=out[key];
   if(!before || String(value?.lastAt||value?.last||"")>
                  String(before?.lastAt||before?.last||""))out[key]=value;
 }
 return out;
};
function mergeDatedVocab(left,right){
 const result={...(isRecord(left)?left:{})};
 for(const [day,subjects] of Object.entries(isRecord(right)?right:{})){
   const original=isRecord(result[day])?result[day]:{};
   const next={...original};
   for(const [subject,bucket] of Object.entries(isRecord(subjects)?subjects:{})){
     const previous=isRecord(original[subject])?original[subject]:{};
     const items={...(isRecord(previous.items)?previous.items:{})};
     for(const [id,value] of Object.entries(isRecord(bucket?.items)?bucket.items:{}))
       items[id]=items[id]===true||value===true;
     next[subject]={...previous,...bucket,items};
   }
   result[day]=next;
 }
 return result;
}
function mergedAnswers(left,right){
 const out=[],seen=new Set();
 for(const a of [...(Array.isArray(right)?right:[]),
                 ...(Array.isArray(left)?left:[])]) {
   if(!a || typeof a!=="object")continue;
   const key=JSON.stringify([a.attemptId||a.eventId||a.at||"",a.day||"",
     a.questionId||"",a.dailyTaskId||"",a.recoveryFor||"",a.correct]);
   if(seen.has(key))continue;
   seen.add(key);out.push(a);
 }
 return out;
}
// Union existing proof-like ledgers without summing XP or creating new answers.
// Do not use for question scores or review outcomes, which use separate logic.
function joinSavedProof(left,right,depth=0){
  if(left===undefined)return right;
  if(right===undefined)return left;
  if(typeof left==="boolean"&&typeof right==="boolean")return left||right;
  if(typeof left==="number"&&typeof right==="number")
    return Math.max(left,right);
  if(Array.isArray(left)&&Array.isArray(right))
    return unionList(left,right);
  if(isRecord(left)&&isRecord(right)&&depth<8){
    const out={...left};
    for(const [key,value] of Object.entries(right))
      out[key]=joinSavedProof(out[key],value,depth+1);
    return out;
  }
  // The existing device wins on conflicting opaque data.
  return left;
}
function unionList(left,right){
  const values=[],seen=new Set();
  for(const item of [...(Array.isArray(left)?left:[]),
     ...(Array.isArray(right)?right:[])]){
    const id=isRecord(item)?String(item.id||item.key||JSON.stringify(item)):JSON.stringify(item);
    if(seen.has(id))continue;
    seen.add(id);values.push(item);
  }
  return values;
}
function mergeGames(left,right) {
  const result={...(isRecord(left)?left:{})};
  for(const [id,game] of Object.entries(isRecord(right)?right:{})){
    const old=result[id];
    if(!isRecord(game)||!isRecord(old)){
      if(old===undefined)result[id]=game;
      continue;
    }
    const combined={...game,...old};
    for(const key of ["unlocked","points","bestStreak","perfectClears","bossClears","missions","rating"])
      combined[key]=Math.max(Number(old[key])||0,Number(game[key])||0);
    if(Array.isArray(old.stars)||Array.isArray(game.stars)){
      const a=old.stars||[],b=game.stars||[];
      combined.stars=Array.from({length:Math.max(a.length,b.length)},(_,i)=>
        Math.max(Number(a[i])||0,Number(b[i])||0));
    }
    result[id]=combined;
  }
  return result;
}
export function mergeImportProgress(backup,current,mergeDailyHistory){
 const report=assessImport(backup,current);
 const saved=backup.state;
 if(!report.currentHasProgress)
   return {backup,report,merged:false};
 const primary=report.newerOnDevice?current:saved;
 const secondary=report.newerOnDevice?saved:current;
 const result={...secondary,...primary};
 result.xp=Math.max(report.currentXp,report.incomingXp);
 for(const field of ["latinXp","frenchXp","bioXp","chemXp","physXp","engXp","bodyXp"]){
   result[field]=Math.max(Number(current[field])||0,Number(saved[field])||0);
 }
 for(const field of ["studyDays","activityDays","loginDays","peDays"]){
   result[field]=unionDates(current[field],saved[field]);
 }
 result.dailyCompleteAwarded={...(current.dailyCompleteAwarded||{})};
 for(const [day,flag] of Object.entries(saved.dailyCompleteAwarded||{}))
   if(flag===true)result.dailyCompleteAwarded[day]=true;
 result.dailyLog=mergeDailyHistory(current.dailyLog,saved.dailyLog);
 result.dailyVocabByDay=mergeDatedVocab(current.dailyVocabByDay,saved.dailyVocabByDay);
 result.formalAttemptLog=mergedAnswers(current.formalAttemptLog,saved.formalAttemptLog);
 for(const field of ["seenTotal","seenCorrect"]){
   result[field]=maxCounts(current[field],saved[field]);
 }
 for(const field of ["reviews","topicStats","skillStats"]){
   result[field]=mergeByLatest(current[field],saved[field]);
 }
 result.history=mergedAnswers(current.history,saved.history).slice(0,100);
 // Preserve unlocks, completion proofs, writing, game records and dated
 // recovery rather than throwing out the non-primary device's entire maps.
 for(const field of ["collectibles","medals","unlockedOutfits","unlockedScenes",
                     "passedPapers","lessonsDone","recentQuestionIds"]){
   result[field]=unionList(current[field],saved[field]);
 }
 for(const field of ["dailyCurriculumEvidenceByDay","recoveryTaskByDay",
                     "recoveryVocabByDay","recoveryAwarded","rewardLedgerByDay",
                     "gameRewardByDay","peRewardByDay","rewardedWriting",
                     "aiHelpByDay","aiHelpLedgerByDay","activity","eventCounts",
                     "subjectQuestions","qualifyingGameByDay","writing"]){
   result[field]=joinSavedProof(current[field],saved[field])||{};
 }
 result.games=mergeGames(current.games,saved.games);
 // A newer current device keeps its current tasks and active streak/awards.
 // The incoming file's older six-task plan is never substituted for today's
 // ten-task progress when the device already has matching ten-task progress.
 if(current.today===saved.today && Array.isArray(current.daily) &&
    current.daily.length===10 && saved.daily.length!==10)
   result.daily=current.daily;
 // Never add two device XP totals; highest existing earned total is safer.
 return {backup:{...backup,state:result},report,merged:true};
}
