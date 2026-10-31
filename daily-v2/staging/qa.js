/* Standalone QA-only browser interface. No production script imports and no
 * student records, legacy keys or real learning assessment.
 */
import {STAGING_DAY,STAGING_EXPECTED} from './qa-fixture.js';
import {qaDatabaseName,openQaSession,readQaSession,nextQaQuestion,commitQaAttempt} from './qa-controller.js';
import {createIndexedDbDailyV2Repository} from '../src/indexeddb-repository.js';
import {DAILY_V2_TASKS} from '../src/planner.js';

const el=id=>document.getElementById(id);
let scenario='ready',repo=null,session=null,selectedTaskId=null,busy=false;
let pendingAttempt=null,failNextWrite=false;
function notify(message,isError=false){
 el('notice').textContent=message;el('notice').classList.toggle('error',isError);
}
function setBusy(value){
 busy=value;
 for(const id of ['scenario','initialize','simulateFailure','refreshView','reset','submitAnswer'])
  el(id).disabled=busy;
}
async function guarded(job){
 if(busy)return;
 setBusy(true);
 try{await job();}catch(err){notify('QA failure: '+(err?.message||String(err)),true);}
 finally{setBusy(false);}
}
function getRepo(){
 if(!repo)repo=createIndexedDbDailyV2Repository({databaseName:qaDatabaseName(scenario)});
 return repo;
}
function text(parent,tag,value,className){
 const node=document.createElement(tag);node.textContent=value;
 if(className)node.className=className;parent.appendChild(node);return node;
}
function safeStateMessage(summary){
 return summary.planStatus==='partial'?
  'PARTIAL QA — '+summary.unavailableTasks+' task(s) unavailable; full-day reward is not eligible.':
  summary.fullDayComplete?'QA full day complete. No real XP awarded.':
  'Full plan frozen. QA scores persist only in this separate staging database.';
}
function render(){
 const grid=el('taskGrid');grid.replaceChildren();
 const plan=session?.plan,summary=session?.summary;
 el('planStatus').textContent=plan?plan.status.toUpperCase()+' QA':'Not started';
 el('credits').textContent=(summary?.totalVerified??0)+' / 163';
 el('tasksDone').textContent=(summary?.completedTasks??0)+' / 10';
 el('unavailable').textContent=String(summary?.unavailableTasks??0);
 el('fullDay').textContent=summary?safeStateMessage(summary):
  'No test plan has been saved. Full-day reward not eligible.';
 const rows=summary?.tasks||DAILY_V2_TASKS.map(t=>({
  taskId:t.id,state:'not-started',target:t.target,verifiedProgress:0
 }));
 for(const row of rows){
  const button=document.createElement('button');button.type='button';
  button.className='task '+(row.state==='unavailable'?'unavailable':row.state==='complete'?'complete':'');
  button.disabled=!plan||row.state==='unavailable'||busy;
  text(button,'strong',row.taskId.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase()));
  let status=row.state==='unavailable'?'Unavailable — '+row.reasonCodes.join(', '):
   row.state==='not-started'?'Not started':
   row.verifiedProgress+'/'+row.target+' verified · '+row.state;
  if(row.examMarks)status+=' · exam marks '+row.examMarks.earned+'/'+row.examMarks.possible;
  text(button,'span',status);
  button.addEventListener('click',()=>{
   selectedTaskId=row.taskId;pendingAttempt=null;renderPractice();
   el('practice').scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  grid.appendChild(button);
 }
 renderPractice();
}
function renderPractice(){
 const title=el('taskTitle'),progress=el('taskProgress'),form=el('answerForm');
 const area=el('questionArea'),answerInput=el('answer'),marks=el('marks');
 const task=session?.plan?.tasks.find(t=>t.id===selectedTaskId);
 if(!task){
  title.textContent='Practice';progress.textContent='';
  area.textContent='Choose an available task to test scoring and storage.';
  form.hidden=true;return;
 }
 const q=nextQaQuestion(session.plan,session.ledger,task.id);
 const row=session.summary.tasks.find(t=>t.taskId===task.id);
 title.textContent=task.id.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());
 progress.textContent=(row?.verifiedProgress??0)+'/'+task.target;
 if(!q){
  form.hidden=true;
  area.textContent='All assigned QA questions have persisted evidence. Reload this browser tab to verify recovery.';
  return;
 }
 area.textContent='Assigned question ID: '+q.questionId;
 form.hidden=false;
 el('questionText').textContent='Simulated question '+(task.questions.indexOf(q)+1)+' of '+task.target;
 el('answerLabel').hidden=task.kind==='exam';
 answerInput.hidden=task.kind==='exam';
 el('markLabel').hidden=task.kind!=='exam';
 marks.hidden=task.kind!=='exam';
 if(task.kind==='exam'){
  marks.replaceChildren();
  for(let n=0;n<=q.marks;n++){
   const option=document.createElement('option');option.value=String(n);
   option.textContent=n+' / '+q.marks+' simulated marks';marks.appendChild(option);
  }
 }else{
  answerInput.placeholder='Enter '+STAGING_EXPECTED+' for a correct test answer';
  answerInput.value='';
 }
}
function makeEventId(){
 if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
 return 'qa-'+Date.now()+'-'+Math.random().toString(36).slice(2);
}
function withOneWriteFailure(actualRepo){
 return {
  read:day=>actualRepo.read(day),
  async compareAndSwap(day,revision,snapshot){
   if(failNextWrite){
    failNextWrite=false;
    throw Error('SIMULATED_STORAGE_FAILURE: no credit saved; retry the same answer.');
   }
   return actualRepo.compareAndSwap(day,revision,snapshot);
  }
 };
}
async function displaySavedState(){
 session=await readQaSession(getRepo(),STAGING_DAY);
 if(session?.plan&&!session.plan.tasks.some(t=>t.id===selectedTaskId)){
  selectedTaskId=null;pendingAttempt=null;
 }
 render();
}
el('scenario').addEventListener('change',()=>guarded(async()=>{
 scenario=el('scenario').value;
 repo=null;session=null;selectedTaskId=null;pendingAttempt=null;failNextWrite=false;
 await displaySavedState();
 notify(session?'Restored QA-only saved state for '+scenario+'.':
  'No QA plan exists for '+scenario+'. Select "Create / resume QA day".');
}));
el('initialize').addEventListener('click',()=>guarded(async()=>{
 session=await openQaSession(getRepo(),{scenario,day:STAGING_DAY});
 selectedTaskId=null;pendingAttempt=null;render();
 notify('Daily QA plan persisted and read back. '+safeStateMessage(session.summary));
}));
el('simulateFailure').addEventListener('click',()=>{
 failNextWrite=true;
 notify('Next answer save will fail deliberately. No score must increase until an actual verified retry.');
});
el('refreshView').addEventListener('click',()=>guarded(async()=>{
 await displaySavedState();
 notify(session?'Re-read persisted QA data. Browser-only scores shown.':
  'No persisted QA plan in this scenario.');
}));
el('reset').addEventListener('click',()=>guarded(async()=>{
 const name=qaDatabaseName(scenario);
 if(!window.confirm('Delete only '+name+'? Real student data is not involved.'))return;
 const factory=globalThis.indexedDB;
 if(!factory)throw Error('IndexedDB is unavailable');
 await new Promise((resolve,reject)=>{
  const request=factory.deleteDatabase(name);
  request.onsuccess=resolve;
  request.onerror=()=>reject(request.error||Error('QA-only reset failed'));
  request.onblocked=()=>reject(Error('QA-only database reset blocked by another open tab'));
 });
 repo=null;session=null;selectedTaskId=null;pendingAttempt=null;failNextWrite=false;
 render();notify('QA-only database cleared. Student data and main app untouched.');
}));
el('answerForm').addEventListener('submit',event=>{
 event.preventDefault();
 guarded(async()=>{
  if(!session||!selectedTaskId)throw Error('Choose a saved QA task first');
  const task=session.plan.tasks.find(t=>t.id===selectedTaskId);
  const q=nextQaQuestion(session.plan,session.ledger,selectedTaskId);
  if(!task||!q)throw Error('No incomplete question in this task');
  if(!pendingAttempt||pendingAttempt.taskId!==task.id||
    pendingAttempt.questionId!==q.questionId){
   pendingAttempt={day:STAGING_DAY,eventId:makeEventId(),
    taskId:task.id,questionId:q.questionId,
    ...(task.kind==='exam'?{marksEarned:Number(el('marks').value)}:
       {answerText:el('answer').value})
   };
  }
  // On a failed/uncertain write retry the EXACT same event identity and answer.
  const result=await commitQaAttempt(withOneWriteFailure(getRepo()),pendingAttempt);
  if(!result.verified)throw Error('Answer not verified; score must not increase');
  const savedProgress=result.progress.verifiedProgress;
  pendingAttempt=null;
  await displaySavedState();
  notify('Verified save receipt, then reloaded from IndexedDB. Task progress: '+
   savedProgress+'/'+task.target+'. No real XP awarded.');
 });
});
guarded(async()=>{
 await displaySavedState();
 notify(session?'Restored staging QA-only plan after page load.':
  'QA page is ready. Create a synthetic test plan; no student records will be used.');
});
