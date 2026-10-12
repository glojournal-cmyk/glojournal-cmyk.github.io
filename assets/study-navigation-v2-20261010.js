// Optional Study-only UI. Existing React study, questions and save data are untouched.
(function(){
"use strict";
if(!/^\/study\/?$/.test(location.pathname))return;
const id="lux-study-paths-v2";
const y=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let queued=false,signature="";
function selectYear(year){
 const s=document.querySelector('main select:has(option[value="8"])');
 if(!s||s.disabled)return false;
 if(Number(s.value)===year)return true;
 const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value")?.set;
 if(setter)setter.call(s,String(year));else s.value=String(year);
 s.dispatchEvent(new Event("input",{bubbles:true}));
 s.dispatchEvent(new Event("change",{bubbles:true}));
 return true;
}
function snapshot(){
 let saved={};
 try{const entry=JSON.parse(localStorage.getItem("lux-scholar-garden-v1")||"{}");saved=entry.state||entry;}catch{}
 const J=globalThis.LuxJourney;
 const valid=saved.today===J?.day?.()&&Array.isArray(saved.daily)&&saved.daily.length===10;
 const daily=valid?saved.daily:[];
 const done=daily.filter(t=>Number(t.target)>0&&Number(t.progress)>=Number(t.target)).length;
 let resume=[];
 try{resume=J?.resumeCandidates(saved)||[]}catch{}
 const fallback=daily.find(t=>Number(t.progress)<Number(t.target)&&J?.safeHref(t.href));
 const complete=valid&&done===10;
 const paused=(valid?resume.find(x=>x.daily&&x.planDate===saved.today):null)||
   (!fallback&&!complete?resume.find(x=>!x.daily):null)||null;
 const href=paused&&J?.safeHref(paused.href)?paused.href:complete?"/garden":J?.navigationHref(fallback?.href)||"#lux-study-subjects-v2";
 return {total:10,done,valid,complete,year:Number(saved.year)===8?8:9,
  href:href,paused:!!paused};
}
function repaint(){
 queued=false;
 if(!window.__luxAppReady)return;
 const header=document.querySelector("main > div.space-y-8 > header");
 if(!header)return;
 const parent=header.parentElement;
 for(const option of header.querySelectorAll("select option")){
  const label=option.value==="8"?"Year 8 · Revision":option.value==="9"?"Year 9 · Current topics":null;
  if(label&&option.textContent!==label)option.textContent=label;
 }

 const subjects=[...parent.querySelectorAll("section")].find(x=>x.querySelector("h2")?.textContent?.trim()==="Subjects");
 if(subjects)subjects.id="lux-study-subjects-v2";
 const d=snapshot();
 const old=parent.querySelector(":scope > #"+id);
 const key=JSON.stringify(d);
 if(old&&signature===key)return;
 const card=document.createElement("section");
 card.id=id;
 card.className="lux-study-paths";
 card.setAttribute("aria-label","Choose your study path");
 card.innerHTML=
 '<nav class="lux-study-shortcuts" aria-label="Study shortcuts">'+
 '<a href="/">Daily Revision <small>'+(d.valid?d.done+' / 10 completed':'View today’s tasks')+'</small></a>'+
 (d.paused?'<a href="'+y(d.href)+'">Resume Practice <small>Continue your saved question</small></a>':'')+
 '<a href="/assessment/">School Assessments <small>Prepare for your school tests</small></a></nav>';
 for(const b of card.querySelectorAll("[data-lux-year]"))b.addEventListener("click",()=>{
  if(selectYear(Number(b.dataset.luxYear)))for(const other of card.querySelectorAll("[data-lux-year]"))
   other.setAttribute("aria-pressed",String(other===b));
 });
 if(old)old.remove();
 header.after(card);
 // Keep the existing subject cards and native year selector. Hide only the
 // redundant suggested-topic / Today sections, after this navigation exists.
 for(const section of parent.querySelectorAll(":scope > section")){
   if(section!==card&&section!==subjects)section.dataset.luxQuestLegacyShortcut="true";
 }
 parent.dataset.luxQuestReady="true";
 signature=key;
}
function queue(){if(!queued){queued=true;queueMicrotask(repaint)}}
window.addEventListener("lux:app-ready",queue);
window.addEventListener("pageshow",queue);
window.addEventListener("storage",queue);
window.addEventListener("scholar:session-saved",queue);
window.addEventListener("scholar:wardrobe-changed",queue);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")queue()});
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
queue();
})();