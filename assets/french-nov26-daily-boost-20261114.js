/* Optional Daily exam-preparation links, without Daily score/XP/storage writes.
 * The scored Year 9 15-question slot is chosen by year8-daily-v2.
 * The essay and extra practice must NOT be included in the required task total.
 */
(function(){
  'use strict';
  if(typeof document==='undefined'||typeof location==='undefined')return;
  const id='french-nov26-daily-boost';
  const londonDate=()=>{
    try{
      const parts=new Intl.DateTimeFormat('en-GB',{
        timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'
      }).formatToParts(new Date());
      return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value||'').join('-');
    }catch{return ''}
  };
  function mount(){
    if(location.pathname!=='/'||londonDate()<'2026-11-14'||
       londonDate()>'2026-11-26'||document.getElementById(id))return;
    const main=document.querySelector('main');if(!main)return;
    const panel=document.createElement('aside');panel.id=id;
    panel.setAttribute('aria-label','Optional French November exam writing booster');
    panel.style.cssText='box-sizing:border-box;max-width:100%;margin:16px 0;border:1px solid #d9d8c8;border-radius:20px;padding:18px;background:#faf8f1;color:#1a3148;font:15px/1.55 system-ui,sans-serif';
    const kicker=document.createElement('p');
    kicker.textContent='FRENCH · DAILY EXAM BOOSTER · UNTIL 26 NOV';
    kicker.style.cssText='font-size:11px;font-weight:800;letter-spacing:.09em;color:#7c6b43;margin:0 0 5px';
    const title=document.createElement('h3');
    title.textContent='Holiday Writing · 10-minute extra';
    title.style.cssText='font:600 22px/1.25 Georgia,serif;margin:0 0 8px';
    const help=document.createElement('p');
    help.textContent='After your scored Year 9 French questions, practise the teacher’s dictation words, perfect / simple future sentences and a 150-word Higher-style holiday letter.';
    help.style.cssText='margin:0 0 12px;color:#394a54';
    const links=document.createElement('nav');
    links.setAttribute('aria-label','French exam writing drills');
    links.style.cssText='display:flex;flex-wrap:wrap;gap:9px';
    for(const [name,hash] of [['Dictation words','#vocab'],['Full-sentence tenses','#grammar'],['150-word mock','#writing']]){
      const a=document.createElement('a');
      a.href='/assessment/french-nov26/'+hash;
      a.textContent=name;a.style.cssText='display:inline-block;padding:9px 12px;background:#1a3148;color:white;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600';
      links.append(a);
    }
    const note=document.createElement('p');
    note.textContent='Optional revision: not an extra required Daily task and not counted as vocabulary, Mastery or XP credit.';
    note.style.cssText='margin:10px 0 0;color:#606b6e;font-size:12px';
    panel.append(kicker,title,help,links,note);
    const heading=[...document.querySelectorAll('h2')].find(h=>/Raise her today|Daily Tasks/i.test(h.textContent||''));
    const dailyCard=heading?.parentElement?.parentElement?.parentElement;
    if(dailyCard?.parentNode)dailyCard.insertAdjacentElement('afterend',panel);
    else main.append(panel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  window.addEventListener('load',mount,{once:true});
  window.addEventListener('pageshow',mount);
})();
