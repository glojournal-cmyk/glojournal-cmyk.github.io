const PAPERS=[
  {id:'french',name:'French · Unit 1 vocabulary',subtitle:'Une visite en France · school test 8 Oct',bank:'/assessment/french-school-1.json',count:25,minutes:25,groups:{'Core phrases':4,'Intensifiers':3,'Descriptive adjectives':5,'Positive adjectives':5,'Pronouns':5,'Transport':3}},
  {id:'chemistry',name:'Chemistry · school test and RP6',subtitle:'Periodic Table, separation and chromatography',bank:'/assessment/chemistry-school-1.json',count:30,minutes:45,groups:{'Periodic table':6,'Separation':7,'RP6 method':4,'RP6 errors':4,'Chromatogram':3,'Rf':4,'Solvents':1,'RP6':1}},
  {id:'latin-creusa',name:'Latin · The Loss of Creusa',subtitle:'English-text comprehension · Aeneid Book II · school reading',bank:'/assessment/latin-creusa-1.json',count:24,minutes:40,groups:{'Escape from Troy':6,'The search':6,'Creusa’s ghost':6,'Prophecy and themes':6}},
  ...['latin','biology','physics','english'].map(id=>({id,name:id[0].toUpperCase()+id.slice(1)+' · Year 9 assessment',subtitle:'Mixed topics from the Year 9 question bank',bank:`/assessment/banks/${id}.json`,count:30,minutes:35}))
];
const KEY='lux-assessment-v1', $=s=>document.querySelector(s);
let state;try{state=JSON.parse(localStorage.getItem(KEY))||{}}catch{state={}}
state.tracker||=[];state.results||=[];state.drafts||={};state.recent||={};
let timer=null;
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function show(tab){clearInterval(timer);timer=null;document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('selected',b.dataset.tab===tab));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('hidden',p.id!==tab));if(tab==='tracker')tracker();if(tab==='history')history()}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>show(b.dataset.tab)));
function cards(){$('#paper-list').innerHTML=PAPERS.map(p=>`<article class="card"><span class="tag">${p.minutes} min · ${p.count} questions · pass 85%</span><h3>${esc(p.name)}</h3><p>${esc(p.subtitle)}</p><button class="primary" data-paper="${p.id}">${state.drafts[p.id]?.version===2?'Continue test':'Start new paper'}</button></article>`).join('')}
cards();$('#paper-list').addEventListener('click',e=>{const b=e.target.closest('[data-paper]');if(b)start(b.dataset.paper)});
$('#track-form').addEventListener('submit',e=>{e.preventDefault();state.tracker.push({...Object.fromEntries(new FormData(e.target)),id:crypto.randomUUID()});save();e.target.reset();tracker()});
function tracker(){const entries=[...state.tracker].sort((a,b)=>a.date.localeCompare(b.date));$('#tracker-list').innerHTML=entries.length?entries.map(x=>`<article class="entry"><div><span class="tag">${esc(x.subject)} · ${esc(x.date)} · ${esc(x.status)}</span><h3>${esc(x.title)}</h3>${x.score?`<p><b>Result:</b> ${esc(x.score)}</p>`:''}${x.notes?`<p>${esc(x.notes)}</p>`:''}</div><button data-delete="${x.id}">Delete</button></article>`).join(''):'<p class="muted">No school assessments recorded yet.</p>'}
$('#tracker-list').addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(b&&confirm('Delete this assessment?')){state.tracker=state.tracker.filter(x=>x.id!==b.dataset.delete);save();tracker()}});
function history(){$('#history-list').innerHTML=state.results.length?[...state.results].reverse().map(x=>`<article class="entry"><div><span class="tag">${esc(x.date)} · ${esc(x.paper)}</span><h3>${x.correct}/${x.total} · ${Math.round(x.correct/x.total*100)}/100 · ${Math.round(x.correct/x.total*100)>=85?'Passed':'Revise and retry'}</h3></div></article>`).join(''):'<p class="muted">Finish a paper to see its result here.</p>'}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function select(questions,count,recent=[],quotas=null){
 const pool=shuffle(questions);const old=new Set(recent),chosen=[],concepts=new Set();
 const take=(items,n)=>{for(const q of items){if(chosen.length>=count||n<=0)break;const concept=q.conceptId||q.id;if(concepts.has(concept))continue;chosen.push(q);concepts.add(concept);n--}};
 if(quotas)for(const [group,n] of Object.entries(quotas)){const subset=pool.filter(q=>q.topic===group);take(subset.filter(q=>!old.has(q.id)),n);if(chosen.filter(q=>q.topic===group).length<n)take(subset.filter(q=>old.has(q.id)),n-chosen.filter(q=>q.topic===group).length)}
 take(pool.filter(q=>!old.has(q.id)),count-chosen.length);take(pool.filter(q=>old.has(q.id)),count-chosen.length);
 return shuffle(chosen.slice(0,count));
}
function selectCreusa(questions,recent){
 const picked=[];
 for(const topic of ['Escape from Troy','The search','Creusa’s ghost','Prophecy and themes']){
  const group=questions.filter(q=>q.topic===topic);
  picked.push(...select(group.filter(q=>q.options?.length),3,recent));
  picked.push(...select(group.filter(q=>!q.options?.length),3,recent));
 }
 return shuffle(picked);
}
function normal(x,rule={}){let s=String(x).trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').replace(/[.!?]+$/,'');if(rule.ignoreFrenchDiacriticsForScore)s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');return rule.ignorePunctuationForScore?s.replace(/[^a-z0-9]/g,''):s}
function correct(q,value){if(!value?.trim())return false;const rule=q.answer?.normalization||{};if(q.answer?.mode==='keywords'){
  const response=String(value).toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  return q.answer.required.every(group=>group.some(term=>response.includes(term.toLowerCase())));
 }return (q.answer?.accepted||[]).some(a=>normal(a,rule)===normal(value,rule))}
