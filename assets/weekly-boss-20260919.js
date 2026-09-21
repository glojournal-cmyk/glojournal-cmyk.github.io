import{i as e,n as t,t as n}from"./jsx-runtime-Cltr0gcK.js";import{t as r}from"./link-bW0ClP5B.js";import{C as o}from"./index-BLVOhKhN.js?v=20260920-dailyfix1";import{t as a}from"./button-CgT0JZ5s.js";import{t as s}from"./card-t5JqoXqT.js";var W=e(t(),1),G=n();

const META={id:`weekly-boss`,name:`Weekly Boss Mission`,kicker:`8–12 minute adaptive mission`,blurb:`One locked mission each week, built from recent weak and due concepts. Clear it for a Boss-only collectible, prestige outfit or special scene.`,levels:1};
const LABELS={french:`French`,physics:`Physics`,chemistry:`Chemistry`,biology:`Biology`};
const REWARDS=[
{id:`boss-seal`,type:`collectible`,name:`Weekly Boss Seal`},
{id:`boss-gold-scholar`,type:`outfit`,name:`Boss Gold Scholar`},
{id:`boss-moon-garden`,type:`scene`,name:`Moonlit Boss Garden`},
{id:`boss-ledger`,type:`collectible`,name:`Boss Field Ledger`},
{id:`boss-navy-prestige`,type:`outfit`,name:`Boss Navy Prestige`},
{id:`boss-grand-library`,type:`scene`,name:`Boss Grand Library`},
{id:`boss-bloom`,type:`collectible`,name:`Boss Moon Bloom`},
{id:`boss-ivory-prize`,type:`outfit`,name:`Boss Ivory Prize`},
{id:`boss-observatory`,type:`scene`,name:`Boss Observatory`}
];

const FRENCH=[
{id:`fr-neg-compare`,subject:`french`,title:`The School Exchange`,skills:[`french:negatives`,`french:comparatives`,`french:agreement`],
 listening:{text:`Je n'ai pas de frère, mais ma sœur est plus sportive que moi.`,question:`What does the speaker say?`,options:[`She has no brother and her sister is more sporty than her.`,`She has two brothers and is more sporty than her sister.`,`She has no sister and her brother likes sport.`],answer:`She has no brother and her sister is more sporty than her.`,skill:`french:negatives:pas-de`},
 vocab:{question:`Choose the best meaning of “plus sportive que”.`,options:[`more sporty than`,`less sporty than`,`as sporty as`,`lots of sport`],answer:`more sporty than`,skill:`french:comparatives`},
 grammar:{question:`Repair the sentence: “Je n'ai pas un frère.”`,options:[`Je n'ai pas de frère.`,`Je ne pas ai frère.`,`Je n'ai de le frère.`,`Je pas un frère.`],answer:`Je n'ai pas de frère.`,skill:`french:negatives:pas-de`},
 build:{prompt:`Build: “My sisters are more intelligent than me.”`,tokens:[`Mes`,`sœurs`,`sont`,`plus`,`intelligentes`,`que`,`moi`],answer:`Mes sœurs sont plus intelligentes que moi`,skill:`french:comparatives:agreement`},
 writing:{prompt:`Write 2–3 French sentences comparing people in a family. Include one negative and one comparison.`,minWords:12,groups:[[`ne`,`n'`],[`pas`,`jamais`],[`plus`,`moins`,`aussi`],[`que`]],skill:`french:comparatives:writing`}},
{id:`fr-past-scene`,subject:`french`,title:`Yesterday at School`,skills:[`french:imperfect`,`french:perfect`,`french:time`],
 listening:{text:`Hier, il y avait beaucoup de monde et j'étais très fatiguée.`,question:`Which description matches the audio?`,options:[`There were lots of people and she was tired.`,`There will be lots of people and she is excited.`,`There was nobody and she was hungry.`],answer:`There were lots of people and she was tired.`,skill:`french:imperfect:il-y-avait`},
 vocab:{question:`What does “hier” mean?`,options:[`yesterday`,`today`,`tomorrow`,`often`],answer:`yesterday`,skill:`french:time`},
 grammar:{question:`Complete the background description: “Quand j'étais jeune, j'___ la musique.”`,options:[`aimais`,`aime`,`ai aimé`,`aimerai`],answer:`aimais`,skill:`french:imperfect`},
 build:{prompt:`Build: “Yesterday we watched a film.”`,tokens:[`Hier`,`nous`,`avons`,`regardé`,`un`,`film`],answer:`Hier nous avons regardé un film`,skill:`french:perfect:avoir`},
 writing:{prompt:`Write 2–3 French sentences about yesterday. Include one imperfect background detail and one completed action.`,minWords:14,groups:[[`était`,`étais`,`avait`,`avait`,`il y avait`],[`ai`,`avons`,`suis`,`sommes`]],skill:`french:past-tenses:writing`}},
{id:`fr-perfect-agree`,subject:`french`,title:`Weekend Report`,skills:[`french:perfect`,`french:agreement`,`french:opinions`],
 listening:{text:`Samedi, je suis allée au centre-ville et j'ai acheté un livre.`,question:`What happened on Saturday?`,options:[`She went into town and bought a book.`,`She stayed home and read a book.`,`She went to school and lost a book.`],answer:`She went into town and bought a book.`,skill:`french:perfect`},
 vocab:{question:`What does “acheté” mean here?`,options:[`bought`,`watched`,`visited`,`finished`],answer:`bought`,skill:`french:vocabulary:shopping`},
 grammar:{question:`Marie says: “Je suis ___ au cinéma.”`,options:[`allée`,`allé`,`aller`,`va`],answer:`allée`,skill:`french:perfect:etre-agreement`},
 build:{prompt:`Build: “We finished at four o'clock.”`,tokens:[`Nous`,`avons`,`fini`,`à`,`quatre`,`heures`],answer:`Nous avons fini à quatre heures`,skill:`french:perfect:avoir`},
 writing:{prompt:`Write 2–3 French sentences about a weekend. Include a perfect-tense action and an opinion with a reason.`,minWords:14,groups:[[`ai`,`avons`,`suis`,`sommes`],[`parce que`,`car`],[`j'aime`,`j'ai aimé`,`c'était`]],skill:`french:perfect:writing`}},
{id:`fr-school-routine`,subject:`french`,title:`School Day Briefing`,skills:[`french:present`,`french:time`,`french:opinions`],
 listening:{text:`Nous finissons les cours à quatre heures et je joue au badminton après l'école.`,question:`What is the routine?`,options:[`They finish at four and the speaker plays badminton afterwards.`,`They start at four and play football before school.`,`They finish at noon and go straight home.`],answer:`They finish at four and the speaker plays badminton afterwards.`,skill:`french:present:nous-ending`},
 vocab:{question:`What does “après l'école” mean?`,options:[`after school`,`before school`,`at lunchtime`,`during lessons`],answer:`after school`,skill:`french:time`},
 grammar:{question:`Choose the correct form: “Ils ___ à quatre heures.”`,options:[`finissent`,`finit`,`finis`,`finissons`],answer:`finissent`,skill:`french:present:ils-ending`},
 build:{prompt:`Build: “I like science because it is interesting.”`,tokens:[`J'aime`,`les`,`sciences`,`parce que`,`c'est`,`intéressant`],answer:`J'aime les sciences parce que c'est intéressant`,skill:`french:opinions:reason`},
 writing:{prompt:`Write 2–3 French sentences about your school day. Include a time and an opinion with a reason.`,minWords:13,groups:[[`heure`,`heures`],[`parce que`,`car`],[`j'aime`,`je n'aime`,`j'adore`,`je déteste`]],skill:`french:school:writing`}}
];

