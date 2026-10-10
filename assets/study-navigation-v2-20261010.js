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
 const valid=saved.today===J?.day?.()&&Array.isArray(saved.daily);
 const daily=valid?saved.daily:[];
 const done=daily.filter(t=>Number(t.target)>0&&Number(t.progress)>=Number(t.target)).length;
 let resume=[];
 try{resume=J?.resumeCandidates(saved)||[]}catch{}
 const paused=resume.find(x=>x.daily&&x.planDate===saved.today)||resume[0];
 const fallback=daily.find(t=>Number(t.progress)<Number(t.target)&&J?.safeHref(t.href));
 const href=paused&&J?.safeHref(paused.href)?paused.href:J?.navigationHref(fallback?.href)||"/";
 return {total:daily.length||10,done,valid,year:Number(saved.year)===8?8:9,
  href:href,paused:!!paused};
}
function repaint(){
 queued=false;
 if(!window.__luxAppReady)return;
 const header=document.querySelector("main > div.space-y-8 > header");
 if(!header)return;
 const parent=header.parentElement;
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
 '<div class="lux-path-intro"><div><p class="lux-path-eyebrow">THE SCHOLAR’S GARDEN</p><h2>Choose your path</h2><p>One place for daily learning, extra revision and school tests.</p></div></div>'+
 '<div class="lux-path-grid">'+
 '<article class="lux-path-card lux-path-daily"><span class="lux-path-symbol" aria-hidden="true">✦</span><p class="lux-path-eyebrow">01 · YOUR ROUTINE</p><h3>Daily Journey</h3><p>Complete today’s 10 tasks and continue saved questions.</p>'+
 '<div class="lux-path-progress" role="progressbar" aria-label="Daily tasks completed" aria-valuemin="0" aria-valuemax="'+d.total+'" aria-valuenow="'+d.done+'"><span style="width:'+Math.min(100,d.done/d.total*100)+'%"></span></div>'+
 '<p class="lux-path-status">'+(d.valid?d.done+' / '+d.total+' tasks counted today':'Your daily tasks are on Home')+'</p>'+
 '<a class="lux-path-action" href="'+y(d.href)+'">'+(d.paused?'Resume saved practice':'Open daily journey')+' ↗</a></article>'+
 '<article class="lux-path-card"><span class="lux-path-symbol" aria-hidden="true">✧</span><p class="lux-path-eyebrow">02 · LEARN & PRACTISE</p><h3>Study Library</h3><p>Choose a subject and study at your own pace.</p>'+
 '<div class="lux-path-years" role="group" aria-label="Choose year"><button type="button" data-lux-year="8" aria-pressed="'+(d.year===8)+'">Year 8 revision</button><button type="button" data-lux-year="9" aria-pressed="'+(d.year===9)+'">Year 9 topics</button></div>'+
 '<a class="lux-path-textlink" href="#lux-study-subjects-v2">Browse all subjects ↓</a></article>'+
 '<article class="lux-path-card"><span class="lux-path-symbol" aria-hidden="true">✤</span><p class="lux-path-eyebrow">03 · PREPARE</p><h3>School Assessments</h3><p>Teacher tests, practice papers, marking and follow-up.</p>'+
 '<p class="lux-path-note">Separate from your 10 daily tasks.</p><a class="lux-path-textlink" href="/assessment/">Open assessments ↗</a></article></div>';
 for(const b of card.querySelectorAll("[data-lux-year]"))b.addEventListener("click",()=>{
  if(selectYear(Number(b.dataset.luxYear)))for(const other of card.querySelectorAll("[data-lux-year]"))
   other.setAttribute("aria-pressed",String(other===b));
 });
 if(old)old.replaceWith(card);else header.after(card);
 signature=key;
}
function queue(){if(!queued){queued=true;queueMicrotask(repaint)}}
window.addEventListener("lux:app-ready",queue);
window.addEventListener("pageshow",queue);
window.addEventListener("storage",queue);
window.addEventListener("scholar:session-saved",queue);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")queue()});
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
queue();
})();