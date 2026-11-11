/* Read-only, student-specific Year 8 supply preflight.
 * Question IDs are ORIGINAL source IDs grouped by concept in the audited manifest.
 * It never writes progress, grades, XP/MP, Recovery records or task assignments.
 */
import {year8SupplyGroups} from './year8-question-supply-manifest-20261111.js';

const BASE=id=>String(id||'').split('@')[0];
const SAFE_DAY=/^\d{4}-\d{2}-\d{2}$/;
const age=(today,past)=>SAFE_DAY.test(today||'')&&SAFE_DAY.test(past||'')
  ?Math.round((Date.parse(today+'T12:00:00Z')-Date.parse(past+'T12:00:00Z'))/86400000):Infinity;
const subjectOf=t=>t?.assignedSubject||String(t?.href||'').match(/^\/study\/(french|latin|biology|chemistry|physics)\/practise/)?.[1]||'';
const limit=n=>Math.max(0,Math.min(60,Math.floor(Number(n)||0)));

export function year8CorrectQuestionIds(state={},subject=''){
 const ids=new Set();
 const add=(id)=>{if(id)ids.add(BASE(id));};
 for(const [id,count] of Object.entries(state.seenCorrect||{}))if(Number(count)>0)add(id);
 for(const e of state.formalAttemptLog||[])if(e?.correct===true&&e?.formal!==false&&
    !e.repair&&(!subject||e.subject===subject)&&
    (e.year==null||Number(e.year)===8))add(e.questionId);
 for(const [day,proofs] of Object.entries(state.recoveryTaskByDay||{})){
   const dated=state.dailyLog?.[day]?.tasks||[];
   for(const [taskId,proof] of Object.entries(proofs||{})){
     const task=dated.find(t=>t.id===taskId);
     if(!task||subjectOf(task)!==subject||Number(task.assignedYear||8)!==8)continue;
     for(const [qid,correct] of Object.entries(proof?.items||{}))if(correct===true)add(qid);
   }
 }
 for(const task of [...(state.daily||[]),...Object.values(state.dailyLog||{}).flatMap(row=>row?.tasks||[])]){
   if(subjectOf(task)!==subject||Number(task.assignedYear||8)!==8||
      !Array.isArray(task.verifiedCorrectIds)||!task.verifiedCorrectIds.length)continue;
   try{
     const url=new URL(task.href,'https://supply.invalid');
     const date=task.planDate||'';
     const expected=[date,task.id,subject,task.assignedTopic,8,url.searchParams.get('mode'),Number(task.target)].join('|');
     if(url.searchParams.get('daily')==='1'&&url.searchParams.get('locked')==='1'&&
        url.searchParams.get('task')===task.id&&url.searchParams.get('topic')===task.assignedTopic&&
        task.verifiedCorrectAssignment===expected)
       for(const id of task.verifiedCorrectIds)add(id);
   }catch{}
 }
 return ids;
}
export function year8TopicSupply(topicId,state={},options={}){
 const source=year8SupplyGroups[String(topicId||'')];
 if(!source)return {topicId,subject:null,known:false,total:0,mastered:0,available:0,reserved:0,remaining:[]};
 const [subject,groups]=source,correct=options.correctIds instanceof Set?options.correctIds:year8CorrectQuestionIds(state,subject);
 const remaining=groups.filter(ids=>!ids.some(id=>correct.has(BASE(id))));
 // Existing same-day tasks claim a conservative number of independent
 // concepts. Do NOT infer that unattempted tasks have marked correct answers.
 // Ignore the task being preflighted and leave actual reservation to runtime.
 const day=options.day||state.today;
 const others=[...(state.daily||[]),...(state.dailyLog?.[day]?.tasks||[])];
 const claimed=new Map();
 for(const t of others){
   if(!t?.id||t.id===options.taskId||t.planDate&&t.planDate!==day||
      t.assignedTopic!==topicId||Number(t.assignedYear||8)!==8||
      subjectOf(t)!==subject)continue;
   const prior=claimed.get(t.id)||0;
   claimed.set(t.id,Math.max(prior,Math.max(0,Number(t.target)||0)));
 }
 const reserved=options.countReservations===true?
   Math.min(remaining.length,[...claimed.values()].reduce((n,v)=>n+v,0)):0;
 return {topicId,subject,known:true,total:groups.length,
   mastered:groups.length-remaining.length,available:Math.max(0,remaining.length-reserved),
   reserved,remaining};
}
export function preflightYear8Task(topicId,state={},target=10,options={}){
 const count=limit(target),fraction=Number.isFinite(Number(options.bufferFraction))
   ?Math.max(0,Math.min(1,Number(options.bufferFraction))):.25;
 const supply=year8TopicSupply(topicId,state,options);
 const recommended=count+Math.ceil(count*fraction);
 return {...supply,target:count,recommended,
   canStart:supply.known&&supply.available>=count,
   buffered:supply.known&&supply.available>=recommended,
   shortfall:Math.max(0,count-supply.available),
   bufferShortfall:Math.max(0,recommended-supply.available)};
}
export function year8SupplyBySubject(state={},options={}){
 const bySubject={},correctBySubject={};
 for(const subject of ['latin','french','biology','chemistry','physics'])
   correctBySubject[subject]=year8CorrectQuestionIds(state,subject);
 for(const topicId of Object.keys(year8SupplyGroups)){
   const source=year8SupplyGroups[topicId];
   const supply=year8TopicSupply(topicId,state,{...options,countReservations:false,correctIds:correctBySubject[source[0]]});
   const subject=supply.subject;
   if(!bySubject[subject])bySubject[subject]={subject,topics:0,total:0,mastered:0,available:0,standardReady:0,masteryReady:0};
   const row=bySubject[subject];row.topics++;row.total+=supply.total;row.mastered+=supply.mastered;
   row.available+=supply.available;
   if(supply.available>=10)row.standardReady++;
   if(supply.available>=20)row.masteryReady++;
 }
 return bySubject;
}
// A 7-day stress forecast: hypothetical *correct* completion consumes source
// groups in memory only. It never predicts a child's marks or persists answers.
export function forecastYear8Tasks(state,planForDate,days=7){
 const reports=[],seen={...(state?.seenCorrect||{})},logs={...(state?.dailyLog||{})};
 const today=state?.today;
 if(!SAFE_DAY.test(today||''))return reports;
 for(let step=1;step<=Math.max(0,Math.min(7,Number(days)||0));step++){
   const day=new Date(Date.parse(today+'T12:00:00Z')+step*86400000).toISOString().slice(0,10);
   const mock={...state,today:day,daily:[],dailyLog:logs,seenCorrect:seen};
   const tasks=planForDate(mock)||[],warnings=[],usedTopics=new Set();
   for(const task of tasks){
     if(task?.supplyBlocked===true){
       warnings.push({taskId:task.id,topicId:null,target:limit(task.target),available:0,reason:'unavailable-source'});
       continue;
     }
     if(!task.assignedTopic||Number(task.assignedYear)!==8)continue;
     const mode=String(task.href||'').match(/[?&]mode=([^&]+)/)?.[1]||'';
     if(!['standard','mastery'].includes(mode))continue;
     const target=limit(task.target),supply=year8TopicSupply(task.assignedTopic,mock);
     // Use a single source family per newly answered slot; do not count
     // question variants as independent knowledge.
     const available=supply.remaining.filter(ids=>!ids.some(id=>seen[BASE(id)]>0));
     if(!supply.known||available.length<target)warnings.push({
       taskId:task.id,topicId:task.assignedTopic,target,available:available.length,reason:'shortage'
     });
     if(usedTopics.has(task.assignedTopic))warnings.push({
       taskId:task.id,topicId:task.assignedTopic,target,available:0,reason:'same-day-topic'
     });
     usedTopics.add(task.assignedTopic);
     for(const ids of available.slice(0,target))if(ids[0])seen[BASE(ids[0])]=1;
   }
   logs[day]={date:day,tasks:tasks.map(t=>({...t})),simulation:true};
   reports.push({date:day,tasks:tasks.length,warnings,model:'all-correct stress scenario, not a prediction'});
 }
 return reports;
}
