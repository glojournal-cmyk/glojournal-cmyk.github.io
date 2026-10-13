import "./practice-evidence-bridge-20261004.js?v=20261010-chem-marking1&ux=20261013-player-ux2";
const LABELS={french:'French',latin:'Latin',biology:'Biology',chemistry:'Chemistry',physics:'Physics',english:'English'};
function reviewSubject(id,review) {
 if(LABELS[review?.subject])return review.subject;
 const name=String(review?.topicId||id||"").toLowerCase();
 if(/^(fr-|french)/.test(name))return "french";
 if(/^(la-|latin)/.test(name))return "latin";
 if(/^(chem-|ch-)/.test(name))return "chemistry";
 if(/^(bio-|bi-)/.test(name))return "biology";
 if(/^(phys-|ph-)/.test(name))return "physics";
 if(/^(eng-|en-)/.test(name))return "english";
 return null;
}
function correctedToday(state,id,day){
 const review=state.reviews?.[id];
 if(!review||review.repair)return false;
 if(review.reviewedOn===day)return true;
 const seen=review.last===day||String(review.lastAt||'').slice(0,10)===day;
 return seen&&review.wrong===false&&(!review.lastWrong||review.lastWrong<day);
}
export function mistakeReviewTask(state,assessment=globalThis.LuxPracticeBridge.readAssessment(),availableTopic=null){
 const day=state.today,old=(state.daily||[]).find(t=>t.id==='mistake-review');
 const excluded=new Set(state.reviewUnavailableByDay?.[day]||[]);
 // Re-check other subjects even if an earlier stale question was excused.
 // An unavailable French question must not conceal a valid Latin/Chemistry review.
 if(old?.planDate===day&&old.reviewQuestionIds?.length && old.reviewQuestionIds.every(id=>!excluded.has(id)) &&
  (old.reviewSource==="assessment" || !availableTopic || old.reviewTopicIds?.some(id=>availableTopic(old.reviewSubject,id,old.reviewYear)))){
  const fromPractice=old.reviewSource==='assessment'?[]:(old.reviewQuestionIds||[]).filter(id=>correctedToday(state,id,day));
  const completed=[...new Set([...(old.reviewCompletedIds||[]),...fromPractice,...(old.reviewSource==="assessment"?Object.keys(assessment.dailyReviewCredits?.[day]||{}).filter(id=>assessment.dailyReviewCredits[day][id]):[])])].filter(id=>old.reviewQuestionIds.includes(id));
  return {...old,reviewCompletedIds:completed,progress:completed.length};
 }
 const assessmentRows=globalThis.LuxPracticeBridge.dueReviews(assessment,day).map(r=>({...r,source:"assessment",date:r.lastWrong,topicId:r.paperId}));
 const rows=Object.entries(state.reviews||{}).filter(([id,r])=>{
  const subject=reviewSubject(id,r),year=/-y8-/.test(r.topicId)?8:9;
  if(excluded.has(id) || !subject || (availableTopic&&!availableTopic(subject,r.topicId,year)))return false;
  const last=r.lastWrong||r.last||String(r.lastAt||'').slice(0,10);
  return r.topicId&&last&&last<day&&!r.repair&&(!r.reviewedOn||!r.due||r.due<=day||(r.wrong&&r.lastWrong>r.reviewedOn))&&
   (r.wrong===true||(r.mistakeFollowup&&r.due<=day)||(r.wrong===undefined&&Number(r.stage||r.streak)===1&&Number(state.seenTotal?.[id]||0)>Number(state.seenCorrect?.[id]||0)));
 }).map(([id,r])=>({id,...r,subject:reviewSubject(id,r),year:/-y8-/.test(r.topicId)?8:9,date:r.lastWrong||r.last||String(r.lastAt||'').slice(0,10)}))
 .concat(assessmentRows).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 if(!rows.length)return {id:'mistake-review',title:'Previous mistakes · clear',detail:'No previous mistakes due today. Today’s mistakes start tomorrow; corrected mistakes return after 7 days.',href:'/study',target:1,progress:1,xp:0,planDate:day,reviewQuestionIds:[],reviewCompletedIds:[]};
 const first=rows[0],chosen=rows.filter(r=>r.subject===first.subject&&r.year===first.year&&(r.source||"practice")===(first.source||"practice")).slice(0,10);
 if(first.source==="assessment"){const ids=chosen.map(r=>r.id),completed=ids.filter(id=>assessment.dailyReviewCredits?.[day]?.[id]);return {id:"mistake-review",title:`Previous mistakes · ${LABELS[first.subject]} assessment`,detail:`${chosen.length} missed or partly correct assessment questions due today. Full marks secure each correction. First check after 2 days, then 7 days after success.`,href:`/assessment/?task=mistake-review&day=${day}&subject=${first.subject}`,target:chosen.length,progress:completed.length,xp:15,planDate:day,reviewSource:"assessment",reviewSubject:first.subject,reviewYear:first.year,reviewQuestionIds:ids,reviewCompletedIds:completed,reviewTopicIds:[...new Set(chosen.map(r=>r.topicId))]};}
 return {id:'mistake-review',title:`Previous mistakes · ${LABELS[first.subject]}`,detail:`${chosen.length} questions answered incorrectly yesterday or earlier. Correct each one independently; wrong answers do not count. Only your previous mistakes, with the subject and questions assigned.`,href:`/study/${first.subject}/practise?daily=1&locked=1&task=mistake-review&mode=mistakes&year=${first.year}`,target:chosen.length,progress:0,xp:15,planDate:day,reviewSubject:first.subject,reviewYear:first.year,reviewQuestionIds:chosen.map(r=>r.id),reviewTopicIds:[...new Set(chosen.map(r=>r.topicId))],reviewCompletedIds:[]};
}
export function creditMistakeReview(task,id,correct,day){
 if(!correct||task?.planDate!==day||!task.reviewQuestionIds?.includes(id))return task;
 const completed=[...new Set([...(task.reviewCompletedIds||[]),id])];
 return {...task,reviewCompletedIds:completed,progress:completed.length};
}

export function retainMistakeReview(reviews,id,day){
 const row=reviews?.[id];if(!row)return reviews;
 const date=new Date(`${day}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+7);
 return {...reviews,[id]:{...row,wrong:false,reviewedOn:day,mistakeFollowup:!row.mistakeFollowup,due:date.toISOString().slice(0,10)}};
}
