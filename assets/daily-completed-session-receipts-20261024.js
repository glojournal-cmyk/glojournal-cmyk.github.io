// Durable receipts for fully answered, locked Daily practice sessions.
// This does not award XP or claim wrong answers were correct. The source quiz
// supplies individual marked outcomes; only the exact saved assignment can use them.
import {reconcileDailySession} from './daily-session-credit-20261021.js';
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
export async function saveCompletedDailyReceipt(state,source){
  const task=state?.daily?.find(t=>t.id===source?.taskId&&t.planDate===source.day);
  if(!task||state.today!==source.day||task.assignedSubject!==source.subject||
    Number(task.assignedYear)!==Number(source.year))return false;
  const receipt=sanitized(source,task);
  if(!receipt)return false;
  // The original strict session verifier ensures this is a locked,
  // task/topic/mode-specific session, not free practice or Recovery.
  const verified=reconcileDailySession(state,{...receipt,year:receipt.year});
  if(!verified.target)return false;
  const eligible=new Set(receipt.questions.filter(q=>q.id&&!q._repair&&
    q.formal&&q.topicId===task.assignedTopic).map(q=>q.id));
  const marked=receipt.answers.filter(a=>eligible.has(a.questionId)&&
    a.formal&&!a.repair);
  if(marked.length < Math.min(receipt.target,eligible.size))return false;
  // Record the answered test as well as the verified correct subset.
  // Never turn the wrong subset into Home correct-answer credits.
  const [persisted,fallback]=await Promise.all([put(receipt),Promise.resolve(writeFallback(receipt))]);
  return persisted||fallback;
}
export function reconcileCompletedDailyReceipts(state,receipts){
  if(!state||!validDay(state.today)||!Array.isArray(state.daily)||state.daily.length!==10)
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
  const receipts=[...new Map(raw.filter(valid).map(r=>[r.key,r])).values()];
  const patch=reconcileCompletedDailyReceipts(store.getState(),receipts);
  if(!patch)return false;
  store.setState(patch);
  return true;
}
