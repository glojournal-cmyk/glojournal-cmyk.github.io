const APP_KEY = "lux-scholar-garden-v1";
const PET_KEY = "lux-pet-companion-v1";

const pets = [
  {id:"moss-hornling",name:"Moss Hornling",tag:"A little forest heart, always finding light."},
  {id:"antler-bean",name:"Antler Bean",tag:"Strange seeds grow into wonderful company."},
  {id:"inkling",name:"Inkling",tag:"Ideas take many forms."},
  {id:"pebble-wisp",name:"Pebble Wisp",tag:"Quiet things hold great wonder."},
  {id:"moon-puff",name:"Moon Puff",tag:"A dreamer by nature."},
  {id:"mothling",name:"Mothling",tag:"Gentle wings for curious places."},
  {id:"bloom-snail",name:"Bloom Snail",tag:"Carry beauty wherever you go."},
  {id:"velvet-batling",name:"Velvet Batling",tag:"Dark corners, warmer company."},
  {id:"sprig-dragon",name:"Sprig Dragon",tag:"A kinder magic for everyday wonders."},
  {id:"star-toadlet",name:"Star Toadlet",tag:"Odd, earnest, and full of light."}
];

const stageNames = ["Foundling","Curious Companion","Scholar Familiar","Garden Familiar","Mastery Companion"];
const thresholds = [0,3,8,15,25];
const stageCopy = [
  "A small companion has joined the Scholar’s Garden.",
  "Curiosity is beginning to show in every little habit.",
  "Your companion now carries the marks of serious study.",
  "The garden and your learning have started to grow together.",
  "A prestige companion shaped by sustained mastery."
];

const subjectMeta = {
  latin:{label:"Latin",icon:"❦"},
  french:{label:"French",icon:"✿"},
  biology:{label:"Biology",icon:"🌿"},
  chemistry:{label:"Chemistry",icon:"⚗"},
  physics:{label:"Physics",icon:"✦"},
  english:{label:"English",icon:"✎"}
};

const HQ_PETS=new Set(["moss-hornling","antler-bean","inkling","pebble-wisp","moon-puff"]);
function artSrc(species,stage=1){
  return HQ_PETS.has(species)
    ? `/pet/art-master/${species}.avif?v=20260920-hq1`
    : `/pet/art-production/${species}.webp?v=20260920-art2`;
}

