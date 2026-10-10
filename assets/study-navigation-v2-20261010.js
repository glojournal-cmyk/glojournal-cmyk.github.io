// Optional Study-only UI. Existing React study, questions and save data are untouched.
(function(){
"use strict";
if(!/^\/study\/?$/.test(location.pathname))return;
const id="lux-study-paths-v2";
const y=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let queued=false,signature="",outfitCatalog=null;
function appearance(saved){
 const list=Array.isArray(outfitCatalog)?outfitCatalog:[];
 const selected=list.find(x=>x.id===saved.equippedOutfit)||list.find(x=>x.id==="day");
 const art=selected?.art||"/art/doll/day.png";
 const safeArt=/^\/art\/(?:doll|looks)\/[a-zA-Z0-9_-]+\.png$/.test(art)?art:"/art/doll/day.png";
 let pet={};
 try{pet=JSON.parse(localStorage.getItem("lux-pet-companion-v1")||"{}")||{}}catch{}
 const pets=new Set(["moss-hornling","antler-bean","inkling","pebble-wisp","moon-puff","mothling","bloom-snail","velvet-batling","sprig-dragon","star-toadlet","snow-owl","night-spider"]);
 const species=pets.has(pet.species)?pet.species:"moss-hornling";
 const level=Math.max(1,Math.min(5,Number(pet.petLevels?.[species])||(pet.species===species?Number(pet.highestStage):0)||1));
 const name=String(pet.name||species.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())).slice(0,70);
 return {scholar:safeArt,outfit:String(selected?.name||"Day Uniform").slice(0,70),
   pet:"/pet/art-hd-20261009/level-"+level+"/"+species+".webp?v=20261009-hd1",
   petName:name,level};
}
function selectYear(year){
 const s=document.querySelector('main select:has(option[value="8"])');
 if(!s||s.disabled)return false;
 if(Number(s.value)===year)return true;
 const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value")?.set;
 if(setter)setter.call(s,String(year));else s.value=String(year);
 s.dispatchEvent(new Event("input",{bubbles:true}));
 s.dispatchEvent(new Event("change",{bubbles:true}));
 return true;
}
function snapshot(){
 let saved={};
 try{const entry=JSON.parse(localStorage.getItem("lux-scholar-garden-v1")||"{}");saved=entry.state||entry;}catch{}
 const J=globalThis.LuxJourney;
 const valid=saved.today===J?.day?.()&&Array.isArray(saved.daily);
 const daily=valid?saved.daily:[];
 const done=daily.filter(t=>Number(t.target)>0&&Number(t.progress)>=Number(t.target)).length;
 let resume=[];
 try{resume=J?.resumeCandidates(saved)||[]}catch{}
 const paused=resume.find(x=>x.daily&&x.planDate===saved.today)||resume[0];
 const fallback=daily.find(t=>Number(t.progress)<Number(t.target)&&J?.safeHref(t.href));
 const href=paused&&J?.safeHref(paused.href)?paused.href:J?.navigationHref(fallback?.href)||"/";
 return {total:daily.length||10,done,valid,year:Number(saved.year)===8?8:9,
  href:href,paused:!!paused,appearance:appearance(saved)};
}
function repaint(){
 queued=false;
 if(!window.__luxAppReady)return;
 const header=document.querySelector("main > div.space-y-8 > header");
 if(!header)return;
 const parent=header.parentElement;
 const subjects=[...parent.querySelectorAll("section")].find(x=>x.querySelector("h2")?.textContent?.trim()==="Subjects");
 if(subjects)subjects.id="lux-study-subjects-v2";
 const d=snapshot();
 const old=parent.querySelector(":scope > #"+id);
 const key=JSON.stringify(d);
 if(old&&signature===key)return;
 const card=document.createElement("section");
 card.id=id;
 card.className="lux-study-paths";
 card.setAttribute("aria-label","Choose your study path");
 card.innerHTML=
 '<div class="lux-path-intro"><div><p class="lux-path-eyebrow">THE SCHOLAR’S GARDEN</p><h2>Choose your path</h2><p>One place for daily learning, extra revision and school tests.</p></div></div>'+
 '<div class="lux-path-hero" aria-label="Your scholar and companion together">'+
 '<img class="lux-path-hero-scene" src="/art/stages/dusk.jpg" alt="" loading="eager">'+
 '<div class="lux-path-hero-overlay" aria-hidden="true"></div>'+
 '<div class="lux-path-hero-copy"><p class="lux-path-hero-kicker">LUX ET LABOR · THE SCHOLAR’S GARDEN</p>'+
 '<h3>Explore. Learn. Become.</h3><p>Every challenge lights another star in your Scholar’s Garden.</p>'+
 '<div class="lux-quest-now"><span>✧ CURRENT QUEST</span><strong>'+y(d.paused?"Your saved practice":"Today’s next mission")+'</strong>'+
 '<small>'+(d.valid?d.done+' of '+d.total+' daily quests completed':'Your daily quest awaits')+'</small>'+
 '<a href="'+y(d.href)+'">Continue the adventure ↗</a></div>'+
 '<div class="lux-path-hero-links"><a href="/scholar/">Wardrobe ↗</a><a href="/pet/">Companion ↗</a></div></div>'+
 '<img class="lux-path-hero-pet" src="'+y(d.appearance.pet)+'" alt="'+y(d.appearance.petName)+', companion level '+d.appearance.level+'" loading="eager">'+
 '<img class="lux-path-hero-scholar" src="'+y(d.appearance.scholar)+'" alt="Scholar wearing '+y(d.appearance.outfit)+'" loading="eager">'+
 '<nav class="lux-path-portals" aria-label="Quest destinations">'+
 '<a class="lux-path-portal" href="'+y(d.href)+'"><span class="lux-portal-glyph">✦</span><span><small>01 · YOUR ADVENTURE</small><strong>Daily Quest</strong><em>'+d.done+' / '+d.total+' stars lit</em></span></a>'+
 '<a class="lux-path-portal" href="#lux-study-subjects-v2"><span class="lux-portal-glyph">✧</span><span><small>02 · EXPLORE THE ARCHIVES</small><strong>Scholar’s Atlas</strong><em>Year 8 & Year 9 topics</em></span></a>'+
 '<a class="lux-path-portal" href="/assessment/"><span class="lux-portal-glyph">⚜</span><span><small>03 · TEST YOUR MASTERY</small><strong>Trial Chamber</strong><em>School assessments</em></span></a>'+
 '</nav></div>'+
 '<div class="lux-path-sigil-ledger"><div><span class="lux-path-eyebrow">THE QUEST LEDGER</span><h3>Your ten daily stars</h3></div>'+
 '<div class="lux-path-sigils" aria-label="'+d.done+' of '+d.total+' daily stars complete">'+
 Array.from({length:10},(_,i)=>'<span class="'+(i<d.done?'lit':i===d.done?'next':'')+'" aria-hidden="true">'+(i<d.done?'✦':'✧')+'</span>').join('')+
 '</div><p>Same ten learning tasks, now part of one unfolding journey.</p></div>'+
 '<details class="lux-path-expand"><summary>✧ Quest details · Year 8 / Year 9 study options</summary><div class="lux-path-grid">'+
 '<article class="lux-path-card lux-path-daily"><span class="lux-path-symbol" aria-hidden="true">✦</span><p class="lux-path-eyebrow">01 · YOUR ROUTINE</p><h3>Daily Quest</h3><p>Keep your adventure going. Every completed task lights a star.</p>'+
 '<div class="lux-path-progress" role="progressbar" aria-label="Daily tasks completed" aria-valuemin="0" aria-valuemax="'+d.total+'" aria-valuenow="'+d.done+'"><span style="width:'+Math.min(100,d.done/d.total*100)+'%"></span></div>'+
 '<p class="lux-path-status">'+(d.valid?d.done+' / '+d.total+' tasks counted today':'Your daily tasks are on Home')+'</p>'+
 '<a class="lux-path-action" href="'+y(d.href)+'">'+(d.paused?'Resume saved practice':'Open daily journey')+' ↗</a></article>'+
 '<article class="lux-path-card"><span class="lux-path-symbol" aria-hidden="true">✧</span><p class="lux-path-eyebrow">02 · LEARN & PRACTISE</p><h3>Scholar’s Atlas</h3><p>Explore old knowledge, discover new lessons and build mastery.</p>'+
 '<div class="lux-path-years" role="group" aria-label="Choose year"><button type="button" data-lux-year="8" aria-pressed="'+(d.year===8)+'">Year 8 revision</button><button type="button" data-lux-year="9" aria-pressed="'+(d.year===9)+'">Year 9 topics</button></div>'+
 '<a class="lux-path-textlink" href="#lux-study-subjects-v2">Browse all subjects ↓</a></article>'+
 '<article class="lux-path-card"><span class="lux-path-symbol" aria-hidden="true">✤</span><p class="lux-path-eyebrow">03 · PREPARE</p><h3>Trial Chamber</h3><p>Prepare for school assessments and prove what you have learned.</p>'+
 '<p class="lux-path-note">Separate from your 10 daily tasks.</p><a class="lux-path-textlink" href="/assessment/">Open assessments ↗</a></article></div></details>';
 for(const b of card.querySelectorAll("[data-lux-year]"))b.addEventListener("click",()=>{
  if(selectYear(Number(b.dataset.luxYear)))for(const other of card.querySelectorAll("[data-lux-year]"))
   other.setAttribute("aria-pressed",String(other===b));
 });
 if(old)old.replaceWith(card);else header.after(card);
 signature=key;
}
function queue(){if(!queued){queued=true;queueMicrotask(repaint)}}
window.addEventListener("lux:app-ready",queue);
window.addEventListener("pageshow",queue);
window.addEventListener("storage",queue);
window.addEventListener("scholar:session-saved",queue);
window.addEventListener("scholar:pet-changed",queue);
window.addEventListener("scholar:wardrobe-changed",queue);
import("/assets/index-BLVOhKhN.js?v=20261010-chem-marking1").then(mod=>{
 outfitCatalog=mod.A;
 mod.C?.subscribe?.(queue);
 queue();
}).catch(()=>{ /* Original look remains available even if catalog is delayed. */ });
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")queue()});
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
queue();
})();