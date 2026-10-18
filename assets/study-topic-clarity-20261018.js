// Shorten topic-list wording after the page has rendered. Does not replace the topic module.
(function(){
"use strict";
if(!/^\/study\/[^/]+\/(?:learn|practise)\/?$/.test(location.pathname))return;
function shorten(root){
  const scope=root||document;
  for(const button of scope.querySelectorAll("button")){
    const text=(button.textContent||"").trim();
    if(text==="Not learned yet · mark learned"||text==="Not learned yet · mark learned")button.textContent="New";
    else if(text.indexOf("mark not learned")!==-1)button.textContent="Learned";
  }
  for(const node of scope.querySelectorAll("p")){
    const text=node.textContent||"";
    if(text.indexOf("Year 7–8 foundations start as learned")!==-1||text.indexOf("Year 7-8 foundations start as learned")!==-1){
      node.hidden=true;
      continue;
    }
    const ready=text.match(/^(\d+) ready questions/);
    if(ready&&text.indexOf("Building confidence")!==-1)node.textContent=ready[1]+" questions";
  }
}
let queued=false;
function run(){if(queued)return;queued=true;queueMicrotask(function(){queued=false;try{shorten(document)}catch(e){}})}
new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
run();
})();
