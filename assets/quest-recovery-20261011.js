/* Recovery Quest UI: read-only display; the app records eligible answers separately. */
import { C as store, Ut as todayKey } from "/assets/index-BLVOhKhN.js?v=20261011-vault2";
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
 if(!host){host=document.createElement("section");host.id="lux-recovery-quests";card.append(host)}
 reconcileCompletedRecoveries();
 const rows=recoveryRows(store.getState());
 const signature=JSON.stringify(rows);if(host.dataset.signature===signature)return;host.dataset.signature=signature;
 host.replaceChildren();host.hidden=false;
 const title=document.createElement("h3");title.textContent="Quest Recovery · 48-hour grace";host.append(title);
 if(!rows.length){
  const hint=document.createElement("p");
  hint.textContent="No unfinished French or Latin Vocab found in the last 48-hour recovery window. A completed Recovery is credited to its original date, not today's Vocab. If an older answer was never saved, check Backup history on this iPad.";
  host.append(hint);return;
 }
 for(const row of rows){
  const item=document.createElement("div");item.className="lux-recovery-item";
  const label=document.createElement("strong");label.textContent=(row.subject==="french"?"French":"Latin")+" Vocab · "+row.date;item.append(label);
  const count=document.createElement("span");count.textContent=row.done ? (row.credited ? "Recovered ✓ · credited to " + row.date : "Recovered ✓ · restoring daily record") : row.current + " / " + row.target + " correct recovery answers · previous " + row.base + "/30";item.append(count);
  const action=document.createElement("a");action.href=row.url;action.textContent=row.done?"Recovered ✓":"Continue recovery →";if(!row.done)item.append(action);host.append(item);
 }
}
const style=document.createElement("style");style.textContent=`
#lux-recovery-quests{margin:14px 0;padding:15px;border:1px solid #d4c7ac;border-radius:16px;background:#fffaf0;color:#193449}
#lux-recovery-quests[hidden]{display:none}
#lux-recovery-quests h3{font-family:Georgia,serif;font-size:1.35rem;margin:0 0 9px}
#lux-recovery-quests .lux-recovery-item{display:flex;flex-wrap:wrap;align-items:center;gap:9px;padding:10px 0;border-top:1px solid #e9dfce}
#lux-recovery-quests .lux-recovery-item span{color:#586777;flex:1 1 180px}
#lux-recovery-quests .lux-recovery-item a{display:inline-block;padding:9px 12px;border-radius:10px;background:#23495b;color:white;min-height:44px;text-decoration:none}
`;document.head.append(style);
let queued=false;function schedule(){if(!queued){queued=true;queueMicrotask(()=>{queued=false;mount()})}}
store.subscribe(schedule);new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("pageshow",schedule);window.addEventListener("lux:app-ready",schedule);schedule();
