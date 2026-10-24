/* Recovery Quest UI: read-only display; the app records eligible answers separately. */
import { C as store, Ut as todayKey, st as getTopicCatalog } from "/assets/index-BLVOhKhN.js?v=20261024-festival-scenes1&ux=20261013-corrections2&uxfix=20261022-priority-ux1";
import {buildYear8DailyV2} from './year8-daily-v2-20261018.js';
import {eligibleRecoveryTasks,prepareUnopenedRecovery,recordRecoveryAnswer,matchesAssignedPracticeEvidence,reconcileRecoveredTaskHistory} from "./recovery-task-ledger-20261017.js?v=20261018-receipt2";
import {mergeDailyHistory,mergeDailyRecordRow,reconcileOriginalCurriculumHistory} from "./daily-record-integrity-20261018.js?v=20261023-preserve-ten1";
import {readMarkedAnswers} from "./durable-study-evidence-20261018.js?v=20261018-evidence-v1";
import {applyRecoveryReceipts} from "./recovery-receipt-20261018.js?v=20261018-receipt2";
import {readAllBackups} from "./backup-vault-20261011.js?v=20261011-vault2&ux=20261013-corrections2";
const DAY_MS=86400000;
const fallbackFor=(state,date)=>date>='2026-10-19'?buildYear8DailyV2({...state,today:date,daily:[]},getTopicCatalog,{}):null;
const dateAt=(d,n)=>new Date(Date.parse(d+"T12:00:00Z")+n*DAY_MS).toISOString().slice(0,10);
function recoveryRows(state){
 const today=todayKey(),out=[];
 for(let back=1;back<=2;back++){
  const date=dateAt(today,-back);
  for(const subject of ["french","latin"]){
   const task=globalThis.LuxRecoveryVocabSource?.(state,date,subject)?.task || null;
   if(!task)continue;
   const rec=state.recoveryVocabByDay?.[date]?.[subject]||{};
   if(Number(task.progress)>=Number(task.target)&&!rec.completed&&!task.recovered)continue;
   const base=Math.max(0,Math.min(30,Number(rec.originalCount ?? task.progress)||0));
   const target=Math.max(1,30-base);
   const current=Math.max(0,Object.values(rec.items||{}).filter(Boolean).length);
   const credited=state.dailyLog?.[date]?.tasks?.some(t=>t.id===subject+'-vocab' && (t.done || Number(t.progress)>=Number(t.target)));
   out.push({date,subject,base,target,current,credited:!!credited,done:!!credited||rec.completed===true||current>=target,
    url:"/study/"+subject+"/practise?daily=1&locked=1&year=8&mode=y8vocab&task="+subject+"-vocab&recover="+date});
  }
 }
 return out;
}
function reconcileCompletedRecoveries(){
 // A completed recovery can survive in its proof ledger even if the
 // corresponding historical dailyLog write was lost under iPad quota.
 const state=store.getState(),today=todayKey();
 const log={...(state.dailyLog||{})};
 let changed=false;
 for(let back=1;back<=2;back++){
  const date=dateAt(today,-back);
  for(const subject of ["french","latin"]){
   const proof=state.recoveryVocabByDay?.[date]?.[subject];
   if(proof?.completed!==true)continue;
   const id=subject+"-vocab";
   const source=globalThis.LuxRecoveryVocabSource?.(state,date,subject);
   const existing=log[date];
   const tasks=Array.isArray(existing?.tasks)&&existing.tasks.length
    ? existing.tasks : (source?.tasks||[]);
   if(!tasks.some(task=>task.id===id))continue;
   if(tasks.some(task=>task.id===id&&(task.done||Number(task.progress)>=Number(task.target))))continue;
   const repaired=tasks.map(task=>task.id===id?{...task,progress:Number(task.target)||30,done:true,recovered:true}:task);
   const done=repaired.filter(task=>task.done||Number(task.target)>0&&Number(task.progress)>=Number(task.target)).length;
   log[date]={...(existing||{}),date,tasks:repaired,done,total:repaired.length,complete:done===repaired.length};
   changed=true;
  }
 }
 if(changed)store.setState({dailyLog:log});
}
// Repair dated formal practice on the home page too. This module is
// independently cache-busted so older iPads running a cached core still
// recover genuine saved answers without clearing Safari data or replaying
// the full session.
// A quiz can reach Session Complete while its per-question Recovery route
// ledger was never committed. Accept a finished, marked QUESTION SESSION as
// independent evidence, not a page visit or a click on a navigation link.
function commitCompletedRecoverySession(input){
 try{
  const params=new URLSearchParams(location.search);
  const date=params.get("recover")||input?.date,taskId=params.get("task")||input?.taskId;
  if(!date||date!==input?.date||taskId!==input?.taskId)return false;
  if(!["y8-practise","y8-mastery","year8-long-review","latin-standard","y8-standard-a","y8-standard-b","y8-mastery-a","y8-mastery-b","weakness-review","due-review","year9-light"].includes(taskId))return false;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!["french","latin","biology","chemistry","physics"].includes(input.subject))return false;
  const current=store.getState(),row=current.dailyLog?.[date];
  const target=row?.tasks?.find(task=>task.id===taskId);
  if(!target||Number(target.target)<=0)return false;
  const checked=Array.isArray(input.answers)?input.answers.filter(a=>
    a&&a.questionId&&a.formal!==false&&!a.repair&&typeof a.correct==="boolean"&&
    matchesAssignedPracticeEvidence({
      ...a,subject:input.subject,year:Number(input.year)||8,
      dailyTaskId:taskId,formal:true,repair:false
    },target,taskId)):[];
  // Completion credit is based on the actual marked base questions in this
  // session, not the number of times its result screen has been opened.
  const unique=new Set(checked.map(a=>String(a.questionId)));
  if(unique.size<Number(target.target)||target.done)return false;
  const dayKey=date+":"+taskId;
  const proof={taskId,day:date,subject:input.subject,
    topicId:target.assignedTopic||target.reviewTopic||null,
    questionIds:[...unique].slice(0,Number(target.target)),
    firstPassCorrect:checked.filter(a=>a.correct).length,
    source:"verified-session-completion",at:new Date().toISOString()};
  const tasks=row.tasks.map(t=>t.id===taskId?{
    ...t,progress:Number(t.target),done:true,recovered:true,
    recoveredFromSession:true
  }:t);
  const done=tasks.filter(t=>t.done||Number(t.progress)>=Number(t.target)).length;
  const proofs={...(current.recoverySessionProofByDay||{})};
  proofs[dayKey]=proof;
  store.setState({
    recoverySessionProofByDay:proofs,
    dailyLog:{...(current.dailyLog||{}),[date]:{
      ...row,tasks,done,total:tasks.length,complete:done===tasks.length
    }}
  });
  return true;
 }catch(error){console.warn("Recovery session completion could not be recorded",error);return false}
}
if(typeof globalThis!=="undefined")globalThis.LuxRecoveryCommitCompletedSession=commitCompletedRecoverySession;

