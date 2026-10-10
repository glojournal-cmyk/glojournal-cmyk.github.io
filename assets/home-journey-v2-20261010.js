import "./home-journey-v2-logic-20261010.js?v=20261010-home-v2";
import { C as store } from "./index-BLVOhKhN.js?v=20261010-chem-marking1";

// Layer over the existing React home: no state mutation, no new rewards,
// and no moving the character, pet, or React-owned artwork.
const ROOT_ID="lux-home-journey-v2";
let queued=false, lastSignature="", lastHost=null;
const element=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!=null)node.textContent=String(text);
  return node;
};
function place(){
 // Do not insert elements into server-rendered React markup before hydration.
 if(location.pathname!=="/" || !window.__luxAppReady)return null;
 const heading=[...document.querySelectorAll("main h2")].find(x=>x.textContent.trim()==="Raise her today");
 if(!heading)return null;
 const header=heading.parentElement?.parentElement;
 const host=header?.parentElement;
 if(!host || !host.contains(heading))return null;
 host.dataset.luxHomeJourneyHost="true";
 header.dataset.luxV2LegacyDaily="true";
 for(const child of host.children){
  if(child.tagName==="UL" || (child.tagName==="DETAILS" && /^View today/i.test(child.querySelector("summary")?.textContent?.trim()||"")))
   child.dataset.luxV2LegacyDaily="true";
 }
 let panel=host.querySelector(":scope > #"+ROOT_ID);
 if(!panel){
  panel=element("section","lux-v2-journey");
  panel.id=ROOT_ID;
  panel.setAttribute("aria-label","Today's learning journey");
  host.prepend(panel);
 }
 // Hide only the redundant static Continue card, never the garden or rewards.
 const oldContinue=[...document.querySelectorAll("main p")].find(p=>p.textContent.trim()==="Continue studying");
 if(oldContinue && oldContinue.parentElement?.querySelector("a")){
  oldContinue.parentElement.dataset.luxV2LegacyContinue="true";
 }
 // Keep the same girl, background, outfit and companion art. Only change layout.
 const stage=document.querySelector("main img.scholar-idle")?.parentElement?.parentElement;
 if(stage)stage.dataset.luxV2Stage="true";
 document.documentElement.classList.add("lux-v2-home");
 return panel;
}
function makeAnchor(href,text,cls){
 const a=element("a",cls,text);
 a.href=href;
 return a;
}
function build(model){
 const fragment=document.createDocumentFragment();
 const top=element("div","lux-v2-heading");
 const heading=element("div");
 heading.append(element("p","lux-v2-kicker","TODAY'S JOURNEY"),element("h2","lux-v2-title","Raise her today"));
 const counter=element("span","lux-v2-count",model.ready?model.count+" / "+model.total:"Syncing");
 top.append(heading,counter);
 fragment.append(top);
 if(!model.ready){
  fragment.append(element("p","lux-v2-loading",model.subtitle));
  fragment.append(makeAnchor("/study/","Open Study Library","lux-v2-open-study"));
  return fragment;
 }
 const track=element("div","lux-v2-overall");
 track.setAttribute("role","progressbar");
 track.setAttribute("aria-label","Today's completed daily tasks");
 track.setAttribute("aria-valuemin","0");
 track.setAttribute("aria-valuemax",String(model.total));
 track.setAttribute("aria-valuenow",String(model.count));
 const fill=element("span","lux-v2-overall-fill");
 fill.style.width=Math.min(100,100*model.count/model.total)+"%";
 track.append(fill);fragment.append(track);

 const title=model.next.kind==="complete"?"All done for today":model.next.kind==="resume"?"Pick up where you stopped":"Your next mission";
 const focus=element("div","lux-v2-next");
 const label=element("p","lux-v2-next-kicker",title);
 const name=element("h3","lux-v2-next-title",model.next.title);
 const detail=element("p","lux-v2-next-detail",model.next.subtitle);
 const cta=makeAnchor(model.next.href,model.next.kind==="complete"?"Visit your garden →":model.next.kind==="resume"?"Resume saved question →":"Continue learning →","lux-v2-cta");
 focus.append(label,name,detail,cta);
 fragment.append(focus);

 const details=element("details","lux-v2-all");
 details.id="lux-v2-all-tasks";
 const summary=element("summary","lux-v2-all-summary");
 const txt=element("span",null,"View all "+model.total+" daily tasks");
 const hint=element("span","lux-v2-all-hint",(model.total-model.count)+" remaining");
 summary.append(txt,hint);
 details.append(summary);
 const list=element("ul","lux-v2-list");
 for(const row of model.rows){
  const li=element("li","lux-v2-list-item"+(row.done?" is-complete":""));
  const text=element("span","lux-v2-row-name",(row.done?"✓ ":"")+row.title);
  const progress=element("span","lux-v2-row-count",row.progress+" / "+row.target);
  const link=row.href?makeAnchor(row.href,"","lux-v2-row-link"):element("div","lux-v2-row-link");
  link.setAttribute("aria-label",row.title+": "+row.progress+" of "+row.target+(row.done?", complete":""));
  link.append(text,progress);
  li.append(link);list.append(li);
 }
 details.append(list);fragment.append(details);

 const cards=element("div","lux-v2-shortcuts");
 const assessment=makeAnchor("/assessment/","","lux-v2-shortcut");
 assessment.append(element("span","lux-v2-shortcut-icon","✦"),element("strong",null,"School tests"),element("small",null,"Dates & assessment papers"));
 const pet=makeAnchor("/pet/","","lux-v2-shortcut");
 pet.append(element("span","lux-v2-shortcut-icon","✧"),element("strong",null,"Next pet evolution"),
   element("small",null,model.reward?.label || "View companion growth"));
 cards.append(assessment,pet);fragment.append(cards);
 const foot=element("p","lux-v2-footnote","Pet evolution also requires the Mastery milestones shown in Companion Corner.");
 fragment.append(foot);
 return fragment;
}
function refresh(){
 queued=false;
 const panel=place();
 if(!panel)return;
 const journey=globalThis.LuxJourney;
 if(!journey || !globalThis.LuxHomeJourneyV2Logic)return;
 let model;
 try{
  model=globalThis.LuxHomeJourneyV2Logic.homeJourney(store.getState(),journey,localStorage);
 }catch(error){
  console.warn("Home Journey summary unavailable",error);
  return;
 }
 const signature=JSON.stringify(model);
 if(signature===lastSignature && panel===lastHost)return;
 const wasOpen=panel.querySelector("#lux-v2-all-tasks")?.open||false;
 const activeSummary=document.activeElement?.id==="lux-v2-all-tasks-summary";
 panel.replaceChildren(build(model));
 const details=panel.querySelector("#lux-v2-all-tasks");
 if(details){
  details.open=wasOpen;
  details.querySelector("summary").id="lux-v2-all-tasks-summary";
  if(activeSummary)details.querySelector("summary").focus({preventScroll:true});
 }
 lastSignature=signature;
 lastHost=panel;
}
function schedule(){
 if(queued)return;
 queued=true;
 queueMicrotask(refresh);
}
if(location.pathname==="/"){
 store.subscribe(schedule);
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")schedule()});
 window.addEventListener("pageshow",schedule);
 window.addEventListener("storage",schedule);
 window.addEventListener("scholar:pet-changed",schedule);
 window.addEventListener("scholar:mp-changed",schedule);
 window.addEventListener("lux:app-ready",schedule);
 store.persist?.onFinishHydration?.(schedule);
 schedule();
}
