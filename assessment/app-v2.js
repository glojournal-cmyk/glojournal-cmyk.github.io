const PAPERS=[
  {id:'biology-cell-structure',name:'Biology · AQA 4.1.1 Cell structure',subtitle:'First GCSE Biology assessment · week beginning 16 November 2026 · all six sections · 60 marks',bank:'/assessment/biology-cell-structure-20261003.json',count:24,minutes:45,groups:{'Eukaryotes and prokaryotes':4,'Animal and plant cells':4,'Cell specialisation':4,'Cell differentiation':4,'Microscopy':4,'Culturing microorganisms':4}},
  {id:'french',name:'French · Unit 1 vocabulary',subtitle:'Une visite en France · school test 8 Oct',bank:'/assessment/french-school-1.json',count:25,minutes:25,groups:{'Core phrases':4,'Intensifiers':3,'Descriptive adjectives':5,'Positive adjectives':5,'Pronouns':5,'Transport':3}},
  {id:'chemistry',name:'Chemistry · school test and RP6',subtitle:'Periodic Table, separation and chromatography',bank:'/assessment/chemistry-school-1.json',count:30,minutes:45,groups:{'Periodic table':4,'Separation':4,'RP6 method':4,'RP6 errors':2,'Chromatogram':4,'Rf':9,'Solvents':1,'RP6':2}},
  {id:'latin-verbs',name:'Latin · Regular verbs',subtitle:'Tomorrow’s table · Latin → English · porto, moneo, traho, audio · present, imperfect and perfect only',bank:'/assessment/latin-verbs-1.json',count:24,minutes:25,groups:{'Present':8,'Imperfect':8,'Perfect':8}},
  {id:'latin-creusa',name:'Latin · The Loss of Creusa',subtitle:'English-text comprehension · Aeneid Book II · school reading',bank:'/assessment/latin-creusa-1.json',count:24,minutes:40,groups:{'Escape from Troy':6,'The search':6,'Creusa’s ghost':6,'Prophecy and themes':6}},
  {id:'latin-conjugations',name:'Latin · Present and imperfect verbs',subtitle:'School assessment 28 Sep · conjugations, endings and two-way translation',bank:'/assessment/latin-conjugations-20260928.json',count:25,minutes:35,groups:{'Conjugation and stems':4,'English to Latin':12,'Latin to English':6,'Spot and repair':3}},
  {id:'biology-school',name:'Biology · Cells and practicals',subtitle:'Year 9 school lessons · structures, size, microscopy, specialised cells, bacteria and aseptic reasoning',bank:'/assessment/biology-school-20260927.json',count:30,minutes:45,groups:{'Cell structure':5,'Size and scale':5,'Microscopy practical':5,'Specialised cells':5,'Bacteria and division':5,'Aseptic reasoning':5}},
  ...['latin','biology','physics','english'].map(id=>({id,name:id[0].toUpperCase()+id.slice(1)+' · Year 9 assessment',subtitle:'Mixed topics from the Year 9 question bank',bank:`/assessment/banks/${id}.json`,count:30,minutes:35}))
];

const GARDEN_KEY='lux-scholar-garden-v1';
const PRIZES={
  french:{outfit:'breton',name:'Breton'},
  chemistry:{outfit:'lab-coat',name:'Laboratory Coat'},
  'latin-verbs':{outfit:'laurel',name:'Laurel'},
  'latin-creusa':{outfit:'stola',name:'Latin Play'},
  latin:{outfit:'latin',name:'Prize Day'},
  biology:{outfit:'lab-goggles',name:'Science Practical'},
  physics:{outfit:'blazer',name:'School Blazer'},
  english:{outfit:'concert-blouse',name:'Concert Blouse'}
};

function grantWardrobe(id){
  const prize=PRIZES[id];
  if(!prize)return null;
  let raw;try{raw=JSON.parse(localStorage.getItem(GARDEN_KEY)||'{}')}catch{raw={}}
  const wrapped=!!(raw&&raw.state&&typeof raw.state==='object'&&!Array.isArray(raw.state));
  const garden=wrapped?raw.state:(raw&&typeof raw==='object'?raw:{});
  const passed=Array.isArray(garden.passedPapers)?garden.passedPapers:[];
  const owned=Array.isArray(garden.unlockedOutfits)?garden.unlockedOutfits:['day'];
  const already=passed.includes(id)||owned.includes(prize.outfit);
  if(!passed.includes(id))garden.passedPapers=[...passed,id];
  if(!owned.includes(prize.outfit))garden.unlockedOutfits=[...owned,prize.outfit];
  if(wrapped)raw.state=garden;else raw=garden;
  localStorage.setItem(GARDEN_KEY,JSON.stringify(raw));
  return {...prize,fresh:!already};
}

const KEY='lux-assessment-v1', $=s=>document.querySelector(s);
const CHEMISTRY_REVISION='20260930-chem-fullmarks3';
const bankUrl=p=>p.id==='biology-cell-structure'?`${p.bank}?v=20261004-ux-rest3`:p.id==='chemistry'?`${p.bank}?v=${CHEMISTRY_REVISION}`:`${p.bank}?v=20261004-ux-rest3`;
const DIAGRAM_ALTS={
  'setup.svg':'Figure 1: chromatography beaker, paper, start line and sample spots',
  'inks.svg':'Figure 2: chromatogram with ink samples A to D',
  'rf.svg':'Figure 3: chromatogram and millimetre ruler measured from the start line',
  'biology-field-20260927.svg':'Five onion epidermal cells span a microscope field of view measuring 0.50 millimetres across',
  'solvents.svg':'Figure 4: two chromatograms made using water and ethanol',
  'teacher-style.svg':'Chromatogram with reference colours A to E and an unknown black sample'
};
let state;try{state=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(KEY+'-recovery'))||{}}catch{try{state=JSON.parse(localStorage.getItem(KEY+'-recovery'))||{}}catch{state={}}}
state.tracker||=[];state.results||=[];state.drafts||={};state.recent||={};
if(new URLSearchParams(location.search).get('subject')==='biology')sessionStorage.setItem('lux-assess-subject','Biology');
let timer=null;

function save(){try{const data=JSON.stringify(state);localStorage.setItem(KEY,data);localStorage.setItem(KEY+'-recovery',data);let el=document.getElementById('assessment-save-status');if(!el){el=document.createElement('p');el.id='assessment-save-status';el.setAttribute('role','status');document.querySelector('.intro').append(el)}el.textContent='Saved on this device · '+new Date().toLocaleTimeString('en-GB');}catch{let el=document.getElementById('assessment-save-status');if(!el){el=document.createElement('p');el.id='assessment-save-status';document.querySelector('.intro').append(el)}el.textContent='Save failed. Keep this page open and export your progress before closing.';}}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function show(tab){
  clearInterval(timer);timer=null;
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('selected',b.dataset.tab===tab));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('hidden',p.id!==tab));
  if(tab==='tracker')tracker();
  if(tab==='history')history();
}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>show(b.dataset.tab)));

function examToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function examWhen(exam){if(!exam)return '';const [y,m,day]=exam.split('-').map(Number);return new Date(y,m-1,day).toLocaleDateString('en-GB',{day:'numeric',month:'long'})}
const EXAM_GROUPS=[
  {subject:'Latin',exam:'2026-09-28',ids:['latin-verbs','latin-conjugations','latin-creusa','latin']},
  {subject:'Chemistry',exam:'2026-10-05',ids:['chemistry']},
  {subject:'English',exam:'2026-09-30',ids:['english']},
  {subject:'French',exam:'2026-10-08',ids:['french']},
  {subject:'Biology',exam:'',examWeek:'2026-11-16',ids:['biology-cell-structure','biology-school','biology']},
  {subject:'Physics',exam:'',ids:['physics']}
];
function groupBlurb(group,today){
  const when=group.exam?examWhen(group.exam):'';
  if(group.subject==='Latin')return today>group.exam?`Exam ${when} has passed. Regular verbs and The Loss of Creusa are now in Practise.`:`Exam ${when}. Start with Regular verbs: porto, moneo, traho and audio, Latin into English, present, imperfect and perfect. Those questions, and The Loss of Creusa, join Practise the next day.`;
  if(group.subject==='Chemistry')return 'Assessment in the week beginning 5 October 2026; exact lesson date awaits confirmation. Revise atoms, separating mixtures, history of the periodic table and RP6 chromatography.';
  if(group.subject==='English')return `Exam ${when}. These Year 9 questions are already in Practise.`;
  if(group.subject==='Biology')return 'First GCSE Biology assessment: week beginning 16 November 2026 (exact lesson date to be confirmed). AQA 4.1.1 Cell structure only. New paper: 45 minutes, 24 short questions, 60 marks, pass 51/60. Includes microscopy and culturing microorganisms.';
  if(group.exam)return today>group.exam?`Exam ${when} has passed. These questions are now in Practise.`:`Exam ${when}. These questions join Practise the next day.`;
  return 'Mixed questions from the Year 9 bank. Already in Practise.';
}
function paperCard(p){
  const prize=PRIZES[p.id];
  return `<article class="card"><span class="tag">Year 9 · ${p.bank.includes('/banks/')?'Mixed assessment':'School topic'}</span><span class="tag">${p.minutes} min · ${p.count} questions · pass 85%</span><h3>${esc(p.name.replace(/^[^·]+·\s*/,''))}</h3><p>${esc(p.subtitle)}</p>${p.id==='biology-cell-structure'?'<p><a href="/assessment/biology-cell-structure/">Revision guide and 72-question bank →</a></p>':''}${prize?`<p class="muted">Pass once to unlock ${esc(prize.name)} in the wardrobe.</p>`:''}<button class="primary" data-paper="${p.id}">${state.drafts[p.id]?.version===2?'Continue test':'Start new paper'}</button>${p.id==='chemistry'&&state.drafts[p.id]?.version===2?` <button data-reset-paper="chemistry">Discard draft and start a fresh paper</button>`:''}</article>`
}
function cards(){
  if(!document.getElementById('exam-group-style')){const s=document.createElement('style');s.id='exam-group-style';s.textContent='.subject-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:2px 0 14px;position:sticky;top:8px;z-index:4;background:#f6f1e6;padding:8px 0}.subject-bar button{border-radius:999px;padding:8px 14px;background:#fffaf3;border:1px solid rgba(196,164,106,.75);color:#1A3148}.subject-bar button.on{background:#1A3148;color:#f7f1e6;border-color:#1A3148}.subject-bar .add-assess{margin-left:auto}.subject-list{display:flex;flex-direction:column;gap:12px}.subject-block{padding-top:0;border-top:0}.subject-block h2{font-size:32px}.subject-block .when{margin:6px 0 0;color:#62717a;max-width:42rem}.subject-block .cards{margin-top:12px}.subject-block .card p{min-height:0}';document.head.appendChild(s)}
  if(!document.getElementById('subject-bar')){const bar=document.createElement('div');bar.id='subject-bar';bar.className='subject-bar';$('#paper-list').before(bar);bar.addEventListener('click',e=>{if(e.target.closest('[data-add-assess]')){show('tracker');document.getElementById('track-form')?.querySelector('input,select')?.focus();return}const b=e.target.closest('[data-subject]');if(!b)return;sessionStorage.setItem('lux-assess-subject',b.dataset.subject);cards()})}
  if(!document.getElementById('assessment-filters')){
    const filters=document.createElement('div');filters.id='assessment-filters';filters.className='assessment-filters';
    filters.innerHTML='<label>Find an assessment<input id="assessment-search" type="search" placeholder="Search title or topic…"></label><label>Paper type<select id="assessment-kind"><option value="all">All papers</option><option value="school">School topics</option><option value="mixed">Mixed assessments</option></select></label>';
    $('#paper-list').before(filters);
    filters.addEventListener('input',cards);filters.addEventListener('change',cards);
  }
  const group=EXAM_GROUPS.find(g=>g.subject===sessionStorage.getItem('lux-assess-subject'))||EXAM_GROUPS[0];
  $('#subject-bar').innerHTML=EXAM_GROUPS.map(g=>`<button type="button" data-subject="${esc(g.subject)}" class="${g.subject===group.subject?'on':''}">${esc(g.subject)}</button>`).join('')+'<button type="button" class="add-assess" data-add-assess>Add assessment</button>';
  const allPapers=group.ids.map(id=>PAPERS.find(p=>p.id===id)).filter(Boolean),query=$('#assessment-search').value.trim().toLowerCase(),kind=$('#assessment-kind').value;
  const papers=allPapers.filter(p=>(kind==='all'||(p.bank.includes('/banks/')?'mixed':'school')===kind)&&(!query||`${p.name} ${p.subtitle} ${Object.keys(p.groups||{}).join(' ')}`.toLowerCase().includes(query)));
  const root=$('#paper-list');root.className='subject-list';const today=examToday();
  root.innerHTML=`<section class="subject-block"><h2>${esc(group.subject)}</h2><p class="muted">Year 9 · ${papers.length} of ${allPapers.length} papers · <a href="/study/${group.subject.toLowerCase()}/">Browse notes and topic practice →</a></p><p class="when">${esc(groupBlurb(group,today))}</p><div class="cards">${papers.length?papers.map(paperCard).join(''):'<p class="muted" role="status">No matching papers. Try another keyword or paper type.</p>'}</div></section>`;
}
cards();
$('#paper-list').addEventListener('click',e=>{
  const reset=e.target.closest('[data-reset-paper]');
  if(reset){
    const draft=state.drafts.chemistry;
    if(draft&&Object.keys(draft.answers||{}).length&&!confirm('Discard your saved Chemistry answers and start a fresh paper?'))return;
    delete state.drafts.chemistry;save();cards();start('chemistry');return;
  }
  const b=e.target.closest('[data-paper]');if(b)start(b.dataset.paper);
});

