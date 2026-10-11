/* Phase 7D: read-only companion personality moments on the existing home scene. */
(function(root){
"use strict";
const phrases={
 "moss-hornling":["A little progress grows into a forest.","I saved a quiet corner of the garden for you."],
 "moon-puff":["Even stars need a little rest.","Your curiosity makes this garden glow."],
 "inkling":["Every clever answer begins with a question.","I have a new idea for us!"],
 "snow-owl":["Wisdom grows with every small step.","A moonlit mystery awaits."],
 "night-spider":["A beautiful idea is taking shape.","One careful thread at a time."]
};
const general=["Another little discovery? I'm ready.","You make this garden feel alive.","One step at a time, scholar."];
let last=0,turn=0;
function details(){
 try{const pet=JSON.parse(localStorage.getItem("lux-pet-companion-v1")||"{}");return pet&&typeof pet==="object"?pet:{}}catch{return {}}
}
function mount(){
 if(location.pathname!=="/"||!root.__luxAppReady)return;
 const pet=document.getElementById("mastery-pet-home");
 const host=pet?.parentElement;
 if(!pet||!host||document.getElementById("lux-phase7-pet-hello"))return;
 const btn=document.createElement("button");
 btn.type="button";btn.id="lux-phase7-pet-hello";btn.className="lux-phase7-pet-hello";
 btn.textContent="✦ Say hello";btn.setAttribute("aria-label","Hear a little message from your companion");
 btn.addEventListener("click",()=>{
  if(Date.now()-last<1300)return;
  last=Date.now();
  const petInfo=details(),lines=phrases[petInfo.species]||general;
  const line=lines[turn++%lines.length];
  let note=document.getElementById("lux-phase7-pet-line");
  if(!note){note=document.createElement("p");note.id="lux-phase7-pet-line";note.className="lux-phase7-pet-line";note.setAttribute("role","status");btn.after(note)}
  note.textContent=line;
  btn.classList.remove("is-waving");
  if(!root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)btn.classList.add("is-waving");
 });
 host.append(btn);
}
let pending=false;
new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;mount()})}}).observe(document.documentElement,{subtree:true,childList:true});
root.addEventListener("lux:app-ready",mount);root.addEventListener("pageshow",mount);mount();
})(globalThis);
