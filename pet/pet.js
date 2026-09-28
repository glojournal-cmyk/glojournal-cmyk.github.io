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
  {id:"star-toadlet",name:"Star Toadlet",tag:"Odd, earnest, and full of light."},
  {id:"snow-owl",name:"Moonveil Owl",tag:"A white guardian of hard-won knowledge.",secret:true},
  {id:"night-spider",name:"Nocturne Spider",tag:"A velvet weaver of patient discoveries.",secret:true}
];
const character = {
  "moss-hornling": {nature:"Gentle, stubborn and quietly brave",habit:"Plants a seed wherever it finds a difficult question.",forms:["Tiny forest scout","Leaf-horn forager","Mossland runner","Canopy guardian","Ancient grove keeper"]},
  "antler-bean": {nature:"Curious, clumsy and loyal",habit:"Collects curious facts and remembers who taught them.",forms:["Little woodland bean","Branching wanderer","Young forest explorer","Great antler guardian","Celestial elk"]},
  "inkling": {nature:"Inventive, quick and a little dramatic",habit:"Draws ideas in the air with its ink-feather tail.",forms:["First spark of ink","Curl-tailed sketcher","Quill-wing scholar","Ink phoenix","Midnight master phoenix"]},
  "pebble-wisp": {nature:"Patient, observant and surprisingly funny",habit:"Rearranges its stones whenever a puzzle clicks.",forms:["Little floating pebble","Orbiting stones","Rune cluster","Stone sentinel","Crystal constellation"]},
  "moon-puff": {nature:"Dreamy, kind and fiercely attentive",habit:"Keeps a tiny light on for lessons worth revisiting.",forms:["Sleepy moon cloud","Crescent-eared puff","Moon hare","Lunar runner","Cloud-tail guardian"]},
  "mothling": {nature:"Soft-spoken, fearless around new ideas",habit:"Follows questions like lanterns through the dark.",forms:["Little lantern moth","Unfolding wings","Four-wing explorer","Silk-wing guardian","Lunar emperor moth"]},
  "bloom-snail": {nature:"Unhurried, persistent and generous",habit:"Carries a living garden and celebrates slow progress.",forms:["Seed-shell snail","Greenhouse shell","Walking flower garden","Garden guardian","Elder bloom keeper"]},
  "velvet-batling": {nature:"Witty, alert and fond of mysteries",habit:"Listens for the answer everyone else missed.",forms:["Little velvet bat","Scallop-wing glider","Echo explorer","Night-wing guardian","Crescent sentinel"]},
  "sprig-dragon": {nature:"Bold, protective and endlessly curious",habit:"Guards new knowledge until it takes root.",forms:["Tiny sprig dragon","Branch-horn hatchling","Vine-tail flier","Verdant dragon","Ancient canopy dragon"]},
  "star-toadlet": {nature:"Odd, earnest and unexpectedly wise",habit:"Counts small victories as if they were stars.",forms:["Little star toad","Glowing jumper","Star-finned explorer","Cosmic marsh guardian","Constellation sovereign"]},
  "snow-owl": {nature:"Watchful, wise and quietly brave",habit:"Keeps a moonlit watch over every lesson mastered.",forms:["Snowy owlet","White-wing scout","Moon-wing scholar","Lunar guardian","Celestial sentinel"]},
  "night-spider": {nature:"Patient, daring and brilliantly resourceful",habit:"Weaves the lessons you remembered into silver threads.",forms:["Velvet spiderling","Night runner","Obsidian hunter","Web guardian","Nocturne sovereign"]}
};

const stageNames = ["Foundling","Curious Companion","Scholar Familiar","Garden Familiar","Mastery Companion"];
const evolutionCosts = [50,90,140,200];
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

