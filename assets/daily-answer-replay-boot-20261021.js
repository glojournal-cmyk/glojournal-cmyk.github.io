// Same shared store as Home/Study/Play. Restore genuine Daily answer credit
// after Safari hydration, during SPA navigation, and on return to Home.
import {C as store} from './index-BLVOhKhN.js?v=20261021-medical-careers1&ux=20261013-corrections2';
import {replayDailyAnswerCredit} from './daily-answer-replay-20261021.js';
let applying=false;
function reconcile(){
  if(applying||store.persist?.hasHydrated?.()===false)return;
  const patch=replayDailyAnswerCredit(store.getState());
  if(!patch)return;
  applying=true;
  try{store.setState(patch)}finally{applying=false}
}
store.subscribe((next,prior)=>{
  if(!applying&&(next.formalAttemptLog!==prior?.formalAttemptLog||
      next.daily!==prior?.daily||next.today!==prior?.today))reconcile();
});
store.persist?.onFinishHydration?.(reconcile);
if(typeof window!=='undefined')window.addEventListener('pageshow',reconcile);
queueMicrotask(reconcile);