// The route guard used to replace a Recovery link with today's frontier and
// drop ?recover=. Those finished answers are still in the formal log, dated
// today, with no recoveryFor. Give them back to the missed day only when the
// subject AND topic are that day's own assignment. Never guess a subject.
function reclaimRedirectedRecovery(state){
 const today=todayKey();
 const entries=(state?.formalAttemptLog||[]).filter(a=>
   a&&a.questionId&&typeof a.correct==='boolean'&&a.formal!==false&&!a.repair&&
   !a.recoveryFor&&(a.day===today||String(a.at||'').slice(0,10)===today)&&
   !['french-vocab','latin-vocab'].includes(a.dailyTaskId)&&
   !['french','latin'].includes(a.dailyVocab));
 if(!entries.length)return state;
 let next=state;
 const used=new Set();
 for(const back of [2,1]){
   const date=dateAt(today,-back);
   for(const taskId of ['y8-practise','y8-mastery','year8-long-review']){
     const task=next.dailyLog?.[date]?.tasks?.find(t=>t.id===taskId);
     if(!task||task.done||Number(task.progress)>=Number(task.target))continue;
     const subject=task.assignedSubject||task.reviewSubject||task.focusSubject||null;
     const topic=task.assignedTopic||task.reviewTopic||task.focusTopic||null;
     // A named assignment only accepts that subject and topic.
     // "Foundation practice" with no saved topic is the generic recovery row:
     // the button itself opened the set, so a finished run tagged y8-practise
     // belongs to this day even though the old guard deleted ?recover=.
     const matched=entries.filter(a=>{
       const key=a.attemptId||a.at||a.questionId;
       if(used.has(key))return false;
       if(subject&&topic)return a.subject===subject&&a.topicId===topic;
       if(topic||subject)return false;
       return a.dailyTaskId===taskId;
     });
     const keys=matched.map(a=>a.attemptId||a.at||a.questionId);
     if(new Set(keys).size<Number(task.target))continue;
     let accepted=false;
     for(const entry of matched){
       const outcome=recordRecoveryAnswer(next,{
         today,date,taskId,
         questionId:String(entry.questionId)+'@'+(entry.attemptId||entry.at||'reclaimed'),
         correct:!!entry.correct
       });
       if(outcome.accepted){next=outcome.state;accepted=true;}
     }
     if(accepted)for(const key of keys)used.add(key);
   }
 }
 return next;
}
function backfillDatedFocusEvidence(){
 const original=store.getState(),today=todayKey();
 let next=reclaimRedirectedRecovery(original);
 for(let back=1;back<=2;back++){
   const date=dateAt(today,-back);
   const day=next.dailyLog?.[date];
   if(!Array.isArray(day?.tasks)||!day.tasks.length)continue;
   const entries=(original.formalAttemptLog||[]).filter(a=>
     a?.recoveryFor===date && a.questionId &&
     typeof a.correct==='boolean' && a.formal!==false && !a.repair &&
     !['french-vocab','latin-vocab'].includes(a.dailyTaskId) &&
     !['french','latin'].includes(a.dailyVocab));
   if(!entries.length)continue;
   // Repair all three Year 8 tasks using genuinely marked Recovery answers.
   // Saved work can have a missing task ID from the older practice router;
   // match the ORIGINAL Year 8 subject/topic instead of today's assignment.
   for(const taskId of ['y8-practise','y8-mastery','year8-long-review']){
     const task=next.dailyLog?.[date]?.tasks?.find(t=>t.id===taskId);
     if(!task||task.done||Number(task.progress)>=Number(task.target))continue;
     const matching=entries.filter(entry=>
       matchesAssignedPracticeEvidence(entry,task,taskId));
     // Do not add old partial progress twice when it is already represented
     // by these saved historical answers.
     if(matching.length&&!next.recoveryTaskByDay?.[date]?.[taskId]&&Number(task.progress)>0){
       const all=next.recoveryTaskByDay||{},perDay=all[date]||{};
       next={...next,recoveryTaskByDay:{...all,[date]:{
         ...perDay,[taskId]:{items:{},originalCount:0,totalNeeded:Number(task.target),completed:false}
       }}};
     }
     for(const entry of matching){
       const proof=next.recoveryTaskByDay?.[date]?.[taskId];
       const rawId=String(entry.questionId);
       const eventKey=proof?.items&&Object.prototype.hasOwnProperty.call(proof.items,rawId)
         ?rawId:(rawId+'@'+(entry.attemptId||entry.at||'historical'));
       const outcome=recordRecoveryAnswer(next,{
         today,date,taskId,questionId:eventKey,correct:entry.correct
       });
       if(outcome.accepted)next=outcome.state;
     }
   }
   for(const taskId of ['study-session','adaptive-focus']){
     const task=next.dailyLog?.[date]?.tasks?.find(t=>t.id===taskId);
     if(!task||task.done||Number(task.progress)>=Number(task.target))continue;
     const subject=task.focusSubject||task.assignedSubject||task.reviewSubject;
     const topic=task.focusTopic||task.assignedTopic||task.reviewTopic;
     const matched=taskId==='study-session' ? entries : entries.filter(a=>
       (!subject||a.subject===subject)&&(!topic||a.topicId===topic));
     if(!matched.length)continue;
     // If the historical row already shows partial progress but no proof
     // survives, don't add those old marks a second time as a baseline.
     if(!next.recoveryTaskByDay?.[date]?.[taskId]&&Number(task.progress)>0){
       const all=next.recoveryTaskByDay||{},forDay=all[date]||{};
       next={...next,recoveryTaskByDay:{...all,[date]:{
         ...forDay,[taskId]:{items:{},originalCount:0,totalNeeded:Number(task.target),completed:false}
       }}};
     }
     for(const entry of matched){
       const outcome=recordRecoveryAnswer(next,{
         today,date,taskId,questionId:entry.questionId,correct:entry.correct
       });
       if(outcome.accepted)next=outcome.state;
     }
   }
 }
 if(JSON.stringify(next.recoveryTaskByDay||{})!==JSON.stringify(original.recoveryTaskByDay||{})||
    JSON.stringify(next.dailyLog||{})!==JSON.stringify(original.dailyLog||{})){
   store.setState({
     recoveryTaskByDay:next.recoveryTaskByDay,
     dailyLog:next.dailyLog
   });
 }
}
// A previous bad recompute may already have replaced the visible row.
 // Keep the best *already saved* version in memory while navigating, and
 // attempt non-destructive restoration from the existing iPad backup vault.
