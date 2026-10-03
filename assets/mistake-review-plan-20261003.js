const LABELS={french:'French',latin:'Latin',biology:'Biology',chemistry:'Chemistry',physics:'Physics',english:'English'};
export function mistakeReviewTask(state){
 const day=state.today,old=(state.daily||[]).find(t=>t.id==='mistake-review');
 if(old?.planDate===day&&old.reviewQuestionIds?.length){
  const completed=[...new Set(old.reviewCompletedIds||[])].filter(id=>old.reviewQuestionIds.includes(id));
  return {...old,reviewCompletedIds:completed,progress:completed.length};
 }
 const rows=Object.entries(state.reviews||{}).filter(([id,r])=>{
  const last=r.lastWrong||r.last||String(r.lastAt||'').slice(0,10);
  return r.topicId&&LABELS[r.subject]&&last&&last<day&&!r.repair&&
   (r.wrong===true||(r.wrong===undefined&&Number(r.stage||r.streak)===1&&Number(state.seenTotal?.[id]||0)>Number(state.seenCorrect?.[id]||0)));
 }).map(([id,r])=>({id,...r,year:/-y8-/.test(r.topicId)?8:9,date:r.lastWrong||r.last||String(r.lastAt||'').slice(0,10)}))
 .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 if(!rows.length)return {id:'mistake-review',title:'Previous mistakes · clear',detail:'No unresolved mistakes from yesterday or earlier. Today’s mistakes will be available tomorrow.',href:'/study',target:1,progress:1,xp:0,planDate:day,reviewQuestionIds:[],reviewCompletedIds:[]};
 const first=rows[0],chosen=rows.filter(r=>r.subject===first.subject&&r.year===first.year).slice(0,10);
 return {id:'mistake-review',title:`Previous mistakes · ${LABELS[first.subject]}`,detail:`${chosen.length} questions answered incorrectly yesterday or earlier. Correct each one independently; wrong answers do not count. Only your previous mistakes, with the subject and questions assigned.`,href:`/study/${first.subject}/practise?daily=1&locked=1&task=mistake-review&mode=mistakes&year=${first.year}`,target:chosen.length,progress:0,xp:15,planDate:day,reviewSubject:first.subject,reviewYear:first.year,reviewQuestionIds:chosen.map(r=>r.id),reviewTopicIds:[...new Set(chosen.map(r=>r.topicId))],reviewCompletedIds:[]};
}
export function creditMistakeReview(task,id,correct,day){
 if(!correct||task?.planDate!==day||!task.reviewQuestionIds?.includes(id))return task;
 const completed=[...new Set([...(task.reviewCompletedIds||[]),id])];
 return {...task,reviewCompletedIds:completed,progress:completed.length};
}
