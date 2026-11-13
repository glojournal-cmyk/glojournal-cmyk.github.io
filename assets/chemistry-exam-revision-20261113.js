import {CATEGORIES,STORE_KEY,categoryOf,buildBank,selectPaper,scorePaper,validateStoredState} from './chemistry-exam-revision-core-20261113.js';

const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{
  const n=document.createElement(tag);
  if(text!==undefined&&text!==null)n.textContent=text;
  if(cls)n.className=cls;
  return n;
};
let bank=[];
let state={version:1,active:null,latest:null,history:[]};
let storageBlocked=false;
let storageWarning='';
const categoryName=id=>CATEGORIES.find(x=>x.id===id)?.short||'Chemistry';
const paperName=scope=>scope==='mixed'?'Mixed assessment':scope==='mistakes'?'Missed-question review':categoryName(scope);

function notice(message,error=false){
  $('status').textContent=message;
  $('status').classList.toggle('error',!!error);
}
function save(){
  if(storageBlocked){notice(storageWarning||'Existing exam data could not be read. Nothing was overwritten.',true);return false;}
  try{
    const content=JSON.stringify(state);
    localStorage.setItem(STORE_KEY,content);
    if(localStorage.getItem(STORE_KEY)!==content)throw Error('Storage verification failed');
    notice('Revision answers saved on this device.');
    return true;
  }catch{
    notice('Unable to save on this device. Keep this page open and export a backup.',true);
    return false;
  }
}
function load(){
  try{
    const raw=localStorage.getItem(STORE_KEY);
    if(raw)state=validateStoredState(JSON.parse(raw),bank);
  }catch{
    storageBlocked=true;
    storageWarning='Existing Exam Revision data could not be read. Nothing was overwritten. Import a valid revision backup to recover it.';
    notice(storageWarning,true);
  }
}
function show(which){
  for(const name of ['setup','paper','results'])$(name).hidden=name!==which;
}
function answered(session){
  const count=session.questionIds.filter(id=>String(session.answers[id]||'').trim()).length;
  return count+' of '+session.questionIds.length+' answered';
}
function history(){
  const root=$('history');root.replaceChildren();
  if(!state.history.length){root.append(el('p','No papers completed yet.','muted'));return;}
  for(const paper of state.history.slice(0,8)){
    const result=scorePaper(bank,paper),row=el('div',null,'history-item');
    row.append(el('span',String(paper.submittedAt||'').slice(0,10)+' · '+paperName(paper.scope)),
      el('strong',result.correct+' / '+result.total+' ('+result.percentage+'%)'));
    root.append(row);
  }
}
function home(){
  show('setup');
  $('start').disabled=storageBlocked;
  $('resume').hidden=!state.active;
  $('resume').disabled=storageBlocked;
  if(state.active)$('resume').textContent='Resume unfinished paper · '+answered(state.active);
  history();
}
function start({scope='mixed',length=20,ids=null}={}){
  if(storageBlocked){notice(storageWarning,true);return;}
  if(state.active&&!window.confirm('Replace your unfinished paper? Its unsubmitted answers will be lost.'))return;
  const selected=ids?ids.map(id=>bank.find(q=>q.id===id)).filter(Boolean):
    selectPaper(bank,{scope,length,previousIds:state.latest?.questionIds||[]});
  if(!selected.length){notice('There are no questions in this selection.',true);return;}
  state.active={
    id:'chem-nov16-'+Date.now(),scope:ids?'mistakes':scope,index:0,
    questionIds:selected.map(q=>q.id),answers:{},startedAt:new Date().toISOString()
  };
  save();renderPaper();
}
function saveAnswer(answer){
  const session=state.active;
  if(!session)return;
  session.answers[session.questionIds[session.index]]=String(answer).slice(0,2000);
  save();
  $('answered').textContent=answered(session);
}
function navigate(change){
  if(!state.active)return;
  state.active.index=Math.max(0,Math.min(state.active.questionIds.length-1,state.active.index+change));
  save();renderPaper();
  $('question-number').scrollIntoView({block:'nearest'});
}
function renderPaper(){
  const session=state.active;
  if(!session){home();return;}
  const index=session.index,count=session.questionIds.length;
  const id=session.questionIds[index],question=bank.find(q=>q.id===id);
  if(!question){notice('A saved question could not be found. Please reload.',true);return;}
  show('paper');
  $('paper-title').textContent=paperName(session.scope)+' · '+count+' questions';
  $('position').textContent='Question '+(index+1)+' / '+count;
  $('answered').textContent=answered(session);
  $('progress').value=index+1;$('progress').max=count;
  $('question-category').textContent=categoryName(categoryOf(question));
  $('question-number').textContent='Question '+(index+1);
  $('prompt').textContent=question.prompt;
  const area=$('answer-area');area.replaceChildren();
  const previous=String(session.answers[id]||'');
  if(question.format==='mc_single'){
    const fieldset=el('fieldset',null,'options');
    fieldset.append(el('legend','Choose one answer'));
    for(const choice of question.options||[]){
      const label=el('label',null,'option'),input=el('input');
      input.type='radio';input.name='exam-choice';input.value=choice;
      input.checked=choice===previous;
      input.addEventListener('change',()=>saveAnswer(choice));
      label.append(input,el('span',choice));fieldset.append(label);
    }
    area.append(fieldset);
    $('answer-hint').textContent='Your choice is saved. Correct answers are hidden until submission.';
  }else{
    const label=el('label',null,'answer-box');
    label.append(el('span',id.includes('-balance-')?'Write the entire balanced equation':'Your answer'));
    const input=el('input');input.type='text';input.value=previous;input.maxLength=2000;
    input.autocomplete='off';input.autocapitalize='off';input.spellcheck=false;
    input.setAttribute('aria-label','Your answer');
    input.placeholder=id.includes('-balance-')?'e.g. 2H2 + O2 -> 2H2O':id.includes('-formula-')?'e.g. MgCl2':'Type your answer';
    input.addEventListener('input',()=>saveAnswer(input.value));
    label.append(input);area.append(label);
    $('answer-hint').textContent=id.includes('-balance-')?
      'Change coefficients only. Normal digits, subscripts, → and -> are accepted. Write both sides.':
      id.includes('-formula-')?'Normal digits or subscripts are accepted. Capital letters in chemical symbols must be correct.':
      'Write the requested number or electron arrangement. You can edit it before submitting.';
  }
  $('previous').disabled=index===0;
  $('next').hidden=index===count-1;
  $('submit').hidden=index!==count-1;
}
function results(){
  const session=state.latest;
  if(!session){home();return;}
  show('results');
  const outcome=scorePaper(bank,session),missed=outcome.rows.filter(x=>!x.correct);
  $('result-score').textContent=outcome.correct+' / '+outcome.total+' · '+outcome.percentage+'%';
  $('result-summary').textContent=missed.length?
    missed.length+' question'+(missed.length===1?'':'s')+' to review. Read the explanations and retry the missed ones.':
    'All correct! Start another paper to strengthen recall.';
  const breakdown=$('breakdown');breakdown.replaceChildren();
  for(const cat of CATEGORIES){
    const stat=outcome.byCategory[cat.id];
    if(!stat.total)continue;
    const row=el('div',null,'topic-result'),progress=el('progress');
    progress.value=stat.correct;progress.max=stat.total;
    progress.setAttribute('aria-label',cat.short+' correct');
    row.append(el('span',cat.short),progress,el('b',stat.correct+' / '+stat.total));
    breakdown.append(row);
  }
  $('redo-wrong').hidden=!missed.length;
  $('redo-wrong').onclick=()=>start({ids:missed.map(x=>x.id)});
  const review=$('review');review.replaceChildren();
  for(const row of outcome.rows){
    const q=row.question,card=el('article',null,'review-item '+(row.correct?'correct':'incorrect'));
    card.append(el('span',row.correct?'Correct · 1 mark':'Check this answer · 0 marks','marker'));
    card.append(el('p',categoryName(row.category),'eyebrow'));
    card.append(el('h4',q.prompt));
    const given=el('p',null,'your-answer'),model=el('p',null,'model');
    given.append(el('strong','Your answer: '),document.createTextNode(row.response.trim()||'Not answered'));
    model.append(el('strong','Correct answer: '),document.createTextNode(q.answer.accepted[0]));
    card.append(given,model,el('p',q.feedback?.steps?.[0]||q.feedback?.short||'Review the model answer.','explanation'));
    review.append(card);
  }
}
function submit(){
  const session=state.active;
  if(!session)return;
  const missing=session.questionIds.filter(id=>!String(session.answers[id]||'').trim()).length;
  const message=missing?'There are '+missing+' unanswered questions. Submit anyway and mark them as incorrect?':
    'Submit your revision paper? Answers cannot be changed after submission.';
  if(!window.confirm(message))return;
  scorePaper(bank,session); // Validate before abandoning the unfinished draft.
  session.submittedAt=new Date().toISOString();
  state.latest={...session,answers:{...session.answers}};
  state.history=[state.latest,...state.history].slice(0,20);
  state.active=null;
  save();results();
  $('results').scrollIntoView({block:'start'});
}
function exportBackup(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=el('a');
  a.href=url;a.download='chemistry-exam-revision-2026-11-backup.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}
async function importBackup(event){
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>300000)throw Error('This backup file is too large.');
    const incoming=validateStoredState(JSON.parse(await file.text()),bank);
    if(!window.confirm('Replace ONLY this device’s separate Chemistry Exam Revision record? Your main Scholar progress will not change.'))return;
    const content=JSON.stringify(incoming);
    localStorage.setItem(STORE_KEY,content);
    if(localStorage.getItem(STORE_KEY)!==content)throw Error('Saved import could not be verified.');
    state=incoming;storageBlocked=false;storageWarning='';home();
    notice('Chemistry Exam Revision backup restored.');
  }catch(error){notice('Backup not imported: '+error.message,true);}
  finally{event.target.value='';}
}
$('start').addEventListener('click',()=>start({scope:$('scope').value,length:Number($('length').value)}));
$('resume').addEventListener('click',renderPaper);
$('back-setup').addEventListener('click',home);
$('previous').addEventListener('click',()=>navigate(-1));
$('next').addEventListener('click',()=>navigate(1));
$('submit').addEventListener('click',submit);
$('new-paper').addEventListener('click',home);
$('export').addEventListener('click',exportBackup);
$('import').addEventListener('change',importBackup);

try{
  const urls=[5,6,7].map(n=>'/content/topics/chem-y9-c'+n+'.json?v=20261113-exam-revision');
  const responses=await Promise.all(urls.map(url=>fetch(url,{cache:'no-store'})));
  if(responses.some(r=>!r.ok))throw Error('One or more Chemistry topic files could not load.');
  bank=buildBank(await Promise.all(responses.map(r=>r.json())));
  load();home();
  if(!storageBlocked)notice('62 assessment questions ready. Choose a topic or start a mixed paper.');
}catch(error){
  notice('Exam Revision could not load safely: '+error.message+' Try refreshing when online.',true);
  $('setup').hidden=false;$('start').disabled=true;$('resume').disabled=true;
}
