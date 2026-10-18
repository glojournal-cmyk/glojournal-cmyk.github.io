/* Recovery Quest UI: read-only display; the app records eligible answers separately. */
import { C as store, Ut as todayKey } from "/assets/index-BLVOhKhN.js?v=20261017-recovery-completion3&ux=20261013-corrections2";
import {eligibleRecoveryTasks,prepareUnopenedRecovery,recordRecoveryAnswer} from "./recovery-task-ledger-20261017.js?v=20261017-recovery-completion3";
import {mergeDailyHistory,mergeDailyRecordRow} from "./daily-record-integrity-20261018.js?v=20261018-daily-record1";
import {readAllBackups} from "./backup-vault-20261011.js?v=20261011-vault2&ux=20261013-corrections2";
const DAY_MS=86400000;
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
   out.push({date,subject,base,target,current,credited:!!credited,done:rec.completed===true||current>=target,
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
function backfillDatedFocusEvidence(){
 const original=store.getState(),today=todayKey();
 let next=original;
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
     const subject=task.assignedSubject||task.reviewSubject;
     const topic=task.assignedTopic||task.reviewTopic;
     const matching=entries.filter(entry=>{
       const year=Number(entry.year||String(entry.topicId||'').match(/-y(\d+)-/)?.[1]);
       if(year!==8)return false;
       if(subject&&entry.subject!==subject)return false;
       if(topic&&entry.topicId!==topic)return false;
       if(!subject&&!topic&&entry.dailyTaskId!==taskId)return false;
       return true;
     });
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
 bestDailyHistory=mergeDailyHistory(bestDailyHistory,live);
 const saved=mergeDailyHistory(live,bestDailyHistory);
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
       candidates=mergeDailyHistory(candidates,old.dailyLog||{});
       // The newest day in an old snapshot can still live in state.daily,
       // before it was sealed into dailyLog at midnight.
       if(/^\d{4}-\d{2}-\d{2}$/.test(old.today||"")&&
           Array.isArray(old.daily)&&old.daily.length&&old.today<=todayKey()){
         const recovered={date:old.today,tasks:old.daily.map(t=>({
           ...t,done:t?.done===true||Number(t?.progress)>=Number(t?.target)
         }))};
         candidates=mergeDailyHistory(candidates,{[old.today]:recovered});
       }
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
 const card=[...document.querySelectorAll("main h2")].find(n=>n.textContent.trim()==="Raise her today")?.parentElement?.parentElement?.parentElement;
 if(!card)return; // Home is still hydrating; mutation observer retries.
 let host=document.getElementById("lux-recovery-quests");
 if(!host){host=document.createElement("details");host.id="lux-recovery-quests";}
 // Client-side navigation and React rerenders can detach the old card.
 // Reattach the SAME recovery panel, rather than waiting for an app restart.
 if(host.parentElement!==card)card.append(host);
 host.hidden=false;
 protectDailyRecord();
 if(!archiveChecked)void restoreArchivedDailyRecord();
 reconcileCompletedRecoveries();
 backfillDatedFocusEvidence();
 protectDailyRecord();

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
   if(['y8-practise','y8-mastery','year8-long-review','adaptive-focus','study-session'].includes(task.id)){
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
       const current=store.getState(),result=prepareUnopenedRecovery(current,date,todayKey());
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
     const matched=formal.filter(a=>{
       if(['french-vocab','latin-vocab'].includes(a.dailyTaskId))return false;
       if(['french','latin'].includes(a.dailyVocab))return false;
       if(Number(a.year)!==8)return false;
       if(subject&&subject!==a.subject)return false;
       if(topic&&topic!==a.topicId)return false;
       return subject||topic?a.questionId:a.dailyTaskId===id;
     });
     const label={'y8-practise':'Foundation practice','y8-mastery':'Mastery review',
       'year8-long-review':'Y8 practice + mastery'}[id];
     return '\n  '+label+': '+(task.progress||0)+'/'+task.target+
       ' · '+matched.length+' eligible saved marked events'+
       (subject?' · '+subject:'')+(topic?' · '+topic:'');
   }).filter(Boolean).join('');
   const tagStatus=dated.length?'\n  Route tags: '+Object.entries(tags).map(([id,n])=>id+' '+n).join(', '):'';
   return date+' · day '+log+' · saved Recovery answer events '+dated.length+
     '\n  '+vocab+focusStatus+year8Status+tagStatus+(tasks?'\n  '+tasks:'');
 });
 results.textContent=report.join('\n')||'No Recovery answer record was saved.';
 audit.append(auditTitle,note,results);
 host.append(audit);
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
 // Practice/Play can be busy; only schedule a Home panel render on Home.
 if(location.pathname!=="/"&&location.pathname!=="/index.html")return;
 if(!queued){queued=true;queueMicrotask(()=>{queued=false;mount()})}
}
store.subscribe(schedule);new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("pageshow",schedule);
window.addEventListener("popstate",schedule);
window.addEventListener("lux:app-ready",schedule);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule()});
schedule();
