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
 function mount(){
  if(!/^\/scholar\/?$/.test(location.pathname))return;
  if(document.querySelector('.lux-scholar-play-nav'))return;
  const nav=document.createElement('nav');
  nav.className='lux-scholar-play-nav';
  nav.setAttribute('aria-label','Primary');
  for(const [name,href,path] of items){
    const a=document.createElement('a');a.href=href;
    if(name==='Scholar')a.setAttribute('aria-current','page');
    const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');
    icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+path+'</svg>';
    a.append(icon,document.createTextNode(name));nav.append(a);
  }
  document.body.append(nav);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.addEventListener('pageshow',mount);
})();
