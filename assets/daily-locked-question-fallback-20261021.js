/* Pure selection fallback for assigned Daily tasks.
 * Standard/Mastery exclude previously correct questions when selecting NEW
 * practice. That must not block a saved Daily assignment from opening.
 * Existing QuizSession still owns marking, progress, drafts and rewards. */
export function fillDailyLockedQuestions(fresh,loaded,options,rank,progression){
 const current=Array.isArray(fresh)?fresh:[];
 const {locked=false,mode='',size=10,topicId='',subject=''}=options||{};
 if(!locked||mode==='y8vocab'||current.length>=size)return current;
 const used=new Set(current.map(q=>q?.id).filter(Boolean));
 const bank=(Array.isArray(loaded)?loaded:[]).filter(q=>q?.id&&!used.has(q.id)
  &&q.formal!==false&&!q._repair&&q.status!=='preview'
  &&(!topicId||q.topicId===topicId));
 const ranked=rank(bank,subject,size);
 const extra=progression(ranked,mode,size);
 const result=[...current];
 for(const q of extra){
  if(result.length>=size)break;
  if(!q?.id||used.has(q.id))continue;
  used.add(q.id);
  result.push(q);
 }
 return result;
}
