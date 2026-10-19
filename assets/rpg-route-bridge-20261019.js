/* One RPG loader for SPA returns from Study/Pet/other pages.
 * It never changes learner data. */
(function installLuxRpgRouteBridge(){
 if(window.__luxRpgRouteBridge)return;
 window.__luxRpgRouteBridge=true;
 const isHome=()=>location.pathname==='/'||location.pathname==='/index.html';
 let pending=null;
 function load(){
   if(!isHome())return;
   if(window.__luxRpgLiveHome){window.dispatchEvent(new Event('lux:rpg-return-home'));return;}
   if(pending)return;
   pending=import('/assets/home-rpg-live-20261019.js?v=20261019-ipad-safe2')
     .catch(error=>{pending=null;console.warn('RPG Home load retryable',error);});
 }
 for(const name of ['pushState','replaceState']){
   const prior=history[name];
   history[name]=function(){const result=prior.apply(this,arguments);queueMicrotask(load);return result;};
 }
 for(const key of ['popstate','pageshow','lux:app-ready','focus'])window.addEventListener(key,load);
 document.addEventListener('click',event=>{
   const a=event.target?.closest?.('a[href]');
   if(!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey)return;
   const href=a.getAttribute('href');
   if(href!=='/'&&href!=='/index.html')return;
   if(isHome())return;
   event.preventDefault();event.stopImmediatePropagation();
   location.assign('/?rpg-home=20261019-ipad-safe2');
 },true);
 load();
})();
