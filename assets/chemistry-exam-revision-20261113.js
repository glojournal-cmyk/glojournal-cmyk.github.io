import {CATEGORIES,STORE_KEY,categoryOf,buildBank,selectPaper,scorePaper,validateStoredState,marksOf,isRubric,isExamEligible} from './chemistry-exam-revision-core-20261113.js?v=20261114-c16-assessment-scope2';

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
function save(nextState=state){
  if(storageBlocked){notice(storageWarning||'Existing exam data could not be read. Nothing was overwritten.',true);return false;}
  try{
    const content=JSON.stringify(nextState);
    localStorage.setItem(STORE_KEY,content);
    if(localStorage.getItem(STORE_KEY)!==content)throw Error('Storage verification failed');
    // Commit new session/history/marks only after the verified disk write succeeds.
    state=nextState;
    notice('Revision answers saved on this device.');
    return true;
  }catch{
    notice('Save failed on this device. Your existing saved paper has NOT been replaced. Export a revision backup before leaving or reloading.',true);
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
    const outcome=scorePaper(bank,paper),row=el('div',null,'history-item');
    const summary=outcome.pendingQuestions?
      outcome.awarded+' / '+outcome.totalMarks+' confirmed · '+outcome.pendingQuestions+' responses awaiting rubric review':
      outcome.awarded+' / '+outcome.totalMarks+' ('+outcome.percentage+'%)';
    const left=el('span',String(paper.submittedAt||'').slice(0,10)+' · '+paperName(paper.scope)+' · '+summary);
    const open=el('button','Review paper');open.type='button';
    open.addEventListener('click',()=>{
      state.latest=paper;
      save();
      results();
    });
    row.append(left,open);root.append(row);
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
  const draft={
    id:'chem-nov16-'+Date.now(),scope:ids?'mistakes':scope,index:0,
    questionIds:selected.map(q=>q.id),answers:{},startedAt:new Date().toISOString()
  };
  if(!save({...state,active:draft}))return; // Keep an existing draft if storage is full.
  renderPaper();
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
  const maxMarks=marksOf(question);
  $('question-marks').textContent=maxMarks+' mark'+(maxMarks===1?'':'s')+' · '+(isRubric(question)?'Written response (self-review after submission)':'Automatically marked after submission');
  const stimulus=$('question-stimulus');
  const source=question.stimulus?.text||'';
  stimulus.textContent=source;stimulus.hidden=!source;
  $('prompt').textContent=question.prompt;
  const area=$('answer-area');area.replaceChildren();
  const previous=String(session.answers[id]||'');
  if(isRubric(question)){
    const label=el('label',null,'answer-box');
    label.append(el('span','Write your answer. Include working or scientific reasons where requested.'));
    const input=el('textarea');input.value=previous;input.maxLength=2000;
    input.autocomplete='off';input.spellcheck=false;
    input.setAttribute('aria-label','Your written response');
    input.placeholder='Write your explanation or show the stages of your calculation here.';
    input.addEventListener('input',()=>saveAnswer(input.value));
    label.append(input);area.append(label);
    $('answer-hint').textContent='Marks and model answers stay hidden until you submit. Then award marks point by point using the rubric.';
  }else if(question.format==='mc_single'){
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
function updateResultSummary(){
  const paper=state.latest;if(!paper)return;
  const outcome=scorePaper(bank,paper);
  $('result-score').textContent=outcome.pendingQuestions?
    outcome.awarded+' / '+outcome.totalMarks+' marks confirmed':
    outcome.awarded+' / '+outcome.totalMarks+' · '+outcome.percentage+'%';
  $('result-summary').textContent=outcome.pendingQuestions?
    outcome.pendingQuestions+' written answer'+(outcome.pendingQuestions===1?'':'s')+
      ' need self-marking below ('+outcome.pendingMarks+' marks pending). Compare each response with the marking points before selecting a score.':
    (outcome.awarded===outcome.totalMarks?
      'Full marks. Excellent recall and scientific explanation.':
      'All responses reviewed. Use the answer explanations below to identify your next revision targets.');
  const breakdown=$('breakdown');breakdown.replaceChildren();
  for(const cat of CATEGORIES){
    const stat=outcome.byCategory[cat.id];if(!stat.total)continue;
    const row=el('div',null,'topic-result'),progress=el('progress');
    progress.value=stat.awarded;progress.max=stat.max;
    progress.setAttribute('aria-label',cat.short+' assessed marks');
    row.append(el('span',cat.short),progress,
      el('b',stat.awarded+' / '+stat.max+(stat.pending?'*':'')));
    breakdown.append(row);
  }
  const missed=outcome.rows.filter(x=>x.awarded!==null&&x.awarded<x.marks);
  $('redo-wrong').hidden=outcome.pendingQuestions>0||!missed.length;
  $('redo-wrong').onclick=()=>start({ids:missed.map(x=>x.id)});
}
function results(){
  const session=state.latest;if(!session){home();return;}
  show('results');
  const outcome=scorePaper(bank,session);
  const review=$('review');review.replaceChildren();
  for(const row of outcome.rows){
    const q=row.question,needsReview=row.pending;
    const stateClass=needsReview?'pending':row.correct?'correct':'incorrect';
    const card=el('article',null,'review-item '+stateClass);
    card.append(el('span',needsReview?'Written answer · self-mark required':
      (row.awarded+' / '+row.marks+' mark'+(row.marks===1?'':'s')),'marker'));
    card.append(el('p',categoryName(row.category),'eyebrow'));
    card.append(el('h4',q.prompt));
    const given=el('p',null,'your-answer'),model=el('p',null,'model');
    given.append(el('strong','Your answer: '),document.createTextNode(row.response.trim()||'Not answered'));
    model.append(el('strong',isRubric(q)?'Indicative model answer: ':'Correct answer: '),
      document.createTextNode(q.answer.accepted[0]));
    card.append(given,model);
    if(isRubric(q)){
      const heading=el('h4','Mark scheme · '+row.marks+' marks'),criteria=el('ol',null,'rubric-marks');
      for(const item of q.markScheme)criteria.append(el('li',item));
      card.append(heading,criteria);
      if(row.response.trim()){
        const label=el('label',null,'self-mark');
        label.append(el('span','Award marks from the criteria above ('+row.marks+' maximum)'));
        const select=el('select');
        select.setAttribute('aria-label','Award marks for question '+row.id);
        const initial=el('option','Select reviewed mark');initial.value='';select.append(initial);
        for(let mark=0;mark<=row.marks;mark++){
          const option=el('option',mark+' / '+row.marks);
          option.value=String(mark);select.append(option);
        }
        select.value=session.reviewMarks?.[row.id]===undefined?'':String(session.reviewMarks[row.id]);
        select.addEventListener('change',()=>{
          if(select.value==='')return;
          const current=state.latest;
          const oldMark=current.reviewMarks?.[row.id];
          const reviewMarks={...(current.reviewMarks||{}),[row.id]:Number(select.value)};
          const nextHistory=state.history.map(item=>item.id===current.id?
            {...item,reviewMarks:{...reviewMarks}}:item);
          const nextState={...state,latest:{...current,reviewMarks},history:nextHistory};
          if(!save(nextState)){
            // A failed localStorage write must never display an awarded mark.
            select.value=oldMark===undefined?'':String(oldMark);
            return;
          }
          updateResultSummary();
          card.querySelector('.marker').textContent=select.value+' / '+row.marks+' marks · self-reviewed';
          card.classList.remove('pending','correct','incorrect');
          card.classList.add(Number(select.value)===row.marks?'correct':'incorrect');
        });
        label.append(select);card.append(label);
      }else{
        card.append(el('p','No response was submitted; 0 marks.','muted'));
      }
    }else card.append(el('p',q.feedback?.steps?.[0]||q.feedback?.short||'Review the model answer.','explanation'));
    review.append(card);
  }
  updateResultSummary();
}
function submit(){
  const session=state.active;
  if(!session)return;
  const missing=session.questionIds.filter(id=>!String(session.answers[id]||'').trim()).length;
  const message=missing?'There are '+missing+' unanswered questions. Submit anyway and mark them as incorrect?':
    'Submit your revision paper? Answers cannot be changed after submission.';
  if(!window.confirm(message))return;
  scorePaper(bank,session); // Validate before abandoning the unfinished draft.
  const completed={...session,answers:{...session.answers},submittedAt:new Date().toISOString()};
  const nextState={...state,active:null,latest:completed,history:[completed,...state.history].slice(0,20)};
  if(!save(nextState))return; // Do not show 'submitted' until the result is really saved.
  results();
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
    if(file.size>2000000)throw Error('This backup file is too large.');
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
  const urls=[...([5,6,7].map(n=>'/content/topics/chem-y9-c'+n+'.json?v=20261114-c16-assessment-scope2')), '/content/exam-revision/chemistry-nov16-2026-applied.json?v=20261114-c16-assessment-scope2'];
  const responses=await Promise.all(urls.map(url=>fetch(url,{cache:'no-store'})));
  if(responses.some(r=>!r.ok))throw Error('One or more Chemistry topic files could not load.');
  bank=buildBank(await Promise.all(responses.map(r=>r.json())));
  load();home();
  if(!storageBlocked)notice(bank.filter(isExamEligible).length+' school-assessment questions ready. C1.7/C1.8 extension questions will not be selected in a new paper.');
}catch(error){
  notice('Exam Revision could not load safely: '+error.message+' Try refreshing when online.',true);
  $('setup').hidden=false;$('start').disabled=true;$('resume').disabled=true;
}
