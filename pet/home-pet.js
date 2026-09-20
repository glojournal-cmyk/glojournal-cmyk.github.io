const APP_KEY="lux-scholar-garden-v1";
const PET_KEY="lux-pet-companion-v1";
const CELEBRATE_KEY="lux-pet-pending-celebration";
const pets={"moss-hornling":"Moss Hornling","antler-bean":"Antler Bean","inkling":"Inkling","pebble-wisp":"Pebble Wisp","moon-puff":"Moon Puff","mothling":"Mothling","bloom-snail":"Bloom Snail","velvet-batling":"Velvet Batling","sprig-dragon":"Sprig Dragon","star-toadlet":"Star Toadlet"};
const thresholds=[0,3,8,15,25];
const stageNames=["Foundling","Curious Companion","Scholar Familiar","Garden Familiar","Mastery Companion"];

function readApp(){try{const p=JSON.parse(localStorage.getItem(APP_KEY)||"{}");return p&&p.state?p.state:p||{}}catch{return{}}}
function readPet(){try{const p=JSON.parse(localStorage.getItem(PET_KEY)||"{}");const species=pets[p&&p.species]?p.species:"moss-hornling";return{species:species,name:String((p&&p.name)||"").trim()}}catch{return{species:"moss-hornling",name:""}}}
function masteryCount(state){return Object.values(state.topicStats||{}).filter(function(s){return s&&s.state==="mastered"}).length}
function getStage(leaves){let s=1;thresholds.forEach(function(t,i){if(leaves>=t)s=i+1});return Math.min(5,s)}
function dueMastery(state){const d=new Date();const today=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");return Object.values(state.skillStats||{}).filter(function(s){return s&&s.retentionDue&&s.retentionDue<=today&&(s.retentionReady||s.retentionPasses>0)}).length}
function displayName(p){return p.name||pets[p.species]||"Companion"}

function ensureStyle(){
  if(document.getElementById("mastery-pet-home-style"))return;
  const style=document.createElement("style");
  style.id="mastery-pet-home-style";
  style.textContent=
  '#mastery-pet-home{position:absolute;right:3.5%;bottom:3.2%;z-index:26;width:clamp(108px,21%,170px);text-decoration:none;color:#17324d;display:flex;flex-direction:column;align-items:center;pointer-events:auto;transform-origin:bottom center;transition:transform .18s ease,filter .18s ease}'+
  '#mastery-pet-home:hover{transform:translateY(-3px);filter:brightness(1.02)}'+
  '#mastery-pet-home .mph-glow{position:absolute;width:90%;aspect-ratio:1;bottom:14px;border-radius:50%;background:radial-gradient(circle,rgba(247,240,223,.94) 0,rgba(196,154,85,.22) 48%,transparent 72%);filter:blur(1px);pointer-events:none}'+
  '#mastery-pet-home .mph-svg{position:relative;width:100%;aspect-ratio:1;filter:drop-shadow(0 10px 10px rgba(23,50,77,.22));overflow:visible}'+
  '#mastery-pet-home[data-stage="1"] .mph-svg{transform:scale(.78)}#mastery-pet-home[data-stage="2"] .mph-svg{transform:scale(.85)}#mastery-pet-home[data-stage="3"] .mph-svg{transform:scale(.91)}#mastery-pet-home[data-stage="4"] .mph-svg{transform:scale(.97)}#mastery-pet-home[data-stage="5"] .mph-svg{transform:scale(1.03)}'+
  '#mastery-pet-home .mph-tag{position:relative;margin-top:-8px;max-width:100%;background:rgba(255,252,245,.94);border:1px solid rgba(23,50,77,.14);border-radius:999px;padding:5px 9px;box-shadow:0 7px 18px rgba(23,50,77,.13);backdrop-filter:blur(8px);font-size:10px;line-height:1.15;text-align:center;white-space:nowrap}'+
  '#mastery-pet-home .mph-tag b{font-family:"Cormorant Garamond",serif;font-size:12px}'+
  '#mastery-pet-home .mph-leaf{position:absolute;right:4%;top:13%;display:grid;place-items:center;min-width:25px;height:25px;padding:0 5px;border-radius:999px;background:#71865f;color:#fff;border:2px solid rgba(255,255,255,.88);font-size:9px;font-weight:800;box-shadow:0 4px 10px rgba(23,50,77,.18)}'+
  '#mastery-pet-home .mph-star{position:absolute;width:7px;height:7px;background:#c49a55;transform:rotate(45deg);animation:mphTwinkle 2.3s ease-in-out infinite}#mastery-pet-home .mph-star.s1{left:14%;top:28%}#mastery-pet-home .mph-star.s2{right:8%;top:38%;animation-delay:.8s}'+
  '@keyframes mphTwinkle{0%,100%{opacity:.25;scale:.7}50%{opacity:1;scale:1.3}}'+
  '#mastery-pet-toast{position:fixed;left:50%;top:18px;z-index:1000;transform:translate(-50%,-18px);opacity:0;background:#fffaf0;color:#17324d;border:1px solid rgba(196,154,85,.46);border-radius:20px;padding:11px 16px;box-shadow:0 16px 45px rgba(23,50,77,.2);font-size:13px;transition:.28s ease;max-width:min(92vw,440px);text-align:center}'+
  '#mastery-pet-toast.show{opacity:1;transform:translate(-50%,0)}#mastery-pet-toast b{font-family:"Cormorant Garamond",serif;font-size:18px;display:block}'+
  '@media(max-width:640px){#mastery-pet-home{right:2.5%;bottom:2.5%;width:clamp(92px,25%,122px)}#mastery-pet-home .mph-tag{font-size:9px;padding:4px 7px}#mastery-pet-home .mph-tag b{font-size:11px}}';
  document.head.appendChild(style);
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
  if(location.pathname!=="/"){if(existing)existing.remove();return}
  const host=findHero();if(!host)return;
  ensureStyle();
  const state=readApp(),pet=readPet(),leaves=masteryCount(state),stage=getStage(leaves),due=dueMastery(state);
  let a=existing;
  if(!a){a=document.createElement("a");a.id="mastery-pet-home";a.href="/pet/";a.setAttribute("aria-label","Open Companion Corner");host.appendChild(a)}
  else if(a.parentElement!==host)host.appendChild(a);
  const status=due>0?due+" retention ready":leaves+" Mastery "+(leaves===1?"Leaf":"Leaves");
  a.dataset.stage=String(stage);
  a.innerHTML='<span class="mph-glow"></span><span class="mph-star s1"></span><span class="mph-star s2"></span>'+
    '<svg class="mph-svg" viewBox="0 0 200 200" aria-hidden="true"><use href="/pet/pets.svg#'+pet.species+'"></use></svg>'+
    '<span class="mph-leaf">'+leaves+'</span>'+
    '<span class="mph-tag"><b>'+displayName(pet)+'</b><br>'+stageNames[stage-1]+' · '+status+'</span>';
  consumeCelebration();
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;render()})}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener("popstate",schedule);
window.addEventListener("storage",schedule);
window.addEventListener("focus",schedule);
window.addEventListener("scholar:pet-changed",schedule);
window.addEventListener("scholar:mastery-earned",function(event){
  const d=event.detail||{};
  if(d.kind==="mastery"){try{localStorage.setItem(CELEBRATE_KEY,JSON.stringify({at:Date.now(),title:d.title||""}))}catch{}}
  schedule();
});
schedule();