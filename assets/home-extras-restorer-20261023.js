/* Lux et Labor safe restoration — 23 Oct 2026.
 * The 9 optional scripts disabled during the Chrome OOM incident are restored
 * in small steps, after the canonical app has hydrated. Zero learning writes.
 * ?gloriaLite=1 keeps them disabled WITHOUT removing or resetting any records.
 */
(function restoreHomeExtras(){
 "use strict";
 if(globalThis.__luxExtrasRestorerInstalled)return;
 globalThis.__luxExtrasRestorerInstalled=true;
 const isLite=()=>new URLSearchParams(location.search).get('gloriaLite')==='1';
 if(isLite())return;
 const home=()=>location.pathname==='/'||location.pathname==='/index.html';
 const scholar=()=>/^\/scholar\/?$/.test(location.pathname);
 const features=[
  {id:'study-bridge',src:'/assets/study-rpg-live-boot-20261020.js?v=20261023-decor-singleton1&uxfix=20261022-priority-ux1'},
  {id:'play-bridge',src:'/assets/play-hall-live-boot-20261020.js?v=20261023-decor-singleton1&uxfix=20261022-priority-ux1'},
  {id:'theme-icons',src:'/lux-theme.js?v=20261023-home-restore-safe1'},
  {id:'home-continue',src:'/assets/home-continue-20261010.js?v=20261023-home-restore-safe1'},
  {id:'pet-companion',src:'/pet/home-pet.js?v=20261023-home-restore-safe1',module:true},
  {id:'living-garden',src:'/assets/garden-life-20261007.js?v=20261023-home-restore-safe1'},
  {id:'recovery-panel',src:'/assets/quest-recovery-20261011.js?v=20261023-home-restore-safe1',module:true}
 ];
 const scholarFeatures=[
  {id:'scholar-images',src:'/assets/scholar-image-recovery-20261020.js?v=20261023-home-restore-safe1'},
  {id:'scholar-nav',src:'/assets/scholar-play-chrome-20261021.js?v=20261023-home-restore-safe1'}
 ];
 const installed=new Map();
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function load(item){
  if(installed.has(item.id))return installed.get(item.id);
  const promise=new Promise(resolve=>{
   const script=document.createElement('script');
   script.dataset.luxRestoredExtra=item.id;
   if(item.module)script.type='module';
   else script.async=false;
   let settled=false;
   const done=()=>{if(!settled){settled=true;resolve();}};
   script.onload=done;
   script.onerror=()=>{console.warn('Optional feature unavailable:',item.id);done();};
   script.src=item.src;
   document.head.appendChild(script);
   // Optional assets should never block further features if a request stalls.
   setTimeout(done,4500);
  });
  installed.set(item.id,promise);
  return promise;
 }
 let homeLoading=false,scholarLoading=false;
 async function loadHome(){
  if(homeLoading||!home()||isLite())return;
  homeLoading=true;
  try{
   for(const feature of features){
    if(!home()||isLite())break;
    await load(feature);
    await wait(120);
   }
  }finally{homeLoading=false}
 }
 async function loadScholar(){
  if(scholarLoading||!scholar()||isLite())return;
  scholarLoading=true;
  try{for(const feature of scholarFeatures){await load(feature);await wait(100);}}
  finally{scholarLoading=false}
 }
 function routeCheck(){
  if(isLite()||!globalThis.__luxAppReady)return;
  if(home())void loadHome();
  if(scholar())void loadScholar();
 }
 window.addEventListener('lux:app-ready',routeCheck);
 window.addEventListener('pageshow',routeCheck);
 window.addEventListener('popstate',routeCheck);
 // A tiny route-only check covers SPA pushState links without DOM observers.
 const monitor=setInterval(()=>{
  if(isLite()){clearInterval(monitor);return;}
  if(home()||scholar())routeCheck();
  if(installed.size>=9)clearInterval(monitor);
 },3000);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',routeCheck,{once:true});
 else routeCheck();
})();