async function start(id){const p=PAPERS.find(x=>x.id===id);if(!p)return;show('exam');$('#exam').innerHTML='<h2>Preparing a new paper…</h2>';
 try{let draft=state.drafts[id];if(draft?.version!==2||(id==='latin-creusa'&&draft.questions.every(q=>q.options?.length))){delete state.drafts[id];draft=null}
  if(draft&&id==='chemistry'&&draft.questions.some(q=>!q.markKeywords?.length)){const fresh=await fetch(p.bank).then(r=>r.json());const byId=new Map(fresh.questions.map(q=>[q.id,q]));draft.questions=draft.questions.map(q=>byId.get(q.id)||q);save()}
  if(!draft){const res=await fetch(p.bank);if(!res.ok)throw Error('Question bank unavailable');const bank=await res.json();const pool=bank.groups?bank.groups.flatMap(g=>g.questions):bank.questions;
   const valid=pool.filter(q=>q.prompt&&q.answer?.accepted?.length&&['choice','exact_or_equivalent','keywords'].includes(q.answer.mode));
   const previous=state.recent[id]||[];let quotas=p.groups;if(!quotas&&bank.groups){quotas={};bank.groups.forEach((g,i)=>{quotas[g.title]=Math.floor(p.count/bank.groups.length)+(i<p.count%bank.groups.length?1:0)})}let selected=id==='latin-creusa'?selectCreusa(valid,previous):select(valid,p.count,previous,quotas);
   if(selected.length<p.count)throw Error('Not enough questions in this bank');
   if(previous.length&&selected.map(q=>q.id).join('|')===previous.join('|'))selected=shuffle(selected);
   draft={version:2,questions:selected,answers:{},index:0,remaining:p.minutes*60,running:true,started:Date.now()};state.drafts[id]=draft;save()
  }renderTest(p,draft)
 }catch(e){$('#exam').innerHTML=`<h2>Could not prepare this paper</h2><p>${esc(e.message)}</p><button id="back">Back to papers</button>`;$('#back').onclick=()=>show('papers')}
}
function renderTest(p,d){
 function displayClock(){const clock=$('#clock');if(clock)clock.textContent=`${Math.floor(d.remaining/60)}:${String(d.remaining%60).padStart(2,'0')}`}function tick(){if(d.running&&d.remaining>0){d.remaining--;if(d.remaining%5===0)save()}else if(d.running&&d.remaining<=0){finish(p,d);return}displayClock()}
 function draw(){const i=d.index,q=d.questions[i],answer=d.answers[i]||'';
  $('#exam').innerHTML=`<div class="exam-top"><div><span class="tag">${esc(p.name)} · ${p.minutes} min · pass 85%</span><h2>Question ${i+1} of ${d.questions.length}</h2></div><strong id="clock" aria-label="Time remaining"></strong></div><div class="progress"><div style="width:${100*(i+1)/d.questions.length}%"></div></div><p class="muted">Answers are saved. Marking and model answers appear after you submit the whole paper.</p>${q.passage?`<div class="feedback" style="white-space:pre-line;line-height:1.7"><b>Read the extract</b><br>${esc(q.passage)}</div>`:''}<p class="question">${esc(q.prompt)}</p>${q.diagram?`<img class="assessment-diagram" src="/assessment/diagrams/${esc(q.diagram)}" alt="Question diagram">`:''}${Array.isArray(q.options)&&q.options.length?`<div id="choices">${q.options.map(o=>`<button class="choice ${answer===String(o)?'chosen':''}" data-choice="${esc(o)}">${esc(o)}</button>`).join('')}</div>`:`<label>Your answer<textarea class="answer" id="response" placeholder="Write your answer here">${esc(answer)}</textarea></label>`}<div class="exam-actions"><button id="prev" ${i===0?'disabled':''}>Previous</button><button id="next" class="primary">${i===d.questions.length-1?'Submit whole paper':'Next question'}</button></div><div class="exam-actions" style="margin-top:18px"><button id="pause">${d.running?'Pause timer':'Resume timer'}</button><button id="exit">Back to assessments</button></div>`;
  $('#response')?.addEventListener('input',e=>{d.answers[i]=e.target.value;save()});
  $('#choices')?.addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(b){d.answers[i]=b.dataset.choice;save();draw()}});
  $('#prev').onclick=()=>{d.index--;save();draw()};$('#next').onclick=()=>{if(i===d.questions.length-1){if(confirm('Submit the whole paper for marking?'))finish(p,d)}else{d.index++;save();draw()}};
  $('#pause').onclick=()=>{d.running=!d.running;save();draw()};$('#exit').onclick=()=>{save();show('papers');cards()};displayClock()
 }
 draw();timer=setInterval(tick,1000)
}

