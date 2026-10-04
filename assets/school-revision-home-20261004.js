import './school-revision-data-20261004.js?v=20261004-connections1';
import {C as store} from './index-BLVOhKhN.js?v=20261004-connections1';
const {buildRevisionPlan,londonDay}=globalThis.LuxSchoolRevision;
const ID='school-revision-home';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
function status(topic){
  if(topic.state==='not-taught')return 'Not taught yet';
  if(topic.state==='needs-review')return topic.lost>0?'Marks missed in the latest paper':topic.mistakes?`${topic.mistakes} saved ${topic.mistakes===1?'mistake':'mistakes'}`:`${topic.accuracy}% in topic practice`;
  return {'unchecked':'No practice recorded','practising':'Still practising','mastered':'Mastered in app practice'}[topic.state];
}
function renderCard(x){
  const when=x.phase==='current'?(x.dateKind==='week'?'Assessment week':'Today'):x.dateKind==='week'?`${x.days} ${x.days===1?'day':'days'} to assessment week`:`${x.days} ${x.days===1?'day':'days'} to test`;
  const weaker=x.revisionTopics.filter(t=>t.state==='needs-review');
  const unchecked=x.revisionTopics.filter(t=>t.state==='unchecked');
  const focus=x.focus;
  return `<article class="school-revision-card" data-school-assessment="${esc(x.id)}"><div class="school-revision-meta"><strong>${esc(x.subject)}</strong><span>${esc(when)}</span></div><h3>${esc(x.title)}</h3><p class="school-revision-date">${esc(x.dateLabel)}</p><p class="school-revision-scope">${esc(x.scope||x.notes||'Range awaits teacher confirmation.')}</p>${x.latest?`<p class="school-revision-evidence">Latest app paper: <b>${esc(x.latest.score)}%</b> · ${esc(x.latest.date)}</p>`:''}<p class="school-revision-evidence">${weaker.length?`<b>Needs review:</b> ${esc(weaker.map(t=>t.label).join(' · '))}`:unchecked.length?`<b>Not checked yet:</b> ${esc(unchecked.map(t=>t.label).join(' · '))}`:focus?'<b>Keep practising:</b> check the full range before the test.':'Check the tracker for topics and follow-up.'}</p>${focus?`<p class="school-revision-focus">Focus: <b>${esc(focus.label)}</b> · ${esc(status(focus))}</p>`:''}<div class="school-revision-actions">${focus?`<a href="${esc(focus.practiceHref)}">Practise topic</a><a class="school-revision-secondary" href="${esc(focus.notesHref)}">Read notes</a>`:''}${x.paperId?`<a class="school-revision-secondary" href="${esc(x.paperHref)}">Practice paper</a>`:`<a href="/assessment/?tab=tracker">Open tracker</a>`}</div></article>`;
}
function refresh(){
  if(location.pathname!=='/'){document.getElementById(ID)?.remove();return;}
  const main=document.querySelector('main');if(!main)return;
  document.getElementById('school-assessment-home')?.remove();
  const data=buildRevisionPlan(store.getState(),read('lux-assessment-v1'),londonDay(),read('lux-topic-learning-v1'));
  let panel=document.getElementById(ID);
  if(!panel){panel=document.createElement('section');panel.id=ID;panel.setAttribute('aria-labelledby','school-revision-title');main.prepend(panel);}
  const suggested=data.suggestion,next=suggested?.assessment,focus=suggested?.topic;
  const html=`<div class="school-revision-heading"><div><p class="school-revision-eyebrow">YOUR SCHOOL ASSESSMENTS</p><h2 id="school-revision-title">Revise for your next test</h2></div><a href="/assessment/?tab=tracker">School tracker →</a></div>${suggested?`<div class="school-revision-today"><div><p class="school-revision-eyebrow">TODAY’S SUGGESTION</p><h3>${esc(next.subject)} · ${esc(focus?.label||next.title)}</h3><p>${esc(suggested.reason)}${focus&&focus.state!=='mastered'?' Read the notes, then try a 10-question set.':''}</p></div><a href="${esc(suggested.href)}">${focus?.state==='mastered'?'Try practice paper':focus?'Start suggested practice':'Open tracker'} →</a></div>`:'<p class="school-revision-empty">No upcoming school tests recorded. Add the next teacher-confirmed date and range in the school tracker.</p>'}<div class="school-revision-grid">${data.active.slice(0,3).map(renderCard).join('')}</div>${data.active.length>3?`<p class="school-revision-footnote">${data.active.length-3} more upcoming assessments in the school tracker.</p>`:''}${data.past.length?`<p class="school-revision-footnote">${data.past.length} past or completed assessments · <a href="/assessment/?tab=tracker">Review the tracker</a></p>`:''}<p class="school-revision-footnote">Suggestions use saved topic practice and marked app papers on this device. No practice recorded means unchecked. App practice scores are separate from school grades.</p>`;
  if(panel.innerHTML!==html)panel.innerHTML=html;
}
let queued=false;
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh();});}
if(typeof document!=='undefined'){
  if(!document.getElementById('school-revision-css')){const css=document.createElement('link');css.id='school-revision-css';css.rel='stylesheet';css.href='/assets/school-revision-20261004.css?v=20261004-school1';document.head.append(css);}
  store.subscribe(schedule);
  document.addEventListener('DOMContentLoaded',schedule);
  window.addEventListener('storage',schedule);
  window.addEventListener('pageshow',schedule);
  window.addEventListener('popstate',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule();});
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(()=>{if(location.pathname==='/')schedule();},60000);
  schedule();
}
