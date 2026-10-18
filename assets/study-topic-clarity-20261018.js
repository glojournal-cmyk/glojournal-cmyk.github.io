// Topic list sits on the right. Notes can be hidden. Wording is shortened.
// Mutations are applied while the observer is disconnected so the page cannot freeze.
(function(){
"use strict";
var CSS=[
  "@media (min-width:1024px){",
  ".study-notes-directory{grid-template-columns:minmax(0,1fr) 360px !important;align-items:start}",
  ".study-notes-directory>aside{order:2}",
  ".study-notes-directory.notes-hidden{grid-template-columns:auto minmax(300px,440px) !important;justify-content:end}",
  "}",
  ".lux-notes-bar{display:flex;justify-content:flex-end;margin-bottom:8px}",
  ".lux-notes-toggle{border:1px solid #d5dcd4;background:#fffefa;color:#173447;border-radius:999px;min-height:36px;padding:0 14px;font-size:13px;font-weight:650;cursor:pointer}",
  ".lux-notes-toggle:hover{background:#edf2e8}",
  ".lux-notes-pane.is-hidden>:not(.lux-notes-bar){display:none}"
].join("");
function ensureStyle(){
  if(document.getElementById("lux-notes-layout"))return;
  var style=document.createElement("style");
  style.id="lux-notes-layout";
  style.textContent=CSS;
  document.head.appendChild(style);
}
function shorten(scope){
  var nodes=scope.querySelectorAll("button");
  for(var i=0;i<nodes.length;i++){
    var text=(nodes[i].textContent||"").trim();
    if(text.indexOf("Not learned yet")===0)nodes[i].textContent="New";
    else if(text.indexOf("mark not learned")!==-1&&text!=="Learned")nodes[i].textContent="Learned";
  }
  var paras=scope.querySelectorAll("p");
  for(var j=0;j<paras.length;j++){
    if(!paras[j].hidden && (paras[j].textContent||"").indexOf("foundations start as learned")!==-1)paras[j].hidden=true;
  }
}
function placeList(){
  var grid=document.querySelector(".study-notes-directory");
  if(!grid)return;
  ensureStyle();
  var aside=grid.querySelector("aside");
  var notes=null, children=grid.children;
  for(var i=0;i<children.length;i++){
    if(children[i]!==aside){notes=children[i];break;}
  }
  if(!aside||!notes)return;
  notes.classList.add("lux-notes-pane");
  if(notes.querySelector(".lux-notes-bar"))return;
  var bar=document.createElement("div");
  bar.className="lux-notes-bar";
  var btn=document.createElement("button");
  btn.type="button";
  btn.className="lux-notes-toggle";
  btn.textContent="Hide notes";
  btn.setAttribute("aria-expanded","true");
  btn.addEventListener("click",function(){
    var now=grid.classList.toggle("notes-hidden");
    notes.classList.toggle("is-hidden",now);
    btn.textContent=now?"Show notes":"Hide notes";
    btn.setAttribute("aria-expanded",now?"false":"true");
  });
  bar.appendChild(btn);
  notes.insertBefore(bar,notes.firstChild);
}
var observer=new MutationObserver(function(){apply();});
var timer=0;
function apply(){
  observer.disconnect();
  try{shorten(document);placeList();}catch(e){}
  clearTimeout(timer);
  timer=setTimeout(function(){
    observer.observe(document.body,{childList:true,subtree:true});
  },250);
}
if(document.body)apply();
else document.addEventListener("DOMContentLoaded",apply);
})();
