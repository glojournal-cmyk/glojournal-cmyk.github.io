const APP_KEY="lux-scholar-garden-v1";
const PET_KEY="lux-pet-companion-v1";
const CELEBRATE_KEY="lux-pet-pending-celebration";
const pets={"moss-hornling":"Moss Hornling","antler-bean":"Antler Bean","inkling":"Inkling","pebble-wisp":"Pebble Wisp","moon-puff":"Moon Puff","mothling":"Mothling","bloom-snail":"Bloom Snail","velvet-batling":"Velvet Batling","sprig-dragon":"Sprig Dragon","star-toadlet":"Star Toadlet"};
const stageNames=["Foundling","Curious Companion","Scholar Familiar","Garden Familiar","Mastery Companion"];

function readApp(){try{const p=JSON.parse(localStorage.getItem(APP_KEY)||"{}");return p&&p.state?p.state:p||{}}catch{return{}}}
function readPet(){try{const p=JSON.parse(localStorage.getItem(PET_KEY)||"{}");const species=pets[p&&p.species]?p.species:"moss-hornling";const levels=p&&p.petLevels&&typeof p.petLevels==="object"?Object.assign({},p.petLevels):{};if(!levels[species]&&Number(p&&p.highestStage)>1)levels[species]=Math.max(1,Math.min(5,Number(p.highestStage)));return Object.assign({},p,{species:species,name:String((p&&p.name)||"").trim(),masteryPoints:Math.max(0,Number(p&&p.masteryPoints)||0),petLevels:levels})}catch{return{species:"moss-hornling",name:"",masteryPoints:0,petLevels:{}}}}
function masteryCount(state){return Object.values(state.topicStats||{}).filter(function(s){return s&&s.state==="mastered"}).length}
function dueMastery(state){const d=new Date();const today=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");return Object.values(state.skillStats||{}).filter(function(s){return s&&s.retentionDue&&s.retentionDue<=today&&(s.retentionReady||s.retentionPasses>0)}).length}
function displayName(p){return p.name||pets[p.species]||"Companion"}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,function(ch){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]})}
const PET_ART_VERSION="20260926-evolution2";
function spriteStyle(species,level=1){
  const safe=pets[species]?species:"moss-hornling";
  if(Number(level)>=2){
    const position={2:"0% 0%",3:"100% 0%",4:"0% 100%",5:"100% 100%"}[Number(level)]||"0% 0%";
    return "background-image:url('/pet/art-evolution-v2/"+safe+".webp?v="+PET_ART_VERSION+"');background-size:200% 200%;background-position:"+position;
  }
  return "background-image:url('/pet/art-master/"+safe+".png?v="+PET_ART_VERSION+"')";
}

