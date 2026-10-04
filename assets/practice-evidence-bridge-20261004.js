// Shared dated practice evidence and assessment review queue; no mastery or paper-score mutation.
(function(root){
 const day=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
 const shift=(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
 const dateOf=r=>{if(r.completedAt)return day(r.completedAt);let d=String(r.date||'');if(/^\d{2}\/\d{2}\/\d{4}$/.test(d))d=d.split('/').reverse().join('-');return /^\d{4}-\d{2}-\d{2}$/.test(d)?d:null};
 const subjectOf=r=>r.subject||['biology','chemistry','french','latin','physics','english'].find(s=>String(r.paperId||'').startsWith(s));
 const reviewId=(paperId,questionId)=>'assessment:'+paperId+':'+questionId;
 function readAssessment(){try{const s=JSON.parse(localStorage.getItem('lux-assessment-v1')||'{}');return s&&typeof s==='object'&&!Array.isArray(s)?s:{}}catch{return {}}}
 function appendEvidence(rows,entry){rows=Array.isArray(rows)?rows:[];const e={...entry,day:day(entry.at),eventId:entry.eventId||entry.at+':'+entry.questionId+':'+rows.length,formal:false,retention:false};if(rows.some(r=>r.eventId===e.eventId))return rows;return [...rows,e].filter(r=>r&&r.day>=shift(e.day,-90)).slice(-10000)}
 function queueFor(state){
  const queue=Object.fromEntries(Object.entries(state.reviewQueue||{}).map(([id,row])=>[id,{...row}]));
  for(const [index,r] of (Array.isArray(state.results)?state.results:[]).entries()){
   const date=dateOf(r),subject=subjectOf(r),resultId=r.resultId||r.paperId+':'+index+':'+r.date;
   if(!date||!subject||!Array.isArray(r.revisionEvidence))continue;
   for(const evidence of r.revisionEvidence){const q=(r.questions||[]).find(q=>q.id===evidence.questionId);if(!q||!Number.isFinite(evidence.credit))continue;
    const id=reviewId(r.paperId,q.id),existing=queue[id];if(existing&&(existing.resultId===resultId||Number(existing.resultIndex)>index))continue;
    if(evidence.credit>=.999){if(existing)queue[id]={...existing,resultId,resultIndex:index,pending:false,resolvedOn:date};continue}
    queue[id]={id,resultId,resultIndex:index,paperId:r.paperId,paper:r.paper,subject,year:Number(q.year)===8||/-y8-/.test(q.id)?8:9,questionId:q.id,topicTitle:q.topic||r.paper||'Assessment topic',lastWrong:date,due:shift(date,2),pending:true,stage:1,credit:evidence.credit};
   }
  }
  for(const row of Object.values(queue)){const q=state.results?.[row.resultIndex]?.questions?.find(q=>q.id===(row.questionId||row.question?.id))||row.question;delete row.question;if(q)Object.defineProperty(row,"question",{value:JSON.parse(JSON.stringify(q)),enumerable:false,configurable:true});}
  return queue;
 }
 function dueReviews(state,today){return Object.values(queueFor(state)).filter(r=>r.question&&r.pending&&r.due&&r.due<=today).sort((a,b)=>a.due.localeCompare(b.due)||a.lastWrong.localeCompare(b.lastWrong)||a.id.localeCompare(b.id))}
 function recordFollowup(state,entry,options={}){
  const practiceEvidence=appendEvidence(state.practiceEvidence,{...entry,source:'assessment-followup',repair:true});
  const reviewQueue=queueFor(state),id=options.reviewId,existing=id&&reviewQueue[id],date=day(entry.at),correct=!!entry.correct;
  if(existing&&options.daily){const held=existing.lastCorrectDay===date;if(correct&&!held){reviewQueue[id]={...existing,lastCorrectDay:date,pending:existing.stage<2,stage:2,due:existing.stage<2?shift(date,7):null,resolvedOn:existing.stage>=2?date:null};}else if(!correct){reviewQueue[id]={...existing,lastWrong:date,lastCorrectDay:null,pending:true,stage:1,due:shift(date,2)};}}
  const dailyReviewCredits={...(state.dailyReviewCredits||{})};
  if(options.daily&&correct&&options.planDate===date&&options.assignedIds?.includes(id))dailyReviewCredits[date]={...(dailyReviewCredits[date]||{}),[id]:true};
  for(const old of Object.keys(dailyReviewCredits))if(old<shift(date,-45))delete dailyReviewCredits[old];
  return {...state,practiceEvidence,reviewQueue,dailyReviewCredits};
 }
 function additionalSummary(rows,end,subject='all'){
  const selected=(Array.isArray(rows)?rows:[]).filter(r=>r&&r.day>=shift(end,-6)&&r.day<=end&&(subject==='all'||r.subject===subject)),sources=[];
  for(const source of ['biology-cell','assessment-followup']){const r=selected.filter(r=>r.source===source),topics=new Map();for(const e of r){const key=e.subject+':'+(e.topicTitle||'General');const t=topics.get(key)||{subject:e.subject,title:e.topicTitle||'General',source,rows:[]};t.rows.push(e);topics.set(key,t)}
   sources.push({source,attempted:r.length,correct:r.filter(e=>e.correct).length,earned:r.reduce((n,e)=>n+(Number(e.earnedMarks)||0),0),marks:r.reduce((n,e)=>n+(Number(e.marks)||0),0),improved:[...topics.values()].filter(t=>t.rows.some(e=>!e.correct)&&t.rows.at(-1).correct),followup:[...topics.values()].filter(t=>!t.rows.at(-1).correct||t.rows.filter(e=>e.correct).length/t.rows.length<.8)});
  }
  return sources;
 }
 root.LuxPracticeBridge={day,shift,reviewId,readAssessment,appendEvidence,queueFor,dueReviews,recordFollowup,additionalSummary,subjectOf};
})(globalThis);
