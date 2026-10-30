// Durable receipts for fully answered, locked Daily practice sessions.
// This does not award XP or claim wrong answers were correct. The source quiz
// supplies individual marked outcomes; only the exact saved assignment can use them.
import {reconcileDailySession,verifiedQuizSlots} from './daily-session-credit-20261021.js?v=20261026-bio-savefix1&modeguard=20261030-1';
const DB='lux-daily-completed-sessions-v1',TABLE='receipts';
const FALLBACK='lux-daily-completed-sessions-safe-v1';
const supported=new Set(['latin-standard','y8-standard-a','y8-standard-b',
  'y8-mastery-a','y8-mastery-b','y8-mastery-topup-a','y8-mastery-topup-b',
  'weakness-review','due-review','year9-light']);
const validDay=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'') &&
  !Number.isNaN(Date.parse(d+'T12:00:00Z'));
const key=r=>[r.day,r.taskId,r.subject,r.topicId,r.mode,r.target].join('|');
function openDB(){
  if(typeof indexedDB==='undefined')return Promise.resolve(null);
  return new Promise(resolve=>{
    try{
      const request=indexedDB.open(DB,1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(TABLE))
        request.result.createObjectStore(TABLE,{keyPath:'key'});};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>resolve(null);
      request.onblocked=()=>resolve(null);
    }catch{resolve(null)}
  });
}
function valid(r){
  return r&&validDay(r.day)&&supported.has(r.taskId)&&
    ['latin','french','biology','chemistry','physics'].includes(r.subject)&&
    typeof r.topicId==='string'&&r.topicId.length>0&&
    typeof r.mode==='string'&&r.mode.length>0&&
    Number.isInteger(r.target)&&r.target>=1&&r.target<=30&&
    Array.isArray(r.questions)&&r.questions.length>0&&r.questions.length<=30&&
    Array.isArray(r.answers)&&r.answers.length>0&&r.answers.length<=100 &&
    r.answers.every(a=>typeof a.questionId==='string'&&typeof a.correct==='boolean');
}
function readFallback(){
  try{const data=JSON.parse(localStorage.getItem(FALLBACK)||'[]');
    return Array.isArray(data)?data.filter(valid):[];
  }catch{return []}
}
function writeFallback(receipt){
  try{
    const found=readFallback().filter(r=>r.key!==receipt.key);
    found.push(receipt);
    localStorage.setItem(FALLBACK,JSON.stringify(found.slice(-45)));
    return true;
  }catch{return false}
}
async function put(receipt){
  const db=await openDB();
  if(!db)return false;
  return new Promise(resolve=>{
    try{
      const tx=db.transaction(TABLE,'readwrite');
      const request=tx.objectStore(TABLE).put(receipt);
      request.onerror=()=>resolve(false);
      tx.oncomplete=()=>{db.close();resolve(true)};
      tx.onerror=()=>{db.close();resolve(false)};
      tx.onabort=()=>{db.close();resolve(false)};
    }catch{db.close();resolve(false)}
  });
}
async function all(){
  const db=await openDB();
  if(!db)return [];
  return new Promise(resolve=>{
    try{
      const tx=db.transaction(TABLE,'readonly');
      const request=tx.objectStore(TABLE).getAll();
      request.onsuccess=()=>resolve((request.result||[]).filter(valid));
      request.onerror=()=>resolve([]);
      tx.oncomplete=()=>db.close();
    }catch{db.close();resolve([])}
  });
}
function sanitized(source,task){
  if(!source||!task||!Array.isArray(source.questions)||!Array.isArray(source.answers))return null;
  const receipt={
    key:'',day:source.day,taskId:source.taskId,subject:source.subject,
    topicId:task.assignedTopic,mode:source.mode,target:Number(task.target),
    year:Number(task.assignedYear),at:Date.now(),
    questions:source.questions.map(q=>({id:String(q?.id||''),topicId:q?.topicId,
      formal:q?.formal!==false,_repair:!!q?._repair})),
    answers:source.answers.map(a=>({questionId:String(a?.questionId||''),
      correct:a?.correct,formal:a?.formal!==false,repair:!!a?.repair}))
  };
  receipt.key=key(receipt);
  return valid(receipt)?receipt:null;
}