$('#track-form').addEventListener('submit',e=>{
  e.preventDefault();
  state.tracker.push({...Object.fromEntries(new FormData(e.target)),id:crypto.randomUUID()});
  save();e.target.reset();tracker();
});
const SCHOOL_ASSESSMENTS=globalThis.LuxSchoolRevision.schoolAssessments;
function tracker(){
  const school=SCHOOL_ASSESSMENTS.filter(x=>!(state.hiddenSchoolAssessments||[]).includes(x.id));
  const entries=[...school,...state.tracker].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  $('#tracker-list').innerHTML=entries.length?entries.map(x=>{
    const isSchool=school.some(s=>s.id===x.id);
    const results=isSchool?state.results.filter(r=>r.paperId===x.paperId):[];
    const latest=results[results.length-1];
    const phase=globalThis.LuxSchoolRevision.buildRevisionPlan({},state).active.find(a=>a.id===x.id)?.phase;
    const trackerStatus=x.status||(phase==='current'?(x.dateKind==='week'?'Assessment week':'Today'):phase==='upcoming'?'Upcoming':'School result not recorded');
    const topicLinks=(x.topics||[]).map(topic=>`<p><a href="/study/${x.subject.toLowerCase()}/learn?year=9&topic=${encodeURIComponent(topic)}">Notes · ${esc(({'chem-y9-c5':'Atoms','chem-y9-c1':'History of the periodic table','chem-y9-c3':'Separating mixtures','chem-y9-c4':'Chromatography','fr-y9-20260919-unit-1-holidays-and-opinions':'Holidays and opinions','fr-y9-u1-paris-travel':'Travel and transport','bio-y9-b1':'Cell structure','bio-y9-b2':'Specialised cells','bio-y9-b3':'Microscopy','bio-y9-b4':'Culturing microorganisms'})[topic]||x.title)}</a> · <a href="/study/${x.subject.toLowerCase()}/practise?year=9&mode=standard&topic=${encodeURIComponent(topic)}">Practise this topic</a></p>`).join('');
    const links=isSchool?`${topicLinks}<p>${x.subject==='Biology'?' · <a href="/assessment/biology-cell-structure/">Cell structure revision guide</a>':''}</p><button class="primary" data-tracker-paper="${esc(x.paperId)}">${state.drafts[x.paperId]?.version===2?'Continue practice paper':'Start practice paper'}</button>`:'';
    return `<article class="entry"><div><span class="tag">${esc(x.subject)} · ${esc(x.dateLabel||x.date)} · ${esc(trackerStatus)}</span><h3>${esc(x.title)}</h3>${x.score?`<p><b>School result:</b> ${esc(x.score)}</p>`:''}${x.notes?`<p>${esc(x.notes)}</p>`:''}${latest?`<p><b>Latest app practice:</b> ${esc(latest.score)}% · ${esc(latest.date)}</p>`:''}${links}</div><button data-delete="${esc(x.id)}">${isSchool?'Hide':'Delete'}</button></article>`;
  }).join(''):'<p class="muted">No school assessments recorded yet. Add one below.</p>';
  $('#tracker-list').insertAdjacentHTML('beforeend','<p class="muted">Other future school assessments: dates and ranges await teacher confirmation. Practice results are separate from school grades.</p>');
}
$('#tracker-list').addEventListener('click',e=>{
  const paper=e.target.closest('[data-tracker-paper]');
  if(paper){start(paper.dataset.trackerPaper);return}
  const b=e.target.closest('[data-delete]');
  if(b&&confirm('Remove this assessment from your tracker?')){
    if(SCHOOL_ASSESSMENTS.some(x=>x.id===b.dataset.delete)){
      state.hiddenSchoolAssessments=[...new Set([...(state.hiddenSchoolAssessments||[]),b.dataset.delete])];
    }else state.tracker=state.tracker.filter(x=>x.id!==b.dataset.delete);
    save();tracker();
  }
});

function formatMarks(n){
  return Number.isInteger(n)?String(n):Number(n.toFixed(2)).toString();
}
function history(){
  $('#history-list').innerHTML=state.results.length?[...state.results].reverse().map(x=>{
    const marks=Number.isFinite(x.marks)?x.marks:x.correct;
    const score=Number.isFinite(x.score)?x.score:Math.round(marks/x.total*100);
    return `<article class="entry"><div><span class="tag">${esc(x.date)} · ${esc(x.paper)}</span><h3>${formatMarks(marks)}/${x.total} marks · ${score}/100 · ${score>=85?'Passed':'Revise and retry'}</h3>${x.questions?.length&&followupItems(x).length?`<p>${followupItems(x).length} missed or partly correct questions to revisit.</p><button class="primary" data-followup="${state.results.indexOf(x)}">Practise these weak areas</button>`:''}</div></article>`;
  }).join(''):'<p class="muted">Finish a paper to see its result here.</p>';
}

$('#history-list').addEventListener('click',e=>{const button=e.target.closest('[data-followup]');if(button)startFollowup(Number(button.dataset.followup))});

