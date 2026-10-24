const KEY='scholar-gcse-exam-practice-v1';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
let bank,state={version:1,answers:{}},current,storageFailed=false,loadBlocked=false;
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function persist(){
 if(loadBlocked){status('An existing exam backup could not be read. Export your current work before leaving; the previous stored copy has not been overwritten.',true);return false;}
 try{const data=JSON.stringify(state);localStorage.setItem(KEY,data);if(localStorage.getItem(KEY)!==data)throw Error('verification');storageFailed=false;status('Exam draft saved on this device.');return true;}
 catch{storageFailed=true;status('This device could not save the exam draft. Your text is still on this page. Export exam answers before leaving.',true);return false;}
}
function record(){return state.answers[current.id]||(state.answers[current.id]={text:'',revealed:false,score:null});}
function validRecord(v,q){return v&&typeof v.text==='string'&&v.text.length<=100000&&typeof v.revealed==='boolean'&&(v.score===null||(Number.isInteger(v.score)&&v.score>=0&&v.score<=q.marks));}
function cancelSpeech(){globalThis.speechSynthesis?.cancel();}
function speak(script,button){
 const synth=globalThis.speechSynthesis;
 if(!synth||!globalThis.SpeechSynthesisUtterance){status('Speech is unavailable on this device. Ask an adult to read the teacher script.',true);return;}
 cancelSpeech();button.disabled=true;
 const pieces=script.match(/[^.!?]+[.!?]?/g)||[script];
 // Whole sentence, short sections, whole sentence: rehearsal playback sequence.
 const queue=pieces.flatMap(s=>[s,...s.split(/,|\s+(?=parce que|et |avec |près de )/i).filter(Boolean),s]);
 const run=()=>{if(!queue.length){button.disabled=false;return;}const u=new SpeechSynthesisUtterance(queue.shift());u.lang='fr-FR';u.rate=.85;const voice=synth.getVoices().find(v=>/^fr[-_]/i.test(v.lang));if(voice)u.voice=voice;u.onend=run;u.onerror=()=>{button.disabled=false;status('Audio playback failed. Ask an adult to use the teacher script.',true);};synth.speak(u);};run();
}
function reviewUI(q,r){
 const box=el('section',undefined,'rubric');box.id='rubric';box.append(el('h3','Mark scheme · self or teacher review'),el('p',q.markingNote));
 if(q.levels){const list=el('ul');for(const l of q.levels)list.append(el('li',`${l.marks} marks: ${l.descriptor}`));box.append(list);box.append(el('h3','Indicative scientific content'));}
 const list=el('ol');for(const p of q.markScheme)list.append(el('li',p));box.append(list);
 if(q.meaningUnits){box.append(el('h3','15 translation meaning units'));const units=el('ol');q.meaningUnits.forEach(p=>units.append(el('li',p)));box.append(units);}
 if(q.model){box.append(el('h3','Suggested answer / transcript'),el('p',q.model,'model'));}
 if(q.planning){box.append(el('h3','Revision checklist'));const ul=el('ul');q.planning.forEach(p=>ul.append(el('li',p)));box.append(ul);}
 const link=el('a','Official specification and assessment guidance');link.href=bank.subjects[q.subject].source+(q.subject==='french'?'/scheme-of-assessment':'');link.target='_blank';link.rel='noopener';box.append(link);
 const label=el('label','Reviewed mark','score');const select=el('select');select.id='score';const empty=el('option','Not yet reviewed');empty.value='';select.append(empty);for(let i=0;i<=q.marks;i++){const option=el('option',`${i} / ${q.marks}`);option.value=String(i);select.append(option);}select.value=r.score===null?'':String(r.score);
 select.addEventListener('change',()=>{r.score=select.value===''?null:Number(select.value);r.updatedAt=new Date().toISOString();persist();updateReviewed();});label.append(select);box.append(label,el('p','This is a practice review, not an examiner-awarded score or GCSE grade.'));return box;
}
function updateReviewed(){const items=bank.questions.filter(q=>q.subject===current.subject);const reviewed=items.filter(q=>state.answers[q.id]?.score!==null&&state.answers[q.id]?.score!==undefined);$('reviewed').textContent=`${reviewed.length} of ${items.length} questions reviewed in ${current.subject}.`;}
function render(){
 cancelSpeech();current=bank.questions.find(q=>q.id===$('question').value);const task=$('task');task.replaceChildren();if(!current){task.hidden=true;return;}task.hidden=false;const q=current,r=record();state.last=q.id;const info=bank.subjects[q.subject];
 task.append(el('p',`${info.board} ${info.specification} · ${q.difficulty} · ${q.kind.replaceAll('_',' ')} · ${q.marks} marks · ${q.minutes} min · ${q.ao}`,'badge'),el('h2',q.topic),el('p',`Specification focus: ${q.specRef}`,'badge'));
 if(q.textSource)task.append(el('p',q.textSource,'warning'));if(q.resourceNote)task.append(el('p',q.resourceNote,'warning'));
 if(q.stimulus){const s=el('div',q.stimulus,'stimulus');s.lang=q.subject==='latin'?'la':q.subject==='french'?'fr':'en';task.append(s);}
 if(q.glossary)task.append(el('p',Object.entries(q.glossary).map(([a,b])=>`${a}: ${b}`).join(' · ')));
 if(q.translation){const d=el('details');d.append(el('summary','Support translation'),el('p',q.translation));task.append(d);}
 task.append(el('p',q.prompt,'prompt'));
 if(q.audioScript){const b=el('button','Listen');b.type='button';b.addEventListener('click',()=>speak(q.audioScript,b));task.append(b);}
 if(q.teacherScript||q.audioScript){const d=el('details',undefined,'teacher');d.append(el('summary','Adult only: examiner prompts / dictation script'));const content=q.teacherScript||[q.audioScript];content.forEach(x=>d.append(el('p',x)));d.append(el('p','Keep this panel closed while the learner prepares. For dictation: read each sentence once, then in short sections, then once in full.'));task.append(d);}
 const label=el('label',q.responseMode==='oral'?'Notes after speaking (an adult must listen to assess)':q.responseMode==='drawing'?'Draw on paper; record your calculations, explanations and drawing reference here':'Your answer and working','answer-label');label.htmlFor='answer';
 const input=el('textarea');input.id='answer';input.value=r.text;input.maxLength=100000;input.autocomplete='off';input.spellcheck=false;input.lang=q.subject==='french'?'fr':'en';task.append(label,input,el('p','','badge'));const count=el('p');count.id='wordcount';task.append(count);const updateCount=()=>{count.textContent=`${input.value.trim()?input.value.trim().split(/\s+/).length:0} words${q.targetWords?` · approximately ${q.targetWords} requested`:''}`;};updateCount();
 input.addEventListener('input',()=>{r.text=input.value;r.updatedAt=new Date().toISOString();if(r.score!==null){r.score=null;const score=$('score');if(score)score.value='';updateReviewed();}updateCount();persist();});
 const actions=el('div',undefined,'actions'),reveal=el('button','Reveal mark scheme','primary');reveal.type='button';reveal.disabled=r.revealed;reveal.addEventListener('click',()=>{r.revealed=true;persist();render();$('rubric').scrollIntoView({block:'nearest'});});actions.append(reveal);
 const next=el('button','Next question');next.type='button';next.disabled=$('question').selectedIndex===$('question').options.length-1;next.addEventListener('click',()=>{persist();$('question').selectedIndex++;render();persist();$('task').scrollIntoView({block:'start'});});actions.append(next);task.append(actions);if(r.revealed)task.append(reviewUI(q,r));task.append(el('p','','badge'));const reviewed=el('p');reviewed.id='reviewed';task.append(reviewed);updateReviewed();
}
function populate(preferred){const subject=$('subject').value,diff=$('difficulty').value;$('question').replaceChildren();for(const q of bank.questions.filter(q=>q.subject===subject&&(diff==='all'||q.difficulty===diff))){const o=el('option',`${q.id.split('-').at(-1)} · ${q.topic} (${q.marks})`);o.value=q.id;$('question').append(o);}if([...$('question').options].some(o=>o.value===preferred))$('question').value=preferred;render();}
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='scholar-gcse-exam-answers.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);});
$('import').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error('File is too large.');const incoming=JSON.parse(await file.text());if(incoming.version!==1||!incoming.answers||typeof incoming.answers!=='object')throw Error('Choose an Exam Practice export, not a general Scholar progress file.');const entries=Object.entries(incoming.answers);for(const [id,v] of entries){const q=bank.questions.find(q=>q.id===id);if(!q||!validRecord(v,q))throw Error('An answer record is invalid; nothing was imported.');}let imported=0;for(const [id,v] of entries){const existing=state.answers[id];if(!existing||(!existing.text&&existing.score===null)){state.answers[id]=v;imported++;}}loadBlocked=false;const saved=persist();render();if(saved)status(`Restored ${imported} answers into empty entries. Existing work was kept.`);}catch(e){status(e.message,true);}event.target.value='';});
try{
 const response=await fetch('/content/exam-practice/gcse-20261024.json');if(!response.ok)throw Error('Question bank could not be loaded.');bank=await response.json();
 try{const raw=localStorage.getItem(KEY);if(raw){const saved=JSON.parse(raw);if(saved.version!==1||!saved.answers||typeof saved.answers!=='object')throw Error();for(const [id,v] of Object.entries(saved.answers)){const q=bank.questions.find(q=>q.id===id);if(!q||!validRecord(v,q))throw Error();}state=saved;}}catch{loadBlocked=true;status('Saved exam drafts could not be read. The stored copy has not been overwritten. Export current work before leaving.',true);}
 $('notice').textContent=bank.notice;for(const [s,info] of Object.entries(bank.subjects)){const o=el('option',`${s[0].toUpperCase()+s.slice(1)} · ${info.board} ${info.specification}`);o.value=s;$('subject').append(o);}
 const last=bank.questions.find(q=>q.id===state.last),requested=new URLSearchParams(location.search).get('subject');$('subject').value=Object.hasOwn(bank.subjects,requested)?requested:(last?.subject||'physics');populate(last?.id);
 $('subject').addEventListener('change',()=>{populate();persist();});$('difficulty').addEventListener('change',()=>{populate();persist();});$('question').addEventListener('change',()=>{render();persist();});if(!loadBlocked)status('Ready. Your answers save as you type.');
}catch(e){status(`Unable to open Exam Practice: ${e.message} Reload this page to retry.`,true);}
window.addEventListener('pagehide',cancelSpeech);
