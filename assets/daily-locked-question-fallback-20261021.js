import {compatibleDailyTopic} from './daily-capacity-scope-20261026.js?capacity=20261026-v1';
/* Locked Daily assignments must never refill from already-correct answers.
 * Regular practice and vocabulary follow their separate selection rules.
 * A completed quiz slot is credited once; incorrect/unanswered questions remain
 * eligible until the assigned Daily target has been reached. */
export function dailyCorrectQuestionIds(state, options={}) {
 const {day,taskId,subject,year,topicId}=options;
 const ids=new Set();
 if(!state||!taskId||!day)return ids;
 for(const row of state.formalAttemptLog||[]){
  if(row?.day!==day||row?.dailyTaskId!==taskId||
     row?.subject!==subject||Number(row?.year)!==Number(year)||
     row?.correct!==true||row?.repair||row?.formal===false||row?.recoveryFor||
     !row.questionId)continue;
  if(compatibleDailyTopic(topicId,row.topicId)||
     (['biology','chemistry','physics'].includes(subject)&&row.topicId))ids.add(String(row.questionId));
 }
 return ids;
}
export function fillDailyLockedQuestions(fresh,loaded,options,rank,progression){
 const current=Array.isArray(fresh)?fresh:[];
 const {locked=false,mode='',size=10,topicId='',subject='',correctIds=[]}=options||{};
 if(!locked||mode==='y8vocab')return current;
 const limit=Math.max(0,Number(size)||0);
 if(!limit)return [];
 const credited=new Set(correctIds||[]);
 const available=q=>q?.id&&!credited.has(String(q.id))&&q.formal!==false&&
  !q._repair&&q.status!=='preview'&&q.status!=='disabled'&&compatibleDailyTopic(topicId,q.topicId);
 const result=[],used=new Set(),prints=new Set();
 const fingerprint=q=>q.prompt?JSON.stringify([String(q.prompt).toLowerCase().replace(/\s+/g,' ').trim(),q.stimulus||{},q.format||'']):String(q.id);
 const add=q=>{used.add(String(q.id));prints.add(fingerprint(q));result.push(q)};
 for(const q of current){
  if(!available(q)||used.has(String(q.id))||prints.has(fingerprint(q)))continue;
  add(q);
  if(result.length>=limit)return result;
 }
 const bank=(Array.isArray(loaded)?loaded:[]).filter(q=>available(q)&&!used.has(String(q.id)));
 const ordered=[...bank.filter(q=>q.topicId===topicId),...bank.filter(q=>q.topicId!==topicId)];
 const ranked=rank(ordered,subject,ordered.length);
 const extra=progression(ranked,mode,limit);
 for(const q of [...extra,...ordered]){
  if(result.length>=limit)break;
  if(!available(q)||used.has(String(q.id))||prints.has(fingerprint(q)))continue;
  add(q);
 }
 // Never refill the shortage with known correct questions. A smaller set is
 // preferable to making the learner redo eight already-mastered answers.
 return result;
}
