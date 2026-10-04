// Dated evidence only: repairs and same-day repeats cannot prove retention.
(function(root){
 const day=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
 const gap=(a,b)=>(Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000;
 function append(rows,entry){
  rows=Array.isArray(rows)?rows:[];const date=day(entry.at),formal=entry.formal!==false&&!entry.repair;
  const previous=[...rows].reverse().find(r=>r.questionId===entry.questionId&&r.subject===entry.subject&&r.year===entry.year&&r.formal!==false&&!r.repair);
  const retention=!!(formal&&entry.correct&&previous?.correct&&gap(date,previous.day)>=2);
  return [...rows,{...entry,day:date,retention}].filter(r=>gap(date,r.day)<=90).slice(-10000);
 }
 function summarize(rows,end,subject='all'){
  const selected=(Array.isArray(rows)?rows:[]).filter(r=>gap(end,r.day)>=0&&gap(end,r.day)<7&&(subject==='all'||r.subject===subject));
  const formal=selected.filter(r=>r.formal!==false&&!r.repair),topics=new Map();
  for(const r of formal){const key=r.subject+':'+r.year+':'+(r.topicId||r.topicTitle||'general');let t=topics.get(key)||{subject:r.subject,year:r.year,topicId:r.topicId,title:r.topicTitle||r.topicId||'General practice',attempted:0,correct:0,retained:0,latest:r,rows:[]};t.attempted++;t.correct+=Number(!!r.correct);t.retained+=Number(!!r.retention);t.latest=r;t.rows.push(r);topics.set(key,t)}
  const list=[...topics.values()];
  return {attempted:selected.length,formal:formal.length,correct:formal.filter(r=>r.correct).length,retained:formal.filter(r=>r.retention).length,repairs:selected.filter(r=>r.repair).length,activities:selected.filter(r=>r.formal===false&&!r.repair).length,
   improved:list.filter(t=>t.rows.some(r=>!r.correct)&&t.latest.correct),followup:list.filter(t=>!t.latest.correct||t.correct/t.attempted<.8),topics:list};
 }
 root.LuxWeeklyEvidence={day,gap,append,summarize};
})(globalThis);