const petVoices = {
  "moss-hornling":{close:"Moss Hornling senses new growth",due:"Moss Hornling rustles a reminder",steady:"Moss Hornling sees steady roots",waiting:"Moss Hornling is ready to grow"},
  "antler-bean":{close:"Antler Bean spots a breakthrough",due:"Antler Bean remembers something",steady:"Antler Bean is quietly impressed",waiting:"Antler Bean has found a study nook"},
  "inkling":{close:"Inkling has an idea",due:"Inkling marks a page to revisit",steady:"Inkling records your progress",waiting:"Inkling opens a fresh page"},
  "pebble-wisp":{close:"Pebble Wisp feels the answer near",due:"Pebble Wisp leaves a gentle reminder",steady:"Pebble Wisp notices every small step",waiting:"Pebble Wisp waits beside the first step"},
  "moon-puff":{close:"Moon Puff sees mastery on the horizon",due:"Moon Puff lights the way back",steady:"Moon Puff glows with steady progress",waiting:"Moon Puff is watching for the first spark"},
  "mothling":{close:"Mothling follows a bright idea",due:"Mothling circles back to an old lesson",steady:"Mothling keeps the learning light",waiting:"Mothling waits for the first glow"},
  "bloom-snail":{close:"Bloom Snail sees a lesson about to flower",due:"Bloom Snail carries a reminder",steady:"Bloom Snail celebrates patient progress",waiting:"Bloom Snail is planting the first seed"},
  "velvet-batling":{close:"Velvet Batling hears mastery approaching",due:"Velvet Batling echoes a reminder",steady:"Velvet Batling approves from the shadows",waiting:"Velvet Batling is listening for the first answer"},
  "sprig-dragon":{close:"Sprig Dragon guards a nearly-mastered skill",due:"Sprig Dragon protects an important review",steady:"Sprig Dragon sees your knowledge growing",waiting:"Sprig Dragon is ready for the first quest"},
  "star-toadlet":{close:"Star Toadlet predicts a breakthrough",due:"Star Toadlet has not forgotten",steady:"Star Toadlet counts every bright step",waiting:"Star Toadlet waits for the first star"},
  "snow-owl":{close:"Moonveil Owl sees a breakthrough",due:"Moonveil Owl remembers the path",steady:"Moonveil Owl watches your progress",waiting:"Moonveil Owl waits for a new discovery"},
  "night-spider":{close:"Nocturne Spider senses a breakthrough",due:"Nocturne Spider leaves a silver thread",steady:"Nocturne Spider sees your steady work",waiting:"Nocturne Spider waits in the quiet"}
};

