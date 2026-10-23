// Attach once to Gloria's existing Zustand store, after hydration.
// This updates ONLY dated history in the same browser, never today's tasks.
import {rebuildDatedDailyRecords} from "./daily-dated-answer-reconcile-20261023.js?v=1";
let attached=false;
function attach(){
 if(attached)return true;
 const store=globalThis.__luxStore;
 if(!store||typeof store.getState!=="function"||
    typeof store.setState!=="function")return false;
 attached=true;
 let applying=false;
 const reconcile=()=>{
  if(applying||store.persist?.hasHydrated?.()===false)return;
  const patch=rebuildDatedDailyRecords(store.getState());
  if(!patch)return;
  applying=true;
  try{store.setState(patch)}finally{applying=false}
 };
 store.subscribe((next,prior)=>{
  if(!applying&&(next.formalAttemptLog!==prior?.formalAttemptLog||
      next.dailyLog!==prior?.dailyLog||next.today!==prior?.today))reconcile();
 });
 store.persist?.onFinishHydration?.(reconcile);
 queueMicrotask(reconcile);
 return true;
}
// Emergency iPad startup isolation (23 Oct): the historical-only automatic
// replay can be costly or interact with other store subscriptions on reload.
// Do not mutate history or delete it. Re-enable after isolated regression QA.
const ENABLE_DATED_HISTORY_STARTUP_REPAIR=false;
if(ENABLE_DATED_HISTORY_STARTUP_REPAIR && typeof window!=="undefined"){
 for(const event of ["lux:app-ready","lux:ux-state","DOMContentLoaded"])
  window.addEventListener(event,attach,{once:true});
 window.addEventListener("pageshow",attach);
 if(!attach()){
  let tries=0;
  const probe=setInterval(()=>{tries++;if(attach()||tries>=100)
     clearInterval(probe)},100);
 }
}
