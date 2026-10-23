// Restore the 21–22 October incident's dated Daily Record from SAVED answers.
// Never award XP, Mastery, full-day reward receipts, or generate new answers.
// Only past dates and exact task-tagged, non-Recovery, marked formal attempts.
const AFFECTED_DAYS=["2026-10-21","2026-10-22"];
const REQUIRED=[
 ["latin-vocab","Latin Vocab",30,true],
 ["french-vocab","French Vocab",30,true],
 ["latin-standard","Latin · Daily Standard",10,false],
 ["y8-standard-a","Year 8 · Standard A",10,false],
 ["y8-standard-b","Year 8 · Standard B",10,false],
 ["y8-mastery-a","Year 8 · Mastery A",15,false],
 ["y8-mastery-b","Year 8 · Mastery B",15,false],
 ["weakness-review","Weakness Review",10,false],
 ["due-review","Due Review",10,false],
 ["year9-light","Year 9 · Light Study",15,false]
];
const number=v=>Math.max(0,Number(v)||0);
const isDay=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||""));
const marked=e=>e && isDay(e.day) && typeof e.questionId==="string" &&
 e.questionId.length>0 && typeof e.correct==="boolean" && e.formal!==false &&
 e.repair!==true && !e.recoveryFor && typeof e.dailyTaskId==="string" &&
 (!e.dailyVocab ||
   (e.dailyTaskId==="latin-vocab"&&e.dailyVocab==="latin") ||
   (e.dailyTaskId==="french-vocab"&&e.dailyVocab==="french"));
// Answers may repeat the same question in vocab; credit distinct correctly
// answered question IDs only (not total clicks). Other daily assignments count
// distinct formal answer attempts, including genuine retries.
function proof(events,taskId,vocab){
 const selected=events.filter(e=>marked(e)&&e.dailyTaskId===taskId);
 const ids=new Set();
 for(const e of selected) {
  if(vocab && !e.correct)continue;
  const key=vocab?e.questionId:String(e.attemptId||
    (e.at?e.questionId+"@"+e.at:e.questionId));
  ids.add(key);
 }
 return ids.size;
}
function templateFor(id,day,events){
 const template=REQUIRED.find(t=>t[0]===id);
 const [taskId,title,target]=template;
 // One explicit topic carrying >=target task-owned answers is reliable
 // evidence of an assignment. Without that evidence, use no invented topic.
 const grouped=new Map();
 for(const e of events){
  if(!marked(e)||e.dailyTaskId!==taskId||!e.subject||!e.topicId)continue;
  const key=e.subject+"|"+e.topicId;
  grouped.set(key,(grouped.get(key)||0)+1);
 }
 const ranked=[...grouped.entries()].sort((a,b)=>b[1]-a[1]);
 const top=ranked.length===1||ranked[0]?.[1]>=target?ranked[0]:null;
 const assignment=top?{assignedSubject:top[0].split("|")[0],
   assignedTopic:top[0].slice(top[0].indexOf("|")+1)}:{};
 return {id:taskId,title,target,progress:0,done:false,
   planDate:day,href:"/study",recoveryFallback:true,
   recoveredFromFormalAnswers:true,...assignment};
}
export function rebuildDatedDailyRecords(state){
 if(!state||!isDay(state.today)||!Array.isArray(state.formalAttemptLog))return null;
 const original=state.dailyLog&&typeof state.dailyLog==="object"?
   state.dailyLog:{};
 let updated=null;
 for(const day of AFFECTED_DAYS){
  // The active day is managed exclusively by the actual Daily question engine.
  if(day>=state.today)continue;
  const answers=state.formalAttemptLog.filter(e=>e?.day===day&&marked(e));
  if(!answers.length)continue;
  const previous=original[day];
  const existing=Array.isArray(previous?.tasks)?previous.tasks:[];
  // Never invent a ten-task day from an incomplete or unrelated attempt log.
  // For missing rows require task-tagged answers in ALL 10 known slots.
  if(!existing.length&&REQUIRED.some(([id])=>
      !answers.some(e=>e.dailyTaskId===id)))continue;
  const preserved=new Map(existing.map(t=>[t.id,t]));
  let changed=false;
  const tasks=[];
  for(const [id,title,defaultTarget,vocab] of REQUIRED){
   const old=preserved.get(id);
   if(existing.length&&!old)continue;
   const target=Math.max(1,number(old?.target)||defaultTarget);
   const earned=Math.min(target,proof(answers,id,vocab));
   const oldProgress=number(old?.progress);
   const progress=Math.min(target,Math.max(earned,oldProgress,
      old?.done===true?target:0));
   const done=old?.done===true||progress>=target;
   if(old){
    const next=progress>oldProgress||done!==Boolean(old.done)?
      {...old,progress,done,recoveredFromFormalAnswers:true}:old;
    if(next!==old)changed=true;
    tasks.push(next);
   }else{
    const fallback=templateFor(id,day,answers);
    tasks.push({...fallback,progress,done,target});
    changed=true;
   }
  }
  // A partial saved plan must keep all of its other, differently named IDs.
  for(const t of existing)if(!REQUIRED.some(([id])=>id===t.id))tasks.push(t);
  if(!tasks.length||!changed)continue;
  const done=tasks.filter(t=>t.done===true||
    (number(t.target)>0&&number(t.progress)>=number(t.target))).length;
  const row={...previous,date:day,tasks,done,total:tasks.length,
    complete:done===tasks.length,recoveredFromFormalAnswers:true};
  if(!updated)updated={...original};
  updated[day]=row;
 }
 return updated?{dailyLog:updated}:null;
}
