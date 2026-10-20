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
    const nav=document.createElement('nav');
    nav.className='scholar-preview-bottom-nav';
    nav.setAttribute('aria-label','Main navigation');
    nav.innerHTML=categories.map(([href,label,svg])=>
       '<a href="'+href+'"'+(href==='/scholar'?' aria-current="page"':'')+'>'+
       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">'+svg+'</svg>'+
       '<span>'+label+'</span></a>').join('');
    document.body.append(nav);
  }
  function sync(){
    document.body.classList.add('scholar-wardrobe-preview');
    const wrap=document.querySelector('main > div');
    if(!wrap)return;
    wrap.classList.add('scholar-wardrobe-root');
    const kids=[...wrap.children];
    const header=kids.find(el=>el.tagName==='HEADER');
    if(header)header.classList.add('scholar-wardrobe-intro');
    const tabs=kids.find(el=>el.tagName==='DIV'&&['Wardrobe','Collection','Achievements','Settings'].every(name=>(el.innerText||'').includes(name))&&(el.querySelectorAll('button').length===4));
    if(tabs)tabs.classList.add('scholar-wardrobe-tabs');
    // React replaces the active tab pane. Reclassify its *current* actual DOM
    // instead of copying the portrait, wardrobe buttons or save state.
    const pane=kids.find(el=>el!==tabs&&el!==header&&el.tagName==='DIV');
    if(pane){
      pane.classList.add('scholar-active-content');
      const stage=pane.querySelector('img[alt^="Scholar in "]')?.closest('.relative.aspect-\\[4\\/5\\]');
      // Class-match fallback accepts React's minified Tailwind render variations.
      const current=stage||[...pane.querySelectorAll('div')].find(el=>
        el.className?.includes?.('aspect-[4/5]')&&el.querySelector('img[alt^="Scholar in "]'));
      if(current)current.classList.add('scholar-wardrobe-stage');
      const right=current?.nextElementSibling;
      if(right)right.classList.add('scholar-wardrobe-closet');
      if(current&&right)pane.classList.add('scholar-wardrobe-split');
    }
    createNav();
  }
  let busy=false;
  function queue(){
    if(busy)return;busy=true;
    requestAnimationFrame(()=>{busy=false;sync();});
  }
  function boot(){
    sync();
    // React can re-render on outfit, background or tab selection. Only add
    // visual classes; do not intercept or replace React's own click listeners.
    const main=document.querySelector('main');
    if(main)new MutationObserver(queue).observe(main,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
