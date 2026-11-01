/**
 * Read-only, date-scoped reservations for CURRENT ordinary Year 8 locked Daily.
 * Do not mutate scores, save queues, Recovery receipts, XP, MP or the question bank.
 * A deterministic collision guard, NOT a cross-tab/IndexedDB atomic lock.
 */
const TASK_ORDER=['latin-standard','y8-standard-a','y8-standard-b',
 'y8-mastery-a','y8-mastery-b','y8-mastery-topup-a','y8-mastery-topup-b',
 'weakness-review','due-review'];
const baseId=id=>String(id||'').split('@')[0];
const family=q=>String(q?.conceptId||q?.id||'');
const dayOffset=(today,then)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(today||'')||
    !/^\d{4}-\d{2}-\d{2}$/.test(then||''))return Infinity;
 return Math.round((Date.parse(today+'T12:00:00Z')-Date.parse(then+'T12:00:00Z'))/86400000);
};
const activeQuestion=q=>!!q?.id&&q.status!=='disabled'&&q.status!=='preview'&&
 q.preview!==true&&q.formal!==false&&!q._repair;
const matches=(t,scope)=>{
 if(!t||t.assignedTopic!==scope.topicId||t.assignedSubject!==scope.subject||
    Number(t.assignedYear)!==Number(scope.year)||!t.id||Number(t.target)<=0)return false;
 return !t.planDate||t.planDate===scope.day;
};
const verified=(t,scope)=>{
 const ids=[];
 try{
  const url=new URL(t.href,'https://scholar.invalid');
  const mode=url.searchParams.get('mode');
  const expected=[scope.day,t.id,scope.subject,scope.topicId,scope.year,mode,Number(t.target)].join('|');
  if(t.verifiedCorrectAssignment!==expected||url.searchParams.get('daily')!=='1'||
     url.searchParams.get('locked')!=='1'||url.searchParams.get('task')!==t.id||
     url.searchParams.get('topic')!==scope.topicId||
     Number(url.searchParams.get('year'))!==Number(scope.year)||
     url.pathname!=='/study/'+scope.subject+'/practise')return [];
  for(const id of t.verifiedCorrectIds||[])if(id)ids.push(baseId(id));
 }catch{}
 return ids;
};
function tasksForDay(state,scope){
 const rows=[...(state?.daily||[]).filter(t=>t?.planDate===scope.day),
  ...(state?.dailyLog?.[scope.day]?.tasks||[])];
 const m=new Map();
 for(const t of rows)if(matches(t,scope)){
  // Current-day pinned assignment is authoritative, dated log fills gaps.
  if(!m.has(t.id))m.set(t.id,t);
 }
 return [...m.values()].sort((a,b)=>{
  const x=TASK_ORDER.indexOf(a.id),y=TASK_ORDER.indexOf(b.id);
  return (x<0?999:x)-(y<0?999:y)||a.id.localeCompare(b.id);
 });
}
export function otherYear8DailyReservations(state,loaded,options={}){
 const {day,taskId,subject,year,topicId,recoveryDate}=options;
 const empty=new Set();
 if(!state||!day||day!==state.today||!taskId||!topicId||
    Number(year)!==8||recoveryDate||!['latin','french','biology','chemistry','physics'].includes(subject))
  return empty;
 const byId=new Map((Array.isArray(loaded)?loaded:[])
   .filter(q=>activeQuestion(q)&&
     (q.year==null||Number(q.year)===8)&&
     (!q.subject||q.subject===subject)&&
     (!q.topicId||q.topicId===topicId))
   .map(q=>[baseId(q.id),q]));
 if(!byId.size)return empty;
 const scope={day,taskId,subject,year,topicId};
 const tasks=tasksForDay(state,scope);
 const owners=new Map(),all=new Set(tasks.map(t=>t.id));
 if(!all.has(taskId))return empty; // An unrecognised link must not claim someone else's questions.
 const claim=(id,owner)=>{
  const q=byId.get(baseId(id));
  if(!q||!all.has(owner))return;
  const f=family(q);
  const set=owners.get(f)||new Set();
  set.add(owner);owners.set(f,set);
 };
 for(const t of tasks){
  for(const id of verified(t,scope))claim(id,t.id);
  if(['due-review','weakness-review'].includes(t.id))
   for(const id of t.reviewQuestionIds||[])claim(id,t.id);
 }
 for(const ev of state.formalAttemptLog||[]){
  if(ev?.day!==day||!all.has(ev.dailyTaskId)||ev.subject!==subject||
     Number(ev.year)!==8||ev.repair||ev.formal===false||
     ev.recoveryFor||!ev.questionId||typeof ev.correct!=='boolean')continue;
  claim(ev.questionId,ev.dailyTaskId);
 }
 // A genuine, still-open 48-hour Recovery owns its *historically marked*
 // question IDs. Do not consume them in today's fresh assignments.
 const recoveryFamilies=new Set();
 for(const [past,proofs] of Object.entries(state.recoveryTaskByDay||{})){
  if(![1,2].includes(dayOffset(day,past)))continue;
  const old=state.dailyLog?.[past]?.tasks||[];
  for(const [id,proof] of Object.entries(proofs||{})){
   const t=old.find(row=>row.id===id);
   if(!t||!matches(t,{...scope,day:past})||
     proof?.completed===true||t.done===true)continue;
   for(const qid of Object.keys(proof?.items||{})){
    const q=byId.get(baseId(qid));if(q)recoveryFamilies.add(family(q));
   }
  }
 }
 // Source-order family partition, stable across repeated reads of a bank.
 // Each task reserves up to its ORIGINAL target, not just current progress.
 // Verified question events are allocated first, so resuming does not
 // silently steal an already answered item from its own pinned task.
 const families=[...new Set([...byId.values()].map(family))];
 for(const task of tasks){
  const target=Math.max(1,Math.min(30,Number(task.target)||1));
  const ownCount=()=>[...owners.values()].filter(set=>set.has(task.id)).length;
  for(const f of families){
   if(ownCount()>=target)break;
   if(owners.has(f)||recoveryFamilies.has(f))continue;
   owners.set(f,new Set([task.id]));
  }
 }
 const forbidden=new Set(recoveryFamilies);
 for(const [f,holders] of owners)if(!holders.has(taskId)||holders.size>1)forbidden.add(f);
 // Exclude all variants of a reserved concept, not just a matching ID.
 return new Set([...byId.values()].filter(q=>forbidden.has(family(q))).map(q=>baseId(q.id)));
}
export function excludeOtherYear8Reservations(items,reservedIds=[]){
 const held=reservedIds instanceof Set?reservedIds:new Set(reservedIds||[]);
 return (Array.isArray(items)?items:[]).filter(q=>q?.id&&!held.has(baseId(q.id)));
}
