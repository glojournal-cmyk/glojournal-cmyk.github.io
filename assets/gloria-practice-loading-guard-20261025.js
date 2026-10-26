/* Fail-visible guard for iPad assigned Practice hydration.
 * No mutation to learning records, answers, XP or task assignment.
 * 2026-10-26: stronger fail-open + one automatic soft-retry for Recovery. */
(()=>{'use strict';if(typeof document==='undefined'||typeof window==='undefined')return;
const route=()=>/^\/study\/(latin|french|biology|chemistry|physics)\/practise\/?$/.test(location.pathname);
const isRecovery=()=>new URLSearchParams(location.search).has('recover');
let timer,notice,autoRetried=false;
function remove(){notice?.remove();notice=null;}
function isStuck(){
  const body=document.body;
  if(!body)return false;
  if(body.querySelector('[data-question-id], input:not([type=hidden]), textarea, .lux-session-complete, [data-testid*=question]'))return false;
  return /Opening saved practi[cs]e/i.test(body.textContent||'');
}
function softRetry(){
  const url=new URL(location.href);
  url.searchParams.set('gloriaRetry',String(Date.now()));
  // Soft navigation keeps the same history entry feel while forcing re-hydration.
  location.replace(url.href);
}
function showNotice(auto){
  if(notice)return;
  notice=document.createElement('aside');
  notice.setAttribute('role','alert');
  notice.id='gloria-practice-load-recovery';
  notice.style.cssText='position:relative;z-index:25;margin:16px auto;padding:18px;max-width:850px;background:#fff9eb;color:#143047;border:2px solid #b08a3c;border-radius:18px;font:600 17px/1.5 system-ui';
  const message=document.createElement('p');
  message.textContent=auto
    ? 'Saved practice is still loading. Automatically retrying once…'
    : 'This saved practice has not loaded. Your existing answers and Daily progress have not been reset.';
  const retry=document.createElement('button');retry.textContent=auto?'Retry now':'Retry saved practice';retry.type='button';retry.style.cssText='padding:12px 20px;border-radius:12px;background:#173a52;color:white;margin-right:12px';
  retry.onclick=()=>softRetry();
  const home=document.createElement('a');home.textContent='Return to Daily';home.href='/';home.style.cssText='color:#173a52;text-decoration:underline';
  notice.append(message,retry,home);
  const target=document.body.querySelector('.lux-practice-view')||document.body.querySelector('main')||document.body;
  target.append(notice);
}
function check(){
  clearTimeout(timer);remove();
  if(!route())return;
  // Faster detection for Recovery (the path that previously required repeated exit/re-enter).
  const delay=isRecovery()?4000:7000;
  timer=setTimeout(()=>{
    if(!route()||!isStuck())return;
    // One automatic soft-retry for Recovery only. Avoids infinite loops.
    if(isRecovery()&&!autoRetried&&!new URLSearchParams(location.search).has('gloriaRetry')){
      autoRetried=true;
      showNotice(true);
      setTimeout(softRetry,800);
      return;
    }
    showNotice(false);
  },delay);
}
window.addEventListener('popstate',check);
window.addEventListener('pageshow',check);
document.addEventListener('DOMContentLoaded',check);
if(document.readyState!=='loading')check();
// Also re-check after visibility changes (common on iPad when switching apps).
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
})();