import {validateMockBank,validateMockState,mockQuestions,getMockScore,remainingSeconds,MOCK_STORAGE_KEY} from './chemistry-school-mock-core-20261114.js';
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!=null)x.textContent=text;if(cls)x.className=cls;return x;};
const categories={history:'C1.5 History',atomic:'C1.6 Structure',formula:'Chemical Formulae',balance:'Chemical Equations'};
let bank=null,blocked=false,record={version:1,active:null,latest:null,history:[]};
function show(s){for(const p of ['setup','paper','results'])$(p).hidden=p!==s;}
function notice(s,bad=false){$('status').textContent=s;$('status').classList.toggle('error',bad);$('save-error').hidden=!bad;$('save-error').textContent=bad?s:'';}
function store(next){if(blocked)return false;try{const v=JSON.stringify(next);localStorage.setItem(MOCK_STORAGE_KEY,v);
  if(localStorage.getItem(MOCK_STORAGE_KEY)!==v)throw Error('Read-back failed');
  record=next;notice('Answers saved on this device.');return true;
}catch{notice('Save failed. Your earlier answers have NOT been overwritten. Export a backup before leaving.',true);return false;}}
function count(s){return s.questionIds.filter(id=>String(s.answers[id]||'').trim()).length;}
function setup(){show('setup');$('start').disabled=blocked;$('resume').hidden=!record.active;$('resume').disabled=blocked;
  if(record.active)$('resume').textContent='Resume Mock '+record.active.paperId+' · '+count(record.active)+'/13 answered';
  const root=$('history');root.replaceChildren();
  if(!record.history.length){root.append(el('p','No completed school mocks yet.','muted'));return;}
  for(const p of record.history.slice(0,6)){const result=getMockScore(bank,p),row=el('div',null,'history-item');
    const label=(p.submittedAt||'').slice(0,10)+' · Mock '+p.paperId+' · '+result.awarded+'/20'+(result.pendingQuestions?' · self-mark required':' ('+result.percentage+'%)');
    const b=el('button','Review');b.onclick=()=>{if(store({...record,latest:p}))results();};
    row.append(el('span',label),b);root.append(row);}
}
function begin(){if(blocked||!bank)return;if(record.active&&!confirm('Replace your unfinished mock and its unsubmitted answers?'))return;
  const paperId=$('version').value,qs=mockQuestions(bank,paperId);
  const active={id:'mock-'+Date.now(),paperId,index:0,questionIds:qs.map(q=>q.id),answers:{},startedAt:new Date().toISOString()};
  if(store({...record,active}))render();
}
function question(s){return bank.questions.find(q=>q.id===s.questionIds[s.index]);}
function updateAnswer(answer){const s=record.active;if(!s)return;
  const answers={...s.answers,[s.questionIds[s.index]]:String(answer).slice(0,2000)};
  if(store({...record,active:{...s,answers}}))$('answered').textContent=count(record.active)+' of 13 answered';
}
function move(n){const s=record.active;if(!s)return;const index=Math.max(0,Math.min(12,s.index+n));
  if(index!==s.index&&store({...record,active:{...s,index}})){render();$('question-number').scrollIntoView({block:'nearest'});}
}
function tick(){if(!record.active||$('paper').hidden)return;const secs=remainingSeconds(record.active.startedAt),mm=String(Math.floor(secs/60)).padStart(2,'0'),ss=String(secs%60).padStart(2,'0');
  $('clock').textContent=secs?mm+':'+ss+' remaining':'00:00 · time limit reached';
  $('clock').classList.toggle('clock-ended',secs===0);
  $('time-note').textContent=secs?'Timer continues if you leave and resume the paper.':'20 minutes have elapsed. Submit when ready; saved answers are not deleted.';}
