import {compatibleDailyTopic} from './daily-capacity-scope-20261026.js?capacity=20261026-v1';
/* A partly finished locked Daily task must resume its ORIGINAL wrong base
 * question(s), not silently replace them with newly generated practice.
 * Read-only selection: verified answer receipts and formal events decide what
 * is outstanding, while the original QuizSession still marks every answer. */
const supported=new Set(['latin-standard','y8-standard-a','y8-standard-b',
 'y8-mastery-a','y8-mastery-b','y8-mastery-topup-a','y8-mastery-topup-b',
 'weakness-review','due-review','year9-light']);
function sameReceipt(receipt,{day,taskId,subject,year,topicId,mode}){
 return receipt&&receipt.day===day&&receipt.taskId===taskId&&
  receipt.subject===subject&&Number(receipt.year)===Number(year)&&
  receipt.topicId===topicId&&receipt.mode===mode&&
  Array.isArray(receipt.questions)&&Array.isArray(receipt.answers);
}
function sameEvent(event,{day,taskId,subject,year,topicId}){
 return event?.day===day&&event.dailyTaskId===taskId&&
  event.subject===subject&&Number(event.year)===Number(year)&&
  event.recoveryFor==null&&event.formal!==false&&!event.repair&&
  (compatibleDailyTopic(topicId,event.topicId)||
   (['biology','chemistry','physics'].includes(subject)&&!!event.topicId));
}
export function dailyUnfinishedQuestionIds(state,receipt,options={}){
 const {day,taskId,subject,year,topicId,mode}=options;
 const outcomes=new Map(),sourceIds=new Set(),repeatedWrong=new Set();
 if(!state||!supported.has(taskId)||!day)return {wrongIds:[],knownIds:[],correctIds:[]};
 // Receipt lists only base questions in the learner's last completed sitting.
 // A verified correct retry supersedes the earlier wrong outcome.
 if(sameReceipt(receipt,options)){
  const listed=new Set(receipt.questions.filter(q=>q?.id&&q.formal!==false&&!q._repair)
   .map(q=>String(q.id)));
  const perQuestion=new Map();
  for(const answer of receipt.answers){
   const id=String(answer?.questionId||'');
   if(!listed.has(id)||answer.formal===false||answer.repair||
      typeof answer.correct!=='boolean')continue;
   sourceIds.add(id);
   const c=perQuestion.get(id)||{right:0,wrong:0};
   c[answer.correct?'right':'wrong']++;
   perQuestion.set(id,c);
   outcomes.set(id,!!answer.correct||outcomes.get(id)===true);
  }
  for(const [id,row] of perQuestion)
   if(row.right>0&&row.wrong>0)repeatedWrong.add(id);
 }
 for(const event of state.formalAttemptLog||[]){
  if(!sameEvent(event,options)||!event.questionId||
      typeof event.correct!=='boolean')continue;
  const id=String(event.questionId);
  sourceIds.add(id);
  outcomes.set(id,!!event.correct||outcomes.get(id)===true);
 }
 for(const id of sourceIds)if(Number(state.seenCorrect?.[id])>0)outcomes.set(id,true);
 // Two base slots with the same question ID can have different outcomes.
 // One correct instance must not conceal the OTHER still-wrong instance.
 for(const id of repeatedWrong)outcomes.set(id,false);
 const wrongIds=[...outcomes].filter(([,correct])=>correct===false).map(([id])=>id);
 const correctIds=[...outcomes].filter(([,correct])=>correct===true).map(([id])=>id);
 return {wrongIds,correctIds,knownIds:[...sourceIds]};
}
export function selectUnfinishedDailyQuestions(current,loaded,options={}){
 const {state,receipt,day,taskId,subject,year,topicId,mode,remaining}=options;
 const base=Array.isArray(current)?current:[];
 if(!state||!supported.has(taskId)||!day||mode==='y8vocab')return base;
 const limit=Math.max(0,Math.min(30,Number(remaining)||0));
 if(!limit)return [];
 const ids=dailyUnfinishedQuestionIds(state,receipt,{day,taskId,subject,year,topicId,mode});
 if(!ids.knownIds.length)return base;
 const pool=Array.isArray(loaded)?loaded:[];
 const byId=new Map(pool.filter(q=>q?.id&&q.formal!==false&&!q._repair&&
   q.status!=='preview').map(q=>[String(q.id),q]));
 const correct=new Set(ids.correctIds);
 const chosen=[],used=new Set();
 const add=q=>{if(!q?.id||used.has(String(q.id))||correct.has(String(q.id)))return;
  used.add(String(q.id));chosen.push(q);
 };
 // Retried base questions are explicitly allowed even if the review scheduler
 // would normally defer the same error for 2/7 days. This is an unfinished
 // Daily assignment, not a new spaced-repetition session.
 for(const id of ids.wrongIds){
  if(chosen.length>=limit)break;
  add(byId.get(id));
 }
 // The wrong original bank might have been retired. Never invent it; use a
 // genuinely uncredited question from the same assigned loaded topic.
 for(const q of base){if(chosen.length>=limit)break;add(q);}
 if(chosen.length<limit)for(const q of pool){
  if(chosen.length>=limit)break;
  if(!compatibleDailyTopic(topicId,q?.topicId)||q?.formal===false||q?._repair||['preview','disabled'].includes(q?.status)||Number(state.seenCorrect?.[q?.id])>0)continue;
  add(q);
 }
 return chosen.slice(0,limit);
}