function showAnswer(q){
  const clean=s=>String(s||'').replace(/\s*(?:\.{3}|…)+\s*$/g,'').trim();
  const model=clean(q.modelAnswer);
  if(model) return model;
  const list=[...new Set((q.answer?.accepted||[]).map(clean).filter(Boolean))];
  return list.join(' / ');
}
function finish(p,d){clearInterval(timer);timer=null;let earned=0;const rows=d.questions.map((q,i)=>{const answer=d.answers[i]||'',right=correct(q,answer);if(right)earned++;return `<article class="entry"><div><span class="tag">Question ${i+1} · ${right?'Correct':'Incorrect'} · ${esc(q.topic||'')}</span><p>${esc(q.prompt)}</p><p><b>Your answer:</b> ${esc(answer)||'—'}</p><p><b>Model answer:</b> ${esc(showAnswer(q))}</p>${p.id==='chemistry'||q.markKeywords?`<p><b>Marking keywords:</b> ${esc((q.markKeywords||q.answer.accepted).join(' · '))}</p><p class="muted"><b>Hint for next time:</b> ${esc(q.hint||q.feedback?.short||'Check the evidence in the question before choosing a method.')}</p>`:q.feedback?.short?`<p class="muted">${esc(q.feedback.short)}</p>`:''}</div></article>`});
 const score=Math.round(earned/d.questions.length*100);const missed={};d.questions.forEach((q,i)=>{if(!correct(q,d.answers[i]||''))missed[q.topic||'Other']=(missed[q.topic||'Other']||0)+1});const focus=Object.entries(missed).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([topic,n])=>`${esc(topic)} (${n})`).join(' · ');state.results.push({date:new Date().toLocaleDateString('en-GB'),paper:p.name,correct:earned,total:d.questions.length});state.recent[p.id]=d.questions.map(q=>q.id);delete state.drafts[p.id];save();cards();
 $('#exam').innerHTML=`<h2>${score>=85?'Passed':'Not yet passed'} · ${score}/100</h2><p>${earned}/${d.questions.length} correct. Pass mark: 85/100. Review the answers below, then start a new paper for a different selection.</p>${focus?`<p class="feedback"><b>Revise next:</b> ${focus}</p>`:''}${p.id==='chemistry'?'<p class="muted">Each question is worth one mark. The keywords show the idea needed for that mark; the hint suggests what to check next time.</p>':''}<button id="back-to-papers" class="primary">New paper</button><div class="entries">${rows.join('')}</div>`;
 $('#back-to-papers').onclick=()=>show('papers')
}
