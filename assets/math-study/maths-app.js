/* Scholar's Garden Year 9 Maths: isolated Study-only learning UI.
   No Daily imports, assignments, rewards or progression writes. */
const BASE='/study/maths/';
const ROOT='/assets/math-study/';
const NAV=[['⌂','Home','/'],['▣','Study','/study/'],['◇','Play','/play/'],['♧','Garden','/garden/'],['♧','Pet','/pet/'],['▤','Assessment','/assessment/'],['✎','Scholar','/scholar/']];
const query=new URLSearchParams(location.search);
const topicId=query.get('topic')||'math-y9-indices';
const page=location.pathname.includes('/practise')?'practise':location.pathname.includes('/progress')?'progress':location.pathname.includes('/learn')?'learn':'topics';
const content=document.getElementById('maths-app');
const SKEY='lux-maths-study-v1';
const DKEY='lux-maths-draft-v1';
const read=(key,def)=>{try {return JSON.parse(localStorage.getItem(key))||def}catch{return def}};
const save=(key,data)=>{try{localStorage.setItem(key,JSON.stringify(data));return true}catch(e){document.getElementById('maths-save-warning')?.removeAttribute('hidden');return false}};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const list=await fetch(ROOT+'topics.json').then(r=>{if(!r.ok)throw Error('Topic list could not load');return r.json()});
const selected=list.find(x=>x.id===topicId)||list[0];
let bank=null,charts=null;
let answers=read(SKEY,{version:1,records:{}}),drafts=read(DKEY,{});
let session=null,index=0;
const chapterLink=(sub,id=selected.id,extra='')=>`${BASE}${sub?sub+'/':''}?topic=${encodeURIComponent(id)}${extra}`;
const header=()=>`<header class="maths-top"><a class="maths-back" href="${page==='topics'?'/study/':chapterLink('')}" aria-label="Back">←</a><div><p class="maths-eyebrow">THE SCHOLAR'S GARDEN · YEAR 9</p><h1>Maths <span>✦</span> ${page==='topics'?'Topic Library':page==='learn'?'Learn':page==='practise'?'Practise':'Progress'}</h1></div><span class="maths-year">Year 9</span></header>`;
const bottom=()=>`<nav class="maths-nav" aria-label="Primary navigation">${NAV.map(([i,t,u])=>`<a href="${u}" class="${t==='Study'?'active':''}" ${t==='Study'?'aria-current="page"':''}><img src="${ROOT}nav/${t.toLowerCase()}.svg" alt="" aria-hidden="true"><small>${t}</small></a>`).join('')}</nav>`;
const shell=(body,title=selected.title)=>{document.title=`Maths · ${title} · Scholar's Garden`;content.innerHTML=`<div class="maths-background"></div><div class="maths-frame">${header()}<div class="maths-layout">${body}</div></div>${bottom()}<p id="maths-save-warning" class="maths-save-warning" hidden role="alert">Could not save Maths progress on this device. Storage may be full or restricted.</p>`;};
function score(id){let r=answers.records[id];return r&&r.reviewed?{attempts:r.attempts||0,correct:!!r.correct}:null}
function topicStats(id){const rows=(bank?.topicId===id?bank.questions:[]).map(q=>answers.records[q.id]).filter(x=>x?.reviewed);return{attempts:rows.length,correct:rows.filter(x=>x.correct).length};}
function summaryCard(){return `<aside class="maths-summary"><div class="maths-stamp">✦ EQUIPPED SCHOLAR ✦</div><div class="maths-sprites"><img class="maths-scholar" alt="Your currently equipped Scholar" hidden><img class="maths-pet" alt="Your currently selected Pet and evolution" hidden><p class="maths-cast-status" role="status">Loading your selected outfit and Pet…</p></div><p class="maths-caption">Your current Wardrobe outfit and Pet · live sync</p><p class="maths-subtle">Study only · never added to Daily Tasks</p></aside>`}
function sideMenu(active=page){return `<aside class="maths-side"><h2>${esc(selected.title)}</h2><p>100 questions · Full worked marking scheme</p><a class="${active==='topics'?'is-on':''}" href="${chapterLink('')}">▤ Topic Selection</a><a class="${active==='learn'?'is-on':''}" href="${chapterLink('learn')}">▣ Learn</a><a class="${active==='practise'?'is-on':''}" href="${chapterLink('practise')}">✎ Practise</a><a class="${active==='progress'?'is-on':''}" href="${chapterLink('progress')}">▥ Progress</a></aside>`}
function topicCards(){let cards=list.map((t,i)=>`<a class="maths-topic-card" href="${chapterLink('',t.id)}"><b class="maths-topic-num">${i+1}</b><span class="maths-topic-label"><strong>${esc(t.title)}</strong><small>${t.questions} practice & GCSE-style questions</small></span><span class="maths-topic-glyph">${['xⁿ','×10ⁿ','ƒx','{x,y}','↗'][i]}</span><span aria-hidden="true">›</span></a>`).join('');return `<main class="maths-paper maths-topics-paper"><div class="maths-paper-title">Choose a Maths Topic <small>Year 9 · Topics 1–5</small></div>${cards}</main>`;}
function drawTopics(){let topicChosen=query.has('topic');if(!topicChosen){shell(`${summaryCard()}${topicCards()}`,'Topic Selection');return}shell(`${sideMenu('topics')}<main class="maths-paper"><div class="maths-paper-title">${esc(selected.title)}<small>Topic ${list.indexOf(selected)+1} · Year 9</small></div><p class="maths-lead">Choose how you want to study this topic.</p><div class="maths-option-grid"><a href="${chapterLink('learn')}"><span>▣</span><strong>Learn</strong><small>Source-based explanations and worked examples</small></a><a href="${chapterLink('practise')}"><span>✎</span><strong>Practise</strong><small>Quick, topic, exam-style and mixed sessions</small></a><a href="${chapterLink('progress')}"><span>▥</span><strong>Progress</strong><small>Your real reviewed practice record</small></a></div><a class="maths-link" href="${chapterLink('').split('?')[0]}">← View all five topics</a></main>`);}
async function getBank(){if(!bank){const r=await fetch(ROOT+selected.id+'.json');if(!r.ok)throw Error('Questions could not load');bank=await r.json();if(bank.questions.length!==100)throw Error('Question bank incomplete');}return bank;}
function byStrand(){let map=new Map;for(let q of bank.questions){if(!map.has(q.strand))map.set(q.strand,[]);map.get(q.strand).push(q)}return map;}
async function drawLearn(){await getBank();let groups=[...byStrand()];let opened=query.get('skill');let key=groups.some(x=>x[0]===opened)?opened:groups[0][0];let examples=groups.find(x=>x[0]===key)?.[1]||[];let lead=examples[0];let cards=groups.map(([name,arr],i)=>`<a href="${chapterLink('learn',selected.id,'&skill='+encodeURIComponent(name))}" class="maths-learn-skill ${name===key?'active':''}"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(name)}</b><small>${arr.length} questions</small></a>`).join('');let ex=examples.slice(0,4).map((q,i)=>`<section class="maths-worked"><span class="maths-question-label">WORKED EXAMPLE ${i+1} · ${q.marks} MARKS</span><p class="maths-formula">${esc(q.prompt)}</p>${q.diagramAsset?`<div class="maths-chart" data-chart="${esc(q.diagramAsset)}"></div>`:''}<div class="maths-solution"><strong>Step-by-step</strong><p>${esc(q.solution)}</p><div class="maths-rubric">${q.markPoints.map(s=>`<span>${esc(s)}</span>`).join('')}</div></div></section>`).join('');shell(`${sideMenu('learn')}<main class="maths-paper maths-learn-paper"><div class="maths-paper-title">${esc(selected.title)}<small>Learn · worked examples</small></div><div class="maths-learn-layout"><div class="maths-learn-menu">${cards}</div><article class="maths-examples"><h2>${esc(key)}</h2><p class="maths-help">Original question-bank examples, solution and marking points.</p>${ex}<a class="maths-action" href="${chapterLink('practise',selected.id,'&mode=topic&start=1&strand='+encodeURIComponent(key))}">Practise this skill →</a></article></div></main>`);await mountCharts();}
function choosePool(){
  let pool=bank.questions.filter(x=>!query.get('strand')||x.strand===query.get('strand'));
  const mode=query.get('mode')||'quick';
  if(mode==='quick')pool=pool.filter(q=>q.track==='skill');
  if(mode==='exam')pool=pool.filter(q=>q.track!=='skill');
  if(mode==='review')pool=pool.filter(q=>score(q.id)&&!score(q.id).correct);
  // Direct links from Progress must open the exact incorrect question first.
  const requested=query.get('question');
  if(requested && mode==='review')pool=pool.filter(q=>q.id===requested);
  // Fisher-Yates shuffle each new session; unreviewed questions are offered
  // before repeats, so all 500 can eventually be covered through Study.
  const shuffle=items=>{let a=[...items];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const unseen=shuffle(pool.filter(q=>!score(q.id)));
  const seen=shuffle(pool.filter(q=>score(q.id)));
  const limit=mode==='mixed'?12:10;
  return [...unseen,...seen].slice(0,Math.min(limit,pool.length));
}
function practiceModes(){return `<div class="maths-mode-list">${[['quick','◎','Quick Practise','10 skill questions'],['topic','▤','Topic Practise','Target a specific topic skill'],['exam','✎','Exam-style Practise','GCSE-style questions with full rubrics'],['mixed','⤨','Mixed Practise','12 varied questions']].map(([m,icon,title,subtitle])=>`<a class="maths-mode" href="${chapterLink('practise',selected.id,'&mode='+m+(m==='topic'?'':'&start=1'))}"><span class="maths-mode-icon">${icon}</span><span><strong>${title}</strong><small>${subtitle}</small></span><b>›</b></a>`).join('')}</div>`}
async function mountCharts(){let nodes=[...content.querySelectorAll('[data-chart]')];if(!nodes.length)return;if(!charts)charts=await fetch(ROOT+'graphs.json').then(r=>r.json());for(let el of nodes){let src=charts[el.dataset.chart];if(!src){el.textContent='Graph temporarily unavailable';continue;}const svg=new Blob([src],{type:'image/svg+xml'});const u=URL.createObjectURL(svg);let img=document.createElement('img');img.alt='Straight line coordinate diagram';img.onload=()=>URL.revokeObjectURL(u);img.src=u;el.append(img)}}
function helpText(q){return q.track==='skill'?'Use the question and show enough working for the marks.':'GCSE-style: use the marking points to review your method and accuracy.'}
function getDraft(id){return drafts[id]||''}
function recordAnswer(q,correct){
  const previous=answers.records[q.id];
  const review={...previous,attempts:(previous?.attempts||0)+1,correct,reviewed:true,lastReviewed:new Date().toISOString()};
  answers.records[q.id]=review;
  if(!save(SKEY,answers)){
    if(previous===undefined)delete answers.records[q.id];else answers.records[q.id]=previous;
    return false;
  }
  window.dispatchEvent(new CustomEvent('scholar:maths-progress-changed',{detail:{topicId:selected.id,questionId:q.id}}));
  return true;
}
function currentCard(){let q=session[index],rec=score(q.id);let chart=q.diagramAsset?`<div class="maths-chart" data-chart="${esc(q.diagramAsset)}"></div>`:'';let reveal=sessionRevealed.has(q.id);return `<div class="maths-paper-title">${esc(selected.title)}<small>${esc(query.get('mode')||'quick')} practice · question ${index+1} / ${session.length}</small></div><div class="maths-question-count">${session.map((x,i)=>`<button data-qindex="${i}" aria-label="Question ${i+1}" class="${i===index?'chosen':''} ${score(x.id)?'reviewed':''}">${i+1}</button>`).join('')}</div><p class="maths-help">${esc(helpText(q))}</p><div class="maths-prompt"><div class="maths-prompt-top"><b>Question ${index+1}</b><span>${q.marks} marks · ${esc(q.id)}</span></div><p>${esc(q.prompt)}</p>${chart}</div><label class="maths-answer-label" for="math-answer">Your answer / working</label><textarea id="math-answer" rows="3" placeholder="Type your answer or show your working here…">${esc(getDraft(q.id))}</textarea><div class="maths-symbols">${['x','y','²','³','⁻','×','÷','√','π','≤','≥','/'].map(s=>`<button type="button" data-symbol="${s}">${s}</button>`).join('')}</div>${reveal?`<section class="maths-reveal"><strong>Worked solution</strong><p>${esc(q.solution)}</p><strong>Mark scheme · ${q.marks} marks</strong><ul>${q.markPoints.map(point=>`<li>${esc(point)}</li>`).join('')}</ul><p class="maths-help">This practice uses self-review for multi-step questions: check your workings before recording the result.</p><div class="maths-review-buttons"><button data-review="no" type="button">Needs revision</button><button data-review="yes" type="button">My answer meets the mark scheme</button></div></section>`:`<button id="maths-reveal-btn" class="maths-action" type="button">Check against worked answer & marking scheme</button>`}<div class="maths-prev-next"><button id="maths-prev" ${index===0?'disabled':''}>← Previous</button><button id="maths-next" ${index===session.length-1?'disabled':''}>Next →</button></div>${rec?`<p class="maths-note">Reviewed ${rec.attempts} time(s). Last self-check: ${rec.correct?'Meets mark scheme':'Needs revision'}.</p>`:''}`}
const sessionRevealed=new Set();
async function drawPractise(){await getBank();if(!query.has('start')){
  if(query.get('mode')==='topic'){
    const choices=[...byStrand()].map(([name,qs])=>`<a class="maths-mode" href="${chapterLink('practise',selected.id,'&mode=topic&start=1&strand='+encodeURIComponent(name))}"><span class="maths-mode-icon">ƒx</span><span><strong>${esc(name)}</strong><small>${qs.length} source questions available</small></span><b>›</b></a>`).join('');
    shell(`${sideMenu('practise')}<main class="maths-paper"><div class="maths-paper-title">Choose a skill<small>${esc(selected.title)}</small></div><div class="maths-mode-list">${choices}</div></main>`);
  }else shell(`${sideMenu('practise')}<main class="maths-paper"><div class="maths-paper-title">${esc(selected.title)}<small>Choose a practise mode</small></div>${practiceModes()}</main>`);
  return;
}session=choosePool();if(!session.length){shell(`${sideMenu('practise')}<main class="maths-paper">No matching questions available. <a href="${chapterLink('practise')}">Choose another mode</a>.</main>`);return}shell(`${sideMenu('practise')}<main class="maths-paper maths-practise-paper"><div id="maths-active-question">${currentCard()}</div></main>`);await mountCharts();const box=document.getElementById('maths-active-question');box.addEventListener('click',async e=>{const target=e.target.closest('button');if(!target)return;if(target.dataset.qindex!==undefined){index=+target.dataset.qindex;await redrawQuestion()}else if(target.dataset.symbol){let ta=document.getElementById('math-answer');const start=ta.selectionStart,end=ta.selectionEnd;ta.value=ta.value.slice(0,start)+target.dataset.symbol+ta.value.slice(end);ta.focus();ta.setSelectionRange(start+target.dataset.symbol.length,start+target.dataset.symbol.length);saveDraft(session[index].id,ta.value)}else if(target.id==='maths-prev'){index=Math.max(0,index-1);await redrawQuestion()}else if(target.id==='maths-next'){index=Math.min(session.length-1,index+1);await redrawQuestion()}else if(target.id==='maths-reveal-btn'){sessionRevealed.add(session[index].id);await redrawQuestion()}else if(target.dataset.review){if(recordAnswer(session[index],target.dataset.review==='yes')){if(index<session.length-1)index++;await redrawQuestion()}}});box.addEventListener('input',e=>{if(e.target.id==='math-answer')saveDraft(session[index].id,e.target.value)});}
function saveDraft(id,text){drafts[id]=text;save(DKEY,drafts)}
async function redrawQuestion(){document.getElementById('maths-active-question').innerHTML=currentCard();await mountCharts();}
async function drawProgress(){await getBank();let total=bank.questions.length;let attempts=bank.questions.map(q=>score(q.id)).filter(Boolean);let good=attempts.filter(r=>r.correct).length;let groups=[...byStrand()].map(([name,qs])=>({name,n:qs.map(q=>score(q.id)).filter(Boolean).length,correct:qs.filter(q=>score(q.id)?.correct).length,count:qs.length}));let row=groups.map(g=>{let pct=g.n?Math.round(g.correct/g.n*100):0;return `<div class="maths-progress-row"><span>${esc(g.name)} <small>${g.n} reviewed / ${g.count}</small></span><div class="maths-bar"><i style="width:${g.n?pct:0}%"></i></div><b>${g.n?pct+'%':'—'}</b></div>`}).join('');let overall=attempts.length?Math.round(good/attempts.length*100):0;let wrong=bank.questions.filter(q=>score(q.id)&&!score(q.id).correct);shell(`${sideMenu('progress')}<main class="maths-paper"><div class="maths-paper-title">Your Progress <small>${esc(selected.title)}</small></div><div class="maths-progress-summary"><div><span>Questions reviewed</span><strong>${attempts.length} / ${total}</strong></div><div><span>Self-reported correct</span><strong>${good} / ${attempts.length}</strong></div><div><span>Review accuracy</span><strong>${attempts.length?overall+'%':'Not yet assessed'}</strong></div></div><div class="maths-progress-rows">${row}</div><h2>Review your difficult questions</h2>${wrong.length?`<div class="maths-incorrect">${wrong.slice(0,12).map(q=>`<a href="${chapterLink('practise',selected.id,'&mode=review&start=1&question='+encodeURIComponent(q.id))}">↻ ${esc(q.id)} — ${esc(q.strand)}</a>`).join('')}</div>`:'<p class="maths-help">No questions marked for revision yet.</p>'}<p class="maths-note">Progress is based on answers you have reviewed against the source marking scheme, not a fabricated grade or automatic examiner score. Records are kept separately from Daily Tasks.</p></main>`);}
async function syncCast(){
  const target=document.querySelector('.maths-sprites');if(!target)return;
  const message=target.querySelector('.maths-cast-status');
  const scholar=target.querySelector('.maths-scholar'),petImg=target.querySelector('.maths-pet');
  const setSprite=(img,source)=>{
    if(!img||!source)return;
    if(img.getAttribute('src')===source){
      if(img.complete&&img.naturalWidth>0)img.hidden=false;
      return;
    }
    img.hidden=true;
    img.onload=()=>{img.hidden=false;if(!scholar.hidden&&!petImg.hidden)message.hidden=true;};
    img.onerror=()=>{img.hidden=true;message.textContent='The selected character or Pet image is unavailable. Your choices have not changed.';message.hidden=false;};
    img.src=source;
  };
  try{
    // Do NOT import the main React runtime into a standalone Maths page. It
    // hydrates its own router and can hijack navigation on narrow iPad screens.
    const [response,petModule]=await Promise.all([
      fetch(ROOT+'outfits.json'),
      import('/pet/pet-art-hd-20261009.js?v=20261019-baphomet1')
    ]);
    if(!response.ok)throw Error('Wardrobe artwork index unavailable');
    const wardrobe=(await response.json()).outfits||{},petArtUrl=petModule.petArtUrl;
    const render=()=>{
      if(!target.isConnected)return;
      let persisted={},pet={};
      try{persisted=JSON.parse(localStorage.getItem('lux-scholar-garden-v1')||'{}')||{};}catch{}
      try{pet=JSON.parse(localStorage.getItem('lux-pet-companion-v1')||'{}')||{};}catch{}
      const outfitId=persisted.state?.equippedOutfit||persisted.equippedOutfit||'day';
      const art=Object.hasOwn(wardrobe,outfitId)?wardrobe[outfitId]:null;
      if(art)setSprite(scholar,art);else{
        scholar.hidden=true;message.hidden=false;
        message.textContent='Selected outfit image not found; your saved outfit has not been changed.';
      }
      const species=/^[a-z\d-]+$/i.test(String(pet.species||''))?pet.species:'moss-hornling';
      const stage=Math.min(10,Math.max(1,Number(pet.petLevels?.[species]||pet.highestStage)||1));
      try{const sprite=petArtUrl(species,stage);if(sprite)setSprite(petImg,sprite);}catch{
        petImg.hidden=true;message.hidden=false;message.textContent='Selected Pet image unavailable.';
      }
    };
    render();
    for(const name of ['storage','scholar:wardrobe-changed','scholar:pet-changed','pageshow'])window.addEventListener(name,render);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  }catch{
    target.closest('.maths-summary')?.classList.add('maths-sync-waiting');
    message.hidden=false;
    message.textContent='Unable to read your selected outfit and Pet. Your saved choices remain unchanged.';
  }
}
try{if(page==='topics')drawTopics();else if(page==='learn')await drawLearn();else if(page==='practise')await drawPractise();else await drawProgress();syncCast();}catch(e){console.error('Maths Study:',e);shell(`<main class="maths-paper"><h2>Unable to load Maths</h2><p>${esc(e.message||e)}</p><a href="/study/">Return to Study</a></main>`,'Loading problem');}