function shuffle(a){
  const b=[...a];
  for(let i=b.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [b[i],b[j]]=[b[j],b[i]];
  }
  return b;
}
function select(questions,count,recent=[],quotas=null){
  const pool=shuffle(questions),old=new Set(recent),chosen=[],concepts=new Set();
  const take=(items,n)=>{
    for(const q of items){
      if(chosen.length>=count||n<=0)break;
      const concept=q.conceptId||q.id;
      if(concepts.has(concept))continue;
      chosen.push(q);concepts.add(concept);n--;
    }
  };
  if(quotas)for(const [group,n] of Object.entries(quotas)){
    const subset=pool.filter(q=>q.topic===group);
    take(subset.filter(q=>!old.has(q.id)),n);
    if(chosen.filter(q=>q.topic===group).length<n)take(subset.filter(q=>old.has(q.id)),n-chosen.filter(q=>q.topic===group).length);
  }
  take(pool.filter(q=>!old.has(q.id)),count-chosen.length);
  take(pool.filter(q=>old.has(q.id)),count-chosen.length);
  return shuffle(chosen.slice(0,count));
}
function chemistryLevel(q){
  if(Number(q.difficulty))return Number(q.difficulty);
  if(q.workedSolution||q.topic==='Rf'){
    if(/difference|gap|ruler|reading|mean|average/i.test(q.prompt))return 4;
    if(/rearrang|front.*distance|distance.*front/i.test(q.prompt)&&/Rf.*0\./i.test(q.prompt))return 3;
    return 2;
  }
  if(q.options?.length||/^(name|state|identify|give the name)/i.test(q.prompt))return 1;
  return /explain|evaluate|why/i.test(q.prompt)?3:2;
}
function chemistryStage(q){return ['','Foundation','Application','Explanation and evidence','Multi-step challenge'][Math.min(4,Math.max(1,chemistryLevel(q)))]}
function selectChemistry(questions,count,recent=[],quotas={}){
  const old=new Set(recent),chosen=[],concepts=new Set(),diagrams=new Set(),ids=new Set();
  const groups=Object.keys(quotas);
  const bucket=(q)=>q.options?.length?'choice':'written';
  const take=(items,n)=>{
    let added=0;
    for(const q of items){
      if(chosen.length>=count||added>=n)break;
      const concept=q.conceptId||q.id;
      if(ids.has(q.id)||concepts.has(concept)||(q.diagram&&diagrams.has(q.diagram)))continue;
      chosen.push(q);ids.add(q.id);concepts.add(concept);
      if(q.diagram)diagrams.add(q.diagram);
      added++;
    }
    return added;
  };
  const ordered=(items)=>{
    const fresh=items.filter(q=>!old.has(q.id)),seen=items.filter(q=>old.has(q.id));
    return [...shuffle(fresh.filter(q=>bucket(q)==='written')),
      ...shuffle(seen.filter(q=>bucket(q)==='written')),
      ...shuffle(fresh.filter(q=>bucket(q)==='choice')),
      ...shuffle(seen.filter(q=>bucket(q)==='choice'))];
  };
  for(const group of groups){
    const items=questions.filter(q=>q.topic===group);
    const style=items.filter(q=>q.contentTier==='school_aqa_style');
    const foundations=style.filter(q=>chemistryLevel(q)===1);
    if(foundations.length)take(ordered(foundations),1);
    const selectedStyle=chosen.filter(q=>q.topic===group&&q.contentTier==='school_aqa_style').length;
    take(ordered(style),Math.max(0,Math.ceil(quotas[group]/2)-selectedStyle));
    const remaining=()=>quotas[group]-chosen.filter(q=>q.topic===group).length;
    take(ordered(items.filter(q=>q.contentTier!=='school_aqa_style')),remaining());
    take(ordered(style),remaining());
  }
  take(ordered(questions),count-chosen.length);
  return shuffle(chosen).sort((a,b)=>chemistryLevel(a)-chemistryLevel(b));
}
function selectBiology(questions,recent=[],quotas={}){
  const old=new Set(recent),out=[],usedDiagrams=new Set();
  for(const topic of Object.keys(quotas))for(const marks of [2,3]){
    const candidates=questions.filter(q=>q.topic===topic&&questionMarks(q)===marks);
    const ordered=[...shuffle(candidates.filter(q=>!old.has(q.id))),...shuffle(candidates.filter(q=>old.has(q.id)))];
    const chosen=[];
    // At most one question per image plate. Prefer unseen questions first.
    for(const q of ordered){
      if(q.diagram&&usedDiagrams.has(q.diagram))continue;
      if(chosen.length===2)break;
      chosen.push(q);if(q.diagram)usedDiagrams.add(q.diagram);
    }
    if(chosen.length!==2)throw Error('Biology bank cannot satisfy balanced mark quotas');
    out.push(...chosen);
  }
  // Ensure a new paper includes visual interpretation when available.
  for(const diagram of ['cells-20261003.webp','specialised-20261003.webp','microscopy-20261003.webp']){
    if(out.some(q=>q.diagram===diagram))continue;
    const candidates=questions.filter(q=>q.diagram===diagram);
    const candidate=shuffle(candidates.filter(q=>!old.has(q.id)))[0]||shuffle(candidates)[0];
    if(!candidate)continue;
    const i=out.findIndex(q=>q.topic===candidate.topic&&questionMarks(q)===questionMarks(candidate)&&!q.diagram);
    if(i>=0)out[i]=candidate;
  }
  return out.sort((a,b)=>Object.keys(quotas).indexOf(a.topic)-Object.keys(quotas).indexOf(b.topic)||questionMarks(a)-questionMarks(b));
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

function normal(x,rule={}){
  let s=String(x).trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').replace(/[.!?]+$/,'');
  if(rule.ignoreFrenchDiacriticsForScore)s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return rule.ignorePunctuationForScore?s.replace(/[^a-z0-9]/g,''):s;
}
function textWords(x){
  return String(x||'').toLowerCase().replace(/[’‘]/g,"'").normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9' ]/g,' ').split(/\s+/).filter(Boolean);
}
function canonWord(w){
  const word=String(w||'').toLowerCase();
  if(/^(burn|burnt|burned|burning|flame|flames)$/.test(word))return 'burn';
  if(/^(despair|despaired|desperate|desperately|desperation|desper)$/.test(word))return 'desper';
  if(/^(confuse|confused|confusing|confusion|confus)$/.test(word))return 'confus';
  if(/^(grief|grieve|grieved|grieving|sorrow|sad|sadness|mourn|mourning)$/.test(word))return 'grief';
  if(/^(search|searched|searching|look|looked|looking|find|finding|found)$/.test(word))return 'search';
  if(/^(risk|risked|risking|danger|dangerous)$/.test(word))return 'risk';
  if(/^(love|loved|loving|care|cared|caring|worried|worry)$/.test(word))return 'love';
  if(/^(surrender|surrendered|give|giving|continue|continued|continuing|journey|move|moving)$/.test(word))return word.startsWith('surr')||word==='give'?'continue':word.startsWith('cont')||word.startsWith('move')||word==='journey'?'continue':word;
  if(/^(ghost|spirit|shade)$/.test(word))return 'ghost';
  if(/^(hold|held|holding|touch|touched|touching|grasp|grasped|physical|solid)$/.test(word))return 'physical';
  if(/^(banish|banished|banishment|exile|exiled)$/.test(word))return 'exile';
  return word.replace(/(ing|ed|es|s)$/,'');
}
const STOP_WORDS=new Set(['a','an','the','to','of','and','or','was','were','is','are','be','been','being','it','he','she','they','his','her','their','this','that','with','for','in','on','at','from','as']);
function contentTokens(x){
  return textWords(x).map(canonWord).filter(w=>w&&!STOP_WORDS.has(w));
}
function termMatch(text,term){
  const hay=textWords(text).map(canonWord).filter(w=>w.length>=3&&!STOP_WORDS.has(w));
  const needles=contentTokens(term);
  if(!needles.length)return false;
  return needles.every(n=>hay.includes(n)||hay.some(h=>Math.min(h.length,n.length)>=4&&(h.startsWith(n)||n.startsWith(h))));
}
function equivalentCreusa(q,value){
  const rule=q.answer?.normalization||{};
  if((q.answer?.accepted||[]).some(a=>normal(a,rule)===normal(value,rule)))return true;
  const responseTokens=contentTokens(value);
  for(const a of q.answer?.accepted||[]){
    const target=contentTokens(a);
    if(target.length&&target.every(t=>responseTokens.includes(t)||responseTokens.some(r=>r.startsWith(t)||t.startsWith(r))))return true;
    const phrase=String(a).toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    const response=String(value).toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    if(phrase.length>=4&&(response.includes(phrase)||phrase.includes(response)))return true;
  }
  const prompt=String(q.prompt||'').toLowerCase();
  const response=String(value||'').toLowerCase();
  if(prompt.includes('exile')&&/\b(exile|exiled|banish|banished|banishment)\b/.test(response))return true;
  return false;
}

const CREUSA_PROMPT_CONTEXT=new Set(['creusa-2-06','creusa-3-06']);

function chemistryTermMatch(text,term){
  const words=s=>textWords(s).map(canonWord).filter(w=>w&&!STOP_WORDS.has(w));
  const hay=words(text),needles=words(term);
  return needles.length>0&&needles.every(n=>hay.includes(n)||hay.some(h=>Math.min(h.length,n.length)>=4&&(h.startsWith(n)||n.startsWith(h))));
}

function mark(q,value){
  if(!String(value||'').trim())return {credit:0,status:'Incorrect',matched:0,total:q.answer?.points?.length||1,pointResults:(q.answer?.points||[]).map(()=>false)};
  const mode=q.answer?.mode;
  const rule=q.answer?.normalization||{};
  const flexible=String(q.id||'').startsWith('creusa-');

  if(mode==='chemistry_rubric'){
    const points=q.answer.points||[];
    const response=String(value).normalize('NFKC').replace(/[’‘]/g,"'");
    const pointResults=points.map(point=>
      !(point.rejectPatterns||[]).some(pattern=>new RegExp(pattern,'i').test(response))&&
      ((point.alternatives||[]).some(term=>chemistryTermMatch(response,term))||
       (point.patterns||[]).some(pattern=>new RegExp(pattern,'i').test(response)))
    );
    const matched=pointResults.filter(Boolean).length;
    const credit=points.length?matched/points.length:0;
    return {credit,status:credit>=0.999?'Correct':credit>0?'Partly correct':'Incorrect',matched,total:points.length||1,pointResults};
  }

  if(mode==='choice'){
    const ok=(q.answer?.accepted||[]).some(a=>normal(a,rule)===normal(value,rule));
    return {credit:ok?1:0,status:ok?'Correct':'Incorrect',matched:ok?1:0,total:1};
  }

  if(mode==='keywords'){
    const groups=q.answer?.required||[];
    const response=String(value);
    // Short scientific terms such as Rf remain meaningful marking tokens.
    const keywordMatch=/^chem[-_]/.test(String(q.id||""))?chemistryTermMatch:termMatch;
    let matched=0;
    for(const group of groups){
      let hit=group.some(term=>keywordMatch(response,term));
      if(!hit&&flexible&&CREUSA_PROMPT_CONTEXT.has(q.id)){
        hit=group.some(term=>termMatch(q.prompt,term));
      }
      if(hit)matched++;
    }
    const credit=groups.length?matched/groups.length:0;
    if(!flexible){
      const ok=matched===groups.length;
      return {credit:ok?1:0,status:ok?'Correct':'Incorrect',matched,total:groups.length||1};
    }
    return {credit,status:credit>=0.999?'Correct':credit>0?'Partly correct':'Incorrect',matched,total:groups.length||1};
  }

  const exact=(q.answer?.accepted||[]).some(a=>normal(a,rule)===normal(value,rule));
  const ok=exact||(flexible&&equivalentCreusa(q,value));
  return {credit:ok?1:0,status:ok?'Correct':'Incorrect',matched:ok?1:0,total:1};
}
function correct(q,value){return mark(q,value).credit>=0.999}

async function start(id){
  const p=PAPERS.find(x=>x.id===id);if(!p)return;
  show('exam');$('#exam').innerHTML='<h2>Preparing a new paper…</h2>';
  try{
    let draft=state.drafts[id];
    if(draft?.version!==2||(id==='latin-creusa'&&draft.questions.every(q=>q.options?.length))){delete state.drafts[id];draft=null}
    if(draft&&id==='biology-cell-structure'){
      const fresh=await fetch(bankUrl(p)).then(r=>r.json());const byId=new Map(fresh.questions.map(q=>[q.id,q]));draft.questions=draft.questions.map(q=>byId.get(q.id)||q);save();
    }
    if(draft&&id==='chemistry'&&!Object.keys(draft.answers||{}).length&&draft.questions.some(q=>!q.conceptId)){
      delete state.drafts[id];draft=null;save();
    }
    if(draft&&id==='chemistry'&&draft.questions.some(q=>!q.markKeywords?.length)){
      const fresh=await fetch(bankUrl(p)).then(r=>r.json());
      const byId=new Map(fresh.questions.map(q=>[q.id,q]));
      draft.questions=draft.questions.map(q=>byId.get(q.id)||q);save();
    }
    if(!draft){
      const res=await fetch(bankUrl(p));if(!res.ok)throw Error('Question bank unavailable');
      const bank=await res.json();
      const pool=bank.groups?bank.groups.flatMap(g=>g.questions):bank.questions;
      const valid=pool.filter(q=>q.prompt&&q.answer?.accepted?.length&&['choice','exact_or_equivalent','keywords','chemistry_rubric','biology_rubric'].includes(q.answer.mode));
      const previous=state.recent[id]||[];
      let quotas=p.groups;
      if(!quotas&&bank.groups){
        quotas={};
        bank.groups.forEach((g,i)=>{quotas[g.title]=Math.floor(p.count/bank.groups.length)+(i<p.count%bank.groups.length?1:0)});
      }
      let selected=id==='biology-cell-structure'?selectBiology(valid,previous,p.groups):id==='latin-creusa'?selectCreusa(valid,previous):id==='chemistry'?selectChemistry(valid,p.count,previous,quotas):select(valid,p.count,previous,quotas);
      if(selected.length<p.count)throw Error('Not enough questions in this bank');
      if(previous.length&&selected.map(q=>q.id).join('|')===previous.join('|'))selected=shuffle(selected);
      draft={version:2,questions:selected,answers:{},index:0,remaining:p.minutes*60,running:true,started:Date.now()};
      state.drafts[id]=draft;save();
    }
    renderTest(p,draft);
  }catch(e){
    $('#exam').innerHTML=`<h2>Could not prepare this paper</h2><p>${esc(e.message)}</p><button id="back">Back to papers</button>`;
    $('#back').onclick=()=>show('papers');
  }
}

function renderTest(p,d){
  d.title=p.name;
  const persist=()=>{d.savedAt=Date.now();save()};
  const resumed = d.index > 0 || Object.values(d.answers||{}).some(Boolean);
  function displayClock(){
    const clock=$('#clock');
    if(clock)clock.textContent=`${Math.floor(d.remaining/60)}:${String(d.remaining%60).padStart(2,'0')}`;
  }
  function tick(){
    if(d.running&&d.remaining>0){
      d.remaining--;if(d.remaining%5===0)save();
    }else if(d.running&&d.remaining<=0){
      finish(p,d);return;
    }
    displayClock();
  }
  function draw(){
    const i=d.index,q=d.questions[i],answer=d.answers[i]||'';
    $('#exam').innerHTML=`<div class="exam-top"><div><span class="tag">${esc(p.name)} · ${p.minutes} min · pass 85%</span><h2>Question ${i+1} of ${d.questions.length}</h2></div><strong id="clock" aria-label="Time remaining"></strong></div><div class="progress"><div style="width:${100*(i+1)/d.questions.length}%"></div></div>${resumed?'<p role="status" class="feedback">Resumed saved paper. Your answers and place are preserved. Check the timer before continuing.</p>':''}<p class="muted">Answers are saved. Marking and model answers appear after you submit the whole paper.</p>${p.id==='latin-verbs'?'<p class="muted">From the verb table only. Present: I carry. Imperfect: I was carrying. Perfect: I carried. I have carried and I used to carry are also accepted. Say he, she or it for the third person singular.</p>':''}${q.passage?`<div class="feedback" style="white-space:pre-line;line-height:1.7"><b>Read the extract</b><br>${esc(q.passage)}</div>`:''}<p class="question">${esc(q.prompt)}</p>${['chemistry','biology-cell-structure'].includes(p.id)?`<p class="muted">${questionMarks(q)} marks · ${esc(p.id==='chemistry'?chemistryStage(q):q.topic)} · Give distinct points; show your working for calculations.</p>`:''}${q.diagram?`<img class="assessment-diagram" src="/assessment/diagrams/${esc(q.diagram)}?v=${CHEMISTRY_REVISION}" alt="${esc(q.diagramAlt||DIAGRAM_ALTS[q.diagram]||'Assessment question diagram')}">`:''}${Array.isArray(q.options)&&q.options.length?`<div id="choices">${q.options.map(o=>`<button class="choice ${answer===String(o)?'chosen':''}" data-choice="${esc(o)}">${esc(o)}</button>`).join('')}</div>`:`<label>Your answer<textarea class="answer" id="response" placeholder="Write your answer here">${esc(answer)}</textarea></label>`}<div class="exam-actions"><button id="prev" ${i===0?'disabled':''}>Previous</button><button id="next" class="primary">${i===d.questions.length-1?'Submit whole paper':'Next question'}</button></div><div class="exam-actions" style="margin-top:18px"><button id="pause">${d.running?'Pause timer':'Resume timer'}</button><button id="exit">Back to assessments</button></div>`;
    $('#response')?.addEventListener('input',e=>{d.answers[i]=e.target.value;save()});
    $('#choices')?.addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(b){d.answers[i]=b.dataset.choice;persist();draw()}});
    $('#prev').onclick=()=>{d.index--;persist();draw()};
    $('#next').onclick=()=>{
      if(i===d.questions.length-1){
        if(confirm('Submit the whole paper for marking?'))finish(p,d);
      }else{
        d.index++;persist();draw();
      }
    };
    $('#pause').onclick=()=>{d.running=!d.running;persist();draw()};
    $('#exit').onclick=()=>{persist();show('papers');cards()};
    displayClock();
  }
  persist();draw();timer=setInterval(tick,1000);
}