let bestDailyHistory={};
let archiveChecked=false;
let archiveCheckPromise=null;
let archiveRecoveredDays=0;
function protectDailyRecord(){
 const state=store.getState(),live=state.dailyLog||{};
 // The Recovery ledger is authoritative for the six historical items shown
 // in the 18 October iPad screenshot, even if the saved daily row was
 // replaced by a single completed French vocabulary placeholder.
 const recovered=reconcileRecoveredTaskHistory(state,live);
 const repaired=reconcileOriginalCurriculumHistory(state,recovered);
 bestDailyHistory=mergeDailyHistory(bestDailyHistory,repaired);
 const saved=applyRecoveryReceipts(mergeDailyHistory(live,bestDailyHistory));
 if(JSON.stringify(saved)!==JSON.stringify(live))store.setState({dailyLog:saved});
}
async function restoreArchivedDailyRecord(){
 if(archiveChecked)return;
 if(archiveCheckPromise)return archiveCheckPromise;
 archiveCheckPromise=(async()=>{
   try {
     const snapshots=await readAllBackups();
     let candidates={};
     for(const snapshot of Object.values(snapshots||{})){
       if(!snapshot?.data)continue;
       let parsed=null;
       try{parsed=JSON.parse(snapshot.data)}catch{continue}
       if(parsed?.app!=="lux-scholar-garden"||!parsed.state)continue;
       const old=parsed.state;
       // Also reconstruct dates whose original dailyLog was accidentally
       // replaced, but whose marked recovery proof survives in an older backup.
       // All credit is derived from already SAVED answers, not this UI action.
       const oldHistory=reconcileOriginalCurriculumHistory(old,
         reconcileRecoveredTaskHistory(old,old.dailyLog||{}));
       candidates=mergeDailyHistory(candidates,oldHistory);
       for(const [proofDate,bySubject] of Object.entries(old.recoveryVocabByDay||{})){
         const historical=candidates[proofDate];
         if(!historical?.tasks?.length)continue;
         const repaired=historical.tasks.map(task=>{
           const lang=task.id==="french-vocab"?"french":
             task.id==="latin-vocab"?"latin":null;
           return lang&&bySubject?.[lang]?.completed===true
             ?{...task,progress:Math.max(Number(task.progress)||0,Number(task.target)||30),
               done:true,recovered:true}:task;
         });
         candidates=mergeDailyHistory(candidates,{[proofDate]:{
           ...historical,tasks:repaired
         }});
       }
       // The newest day in an old snapshot can still live in state.daily,
       // before it was sealed into dailyLog at midnight.
       if(/^\d{4}-\d{2}-\d{2}$/.test(old.today||"")&&
           Array.isArray(old.daily)&&old.daily.length&&old.today<=todayKey()){
         const recovered={date:old.today,tasks:old.daily.map(t=>({
           ...t,done:t?.done===true||Number(t?.progress)>=Number(t?.target)
         }))};
         candidates=mergeDailyHistory(candidates,{[old.today]:recovered});
       }
       candidates=reconcileOriginalCurriculumHistory(old,candidates);
     }
     const before=store.getState(),current=before.dailyLog||{};
     const repaired=mergeDailyHistory(current,candidates);
     const changed=Object.entries(repaired).filter(([date,row])=>
       JSON.stringify(current[date])!==JSON.stringify(row)).length;
     bestDailyHistory=mergeDailyHistory(bestDailyHistory,repaired);
     if(changed){archiveRecoveredDays+=changed;store.setState({dailyLog:repaired})}
   }catch(error){
     // A blocked/offline iPad vault is not a reason to clear existing data.
     console.warn("Daily Record archived restore unavailable",error);
   }finally{archiveChecked=true}
 })().finally(()=>{archiveCheckPromise=null});
 return archiveCheckPromise;
}
function mount(){
 // The router can return Home without loading a fresh HTML document.
 // The recovery module now loads on practice and game entry routes as well.
 if(location.pathname!=="/"&&location.pathname!=="/index.html")return;
 // On the RPG Home, the Recovery button displays this existing evidence-
 // based panel as a fixed dialog. Attach it to body (not a React-owned node)
 // so React updates cannot detach it. Keep it hidden until the dialog opens.
 const rpgHome=!!document.getElementById("lux-rpg-live-home");
 if(rpgHome&&!document.documentElement.classList.contains("lux-rpg-recovery-open"))return;
 const card=rpgHome?document.body:
   [...document.querySelectorAll("main h2")].find(n=>n.textContent.trim()==="Raise her today")?.parentElement?.parentElement?.parentElement;
 if(!card){
  if(!mount.waiting){
   mount.waiting=true;
   let tries=0;
   const timer=setInterval(()=>{
    tries+=1;
    const ready=location.pathname==="/"||location.pathname==="/index.html"
     ?[...document.querySelectorAll("main h2")].some(n=>n.textContent.trim()==="Raise her today")
     :false;
    if(ready||tries>40||(location.pathname!=="/"&&location.pathname!=="/index.html")){
     clearInterval(timer);mount.waiting=false;if(ready)mount();
    }
   },100);
  }
  return;
 }
 let host=document.getElementById("lux-recovery-quests");
 if(!host){host=document.createElement("details");host.id="lux-recovery-quests";}
 // Client-side navigation and React rerenders can detach the old card.
 // Reattach the SAME recovery panel, rather than waiting for an app restart.
 if(host.parentElement!==card)card.append(host);
 host.hidden=false;
 protectDailyRecord();
 // Reading every historical IndexedDB snapshot caused avoidable memory use
 // on iPad. The Recovery dialog reads existing dated records immediately;
 // archival reconstruction remains available via an explicit button below.
 if(!archiveChecked&&!rpgHome)void restoreArchivedDailyRecord();
 reconcileCompletedRecoveries();
 backfillDatedFocusEvidence();

 const state=store.getState(),today=todayKey(),rows=recoveryRows(state);
 const dates=[dateAt(today,-1),dateAt(today,-2)];
 const byDate=Object.fromEntries(dates.map(date=>[date,eligibleRecoveryTasks(state,date,today)]));
 const signature=JSON.stringify([dates,rows,byDate]);
 if(host.dataset.signature===signature)return;
 const hadRendered=host.dataset.recoveryRendered==="1";
 const keptOpen=host.open;
 const previous=host.querySelector('select')?.value;
 host.dataset.signature=signature;
 host.replaceChildren();
 const unfinished=dates.reduce((sum,date)=>sum+(byDate[date].filter(t=>!t.done).length||rows.filter(r=>r.date===date&&!r.done).length),0);
 // A completed answer must NOT collapse or hide Recovery on return Home.
 // Respect a user's deliberate open/closed choice across rerenders.
 host.open=hadRendered?keptOpen:unfinished>0;
 host.dataset.recoveryRendered="1";
 const summary=document.createElement('summary');
 summary.textContent=unfinished?'Recovery · '+unfinished+' tasks available':'Recovery · choose a date';
 host.append(summary);
 const title=document.createElement('h3');title.textContent='Quest Recovery · choose a date';host.append(title);
 const label=document.createElement('label');label.textContent='Missed date ';label.htmlFor='lux-recovery-date';
 const select=document.createElement('select');select.id='lux-recovery-date';
 for(const date of dates){const option=document.createElement('option');option.value=date;option.textContent=date;select.append(option)}
 if(dates.includes(previous))select.value=previous;
 label.append(select);host.append(label);
 const list=document.createElement('div');host.append(list);
 function taskLink(task,date){
   // Only link answer-based tasks whose practice route can carry the
   // original task ID and recovery date. No fake credit for garden/game.
   const topic=task.focusTopic||task.assignedTopic||task.reviewTopic;
   // Do not downgrade a saved Year 9 focus to Year 8. Its question bank
   // would then omit the assigned topic and none of its answers could count.
   const savedHref=typeof task.href==='string'?task.href:'';
   const savedYear=(()=>{
     try{return new URL(savedHref,location.origin).searchParams.get('year')}catch{return null}
   })();
   const year=Number(task.assignedYear||String(topic||'').match(/-y(\d+)-/)?.[1]||savedYear)||8;
   const query=new URLSearchParams({daily:'1',locked:'1',year:String(year),task:task.id,recover:date});
   const stages=['y8-mastery','year8-long-review'];
   const proof=state.recoveryTaskByDay?.[date]?.[task.id];
   const evidence=Object.keys(proof?.items||{}).length;
   const baseline=Math.max(0,Number(proof?.originalCount??task.progress)||0);
   const nextMode=stages.includes(task.id)
     ? (baseline+evidence>=10?'year8long':'standard') : 'standard';
   // Use the missed day's SAVED assignment, not today's re-assigned subject.
   // Inferring from its title routed Science and Latin answers into French.
   if(typeof task.href==='string'&&task.href.startsWith('/study/')){
     const url=new URL(task.href,location.origin);
     if(/^\/study\/(french|latin|biology|chemistry|physics)\/practise\/?$/.test(url.pathname)){
       for(const [key,value] of query)url.searchParams.set(key,value);
       if(stages.includes(task.id))url.searchParams.set('mode',nextMode);
       // A missed "due" or "weak" assignment may no longer be due today;
       // use a regular question set from the SAME saved topic instead.
       if(['study-session','adaptive-focus'].includes(task.id))url.searchParams.set('mode','standard');
       if(topic)url.searchParams.set('topic',topic);
       return url.pathname+'?'+url.searchParams.toString();
     }
   }
   const allowed=['french','latin','biology','chemistry','physics'];
   if(task.id==='mistake-review'){
     const error=Object.values(state.reviews||{}).find(r=>r?.wrong===true&&allowed.includes(r.subject));
     return '/study/'+(error?.subject||'french')+'/practise?'+query;
   }
   if(['y8-practise','y8-mastery','year8-long-review','latin-standard','y8-standard-a','y8-standard-b','y8-mastery-a','y8-mastery-b','weakness-review','due-review','year9-light','adaptive-focus','study-session'].includes(task.id)){
     const inferred=allowed.find(subject=>String(task.title||'').toLowerCase().includes(subject))||'french';
     const subject=allowed.find(key=>key===task.focusSubject||key===task.assignedSubject||key===task.reviewSubject)||inferred;
     query.set('mode',nextMode);
     if(topic)query.set('topic',topic);
     return '/study/'+subject+'/practise?'+query;
   }
   return null;
 }
 function showDate(){
   list.replaceChildren();const date=select.value;
   const existing=state.dailyLog?.[date];
   if(!existing){
     const note=document.createElement('p');note.textContent='No saved daily assignment for this date. Create an alternative ten-task recovery plan; original personalised topics cannot be reconstructed.';
     list.append(note);
     const create=document.createElement('button');create.type='button';
     create.textContent='Prepare ten recovery tasks';
     create.addEventListener('click',()=>{
       const current=store.getState(),result=prepareUnopenedRecovery(current,date,todayKey(),fallbackFor(current,date));
       if(result.created)store.setState({dailyLog:result.state.dailyLog});
     });list.append(create);
   }else{
     if(existing.recoveryFallback){
       const note=document.createElement('p');note.textContent='Replacement plan · not the original personalised assignment. Only verified work receives recovery credit.';list.append(note);
     }
     for(const task of byDate[date]){
       if(task.id==='french-vocab'||task.id==='latin-vocab')continue;
       const item=document.createElement('div');item.className='lux-recovery-item';
       const name=document.createElement('strong');name.textContent=task.title;item.append(name);
       const proof=state.recoveryTaskByDay?.[date]?.[task.id];
       const current=task.id==='mistake-review'
         ? Object.values(proof?.items||{}).filter(Boolean).length
         : Object.keys(proof?.items||{}).length;
       const status=document.createElement('span');
       const needed=Math.max(1,Number(task.target)-Number(proof?.originalCount??task.progress));
       const remaining=Math.max(0,needed-current);
       status.textContent=task.done?'Completed ✓ · credited to '+date:current+' marked recovery answers · '+remaining+' still needed';
       item.append(status);
       if(!task.done){
         const url=taskLink(task,date);
         if(url){const a=document.createElement('a');a.href=url;a.textContent='Practise recovery →';item.append(a)}
         else if(task.id==='tend-garden'){
           const water=document.createElement('a');water.href='/garden?recover='+date+'&task=tend-garden';
           water.textContent='Go to garden and water 🌱';item.append(water);
         }else if(task.id==='play-game'){
           const game=document.createElement('button');game.type='button';game.textContent='Play a game to recover →';
           game.addEventListener('click',()=>{
             const current=store.getState();
             store.setState({recoveryPendingGame:{date,taskId:'play-game',startedAt:Date.now()}});
             location.href='/play';
           });item.append(game);
         }else{const unavailable=document.createElement('small');unavailable.textContent='Choose a question-based task to continue recovery';item.append(unavailable)}
       }
       list.append(item);
     }
   }
   const selected=rows.filter(r=>r.date===date);
   for(const row of selected){
     const item=document.createElement('div');item.className='lux-recovery-item';
     const name=document.createElement('strong');name.textContent=(row.subject==='french'?'French':'Latin')+' Vocab';item.append(name);
     const status=document.createElement('span');
     status.textContent=row.done?'Recovered ✓ · credited to '+date:row.current+' / '+row.target+' correct recovery answers';item.append(status);
     if(!row.done){const a=document.createElement('a');a.href=row.url;a.textContent='Continue recovery →';item.append(a)}
     list.append(item);
   }
 }
 select.addEventListener('change',showDate);showDate();

 // Read-only Recovery audit. Shows safe counts, never student answers,
 // never overwrites progress, and can be screenshotted if the iPad misses credit.
 const audit=document.createElement('details');
 audit.className='lux-recovery-audit';
 const auditTitle=document.createElement('summary');
 auditTitle.textContent='Recovery check · saved answer counts';
 const note=document.createElement('p');
 note.textContent='These counts are from this device. Reopening the app can help confirm whether they were saved. No answers or names are shown.';
 const results=document.createElement('pre');
 results.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.65 ui-monospace,monospace;padding:12px;border-radius:10px;background:#f4efe3';
 const auditDates=[...new Set([
   ...dates,...Object.keys(state.recoveryVocabByDay||{}),
   ...Object.keys(state.recoveryTaskByDay||{}),
   ...(state.formalAttemptLog||[]).map(a=>a?.recoveryFor).filter(Boolean)
 ])].filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)).sort().reverse().slice(0,14);
 const report=auditDates.map(date=>{
   const row=state.dailyLog?.[date];
   const log=row?.tasks?.length?row.done+'/'+row.total:'not saved';
   const dated=(state.formalAttemptLog||[]).filter(a=>a?.recoveryFor===date);
   const formal=dated.filter(a=>a?.questionId&&typeof a.correct==='boolean'&&a.formal!==false&&!a.repair);
   const excludedVocab=a=>['french-vocab','latin-vocab'].includes(a.dailyTaskId)||
     ['french','latin'].includes(a.dailyVocab);
   const general=formal.filter(a=>!excludedVocab(a));
   const studyTask=row?.tasks?.find(t=>t.id==='study-session');
   const focusTask=row?.tasks?.find(t=>t.id==='adaptive-focus');
   const focusSubject=focusTask?.focusSubject||focusTask?.assignedSubject||focusTask?.reviewSubject;
   const focusTopic=focusTask?.focusTopic||focusTask?.assignedTopic||focusTask?.reviewTopic;
   const focusAnswers=general.filter(a=>(!focusSubject||a.subject===focusSubject)&&
     (!focusTopic||a.topicId===focusTopic));
   const tags={};
   for(const entry of dated){const id=entry.dailyTaskId||'no task ID';tags[id]=(tags[id]||0)+1;}
   const vocab=['french','latin'].map(subject=>{
     const proof=state.recoveryVocabByDay?.[date]?.[subject];
     const task=row?.tasks?.find(t=>t.id===subject+'-vocab');
     const amount=Object.values(proof?.items||{}).filter(Boolean).length;
     const complete=!!(task?.done||proof?.completed);
     const needed=Math.max(1,30-Number(proof?.originalCount??task?.progress??0));
     return subject+': '+(complete?'complete ✓':amount+'/'+needed+' correct');
   }).join(' | ');
   const tasks=Object.entries(state.recoveryTaskByDay?.[date]||{})
     .map(([id,p])=>id+' '+Object.keys(p?.items||{}).length+'/'+(p?.totalNeeded||'?')+(p?.completed?' ✓':'')).join(', ');
   const focusStatus=studyTask||focusTask
     ? '\n  Focused study: '+(studyTask?.progress??'-')+'/'+(studyTask?.target??10)+
       ' · '+new Set(general.map(a=>a.questionId)).size+' saved eligible distinct questions'+
       '\n  Subject focus: '+(focusTask?.progress??'-')+'/'+(focusTask?.target??4)+
       ' · '+new Set(focusAnswers.map(a=>a.questionId)).size+' matching distinct questions'+
       (focusSubject?' · subject '+focusSubject:'')+
       (focusTopic?' · topic '+focusTopic:'')
     : '';
   const year8Status=['y8-practise','y8-mastery','year8-long-review'].map(id=>{
     const task=row?.tasks?.find(t=>t.id===id);
     if(!task)return null;
     const subject=task.assignedSubject||task.reviewSubject;
     const topic=task.assignedTopic||task.reviewTopic;
     const matched=formal.filter(a=>
       matchesAssignedPracticeEvidence(a,task,id));
     const label={'y8-practise':'Foundation practice','y8-mastery':'Mastery review',
       'year8-long-review':'Y8 practice + mastery'}[id];
     const proof=state.dailyCurriculumEvidenceByDay?.[date]?.[id]||{};
     const routeTopic=(()=>{try{return new URL(task.href||'',location.origin).searchParams.get('topic')}catch{return null}})();
     const bucket=proof[topic||routeTopic]||{};
     const baseCount=Object.values(bucket.foundation||{}).filter(Boolean).length;
     const masteryCount=Object.values(bucket.mastery||{}).filter(Boolean).length;
     const originalCount=id==='y8-practise'?baseCount:Math.min(10,baseCount)+masteryCount;
     const originalFormal=(state.formalAttemptLog||[]).filter(a=>a?.day===date&&
       !a.recoveryFor&&a.dailyTaskId===id&&matchesAssignedPracticeEvidence(a,task,id)).length;
     return '\n  '+label+': '+(task.progress||0)+'/'+task.target+
       ' · Recovery answers '+matched.length+
       ' · Original-day evidence '+originalCount+
       ' · Original-day formal '+originalFormal+
       (subject?' · '+subject:'')+(topic?' · '+topic:'');
   }).filter(Boolean).join('');
   const tagStatus=dated.length?'\n  Route tags: '+Object.entries(tags).map(([id,n])=>id+' '+n).join(', '):'';
   return date+' · day '+log+' · saved Recovery answer events '+dated.length+
     '\n  '+vocab+focusStatus+year8Status+tagStatus+(tasks?'\n  '+tasks:'');
 });
 results.textContent=report.join('\n')||'No Recovery answer record was saved.';
 const journalStatus=document.createElement('p');
 journalStatus.style.cssText='font-size:12px;overflow-wrap:anywhere;margin-top:8px';
 journalStatus.textContent='Independent marked-answer evidence: checking device storage…';
 audit.append(auditTitle,note,results,journalStatus);
 host.append(audit);
 if(rpgHome&&!archiveChecked){
   const archiveButton=document.createElement('button');
   archiveButton.type='button';
   archiveButton.textContent='Check saved backup for missing dates';
   archiveButton.addEventListener('click',async()=>{
     archiveButton.disabled=true;
     archiveButton.textContent='Checking archived learning records…';
     await restoreArchivedDailyRecord();
     mount();
   },{once:true});
   host.append(archiveButton);
 }
 void readMarkedAnswers().then(events=>{
   if(!journalStatus.isConnected)return;
   const counts=Object.fromEntries(auditDates.map(date=>[date,
     events.filter(e=>e.recoveryFor===date&&e.formal!==false&&!e.repair).length]));
   journalStatus.textContent='Independent answer journal (new recordings only): '+
     Object.entries(counts).map(([date,n])=>date+' · '+n+' marked').join(' | ')+
     (window.__luxStoreQuotaFailed?' · Main progress storage may be full':'');
 }).catch(()=>{if(journalStatus.isConnected)
   journalStatus.textContent='Independent answer journal could not be read.';});
}
const style=document.createElement("style");style.textContent=`
#lux-recovery-quests{margin:14px 0;padding:15px;border:1px solid #d4c7ac;border-radius:16px;background:#fffaf0;color:#193449}
#lux-recovery-quests[hidden]{display:none}
#lux-recovery-date{min-height:44px;padding:8px;border:1px solid #c6b485;border-radius:10px;background:white}
#lux-recovery-quests button{padding:9px 12px;border:1px solid #c6b485;border-radius:10px;background:#23495b;color:white;cursor:pointer;min-height:44px}\n#lux-recovery-quests summary{cursor:pointer;min-height:44px;padding:10px 0;font-weight:600}
#lux-recovery-quests h3{font-family:Georgia,serif;font-size:1.35rem;margin:0 0 9px}
#lux-recovery-quests .lux-recovery-item{display:flex;flex-wrap:wrap;align-items:center;gap:9px;padding:10px 0;border-top:1px solid #e9dfce}
#lux-recovery-quests .lux-recovery-item span{color:#586777;flex:1 1 180px}
#lux-recovery-quests .lux-recovery-item a{display:inline-block;padding:9px 12px;border-radius:10px;background:#23495b;color:white;min-height:44px;text-decoration:none}
`;document.head.append(style);
let queued=false;function schedule(){
 // Coalesce Home mutations into one frame, and skip the new RPG Home where
 // historical Recovery is already linked separately.
 if(location.pathname!=="/"&&location.pathname!=="/index.html")return;
 if(document.getElementById("lux-rpg-live-home") &&
    !document.documentElement.classList.contains("lux-rpg-recovery-open"))return;
 if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
}
// Protect history across router pages, but don't re-scan every historical
// answer after unrelated XP, sound, pet animation or input-state changes.
// Coalesce real learning-ledger updates into one immutable reconciliation.
let lastRecordInputs={
 dailyLog:store.getState().dailyLog,
 formalAttemptLog:store.getState().formalAttemptLog,
 recoveryTaskByDay:store.getState().recoveryTaskByDay,
 recoveryVocabByDay:store.getState().recoveryVocabByDay,
 dailyCurriculumEvidenceByDay:store.getState().dailyCurriculumEvidenceByDay
};
let recordQueued=false;
function scheduleRecordProtection(){
 // Historic Recovery reconciliation belongs to Home, not the live quiz.
 // Re-scanning a large saved answer log on each marked question can freeze
 // Chrome before the student can navigate back. Normal quiz credit stays
 // in the core store; Home's mount will reconcile the archived history.
 if(location.pathname!=="/"&&location.pathname!=="/index.html")return;
 if(document.getElementById("lux-rpg-live-home")&&
    !document.documentElement.classList.contains("lux-rpg-recovery-open"))return;
 if(recordQueued)return;
 recordQueued=true;
 queueMicrotask(()=>{recordQueued=false;protectDailyRecord()});
}
store.subscribe(()=>{
 const state=store.getState();
 const relevant=Object.keys(lastRecordInputs).some(key=>
   state[key]!==lastRecordInputs[key]);
 for(const key of Object.keys(lastRecordInputs))lastRecordInputs[key]=state[key];
 if(relevant){scheduleRecordProtection();schedule();}
});
store.persist?.onFinishHydration?.(()=>{
 if((location.pathname==="/"||location.pathname==="/index.html") &&
    (!document.getElementById("lux-rpg-live-home") ||
     document.documentElement.classList.contains("lux-rpg-recovery-open"))){
  protectDailyRecord();
 }
});
window.addEventListener("lux:app-ready",()=>{
 if((location.pathname==="/"||location.pathname==="/index.html") &&
    (!document.getElementById("lux-rpg-live-home") ||
     document.documentElement.classList.contains("lux-rpg-recovery-open"))){
  protectDailyRecord();
 }
});
// Do not observe every DOM mutation: the RPG garden animates and React
// rerenders frequently, producing a feedback loop on memory-constrained iPads.
// The modal calls this explicit refresh, and ledger changes are subscribed above.
export function mountRecoveryPanel(){mount();return !!document.getElementById("lux-recovery-quests")}
// Older iPad home shells still wait for #lux-recovery-quests after opening.
// A single delegated click handles that shell without any persistent DOM scan.
document.addEventListener("click",event=>{
 const button=event.target?.closest?.(".rpg-nav-live button,.rpg-orb-live");
 if(!button||!/recovery/i.test(button.textContent||""))return;
 queueMicrotask(()=>{
   if(document.documentElement.classList.contains("lux-rpg-recovery-open"))mount();
 });
});
window.addEventListener("pageshow",schedule);
window.addEventListener("popstate",schedule);
window.addEventListener("lux:app-ready",schedule);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule()});
schedule();
