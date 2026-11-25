import {V3_APPROVED, mathsEvidence, validateMathQuestion} from '../daily-tasks-v3-20261122.js';
import {readMarkedAnswers, mergeMarkedEvidence, saveFirstMathsAnswer} from '../durable-study-evidence-20261018.js';
import {makeVerifiedMathsSubmission, verifyMathDailyAssignment} from './daily-v31-formal-submission.js';
import {mathsRichTextHTML, mathsOptionHTML} from './math-v31-native-mathml.js';

function londonDay(){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',
   year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const fields=Object.fromEntries(parts.map(({type,value})=>[type,value]));
 return [fields.year,fields.month,fields.day].join('-');
}

function assignment(bank){
 const state=JSON.parse(localStorage.getItem('lux-scholar-garden-v1')||'null')?.state;
 const day=londonDay();
 const task=state?.daily?.find(t=>t.id==='maths-daily'&&t.planDate===day);
 const checked=verifyMathDailyAssignment(task,bank,day);
 if(state?.today!==day||!checked.valid||checked.questions.some(q=>q.id.startsWith('LUX-MATH-Y9-')))throw Error('Open today’s Maths assignment from Daily Tasks.');
 const attempts=Array.isArray(state.formalAttemptLog)?state.formalAttemptLog:[];
 return {day,task,questions:checked.questions,attempts};
}

async function openStudentDaily(){
 // The reviewer preview must never open a learner journal.
 const params=new URLSearchParams(location.search);
 if(['qa','recover','recovery','recoveryFor','hint','assisted','scaffolded'].some(key=>params.has(key))||
    V3_APPROVED.mathsRuntimeReady!==true)return;
 const bank=V3_APPROVED.maths.filter(q=>validateMathQuestion(q).valid);
 if(bank.length<10)return;
 const el=id=>document.getElementById(id);
 const status=el('daily-status'),stem=el('daily-question'),options=el('daily-options'),
   feedback=el('daily-feedback'),next=el('daily-next');
 el('maths-hold').hidden=true;
 el('formal-maths').hidden=false;
 document.title="Maths Daily · Scholar’s Garden";
 let busy=false;
 const reset=()=>{
   options.replaceChildren();stem.replaceChildren();feedback.replaceChildren();next.hidden=true;
 };
 async function show(){
   reset(); status.textContent='Loading today’s answers…';
   try{
     const {day,task,questions,attempts}=assignment(bank);
     const history=mergeMarkedEvidence(attempts,await readMarkedAnswers());
     const progress=mathsEvidence(history,day,task);
     const submitted=new Set(history.filter(a=>a.day===day&&a.dailyTaskId===task.id&&a.formal===true)
       .map(a=>String(a.questionId).split('@')[0]));
     const question=questions.find(q=>!submitted.has(q.id));
     if(!question){
       status.textContent=progress.completed
         ? 'Counted into today’s Daily Tasks · '+progress.correct+'/10 correct.'
         : progress.attemptFinished
           ? 'Finished · '+progress.correct+'/10 correct. The Daily target is 9/10.'
           : 'Some saved answers could not be verified. Open Daily Tasks to check this assignment.';
       return;
     }
     // Render every field first. A malformed choice or solution must prevent a submission.
     const questionHTML=mathsRichTextHTML(question.stemLatex||question.stem);
     const steps=question.workedSolution.map(mathsRichTextHTML);
     const buttons=question.options.map(o=>{
       const button=document.createElement('button');button.type='button';button.dataset.optionId=o.id;
       button.innerHTML=mathsOptionHTML({...o,latex:o.latex||o.text});
       button.prepend(document.createTextNode(o.id+'. '));
       button.addEventListener('click',()=>submit(o.id));
       return button;
     });
     stem.dataset.questionId=question.id;stem.innerHTML=questionHTML;options.replaceChildren(...buttons);
     status.textContent='Question '+(questions.filter(q=>submitted.has(q.id)).length+1)+' of 10';
     async function submit(selectedOptionId){
       if(busy)return;
       busy=true;buttons.forEach(b=>b.disabled=true);
       try{
         const now=assignment(bank);
         if(now.day!==day||JSON.stringify(now.task.approvedQuestionIds)!==JSON.stringify(task.approvedQuestionIds)){
           throw Error('The assignment changed. Reopen today’s Daily Tasks.');
         }
         const prior=mergeMarkedEvidence(now.attempts,await readMarkedAnswers());
         const result=makeVerifiedMathsSubmission({day,task:now.task,approvedQuestions:bank,
           questionId:question.id,selectedOptionId,priorAttempts:prior,submittedAt:new Date().toISOString()});
         if(result.reasons?.includes('already-submitted-first-attempt')){await show();return;}
         if(!result.accepted)throw Error('This response could not be verified. Reopen today’s Daily Tasks.');
         const saved=await saveFirstMathsAnswer(result.formalAttempt);
         const msg=document.createElement('p');
         msg.textContent=(saved.correct?'Correct. ':'Correct choice: '+question.correctOptionId+'. ')+
           'Your first answer ('+saved.selectedOptionId+') is saved.';
         const list=document.createElement('ol');
         for(const html of steps){const li=document.createElement('li');li.innerHTML=html;list.append(li);}
         feedback.replaceChildren(msg,list);next.hidden=false;next.focus();
       }catch(error){
         status.textContent=error.message||'The answer could not be saved. Try again.';
         buttons.forEach(b=>b.disabled=false);
       }finally{busy=false;}
     }
   }catch(error){reset();status.textContent=error.message||'Today’s assignment could not be opened.';}
 }
 next.addEventListener('click',()=>{if(!busy)void show();});
 await show();
}
if(typeof document!=='undefined')void openStudentDaily();
