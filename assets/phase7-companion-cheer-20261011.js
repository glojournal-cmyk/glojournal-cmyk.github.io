/* Phase 7: visual-only companion response to newly completed daily quests.
   Never writes student progress, rewards, backups, or task credits. */
(function(root){
 "use strict";
 const reduced=()=>root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
 let prior=null,queued=false,active=false;
 function snapshot(){
   if(location.pathname!=="/"||!root.__luxAppReady)return null;
   const J=root.LuxJourney;
   if(!J?.garden||!J?.day)return null;
   let state;try{state=J.garden()}catch{return null}
   if(!state||state.today!==J.day()||!Array.isArray(state.daily)||state.daily.length!==10)return null;
   return {day:state.today,done:new Set(state.daily.filter(t=>Number(t.target)>0&&Number(t.progress)>=Number(t.target)).map(t=>String(t.id)))};
 }
 function celebrate(count){
   if(active||document.hidden)return;
   const stage=document.querySelector("main img.scholar-idle");
   const companion=document.querySelector("#home-pet-companion img, .home-pet img, [data-home-pet] img");
   const target=stage?.closest("[data-lux-v2-stage]")||stage?.parentElement||null;
   if(!target)return;
   active=true;
   target.classList.add("lux-phase7-cheer");
   if(companion)companion.classList.add("lux-phase7-pet-cheer");
   const note=document.createElement("div");
   note.className="lux-phase7-note";
   note.setAttribute("role","status");
   note.textContent=count===1?"✦ Mission complete · another star in your garden":"✦ "+count+" missions complete · your garden grows";
   target.append(note);
   const ms=reduced()?500:1700;
   root.setTimeout(()=>{
     note.remove();target.classList.remove("lux-phase7-cheer");
     companion?.classList.remove("lux-phase7-pet-cheer");active=false;
   },ms);
 }
 function refresh(){
   queued=false;
   const now=snapshot();
   if(!now)return;
   if(!prior||prior.day!==now.day){prior=now;return}
   const gained=[...now.done].filter(id=>!prior.done.has(id));
   prior=now;
   if(gained.length){celebrate(gained.length);root.dispatchEvent(new Event("lux:phase7-mission-complete"));}
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(refresh)}}
 if(location.pathname!=="/")return;
 const observer=new MutationObserver(schedule);
 observer.observe(document.documentElement,{childList:true,subtree:true});
 for(const event of ["lux:app-ready","pageshow","scholar:learning-changed","scholar:session-saved","storage"])root.addEventListener(event,schedule);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden){prior=snapshot();schedule()}});
 schedule();
})(globalThis);
