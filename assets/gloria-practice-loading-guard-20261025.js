/* Fail-visible guard for iPad assigned Practice hydration.
 * No mutation to learning records, answers, XP or task assignment. */
(()=>{'use strict';if(typeof document==='undefined'||typeof window==='undefined')return;
const route=()=>/^\/study\/(latin|french|biology|chemistry|physics)\/practise\/?$/.test(location.pathname);
let timer,notice;
function remove(){notice?.remove();notice=null;}
function check(){
 clearTimeout(timer);remove();
 if(!route())return;
 timer=setTimeout(()=>{
  if(!route())return;
  const body=document.body;
  if(body.querySelector('[data-question-id], input:not([type=hidden]), textarea, .lux-session-complete, [data-testid*=question]'))return;
  if(!/Opening saved practi[cs]e/i.test(body.textContent||''))return;
  notice=document.createElement('aside');
  notice.setAttribute('role','alert');
  notice.id='gloria-practice-load-recovery';
  notice.style.cssText='position:relative;z-index:25;margin:16px auto;padding:18px;max-width:850px;background:#fff9eb;color:#143047;border:2px solid #b08a3c;border-radius:18px;font:600 17px/1.5 system-ui';
  const message=document.createElement('p');message.textContent='This saved practice has not loaded. Your existing answers and Daily progress have not been reset.';
  const retry=document.createElement('button');retry.textContent='Retry saved practice';retry.type='button';retry.style.cssText='padding:12px 20px;border-radius:12px;background:#173a52;color:white;margin-right:12px';
  retry.onclick=()=>{const url=new URL(location.href);url.searchParams.set('gloriaRetry',String(Date.now()));location.assign(url.href)};
  const home=document.createElement('a');home.textContent='Return to Daily';home.href='/';home.style.cssText='color:#173a52;text-decoration:underline';
  notice.append(message,retry,home);
  const target=body.querySelector('.lux-practice-view')||body.querySelector('main')||body;
  target.append(notice);
 },10000);
}
window.addEventListener('popstate',check);window.addEventListener('pageshow',check);
document.addEventListener('DOMContentLoaded',check);if(document.readyState!=='loading')check();
})();