function render(){const s=record.active;if(!s){setup();return;}const q=question(s);if(!q){notice('A saved question is missing.',true);return;}
  show('paper');$('paper-title').textContent='School Mock '+s.paperId+' · 20 marks';
  $('position').textContent='Question '+(s.index+1)+' of 13';$('answered').textContent=count(s)+' of 13 answered';
  $('progress').value=s.index+1;$('progress').max=13;
  const cat=q.id.includes('-calc-')?'atomic':q.topicSkill;
  $('topic').textContent=categories[cat];$('question-number').textContent='Question '+(s.index+1)+' · '+q.marks+' mark'+(q.marks===1?'':'s');
  $('prompt').textContent=q.prompt;
  const figure=$('figure');figure.replaceChildren();figure.hidden=!q.figure;
  if(q.figure){const img=el('img');img.src=q.figure.src;img.alt=q.figure.alt;img.loading='eager';
    figure.append(img,el('figcaption','Schematic diagram; not to scale.'));}
  const stim=$('stimulus');stim.textContent=q.stimulus?.text||'';stim.hidden=!stim.textContent;
  const root=$('answer-area');root.replaceChildren();const saved=s.answers[q.id]||'';
  if(q.format==='mc_single'){const choices=el('fieldset',null,'options');choices.append(el('legend','Choose one answer'));
    for(const option of q.options){const label=el('label',null,'option'),input=el('input');input.type='radio';input.name='answer';input.value=option;input.checked=option===saved;
      input.onchange=()=>updateAnswer(option);label.append(input,el('span',option));choices.append(label);}root.append(choices);
  }else{const label=el('label',null,'answer-box');label.append(el('span',q.format==='rubric_response'?'Write a full answer with separate scientific points.':'Write the complete answer.'));
    const input=el(q.format==='rubric_response'?'textarea':'input');if(input.tagName==='INPUT')input.type='text';
    input.value=saved;input.autocomplete='off';input.spellcheck=false;input.maxLength=2000;input.setAttribute('aria-label','Your answer');
    input.placeholder=q.format==='rubric_response'?'Explain and show your working.':'Type your formula, number or equation.';
    input.oninput=()=>updateAnswer(input.value);label.append(input);root.append(label);}
  $('previous').disabled=s.index===0;$('next').hidden=s.index===12;$('submit').hidden=s.index!==12;tick();
}
function submit(){const s=record.active;if(!s)return;const blanks=13-count(s);
  if(!confirm(blanks?blanks+' answers are blank and will get 0 marks. Submit anyway?':'Submit this mock and reveal the marking scheme?'))return;
  const complete={...s,submittedAt:new Date().toISOString()};getMockScore(bank,complete);
  if(!store({...record,active:null,latest:complete,history:[complete,...record.history].slice(0,20)}))return;
  results();$('results').scrollIntoView({block:'start'});}