const SCIENCE=[
{id:`phys-speed`,subject:`physics`,title:`Track Test Investigation`,skills:[`physics:speed`,`physics:units:speed`,`physics:graphs`],
 scenario:{question:`A runner covers the same distance in less time. What happens to speed?`,options:[`Speed increases`,`Speed decreases`,`Speed is unchanged`,`Speed becomes zero`],answer:`Speed increases`,skill:`physics:speed:concept`},
 data:{title:`Time for a 100 m run`,unit:`s`,rows:[{label:`A`,value:25},{label:`B`,value:20},{label:`C`,value:16}],question:`Which runner has the greatest speed?`,options:[`Runner A`,`Runner B`,`Runner C`],answer:`Runner C`,skill:`physics:graphs:speed`},
 calc:{question:`Runner B travels 100 m in 20 s. Calculate speed. Give the unit.`,answer:`5 m/s`,numeric:5,units:[`m/s`,`m s-1`,`m s⁻¹`],skill:`physics:speed:calculation`},
 explain:{prompt:`Explain why Runner C is faster than Runner A using distance and time.`,minWords:8,groups:[[`same distance`,`100 m`,`distance`],[`less time`,`shorter time`,`16`],[`speed`,`faster`]],skill:`physics:speed:explanation`},
 verdict:{question:`Which formula is correct?`,options:[`speed = distance ÷ time`,`speed = distance × time`,`speed = time ÷ distance`],answer:`speed = distance ÷ time`,skill:`physics:speed:formula`}},
{id:`phys-forces`,subject:`physics`,title:`Trolley Force Lab`,skills:[`physics:forces`,`physics:resultant-force`,`physics:units:force`],
 scenario:{question:`A trolley has 12 N forward and 7 N backward. What is the resultant force?`,options:[`5 N forward`,`19 N forward`,`5 N backward`,`0 N`],answer:`5 N forward`,skill:`physics:forces:resultant`},
 data:{title:`Forward force on trolley`,unit:`N`,rows:[{label:`Trial 1`,value:4},{label:`Trial 2`,value:8},{label:`Trial 3`,value:12}],question:`Which trial has the largest applied force?`,options:[`Trial 1`,`Trial 2`,`Trial 3`],answer:`Trial 3`,skill:`physics:graphs:force`},
 calc:{question:`A 5 kg mass is in a field of 9.8 N/kg. Calculate its weight.`,answer:`49 N`,numeric:49,units:[`N`,`newton`,`newtons`],skill:`physics:weight:calculation`},
 explain:{prompt:`Explain what balanced forces tell you about acceleration and motion.`,minWords:9,groups:[[`zero resultant`,`balanced`],[`zero acceleration`,`no acceleration`],[`constant velocity`,`stationary`,`constant speed`]],skill:`physics:forces:balanced`},
 verdict:{question:`What is the SI unit of force?`,options:[`newton (N)`,`joule (J)`,`watt (W)`,`kilogram (kg)`],answer:`newton (N)`,skill:`physics:units:force`}},
{id:`phys-waves`,subject:`physics`,title:`Wave Signal Mission`,skills:[`physics:waves`,`physics:frequency`,`physics:wave-speed`],
 scenario:{question:`If frequency rises while wavelength stays the same, what happens to wave speed in v = fλ?`,options:[`It increases`,`It decreases`,`It stays zero`,`It must halve`],answer:`It increases`,skill:`physics:waves:relationship`},
 data:{title:`Frequency readings`,unit:`Hz`,rows:[{label:`Signal A`,value:5},{label:`Signal B`,value:10},{label:`Signal C`,value:20}],question:`Which signal has the highest frequency?`,options:[`Signal A`,`Signal B`,`Signal C`],answer:`Signal C`,skill:`physics:graphs:frequency`},
 calc:{question:`A wave has frequency 10 Hz and wavelength 2 m. Calculate wave speed.`,answer:`20 m/s`,numeric:20,units:[`m/s`,`m s-1`,`m s⁻¹`],skill:`physics:waves:calculation`},
 explain:{prompt:`Explain what frequency means for a wave.`,minWords:8,groups:[[`oscillation`,`wave`,`cycle`],[`second`,`per second`],[`hertz`,`hz`]],skill:`physics:frequency:explanation`},
 verdict:{question:`Which equation is correct?`,options:[`wave speed = frequency × wavelength`,`wave speed = frequency ÷ wavelength`,`wave speed = wavelength ÷ frequency`],answer:`wave speed = frequency × wavelength`,skill:`physics:waves:formula`}},

{id:`chem-equations`,subject:`chemistry`,title:`Reaction Ledger`,skills:[`chemistry:equations`,`chemistry:conservation`,`chemistry:formulae`],
 scenario:{question:`Why must a symbol equation be balanced?`,options:[`Atoms are conserved`,`Atoms disappear`,`Products must weigh less`,`Every coefficient must be 1`],answer:`Atoms are conserved`,skill:`chemistry:conservation-of-atoms`},
 data:{title:`Atom count before reaction`,unit:`atoms`,rows:[{label:`H`,value:4},{label:`O`,value:2},{label:`Mg`,value:0}],question:`How many hydrogen atoms must also appear after the reaction?`,options:[`4`,`2`,`6`],answer:`4`,skill:`chemistry:conservation-of-atoms`},
 calc:{question:`Balance hydrogen + oxygen → water. Type the balanced equation.`,answer:`2H2 + O2 -> 2H2O`,accepted:[`2h2+o2->2h2o`,`2h₂+o₂→2h₂o`,`2h2 + o2 -> 2h2o`],skill:`chemistry:equations:balancing`},
 explain:{prompt:`Explain why the balanced equation has the same atom count on both sides.`,minWords:9,groups:[[`atoms`],[`conserved`,`same number`],[`rearranged`,`not created`,`not destroyed`]],skill:`chemistry:conservation:explanation`},
 verdict:{question:`Which formula is magnesium chloride?`,options:[`MgCl₂`,`MgCl`,`Mg₂Cl`,`Mg₂Cl₃`],answer:`MgCl₂`,skill:`chemistry:formulae:ionic`}},
{id:`chem-acids`,subject:`chemistry`,title:`Acid Analysis Case`,skills:[`chemistry:acids`,`chemistry:pH`,`chemistry:word-equations`],
 scenario:{question:`A solution has pH 2. How should it be classified?`,options:[`Acidic`,`Neutral`,`Alkaline`],answer:`Acidic`,skill:`chemistry:acids:pH`},
 data:{title:`pH readings`,unit:`pH`,rows:[{label:`A`,value:2},{label:`B`,value:7},{label:`C`,value:11}],question:`Which sample is neutral?`,options:[`A`,`B`,`C`],answer:`B`,skill:`chemistry:acids:pH`},
 calc:{question:`Complete: acid + metal → salt + ____`,answer:`hydrogen`,accepted:[`hydrogen`,`hydrogen gas`,`h2`,`h₂`],skill:`chemistry:acids:metal`},
 explain:{prompt:`Explain what happens in a neutralisation reaction.`,minWords:8,groups:[[`acid`],[`alkali`,`base`],[`salt`],[`water`]],skill:`chemistry:neutralisation:explanation`},
 verdict:{question:`Acid + carbonate produces salt, water and…`,options:[`carbon dioxide`,`hydrogen`,`oxygen`,`chlorine`],answer:`carbon dioxide`,skill:`chemistry:acids:carbonate`}},
{id:`chem-ions`,subject:`chemistry`,title:`Ion Code Mission`,skills:[`chemistry:ions`,`chemistry:formulae`,`chemistry:valency`],
 scenario:{question:`Which ion does magnesium form?`,options:[`Mg²⁺`,`Mg⁺`,`Mg²⁻`,`Mg⁻`],answer:`Mg²⁺`,skill:`chemistry:ions:magnesium`},
 data:{title:`Ion charge magnitude`,unit:`charge`,rows:[{label:`Na⁺`,value:1},{label:`Mg²⁺`,value:2},{label:`Al³⁺`,value:3}],question:`Which ion has charge magnitude 3?`,options:[`Na⁺`,`Mg²⁺`,`Al³⁺`],answer:`Al³⁺`,skill:`chemistry:ions:charge`},
 calc:{question:`Write the formula formed from Mg²⁺ and Cl⁻.`,answer:`MgCl2`,accepted:[`mgcl2`,`mgcl₂`],skill:`chemistry:formulae:ionic`},
 explain:{prompt:`Explain why magnesium chloride needs two chloride ions for every magnesium ion.`,minWords:8,groups:[[`2+`,`+2`,`mg2+`,`mg²⁺`],[`1-`,`-1`,`cl-`,`cl⁻`],[`balance`,`neutral`,`zero charge`]],skill:`chemistry:valency:explanation`},
 verdict:{question:`Which formula is aluminium oxide?`,options:[`Al₂O₃`,`AlO`,`AlO₂`,`Al₃O₂`],answer:`Al₂O₃`,skill:`chemistry:formulae:valency`}},

{id:`bio-cells`,subject:`biology`,title:`Cell Lab Boss`,skills:[`biology:cells`,`biology:organelles`,`biology:magnification`],
 scenario:{question:`Which organelle is the main site of aerobic respiration?`,options:[`Mitochondrion`,`Nucleus`,`Cell wall`,`Vacuole`],answer:`Mitochondrion`,skill:`biology:cells:mitochondria`},
 data:{title:`Organelle counts in three cells`,unit:`count`,rows:[{label:`Cell A`,value:4},{label:`Cell B`,value:12},{label:`Cell C`,value:7}],question:`Which cell has the most mitochondria?`,options:[`Cell A`,`Cell B`,`Cell C`],answer:`Cell B`,skill:`biology:data:cells`},
 calc:{question:`An image is 40 mm long and the real cell is 0.04 mm. Calculate magnification.`,answer:`1000`,numeric:1000,units:[`x`,`×`,`times`,``],skill:`biology:magnification:calculation`},
 explain:{prompt:`Explain why muscle cells often contain many mitochondria.`,minWords:8,groups:[[`respiration`],[`energy`,`atp`],[`contraction`,`contract`,`muscle`]],skill:`biology:cells:adaptation`},
 verdict:{question:`Which structure controls activities of the cell?`,options:[`Nucleus`,`Cell membrane`,`Ribosome`,`Cytoplasm`],answer:`Nucleus`,skill:`biology:cells:nucleus`}},
{id:`bio-enzymes`,subject:`biology`,title:`Enzyme Investigation`,skills:[`biology:enzymes`,`biology:variables`,`biology:data`],
 scenario:{question:`What usually happens to enzyme activity as temperature rises towards its optimum?`,options:[`It increases`,`It immediately stops`,`It always decreases`,`It becomes unrelated to temperature`],answer:`It increases`,skill:`biology:enzymes:temperature`},
 data:{title:`Reaction rate`,unit:`relative rate`,rows:[{label:`20°C`,value:3},{label:`35°C`,value:8},{label:`60°C`,value:1}],question:`Which temperature gives the highest rate in these data?`,options:[`20°C`,`35°C`,`60°C`],answer:`35°C`,skill:`biology:data:enzymes`},
 calc:{question:`A reaction makes 24 cm³ of product in 6 minutes. Calculate mean rate in cm³/min.`,answer:`4 cm3/min`,numeric:4,units:[`cm3/min`,`cm³/min`,`cm3 per min`,`cm³ per min`],skill:`biology:rate:calculation`},
 explain:{prompt:`Explain why a very high temperature can reduce enzyme activity.`,minWords:9,groups:[[`denature`,`denatured`],[`active site`],[`shape`,`substrate`]],skill:`biology:enzymes:denaturation`},
 verdict:{question:`In a fair test of temperature, which variable should be deliberately changed?`,options:[`Temperature`,`Enzyme concentration`,`Substrate volume`,`Time measurement method`],answer:`Temperature`,skill:`biology:variables:independent`}},
{id:`bio-photosynthesis`,subject:`biology`,title:`Plant Productivity Mission`,skills:[`biology:photosynthesis`,`biology:limiting-factors`,`biology:data`],
 scenario:{question:`Which gas is a reactant in photosynthesis?`,options:[`Carbon dioxide`,`Oxygen`,`Nitrogen`,`Hydrogen`],answer:`Carbon dioxide`,skill:`biology:photosynthesis:reactants`},
 data:{title:`Bubbles per minute at different light levels`,unit:`bubbles/min`,rows:[{label:`Low`,value:4},{label:`Medium`,value:9},{label:`High`,value:10}],question:`Where does the rate begin to level off?`,options:[`Between low and medium`,`Between medium and high`,`It never levels off`],answer:`Between medium and high`,skill:`biology:data:limiting-factor`},
 calc:{question:`A plant produces 45 bubbles in 5 minutes. Calculate bubbles per minute.`,answer:`9 bubbles/min`,numeric:9,units:[`bubbles/min`,`bubbles per minute`],skill:`biology:rate:calculation`},
 explain:{prompt:`Explain why increasing light may eventually stop increasing the photosynthesis rate.`,minWords:9,groups:[[`limiting`,`limit`],[`carbon dioxide`,`co2`,`temperature`],[`another factor`,`other factor`]],skill:`biology:photosynthesis:limiting-factors`},
 verdict:{question:`Which organelle contains chlorophyll?`,options:[`Chloroplast`,`Mitochondrion`,`Nucleus`,`Ribosome`],answer:`Chloroplast`,skill:`biology:cells:chloroplast`}}
];