function showAnswer(q){
  const clean=s=>String(s||'').replace(/\s*(?:\.{3}|…)+\s*$/g,'').trim();
  const model=clean(q.modelAnswer);
  if(model)return model;
  const list=[...new Set((q.answer?.accepted||[]).map(clean).filter(Boolean))];
  return list.join(' / ');
}

function followupItems(result){
 return (result?.questions||[]).filter((q,i)=>mark(q,result.answers?.[i]||'').credit<0.999);
}
function startFollowup(resultIndex){
 const result=state.results[resultIndex];if(!result)return;
 state.followups||={};const id=String(resultIndex);
 const questions=followupItems(result);
 if(!questions.length){show('history');return;}
 state.followups[id]||={questions,index:0,answers:{},checked:{},paper:result.paper};
 save();drawFollowup(id);
}
function drawFollowup(id){
 const draft=state.followups?.[id];if(!draft)return;
 show('exam');draft.savedAt=Date.now();save();const q=draft.questions[draft.index];
 if(!q&&draft.daily){const secured=draft.assignedIds.filter(id=>state.dailyReviewCredits?.[draft.planDate]?.[id]).length;$('#exam').innerHTML=`<h2>Daily assessment corrections · ${secured}/${draft.assignedIds.length} secured</h2><p>Only full-mark corrections count towards the assigned daily task. Unsecured questions remain for follow-up. Successful checks return after 7 days.</p><a class="primary" href="/">Return to daily tasks</a>`;globalThis.LuxJourney?.completionDOM($('#exam'),'mistake-review');return;}
 if(!q){$('#exam').innerHTML=`<h2>Weak-area practice complete</h2><p>You practised ${draft.questions.length} missed or partly correct questions. This follow-up does not change the original test score or count as formal mastery.</p><button id="followup-results">Back to results</button>`;$('#followup-results').onclick=()=>show('history');return;}
 const checked=draft.checked[draft.index],m=checked?mark(q,draft.answers[draft.index]||''):null;
 const correction=checked?globalThis.LuxLearningFeedback?.buildCorrection(q,{...m,given:draft.answers[draft.index]||'',model:showAnswer(q)},draft.subject):null;
 const keywords=q.markKeywords||q.answer?.points?.map(p=>p.label)||q.answer?.markPoints||[];
 $('#exam').innerHTML=`<p class="eyebrow">${draft.daily?'DAILY ASSESSMENT CORRECTIONS':'WEAK-AREA PRACTICE'} · ${draft.index+1}/${draft.questions.length}</p><h2>${esc(q.topic||draft.paper)}</h2><p>Practise missed or partly correct questions, with optional same-concept variants. Your original test score stays unchanged.</p>${q.passage?`<div class="feedback" style="white-space:pre-line">${esc(q.passage)}</div>`:''}${q.diagram?`<img class="assessment-diagram" src="/assessment/diagrams/${esc(q.diagram)}?v=${CHEMISTRY_REVISION}" alt="${esc(q.diagramAlt||DIAGRAM_ALTS[q.diagram]||'Question diagram')}">`:''}${q.options?.length?`<p><b>Options:</b> ${esc(q.options.join(' · '))}</p>`:''}${q.stimulus?.image?`<img class="assessment-diagram" src="${esc(q.stimulus.image)}" alt="Question diagram">`:''}${q.image?`<img class="assessment-diagram" src="${esc(q.image)}" alt="Question diagram">`:''}${q.stimulus?.text?`<p>${esc(q.stimulus.text)}</p>`:''}${q.transferOf?'<p class="feedback">Same idea, different question — apply the correction independently.</p>':''}<p>${esc(q.prompt)}</p><label>Your answer<textarea id="followup-answer" rows="4" ${checked?'readonly':''}>${esc(draft.answers[draft.index]||'')}</textarea></label>${checked?`<div class="feedback"><b>${esc(m.status)}</b>${correction?.reason?`<p><b>Why marks were missed:</b> ${esc(correction.reason)}</p>`:''}<p><b>Model answer:</b> ${esc(showAnswer(q))}</p>${q.workedSolution?`<p><b>Working:</b> ${esc(q.workedSolution)}</p>`:''}${q.answer?.points?.length&&m.credit<0.999?`<p><b>Missing ideas:</b> ${esc(q.answer.points.filter((point,j)=>!m.pointResults?.[j]).map(point=>point.label).join(' · '))}</p>`:''}${keywords.length?`<p><b>Keywords / required points:</b> ${esc(keywords.join(' · '))}</p>`:''}<p><b>Hint:</b> ${esc(q.hint||q.examGuidance?.strategy||q.feedback?.short||'Answer the exact question, then check each required idea. One distinct idea earns each available mark. Write a fresh answer before checking.')} </p></div><button id="followup-next" class="primary">Next question</button><button id="followup-retry">Try again without the answer</button>`:'<button id="followup-check" class="primary">Check this answer</button>'}<button id="followup-exit">Save and return to results</button>`;
 $('#followup-answer').addEventListener('input',e=>{draft.answers[draft.index]=e.target.value;save()});
 $('#followup-check')?.addEventListener('click',()=>{
  if(draft.checked[draft.index])return;
  const response=draft.answers[draft.index]||'',graded=mark(q,response),paperResult=state.results[Number(id)],at=new Date().toISOString(),subject=q._reviewSubject||globalThis.LuxPracticeBridge.subjectOf(paperResult||{})||'biology',marks=questionMarks(q);
  state=globalThis.LuxPracticeBridge.recordFollowup(state,{at,questionId:q.id,subject,year:q._reviewYear||q.year||9,topicTitle:q.topic||draft.paper,correct:graded.credit>=.999,credit:graded.credit,earnedMarks:graded.credit*marks,marks,repairOf:q.transferOf||null},{daily:!!draft.daily,reviewId:q._assessmentReviewId,planDate:draft.planDate,assignedIds:draft.assignedIds});
  draft.checked[draft.index]=true;save();drawFollowup(id);
 });
 $('#followup-next')?.addEventListener('click',()=>{draft.index++;save();drawFollowup(id)});
 $('#followup-retry')?.addEventListener('click',()=>{delete draft.checked[draft.index];delete draft.answers[draft.index];save();drawFollowup(id)});
 $('#followup-exit').onclick=()=>{save();show('history')};
 if(!draft.daily&&checked&&m.credit<1&&globalThis.LuxLearningFeedback){
  const button=document.createElement('button');button.textContent='Try a different question on this idea';button.id='followup-transfer';
  $('#exam').append(button);
  button.onclick=async()=>{
   button.disabled=true;button.textContent='Finding a matching concept…';
   try{
    const paper=PAPERS.find(p=>p.id===state.results[Number(id)]?.paperId);
    const bank=paper?(await (await fetch(bankUrl(paper))).json()).questions:state.results[Number(id)]?.questions||[];
    const source=bank.find(item=>item.id===q.id)||q;
    const variant=globalThis.LuxLearningFeedback.selectTransferQuestion(source,bank,draft.questions.map(item=>item.id));
    if(!variant){button.textContent='No unused variant is available. Explain the rule, then continue.';return;}
    const next=draft.index+1;
    for(const key of ['answers','checked'])for(const index of Object.keys(draft[key]).map(Number).sort((a,b)=>b-a))if(index>=next){draft[key][index+1]=draft[key][index];delete draft[key][index];}
    draft.questions.splice(next,0,{...variant,transferOf:q.id});draft.index=next;save();drawFollowup(id);
   }catch{button.disabled=false;button.textContent='Could not load the variant. Tap to try again.';}
  };
 }
}

