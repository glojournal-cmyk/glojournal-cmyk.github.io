/* Scholar Wardrobe visual preview. No game state writes, no outfit asset changes.
   On /scholar/?scholarPreview=1 only; legacy at ?scholarPreview=0. */
(()=>{
  if(!/^\/scholar\/?$/.test(location.pathname))return;
  if(new URLSearchParams(location.search).get('scholarPreview')!=='1')return;
  const categories=[
    ['/', 'Home', '<path d="m4 11 8-7 8 7"/><path d="M6 10.5V20h12v-9.5"/>'],
    ['/study/', 'Study', '<path d="M4 19.2A2.2 2.2 0 0 1 6.2 17H20"/><path d="M6.2 3H20v18H6.2A2.2 2.2 0 0 1 4 18.8V5.2A2.2 2.2 0 0 1 6.2 3z"/>'],
    ['/play', 'Play', '<path d="M8 6.2v11.6L18.4 12z"/>'],
    ['/garden', 'Garden', '<path d="M12 21V10"/><path d="M12 10C8 9 6.2 6.2 6 3c3.6.4 6 2.4 6.8 6.2"/><path d="M12 12.5c3.2-.4 5.8-2.8 6.6-6.5-3.4 0-6 2-6.6 5.5"/>'],
    ['/pet/', 'Pet', '<circle cx="7.5" cy="8" r="1.6"/><circle cx="16.5" cy="8" r="1.6"/><circle cx="12" cy="5.5" r="1.6"/><path d="M12 10.2c-3.4 0-6.2 2.2-6.2 5.1 0 1.9 1.5 3.2 3.4 3.2 1.1 0 1.9-.6 2.8-.6s1.7.6 2.8.6c1.9 0 3.4-1.3 3.4-3.2 0-2.9-2.8-5.1-6.2-5.1z"/>'],
    ['/assessment', 'Assessment', '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'],
    ['/scholar', 'Scholar', '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c.8-3.6 3.4-5.4 7-5.4s6.2 1.8 7 5.4"/>']
  ];
  function createNav(){
    if(document.querySelector('.scholar-preview-bottom-nav'))return;
    // Use a standalone navigation surface. The older app rewrites <nav>
    // nodes and injects legacy tabs; this avoids duplicate tabs without
    // changing any of the seven actual destination links.
    const nav=document.createElement('div');
    nav.className='scholar-preview-bottom-nav';
    nav.setAttribute('role','navigation');
    nav.setAttribute('aria-label','Main navigation');
    nav.innerHTML=categories.map(([href,label,svg])=>
       '<a href="'+href+'"'+(href==='/scholar'?' aria-current="page"':'')+'>'+
       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">'+svg+'</svg>'+
       '<span>'+label+'</span></a>').join('');
    document.body.append(nav);
  }
  function sync(){
    if(!document.body.classList.contains('scholar-wardrobe-preview'))document.body.classList.add('scholar-wardrobe-preview');
    // Legacy app injects an extra 70px header and bottom tabs during React
    // hydration. Hide rather than remove nodes to preserve its own state.
    document.querySelectorAll('.paper-wash>header,.paper-wash>nav,.lux-shell-header,.lux-shell-nav').forEach(el=>{
      if(el.dataset.scholarChromeHidden==='1')return;
      el.dataset.scholarChromeHidden='1';
      el.style.setProperty('display','none','important');
    });
    const wrap=document.querySelector('main > div');
    if(!wrap)return;
    if(!wrap.classList.contains('scholar-wardrobe-root'))wrap.classList.add('scholar-wardrobe-root');
    createNav();
    const header=wrap.querySelector(':scope > header')||wrap.querySelector('header');
    if(header&&!header.classList.contains('scholar-wardrobe-intro'))header.classList.add('scholar-wardrobe-intro');
    // React's tab bar is the sibling directly following the live Scholar heading.
    // Match its actual button labels, not browser-dependent innerText.
    const tabs=header?.nextElementSibling;
    if(tabs&&tabs.querySelectorAll('button').length===4&&!tabs.classList.contains('scholar-wardrobe-tabs'))
      tabs.classList.add('scholar-wardrobe-tabs');
    // React swaps the active pane when Wardrobe/Collection/etc changes.
    const pane=tabs?.nextElementSibling;
    if(pane){
      if(!pane.classList.contains('scholar-active-content'))pane.classList.add('scholar-active-content');
      // Find the *existing* portrait stage without using CSS escaping of
      // Tailwind's bracketed aspect-ratio class (which differs in WebKit).
      const portrait=pane.querySelector('img[alt^="Scholar in "]');
      let current=portrait?.parentElement;
      while(current&&current!==pane&&!current.classList?.contains('aspect-[4/5]')){
        current=current.parentElement;
      }
      if(current===pane)current=null;
      if(current&&!current.classList.contains('scholar-wardrobe-stage'))current.classList.add('scholar-wardrobe-stage');
      const right=current?.nextElementSibling;
      if(right&&!right.classList.contains('scholar-wardrobe-closet'))right.classList.add('scholar-wardrobe-closet');
      if(current&&right&&!pane.classList.contains('scholar-wardrobe-split'))pane.classList.add('scholar-wardrobe-split');
    }
  }
  let busy=false;
  function queue(){
    if(busy)return;busy=true;
    requestAnimationFrame(()=>{busy=false;sync();});
  }
  function boot(){
    sync();
    // TanStack/React can hydrate or replace the main DOM *after* deferred
    // scripts. Observe its stable document root so classes/nav are restored
    // without interrupting real React outfit/background click handlers.
    const observer=new MutationObserver(queue);
    observer.observe(document.documentElement,{
      childList:true,subtree:true,attributes:true,attributeFilter:['class']
    });
    window.addEventListener('pageshow',queue);
    // Follow hydration even in browsers where it batches work outside a
    // mutation boundary after DOMContentLoaded.
    setTimeout(queue,450);
    setTimeout(queue,1450);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
