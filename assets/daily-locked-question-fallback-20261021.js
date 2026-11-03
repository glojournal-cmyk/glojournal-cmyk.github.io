/* Locked Daily assignments must never refill from already-correct answers.
 * Regular practice and vocabulary follow their separate selection rules.
 * A completed quiz slot is credited once; incorrect/unanswered questions remain
 * eligible until the assigned Daily target has been reached. */
export function dailyCorrectQuestionIds(state, options={}) {
 const {day,taskId,subject,year,topicId}=options;
 const ids=new Set();
 if(!state||!taskId||!day)return ids;
 // Saved assignment proof survives a partial journal and the old Year 8
 // session-year bug. Do not make a learner redo these verified correct IDs.
 const task=(state.daily||[]).find(t=>t.id===taskId&&t.planDate===day&&
  t.assignedSubject===subject&&Number(t.assignedYear)===Number(year)&&
  t.assignedTopic===topicId);
 if(task){
  try{
   const url=new URL(task.href,'https://scholar.invalid');
   const mode=url.searchParams.get('mode');
   const key=[day,taskId,subject,topicId,year,mode,Number(task.target)].join('|');
   if(url.pathname===`/study/${subject}/practise`&&
      url.searchParams.get('daily')==='1'&&url.searchParams.get('locked')==='1'&&
      url.searchParams.get('task')===taskId&&url.searchParams.get('topic')===topicId&&
      Number(url.searchParams.get('year'))===Number(year)&&
      task.verifiedCorrectAssignment===key)
    for(const id of task.verifiedCorrectIds||[])if(id)ids.add(String(id));
  }catch{}
 }

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
 const {locked=false,mode='',size=10,topicId='',subject='',correctIds=[],requireDistinctConcepts=false,reservedIds=[]}=options||{};
 if(!locked||mode==='y8vocab')return current;
 const limit=Math.max(0,Number(size)||0);
 if(!limit)return [];
 const credited=new Set(correctIds||[]),reserved=new Set(reservedIds||[]);
 // Keep distinct conceptual evidence in a new Year 8 Mastery set. Existing
 // correct variants of the SAME concept also stay excluded until a due review.
 const concept=q=>String(q?.conceptId||q?.id||'');
 const usedConcepts=new Set(requireDistinctConcepts?(Array.isArray(loaded)?loaded:[])
   .filter(q=>credited.has(String(q?.id))).map(concept):[]);
 const available=q=>q?.id&&!credited.has(String(q.id))&&!reserved.has(String(q.id))&&
  (!requireDistinctConcepts||!usedConcepts.has(concept(q)))&&q.formal!==false&&
  !q._repair&&q.status!=='preview'&&(!topicId||q.topicId===topicId);
 const result=[],used=new Set();
 for(const q of current){
  if(!available(q)||used.has(String(q.id)))continue;
  result.push(q);used.add(String(q.id));if(requireDistinctConcepts)usedConcepts.add(concept(q));
  if(result.length>=limit)return result;
 }
 const bank=(Array.isArray(loaded)?loaded:[]).filter(q=>available(q)&&!used.has(String(q.id)));
 // Wider candidates are needed when several formats share one concept ID.
 // Only the strict Mastery path expands the candidate search; existing other
 // formats and legacy Daily assignment sizes remain unchanged.
 const candidateLimit=requireDistinctConcepts?Math.max(limit,Math.min(bank.length,limit*6)):limit;
 const ranked=rank(bank,subject,candidateLimit);
 const extra=progression(ranked,mode,candidateLimit);
 for(const q of extra){
  if(result.length>=limit)break;
  if(!available(q)||used.has(String(q.id)))continue;
  used.add(String(q.id));if(requireDistinctConcepts)usedConcepts.add(concept(q));result.push(q);
 }
 // Never refill the shortage with known correct questions. A smaller set is
 // preferable to making the learner redo eight already-mastered answers.
 return result;
}

/* Final read-only guard after unfinished receipts and dated Recovery selectors.
 * Those legacy helpers can reorder or reinsert original questions after the
 * fallback allocator. Never delete prior answers or replace locked receipts. */
export function enforceDistinctYear8MasteryAfterRetry(items,loaded,options={}){
 const {locked=false,year=0,mode='',creditedIds=[],seenCorrect={}}=options;
 const original=Array.isArray(items)?items:[];
 if(!locked||Number(year)!==8||mode!=='mastery')return original;
 const id=q=>String(q?.id||'');
 const family=q=>String(q?.conceptId||q?.id||'');
 const credited=new Set(creditedIds||[]);
 for(const [qid,count] of Object.entries(seenCorrect||{}))if(Number(count)>0)credited.add(String(qid));
 const forbidden=new Set((Array.isArray(loaded)?loaded:[])
   .filter(q=>credited.has(id(q))).map(family));
 const used=new Set(),seenIds=new Set();
 return original.filter(q=>{
   if(!q?.id||q.formal===false||q._repair||q.status==='preview')return false;
   const qid=id(q),concept=family(q);
   if(credited.has(qid)||forbidden.has(concept)||seenIds.has(qid)||used.has(concept))return false;
   seenIds.add(qid);used.add(concept);return true;
 });
}