function readAppState(){
  try{
    const raw=localStorage.getItem(APP_KEY);
    if(!raw) return {};
    const parsed=JSON.parse(raw);
    return parsed?.state || parsed || {};
  }catch{return {}}
}
function readPet(){
  try{
    const raw=localStorage.getItem(PET_KEY);
    const parsed=raw?JSON.parse(raw):{};
    return {
      species:pets.some(p=>p.id===parsed?.species)?parsed.species:"moss-hornling",
      name:String(parsed?.name||"").trim(),
      highestStage:Math.max(1,Math.min(5,Number(parsed?.highestStage)||1))
    };
  }catch{return {species:"moss-hornling",name:"",highestStage:1}}
}
function savePet(next){
  localStorage.setItem(PET_KEY,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("scholar:pet-changed",{detail:next}));
}
function todayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function inferSubject(topicId=""){
  const id=String(topicId).toLowerCase();
  if(id.startsWith("la-")||id.startsWith("latin")) return "latin";
  if(id.startsWith("fr-")||id.startsWith("french")) return "french";
  if(id.startsWith("bio-")||id.startsWith("bi-")) return "biology";
  if(id.startsWith("chem-")||id.startsWith("ch-")) return "chemistry";
  if(id.startsWith("phys-")||id.startsWith("ph-")) return "physics";
  if(id.startsWith("eng-")||id.startsWith("en-")) return "english";
  return null;
}
function prettyTopic(topicId=""){
  return String(topicId)
    .replace(/^(latin|french|bio|bi|chem|ch|phys|ph|eng|en)-legacy-/i,"")
    .replace(/^(la|fr|bio|bi|chem|ch|phys|ph|eng|en)-y\d+-/i,"")
    .replace(/^(latin|french|biology|chemistry|physics|english)-/i,"")
    .replace(/-/g," ")
    .replace(/\b\w/g,c=>c.toUpperCase()) || "Focus topic";
}
function masteredRows(state){
  return Object.entries(state.topicStats||{}).filter(([,s])=>s?.state==="mastered");
}
function masteryCount(state){return masteredRows(state).length}
function getStage(leaves){
  let stage=1;
  thresholds.forEach((t,i)=>{if(leaves>=t) stage=i+1});
  return Math.min(5,stage);
}
function nextThreshold(stage){return stage>=5?thresholds[4]:thresholds[stage]}
function stageProgress(leaves,stage){
  if(stage>=5) return 100;
  const start=thresholds[stage-1], end=thresholds[stage];
  return Math.max(0,Math.min(100,Math.round(((leaves-start)/(end-start))*100)));
}
function dueMasteryCount(state){
  const today=todayKey();
  let count=0;
  for(const review of Object.values(state.reviews||{})){
    if(!review?.due||review.due>today) continue;
    const topicId=review.topicId;
    if(topicId && state.topicStats?.[topicId]?.state==="mastered") count++;
  }
  for(const stat of Object.values(state.skillStats||{})){
    if(stat?.retentionDue && stat.retentionDue<=today && (stat.retentionReady||stat.retentionPasses>0)) count++;
  }
  return count;
}
function retentionPasses(state){
  return Object.values(state.skillStats||{}).reduce((n,s)=>n+(Number(s?.retentionPasses)||0),0);
}
function closeToMastery(state){
  const candidates=Object.entries(state.topicStats||{}).map(([id,raw])=>{
    const attempted=Number(raw?.attempted)||0;
    const correct=Number(raw?.correct)||0;
    const accuracy=attempted?correct/attempted:0;
    const production=Number(raw?.productionCorrect)||0;
    if(raw?.state==="mastered"||attempted<3) return null;
    const evidence=Math.min(1,attempted/6);
    const acc=Math.min(1,accuracy/.85);
    const productionScore=production>0?1:0;
    const score=evidence*.45+acc*.4+productionScore*.15;
    return {id,attempted,accuracy,production,score,subject:inferSubject(id)};
  }).filter(Boolean).sort((a,b)=>b.score-a.score);
  return candidates[0]||null;
}
function subjectCounts(state){
  const counts={latin:0,french:0,biology:0,chemistry:0,physics:0,english:0};
  for(const [id] of masteredRows(state)){
    const s=inferSubject(id);
    if(s in counts) counts[s]++;
  }
  return counts;
}
function growthMessage(state){
  const due=dueMasteryCount(state);
  const close=closeToMastery(state);
  if(close && close.score>.62){
    const subject=subjectMeta[close.subject]?.label||"Study";
    return {
      title:"Close to mastery",
      body:`${subject} · ${prettyTopic(close.id)} · ${close.attempted} formal attempts at ${Math.round(close.accuracy*100)}%.`
    };
  }
  if(due>0){
    return {
      title:"Keep the glow bright",
      body:`${due} mastered ${due===1?"item is":"items are"} ready for retention. Nothing is lost — they simply need refreshing.`
    };
  }
  const leaves=masteryCount(state);
  return leaves
    ? {title:"Steady growth",body:`${leaves} Mastery ${leaves===1?"Leaf":"Leaves"} gathered through real learning evidence.`}
    : {title:"Your companion is waiting",body:"The first Mastery Leaf appears when a topic reaches formal Mastery."};
}
function glowLabel(state){
  const due=dueMasteryCount(state);
  if(due===0) return "Bright";
  if(due<=2) return "Ready";
  return "Resting";
}
function petDisplayName(pet){
  return pet.name || pets.find(p=>p.id===pet.species)?.name || "Companion";
}
function petById(id){return pets.find(p=>p.id===id)||pets[0]}
function render(){
  const state=readAppState();
  const pet=readPet();
  const species=petById(pet.species);
  const leaves=masteryCount(state);
  const computedStage=getStage(leaves);
  const stage=Math.max(computedStage,pet.highestStage||1);
  if(stage>(pet.highestStage||1)){
    const updated={...pet,highestStage:stage};
    localStorage.setItem(PET_KEY,JSON.stringify(updated));
    pet.highestStage=stage;
  }
  const next=nextThreshold(stage);
  const remaining=Math.max(0,next-leaves);
  const progress=stageProgress(leaves,stage);
  const due=dueMasteryCount(state);
  const passes=retentionPasses(state);
  const msg=growthMessage(state);
  const counts=subjectCounts(state);

  document.title=`${petDisplayName(pet)} · Companion Corner · Lux et Labor`;
  document.getElementById("petTitle").textContent=petDisplayName(pet);
  document.getElementById("petSubtitle").textContent=species.tag;
  const petImage=document.getElementById("petImage");
  petImage.src=artSrc(pet.species,stage);
  petImage.alt=`${petDisplayName(pet)} · ${stageNames[stage-1]}`;
  document.getElementById("petAvatar").className=`pet-avatar stage-${stage}`;
  document.getElementById("petAura").className=`pet-aura stage-${stage}`;
  document.getElementById("stageLabel").textContent=`Stage ${stage} · ${stageNames[stage-1]}`;
  document.getElementById("stageNote").textContent=stageCopy[stage-1];
  document.getElementById("leafCount").textContent=leaves;
  document.getElementById("retentionCount").textContent=passes;
  document.getElementById("glowStatus").textContent=glowLabel(state);
  document.getElementById("growthBar").style.width=`${progress}%`;
  document.getElementById("growthPct").textContent=stage>=5?"Prestige":`${progress}%`;
  document.getElementById("nextText").textContent=stage>=5
    ?"Prestige form reached. New mastery now adds subject marks and history."
    :`${remaining} more mastered topic${remaining===1?"":"s"} to reach Stage ${stage+1}.`;
  document.getElementById("messageTitle").textContent=msg.title;
  document.getElementById("messageBody").textContent=msg.body;
  document.getElementById("petNameInput").value=pet.name||"";

  const steps=document.getElementById("stageSteps");
  steps.innerHTML=stageNames.map((name,i)=>{
    const n=i+1;
    const cls=n<stage?"done":n===stage?"current":"";
    return `<div class="pet-step ${cls}"><b>${n}</b><br>${name.replace(" Companion","").replace(" Familiar","")}</div>`;
  }).join("");

  const charms=document.getElementById("subjectCharms");
  const charmRows=Object.entries(counts).filter(([,n])=>n>0);
  charms.innerHTML=charmRows.length
    ?charmRows.map(([id,n])=>`<span class="pet-charm">${subjectMeta[id].icon} ${subjectMeta[id].label} · ${n}</span>`).join("")
    :'<span class="pet-charm">Master a topic to add the first subject mark.</span>';

  document.querySelectorAll(".pet-choice").forEach(btn=>{
    btn.classList.toggle("selected",btn.dataset.pet===pet.species);
  });

  document.getElementById("dueNote").textContent=due>0
    ?`${due} retention item${due===1?"":"s"} currently ready.`
    :"No mastered material is currently overdue.";
}
function buildChooser(){
  const grid=document.getElementById("petGrid");
  grid.innerHTML=pets.map(p=>`
    <button class="pet-choice" type="button" data-pet="${p.id}" aria-label="Choose ${p.name}">
      <img src="${artSrc(p.id,1)}" alt="" loading="lazy" decoding="async">
      <b>${p.name}</b><small>${p.tag}</small>
      <span class="selected-mark">Current companion</span>
    </button>
  `).join("");
  grid.addEventListener("click",event=>{
    const btn=event.target.closest(".pet-choice");
    if(!btn) return;
    const current=readPet();
    savePet({...current,species:btn.dataset.pet});
    render();
  });
}
document.getElementById("saveName").addEventListener("click",()=>{
  const current=readPet();
  const name=document.getElementById("petNameInput").value.trim().slice(0,28);
  savePet({...current,name});
  render();
});
document.getElementById("petNameInput").addEventListener("keydown",e=>{
  if(e.key==="Enter") document.getElementById("saveName").click();
});
window.addEventListener("storage",render);
window.addEventListener("focus",render);
window.addEventListener("scholar:pet-changed",render);
buildChooser();
render();