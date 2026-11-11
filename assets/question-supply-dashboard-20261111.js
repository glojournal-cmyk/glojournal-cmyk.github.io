/* Optional home-only, read-only question-supply inspector.
 * No MutationObserver, no timers and no learner-data writes (iPad-safe).
 */
import {C as store,st as getTopicCatalog} from '/assets/index-BLVOhKhN.js?v=20261026-bio-year9-savefix2&ux=20261013-corrections2&uxfix=20261022-priority-ux1&mpverify=20261030-save-retry3-modeguard2&scienceRecover=20261110a&frenchShopping=20261110a&nov10Fix=20261110c';
import {buildYear8DailyV2} from ''./year8-daily-v2-20261018.js?v=20261025-scorefix2&latinrotation=20261101a&latincapacity=20261107a&dailyfix=20261104-regression1&supply=20261111a';
import {year8SupplyBySubject,forecastYear8Tasks,preflightYear8Task} from './question-supply-preflight-20261111.js';
const KEY='year8-question-supply-inspector';
const subjectLabels={latin:'Latin',french:'French',biology:'Biology',chemistry:'Chemistry',physics:'Physics'};
const el=(tag,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;};
function mount(){
 if(location.pathname!=='/')return;
 const main=document.querySelector('main');
 if(!main||document.getElementById(KEY))return;
 const panel=document.createElement('details');
 panel.id=KEY;
 panel.setAttribute('aria-label','Question supply and seven-day outlook');
 const head=el('summary','Question supply · 7-day outlook','supply-summary');
 const body=el('div','Open to check the current remaining questions.','supply-content');
 panel.append(head,body);
 main.append(panel);
 panel.addEventListener('toggle',()=>{if(panel.open)refresh(panel)});
}
function refresh(panel=document.getElementById(KEY)){
 if(!panel?.open||location.pathname!=='/')return;
 const body=panel.querySelector('.supply-content');
 if(!body)return;
 if(store.persist?.hasHydrated?.()===false){
  body.replaceChildren(el('p','Restoring saved learning progress before supply checks…'));return;
 }
 try{
  const state=store.getState(),bySubject=year8SupplyBySubject(state);
  const summary=el('div','','supply-grid');
  for(const subject of ['latin','french','biology','chemistry','physics']){
   const row=bySubject[subject]||{};
   const card=el('div','','supply-tile');
   card.append(el('strong',subjectLabels[subject]),
    el('p',String(row.available||0)+' uncredited concepts'),
    el('small',String(row.standardReady||0)+' Standard-ready · '+String(row.masteryReady||0)+' Mastery-ready topics'));
   summary.append(card);
  }
  const section=el('section','','supply-issues');
  const visible=(state.daily||[]).filter(t=>t.assignedTopic&&
   Number(t.assignedYear)===8&&Number(t.target)>Number(t.progress||0)&&
   /[?&]mode=(standard|mastery)(?:&|$)/.test(t.href||''));
  const short=visible.map(task=>{
   const target=Math.max(0,Number(task.target)-Number(task.progress||0));
   const status=preflightYear8Task(task.assignedTopic,state,target,{
    day:state.today,taskId:task.id,countReservations:true});
   return {...status,id:task.id,name:task.assignedLabel||task.assignedTopic,required:target};
  }).filter(row=>!row.canStart);
  section.append(el('h3','Today’s pinned assignments'));
  if(!short.length)section.append(el('p','No shortage detected in checked, unfinished Standard/Mastery cards.'));
  for(const row of short)section.append(el('p',row.name+' · '+row.available+'/'+row.required+
   ' independent concepts left. This card needs a source-backed refill.'));
  const forecast=forecastYear8Tasks(state,mock=>buildYear8DailyV2(mock,getTopicCatalog,{}),7);
  const next=el('section','','supply-future');
  next.append(el('h3','Next seven days · supply stress test'));
  const list=el('ul');
  for(const day of forecast){
   const n=day.warnings.length,li=el('li');
   li.append(el('span',day.date+'  '),el('strong',n? n+' potential supply warning(s)':'No modeled shortage'));
   list.append(li);
  }
  next.append(list);
  next.append(el('p','Forecast assumes every newly offered Year 8 Standard/Mastery concept is answered correctly each day. Actual future topics and available questions depend on learning, saved answers and Recovery; this is a warning, not a promise. No hypothetical answers are saved.','supply-note'));
  body.replaceChildren(el('p','Current Year 8 source inventory, grouped by independent concepts.','supply-note'),summary,section,next);
 }catch(error){
  body.replaceChildren(el('p','Question-supply inspection could not finish. Daily progress and grading are unaffected.'));
  console.warn('Supply inspector',error);
 }
}
function boot(){mount();const panel=document.getElementById(KEY);if(panel?.open)refresh(panel)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('lux:app-ready',boot);
window.addEventListener('pageshow',boot);
window.addEventListener('popstate',boot);
window.addEventListener('scholar:learning-changed',()=>{const panel=document.getElementById(KEY);if(panel?.open)refresh(panel)});
const css=el('style');
css.textContent='#'+KEY+'{margin:24px 0 8px;padding:14px 16px;border:1px solid #d6ccb9;border-radius:16px;background:#fffaf0;color:#183b4b;max-width:100%;font-size:14px}#'+KEY+' .supply-summary{cursor:pointer;font-weight:650;font-family:Georgia,serif;font-size:18px;list-style-position:inside;min-height:28px}#'+KEY+' .supply-content{padding-top:14px}#'+KEY+' .supply-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px}#'+KEY+' .supply-tile{border:1px solid #ddd3c3;border-radius:10px;padding:10px;background:#fffdf8}#'+KEY+' .supply-tile p{margin:5px 0}#'+KEY+' small,#'+KEY+' .supply-note{color:#66746c;font-size:12px;line-height:1.5}#'+KEY+' .supply-issues,#'+KEY+' .supply-future{margin-top:15px}#'+KEY+' h3{font-weight:650;font-size:15px;margin:0 0 7px}#'+KEY+' ul{padding-left:19px;line-height:1.8}';
document.head.append(css);
