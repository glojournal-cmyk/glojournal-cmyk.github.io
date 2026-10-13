// Presentation and navigation only. This module never changes learning credit.
export const GAME_TIME = Object.freeze({
 'weekly-boss':'5–8 min per section · estimate','error-hunter':'5–8 min · estimate',
 'forma-forge':'3–5 min · estimate','sentence-mosaic':'3–5 min · estimate',
 'case-locker':'5–8 min · estimate','verbum-match':'2–4 min · estimate',
 'manuscript':'5–8 min · estimate','mot-match':'2–4 min · estimate',
 'phrase-mosaic':'3–5 min · estimate','organelle-match':'2–4 min · estimate',
 'element-match':'2–4 min · estimate','force-match':'2–4 min · estimate',
 'word-match':'2–4 min · estimate','pe-circuit':'3–5 min per circuit · estimate'
});
export function lastGameVisit(value){
 return value&&Object.hasOwn(GAME_TIME,value.id)&&Number.isFinite(Number(value.at))?{id:value.id,at:Number(value.at)}:null;
}
if(typeof document!=='undefined'){
 const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/player-ux-20261013.css';document.head.append(link);
 const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};
 const setAttr=(node,name,value)=>{if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value)};
 let recordedPath='',frame=0;
 function state(){return globalThis.__luxStore?.getState?.()||globalThis.LuxJourney?.garden?.()}
 function next(){const s=state(),J=globalThis.LuxJourney;return s&&J?globalThis.LuxHomeContinue?.choose?.(s,J):null}
 function home(main){
  const data=next();if(!data)return;
  const links=[...main.querySelectorAll('a[href]')];
  const primary=links.find(a=>a.dataset.uxPrimary==='true')||links.find(a=>!a.closest('ul')&&/^Next task/.test(a.textContent.trim()));
  if(!primary)return;setAttr(primary,'data-ux-primary','true');setAttr(primary,'href',data.href);
  const spans=primary.querySelectorAll('span');
  setText(spans[0],data.kind==='resume'?'Resume practice':data.kind==='complete'?'Today complete':'Next task');
  setText(spans[1],data.title);
  let detail=primary.querySelector('[data-ux-next-detail]');
  if(!detail){detail=document.createElement('small');detail.dataset.uxNextDetail='';primary.append(detail)}
  setText(detail,data.detail);
  for(const a of links){
   if(a===primary||a.closest('ul'))continue;
   if(/^(Next task|Next ·|Start next task)/.test(a.textContent.trim()))setAttr(a,'data-ux-secondary-next','true');
  }
  const saved=main.querySelector('[aria-label="Continue saved study"]');if(saved)saved.hidden=true;
 }
 function study(main){
  const data=next();if(!data||data.kind==='library')return;
  let panel=document.getElementById('ux-study-continue');
  if(!panel){panel=document.createElement('section');panel.id='ux-study-continue';panel.className='ux-continue-panel';panel.setAttribute('aria-label','Continue today’s task');
   const title=main.querySelector('h1');(title?.closest('header')||title?.parentElement||main).insertAdjacentElement('afterend',panel);
   const kicker=document.createElement('p'),heading=document.createElement('h2'),copy=document.createElement('p'),a=document.createElement('a');
   kicker.className='kicker';kicker.textContent='TODAY’S TASK';panel.append(kicker,heading,copy,a);
  }
  setText(panel.querySelector('h2'),data.title);setText(panel.querySelector('p:not(.kicker)'),data.detail);
  setText(panel.querySelector('a'),data.button);setAttr(panel.querySelector('a'),'href',data.href);
  const prior=[...main.querySelectorAll('p')].find(p=>p.textContent.trim()==='Continue your last topic');if(prior)prior.parentElement.hidden=data.kind!=='complete';
 }
 function play(main){
  for(const a of main.querySelectorAll('a[href]')){
   const id=new URL(a.href,location.href).pathname.match(/^\/play\/([^/]+)\/?$/)?.[1];
   if(!GAME_TIME[id]||a.dataset.uxGameTime)continue;
   const p=document.createElement('p');p.className='ux-game-time';p.textContent=GAME_TIME[id];
   (a.querySelector('div.p-4')||a.querySelector('div')||a).append(p);a.dataset.uxGameTime='true';
  }
  let saved;try{saved=lastGameVisit(JSON.parse(localStorage.getItem('lux-game-visit-v1')||'null'))}catch{}
  if(!saved)return;
  const target=[...main.querySelectorAll('a[href]')].find(a=>new URL(a.href,location.href).pathname.replace(/\/$/,'')==='/play/'+saved.id);
  if(!target)return;
  let panel=document.getElementById('ux-last-game');if(!panel){panel=document.createElement('section');panel.id='ux-last-game';panel.className='ux-continue-panel';panel.setAttribute('aria-label','Last played game');
   const h=document.createElement('h2'),p=document.createElement('p'),a=document.createElement('a');h.textContent='Pick up your last game';p.textContent='Your unlocked levels are kept. Choose a level when you return.';panel.append(h,p,a);main.querySelector('header')?.after(panel);
  }
  const name=target.querySelector('.font-display')?.textContent||saved.id.replaceAll('-',' ');
  setText(panel.querySelector('a'),'Return to '+name+' →');setAttr(panel.querySelector('a'),'href',target.getAttribute('href'));
 }
 function refresh(){
  frame=0;const main=document.querySelector('main');if(!main)return;
  const path=location.pathname.replace(/\/$/,'')||'/';
  const practice=/^\/study\/[^/]+\/practise$/.test(path);
  document.body.classList.toggle('lux-focused-practice',practice);
  if(path==='/')home(main);
  if(path==='/study')study(main);
  if(path==='/play')play(main);
  const game=path.match(/^\/play\/([^/]+)$/)?.[1];
  if(game&&GAME_TIME[game]&&recordedPath!==path){
   recordedPath=path;try{localStorage.setItem('lux-game-visit-v1',JSON.stringify({id:game,at:Date.now()}))}catch{}
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(refresh)}
 // Observe only node changes, with a frame debounce and idempotent writes.
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 for(const event of ['lux:app-ready','pageshow','popstate','storage','scholar:session-saved','lux:ux-state'])window.addEventListener(event,schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});schedule();
}
