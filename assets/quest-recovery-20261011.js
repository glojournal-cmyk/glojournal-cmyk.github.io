/* Recovery Quest UI: read-only display; the app records eligible answers separately. */
import { C as store, Ut as todayKey } from "/assets/index-BLVOhKhN.js?v=20261011-recovery1";
const DAY_MS=86400000;
const dateAt=(d,n)=>new Date(Date.parse(d+"T12:00:00Z")+n*DAY_MS).toISOString().slice(0,10);
function recoveryRows(state){
 const today=todayKey(),out=[];
 for(let back=1;back<=2;back++){
  const date=dateAt(today,-back),daily=state.dailyLog?.[date]?.tasks||[];
  for(const subject of ["french","latin"]){
   const task=daily.find(t=>t.id===subject+"-vocab");
   if(!task||Number(task.progress)>=Number(task.target))continue;
   const rec=state.recoveryVocabByDay?.[date]?.[subject]||{};
   const base=Math.max(0,Math.min(30,Number(task.progress)||0));
   const target=30-base+5;
   const current=Math.max(0,Object.values(rec.items||{}).filter(Boolean).length);
   out.push({date,subject,base,target,current,done:current>=target,
    url:"/study/"+subject+"/practise?daily=1&locked=1&year=8&mode=y8vocab&task="+subject+"-vocab&recover="+date});
  }
 }
 return out;
}
function mount(){
 if(location.pathname!=="/")return;
 const card=[...document.querySelectorAll("main h2")].find(n=>n.textContent.trim()==="Raise her today")?.parentElement?.parentElement?.parentElement;
 if(!card)return;
 let host=document.getElementById("lux-recovery-quests");
 if(!host){host=document.createElement("section");host.id="lux-recovery-quests";card.append(host)}
 const rows=recoveryRows(store.getState());
 const signature=JSON.stringify(rows);if(host.dataset.signature===signature)return;host.dataset.signature=signature;
 host.replaceChildren();if(!rows.length){host.hidden=true;return}host.hidden=false;
 const title=document.createElement("h3");title.textContent="Quest Recovery · 48-hour grace";host.append(title);
 for(const row of rows){
  const item=document.createElement("div");item.className="lux-recovery-item";
  const label=document.createElement("strong");label.textContent=(row.subject==="french"?"French":"Latin")+" Vocab · "+row.date;item.append(label);
  const count=document.createElement("span");count.textContent=row.done?"Recovered ✓":row.current+" / "+row.target+" recovery answers · original "+row.base+"/30";item.append(count);
  const action=document.createElement("a");action.href=row.url;action.textContent=row.done?"Review recovered quest":"Complete remaining + 5 →";item.append(action);host.append(item);
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
