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
  if(row.topicId===topicId||
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
  !q._repair&&q.status!=='preview'&&(!topicId||q.topicId===topicId);
 const result=[],used=new Set();
 for(const q of current){
  if(!available(q)||used.has(String(q.id)))continue;
  result.push(q);used.add(String(q.id));
  if(result.length>=limit)return result;
 }
 const bank=(Array.isArray(loaded)?loaded:[]).filter(q=>available(q)&&!used.has(String(q.id)));
 const ranked=rank(bank,subject,limit);
 const extra=progression(ranked,mode,limit);
 for(const q of extra){
  if(result.length>=limit)break;
  if(!available(q)||used.has(String(q.id)))continue;
  used.add(String(q.id));result.push(q);
 }
 // Never refill the shortage with known correct questions. A smaller set is
 // preferable to making the learner redo eight already-mastered answers.
 return result;
}
