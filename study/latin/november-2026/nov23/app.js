import { NOV23_PAPERS, validateNov23Papers } from "../nov23-papers.js?v=20261120qa1";
validateNov23Papers();
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const papers = NOV23_PAPERS;
const sessions = papers.map(() => ({status:"ready", section:"A", answers:{}, grades:{}, remaining:3000, endsAt:0}));
let selected = 0;
const tabs = document.getElementById("paper-tabs");
const host = document.getElementById("assessment");
const session = () => sessions[selected];
const paper = () => papers[selected];
const time = n => Math.floor(Math.max(0,n)/60).toString().padStart(2,"0")+":"+(Math.max(0,n)%60).toString().padStart(2,"0");
const key = (part,i,j) => part+"-"+i+"-"+j;
const answerKey = (part,i) => part+"-"+i;
function remaining(s){
  return s.status==="active" ? Math.max(0,Math.ceil((s.endsAt-Date.now())/1000)) : s.remaining;
}
function answersCount(s){
  return Object.values(s.answers).filter(x=>String(x).trim()).length;
}
function unitsFor(s){
  const p=paper();
  const all=[...p.A.flatMap((q,i)=>q.units.map((unit,j)=>["A",i,j])),...p.B.flatMap((q,i)=>q.units.map((unit,j)=>["B",i,j])),...p.C.flatMap((q,i)=>q.units.map((unit,j)=>["C",i,j]))];
  return all;
}
function gradeTotals(s){
  const u=unitsFor(s); let score=0,marked=0, A=0,B=0,C=0;
  for(const [part,i,j] of u){
    const v=s.grades[key(part,i,j)];
    if(v===undefined)continue;
    marked++;score+=Number(v);
    if(part==="A")A+=Number(v);else if(part==="B")B+=Number(v);else C+=Number(v);
  }
  return {score,marked,total:u.length,A,B,C};
}
function renderTabs(){
  tabs.innerHTML=papers.map((p,i)=>'<button type="button" class="paper-tab" data-paper="'+i+'" aria-pressed="'+(selected===i)+'"><strong>'+esc(p.title)+'</strong><span>'+esc(p.label)+' · '+(sessions[i].status==="submitted"?"Submitted":sessions[i].status==="active"?"In progress":sessions[i].status==="paused"?"Paused":"Not started")+'</span></button>').join("");
}
function markControl(part,i,j,content){
  const s=session(); const g=key(part,i,j);const value=s.grades[g];const values=part==="C"?[0,0.5,1]:[0,1];
  return '<div class="score-row"><label for="unit-'+g+'">'+esc(content)+'</label><select id="unit-'+g+'" data-grade="'+g+'" aria-label="Mark this rubric point"><option value="">Not marked</option>'+
    values.map(n=>'<option value="'+n+'"'+(value!==undefined&&Number(value)===n?' selected':'')+'>'+n+' mark'+(n===1?'':'s')+'</option>').join("")+'</select></div>';
}
function answerBox(part,i,prompt,model,units,marks,latinPrompt){
  const s=session(),submitted=s.status==="submitted",k=answerKey(part,i),v=s.answers[k]||"";
  return '<article class="question"><div class="status"><h3>'+esc(part+(i+1))+' · '+marks+' mark'+(marks!==1?'s':'')+'</h3></div>'+
    '<p'+(latinPrompt?' class="passage" lang="la"':'')+'>'+esc(prompt)+'</p><label for="answer-'+k+'">Your answer</label>'+
    '<textarea id="answer-'+k+'" data-answer="'+k+'" placeholder="'+(part==="C"?'Write your complete English translation.':'Type your answer here.')+'" spellcheck="false" '+(submitted?'disabled':'')+'>'+esc(v)+'</textarea>'+
    (submitted?'<div class="model"><strong>Model answer</strong><p>'+esc(model)+'</p><p class="meta">Award one mark per correct unit. In Part C, give ½ for a recognisable core meaning with one local error; no points for reversed subject/object roles.</p>'+
    units.map((u,j)=>markControl(part,i,j,Array.isArray(u)?u[0]+" — "+u[1]:u)).join("")+'</div>':"")+
    '</article>';
}
function renderSection(){
  const p=paper(),s=session();
  if(s.section==="A")return '<div class="panel"><h2>Part A · English → Latin</h2><p class="meta">11 marks. Translate each full sentence into Latin. The composition-only exclusions from the source guide apply.</p></div>'+
    p.A.map((q,i)=>answerBox("A",i,q.prompt,q.model,q.units,q.marks,false)).join("");
  if(s.section==="B")return '<div class="panel"><h2>Part B · Latin comprehension</h2><p class="meta">14 marks. Read the passage first and then answer every question.</p><div class="passage" lang="la">'+esc(p.Bpassage)+'</div></div>'+
    p.B.map((q,i)=>answerBox("B",i,q.prompt,q.model,q.units,q.marks,false)).join("");
  const gl=p.glossary?.length?'<div class="note"><strong>Source-provided vocabulary help:</strong> '+p.glossary.map(x=>esc(x[0])+' = '+esc(x[1])).join(" · ")+'</div>':"";
  return '<div class="panel"><h2>Part C · Unseen passage translation</h2><p class="meta">50 marks. Translate all five parts. Each paragraph is worth 10 marks, with ten separate meaning units.</p>'+gl+'</div>'+
   p.C.map((c,i)=>answerBox("C",i+0,"Section "+(i+1)+" of 5 · "+c.latin,c.model,c.units,10,true)).join("");
}
function render(){
  const s=session(),p=paper(),submitted=s.status==="submitted",active=s.status==="active",paused=s.status==="paused";
  renderTabs();
  let html='<section class="panel"><div class="status"><div><div class="kicker">'+esc(p.label)+'</div><h2>'+esc(p.title)+'</h2><p class="meta">'+esc(p.description)+'</p></div><div><div class="timer" id="countdown" aria-label="Time remaining">'+time(remaining(s))+'</div><div class="progress">'+answersCount(s)+' / '+(p.A.length+p.B.length+p.C.length)+' answers typed</div></div></div>';
  if(s.status==="ready")html+='<div class="note">Start a 50-minute attempt. You may pause the clock and switch between the A/B/C sections. The answers and mark scheme stay hidden until submission.</div><div class="actions"><button class="btn" data-action="start">Start this assessment</button></div>';
  if(active)html+='<div class="actions"><button class="btn secondary" data-action="pause">Pause timer</button><button class="btn warning" data-action="submit">Submit and show marking scheme</button></div>';
  if(paused)html+='<div class="actions"><button class="btn" data-action="resume">Resume</button><button class="btn warning" data-action="submit">Submit and show marking scheme</button></div><div class="note">Timer paused; questions remain editable.</div>';
  if(submitted){const t=gradeTotals(s);html+='<div class="note"><strong>Submitted · Mark the answers below</strong><p>Work through the original mark scheme. Score is a self-assessment; the app does not pretend to grade free-text translations automatically.</p><div class="score-display" data-score>'+t.score+' / 75</div><div class="progress" data-markcount>'+t.marked+' / 75 marking points reviewed · A '+t.A+'/11 · B '+t.B+'/14 · C '+t.C+'/50</div></div><div class="actions"><button class="btn secondary" data-action="reset">Restart this paper</button></div>';}
  html+='</section>';
  if(s.status!=="ready"){
    html+='<nav class="sect-nav" aria-label="Paper section">'+["A","B","C"].map(x=>'<button type="button" class="section-tab" data-section="'+x+'" aria-pressed="'+(x===s.section)+'">'+(x==="A"?"Part A · 11":x==="B"?"Part B · 14":"Part C · 50")+'</button>').join("")+'</nav>'+renderSection();
    html+='<div class="actions">'+(s.section!=="A"?'<button class="btn secondary" data-action="previous">Previous section</button>':"")+(s.section!=="C"?'<button class="btn secondary" data-action="next">Next section</button>':"")+'</div>';
  }
  host.innerHTML=html;
}
function submit(auto){
  const s=session();
  if(!["active","paused"].includes(s.status))return;
  if(!auto&&!window.confirm("Submit this paper now? Answers and the marking scheme will become visible and your attempt will end."))return;
  s.remaining=remaining(s);
  s.status="submitted";s.endsAt=0;render();
  window.scrollTo({top:0,behavior:"smooth"});
}
tabs.addEventListener("click",e=>{
  const button=e.target.closest("[data-paper]");if(!button)return;
  selected=Number(button.dataset.paper);render();
});
host.addEventListener("click",e=>{
 const b=e.target.closest("[data-action],[data-section]");if(!b)return;
 const s=session();
 if(b.dataset.section){s.section=b.dataset.section;render();return;}
 switch(b.dataset.action){
 case "start":s.status="active";s.remaining=3000;s.endsAt=Date.now()+3000000;break;
 case "pause":s.remaining=remaining(s);s.status="paused";s.endsAt=0;break;
 case "resume":s.status="active";s.endsAt=Date.now()+s.remaining*1000;break;
 case "submit":submit(false);return;
 case "reset":if(!window.confirm("Delete this paper's answers and self-marking and restart?"))return;sessions[selected]={status:"ready",section:"A",answers:{},grades:{},remaining:3000,endsAt:0};break;
 case "next":s.section=s.section==="A"?"B":"C";break;
 case "previous":s.section=s.section==="C"?"B":"A";break;
 }
 render();
});
host.addEventListener("input",e=>{
 if(e.target.matches("textarea[data-answer]"))session().answers[e.target.dataset.answer]=e.target.value;
});
host.addEventListener("change",e=>{
 if(!e.target.matches("select[data-grade]"))return;
 const s=session(),v=e.target.value,k=e.target.dataset.grade;
 if(v==="")delete s.grades[k];else s.grades[k]=Number(v);
 const t=gradeTotals(s);
 const score=host.querySelector("[data-score]"),count=host.querySelector("[data-markcount]");
 if(score)score.textContent=t.score+" / 75";
 if(count)count.textContent=t.marked+" / 75 marking points reviewed · A "+t.A+"/11 · B "+t.B+"/14 · C "+t.C+"/50";
});
setInterval(()=>{
 const s=session();
 if(s.status!=="active")return;
 const t=remaining(s),node=host.querySelector("#countdown");
 if(node)node.textContent=time(t);
 if(t<=0)submit(true);
},1000);
render();
