/* Phase 2: read-only constellation for the existing TEN Daily Quest tasks.
   Never grants or writes XP, mastery, task completion, outfits or pet progress. */
(function(root){
"use strict";
function model(state,J,at=Date.now()){
 const today=J?.day?.(at),tasks=Array.isArray(state?.daily)?state.daily:[];
 if(!today||state?.today!==today||tasks.length!==10)
   return {ready:false,count:0,total:10,rows:[],focus:null};
 const rows=tasks.map((t,i)=>{
  const target=Math.max(1,Number(t.target)||1),progress=Math.max(0,Math.min(target,Number(t.progress)||0));
  const href=J?.navigationHref?.(t.href)||null;
  return {id:String(t.id||"quest-"+i),title:String(t.title||"Quest "+(i+1)),
    number:i+1,progress,target,done:progress>=target,href};
 });
 let drafts=[];
 try{drafts=J?.resumeCandidates?.(state,at)||[]}catch{}
 const active=drafts.find(x=>x.daily&&x.planDate===today&&rows.some(r=>r.id===x.dailyTaskId&&!r.done&&r.href));
 const focus=rows.find(r=>r.id===active?.dailyTaskId)||rows.find(r=>!r.done&&r.href);
 return {ready:true,count:rows.filter(r=>r.done).length,total:10,rows,focus:focus?.id||null};
}
root.LuxPhase2QuestMap={model};
if(typeof document==="undefined")return;
const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;
 if(value!==undefined)el.textContent=value;return el};
function renderStars(data){
 const rail=make("div","lux-phase2-stars");
 rail.setAttribute("role","group");
 rail.setAttribute("aria-label",data.count+" of 10 daily quests complete");
 for(const task of data.rows){
  const n=make(task.href?"a":"span","lux-phase2-node"+
    (task.done?" is-lit":task.id===data.focus?" is-next":""));
  if(task.href)n.href=task.href;
  n.dataset.questId=task.id;
  n.setAttribute("aria-label",task.title+" · "+task.progress+" / "+task.target+
    (task.done?" · complete":task.id===data.focus?" · next quest":" · not yet complete"));
  n.title=task.title+" · "+task.progress+" / "+task.target;
  if(task.id===data.focus)n.setAttribute("aria-current","step");
  const orb=make("span","lux-phase2-orb",task.done?"✦":"✧");
  orb.setAttribute("aria-hidden","true");
  const num=make("small","lux-phase2-num",String(task.number).padStart(2,"0"));
  num.setAttribute("aria-hidden","true");n.append(orb,num);rail.append(n);
 }
 return rail;
}
let queued=false;
function repaint(){
 queued=false;
 if(!root.__luxAppReady||!root.LuxJourney)return;
 let state;try{state=root.LuxJourney.garden()}catch{return}
 const data=model(state,root.LuxJourney);
 if(/^\/study\/?$/.test(location.pathname)){
  const host=document.querySelector("#lux-study-paths-v2 .lux-path-sigils");
  if(!host||!data.ready)return;
  const signature=JSON.stringify(data.rows.map(r=>[r.id,r.progress,r.target,r.href,r.done,r.id===data.focus]));
  if(host.dataset.phase2Signature===signature)return;
  host.classList.add("lux-phase2-host");
  host.replaceChildren(renderStars(data));host.dataset.phase2Signature=signature;
  return;
 }
 if(location.pathname!=="/")return;
 const anchor=[...document.querySelectorAll("main p")].find(p=>p.textContent.trim()==="Continue studying");
 const card=anchor?.parentElement;if(!card)return;
 let panel=card.querySelector(":scope > #lux-phase2-home");
 if(!data.ready){
  if(!panel){panel=make("section","lux-phase2-home");panel.id="lux-phase2-home";
    panel.setAttribute("aria-label","Your daily constellation");card.append(panel)}
  if(panel.dataset.phase2Signature!=="pending"){
    panel.replaceChildren();
    const head=make("div","lux-phase2-heading");
    head.append(make("strong",null,"TODAY'S CONSTELLATION"));
    panel.append(head,make("p","lux-phase2-pending",
      "Waiting for all 10 daily tasks to sync. No stars have been counted yet."));
    const link=make("a","lux-phase2-sync","Open Study to prepare today's quests →");
    link.href="/study/";panel.append(link);panel.dataset.phase2Signature="pending";
  }
  return;
 }
 const goal=document.getElementById("chosen-reward-goal");
 const goalName=goal?.querySelector("h3")?.textContent?.trim()||"Choose your next reward";
 const goalText=goal?.querySelector("h3+p")?.textContent?.trim()||"Your selected outfit or companion goal";
 const href=goal?"#chosen-reward-goal":"/pet/";
 const signature=JSON.stringify([data.rows.map(r=>[r.id,r.progress,r.target,r.href]),data.focus,goalName,goalText,href]);
 if(panel?.dataset.phase2Signature===signature)return;
 if(!panel){panel=make("section","lux-phase2-home");panel.id="lux-phase2-home";
   panel.setAttribute("aria-label","Your daily constellation");card.append(panel)}
 panel.replaceChildren();
 const head=make("div","lux-phase2-heading");
 head.append(make("strong",null,"TODAY'S CONSTELLATION"),make("span",null,data.count+" / 10 stars"));
 panel.append(head,renderStars(data));
 const next=data.rows.find(r=>r.id===data.focus);
 panel.append(make("p","lux-phase2-hint",data.count===10?"All ten quests complete":
    next?"Next star · "+next.title:"Tap a star to choose a quest"));
 const reward=make("a","lux-phase2-goal");
 reward.href=href;
 reward.append(make("small",null,"NEXT UNLOCK"),make("strong",null,goalName),
   make("span",null,goalText+" →"));
 panel.append(reward);panel.dataset.phase2Signature=signature;
}
function schedule(){if(!queued){queued=true;queueMicrotask(repaint)}}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
for(const event of ["lux:app-ready","pageshow","storage","scholar:session-saved",
  "scholar:learning-changed","lux:reward-goal-rendered","popstate"])
 root.addEventListener(event,schedule);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule()});
schedule();
})(globalThis);
