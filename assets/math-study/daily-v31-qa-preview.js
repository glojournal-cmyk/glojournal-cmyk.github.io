// REVIEW ONLY: 10 originally supplied Maths V3.1 questions, no Scholar store or persistence.
const params=new URLSearchParams(location.search);
const section=document.getElementById('qa-preview');
if(params.get('qa')==='1'){
 section.hidden=false;
 const el=id=>document.getElementById(id);
 const status=msg=>{el('qa-message').textContent=msg};
 const dataPath='/qa-staging/math-v31-original-sample10.json';
 const state={index:0,answers:[],rendered:false,sourceStatus:'QA_ONLY_NOT_APPROVED'};
 const fail=e=>{el('qa-question').hidden=true;status('Maths QA preview blocked: '+(e?.message||String(e))+
  '. No raw LaTeX or unmarked Daily credit will be shown.')};
 const escapeLabel=s=>String(s||'').slice(0,200);
 function mathScript(){
  return new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
   script.onload=resolve;script.onerror=()=>reject(Error('MathJax renderer unavailable'));
   document.head.append(script);
  });
 }
 function shuffle(list,seed){
  const items=[...list];let s=seed;
  for(let i=items.length-1;i>0;i--){
   s=(Math.imul(s,1664525)+1013904223)>>>0;
   const j=s%(i+1);[items[i],items[j]]=[items[j],items[i]];
  }
  return items;
 }
 async function typeset(nodes){
  if(!window.MathJax?.typesetPromise)throw Error('MathJax formula engine not ready');
  await window.MathJax.typesetPromise(nodes);
 }
 function guard(pack){
  if(pack?.status!=='QA_ONLY_NOT_APPROVED'||!Array.isArray(pack.questions)||pack.questions.length!==10)
   throw Error('Incorrect QA sample provenance');
  const ids=new Set(),topics=new Map(),bands=new Map(),templates=new Set();
  for(const q of pack.questions){
   if(!q?.id||ids.has(q.id)||!q.templateId||templates.has(q.templateId)||
      !Array.isArray(q.options)||q.options.length!==6||
      q.options.filter(o=>o.id===q.correctOptionId).length!==1||
      new Set(q.options.map(o=>o.id)).size!==6||!Array.isArray(q.workedSolutionSteps))
     throw Error('Unsafe or duplicate source question: '+(q?.id||'unknown'));
   ids.add(q.id);templates.add(q.templateId);
   topics.set(q.topicId,(topics.get(q.topicId)||0)+1);
   bands.set(q.difficultyTarget,(bands.get(q.difficultyTarget)||0)+1);
  }
  if(topics.size!==5||[...topics.values()].some(n=>n!==2)||
     bands.get('G7')!==4||bands.get('G8')!==4||bands.get('G8-9')!==2)
   throw Error('Sample is not a valid five-topic 4/4/2 QA set');
  return pack.questions;
 }
 async function draw(){
  state.rendered=false;
  const q=questions[state.index];
  if(!q){status('All ten QA previews inspected. No learner progress or credit was saved.');
   el('qa-question').hidden=true;return}
  const root=el('qa-question'),formula=el('qa-formula'),choices=el('qa-choices');
  el('qa-position').textContent='Question '+(state.index+1)+' / 10 · '+q.difficultyTarget;
  el('qa-identifier').textContent=q.id+' · '+q.topicId;
  root.dataset.questionId=q.id;
  formula.classList.remove('ready');choices.classList.remove('ready');
  formula.textContent=q.stem;choices.replaceChildren();
  el('qa-worked').hidden=true;el('qa-next').hidden=true;
  const seed=Array.from(q.id).reduce((n,c)=>(Math.imul(n,33)+c.charCodeAt(0))>>>0,5381);
  for(const o of shuffle(q.options,seed)){
   const b=document.createElement('button');
   b.type='button';b.className='choice';b.dataset.optionId=o.id;
   b.setAttribute('aria-pressed','false');b.textContent=o.id+'. $'+o.latex+'$';
   b.addEventListener('click',()=>answer(q,o.id,b));
   choices.append(b);
  }
  root.hidden=false;
  status('Typesetting question and six choices…');
  await typeset([formula,choices]);
  formula.classList.add('ready');choices.classList.add('ready');
  state.rendered=true;
  status('Reviewer preview only · no score is recorded.');
 }
 async function answer(q,optionId,button){
  if(!state.rendered||state.answers.some(x=>x.id===q.id))return;
  const correct=optionId===q.correctOptionId;
  state.answers.push({id:q.id,optionId,correct});
  for(const b of el('qa-choices').querySelectorAll('button')){
   b.disabled=true;b.setAttribute('aria-pressed',String(b===button));
  }
  const worked=el('qa-worked'),steps=el('qa-solution');
  steps.replaceChildren();
  for(const step of q.workedSolutionSteps){
   const li=document.createElement('li');li.textContent=step;steps.append(li);
  }
  el('qa-result').textContent=correct?'Correct option (QA preview only).':
   'Incorrect option. Correct source choice: '+q.correctOptionId+'.';
  worked.hidden=false;
  await typeset([steps]);
  el('qa-next').hidden=false;
  status('Preview answer checked; no Student XP, MP, Daily or Mastery credit was recorded.');
 }
 el('qa-next').addEventListener('click',async()=>{state.index++;try{await draw()}catch(e){fail(e)}});
 let questions=[];
 try{
  const response=await fetch(dataPath,{cache:'no-store'});
  if(!response.ok)throw Error('QA sample data could not be loaded');
  questions=guard(await response.json());
  await mathScript();
  await window.MathJax.startup.promise;
  await draw();
 }catch(e){fail(e)}
 window.__mathsQAReviewerState=()=>({index:state.index,answers:[...state.answers],
  rendered:state.rendered,sourceStatus:state.sourceStatus});
}