const MISSIONS=[...FRENCH,...SCIENCE];

function weekKey(){let d=new Date(),off=(d.getDay()+6)%7;d.setHours(12,0,0,0);d.setDate(d.getDate()-off);return d.toISOString().slice(0,10)}
function norm(v){return String(v??``).normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).toLowerCase().replace(/[’]/g,`'`).replace(/\s+/g,` `).trim()}
function weekHash(v){return [...String(v)].reduce((sum,ch)=>((sum*31)+ch.charCodeAt(0))>>>0,17)}
function statAccuracy(raw){let a=Number(raw?.attempted??raw?.attempts??0),c=Number(raw?.correct??0);return Number.isFinite(raw?.accuracy)?Number(raw.accuracy):a?c/a:1}
function weakRows(state,subject){
 const today=new Date().toISOString().slice(0,10),recent=new Map();
 for(const ev of (state.learningEvents||[]).slice(0,40))if(ev?.subject===subject&&ev?.skillId)recent.set(ev.skillId,(recent.get(ev.skillId)||0)+1);
 const rows=[];
 for(const [skill,raw] of Object.entries(state.skillStats||{})){
  if(!skill.startsWith(subject+`:`))continue;
  const attempted=Number(raw?.attempted??0),accuracy=statAccuracy(raw),due=!!raw?.retentionDue&&String(raw.retentionDue)<=today,failed=!!raw?.retentionFailed,weak=!!raw?.needsPractice||(attempted>=2&&accuracy<.8)||failed;
  if(!weak&&!due)continue;
  let score=(failed?35:0)+(due?28:0)+(weak?18:0)+Math.round((1-Math.max(0,Math.min(1,accuracy)))*22)+Math.min(8,attempted)+(recent.get(skill)||0)*3;
  rows.push({skill,score,accuracy,due,source:`formal`});
 }
 for(const [gameId,mem] of Object.entries(state.gamePractice||{}))for(const [skill,raw] of Object.entries(mem?.concepts||{})){
  if(!skill.startsWith(subject+`:`))continue;
  const unresolved=Math.max(0,(raw?.errors||0)-(raw?.repairCorrect||0)-(raw?.recoveryCorrect||0)),attempts=raw?.attempts||0,accuracy=attempts?(raw?.correct||0)/attempts:1;
  if(!unresolved&&!(attempts>=2&&accuracy<.7))continue;
  rows.push({skill,score:20+unresolved*10+Math.round((1-accuracy)*15),accuracy,due:false,source:`game`,gameId});
 }
 const by=new Map();
 for(const row of rows){let old=by.get(row.skill);if(!old||row.score>old.score)by.set(row.skill,row)}
 return [...by.values()].sort((a,b)=>b.score-a.score||a.accuracy-b.accuracy);
}
function subjectProfile(state){
 const subjects=[`french`,`biology`,`chemistry`,`physics`],profiles=subjects.map(subject=>{let rows=weakRows(state,subject);return{subject,rows,score:rows.slice(0,6).reduce((s,x)=>s+x.score,0)}}).sort((a,b)=>b.score-a.score);
 if(profiles[0]?.score>0)return profiles[0];
 let fallback=subjects.map(subject=>{let rows=Object.entries(state.skillStats||{}).filter(([k])=>k.startsWith(subject+`:`)).map(([skill,raw])=>({skill,score:Math.round((1-statAccuracy(raw))*10)+(raw?.attempted?1:4),accuracy:statAccuracy(raw)})).sort((a,b)=>b.score-a.score);return{subject,rows,score:rows.slice(0,4).reduce((s,x)=>s+x.score,0)}}).sort((a,b)=>b.score-a.score);
 return fallback[0]?.rows?.length?fallback[0]:{subject:`french`,rows:[{skill:`french:retrieval`,score:1,accuracy:0}],score:1};
}
function missionScore(m,weak){
 let text=m.skills.join(` `).toLowerCase(),score=0;
 for(const row of weak.slice(0,8)){let parts=row.skill.toLowerCase().split(`:`).slice(1).filter(x=>x.length>2);score+=parts.reduce((s,p)=>s+(text.includes(p)?row.score:0),0)}
 return score;
}
function chooseMission(state,week){
 const profile=subjectProfile(state),pool=MISSIONS.filter(m=>m.subject===profile.subject),ranked=pool.map(m=>({m,score:missionScore(m,profile.rows)})).sort((a,b)=>b.score-a.score),top=ranked.slice(0,Math.min(3,ranked.length)),choice=top[weekHash(week)%Math.max(1,top.length)]?.m||pool[0]||MISSIONS[0];
 return{mission:choice,subject:profile.subject,weakSkills:profile.rows.slice(0,6).map(x=>x.skill)};
}
function rewardName(id){return REWARDS.find(x=>x.id===id)?.name||id}
function nextReward(state){let owned=new Set([...(state.collectibles||[]),...(state.unlockedOutfits||[]),...(state.unlockedScenes||[])]);return REWARDS.find(x=>!owned.has(x.id))||null}
function speakFrench(text){if(typeof window===`undefined`||!window.speechSynthesis)return;window.speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.lang=`fr-FR`;u.rate=.88;window.speechSynthesis.speak(u)}
function groupsPass(text,groups){let n=norm(text);return groups.every(group=>group.some(k=>n.includes(norm(k))))}
function textPass(text,minWords,groups){let words=String(text||``).trim().split(/\s+/).filter(Boolean).length;return words>=minWords&&groupsPass(text,groups)}
function calcPass(value,task){let n=norm(value).replace(/,/g,`.`);if(task.accepted?.some(x=>norm(x).replace(/\s/g,``)===n.replace(/\s/g,``)))return true;if(task.numeric!=null){let num=parseFloat(n.replace(/[^0-9.\-]/g,``));if(!Number.isFinite(num)||Math.abs(num-task.numeric)>1e-6)return false;let unitOk=(task.units||[]).some(u=>u===``||n.includes(norm(u)));return unitOk}return n.replace(/\s/g,``)===norm(task.answer).replace(/\s/g,``)}
function chart(data){let max=Math.max(...data.rows.map(x=>x.value),1);return(0,G.jsxs)(`div`,{className:`mt-4 rounded-xl border border-line bg-sage/25 p-4`,children:[(0,G.jsxs)(`div`,{className:`flex justify-between text-xs font-semibold text-navy`,children:[(0,G.jsx)(`span`,{children:data.title}),(0,G.jsx)(`span`,{children:data.unit})]}),(0,G.jsx)(`div`,{className:`mt-3 space-y-2`,children:data.rows.map(row=>(0,G.jsxs)(`div`,{className:`grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2 text-xs`,children:[(0,G.jsx)(`span`,{children:row.label}),(0,G.jsx)(`div`,{className:`h-3 overflow-hidden rounded-full bg-sage-2`,children:(0,G.jsx)(`div`,{className:`h-full bg-leaf`,style:{width:`${Math.max(8,row.value/max*100)}%`}})}),(0,G.jsx)(`span`,{className:`text-right tabular-nums`,children:row.value})]},row.label))})]})}
function optionGrid(options,onPick){return(0,G.jsx)(`div`,{className:`mt-4 grid gap-2 sm:grid-cols-2`,children:options.map(v=>(0,G.jsx)(a,{variant:`outline`,className:`h-auto min-h-12 justify-start whitespace-normal text-left`,onClick:()=>onPick(v),children:v},v))})}

