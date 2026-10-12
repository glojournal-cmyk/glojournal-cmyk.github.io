/* Event-driven spoken encouragement. Only the voice preference is persisted. */
(function(root){
"use strict";
if(root.__luxVoiceCheers)return;
root.__luxVoiceCheers=true;
const KEY="lux-encouragement-voice-v1",lines=["Well done!","Superb!","Great job!","Excellent!"];
let enabled=false,unlocked=false,spokenAt=-Infinity,next=0,streak=0,timer=null,attempts=0,lastPath=location.pathname;
try{enabled=localStorage.getItem(KEY)==="on"}catch{}
function available(){return !!root.speechSynthesis&&typeof root.SpeechSynthesisUtterance==="function"}
function speak(preview=false){
 if(!enabled||!unlocked||!available()||document.hidden)return false;
 const now=Date.now();
 if(!preview&&(now-spokenAt<12000||root.speechSynthesis.speaking))return false;
 const voice=new root.SpeechSynthesisUtterance(lines[next%lines.length]);
 voice.lang="en-GB";voice.pitch=1.18;voice.rate=.94;voice.volume=.72;
 const english=(root.speechSynthesis.getVoices?.()||[]).filter(v=>/^en(-|_)/i.test(v.lang));
 voice.voice=english.find(v=>/^en-GB/i.test(v.lang)&&/female|serena|kate|samantha|susan|martha|moira/i.test(v.name))||english.find(v=>/^en-GB/i.test(v.lang))||english[0]||null;
 try{if(preview)root.speechSynthesis.cancel();root.speechSynthesis.speak(voice);spokenAt=now;next++;return true}catch{return false}
}
function apply(button){
 const label=available()?(enabled?"🔊 Voice cheers: On":"🔇 Voice cheers: Off"):"Voice cheers unavailable";
 if(button.textContent!==label)button.textContent=label;
 button.disabled=!available();
 const pressed=enabled?"true":"false";
 if(button.getAttribute("aria-pressed")!==pressed)button.setAttribute("aria-pressed",pressed);
 button.title="Optional spoken encouragement. Turn on to hear a preview.";
}
function mount(){
 if(lastPath!==location.pathname){streak=0;lastPath=location.pathname}
 if(!root.__luxAppReady||!document.body)return;
 const learning=/^\/study\/[^/]+\/(practise|play)/.test(location.pathname)||location.pathname.startsWith('/session/');
 const home=/^\/$/.test(location.pathname);
 const old=document.getElementById("lux-voice-cheer-toggle");
 if(!home&&!learning){old?.remove();return}
 const host=home?document.querySelector("main"):document.getElementById('study-companion')||document.querySelector('main');
 if(!host)return;
 let button=old;
 if(!button){
  button=document.createElement("button");button.id="lux-voice-cheer-toggle";button.type="button";button.className="lux-voice-cheer-toggle";
  button.style.cssText="min-height:44px;padding:10px 14px;margin:12px 0;border:1px solid #c6b485;border-radius:24px;background:#fffbef;color:#234955;font:600 13px system-ui";
  button.addEventListener("click",()=>{unlocked=true;enabled=!enabled;try{localStorage.setItem(KEY,enabled?"on":"off")}catch{}apply(button);if(enabled)speak(true);else root.speechSynthesis?.cancel?.()});
  host.append(button);
 }
 apply(button);
}
// Bounded retries handle hydration; no DOM observer or perpetual timer.
function boot(){
 mount();
 if(document.getElementById('lux-voice-cheer-toggle')||attempts++>=12)return;
 if(timer!==null)root.clearTimeout(timer);
 timer=root.setTimeout(()=>{timer=null;boot()},500);
}
root.addEventListener('lux:app-ready',boot);
root.addEventListener('pageshow',boot);
root.addEventListener('popstate',mount);
root.addEventListener('scholar:session-saved',mount);
root.addEventListener('scholar:question-answered',e=>{
 mount();
 if(e.detail?.correct!==true){streak=0;return}
 streak++;
 if(streak%3===0)speak();
});
root.addEventListener('lux:phase7-mission-complete',e=>{if(e.detail?.verified===true)speak()});
document.addEventListener('click',e=>{
 if(e.isTrusted)unlocked=true;
 if(e.target?.closest?.('a[href]')){
  // Internal React navigation may replace main without a full page load.
  root.setTimeout(()=>{attempts=0;boot()},250);
 }
},{capture:true});
document.addEventListener('keydown',e=>{if(e.isTrusted)unlocked=true},{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)root.speechSynthesis?.cancel?.()});
boot();
})(globalThis);