// Merge separately finished sittings of the SAME dated, locked assignment.
// Keep one marked result per question ID: a later correct retry supersedes an
// earlier wrong answer, while an earlier correct answer can never be lost.
// Reopening a quiz with the same answers never earns additional credit.
function mergeReceipts(previous,current){
 if(!valid(previous)||previous.key!==current.key)return current;
 // Preserve separately marked slots even when a depleted question bank
 // accidentally repeated one ID. Collapsing by ID turned 10 correct
 // answers with six distinct IDs into a false Home 6/10.
 const oldSlots=verifiedQuizSlots(previous.questions,previous.answers);
 const newSlots=verifiedQuizSlots(current.questions,current.answers);
 const rows=oldSlots.map(x=>({...x}));
 const byId=new Map();
 for(const row of rows){
  const group=byId.get(row.id)||[];group.push(row);byId.set(row.id,group);
 }
 const newById=new Map();
 for(const row of newSlots){
  const group=newById.get(row.id)||[];group.push(row);newById.set(row.id,group);
 }
 for(const [id,latest] of newById){
  const old=byId.get(id)||[];
  if(!old.length){
   for(const row of latest){
    if(rows.length>=30)break;
    rows.push({...row});
   }
   continue;
  }
  // Correct retries repair a PREVIOUSLY WRONG occurrence of this ID.
  // Re-saving the same completed 10-question sitting cannot fabricate
  // additional credits, nor can a wrong retry erase a correct response.
  const wrong=old.filter(x=>!x.correct);
  for(const row of latest)if(row.correct&&wrong.length)
    wrong.shift().correct=true;
 }
 const kept=rows.slice(0,30);
 return {...current,
  questions:kept.map(x=>x.question),
  answers:kept.map(x=>({questionId:x.id,correct:x.correct,
    formal:true,repair:false})),
  at:Math.max(Date.now(),Number(previous.at)||0)};
}
// Synchronous, assignment-verified fallback for a marked Biology Daily answer.
// The existing async IndexedDB receipt remains authoritative after Finish,
// but a fast iPad navigation must not erase already-correct questions.
export function saveVerifiedBiologyAnswerSync(state,source){
  if(!state||!source||state.today!==source.day||!validDay(source.day)||
     source.taskId!=='year9-light'||source.subject!=='biology'||
     !Array.isArray(source.questions)||source.questions.length!==1||
     !Array.isArray(source.answers)||source.answers.length!==1)return false;
  const answer=source.answers[0],question=source.questions[0];
  if(answer.correct!==true||answer.formal===false||answer.repair||
     !question?.id||question.formal===false||question._repair||
     String(answer.questionId)!==String(question.id))return false;
  const candidate=[...(state.daily||[]),...(state.dailyLog?.[source.day]?.tasks||[])]
    .find(t=>t?.id===source.taskId&&t.assignedSubject===source.subject&&
      Number(t.assignedYear)===Number(source.year)&&t.assignedTopic);
  if(!candidate)return false;
  const task={...candidate,planDate:source.day};
  const receipt=sanitized(source,task);
  if(!receipt)return false;
  const checked=reconcileDailySession({...state,daily:[task]},receipt);
  if(!checked.target)return false; // rejects wrong date/year/topic/mode/unlocked route
  const old=readFallback().filter(r=>r.key===receipt.key)
    .sort((a,b)=>Number(b.at||0)-Number(a.at||0))[0];
  return writeFallback(mergeReceipts(old,receipt));
}