function summary(){const result=getMockScore(bank,record.latest);
  $('score').textContent=result.awarded+'/20 marks'+(result.pendingQuestions?' confirmed':' · '+result.percentage+'%');
  $('result-note').textContent=result.pendingQuestions?result.pendingQuestions+' written response(s) await self-marking against the points below.':'All answers reviewed. Check the marking points for areas to revise.';
  const root=$('breakdown');root.replaceChildren();
  for(const c of [{id:'history',name:'C1.5 History'},{id:'atomic',name:'C1.6 Structure'},{id:'formula',name:'Formulae'},{id:'balance',name:'Equations'}]){
    const d=result.byCategory[c.id],line=el('div',null,'topic-result'),bar=el('progress');bar.max=d.max;bar.value=d.awarded;
    line.append(el('span',c.name),bar,el('strong',d.awarded+' / '+d.max));root.append(line);}
}
function results(){if(!record.latest){setup();return;}show('results');
  $('result-title').textContent='School Mock '+record.latest.paperId+' · review';
  const list=$('review');list.replaceChildren();
  for(const row of getMockScore(bank,record.latest).rows){
    const q=row.question,card=el('article',null,'review-item '+(row.pending?'pending':row.correct?'correct':'incorrect'));
    card.append(el('span',row.pending?'Written answer · self-mark required':row.awarded+' / '+q.marks+' mark(s)','marker'),el('h4',q.prompt));
    if(q.figure){const img=el('img',null,'review-figure');img.src=q.figure.src;img.alt=q.figure.alt;card.append(img);}
    const given=el('p',null,'your-answer');given.append(el('strong','Your answer: '),document.createTextNode(row.response||'Not answered'));
    const solution=el('p',null,'model');solution.append(el('strong','Model answer: '),document.createTextNode(q.answer.accepted[0]));
    card.append(given,solution);
    if(q.format==='rubric_response'){
      const points=el('ol',null,'rubric-marks');for(const p of q.markScheme)points.append(el('li',p));card.append(points);
      if(row.response.trim()){const label=el('label',null,'self-mark');label.append(el('span','Award marks for distinct points present'));
        const control=el('select');control.setAttribute('aria-label','Award marks for '+q.id);
        const empty=el('option','Select mark');empty.value='';control.append(empty);
        for(let m=0;m<=q.marks;m++){const opt=el('option',m+' / '+q.marks);opt.value=String(m);control.append(opt);}
        control.value=record.latest.reviewMarks?.[q.id]===undefined?'':String(record.latest.reviewMarks[q.id]);
        control.onchange=()=>{if(control.value==='')return;const old=record.latest.reviewMarks?.[q.id];
          const marks={...(record.latest.reviewMarks||{}),[q.id]:Number(control.value)};
          const updated={...record.latest,reviewMarks:marks};
          const history=record.history.map(h=>h.id===updated.id?{...h,reviewMarks:marks}:h);
          if(!store({...record,latest:updated,history})){control.value=old===undefined?'':String(old);return;}
          summary();card.querySelector('.marker').textContent=control.value+' / '+q.marks+' · self-reviewed';
          card.classList.remove('pending','correct','incorrect');card.classList.add(Number(control.value)===q.marks?'correct':'incorrect');};
        label.append(control);card.append(label);
      }else card.append(el('p','Unanswered: 0 marks.','muted'));
    }else card.append(el('p',q.feedback.steps[0],'explanation'));
    list.append(card);
  }summary();
}
function backup(){const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});
  const link=URL.createObjectURL(blob),a=el('a');a.href=link;a.download='chemistry-school-mock-2026-11-16.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(link),10000);}
async function restore(event){const file=event.target.files?.[0];if(!file)return;
  try{if(file.size>2000000)throw Error('File too large');
    const incoming=validateMockState(JSON.parse(await file.text()),bank);
    if(!confirm('Replace only these separate Chemistry School Mock records on this device?'))return;
    const data=JSON.stringify(incoming);localStorage.setItem(MOCK_STORAGE_KEY,data);
    if(localStorage.getItem(MOCK_STORAGE_KEY)!==data)throw Error('Save verification failed');
    record=incoming;blocked=false;setup();notice('Mock backup restored.');
  }catch(e){notice('Backup not imported: '+e.message,true);}finally{event.target.value='';}}
$('start').onclick=begin;$('resume').onclick=render;$('back').onclick=setup;$('previous').onclick=()=>move(-1);
$('next').onclick=()=>move(1);$('submit').onclick=submit;$('new-paper').onclick=setup;
$('export').onclick=backup;$('paper-export').onclick=backup;$('import').onchange=restore;
setInterval(tick,1000);
try{const response=await fetch('/content/exam-revision/chemistry-school-mock-20261114.json?v=20261114-mock1',{cache:'no-store'});
  if(!response.ok)throw Error('Question data unavailable');
  bank=validateMockBank(await response.json());
  const saved=localStorage.getItem(MOCK_STORAGE_KEY);
  if(saved)record=validateMockState(JSON.parse(saved),bank);
  setup();notice('Three Chemistry school mock papers ready · 20 minutes · 20 marks each.');
}catch(e){blocked=true;show('setup');$('start').disabled=true;$('resume').disabled=true;notice('Mock could not load safely: '+e.message,true);}
