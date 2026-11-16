/* V8 practice entry. Does not alter Daily credit or local progress. */
(function(){'use strict';var url='/scholar-marking-v8/index.html';
function mount(){if(!/^\/(?:study\/?|)$/.test(location.pathname))return;
 var main=document.querySelector('main');if(!main||document.getElementById('lux-v8-entry'))return;
 var el=document.createElement('a');el.id='lux-v8-entry';el.href=url;
 el.textContent='Focused Practice · 738 topic-linked questions';
 el.setAttribute('aria-label','Open V8 focused practice, subject and topic filters');
 el.style.cssText='display:inline-flex;align-items:center;max-width:95%;min-height:40px;padding:9px 15px;margin:12px 0 14px;border:1px solid #8f9d92;border-radius:12px;background:#f3efe1;color:#19394f;font:600 14px system-ui;text-decoration:none;box-shadow:0 1px 5px #0001;position:relative;z-index:1';
 var title=main.querySelector('h1,h2');if(title&&title.parentElement){title.parentElement.insertAdjacentElement('afterend',el)}else main.prepend(el);
}
var scheduled=false;function requestMount(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;mount()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',requestMount);else requestMount();
new MutationObserver(function(){if(!document.getElementById('lux-v8-entry'))requestMount()}).observe(document.documentElement,{childList:true,subtree:true});
})();
