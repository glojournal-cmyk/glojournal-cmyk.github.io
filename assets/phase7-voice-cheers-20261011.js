/* Phase 7B: friendly spoken encouragement. Requires a real user interaction to unlock audio.
   Does not alter marks, XP, progress or any learning state. */
(function(root){
"use strict";
const KEY="lux-encouragement-voice-v1";
const lines=["Well done!","Superb!","Great job!","Excellent!"];
let enabled=false,unlocked=false,spokenAt=0,next=0,queued=false,seen=new WeakSet();
try{enabled=localStorage.getItem(KEY)==="on"}catch{}
function speak(preview=false){
 if(!enabled||!unlocked||!root.speechSynthesis||typeof root.SpeechSynthesisUtterance!=="function")return false;
 const now=Date.now();
 if(!preview&&now-spokenAt<12000)return false;
 if(document.hidden&&!preview)return false;
 spokenAt=now;
 const voice=new root.SpeechSynthesisUtterance(lines[next++%lines.length]);
 voice.lang="en-GB";voice.pitch=1.18;voice.rate=.94;voice.volume=.72;
 const english=(root.speechSynthesis.getVoices?.()||[]).filter(v=>/^en(-|_)/i.test(v.lang));
 voice.voice=english.find(v=>/^en-GB/i.test(v.lang)&&/female|serena|kate|samantha|susan|martha|moira/i.test(v.name))
   ||english.find(v=>/^en-GB/i.test(v.lang))||english[0]||null;
 try{root.speechSynthesis.cancel();root.speechSynthesis.speak(voice);return true}catch{return false}
}
function apply(button){
 const label=enabled?"🔊 Voice cheers: On":"🔇 Voice cheers: Off";
 if(button.textContent!==label)button.textContent=label;
 const pressed=enabled?"true":"false";
 if(button.getAttribute("aria-pressed")!==pressed)button.setAttribute("aria-pressed",pressed);
 if(button.title!=="Toggle spoken encouragement. Tap once to preview.")button.title="Toggle spoken encouragement. Tap once to preview.";
}
function mount(){
 if(!document.body)return;
 const home=location.pathname==="/";
 const mission=document.querySelector(".lux-mission-v2");
 if(!home&&!mission)return;
 const host=home?(document.querySelector("#lux-home-journey-v2")||document.querySelector("main")):mission;
 if(!host)return;
 let button=document.getElementById("lux-voice-cheer-toggle");
 if(!button){
   button=document.createElement("button");button.id="lux-voice-cheer-toggle";button.type="button";button.className="lux-voice-cheer-toggle";
   button.addEventListener("click",()=>{
     unlocked=true;enabled=!enabled;
     try{localStorage.setItem(KEY,enabled?"on":"off")}catch{}
     apply(button);if(enabled)speak(true);else root.speechSynthesis?.cancel?.();
   });
   host.append(button);
 }
 apply(button);
 for(const node of document.querySelectorAll(".lux-mission-v2.is-celebrating")){
   if(seen.has(node))continue;
   seen.add(node);speak();
 }
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;mount()})}
root.addEventListener("lux:phase7-mission-complete",()=>speak());
root.addEventListener("pageshow",schedule);
document.addEventListener("click",e=>{if(e.isTrusted)unlocked=true},{capture:true});
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
schedule();
})(globalThis);
