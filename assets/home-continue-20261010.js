/* Home Continue: navigation-only fix, safe after React hydration.
   Never edit task credit, XP, outfits or Home layout. */
(function(root){
"use strict";
if(root.LuxHomeContinue)return;
function href(J,s){try{return J?.navigationHref(s)||null;}catch{return null;}}
function choose(state,J,now=Date.now()){
 const library={kind:"library",title:"Choose your next subject",detail:"Open the Study library to carry on.",
  href:"/study/",practiceHref:"/study/",button:"Browse subjects →"};
 if(!J||state?.today!==J.day(now)||!Array.isArray(state.daily)||state.daily.length!==10)return library;
 let drafts=[];
 try{drafts=J.resumeCandidates(state,now)||[];}catch{}
 const pick=drafts.find(d=>d.daily&&d.planDate===state.today&&href(J,d.href)&&
  state.daily.some(t=>t.id===d.dailyTaskId&&Number(t.target)>0&&Number(t.progress)<Number(t.target)&&href(J,t.href)));
 if(pick){
  const link=href(J,pick.href),total=Math.max(1,Number(pick.total)||1);
  const question=Math.max(1,Math.min(total,(Number(pick.index)||0)+1));
  return {kind:"resume",title:String(pick.title||"Saved practice"),
   detail:"Question "+question+" of "+total+" · saved on this device",href:link,
   practiceHref:/^\/study\/[^/]+\/practise(?:\/|\?|$)/.test(link)?link:"/study/",
   button:"Resume question "+question+" →"};
 }
 const tasks=state.daily.filter(t=>Number(t?.target)>0);
 const next=tasks.find(t=>Number(t.progress)<Number(t.target)&&href(J,t.href));
 if(next){
  const link=href(J,next.href);
  return {kind:"task",title:String(next.title||"Next daily task"),
   detail:Math.max(0,Number(next.progress)||0)+" of "+Number(next.target)+" completed",
   href:link,practiceHref:/^\/study\/[^/]+\/practise(?:\/|\?|$)/.test(link)?link:"/study/",
   button:"Continue this task →"};
 }
 if(tasks.length===10&&tasks.every(t=>Number(t.progress)>=Number(t.target)))
  return {kind:"complete",title:"All 10 daily tasks complete",
   detail:"Your progress is counted for today.",href:"/garden",practiceHref:"/study/",
   button:"Visit the garden →"};
 // A saved free practice is a fallback, never a reason to skip today's mission.
 const optional=drafts.find(d=>!d.daily&&href(J,d.href));
 if(optional){const link=href(J,optional.href),total=Math.max(1,Number(optional.total)||1),question=Math.max(1,Math.min(total,(Number(optional.index)||0)+1));
  return {kind:"resume",title:String(optional.title||"Saved practice"),
   detail:"Question "+question+" of "+total+" · saved on this device",href:link,
   practiceHref:/^\/study\/[^/]+\/practise(?:\/|\?|$)/.test(link)?link:"/study/",
   button:"Resume question "+question+" →"};
 }
 return library;
}
root.LuxHomeContinue={choose};
if(typeof document==="undefined"||location.pathname!=="/")return;
let queued=false;
function update(){
 queued=false;
 if(!root.__luxAppReady||!root.LuxJourney)return;
 let data;try{data=choose(root.LuxJourney.garden(),root.LuxJourney);}catch{return;}
 const label=[...document.querySelectorAll("main p")].find(p=>p.textContent.trim()==="Continue studying");
 const card=label?.parentElement,lines=card?.querySelectorAll(":scope > p");
 const link=card?.querySelector(":scope > a[href]");
 if(link&&lines?.length>=3){
  if(lines[1].textContent!==data.title)lines[1].textContent=data.title;
  if(lines[2].textContent!==data.detail)lines[2].textContent=data.detail;
  if(link.getAttribute("href")!==data.href)link.setAttribute("href",data.href);
  if(link.textContent!==data.button)link.textContent=data.button;
  const description=data.title+". "+data.detail;
  if(link.getAttribute("aria-label")!==description)link.setAttribute("aria-label",description);
 }
 const quick=[...document.querySelectorAll("main a[href]")].find(a=>
  [...a.querySelectorAll("span")].some(s=>s.textContent.trim()==="Practise"));
 if(quick&&quick.getAttribute("href")!==data.practiceHref)
  quick.setAttribute("href",data.practiceHref);
}
function schedule(){if(!queued){queued=true;queueMicrotask(update);}}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
for(const event of ["lux:app-ready","pageshow","storage","scholar:session-saved","scholar:learning-changed"])
 root.addEventListener(event,schedule);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule();});
schedule();
})(globalThis);

// RPG Garden is a visual-only Home layer; install it when SPA navigation
// returns to Home as well as on a fresh iPad/Safari PWA page load.
// It never changes task credit, outfits, XP, or any saved study records.
(function installRpgHomeRouteLoader() {
  if (typeof document === 'undefined') return;
  let loading = null;
  const isHome = () => location.pathname === '/' || location.pathname === '/index.html';
  function loadForHome() {
    if (!isHome() || loading) return;
    loading = import('/assets/home-rpg-live-20261019.js?v=20261019-ipad-fixed5').catch(error => {
      loading = null; // A failed module load must be retryable after coming back.
      console.warn('RPG Home unavailable', error);
    });
  }
  for (const key of ['pushState', 'replaceState']) {
    const previous = history[key];
    history[key] = function () {
      const result = previous.apply(this, arguments);
      queueMicrotask(loadForHome);
      return result;
    };
  }
  for (const event of ['popstate', 'pageshow', 'lux:app-ready']) {
    window.addEventListener(event, loadForHome);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadForHome();
  });
  loadForHome();
})();