const PET_ART_VERSION="20260926-evolution2";
const PET_3D_ART_VERSION="20260928-3d1";
const PET_3D_SPECIES=new Set(["antler-bean","moss-hornling","inkling","moon-puff","mothling","bloom-snail","velvet-batling","sprig-dragon","star-toadlet"]);
function petArtUrl(species,level=1){
  const safe=pets.some(p=>p.id===species)?species:"moss-hornling";
  if(PET_3D_SPECIES.has(safe)) return `/pet/art-3d-v1/${safe}.png?v=${PET_3D_ART_VERSION}`;
  if(pets.find(p=>p.id===safe)?.secret) return `/pet/art-secret/${safe}.png?v=20260928-secret1`;
  if(Number(level)>=2) return `/pet/art-evolution-v2/${safe}.webp?v=${PET_ART_VERSION}`;
  return `/pet/art-master/${safe}.png?v=${PET_ART_VERSION}`;
}
function artPosition(level){return ["center","0% 0%","100% 0%","0% 100%","100% 100%"][Math.max(1,Math.min(5,Number(level)||1))-1]}
function secretPosition(level){return ["0% 0%","50% 0%","100% 0%","0% 100%","50% 100%"][Math.max(1,Math.min(5,Number(level)||1))-1]}
function spriteStyle(species,level=1){
  if(PET_3D_SPECIES.has(species)) return `background-image:url('${petArtUrl(species,level)}');background-size:300% 200%;background-position:${secretPosition(level)};background-repeat:no-repeat`;
  if(pets.find(p=>p.id===species)?.secret) return `background-image:url('${petArtUrl(species,level)}');background-size:300% 200%;background-position:${secretPosition(level)};background-repeat:no-repeat`;
  return `background-image:url('${petArtUrl(species,level)}');background-size:${level>1?"200% 200%":"contain"};background-position:${artPosition(level)}`;
}
function applyPetSprite(el,species,level=1){
  el.style.backgroundImage=`url("${petArtUrl(species,level)}")`;
  el.style.backgroundSize=PET_3D_SPECIES.has(species)||pets.find(p=>p.id===species)?.secret?"300% 200%":level>1?"200% 200%":"contain";
  el.style.backgroundPosition=PET_3D_SPECIES.has(species)||pets.find(p=>p.id===species)?.secret?secretPosition(level):artPosition(level);
  el.style.backgroundRepeat="no-repeat";
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
    const chosen=pets.find(p=>p.id===parsed?.species);
    const species=chosen&&(!chosen.secret||parsed?.unlockedSecrets?.[chosen.id])?chosen.id:"moss-hornling";
    const petLevels=parsed?.petLevels&&typeof parsed.petLevels==="object"?{...parsed.petLevels}:{};
    if(!petLevels[species]&&Number(parsed?.highestStage)>1) petLevels[species]=Math.max(1,Math.min(5,Number(parsed.highestStage)));
    for(const p of pets) petLevels[p.id]=Math.max(1,Math.min(5,Number(petLevels[p.id])||1));
    return {
      ...parsed,
      species,
      name:String(parsed?.name||"").trim(),
      masteryPoints:Math.max(0,Number(parsed?.masteryPoints)||0),
      petLevels
    };
  }catch{return {species:"moss-hornling",name:"",masteryPoints:0,petLevels:Object.fromEntries(pets.map(p=>[p.id,1]))}}
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
function hiddenUnlocked(pet,id,state){
  const leaves=masteryCount(state);
  const passes=retentionPasses(state);
  return Boolean(pet.unlockedSecrets?.[id]) || (id==="snow-owl"?leaves>=5:leaves>=10&&passes>=2);
}
function syncHiddenUnlocks(pet,state){
  const ids=["snow-owl","night-spider"];
  const newlyUnlocked=ids.filter(id=>!pet.unlockedSecrets?.[id]&&hiddenUnlocked(pet,id,state));
  if(!newlyUnlocked.length) return pet;
  const next={...pet,unlockedSecrets:{...pet.unlockedSecrets}};
  newlyUnlocked.forEach(id=>next.unlockedSecrets[id]=true);
  localStorage.setItem(PET_KEY,JSON.stringify(next));
  return next;
}
function petLevel(pet,species=pet.species){return Math.max(1,Math.min(5,Number(pet.petLevels?.[species])||1))}
function evolutionCost(stage){return stage>=5?0:evolutionCosts[stage-1]}
function stageProgress(points,stage){return stage>=5?100:Math.max(0,Math.min(100,Math.round((points/evolutionCost(stage))*100)))}
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
function growthMessage(state,species){
  const voice=petVoices[species]||petVoices["moss-hornling"];
  const due=dueMasteryCount(state);
  const close=closeToMastery(state);
  if(close && close.score>.62){
    const subject=subjectMeta[close.subject]?.label||"Study";
    return {
      title:voice.close,
      body:`A little more focused ${subject} practice could bring the next Mastery Leaf.`
    };
  }
  if(due>0){
    return {
      title:voice.due,
      body:`${due} mastered ${due===1?"item is":"items are"} ready for retention. Nothing is lost — they simply need refreshing.`
    };
  }
  const leaves=masteryCount(state);
  return leaves
    ? {title:voice.steady,body:`${leaves} Mastery ${leaves===1?"Leaf":"Leaves"} gathered through real learning evidence.`}
    : {title:voice.waiting,body:"The first Mastery Leaf appears when a topic reaches formal Mastery."};
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
  const pet=syncHiddenUnlocks(readPet(),state);
  const species=petById(pet.species);
  const leaves=masteryCount(state);
  const stage=petLevel(pet);
  const cost=evolutionCost(stage);
  const balance=pet.masteryPoints;
  const progress=stageProgress(balance,stage);
  const due=dueMasteryCount(state);
  const passes=retentionPasses(state);
  const msg=growthMessage(state,pet.species);
  const counts=subjectCounts(state);

  document.title=`${petDisplayName(pet)} · Companion Corner · Lux et Labor`;
  document.getElementById("petTitle").textContent=petDisplayName(pet);
  document.getElementById("petSubtitle").textContent=species.tag;
  const identity=character[pet.species];
  document.getElementById("petPersonality").innerHTML=`<strong>${identity.nature}</strong><span>${identity.habit}</span>`;
  document.getElementById("petFormGrid").innerHTML=identity.forms.map((form,i)=>`<div class="pet-form ${stage===i+1?"is-current":""}"><span class="pet-form-art pet-sprite" style="${spriteStyle(pet.species,i+1)}" role="img" aria-label="${species.name}, level ${i+1}: ${form}"></span><span class="pet-form-level">Level ${i+1}${stage===i+1?" · Current":""}</span><strong>${form}</strong></div>`).join("");
  const petImage=document.getElementById("petImage");
  applyPetSprite(petImage,pet.species,stage);
  petImage.setAttribute("aria-label",`${petDisplayName(pet)} · ${stageNames[stage-1]}`);
  document.getElementById("petAvatar").className=`pet-avatar stage-${stage}`;
  document.getElementById("petAura").className=`pet-aura stage-${stage}`;
  document.getElementById("stageLabel").textContent=`Stage ${stage} · ${stageNames[stage-1]}`;
  document.getElementById("stageNote").textContent=stageCopy[stage-1];
  document.getElementById("leafCount").textContent=leaves;
  document.getElementById("mpCount").textContent=balance;
  document.getElementById("retentionCount").textContent=passes;
  document.getElementById("glowStatus").textContent=glowLabel(state);
  document.getElementById("growthBar").style.width=`${progress}%`;
  document.getElementById("growthPct").textContent=stage>=5?"Prestige":`${progress}%`;
  document.getElementById("nextText").textContent=stage>=5
    ?"Prestige form reached. New MP stays in your shared wallet."
    :`${Math.max(0,cost-balance)} MP more needed for Level ${stage+1}.`;
  const evolveButton=document.getElementById("evolvePet");
  evolveButton.hidden=stage>=5;
  evolveButton.disabled=stage>=5||balance<cost;
  evolveButton.textContent=stage>=5?"Prestige reached":`Evolve ${petDisplayName(pet)} — ${cost} MP`;
  document.getElementById("evolveBalance").textContent=stage>=5
    ?`${balance} MP available for another companion.`
    :`Balance after evolution: ${Math.max(0,balance-cost)} MP`;
  document.getElementById("messageTitle").textContent=msg.title;
  document.getElementById("messageBody").textContent=msg.body;
  document.getElementById("petNameInput").value=pet.name||"";

  const steps=document.getElementById("stageSteps");
  steps.innerHTML=stageNames.map((name,i)=>{
    const n=i+1;
    const cls=n<stage?"done":n===stage?"current":"";
    return `<div class="pet-step ${cls}"><b>${n}</b><br>${name.replace(" Companion","").replace(" Familiar","")}${n>1?`<small>${evolutionCosts[n-2]} MP</small>`:""}</div>`;
  }).join("");

  const charms=document.getElementById("subjectCharms");
  const charmRows=Object.entries(counts).filter(([,n])=>n>0);
  charms.innerHTML=charmRows.length
    ?charmRows.map(([id,n])=>`<span class="pet-charm">${subjectMeta[id].icon} ${subjectMeta[id].label} · ${n}</span>`).join("")
    :'<span class="pet-charm">Master a topic to add the first subject mark.</span>';

  renderChooser(pet,state);

  document.getElementById("dueNote").textContent=due>0
    ?`${due} retention item${due===1?"":"s"} currently ready.`
    :"No mastered material is currently overdue.";
}
function renderChooser(pet,state){
  const grid=document.getElementById("petGrid");
  const leaves=masteryCount(state),passes=retentionPasses(state);
  grid.innerHTML=pets.map(p=>{
    const locked=p.secret&&!hiddenUnlocked(pet,p.id,state);
    const requirement=p.id==="snow-owl"
      ? `${Math.min(leaves,5)}/5 formal Mastery topics`
      : `${Math.min(leaves,10)}/10 formal Mastery topics · ${Math.min(passes,2)}/2 retention passes`;
    return `<button class="pet-choice ${p.secret?"pet-choice-secret":""} ${pet.species===p.id?"selected":""} ${locked?"is-locked":""}" type="button" data-pet="${p.id}" aria-label="${locked?`Secret companion locked: ${requirement}`:`Choose ${p.name}`}" ${locked?"disabled":""}>
      ${locked?'<span class="pet-secret-silhouette" aria-hidden="true">✦</span>':`<span class="pet-choice-art pet-sprite" style="${spriteStyle(p.id,petLevel(pet,p.id))}" aria-hidden="true"></span>`}
      <b>${locked?"Secret companion":p.name}</b><small>${locked?requirement:p.tag}</small>
      <span class="pet-choice-level">${locked?"Undiscovered":`Level ${petLevel(pet,p.id)}`}</span>
      <span class="selected-mark">Current companion</span>
    </button>`;
  }).join("");
}
function buildChooser(){
  const grid=document.getElementById("petGrid");
  grid.addEventListener("click",event=>{
    const btn=event.target.closest(".pet-choice");
    if(!btn||btn.disabled) return;
    const current=readPet();
    if(pets.find(p=>p.id===btn.dataset.pet)?.secret&&!hiddenUnlocked(current,btn.dataset.pet,readAppState())) return;
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
document.getElementById("evolvePet").addEventListener("click",()=>{
  const pet=readPet();
  const stage=petLevel(pet);
  const cost=evolutionCost(stage);
  if(stage>=5||pet.masteryPoints<cost) return;
  document.getElementById("confirmTitle").textContent=`Evolve ${petDisplayName(pet)}?`;
  document.getElementById("confirmCopy").textContent=`Level ${stage} → Level ${stage+1} costs ${cost} MP. Your balance will be ${pet.masteryPoints-cost} MP.`;
  document.getElementById("confirmEvolution").showModal();
});
document.getElementById("cancelEvolution").addEventListener("click",()=>document.getElementById("confirmEvolution").close());
document.getElementById("confirmEvolutionButton").addEventListener("click",()=>{
  const pet=readPet();
  const stage=petLevel(pet);
  const cost=evolutionCost(stage);
  if(stage>=5||pet.masteryPoints<cost){document.getElementById("confirmEvolution").close();render();return}
  savePet({...pet,masteryPoints:pet.masteryPoints-cost,petLevels:{...pet.petLevels,[pet.species]:stage+1}});
  document.getElementById("confirmEvolution").close();
  render();
});
window.addEventListener("storage",render);
window.addEventListener("focus",render);
window.addEventListener("scholar:pet-changed",render);
window.addEventListener("scholar:mp-changed",render);
buildChooser();
render();
