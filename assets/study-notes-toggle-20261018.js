(function(){
"use strict";
function once(){
  var grid=document.querySelector(".study-notes-directory");
  if(!grid||grid.querySelector(".lux-notes-bar"))return;
  var aside=grid.querySelector("aside");
  var notes=null, children=grid.children;
  for(var i=0;i<children.length;i++){
    if(children[i]!==aside){notes=children[i];break;}
  }
  if(!aside||!notes)return;
  notes.classList.add("lux-notes-pane");
  var bar=document.createElement("div");
  bar.className="lux-notes-bar";
  var btn=document.createElement("button");
  btn.type="button";
  btn.className="lux-notes-toggle";
  btn.textContent="Hide notes";
  btn.setAttribute("aria-expanded","true");
  btn.addEventListener("click",function(){
    var hidden=grid.classList.toggle("notes-hidden");
    notes.classList.toggle("is-hidden",hidden);
    btn.textContent=hidden?"Show notes":"Hide notes";
    btn.setAttribute("aria-expanded",hidden?"false":"true");
  });
  bar.appendChild(btn);
  notes.insertBefore(bar,notes.firstChild);
}
var times=0;
function tick(){times+=1;try{once()}catch(e){}}
if(document.readyState!=="loading")tick();
else document.addEventListener("DOMContentLoaded",tick);
window.addEventListener("load",tick);
setTimeout(tick,1200);
})();