export async function saveCompletedDailyReceipt(state,source){
  if(!state||!source||state.today!==source.day||!validDay(source.day))return false;
  const candidate=[...(state.daily||[]),...(state.dailyLog?.[source.day]?.tasks||[])]
    .find(t=>t?.id===source.taskId&&t.assignedSubject===source.subject&&
      Number(t.assignedYear)===Number(source.year)&&t.assignedTopic);
  if(!candidate)return false;
  const task={...candidate,planDate:source.day};
  const receipt=sanitized(source,task);
  if(!receipt)return false;
  // Even if the iPad has lost the live React daily array, a genuine dated
  // assignment can verify this completed quiz; never replace that assignment
  // or guess a different topic.
  const verificationState={...state,daily:[task]};
  const verified=reconcileDailySession(verificationState,{...receipt,year:receipt.year});
  if(!verified.target)return false;
  // A dated, locked session with fewer visible questions than its 15-question
  // Home target still proves those actually marked answers. Preserve that
  // PARTIAL score (e.g. 10/15) on Safari instead of losing the entire session.
  // The strict assignment, route, subject, day and year were verified above.
  const eligible=receipt.questions.filter(q=>q.id&&!q._repair&&q.formal);
  if(!eligible.length)return false;
  const remaining=new Map();
  for(const q of eligible)remaining.set(q.id,(remaining.get(q.id)||0)+1);
  let marked=0;
  for(const a of receipt.answers){
    if(!a.formal||a.repair||!remaining.get(a.questionId))continue;
    remaining.set(a.questionId,remaining.get(a.questionId)-1);
    marked++;
  }
  if(marked<eligible.length)return false;
  // Save only the actually marked answers; never promote a partial 10/15
  // quiz to completion or turn an incorrect answer into a correct one.
  const previous=[...readFallback(),...(await all())].filter(row=>valid(row)&&
    row.key===receipt.key).sort((a,b)=>(Number(b.at)||0)-(Number(a.at)||0))[0];
  const combined=mergeReceipts(previous,receipt);
  const fallback=writeFallback(combined);
  const persisted=await put(combined);
  return persisted||fallback;
}

/** Trusted persisted outcome for one dated locked assignment. Used only to
 * select the unanswered/incorrect original question on a follow-up visit.
 * This read never changes progress or grants any credit. */
export function readDailyRetryReceiptSync({day,taskId,subject,year,topicId,mode}={}){
 const matches=readFallback().filter(r=>r.day===day&&r.taskId===taskId&&
   r.subject===subject&&r.year===Number(year)&&r.topicId===topicId&&r.mode===mode);
 return matches.sort((a,b)=>Number(b.at||0)-Number(a.at||0))[0]||null;
}
export async function readDailyRetryReceipt(options={}){
 const fallback=readDailyRetryReceiptSync(options);
 const saved=(await all()).filter(r=>r.day===options.day&&r.taskId===options.taskId&&
   r.subject===options.subject&&r.year===Number(options.year)&&
   r.topicId===options.topicId&&r.mode===options.mode);
 const latest=saved.sort((a,b)=>Number(b.at||0)-Number(a.at||0))[0]||null;
 if(!fallback)return latest;
 return latest?mergeReceipts(fallback,latest):fallback;
}

export function reconcileCompletedDailyReceipts(state,receipts){
  if(!state||!validDay(state.today)||!Array.isArray(state.daily)||state.daily.length<1)
    return null;
  let next=state,changed=false;
  for(const item of receipts||[]){
    if(!valid(item)||item.day!==state.today)continue;
    const task=next.daily.find(t=>t.id===item.taskId);
    if(!task||task.planDate!==item.day||task.assignedSubject!==item.subject||
      task.assignedTopic!==item.topicId||Number(task.target)!==item.target||
      Number(task.assignedYear)!==item.year)continue;
    const result=reconcileDailySession(next,{...item});
    if(!result.changed)continue;
    next={...next,daily:result.daily,...(result.dailyLog?{dailyLog:result.dailyLog}:{})};
    changed=true;
  }
  return changed?{daily:next.daily,...(next.dailyLog!==state.dailyLog?{dailyLog:next.dailyLog}:{})}:null;
}
export async function restoreCompletedDailyReceipts(store){
  if(!store?.getState||!store?.setState||store.persist?.hasHydrated?.()===false)return false;
  const raw=[...readFallback(),...(await all())];
  if(!raw.length)return false;
  // IndexedDB and localStorage can finish writes in either order on Safari.
  // Combine verified outcomes; an older copy must never hide a newer correct retry.
  const receiptMap=new Map();
  for(const row of raw.filter(valid))
    receiptMap.set(row.key,mergeReceipts(receiptMap.get(row.key),row));
  const receipts=[...receiptMap.values()];
  const patch=reconcileCompletedDailyReceipts(store.getState(),receipts);
  if(!patch)return false;
  store.setState(patch);
  return true;
}
