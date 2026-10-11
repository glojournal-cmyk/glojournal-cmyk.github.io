/* Phase 7B: decorative, read-only companion ribbon for verified mission results.
   Existing result controls, XP, stars and completion remain authoritative. */
(function(root){
"use strict";
let attempts=0, timer=null;
function enhance(){
 if(!root.__luxAppReady)return;
 for(const card of document.querySelectorAll(".lux-mission-v2.is-complete")){
   if(card.querySelector(".lux-phase7-growth"))continue;
   // Only display for existing verified completions, not unsaved attempts.
   if(card.classList.contains("is-unverified"))continue;
   const ribbon=document.createElement("div");
   ribbon.className="lux-phase7-growth";
   ribbon.setAttribute("aria-label","Mission finished. Your companion is cheering you on.");
   const symbol=document.createElement("span");
   symbol.className="lux-phase7-growth-symbol";
   symbol.setAttribute("aria-hidden","true");
   symbol.textContent="✦";
   const copy=document.createElement("span");
   copy.className="lux-phase7-growth-copy";
   const heading=document.createElement("strong");heading.textContent="A little brighter, every day";
   const detail=document.createElement("small");detail.textContent="Your companion celebrates this milestone with you.";
   copy.append(heading,detail);
   const pet=document.createElement("a");pet.href="/pet/";pet.textContent="Companion Corner →";
   pet.className="lux-phase7-growth-link";
   ribbon.append(symbol,copy,pet);
   const controls=card.querySelector(".lux-mission-subactions-v2, .lux-mission-cta-v2");
   if(controls)controls.before(ribbon);else card.append(ribbon);
 }
}
function schedule(){
 if(timer!==null)return;
 timer=root.setTimeout(()=>{timer=null;enhance()},250);
}
function boot(){
 enhance();
 if(attempts++>=12)return;
 if(timer!==null)root.clearTimeout(timer);
 timer=root.setTimeout(()=>{timer=null;boot()},500);
}
root.addEventListener("lux:app-ready",boot);
root.addEventListener("pageshow",boot);
root.addEventListener("scholar:session-saved",schedule);
root.addEventListener("scholar:learning-changed",schedule);
boot();
})(globalThis);