function WeeklyBoss(){
 const boss=o(x=>x.weeklyBoss),start=o(x=>x.startWeeklyBoss),complete=o(x=>x.completeWeeklyBoss),practice=o(x=>x.recordGamePractice),skillStats=o(x=>x.skillStats),learningEvents=o(x=>x.learningEvents),gamePractice=o(x=>x.gamePractice),collectibles=o(x=>x.collectibles),unlockedOutfits=o(x=>x.unlockedOutfits),unlockedScenes=o(x=>x.unlockedScenes);
 const week=weekKey(),stateView={skillStats,learningEvents,gamePractice,collectibles,unlockedOutfits,unlockedScenes},planned=(0,W.useMemo)(()=>chooseMission(stateView,week),[week]),saved=boss?.weeks?.[week],mission=(saved?.missionId?MISSIONS.find(m=>m.id===saved.missionId):null)||planned.mission,subject=saved?.subject||planned.subject,weakSkills=saved?.weakSkills?.length?saved.weakSkills:planned.weakSkills;
 (0,W.useEffect)(()=>{if(!saved&&mission)start(week,mission.id,subject,weakSkills)},[week,saved?.missionId,mission?.id]);
 const [phase,setPhase]=(0,W.useState)(0),[score,setScore]=(0,W.useState)(0),[results,setResults]=(0,W.useState)([]),[feedback,setFeedback]=(0,W.useState)(null),[listens,setListens]=(0,W.useState)(0),[build,setBuild]=(0,W.useState)([]),[text,setText]=(0,W.useState)(``),[finished,setFinished]=(0,W.useState)(null);
 const french=subject===`french`,phases=french?[`Listen`,`Vocabulary`,`Grammar`,`Sentence build`,`Short writing`]:[`Scenario`,`Data / graph`,`Calculation`,`Explanation`,`Verdict`],nextPrize=nextReward(stateView);
 function log(skill,ok,label){practice?.(`weekly-boss`,skill,ok,{label:label||skill.replace(/:/g,` · `),itemKey:`${week}:${mission.id}:${phase}`})}
 function advance(ok,skill,label){let nextScore=score+(ok?20:0),nextResults=[...results,{phase,ok,skill}];setScore(nextScore);setResults(nextResults);setFeedback(ok?`Phase secured.`:`Phase missed. The Boss will remember this weakness for future game practice.`);setText(``);setBuild([]);setTimeout(()=>{if(phase>=4){let pct=Math.round(nextScore),passed=pct>=80,res=complete(week,{missionId:mission.id,subject,score:pct,passed,weakSkills});setFinished({score:pct,passed,reward:res?.reward||null,firstClear:res?.firstClear||false});setFeedback(null)}else{setPhase(v=>v+1);setFeedback(null)}},350)}
 function pick(task,value){let ok=value===task.answer;log(task.skill,ok,phases[phase]);advance(ok,task.skill,phases[phase])}
 function submitBuild(){let task=mission.build,value=build.join(` `),ok=norm(value)===norm(task.answer);log(task.skill,ok,`Sentence build`);advance(ok,task.skill,`Sentence build`)}
 function submitText(task,label){let ok=textPass(text,task.minWords,task.groups);log(task.skill,ok,label);advance(ok,task.skill,label)}
 function submitCalc(task){let ok=calcPass(text,task);log(task.skill,ok,`Calculation`);advance(ok,task.skill,`Calculation`)}
 function reset(){setPhase(0);setScore(0);setResults([]);setFeedback(null);setListens(0);setBuild([]);setText(``);setFinished(null)}
 if(!mission)return null;
 if(finished)return(0,G.jsxs)(s,{className:`mx-auto max-w-2xl p-6`,children:[(0,G.jsx)(`p`,{className:`text-xs font-semibold tracking-[0.18em] text-bronze uppercase`,children:`Weekly Boss complete`}),(0,G.jsx)(`h1`,{className:`mt-1 font-display text-3xl font-semibold`,children:mission.title}),(0,G.jsx)(`p`,{className:`mt-2 text-muted`,children:finished.passed?`${finished.score}% · Boss cleared. Formal mastery is unchanged.`:`${finished.score}% · Clear requires 80%. The same locked mission can be retried this week.`}),(0,G.jsx)(`div`,{className:`mt-5 grid grid-cols-5 gap-2`,children:results.map((x,i)=>(0,G.jsxs)(`div`,{className:`rounded-lg border border-line p-2 text-center text-xs ${x.ok?`bg-sage/50`:`bg-card`}`,children:[(0,G.jsx)(`p`,{className:`font-semibold`,children:i+1}),(0,G.jsx)(`p`,{children:x.ok?`Clear`:`Miss`})]},i))}),finished.passed?(0,G.jsxs)(`div`,{className:`mt-5 rounded-xl border border-bronze/30 bg-sage/35 p-4`,children:[(0,G.jsx)(`p`,{className:`text-xs font-semibold tracking-[0.15em] text-bronze uppercase`,children:finished.firstClear?`Boss-only reward unlocked`:`Weekly reward already claimed`}),(0,G.jsx)(`p`,{className:`mt-1 font-display text-xl font-semibold`,children:finished.reward?.name||rewardName(boss?.weeks?.[week]?.reward)||`Mission clear recorded`}),(0,G.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Reward is separate from academic mastery and cannot be farmed by replaying the same week.`})]}):null,(0,G.jsxs)(`div`,{className:`mt-5 flex flex-wrap gap-2`,children:[(0,G.jsx)(a,{onClick:reset,children:finished.passed?`Replay for practice`:`Retry this Boss`}),(0,G.jsx)(a,{asChild:true,variant:`secondary`,children:(0,G.jsx)(r,{to:`/play`,children:`Back to Play`})})]})]});
 let task=french?[mission.listening,mission.vocab,mission.grammar,mission.build,mission.writing][phase]:[mission.scenario,mission.data,mission.calc,mission.explain,mission.verdict][phase];
 return(0,G.jsxs)(`div`,{className:`mx-auto max-w-2xl space-y-4`,children:[(0,G.jsxs)(`div`,{className:`flex flex-wrap items-end justify-between gap-3`,children:[(0,G.jsxs)(`div`,{children:[(0,G.jsx)(`p`,{className:`text-xs font-semibold tracking-[0.18em] text-bronze uppercase`,children:`Weekly Boss · 8–12 minutes`}),(0,G.jsx)(`h1`,{className:`font-display text-3xl font-semibold`,children:mission.title}),(0,G.jsxs)(`p`,{className:`mt-1 text-sm text-muted`,children:[LABELS[subject],` · week of `,week,` · reward once per week`]})]}),(0,G.jsxs)(`div`,{className:`text-right text-sm text-muted`,children:[(0,G.jsx)(`p`,{className:`font-semibold text-navy`,children:saved?.passed?`Cleared this week`:`Boss active`}),(0,G.jsxs)(`p`,{children:[score,` / 100`]})]})]}),(0,G.jsxs)(s,{className:`p-4`,children:[(0,G.jsx)(`p`,{className:`text-[11px] font-semibold tracking-[0.15em] text-navy uppercase`,children:`Weakness lock`}),(0,G.jsx)(`p`,{className:`mt-1 text-sm`,children:weakSkills.length?weakSkills.slice(0,4).map(x=>x.replace(/^[^:]+:/,``).replace(/:/g,` · `)).join(` · `):`Least-secure available concepts`}),(0,G.jsx)(`p`,{className:`mt-1 text-xs text-muted`,children:`This mission is locked for the week. Boss attempts update game-practice memory only; they never raise formal mastery.`}),nextPrize?(0,G.jsxs)(`p`,{className:`mt-2 text-xs font-medium text-bronze`,children:[`Next Boss reward: `,nextPrize.name]}):null]}),(0,G.jsx)(`div`,{className:`grid grid-cols-5 gap-1.5`,children:phases.map((name,i)=>(0,G.jsxs)(`div`,{className:`rounded-lg border px-2 py-2 text-center text-[10px] ${i===phase?`border-bronze bg-sage/50 text-navy`:i<phase?`border-line bg-sage/30`:`border-line bg-card text-muted`}`,children:[(0,G.jsx)(`div`,{className:`font-semibold`,children:i+1}),(0,G.jsx)(`div`,{className:`mt-0.5 leading-tight`,children:name})]},name))}),(0,G.jsxs)(s,{className:`p-5 sm:p-6`,children:[(0,G.jsxs)(`div`,{className:`flex items-center justify-between gap-3`,children:[(0,G.jsx)(`p`,{className:`text-xs font-semibold tracking-[0.16em] text-bronze uppercase`,children:phases[phase]}),(0,G.jsxs)(`p`,{className:`text-xs text-muted`,children:[`Phase `,phase+1,` / 5`]})]}),feedback?(0,G.jsx)(`div`,{className:`mt-4 rounded-lg border border-line bg-sage/35 p-3 text-sm`,children:feedback}):null,
 french&&phase===0?(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`p`,{className:`mt-5 text-sm text-muted`,children:`Listen without reading a transcript. You may play the sentence twice.`}),(0,G.jsxs)(a,{className:`mt-3`,disabled:listens>=2,onClick:()=>{speakFrench(task.text);setListens(v=>v+1)},children:[listens>=2?`Audio limit reached`:`Play French audio`,` · `,Math.max(0,2-listens),` left`]}),(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.question}),optionGrid(task.options,v=>pick(task,v))]}):
 french&&phase===1?(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.question}),optionGrid(task.options,v=>pick(task,v))]}):
 french&&phase===2?(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.question}),optionGrid(task.options,v=>pick(task,v))]}):
 french&&phase===3?(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.prompt}),(0,G.jsx)(`div`,{className:`mt-3 min-h-14 rounded-xl border border-line bg-sage/25 p-3 text-sm`,children:build.length?build.map(x=>x.word).join(` `):`Tap words in order…`}),(0,G.jsx)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:task.tokens.filter((_,ix)=>!build.some((x,j)=>x.__ix===ix&&j>=0)).map((word,ix)=>(0,G.jsx)(a,{variant:`outline`,onClick:()=>{let actual=task.tokens.findIndex((w,j)=>w===word&&!build.some(x=>x.__ix===j));setBuild(v=>[...v,{word,__ix:actual}])},children:word},word+`-`+ix))}),(0,G.jsxs)(`div`,{className:`mt-3 flex gap-2`,children:[(0,G.jsx)(a,{variant:`secondary`,onClick:()=>setBuild([]),children:`Reset`}),(0,G.jsx)(a,{disabled:build.length!==task.tokens.length,onClick:()=>{let value=build.map(x=>x.word).join(` `),ok=norm(value)===norm(task.answer);log(task.skill,ok,`Sentence build`);advance(ok,task.skill,`Sentence build`)},children:`Check sentence`})]})]}):
 french?(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.prompt}),(0,G.jsx)(`textarea`,{value:text,onChange:e=>setText(e.target.value),rows:5,className:`mt-3 w-full rounded-xl border border-line bg-card p-3 text-sm outline-none focus:border-bronze`,placeholder:`Write 2–3 French sentences…`}),(0,G.jsx)(a,{className:`mt-3`,onClick:()=>submitText(task,`Short writing`),disabled:String(text).trim().split(/\s+/).filter(Boolean).length<task.minWords,children:`Submit writing`})]}):
 phase===0?(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.question}),optionGrid(task.options,v=>pick(task,v))]}):
 phase===1?(0,G.jsxs)(G.Fragment,{children:[chart(task),(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.question}),optionGrid(task.options,v=>pick(task,v))]}):
 phase===2?(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.question}),(0,G.jsx)(`input`,{value:text,onChange:e=>setText(e.target.value),className:`mt-3 w-full rounded-xl border border-line bg-card px-3 py-3 text-sm outline-none focus:border-bronze`,placeholder:`Answer with unit where required`}),(0,G.jsx)(a,{className:`mt-3`,onClick:()=>submitCalc(task),disabled:!text.trim(),children:`Check calculation`})]}):
 phase===3?(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.prompt}),(0,G.jsx)(`textarea`,{value:text,onChange:e=>setText(e.target.value),rows:5,className:`mt-3 w-full rounded-xl border border-line bg-card p-3 text-sm outline-none focus:border-bronze`,placeholder:`Explain using scientific vocabulary…`}),(0,G.jsx)(a,{className:`mt-3`,onClick:()=>submitText(task,`Explanation`),disabled:String(text).trim().split(/\s+/).filter(Boolean).length<task.minWords,children:`Submit explanation`})]}):
 (0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(`p`,{className:`mt-5 font-medium`,children:task.question}),optionGrid(task.options,v=>pick(task,v))]})
 ]})]})
}

export{META as n,WeeklyBoss as t};
