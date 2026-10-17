(() => {
  const KEY='scholar-biology-nov2-practice-v1',app=document.getElementById('nov2-app'),status=document.getElementById('nov2-save');
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state={},bank=[],topic=new URLSearchParams(location.search).get('topic')||'all',size=10;
  try{state=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
  if(!Array.isArray(state.ids))state.ids=[];
  if(!state.answers||typeof state.answers!=='object')state.answers={};
  if(!state.history||typeof state.history!=='object')state.history={};
  state.index=Math.max(0,Number(state.index)||0);
  topic=new URLSearchParams(location.search).get('topic')||state.sessionTopic||'all';
  const weak=()=>Object.keys(state.history).filter(id=>Number(state.history[id].credit)<1);
  function save(){try{state.savedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(state));status.textContent='';status.classList.remove('nov2-warning')}catch{status.textContent='Your browser could not save these answers. Keep this page open.';status.classList.add('nov2-warning')}}
  function settings(){
    const topics=[...new Set(bank.map(q=>q.topic))];
    return `<p class="nov2-settings-note">${bank.length} short-answer questions · six topics · original GCSE AQA-style practice. New sets prioritise questions outside your previous set and progress from easier to harder.</p><div class="nov2-controls"><label>Topic<select id="nov2-topic"><option value="all">All assessment topics</option>${topics.map(t=>`<option value="${esc(t)}" ${topic===t?'selected':''}>${esc(t)}</option>`).join('')}<option value="weak" ${topic==='weak'?'selected':''}>Retry my mistakes (${weak().length})</option></select></label><label>Questions<select id="nov2-count">${[5,10,15].map(n=>`<option ${size===n?'selected':''}>${n}</option>`).join('')}</select></label><button class="primary" id="nov2-start">Start a new set</button></div>`;
  }
  function start(){
    if(state.ids.length&&state.index<state.ids.length&&Object.values(state.answers).some(a=>a.value?.trim())&&!confirm('Start a new set? Your current set will be replaced. Your marked mistake history will be kept.'))return;
    topic=document.getElementById('nov2-topic').value;size=Number(document.getElementById('nov2-count').value);
    const selected=LuxBiologyNov2.select(bank,{topic,size,previous:state.ids,weak:weak()});
    if(!selected.length){status.textContent='No marked mistakes to retry yet. Choose another topic.';return;}
    state={...state,ids:selected.map(q=>q.id),index:0,answers:{},sessionTopic:topic,startedAt:Date.now()};save();render();
  }
  function feedback(q,entry){
    const r=entry.result;
    return `<div class="nov2-feedback" id="nov2-feedback"><h3>${r.matched} / ${q.marks} marks · ${esc(r.status)}</h3><p><b>How to earn full marks</b></p><ol class="nov2-points">${q.answer.points.map((p,i)=>`<li><b>${r.pointResults[i]?'✓ Awarded':'○ Missing'} · 1 mark:</b> ${esc(p.label)}</li>`).join('')}</ol><p class="nov2-model"><b>Full-mark model answer:</b><br>${esc(q.modelAnswer)}</p>${q.workedSolution?`<p class="nov2-model"><b>Working:</b><br>${esc(q.workedSolution)}</p>`:''}<p><b>Answer method:</b> ${esc(q.examGuidance.strategy)}</p><p><b>Avoid losing marks:</b> ${esc(q.examGuidance.commonError)}</p><p class="small muted">Equivalent scientific wording can vary. If a mark seems disputed, compare your explanation with the checklist; these are suggested practice marking points.</p><button class="primary" id="nov2-next">${state.index===state.ids.length-1?'Finish this set':'Next question'}</button></div>`;
  }
  function render(){
    const q=bank.find(q=>q.id===state.ids[state.index]),entry=q?state.answers[q.id]||{}:null;
    if(q){
      app.innerHTML=`<section class="panel"><p class="nov2-progress">Question ${state.index+1} of ${state.ids.length} · ${esc(q.topic)} · ${q.marks} ${q.marks===1?'mark':'marks'}</p><progress value="${state.index}" max="${state.ids.length}" aria-label="Questions completed" style="width:100%"></progress><form id="nov2-answer-form"><h2 class="nov2-question">${esc(q.prompt)}</h2>${q.diagram?`<img class="assessment-diagram" src="/assessment/diagrams/${esc(q.diagram)}" alt="${esc(q.diagramAlt)}">`:''}<label for="nov2-answer">Your answer</label><textarea id="nov2-answer" ${entry.checked?'disabled':''} required>${esc(entry.value||'')}</textarea>${!entry.checked?'<button class="primary" type="submit">Check answer</button>':''}</form>${entry.checked?feedback(q,entry):`<details class="nov2-hint"><summary>Show a hint</summary><p>${esc(q.hint)}</p></details>`}<details><summary>Practice settings</summary>${settings()}</details></section>`;
      const input=document.getElementById('nov2-answer');
      input.addEventListener('input',()=>{state.answers[q.id]={value:input.value};save()});
      document.getElementById('nov2-answer-form').addEventListener('submit',e=>{
        e.preventDefault();if(entry.checked||!input.value.trim())return;
        const result=LuxBiologyNov2.grade(q,input.value);
        state.answers[q.id]={value:input.value,result,checked:true};
        state.history[q.id]={credit:result.credit,topic:q.topic,at:Date.now()};save();render();document.getElementById('nov2-feedback').scrollIntoView({block:'nearest'});
      });
      document.getElementById('nov2-next')?.addEventListener('click',()=>{state.index++;save();render();});
    }else{
      const completed=state.ids.length>0&&state.index>=state.ids.length;
      const earned=state.ids.reduce((sum,id)=>sum+(state.answers[id]?.result?.matched||0),0),total=state.ids.reduce((sum,id)=>sum+(bank.find(q=>q.id===id)?.marks||0),0);
      app.innerHTML=`<section class="panel">${completed?`<h2>Practice set complete</h2><p class="nov2-result">${earned} / ${total} marks · ${Math.round(100*earned/Math.max(1,total))}%</p><p>Review the missed points, then try a different set or choose “Retry my mistakes”. Practice marks are separate from school grades and formal mastery.</p><p><a href="/assessment/?paper=biology-nov2">Ready? Take the timed assessment →</a></p>`:'<h2>Choose a short practice set</h2>'}${settings()}${completed?`<details><summary>Review this set</summary>${state.ids.map(id=>{const question=bank.find(q=>q.id===id),answer=state.answers[id];return question&&answer?.checked?`<article><h3>${esc(question.prompt)}</h3><p><b>Your answer:</b> ${esc(answer.value)}</p><p><b>Model:</b> ${esc(question.modelAnswer)}</p><ul>${question.answer.points.map((p,i)=>`<li>${answer.result.pointResults[i]?'✓':'○'} ${esc(p.label)}</li>`).join('')}</ul></article>`:''}).join('')}</details>`:''}</section>`;
    }
    document.getElementById('nov2-start').addEventListener('click',start);
  }
  fetch('/assessment/biology-nov2-20261017.json?v=1').then(r=>{if(!r.ok)throw Error('Question bank unavailable');return r.json()}).then(data=>{
    bank=data.questions;
    if(!Array.isArray(bank)||!bank.length)throw Error('Empty question bank');
    if(state.ids.some(id=>!bank.some(q=>q.id===id))){state.ids=[];state.index=0;state.answers={};save();}
    render();
  }).catch(()=>{app.innerHTML='<p role="alert">Could not load the question bank. Please reload to try again. Saved answers have not been removed.</p>'});
})();