function questionMarks(q){return ['chemistry_rubric','biology_rubric'].includes(q.answer?.mode)?q.answer.points.length:1}

function finish(p,d){
  clearInterval(timer);timer=null;
  let earned=0,full=0,partial=0;
  const totalMarks=d.questions.reduce((sum,q)=>sum+questionMarks(q),0);
  const marks=d.questions.map((q,i)=>mark(q,d.answers[i]||''));
  const rows=d.questions.map((q,i)=>{
    const answer=d.answers[i]||'',m=marks[i];
    earned+=m.credit*questionMarks(q);
    if(m.credit>=0.999)full++; else if(m.credit>0)partial++;
    const correction=globalThis.LuxLearningFeedback?.buildCorrection(q,{...m,given:answer,model:showAnswer(q)},p.id.startsWith('latin')?'latin':p.id==='french'?'french':p.id.startsWith('biology')?'biology':p.id);
    const partialNote=m.credit>0&&m.credit<1?`<p class="muted"><b>Partial credit:</b> ${formatMarks(m.credit*questionMarks(q))} of ${questionMarks(q)} marks. You included ${m.matched} of ${m.total} required ideas.</p>`:'';
    return `<article class="entry"><div><span class="tag">Question ${i+1} · ${m.status} · ${esc(q.topic||'')}</span><p>${esc(q.prompt)}</p><p><b>Your answer:</b> ${esc(answer)||'—'}</p><p><b>Model answer:</b> ${esc(showAnswer(q))}</p>${q.workedSolution?`<p><b>Working:</b> ${esc(q.workedSolution)}</p>`:''}${partialNote}${m.credit<1&&correction?.reason?`<p class="feedback"><b>Why marks were missed:</b> ${esc(correction.reason)}</p>`:''}${['chemistry_rubric','biology_rubric'].includes(q.answer?.mode)?`<div class="feedback"><b>How to earn full marks</b><p>${esc(q.examGuidance?.strategy||'Include each distinct required idea.')}</p><ol>${q.answer.points.map((point,j)=>`<li><b>${m.pointResults?.[j]?'Awarded':'Missing'} · 1 mark:</b> ${esc(m.pointLabels?.[j]||point.label)}</li>`).join('')}</ol><p><b>Common mark loss:</b> ${esc(q.examGuidance?.commonError||q.hint)}</p><p class="muted">This is an original AQA-style practice rubric. Automated marking recognises selected wording; use the checklist and model answer to review equivalent scientific explanations.</p></div>`:''}${p.id==='chemistry'||q.markKeywords?`<p><b>Marking keywords:</b> ${esc((q.markKeywords||q.answer.accepted).join(' · '))}</p><p class="muted"><b>Hint for next time:</b> ${esc(q.hint||q.feedback?.short||'Check the evidence in the question before choosing a method.')}</p>`:q.feedback?.short?`<p class="muted">${esc(q.feedback.short)}</p>`:''}</div></article>`;
  });

  const score=['chemistry','biology-cell-structure'].includes(p.id)?Math.floor(earned/totalMarks*100):Math.round(earned/totalMarks*100);
  const missed={};
  d.questions.forEach((q,i)=>{
    const loss=(1-marks[i].credit)*questionMarks(q);
    if(loss>0)missed[q.topic||'Other']=(missed[q.topic||'Other']||0)+loss;
  });
  const focus=Object.entries(missed).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([topic,n])=>`${esc(topic)} (${formatMarks(n)})`).join(' · ');
  const prize=PRIZES[p.id];
  const reward=score>=85?grantWardrobe(p.id):null;
  const wardrobe=reward?`<p class="feedback"><b>${reward.fresh?'Wardrobe unlocked':'Already in the wardrobe'}:</b> ${esc(reward.name)}. Open Scholar and choose it.</p>`:prize?`<p class="muted">85% unlocks ${esc(prize.name)} in the wardrobe. This paper stays locked.</p>`:'';

  state.results.push({
    resultId: p.id+":"+Date.now()+":"+Math.random().toString(36).slice(2),
    completedAt: new Date().toISOString(),
    subject: p.id.split("-")[0],
    date:new Date().toLocaleDateString('en-GB'),
    paper:p.name,
    paperId:p.id,
    correct:full,
    partial,
    marks:earned,
    total:totalMarks,
    score,
    questions:d.questions,
    answers:d.answers,
    revisionEvidence:d.questions.map((q,i)=>({questionId:q.id,topic:q.topic||'Other',credit:marks[i].credit,marks:questionMarks(q)}))
  });
  state.reviewQueue=globalThis.LuxPracticeBridge.queueFor(state);
  state.recent[p.id]=d.questions.map(q=>q.id);
  delete state.drafts[p.id];save();cards();

  const resultSummary=`${full}/${d.questions.length} correct${partial?` · ${partial} partly correct`:''} · ${formatMarks(earned)}/${totalMarks} marks`;
  $('#exam').innerHTML=`<h2>${score>=85?'Passed':'Not yet passed'} · ${score}/100</h2><p>${resultSummary}. Pass mark: 85/100. Review the answers below, then start a new paper for a different selection. Missed or partly correct questions enter Previous mistakes after 2 days; successful daily corrections return after 7 days.</p>${wardrobe}${Object.keys(missed).length?'<button id="practise-weak-areas" class="primary">Practise these weak areas</button>':''}${focus?`<p class="feedback"><b>Revise next:</b> ${focus}</p>`:''}${p.id==='latin-verbs'?'<p class="muted">English follows the verb table. Present is simple (I carry), imperfect is I was carrying, perfect is I carried. I have carried and I used to carry also score. you carry is accepted for both singular and plural; the model answer shows which one it is.</p>':''}${p.id==='latin-creusa'?'<p class="muted">Comprehension marking accepts equivalent wording. Where an answer contains only some required ideas, partial credit is awarded instead of an automatic zero.</p>':''}${p.id==='chemistry'?'<p class="muted">Marks are shown on the new exam-style questions. Each distinct correct point earns a mark, including method and final-answer marks for calculations. Older short questions remain worth one mark.</p>':''}<button id="back-to-papers" class="primary">New paper</button><a class="primary" href="/scholar" style="display:inline-block;margin-left:8px;text-decoration:none">Wardrobe</a><div class="entries">${rows.join('')}</div>`;
  $('#back-to-papers').onclick=()=>show('papers');
  const followupButton=$('#practise-weak-areas');if(followupButton)followupButton.onclick=()=>startFollowup(state.results.length-1);
}

