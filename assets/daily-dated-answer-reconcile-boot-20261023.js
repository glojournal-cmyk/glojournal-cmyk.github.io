// Gloria historical Daily reconciliation — one safe pass on settled iPad hydration.
// Never import the main app again. No XP, Mastery or new answer creation.
import {rebuildDatedDailyRecords} from "./daily-dated-answer-reconcile-20261023.js?v=20261023-three-day-proof1";
let attached=false,checked=false,scheduled=false;
function attach(){
 if(attached)return true;
 const store=globalThis.__luxStore;
 if(!store||typeof store.getState!=="function"||typeof store.setState!=="function")return false;
 attached=true;
 function once(){
  if(checked||scheduled||store.persist?.hasHydrated?.()===false)return;
  scheduled=true;
  // Yield to the Home render and avoid the former high-memory subscription loop.
  const run=()=>{
   scheduled=false;
   if(checked||store.persist?.hasHydrated?.()===false)return;
   checked=true;
   try {
    const state=store.getState(),patch=rebuildDatedDailyRecords(state);
    if(patch?.dailyLog)store.setState(patch);
   } catch(error){console.warn("Dated Daily receipt check skipped",error)}
  };
  setTimeout(()=>{
   if(typeof requestIdleCallback==="function")requestIdleCallback(run,{timeout:1500});
   else run();
  },2500);
 }
 store.persist?.onFinishHydration?.(once);
 once();
 return true;
}
if(typeof window!=="undefined"){
 for(const event of ["lux:app-ready","DOMContentLoaded"])
  window.addEventListener(event,attach,{once:true});
 if(!attach()){
  let tries=0;
  const timer=setInterval(()=>{tries++;if(attach()||tries>=50)clearInterval(timer)},100);
 }
}
