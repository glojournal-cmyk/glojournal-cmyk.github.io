/* Phase 7B cosmetic celebration; no edits to pet or boss ledgers. */
(function(root){
"use strict";
let queued=false;
function decorateBoss(){
 if(!/^\/play\/weekly-boss\/?$/.test(location.pathname))return;
 const heading=[...document.querySelectorAll("main p")].find(p=>p.textContent.trim()==="Weekly Boss complete");
 const host=heading?.parentElement;
 if(!host||host.querySelector(".lux-p7-boss"))return;
 const summary=[...host.querySelectorAll("p")].find(p=>/Boss cleared|Clear requires 80%/.test(p.textContent));
 if(!summary||!/Boss cleared/.test(summary.textContent))return;
 const ribbon=document.createElement("div");
 ribbon.className="lux-p7-boss";ribbon.setAttribute("role","status");
 ribbon.textContent="✦ Constellation restored · A brilliant victory!";
 heading.after(ribbon);
 if(root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)ribbon.classList.add("is-quiet");
}
function decoratePet(){
 if(!/^\/pet\/?$/.test(location.pathname))return;
 const action=document.getElementById("confirmEvolutionButton");
 if(!action||action.dataset.luxPhase7Bound)return;
 action.dataset.luxPhase7Bound="true";
 action.addEventListener("click",()=>{\n  let before=null;try{before=JSON.parse(localStorage.getItem("lux-pet-companion-v1")||"null")}catch{}
  // Let the existing authoritative evolution handler finish; only show a visual effect.
  root.setTimeout(()=>{
   const transaction=document.querySelector("#mp-wallet-history");
   const recent=transaction?.textContent||"";
   if(!/evolution|Level [2-5]/i.test(recent))return;
   const host=document.querySelector("main");
   if(!host)return;
   const note=document.createElement("div");
   note.className="lux-p7-evolution";note.setAttribute("role","status");
   note.textContent="✧ Your companion is growing!";
   host.prepend(note);
   root.setTimeout(()=>note.remove(),2200);
  },120);
 },{capture:false});
}
function run(){queued=false;decorateBoss();decoratePet()}
function schedule(){if(queued)return;queued=true;queueMicrotask(run)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
root.addEventListener("pageshow",schedule);root.addEventListener("lux:app-ready",schedule);schedule();
})(globalThis);
