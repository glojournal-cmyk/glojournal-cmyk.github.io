/* GCSE Science: manually self-marked, opt-in questions. No storage, Daily, XP or Mastery writes. */
(function () {
  'use strict';
  const root=document.getElementById('gcse-science-questions');
  const panel=document.getElementById('gcse-science-panel');
  const buttons=document.getElementById('gcse-science-selector');
  if(!root||!panel||!buttons)return;
  const config={
    physics:{title:'Physics',path:'/content/topics/phys-y9-p2.json',spec:'8463'},
    chemistry:{title:'Chemistry',path:'/content/topics/chem-y9-c4.json',spec:'8462'},
    biology:{title:'Biology',path:'/content/topics/bio-y9-b3.json',spec:'8461'}
  };
  const version='20261024-aqa-science-12-v1';
  const safe=text=>String(text??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const getSubject=()=>{
    const requested=new URLSearchParams(location.search).get('gcseScience');
    return Object.prototype.hasOwnProperty.call(config,requested)?requested:'physics';
  };
  let active=getSubject();
  const cache={};
  let fetchGeneration=0;
  function syncButtons(){
    buttons.querySelectorAll('[data-gcse-subject]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.gcseSubject===active)));
  }
  function showQuestions(questions){
    const spec=config[active].spec;
    root.innerHTML=questions.map((q,index)=>{
      const marks=q.answer?.totalMarks||1;
      const points=q.answer?.markPoints||[];
      const isNumber=q.format==='calculation';
      const rubric=isNumber
       ? '<p>'+safe(q.answer?.working||q.answer?.modelAnswer||'')+'</p><label><input type="checkbox" class="gcse-science-point"> My answer and units are correct.</label>'
       : '<ol class="gcse-science-points">'+points.map(point=>'<li><label><input type="checkbox" class="gcse-science-point"> <span>'+safe(point)+'</span></label></li>').join('')+'</ol>';
      return '<article class="gcse-science-card" data-gcse-id="'+safe(q.id)+'">'+
        '<p class="gcse-science-kicker">AQA '+safe(spec)+' · '+safe(q.examPractice?.assessmentObjective||'Practice')+' · '+marks+' mark'+(marks===1?'':'s')+'</p>'+
        '<h4>Question '+(index+1)+'. '+safe(q.prompt)+'</h4>'+
        '<label class="gcse-science-note" for="gcse-answer-'+index+'">Write your own answer before opening the marking checklist.</label>'+
        '<textarea id="gcse-answer-'+index+'" class="gcse-science-answer" aria-label="Answer to question '+(index+1)+'" placeholder="Type your answer here, or work it out on paper."></textarea>'+
        '<details><summary>Reveal indicative mark scheme / self-check</summary>'+rubric+
        '<p class="gcse-science-score" aria-live="polite">Self-check: 0 / '+marks+'</p>'+
        '<p class="gcse-science-note">Self-marking only. The checkbox score is not an official AQA examiner mark and is not saved.</p></details>'+
        '</article>';
    }).join('');
    if(!questions.length)root.innerHTML='<p class="gcse-science-error">No exam-style questions available for this subject.</p>';
    root.querySelectorAll('.gcse-science-card').forEach(card=>{
      card.querySelectorAll('.gcse-science-point').forEach(box=>box.addEventListener('change',()=>{
        const checks=[...card.querySelectorAll('.gcse-science-point')];
        const score=checks.filter(x=>x.checked).length;
        card.querySelector('.gcse-science-score').textContent='Self-check: '+score+' / '+checks.length;
      }));
    });
  }
  async function load(){
    syncButtons();
    const subject=active,sequence=++fetchGeneration;
    root.textContent='Loading '+config[subject].title+' exam-style questions…';
    try{
      if(!cache[subject]){
        const response=await fetch(config[subject].path+'?v='+version,{cache:'no-store'});
        if(!response.ok)throw new Error('Question bank unavailable ('+response.status+')');
        const doc=await response.json();
        const questions=(doc.questions||[]).filter(q=>q.status==='enabled'&&
          q.id.includes('-aqa-exam-20261024-')&&q.examPractice?.specification===config[subject].spec);
        if(questions.length!==4)throw new Error('Expected four approved questions, got '+questions.length);
        cache[subject]=questions;
      }
      if(sequence!==fetchGeneration)return;
      showQuestions(cache[subject]);
    }catch(err){
      if(sequence!==fetchGeneration)return;
      root.innerHTML='<p class="gcse-science-error">Could not load the questions. Check your connection and reopen this section.</p>';
    }
  }
  buttons.addEventListener('click',event=>{
    const button=event.target.closest('[data-gcse-subject]');
    if(!button||!buttons.contains(button))return;
    active=button.dataset.gcseSubject;
    load();
  });
  panel.addEventListener('toggle',()=>{if(panel.open)load()});
  if(new URLSearchParams(location.search).has('gcseScience')){
    panel.open=true;
    load();
  }
})();
