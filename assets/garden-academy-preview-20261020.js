/* The Scholar's Garden interactive map PREVIEW.
 * All learning state belongs to the existing Zustand/React Garden.
 * Never writes localStorage, never awards XP directly, never changes the
 * once-a-day watering rule, unlock conditions or equipped Home outfit/Pet.
 */
import { C as store, Q as gardenStage, U as collectibles, X as stages,
         G as needProgress, Y as requirementsContext } from
  '/assets/index-BLVOhKhN.js?v=20261018-mastery2&ux=20261013-corrections2';
if (typeof document !== 'undefined' && !window.__luxGardenAcademyPreviewInstalled) {
window.__luxGardenAcademyPreviewInstalled = true;
const enabled=()=>/^\/garden\/?$/.test(location.pathname)&&
  new URLSearchParams(location.search).get('gardenPreview')==='1';
const navs=[['⌂','Home','/'],['▣','Study','/study/'],
  ['◇','Play','/play/'],['❧','Garden','/garden/?gardenPreview=1'],
  ['♧','Pet','/pet/'],['▥','Assessment','/assessment/'],
  ['✎','Scholar','/scholar/']];
const decorList=[['bench','Wooden Bench'],['roses','White Roses'],
  ['lantern','Garden Lantern'],['bookshelf','Bookshelf']];
const create=(tag,cls,text)=>{const node=document.createElement(tag);
  if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
const safeText=(txt)=>String(txt==null?'':txt);
const nativeWater=()=>[...document.querySelectorAll('body>.paper-wash button')]
  .find(b=>/^(Water the garden|Watered today)$/.test(b.textContent?.trim()||''));
const nativeItem=(label)=>[...document.querySelectorAll('body>.paper-wash button')]
  .find(b=>!!b.querySelector('img[alt="'+label.replaceAll('"','')+'"]'));
let root,style,modal,waiting=false,lastKey='',cleanupFocus=null;
const suppressedNavs=new Map();
const watchedNativeNavs=new Set();
const nativeNavAttrWatcher=new MutationObserver(()=>{
  if(root?.isConnected&&enabled())suppressOldNavigation();
});

function suppressOldNavigation(){
  // Legacy navigation is generated in a separate portal and occasionally
  // receives a high-specificity inline visibility/display override.
  // Temporarily suppress each native rail, and restore its original inline
  // styles immediately when the preview closes.
  for(const n of document.querySelectorAll('nav,[role="navigation"]')){
    if(root?.contains(n))continue;
    if(!suppressedNavs.has(n)){
      suppressedNavs.set(n,{
        display:n.style.getPropertyValue('display'),
        displayPriority:n.style.getPropertyPriority('display'),
        visibility:n.style.getPropertyValue('visibility'),
        visibilityPriority:n.style.getPropertyPriority('visibility')
      });
    }
    if(!watchedNativeNavs.has(n)){
      watchedNativeNavs.add(n);
      nativeNavAttrWatcher.observe(n,{attributes:true,attributeFilter:['class','style']});
    }
    if(n.style.getPropertyValue('display')!=='none'||
      n.style.getPropertyPriority('display')!=='important')
      n.style.setProperty('display','none','important');
    if(n.style.getPropertyValue('visibility')!=='hidden'||
      n.style.getPropertyPriority('visibility')!=='important')
      n.style.setProperty('visibility','hidden','important');
  }
}
function restoreOldNavigation(){
  nativeNavAttrWatcher.disconnect();
  watchedNativeNavs.clear();
  for(const [n,saved] of suppressedNavs){
    for(const [prop,value,priority] of [
      ['display',saved.display,saved.displayPriority],
      ['visibility',saved.visibility,saved.visibilityPriority]
    ]){
      if(value)n.style.setProperty(prop,value,priority);
      else n.style.removeProperty(prop);
    }
  }
  suppressedNavs.clear();
}

function stateNow(){try{return store.getState()||{}}catch{return{}}}
function growth(){
  try{const x=JSON.parse(localStorage.getItem('lux-garden-life-v1')||'null');
    const n=Array.isArray(x?.basilDays)?x.basilDays.length:0;
    return Math.min(7,Math.max(0,n));}
  catch{return 0}
}
function nativeToast(text){
  const live=document.querySelector('[role="status"],[data-sonner-toaster]');
  if(live?.textContent?.includes(text))return;
}
function openPanel(title,kind){
  if(!root?.isConnected)return;
  modal?.remove();
  const before=document.activeElement;
  modal=create('div','lux-garden-modal');
  modal.setAttribute('role','presentation');
  const panel=create('section','lux-garden-modal-panel');
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label',title);
  const head=create('div','lux-garden-modal-head');
  head.append(create('h2',null,title));
  const close=create('button',null,'×');
  close.setAttribute('aria-label','Close '+title);close.type='button';
  const done=()=>{modal?.remove();modal=null;before?.focus?.();};
  close.addEventListener('click',done);head.append(close);panel.append(head);
  const body=create('div','lux-garden-modal-content');
  if(kind==='log'){
    const entries=Array.isArray(stateNow().history)?stateNow().history.slice(0,16):[];
    if(!entries.length)body.append(create('p',null,'Study a little, and your first growth will appear here.'));
    for(const entry of entries){
      const r=create('div','lux-garden-log-item');
      r.append(create('span',null,safeText(entry.detail||'Garden progress')));
      if(Number.isFinite(Number(entry.xp))){const t=create('strong',null,'+'+Number(entry.xp)+' XP');r.append(t)}
      body.append(r);
    }
  }else if(kind==='item'){
    const item=collectibles.find(i=>i.name===title);
    const state=stateNow(),owned=Array.isArray(state.collectibles)?state.collectibles:[];
    if(item){
      const art=create('img');art.src=item.art;art.alt='';
      art.style.cssText='display:block;width:min(180px,45vw);height:140px;object-fit:contain;margin:0 auto 12px';
      body.append(art);
      const isOwned=owned.includes(item.id);
      const note=isOwned?'Unlocked — this garden piece belongs to you.':
        safeText(needProgress(item.needIf,requirementsContext(state))||item.need||'Keep studying to unlock this piece.');
      body.append(create('p',null,note));
      const msg=create('small',null,isOwned?'Unlocked':'Study progress will update this automatically.');
      body.append(msg);
    }else body.append(create('p',null,'Keep learning to unlock garden decorations.'));
  }else{
    const inventory=create('div','lux-garden-decor-grid');
    const state=stateNow(),unlocked=Array.isArray(state.collectibles)?state.collectibles:[];
    const context=requirementsContext(state);
    for(const item of collectibles.filter(x=>x.kind==='Garden')){
      const tile=create('div','lux-garden-decor');
      const img=create('img');img.src=item.art;img.alt='';img.loading='lazy';tile.append(img);
      tile.append(create('strong',null,item.name));
      const isOwned=unlocked.includes(item.id);
      const progress=isOwned?'Unlocked':
        (needProgress(item.needIf,context)||item.need||'Keep learning to unlock');
      tile.append(create('small',null,safeText(progress)));
      inventory.append(tile);
    }
    body.append(inventory);
  }
  panel.append(body);modal.append(panel);root.append(modal);
  modal.addEventListener('click',e=>{if(e.target===modal)done()});
  modal.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();done();}
    if(e.key==='Tab'){
      const btns=[...modal.querySelectorAll('button,[href]')].filter(el=>!el.disabled);
      if(btns.length<=1){e.preventDefault();close.focus();return}
      const first=btns[0],last=btns.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    }
  });close.focus();
}
function callNative(label){
  // The native decoration detail modal is intentionally behind the active
  // full-screen Garden preview. Show the same live unlock condition in the
  // accessible preview dialog instead of opening an invisible native dialog.
  openPanel(label,'item');
}
function assemble(){
  root=create('section','lux-garden-map-preview');
  root.id='lux-garden-academy-preview';root.setAttribute('aria-label',"The Scholar's Garden preview");
  root.append(create('div','lux-garden-backdrop'));
  const title=create('header','lux-garden-title');
  title.append(create('span','lux-garden-title-icon','❧'));
  const txt=create('div');txt.append(create('strong',null,"THE SCHOLAR’S GARDEN"));
  txt.append(create('small',null,'A garden that grows with learning'));title.append(txt);root.append(title);
  const stage=create('section','lux-garden-stage');
  stage.setAttribute('aria-label','Garden Stage');
  stage.append(create('span',null,'GARDEN STAGE'));
  stage.append(create('strong',null,''));
  const meter=create('div','lux-stage-progress');const fill=create('span');
  meter.append(fill);stage.append(meter);stage.append(create('span','lux-stage-xp',''));
  stage.append(create('em',null,''));root.append(stage);
  const world=create('div','lux-garden-world');
  world.setAttribute('aria-label','Interactive garden map');
  world.append(create('div','lux-garden-arch'),create('div','lux-garden-fountain'));
  const items=create('div','lux-garden-world-controls');
  for(const [id,label]of decorList){
    const b=create('button','lux-garden-item');
    b.type='button';b.dataset.item=id;
    const item=collectibles.find(i=>i.id===id);
    const pic=create('img');pic.src=item?.art||'/art/items/herb.jpg';pic.alt='';
    const content=create('div');
    content.append(create('strong',null,label),create('small',null,'Tap to see unlock requirements'));
    b.append(pic,content,create('span','lux-item-arrow','›'));
    b.addEventListener('click',()=>callNative(label));items.append(b);
  }
  world.append(items);
  const basil=create('div','lux-basil-box');
  const basilImg=create('img');basilImg.src='/art/items/herb.jpg';basilImg.alt='Basil growing in the garden';
  basil.append(basilImg,create('strong',null,'BASIL'),create('span',null,''));
  world.append(basil);
  const actions=create('div','lux-garden-actions');
  const log=create('button',null,'▣  GARDEN LOG');
  log.type='button';log.addEventListener('click',()=>openPanel('Recent Growth','log'));
  const water=create('button','lux-water','♧  WATER THE GARDEN');
  water.type='button';water.addEventListener('click',()=>{
    const native=nativeWater();if(!native||native.disabled)return;
    native.click();lastKey='';schedule();
  });
  const decoration=create('button',null,'DECORATIONS  ›');
  decoration.type='button';decoration.addEventListener('click',()=>openPanel('Garden Decorations','decor'));
  // The approved art has a single Basil progress panel in the centre: place
  // the real native-backed water control inside it, never across the fountain.
  basil.append(water);
  actions.append(log,decoration);world.append(actions);root.append(world);
  const nav=create('div','lux-garden-nav');nav.setAttribute('role','navigation');nav.setAttribute('aria-label','Main navigation');
  for(const [glyph,label,url]of navs){
    const a=create('a',label==='Garden'?'active':'');a.href=url;
    a.append(create('span',null,glyph),create('span',null,label));
    if(label==='Garden')a.setAttribute('aria-current','page');nav.append(a);
  }
  root.append(nav);
  document.body.append(root);
  return {stage,meter,fill,basil,water,items,world};
}
let parts;
function render(){
  waiting=false;
  if(!enabled()){
    restoreOldNavigation();
    root?.remove();root=null;parts=null;modal=null;lastKey='';
    document.documentElement.classList.remove('lux-garden-map-active');
    return;
  }
  // Do not proxy any native action until the actual React app has hydrated.
  if(!window.__luxAppReady)return;
  const native=document.querySelector('body>.paper-wash main');
  if(!native||!document.querySelector('body>.paper-wash button'))return;
  if(!root?.isConnected){parts=assemble();}
  document.documentElement.classList.add('lux-garden-map-active');
  suppressOldNavigation();
  const state=stateNow();const exp=Number(state.xp)||0;
  const st=gardenStage(exp),growthStep=growth();
  const watered=/Watered today/.test(nativeWater()?.textContent||'');
  const unlocked=Array.isArray(state.collectibles)?state.collectibles:[];
  const key=JSON.stringify([exp,st.stage,st.left,st.upcoming?.min,growthStep,watered,unlocked]);
  if(key===lastKey)return;lastKey=key;
  parts.stage.querySelector('strong').textContent='Stage '+st.stage;
  const min=Number(st.current?.min)||0;
  const max=Number(st.upcoming?.min)||Math.max(exp,1);
  const pct=st.upcoming?Math.max(0,Math.min(100,100*(exp-min)/Math.max(1,max-min))):100;
  parts.fill.style.width=pct.toFixed(2)+'%';
  parts.stage.querySelector('.lux-stage-xp').textContent=st.upcoming?
    exp.toLocaleString()+' / '+max.toLocaleString()+' XP':exp.toLocaleString()+' XP';
  parts.stage.querySelector('em').textContent=st.upcoming?
    safeText(st.current?.name)+' · '+st.left.toLocaleString()+' XP to '+st.upcoming.name:'All Garden stages unlocked';
  parts.basil.querySelector('span').textContent='Basil growth: '+growthStep+' / 7 steps';
  parts.water.textContent=watered?'✓  WATERED TODAY':'♧  WATER THE GARDEN';
  parts.water.disabled=watered||!nativeWater();
  for(const b of parts.items.querySelectorAll('[data-item]')){
    b.dataset.locked=String(!unlocked.includes(b.dataset.item));
    const content=b.querySelector('small');
    const item=collectibles.find(i=>i.id===b.dataset.item);
    const prog=needProgress(item?.needIf,requirementsContext(state));
    content.textContent=unlocked.includes(b.dataset.item)?'Unlocked — tap to inspect':
      safeText(prog||item?.need||'Tap for unlock requirements');
  }
}
function schedule(){if(waiting)return;waiting=true;requestAnimationFrame(render)}
const obs=new MutationObserver(()=>{
  // Synchronous mutation callback prevents an iPad WebKit paint showing a
  // newly mounted legacy navigation before the next animation frame.
  if(root?.isConnected&&enabled())suppressOldNavigation();
  schedule();
});
obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('popstate',schedule);
window.addEventListener('pageshow',schedule);
window.addEventListener('lux:app-ready',schedule);
window.addEventListener('storage',schedule);
store.subscribe?.(schedule);
store.persist?.onFinishHydration?.(schedule);
for(const key of ['pushState','replaceState']){
  const original=history[key];
  history[key]=function(...args){const out=original.apply(this,args);schedule();return out;};
}
schedule();
}
