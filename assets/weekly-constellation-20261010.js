/* Phase 3 — Weekly Constellation. Cosmetic progress record only.
 * No changes to academic scores, daily credit, pets, XP or unlocks. */
(function(root){
"use strict";
const KEY="lux-weekly-constellation-v1";
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const COLLECTION_KEY="lux-weekly-lantern-collection-v1";
const SEEN_KEY="lux-weekly-lantern-seen-v1";
function earnedWeeks(){try{const value=JSON.parse(localStorage.getItem(COLLECTION_KEY)||"[]");return Array.isArray(value)?value.filter(x=>/^\\d{4}-\\d{2}-\\d{2}$/.test(x)):[]}catch{return []}}
function award(monday){const set=new Set(earnedWeeks());set.add(monday);try{localStorage.setItem(COLLECTION_KEY,JSON.stringify([...set].sort()))}catch{}return set.size}

const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
function weekStart(day){
 const d=new Date(day+"T12:00:00Z");if(!Number.isFinite(d.getTime()))return null;
 const dow=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-dow);
 return d.toISOString().slice(0,10);
}
function dayAt(monday,offset){const d=new Date(monday+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
function read(){
 try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");
  return x&&typeof x==="object"&&!Array.isArray(x)?x:{};}catch{return {}}
}
function record(state,J,at=Date.now()){
 const day=J?.day?.(at),tasks=Array.isArray(state?.daily)?state.daily:[];
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day||"")||state?.today!==day||tasks.length!==10)return null;
 const done=tasks.filter(t=>Number(t?.target)>0&&Number(t?.progress)>=Number(t.target)).length;
 const monday=weekStart(day);if(!monday)return null;
 const data=read(),old=data[day];
 // Preserve the highest verified count for today, including on reload.
 const highest=Math.max(0,Math.min(10,done,10),Number(old)||0);
 if(highest!==old){data[day]=highest;
  const min=dayAt(monday,-49);
  for(const key of Object.keys(data))if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||key<min||key>day)delete data[key];
  try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}
 }
 return {day,monday,rows:Array.from({length:7},(_,i)=>({day:dayAt(monday,i),done:Math.max(0,Math.min(10,Number(data[dayAt(monday,i)])||0))}))};
}
root.LuxWeeklyConstellation={weekStart,record};
if(typeof document==="undefined"||location.pathname!=="/")return;
const style=make("style");
style.textContent=`
#lux-weekly-constellation{margin:16px 0;padding:18px;border:1px solid #d9d3bd;border-radius:18px;background:linear-gradient(135deg,#fffaf2,#f1f5f0);color:#17324d}
#lux-weekly-constellation .weekly-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
#lux-weekly-constellation h3{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.55rem;font-weight:700;line-height:1.2;margin:0}
#lux-weekly-constellation .weekly-sub{font-size:.88rem;opacity:.8;margin:5px 0 13px}
#lux-weekly-constellation .weekly-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
#lux-weekly-constellation .weekly-star{text-align:center;min-width:0;padding:9px 2px;border-radius:12px;border:1px solid #e0e0d6;background:#ffffffa8}
#lux-weekly-constellation .weekly-star.today{outline:2px solid #80977d;outline-offset:1px}
#lux-weekly-constellation .weekly-star .symbol{display:block;font-size:clamp(20px,3.4vw,33px);line-height:1.2;color:#9eabb2}
#lux-weekly-constellation .weekly-star.lit .symbol{color:#bb913d;text-shadow:0 0 9px #e8bd68aa}
#lux-weekly-constellation .weekly-star strong{display:block;font-size:.73rem}
#lux-weekly-constellation .weekly-star small{display:block;font-size:.68rem}
#lux-weekly-constellation .weekly-finish{margin:12px 0 0;padding:10px;border-radius:10px;background:#e7f0e3;font-weight:600}
#lux-weekly-constellation .weekly-award{margin-top:14px;border:1px solid #d2b56c;border-radius:16px;padding:13px;background:linear-gradient(120deg,#fff4d8,#f3f1e9);display:flex;align-items:center;gap:14px}
#lux-weekly-constellation .weekly-award-icon{font-size:38px;flex:none;color:#a97c26}
#lux-weekly-constellation .weekly-award strong{display:block}
#lux-weekly-constellation .weekly-award small{display:block;color:#5c6261}
#lux-weekly-constellation .weekly-celebrate{position:relative;overflow:hidden;padding:14px;margin-top:12px;border-radius:16px;background:linear-gradient(130deg,#192c43,#35544c);color:#fff9ee;text-align:center}
#lux-weekly-constellation .weekly-companions{display:flex;align-items:center;justify-content:center;gap:18px;font-size:34px;margin:5px 0}
#lux-weekly-constellation .weekly-companions img{width:75px;height:90px;object-fit:contain;filter:drop-shadow(0 4px 8px #0005)}
#lux-weekly-constellation .weekly-celebrate button{margin-top:10px;background:#e8d3a0;color:#193247;border:0;border-radius:30px;padding:8px 16px;font-weight:700;cursor:pointer}
#lux-weekly-constellation .weekly-celebrate button:focus-visible{outline:3px solid white;outline-offset:3px}
@media(prefers-reduced-motion:no-preference){#lux-weekly-constellation .weekly-celebrate.is-new .weekly-companions{animation:lantern-pop .7s ease-out both}#lux-weekly-constellation .weekly-celebrate.is-new:before{content:"✦  ✧  ✦  ✧  ✦";display:block;font-size:24px;color:#f3d389;animation:lantern-pop .8s ease-out both}@keyframes lantern-pop{from{opacity:0;transform:translateY(16px) scale(.8)}to{opacity:1;transform:none}}}
#lux-weekly-constellation .weekly-note{font-size:.73rem;opacity:.75;margin-top:12px}
@media(max-width:440px){#lux-weekly-constellation{padding:12px}#lux-weekly-constellation .weekly-days{gap:3px}#lux-weekly-constellation .weekly-star{padding:7px 1px}#lux-weekly-constellation .weekly-star small{font-size:.57rem}}
@media(prefers-reduced-motion:no-preference){#lux-weekly-constellation .weekly-star.lit .symbol{animation:weekly-glow 2.8s ease-in-out infinite alternate}@keyframes weekly-glow{to{text-shadow:0 0 16px #d3a44a}}}
`;
document.head.append(style);
let queued=false;
function paint(){
 queued=false;
 if(!root.__luxAppReady||!root.LuxJourney)return;
 let state;try{state=root.LuxJourney.garden()}catch{return}
 const heading=[...document.querySelectorAll("main h2")].find(h=>h.textContent.trim()==="Raise her today");
 const card=heading?.parentElement?.parentElement?.parentElement;
 if(!card)return;
 let panel=document.getElementById("lux-weekly-constellation");
 if(!panel){panel=make("section");panel.id="lux-weekly-constellation";panel.setAttribute("aria-label","Weekly constellation challenge");card.append(panel)}
 const data=record(state,root.LuxJourney);
 if(!data){if(panel.dataset.weekSignature!=="pending"){panel.replaceChildren(make("p",null,"Weekly constellation will appear once today's tasks have synced."));panel.dataset.weekSignature="pending"}return}
 const signature=JSON.stringify([data.day,data.rows]);
 if(panel.dataset.weekSignature===signature)return;
 panel.replaceChildren();
 const lit=data.rows.filter(r=>r.done>0).length;
 const header=make("div","weekly-head");
 header.append(make("h3",null,"The Seven Lanterns"),make("strong",null,lit+" / 7 stars"));
 panel.append(header,make("p","weekly-sub","A new lantern lights whenever you complete at least one daily quest."));
 const grid=make("div","weekly-days");
 grid.setAttribute("role","group");grid.setAttribute("aria-label","Seven days of this week's completed daily quests");
 data.rows.forEach((r,i)=>{
  const today=r.day===data.day,past=r.day<data.day;
  const tile=make("div","weekly-star"+(r.done>0?" lit":"")+(today?" today":""));
  tile.setAttribute("aria-label",DAYS[i]+": "+(r.done?r.done+" of 10 daily quests completed":past?"no completion recorded":today?"no completed quests yet":"upcoming"));
  tile.append(make("span","symbol",r.done?"✦":"✧"),make("strong",null,DAYS[i]),make("small",null,r.done?r.done+"/10":past?"—":today?"0/10":"·"));
  grid.append(tile);
 });
 panel.append(grid);
 if(lit===7){
  const total=award(data.monday);
  panel.append(make("p","weekly-finish","✦ Constellation restored! Seven lanterns are shining."));
  const awardCard=make("div","weekly-award");
  awardCard.append(make("span","weekly-award-icon","✺"));
  const description=make("div");
  description.append(make("strong",null,"Seven Lanterns · Celestial Keepsake"),make("small",null,"Collected for week of "+data.monday+" · "+total+" weekly keepsake"+(total===1?"":"s")+" in this browser"));
  awardCard.append(description);panel.append(awardCard);
  let seen=false;try{seen=localStorage.getItem(SEEN_KEY)===data.monday}catch{}
  const scene=make("section","weekly-celebrate"+(!seen?" is-new":""));
  scene.setAttribute("aria-label","Scholar and companion celebration");
  scene.append(make("strong",null,"The garden is glowing!"));
  const companions=make("div","weekly-companions");
  const scholar=make("img");scholar.src="/art/doll/day.png";scholar.alt="Your scholar celebrating";scholar.loading="lazy";
  companions.append(scholar,make("span",null,"🐾 ✨"));
  scene.append(companions,make("p",null,"Your scholar and companion celebrate seven days of learning."));
  const replay=make("button",null,"Replay celebration");
  replay.type="button";replay.addEventListener("click",()=>{scene.classList.remove("is-new");void scene.offsetWidth;scene.classList.add("is-new")});
  scene.append(replay);panel.append(scene);
  if(!seen)try{localStorage.setItem(SEEN_KEY,data.monday)}catch{}
 }
 else panel.append(make("p","weekly-note","Complete daily quests on different days to restore the constellation. Seven-day completion unlocks a display-only keepsake, not XP or outfits. Earlier days can only be counted if they were recorded on this device."));
 panel.dataset.weekSignature=signature;
}
function schedule(){if(!queued){queued=true;queueMicrotask(paint)}}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
for(const e of ["lux:app-ready","pageshow","storage","scholar:session-saved","scholar:learning-changed","popstate"])root.addEventListener(e,schedule);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule()});
schedule();
})(globalThis);
