// Shared input and figure controls; no application state or marks are changed here.
(()=>{
 if(globalThis.luxIPadReady)return;globalThis.luxIPadReady=true;
 const style=document.createElement('style');style.textContent=`input:not([type=checkbox]):not([type=radio]),textarea,select{font-size:16px!important}textarea{line-height:1.6;scroll-margin:100px;resize:vertical}input,textarea,select{scroll-margin-block:100px}button{touch-action:manipulation}.lux-figure-button{display:block;padding:10px 14px;margin:6px 0 12px;border:1px solid #b8c9b8;border-radius:10px;color:#173e50;background:#fffdf6;min-height:44px}.lux-figure-dialog{width:min(96vw,1200px);max-width:96vw;padding:16px;background:#fffdf6;color:#173e50;border:1px solid #b8c9b8;border-radius:16px}.lux-figure-dialog::backdrop{background:#10202cbb}.lux-figure-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}.lux-figure-toolbar button{min-height:44px;padding:8px 14px}.lux-figure-scroll{overflow:auto;height:65dvh;max-height:70vh;overscroll-behavior:contain}.lux-figure-scroll img{max-width:none!important;max-height:none!important;display:block;object-fit:contain}.lux-keyboard-open nav.fixed.bottom-0{display:none} @media(max-width:600px){form:has(input){flex-wrap:wrap}form input{min-width:0;flex-basis:65%}}`;document.head.append(style);
 let dialog,focusBefore,zoom=1,viewerImage,scroller;
 function enlarge(img){
  focusBefore=document.activeElement;zoom=1;
  if(!dialog){dialog=document.createElement('dialog');dialog.className='lux-figure-dialog';dialog.setAttribute('aria-label','Enlarged scientific figure');dialog.innerHTML='<div class="lux-figure-toolbar"><strong>Scientific figure</strong><button type="button" data-action="in" aria-label="Zoom in">Zoom +</button><button type="button" data-action="out" aria-label="Zoom out">Zoom −</button><button type="button" data-action="reset">Fit figure</button><span role="status"></span><button type="button" data-action="close">Close figure</button></div><div class="lux-figure-scroll"><img></div><p>Zoom, then swipe or scroll to inspect the detail.</p>';document.body.append(dialog);viewerImage=dialog.querySelector('img');scroller=dialog.querySelector('.lux-figure-scroll');dialog.addEventListener('close',()=>focusBefore?.focus());}
  function paint(){viewerImage.style.width=Math.max(280,scroller.clientWidth)*zoom+'px';dialog.querySelector('[role=status]').textContent=Math.round(zoom*100)+'%'}
  // Update handler per opening so it always uses the current image and viewport.
  dialog.onclick=e=>{const a=e.target.dataset.action;if(a==='close')dialog.close();else if(a){zoom=a==='in'?Math.min(5,zoom+.5):a==='out'?Math.max(1,zoom-.5):1;paint()}};
  viewerImage.src=img.currentSrc||img.src;viewerImage.alt=img.alt;dialog.showModal();paint();
 }
 function enhance(){for(const img of document.querySelectorAll('[data-question-id] img,.assessment-diagram,section[aria-label="Cell structure practice"] form img')){if(img.dataset.luxZoom)return;img.dataset.luxZoom='true';const b=document.createElement('button');b.type='button';b.className='lux-figure-button';b.textContent='Enlarge figure';b.onclick=()=>enlarge(img);img.after(b)}}
 let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance()})};new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});schedule();
 function grow(e){if(!e||e.tagName!=='TEXTAREA')return;const desk=document.body.classList.contains('lux-desk');const view=window.visualViewport?.height||window.innerHeight;const cap=desk?Math.max(88,Math.round(view*0.32)):Math.max(180,view*0.6);const floor=desk?64:150;e.style.height='auto';e.style.height=Math.min(Math.max(floor,e.scrollHeight),cap)+'px'}
 function keepVisible(){fitViewport();const e=document.activeElement;if(!e||!e.matches?.('input,textarea,select')){document.body.classList.remove('lux-keyboard-open');return}const v=window.visualViewport;document.body.classList.toggle('lux-keyboard-open',!!v&&v.height<window.innerHeight*.78);if(document.body.classList.contains('lux-desk')){parkDesk();return}const r=e.getBoundingClientRect(),bottom=(v?.offsetTop||0)+(v?.height||window.innerHeight)-24;if(r.bottom>bottom)window.scrollBy({top:Math.min(r.bottom-bottom,r.top-32),behavior:'smooth'});else if(r.top<(v?.offsetTop||0)+20)window.scrollBy({top:r.top-(v?.offsetTop||0)-24,behavior:'smooth'})}
 const deskStyle=document.createElement('style');deskStyle.textContent=`@media (orientation:landscape) and (max-height:1100px){body.lux-desk{overflow:hidden}body.lux-desk header.sticky.top-0.z-30,body.lux-desk header.lux-companion-header,body.lux-desk nav.fixed.inset-x-3.bottom-3,body.lux-desk nav.lux-companion-bottom-nav,body.lux-desk .lux-companion-bottom-nav,body.lux-desk main>div>aside,body.lux-desk main>div>#study-companion,body.lux-desk main>div>section.cx-study-buddy,body.lux-desk main>div>div.space-y-5>:not(.space-y-4){display:none!important}body.lux-desk .paper-wash{min-height:0!important;padding-left:0!important}body.lux-desk main{min-height:0!important;padding-top:8px!important;padding-bottom:8px!important}body.lux-desk main>div>div.space-y-5>.space-y-4{max-height:var(--lux-vvh,100dvh);overflow:auto;display:flex;flex-direction:column;justify-content:flex-start;gap:.5rem}body.lux-desk main>div>div.space-y-5>.space-y-4>:first-child{overflow:auto;min-height:0}body.lux-desk main>div>div.space-y-5>.space-y-4>:last-child{flex:none}body.lux-desk textarea{max-height:32dvh!important}}`;document.head.append(deskStyle);
 function landscapePad(){return window.innerHeight<=1100&&window.innerWidth>window.innerHeight&&(navigator.maxTouchPoints>0||matchMedia('(pointer: coarse)').matches)}
 function questionOpen(){if(document.querySelector("[aria-label='Session result']"))return false;const node=document.querySelector('p.tabular-nums');return !!(node&&/Question\s+\d+\s+\//.test(node.textContent||''))}
 function fitViewport(){const v=window.visualViewport;document.documentElement.style.setProperty('--lux-vvh',Math.max(240,(v?.height||window.innerHeight)-12)+'px')}
 function parkDesk(){if(!document.body.classList.contains('lux-desk'))return;const y=window.visualViewport?.offsetTop||0;if(Math.abs(window.scrollY-y)>1)window.scrollTo(0,y)}
 function syncDesk(){const on=landscapePad()&&questionOpen();document.body.classList.toggle('lux-desk',on);document.querySelectorAll('header.sticky,nav.fixed').forEach(el=>{if(on)el.style.setProperty('display','none','important');else el.style.removeProperty('display')});if(!on)return;fitViewport();parkDesk();const field=document.querySelector('textarea, input[type="text"]');if(field&&document.activeElement===field)grow(field)}
 let deskQueued=false;function scheduleDesk(){if(deskQueued)return;deskQueued=true;requestAnimationFrame(()=>{deskQueued=false;syncDesk()})}
 new MutationObserver(scheduleDesk).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
 window.addEventListener('resize',scheduleDesk);window.visualViewport?.addEventListener('resize',()=>{scheduleDesk();if(document.body.classList.contains('lux-desk'))parkDesk()});
 matchMedia('(orientation: landscape)').addEventListener?.('change',scheduleDesk);
 document.addEventListener('focusin',e=>{grow(e.target);requestAnimationFrame(()=>{keepVisible();scheduleDesk()})});document.addEventListener('focusout',()=>requestAnimationFrame(keepVisible));document.addEventListener('input',e=>grow(e.target));window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(keepVisible));
 const accentStyle=document.createElement('style');
 accentStyle.textContent='.lux-accents{position:fixed;z-index:80;left:8px;right:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px;background:#fffaf0;border:1px solid #d4c6ac;border-radius:14px;box-shadow:0 8px 24px #17324d22}.lux-accents[hidden]{display:none!important}.lux-accents button{min-width:44px;min-height:44px;padding:0 8px;border:1px solid #17324d;border-radius:10px;background:#fff;color:#17324d;font:600 18px Georgia,serif;touch-action:manipulation}.lux-accents span{font:600 12px/1.2 system-ui;color:#5c6b62;padding-right:4px}';
 document.head.append(accentStyle);
 const accents=['é','è','ê','ë','à','â','ç','î','ï','ô','œ','ù','û','É','À','’'];
 const bar=document.createElement('div');
 bar.className='lux-accents';
 bar.hidden=true;
 bar.setAttribute('role','group');
 bar.setAttribute('aria-label','French accents');
 const label=document.createElement('span');
 label.textContent='Accents';
 bar.append(label);
 let field=null;
 function insertAccent(ch){
  const el=field&&document.contains(field)?field:document.activeElement;
  if(!el||!el.matches?.('input:not([type=checkbox]):not([type=radio]),textarea'))return;
  const start=el.selectionStart??el.value.length,end=el.selectionEnd??start;
  const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value').set.call(el,el.value.slice(0,start)+ch+el.value.slice(end));
  el.dispatchEvent(new Event('input',{bubbles:true}));
  const pos=start+ch.length;
  el.setSelectionRange?.(pos,pos);
  el.focus();
 }
 for(const ch of accents){
  const button=document.createElement('button');
  button.type='button';
  button.textContent=ch;
  button.setAttribute('aria-label','Insert '+ch);
  button.addEventListener('pointerdown',e=>e.preventDefault());
  button.addEventListener('click',()=>insertAccent(ch));
  bar.append(button);
 }
 if(document.body)document.body.append(bar);else document.addEventListener('DOMContentLoaded',()=>document.body.append(bar));
 function frenchHere(){if(/french/i.test(location.pathname))return true;return /French/.test(document.querySelector('h1,h2')?.textContent||'')}
 function textField(el){return !!(el&&el.matches?.('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea')&&!el.readOnly&&!el.disabled)}
 function placeAccents(){
  if(!bar.isConnected&&document.body)document.body.append(bar);
  const show=frenchHere()&&textField(field);
  bar.hidden=!show;
  if(!show)return;
  const view=window.visualViewport;
  const overlap=view?Math.max(0,window.innerHeight-view.height-view.offsetTop):0;
  bar.style.bottom=(overlap+8)+'px';
 }
 document.addEventListener('focusin',e=>{if(textField(e.target))field=e.target;placeAccents()});
 window.addEventListener('focusin',e=>{if(textField(e.target))field=e.target;placeAccents()});
 document.addEventListener('focusout',()=>setTimeout(()=>{if(!textField(document.activeElement))field=null;placeAccents()},0));
 window.visualViewport?.addEventListener('resize',placeAccents);
 window.visualViewport?.addEventListener('scroll',placeAccents);
 const keep=setInterval(placeAccents,400);
 setTimeout(()=>clearInterval(keep),8000);
 document.addEventListener('lux:app-ready',placeAccents);
})();
