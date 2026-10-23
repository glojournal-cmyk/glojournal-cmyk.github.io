// Attach to the existing app store. Do NOT import the main app a second time:
// it can race the iPad route's initialization and delay other pages.
import {replayDailyAnswerCredit} from './daily-answer-replay-20261021.js?v=20261023-topup-replay-v1';
let attached=false;
let reconcile=()=>{};
function attach(){
  if(attached)return true;
  const store=globalThis.__luxStore;
  if(!store||typeof store.getState!=='function')return false;
  attached=true;
  let applying=false;
  reconcile=()=>{
    if(applying||store.persist?.hasHydrated?.()===false)return;
    const patch=replayDailyAnswerCredit(store.getState());
    if(!patch)return;
    applying=true;
    try{store.setState(patch)}finally{applying=false}
  };
  store.subscribe((next,prior)=>{
    if(!applying&&(next.formalAttemptLog!==prior?.formalAttemptLog||
        next.daily!==prior?.daily||next.today!==prior?.today))reconcile();
  });
  store.persist?.onFinishHydration?.(reconcile);
  queueMicrotask(reconcile);
  return true;
}
if(typeof window!=='undefined'){
  for(const event of ['lux:app-ready','lux:ux-state','DOMContentLoaded'])
    window.addEventListener(event,attach,{once:true});
  window.addEventListener('pageshow',()=>{attach();reconcile()});
  // Only used on a slow Safari cold boot; clear as soon as the original
  // app publishes its existing store. Never alter any saved learner data.
  if(!attach()){
    let attempts=0;
    const probe=setInterval(()=>{attempts++;if(attach()||attempts>=100)clearInterval(probe)},100);
  }
}
