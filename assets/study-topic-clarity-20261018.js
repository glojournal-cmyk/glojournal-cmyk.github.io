// Learn layout: topic list on the right, notes can be hidden. Also shortens topic-list wording.
(function(){
"use strict";
function ensureStyle(){
  var style=document.getElementById("lux-notes-layout");
  if(!style){
    style=document.createElement("style");
    style.id="lux-notes-layout";
    document.head.appendChild(style);
  }
  style.textContent=[
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
  document.head.appendChild(style);
}
function shorten(scope){
  for(var i=0,nodes=scope.querySelectorAll("button"),n=nodes.length;i<n;i++){
    var text=(nodes[i].textContent||"").trim();
    if(text.indexOf("Not learned yet")===0)nodes[i].textContent="New";
    else if(text.indexOf("mark not learned")!==-1)nodes[i].textContent="Learned";
  }
  for(var j=0,paras=scope.querySelectorAll("p"),m=paras.length;j<m;j++){
    var body=paras[j].textContent||"";
    if(body.indexOf("foundations start as learned")!==-1)paras[j].hidden=true;
  }
}
function placeList(){
  var grid=document.querySelector(".study-notes-directory");
  if(!grid)return;
  ensureStyle();
  var aside=grid.querySelector(":scope > aside");
  var notes=null, children=grid.children;
  for(var i=0;i<children.length;i++){
    if(children[i]!==aside){notes=children[i];break}
  }
  if(!aside||!notes)return;
  notes.classList.add("lux-notes-pane");
  if(notes.querySelector(":scope > .lux-notes-bar"))return;
  var bar=document.createElement("div");
  bar.className="lux-notes-bar";
  var btn=document.createElement("button");
  btn.type="button";
  btn.className="lux-notes-toggle";
  var hidden=grid.classList.contains("notes-hidden");
  btn.textContent=hidden?"Show notes":"Hide notes";
  btn.setAttribute("aria-expanded",hidden?"false":"true");
  btn.addEventListener("click",function(){
    var now=grid.classList.toggle("notes-hidden");
    notes.classList.toggle("is-hidden",now);
    btn.textContent=now?"Show notes":"Hide notes";
    btn.setAttribute("aria-expanded",now?"false":"true");
  });
  bar.appendChild(btn);
  notes.insertBefore(bar,notes.firstChild);
  if(hidden)notes.classList.add("is-hidden");
}
var queued=false;
function run(){
  if(queued)return;
  queued=true;
  queueMicrotask(function(){
    queued=false;
    try{shorten(document);placeList()}catch(e){}
  });
}
new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
run();
})();