if(typeof URLSearchParams!=="undefined"&&typeof location!=="undefined"&&new URLSearchParams(location.search).get("tab")==="tracker")show("tracker");
if(typeof URLSearchParams!=="undefined"&&typeof location!=="undefined"&&new URLSearchParams(location.search).get("tab")==="history")show("history");

function startDailyAssessmentReview(){
 const bridge=globalThis.LuxPracticeBridge,today=bridge.day(Date.now()),params=new URLSearchParams(location.search);
 let garden;try{const raw=JSON.parse(localStorage.getItem(GARDEN_KEY)||'{}');garden=raw.state||raw}catch{garden={}}
 const task=(garden.daily||[]).find(t=>t.id==='mistake-review'&&t.reviewSource==='assessment'&&t.planDate===today);
 show('exam');
 if(!task||params.get('day')!==today){$('#exam').innerHTML='<h2>This daily review is no longer assigned</h2><p>Open today’s Previous mistakes task from the homepage.</p><a class="primary" href="/">Return to daily tasks</a>';return;}
 state.reviewQueue=bridge.queueFor(state);
 const questions=task.reviewQuestionIds.map(id=>state.reviewQueue[id]).filter(Boolean).map(r=>({...r.question,_assessmentReviewId:r.id,_reviewSubject:r.subject,_reviewYear:r.year}));
 if(questions.length!==task.reviewQuestionIds.length){$('#exam').innerHTML='<h2>Could not restore every assigned question</h2><p>Restore the matching assessment backup, then open the daily task again.</p><a href="/">Return home</a>';return;}
 state.followups||={};const id='daily:'+today;
 const existing=state.followups[id];
 if(!existing||JSON.stringify(existing.assignedIds)!==JSON.stringify(task.reviewQuestionIds))state.followups[id]={questions,index:0,answers:{},checked:{},paper:task.title,daily:true,planDate:today,assignedIds:[...task.reviewQuestionIds]};
 save();drawFollowup(id);
}

// Open the requested paper after deferred scope and marking patches are loaded.
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>{
  const resumeId=new URLSearchParams(location.search).get('resumeFollowup');
  if(resumeId!==null){const draft=state.followups?.[resumeId];if(draft&&!draft.daily&&draft.index<draft.questions.length){drawFollowup(resumeId);return;}show('history');return;}
  if(new URLSearchParams(location.search).get('task')==='mistake-review'){startDailyAssessmentReview();return;}
  const requested=new URLSearchParams(location.search).get('paper');
  const paper=PAPERS.find(p=>p.id===requested);
  if(paper){const group=EXAM_GROUPS.find(g=>g.ids.includes(paper.id));if(group)sessionStorage.setItem('lux-assess-subject',group.subject);cards();start(paper.id);}
});
