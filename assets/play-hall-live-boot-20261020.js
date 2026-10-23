/* Lux et Labor Play Hall live route bridge.
 * Preserve the original game engine, XP records and Study navigation.
 * ?playHallPreview=0 is the reversible old-Play fallback.
 */
(function(){
  'use strict';
  if(window.__luxPlayHallLiveBootInstalled)return;
  window.__luxPlayHallLiveBootInstalled=true;
  let loading=false;
  const isPlay=p=>p==='/play'||p==='/play/';
  const oldPlay=()=>new URLSearchParams(location.search).get('playHallPreview')==='0';
  function show(){
    if(!isPlay(location.pathname)||oldPlay())return;
    // SPA /play is the layout route; /play/ serves the complete Play library.
    if(location.pathname==='/play'){
      location.assign('/play/'+location.search+location.hash);
      return;
    }
    if(loading||window.__luxPlayHallPreviewMounted)return;
    loading=true;
    import('/assets/play-hall-preview-20261020.js?v=20261023-decor-singleton1&uxfix=20261022-priority-ux1')
      .catch(error=>{loading=false;console.warn('Play Hall unavailable; native Play remains accessible',error);});
  }
  // Capture native and React-router anchor navigation from Home, Study,
  // game result screens, Garden, Scholar and Pet without modifying their saves.
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.ctrlKey||
       event.metaKey||event.altKey||event.shiftKey)return;
    const a=event.target?.closest?.('a[href]');
    if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    let target;
    try{target=new URL(a.href,location.href);}catch{return;}
    if(target.origin!==location.origin||!isPlay(target.pathname))return;
    if(target.searchParams.get('playHallPreview')==='0')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign('/play/'+target.search+target.hash);
  },true);
  for(const name of ['pushState','replaceState']){
    const original=history[name];
    history[name]=function(...args){const result=original.apply(this,args);show();return result;};
  }
  window.addEventListener('popstate',show);
  window.addEventListener('pageshow',show);
  window.addEventListener('lux:app-ready',show);
  show();
}());