function ensureStyle(){
  if(document.getElementById("mastery-pet-home-style"))return;
  const style=document.createElement("style");
  style.id="mastery-pet-home-style";
  style.textContent=
  '#mastery-pet-home{position:absolute;right:2.5%;bottom:2.2%;z-index:26;width:clamp(150px,31%,210px);text-decoration:none;color:#17324d;display:flex;flex-direction:column;align-items:center;pointer-events:auto;transform-origin:bottom center;transition:transform .18s ease,filter .18s ease}'+
  '#mastery-pet-home:hover{transform:translateY(-3px);filter:brightness(1.02)}'+
  '#mastery-pet-home.evolving .mph-art{animation:mphEvolve 2.4s ease both}'+
  '#mastery-pet-home.evolving .mph-glow{animation:mphGlow 2.4s ease both}'+
  '#mastery-pet-home .mph-glow{position:absolute;width:90%;aspect-ratio:1;bottom:14px;border-radius:50%;background:radial-gradient(circle,rgba(247,240,223,.94) 0,rgba(196,154,85,.22) 48%,transparent 72%);filter:blur(1px);pointer-events:none}'+
  '#mastery-pet-home .mph-art{position:relative;width:100%;aspect-ratio:1;display:block;background-size:contain;background-position:center;background-repeat:no-repeat;filter:drop-shadow(0 10px 10px rgba(23,50,77,.22));overflow:visible;transform-origin:bottom center;transform:scaleX(-1) scale(var(--pet-size,.65));transition:transform .45s ease}'+
  '#mastery-pet-home[data-stage="1"]{--pet-size:.62}#mastery-pet-home[data-stage="2"]{--pet-size:.76}#mastery-pet-home[data-stage="3"]{--pet-size:.90}#mastery-pet-home[data-stage="4"]{--pet-size:1.05}#mastery-pet-home[data-stage="5"]{--pet-size:1.20}'+
  '#mastery-pet-home .mph-tag{position:relative;margin-top:-8px;max-width:100%;background:rgba(255,252,245,.94);border:1px solid rgba(23,50,77,.14);border-radius:999px;padding:5px 9px;box-shadow:0 7px 18px rgba(23,50,77,.13);backdrop-filter:blur(8px);font-size:10px;line-height:1.15;text-align:center;white-space:nowrap}'+
  '#mastery-pet-home .mph-tag b{font-family:"Cormorant Garamond",serif;font-size:12px}'+
  '#mastery-pet-home .mph-leaf{position:absolute;right:4%;top:13%;display:grid;place-items:center;min-width:25px;height:25px;padding:0 5px;border-radius:999px;background:#71865f;color:#fff;border:2px solid rgba(255,255,255,.88);font-size:9px;font-weight:800;box-shadow:0 4px 10px rgba(23,50,77,.18)}'+
  '#mastery-pet-home .mph-star{position:absolute;width:7px;height:7px;background:#c49a55;transform:rotate(45deg);animation:mphTwinkle 2.3s ease-in-out infinite}#mastery-pet-home .mph-star.s1{left:14%;top:28%}#mastery-pet-home .mph-star.s2{right:8%;top:38%;animation-delay:.8s}'+
  '@keyframes mphTwinkle{0%,100%{opacity:.25;scale:.7}50%{opacity:1;scale:1.3}}'+
  '@keyframes mphEvolve{0%{transform:scaleX(-1) scale(.7);filter:brightness(1)}35%{transform:scaleX(-1) scale(1.25);filter:brightness(1.35)}70%{transform:scaleX(-1) scale(.96)}100%{transform:scaleX(-1) scale(var(--pet-size))}}'+
  '@keyframes mphGlow{0%,100%{opacity:.65}40%{opacity:1;transform:scale(1.28)}}'+
  '#mastery-pet-toast{position:fixed;left:50%;top:18px;z-index:1000;transform:translate(-50%,-18px);opacity:0;background:#fffaf0;color:#17324d;border:1px solid rgba(196,154,85,.46);border-radius:20px;padding:11px 16px;box-shadow:0 16px 45px rgba(23,50,77,.2);font-size:13px;transition:.28s ease;max-width:min(92vw,440px);text-align:center}'+
  '#mastery-pet-toast.show{opacity:1;transform:translate(-50%,0)}#mastery-pet-toast b{font-family:"Cormorant Garamond",serif;font-size:18px;display:block}'+
  '#mastery-pet-mobile-link{position:fixed;right:24px;bottom:24px;z-index:70;display:flex;min-height:48px;align-items:center;justify-content:center;gap:6px;border:1px solid rgba(196,154,85,.55);border-radius:999px;background:#17324d;color:#fff;padding:11px 18px;text-decoration:none;box-shadow:0 10px 28px rgba(23,50,77,.3);font-size:14px;font-weight:800;letter-spacing:.04em;touch-action:manipulation}'+
  '#mastery-pet-mobile-link:hover{background:#243a58;transform:translateY(-1px)}'+
  '@media(max-width:640px){#mastery-pet-home{right:1.5%;bottom:2%;z-index:35;width:clamp(118px,30%,150px);touch-action:manipulation}#mastery-pet-home .mph-tag{font-size:9px;padding:4px 7px}#mastery-pet-home .mph-tag b{font-size:11px}#mastery-pet-mobile-link{right:14px;bottom:82px;min-height:46px;padding:10px 16px}}';
  document.head.appendChild(style);
}
function petNavIcon(){
  return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true"><circle cx="11" cy="4" r="2"></circle><circle cx="18" cy="8" r="2"></circle><circle cx="4" cy="8" r="2"></circle><path d="M12 11c-3.6 0-6.5 2.5-6.5 5.5 0 2.1 1.6 3.5 3.6 3.5 1.2 0 2-.7 2.9-.7s1.7.7 2.9.7c2 0 3.6-1.4 3.6-3.5 0-3-2.9-5.5-6.5-5.5Z"></path></svg>';
}
function openPets(event){
  event.preventDefault();
  event.stopImmediatePropagation();
  window.location.assign("/pet/");
}
function ensureNavigation(){
  const navs=[].slice.call(document.querySelectorAll("nav"));
  navs.forEach(function(nav){
    if(nav.querySelector('[data-pet-nav="true"]'))return;
    const play=[].slice.call(nav.querySelectorAll('a[href="/play"],a[href="/play/"]')).find(function(a){return a.parentElement===nav});
    if(!play)return;
    const link=document.createElement("a");
    link.href="/pet/";
    link.dataset.petNav="true";
    link.setAttribute("aria-label","Open Pets and Mastery Points");
    link.className=play.className;
    link.innerHTML=petNavIcon()+"Pets";
    link.addEventListener("click",openPets);
    play.insertAdjacentElement("afterend",link);
    if(!nav.closest("aside"))nav.style.gridTemplateColumns="repeat(7,minmax(0,1fr))";
  });
}
function findHero(){
  const scholar=[].slice.call(document.querySelectorAll('img[src^="/art/doll/"],img[src*="/art/doll/"]')).find(function(img){return img.closest("main")});
  if(!scholar)return null;
  const host=scholar.parentElement&&scholar.parentElement.parentElement;
  if(!host)return null;
  if(getComputedStyle(host).position==="static")host.style.position="relative";
  return host;
}
function showToast(title,body){
  let t=document.getElementById("mastery-pet-toast");
  if(!t){t=document.createElement("div");t.id="mastery-pet-toast";document.body.appendChild(t)}
  t.innerHTML="<b>🌿 "+title+"</b><span>"+(body||"")+"</span>";
  requestAnimationFrame(function(){t.classList.add("show")});
  setTimeout(function(){t.classList.remove("show")},3600);
}
function consumeCelebration(){
  try{
    const raw=localStorage.getItem(CELEBRATE_KEY);if(!raw)return;
    const c=JSON.parse(raw);
    if(!c||!c.at||Date.now()-c.at>28800000){localStorage.removeItem(CELEBRATE_KEY);return}
    localStorage.removeItem(CELEBRATE_KEY);
    showToast("A new Mastery Leaf",c.title?c.title+" is now mastered.":"A topic reached formal Mastery.");
  }catch{}
}
function render(){
  const existing=document.getElementById("mastery-pet-home");
  const mobileExisting=document.getElementById("mastery-pet-mobile-link");
  ensureNavigation();
  if(mobileExisting)mobileExisting.remove();
  if(location.pathname!=="/"){if(existing)existing.remove();return}
  const host=findHero();if(!host)return;
  ensureStyle();
  const state=readApp(),pet=readPet(),leaves=masteryCount(state),stage=Math.max(1,Math.min(5,Number(pet.petLevels&&pet.petLevels[pet.species])||1)),due=dueMastery(state);
  let a=existing;
  if(!a){a=document.createElement("a");a.id="mastery-pet-home";a.href="/pet/";a.setAttribute("aria-label","Open Companion Corner");a.addEventListener("click",function(event){event.preventDefault();event.stopImmediatePropagation();window.location.assign("/pet/")});host.appendChild(a)}
  else if(a.parentElement!==host)host.appendChild(a);
  const status=pet.masteryPoints+" MP · "+(due>0?due+" retention ready":leaves+" Mastery "+(leaves===1?"Leaf":"Leaves"));
  const signature=[pet.species,stage,pet.masteryPoints,due,leaves,displayName(pet)].join("|");
  a.dataset.stage=String(stage);
  if(a.dataset.renderSignature!==signature){
    a.dataset.renderSignature=signature;
    a.innerHTML='<span class="mph-glow"></span><span class="mph-star s1"></span><span class="mph-star s2"></span>'+
      '<span class="mph-art" style="'+spriteStyle(pet.species,stage)+'" aria-hidden="true"></span>'+
      (leaves>0?'<span class="mph-leaf">'+leaves+'</span>':'')+
      '<span class="mph-tag"><b>'+escapeHtml(displayName(pet))+'</b><br>'+escapeHtml(stageNames[stage-1]+' · '+status)+'</span>';
  }
  try{
    const key="lux-pet-last-stage-v1";
    const previous=Math.max(1,Number(localStorage.getItem(key))||stage);
    if(stage>previous){
      a.classList.add("evolving");
      showToast("A new companion form",displayName(pet)+" evolved into "+stageNames[stage-1]+".");
      setTimeout(function(){a.classList.remove("evolving")},2600);
    }
    localStorage.setItem(key,String(Math.max(previous,stage)));
  }catch{}
  consumeCelebration();
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;render()})}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("popstate",schedule);
window.addEventListener("storage",schedule);
window.addEventListener("focus",schedule);
window.addEventListener("scholar:pet-changed",schedule);
window.addEventListener("scholar:mp-changed",schedule);
window.addEventListener("scholar:mastery-earned",function(event){
  const d=event.detail||{};
  if(d.kind==="mastery"){try{localStorage.setItem(CELEBRATE_KEY,JSON.stringify({at:Date.now(),title:d.title||""}))}catch{}}
  schedule();
});
render();
