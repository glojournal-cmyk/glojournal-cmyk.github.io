/* Recovery Quest UI: read-only display; the app records eligible answers separately. */
import { C as store, Ut as todayKey } from "/assets/index-BLVOhKhN.js?v=20261011-vault2&ux=20261013-player-ux2";
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
   const target=Number(rec.totalNeeded)||30-base+5;
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
function mount(){
 if(location.pathname!=="/")return;
 const card=[...document.querySelectorAll("main h2")].find(n=>n.textContent.trim()==="Raise her today")?.parentElement?.parentElement?.parentElement;
 if(!card)return;
 let host=document.getElementById("lux-recovery-quests");
 if(!host){host=document.createElement("details");host.id="lux-recovery-quests";card.append(host)}
 reconcileCompletedRecoveries();
 const rows=recoveryRows(store.getState()),today=todayKey();
 const dates=[dateAt(today,-1),dateAt(today,-2)];
 const signature=JSON.stringify([dates,rows]);if(host.dataset.signature===signature)return;host.dataset.signature=signature;
 const previous=host.querySelector('select')?.value;
 host.replaceChildren();host.hidden=rows.length===0;
 const unfinished=rows.filter(row=>!row.done).length;host.open=unfinished>0;
 const summary=document.createElement("summary");summary.textContent=unfinished?"Recovery · "+unfinished+" unfinished Vocab "+(unfinished===1?"task":"tasks"):"Recovery · all caught up";host.append(summary);
 const title=document.createElement('h3');title.textContent='Quest Recovery · choose a date';host.append(title);
 const label=document.createElement('label');label.textContent='Missed date ';label.htmlFor='lux-recovery-date';
 const select=document.createElement('select');select.id='lux-recovery-date';
 for(const date of dates){const option=document.createElement('option');option.value=date;option.textContent=date;select.append(option)}
 if(dates.includes(previous))select.value=previous;
 label.append(select);host.append(label);
 const list=document.createElement('div');host.append(list);
 function showDate(){
  list.replaceChildren();const date=select.value,selected=rows.filter(row=>row.date===date);
  const hint=document.createElement('p');hint.textContent='French / Latin Vocab recovery is credited to this date. You can switch dates at any time.';list.append(hint);
  if(!selected.length){const note=document.createElement('p');note.textContent='No unfinished Vocab record is available for '+date+'. Other daily tasks are outside Vocab Recovery.';list.append(note)}
  for(const row of selected){
   const item=document.createElement('div');item.className='lux-recovery-item';
   const name=document.createElement('strong');name.textContent=(row.subject==='french'?'French':'Latin')+' Vocab · '+row.date;item.append(name);
   const count=document.createElement('span');count.textContent=row.done?(row.credited?'Recovered ✓ · credited to '+row.date:'Recovered ✓ · restoring daily record'):row.current+' / '+row.target+' correct recovery answers';item.append(count);
   if(!row.done){const a=document.createElement('a');a.href=row.url;a.textContent='Continue recovery →';item.append(a)}list.append(item);
  }
 }
 select.addEventListener('change',showDate);showDate();

}
const style=document.createElement("style");style.textContent=`
#lux-recovery-quests{margin:14px 0;padding:15px;border:1px solid #d4c7ac;border-radius:16px;background:#fffaf0;color:#193449}
#lux-recovery-quests[hidden]{display:none}
#lux-recovery-date{min-height:44px;padding:8px;border:1px solid #c6b485;border-radius:10px;background:white}
#lux-recovery-quests summary{cursor:pointer;min-height:44px;padding:10px 0;font-weight:600}
#lux-recovery-quests h3{font-family:Georgia,serif;font-size:1.35rem;margin:0 0 9px}
#lux-recovery-quests .lux-recovery-item{display:flex;flex-wrap:wrap;align-items:center;gap:9px;padding:10px 0;border-top:1px solid #e9dfce}
#lux-recovery-quests .lux-recovery-item span{color:#586777;flex:1 1 180px}
#lux-recovery-quests .lux-recovery-item a{display:inline-block;padding:9px 12px;border-radius:10px;background:#23495b;color:white;min-height:44px;text-decoration:none}
`;document.head.append(style);
let queued=false;function schedule(){if(!queued){queued=true;queueMicrotask(()=>{queued=false;mount()})}}
store.subscribe(schedule);new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("pageshow",schedule);window.addEventListener("lux:app-ready",schedule);schedule();
