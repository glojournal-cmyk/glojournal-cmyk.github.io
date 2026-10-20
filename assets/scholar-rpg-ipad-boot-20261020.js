/* Gloria Scholar Chamber: presentation-only boot.
   Does NOT read/write scholar, pet, quest, or XP persistence. */
(function(){
  'use strict';
  if(window.__luxScholarRpgBootInstalled)return;
  window.__luxScholarRpgBootInstalled=true;
  const NAV=[
    ['⌂','Home','/'],['▣','Study','/study/'],['◇','Play','/play/'],
    ['♧','Garden','/garden/'],['♧','Pet','/pet/'],
    ['▤','Assessment','/assessment/'],['✎','Scholar','/scholar/']
  ];
  const isScholar=()=>/^\/scholar\/?$/.test(location.pathname);
  const active=()=>isScholar()&&
    new URLSearchParams(location.search).get('scholarRpgPreview')!=='0';
  let nav;
  function render(){
    // A React SPA link can keep the previous page's document and stale route
    // styling. Enter Scholar through its complete HTML document instead.
    if(isScholar()&&!document.querySelector('link[href*="scholar-rpg-ipad-20261020.css"]')){
      location.replace('/scholar/'+location.search+location.hash);return;
    }
    if(!active()){
      document.documentElement.classList.remove('lux-scholar-rpg','lux-scholar-wardrobe');
      nav?.remove();return;
    }
    if(!document.querySelector('.paper-wash>main'))return;
    document.documentElement.classList.add('lux-scholar-rpg');
    const activeTab=[...document.querySelectorAll('.paper-wash>main>div>div.flex.flex-wrap.gap-2 button')]
      .find(b=>b.classList.contains('bg-navy'))?.textContent?.trim();
    document.documentElement.classList.toggle('lux-scholar-wardrobe',!activeTab||activeTab==='Wardrobe');
    if(!nav){
      nav=document.createElement('div');
      nav.id='lux-scholar-nav';nav.setAttribute('role','navigation');
      nav.setAttribute('aria-label','Primary navigation');
      for(const [glyph,label,href] of NAV){
        const a=document.createElement('a');a.href=href;
        const icon=document.createElement('span');icon.textContent=glyph;icon.setAttribute('aria-hidden','true');
        const title=document.createElement('span');title.textContent=label;
        a.append(icon,title);
        if(label==='Scholar')a.setAttribute('aria-current','page');
        nav.append(a);
      }
    }
    if(!nav.isConnected)document.body.append(nav);
  }
  let queued=false;
  function queue(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;render();});
  }
  const observer=new MutationObserver(queue);
  observer.observe(document.documentElement,{childList:true,subtree:false});
  const appObserver=new MutationObserver(queue);
  let observedMain=null;
  function watchMain(){
    const main=document.querySelector('.paper-wash>main');
    if(main===observedMain)return;
    appObserver.disconnect();observedMain=main;
    if(main)appObserver.observe(main,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }
  const originalRender=render;
  render=function(){watchMain();originalRender();};
  window.addEventListener('pageshow',queue);
  window.addEventListener('popstate',queue);
  window.addEventListener('lux:app-ready',queue);
  for(const method of ['pushState','replaceState']){
    const previous=history[method];
    history[method]=function(...args){const result=previous.apply(this,args);queue();return result;};
  }
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.ctrlKey||
       event.metaKey||event.altKey||event.shiftKey)return;
    const a=event.target?.closest?.('a[href]');
    if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    let target;
    try{target=new URL(a.href,location.href);}catch{return;}
    if(target.origin!==location.origin||(target.pathname!=='/scholar'&&target.pathname!=='/scholar/'))return;
    if(isScholar())return;
    event.preventDefault();event.stopImmediatePropagation();
    location.assign('/scholar/'+target.search+target.hash);
  },true);
  document.addEventListener('DOMContentLoaded',queue,{once:true});
  queue();
}());
