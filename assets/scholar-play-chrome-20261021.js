/* Scholar navigation: mirror the Play Hall's 7 destinations and pill style.
   Navigation only; never reads/writes learning or wardrobe storage. */
(function(){
 'use strict';
 if(window.__luxScholarPlayNavInstalled)return;
 window.__luxScholarPlayNavInstalled=true;
 const items=[
  ['Home','/','<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>'],
  ['Study','/study/','<path d="M4 19.5V5a2 2 0 0 1 2-2h14v17H6a2 2 0 0 1-2-2v-1"/><path d="M6 17h14"/>'],
  ['Play','/play/','<path d="m8 5 12 7-12 7z"/>'],
  ['Garden','/garden','<path d="M7 20h10M10 20c5-3 1-7 4-12M14 10c3-1 5-4 4-6-4 0-6 3-4 6M11 14c-4-4-6-4-8-3 1 4 5 5 8 3"/>'],
  ['Pet','/pet/','<circle cx="8" cy="7" r="1"/><circle cx="16" cy="7" r="1"/><path d="M12 10c-5-2-8 2-8 6 0 3 3 4 8 2 5 2 8 1 8-2 0-4-3-8-8-6z"/>'],
  ['Assessment','/assessment/','<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'],
  ['Scholar','/scholar','<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8"/>']
 ];
 function ensureStyles(){
  // SPA arrivals from Study may reuse a shell without Scholar's stylesheet links.
  for(const [file,href] of [
    ['scholar-rebuilt-20261021.css','/assets/scholar-rebuilt-20261021.css?v=2'],
    ['scholar-play-chrome-20261021.css','/assets/scholar-play-chrome-20261021.css?v=2']
  ]){
    if(!document.querySelector('link[href*="'+file+'"]')){
      const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);
    }
  }
  if(document.getElementById('lux-scholar-rail-essential-css'))return;
  const style=document.createElement('style');style.id='lux-scholar-rail-essential-css';
  style.textContent='.lux-scholar-play-nav{position:fixed!important;left:50%!important;bottom:calc(10px + env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;z-index:2147482000!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:clamp(4px,.9vw,12px)!important;width:min(86%,1008px)!important;max-width:calc(100% - 8px)!important;min-height:59px!important;padding:3px 6px!important;border-radius:999px!important;background:#172d38ec!important;box-shadow:0 5px 20px #0c1d2d55!important;overflow-x:auto!important}.lux-scholar-play-nav>a[data-lux-scholar-nav]{display:flex!important;flex:1 0 0!important;min-width:56px!important;max-width:136px!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:1px!important;min-height:53px!important;position:relative!important;border-radius:99px!important;text-decoration:none!important;color:#f5eedf!important;font:500 clamp(11px,1vw,14px)/1.15 sans-serif!important}.lux-scholar-play-nav>a[aria-current=page]{background:#faf4e9!important;color:#193646!important}.lux-scholar-play-nav a svg{display:block;width:20px;height:20px}@media(max-width:740px){.lux-scholar-play-nav{width:calc(100% - 16px)!important;justify-content:flex-start!important}.lux-scholar-play-nav>a[data-lux-scholar-nav]{min-width:56px!important}}';
  // Stable CSS rule, not a MutationObserver feedback loop. The main app may
  // append companion links to every primary nav; keep only our seven visible.
  style.textContent += '.lux-scholar-play-nav>a:not([data-lux-scholar-nav="1"]){display:none!important}html.lux-scholar-rail-active nav.fixed.inset-x-3.bottom-3{display:none!important}html.lux-scholar-rail-active .paper-wash>header.sticky{display:none!important}html.lux-scholar-rail-active .paper-wash>aside{display:none!important}html.lux-scholar-rail-active .paper-wash{padding-left:0!important}';
  document.head.append(style);
 }
 function mount(){
  if(!/^\/scholar\/?$/.test(location.pathname))return;
  if(document.querySelector('.lux-scholar-play-nav'))return;
  const nav=document.createElement('nav');
  nav.className='lux-scholar-play-nav';
  nav.setAttribute('aria-label','Primary');
  for(const [name,href,path] of items){
    const a=document.createElement('a');a.href=href;a.dataset.luxScholarNav='1';
    if(name==='Scholar')a.setAttribute('aria-current','page');
    const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');
    icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
    a.append(icon,document.createTextNode(name));nav.append(a);
  }
  document.body.append(nav);
 }
 // Never mutate a third-party-added link: another observer might reinsert it,
 // causing a delete/recreate loop and visibly flashing the navigation rail.
 function tidyWeekly(){
  if(!/^\/scholar\/?$/.test(location.pathname))return;
  for(const a of document.querySelectorAll('a[href="/progress/weekly/"]:not(.lux-scholar-weekly-link)')){
    const targetText=(a.textContent||'').replace(/\s+/g,' ').trim();
    let shell=a;
    for(let depth=0;depth<5;depth++){
      const parent=shell.parentElement;
      if(!parent||parent===document.body||parent.tagName==='MAIN'||parent.tagName==='NAV')break;
      const allLinks=parent.querySelectorAll('a');
      if(allLinks.length!==1||allLinks[0]!==a)break;
      const copy=(parent.textContent||'').replace(/\s+/g,' ').trim();
      if(copy!==targetText)break;
      shell=parent;
    }
    if(!shell.hidden){shell.hidden=true;shell.style.setProperty('display','none','important');}
  }
 }
 function sync(){
  const active=/^\/scholar\/?$/.test(location.pathname);
  document.documentElement.classList.toggle('lux-scholar-rail-active',active);
  if(!active){
    document.querySelector('.lux-scholar-play-nav')?.remove();
    return;
  }
  ensureStyles();
  mount();
  tidyWeekly();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
 window.addEventListener('pageshow',sync);
 window.addEventListener('popstate',sync);
 window.addEventListener('lux:app-ready',sync);
 for(const key of ['pushState','replaceState']){
   const original=history[key];history[key]=function(...args){const value=original.apply(this,args);sync();return value;};
 }
 const observer=new MutationObserver(()=>{if(/^\/scholar\/?$/.test(location.pathname))tidyWeekly();});
 observer.observe(document.body,{childList:true,subtree:true});
})();
