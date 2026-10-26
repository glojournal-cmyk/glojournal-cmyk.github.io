/* Scholar's Garden Daily V2 — pure deterministic planner.
 * Staging only. No imports from the legacy Daily engine, no storage or UI writes.
 * This planner expects an audited, fully loaded bank with explicit roles and
 * depth bands. An adapter/quality-audit layer is REQUIRED before integration.
 */
export const DAILY_V2_TASKS = Object.freeze([
 {id:'latin-vocab',kind:'vocab',target:30,subject:'latin'},
 {id:'french-vocab',kind:'vocab',target:30,subject:'french'},
 {id:'latin-standard',kind:'standard',target:10,subject:'latin'},
 {id:'french-standard',kind:'standard',target:10,subject:'french'},
 {id:'science-standard',kind:'standard',target:10,subject:'science'},
 {id:'mastery-a',kind:'mastery',target:20},
 {id:'mastery-b',kind:'mastery',target:20},
 {id:'spaced-retention',kind:'retention',target:10},
 {id:'gcse-exam-skills',kind:'exam',target:3},
 {id:'year9-progressive',kind:'progressive',target:20}
]);
const isId = x => typeof x==='string' && x.trim().length>0;
const plain = x => String(x||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const bands = ['foundation','application','challenge'];
const QUOTAS = {
 'latin-standard':{grammar:4,translation:3,passage:3},
 'french-standard':{grammar:4,translation:3,writing:3},
 'mastery':{foundation:4,application:10,challenge:6},
 'year9-progressive':{foundation:6,application:11,challenge:3}
};
function validDay(day){ return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day+'T12:00:00Z')); }
function daySpan(day,oldDay){
 if(!validDay(day)||!validDay(oldDay))return -1;
 return Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(oldDay+'T12:00:00Z'))/86400000);
}
function stableHash(s){let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0;}
const sortByDay=(day,a,b)=>stableHash(day+'|'+a.id)-stableHash(day+'|'+b.id)||a.id.localeCompare(b.id);
function choose(rows,n,day){
 return [...rows].sort((a,b)=>sortByDay(day,a,b)).slice(0,n);
}
function normalizeQuestions(raw, day, taught) {
 const seen=new Set(), questions=[],errors=[];
 for(const q of raw||[]){
  if(!q||q.status==='disabled'||q.status==='preview'||q.formal===false||q._repair)continue;
  if(!isId(q.id)||seen.has(q.id)){errors.push({code:'INVALID_OR_DUPLICATE_QUESTION_ID',questionId:q?.id||null});continue;}
  seen.add(q.id);
  if(!isId(q.subject)||!isId(q.topicId)||![7,8,9].includes(Number(q.year))){errors.push({code:'INVALID_QUESTION_METADATA',questionId:q.id});continue;}
  if(Number(q.year)===9&&!taught.has(q.topicId))continue;
  const roles=Array.isArray(q.roles)?q.roles:[];
  if(!roles.length)continue; // not certified for Daily V2 (never auto-upgrade ordinary bank)
  if(q.roles.includes('gcse') && (!isId(q.prompt)||![1,2,3].includes(Number(q.marks))||!q.markScheme)){
   errors.push({code:'GCSE_MISSING_MARK_SCHEME',questionId:q.id});continue;
  }
  questions.push({...q,year:Number(q.year),roles:[...new Set(roles)],_promptKey:plain(q.prompt)});
 }
 return {questions,errors};
}
function groupByTopic(rows,minimum,day,exposure={}) {
 const groups=new Map();
 for(const q of rows){const key=q.subject+'|'+q.year+'|'+q.topicId; if(!groups.has(key))groups.set(key,[]);groups.get(key).push(q);}
 return [...groups].filter(([,items])=>items.length>=minimum)
   .sort((a,b)=>(Number(exposure[a[1][0].subject])||0)-(Number(exposure[b[1][0].subject])||0)
      ||stableHash(day+'|'+a[0])-stableHash(day+'|'+b[0])||a[0].localeCompare(b[0]));
}
function allocateQuotas(items,quotas,day) {
 const chosen=[],used=new Set();
 for(const [label,n] of Object.entries(quotas)){
  const pool=choose(items.filter(q=>!used.has(q.id) && (q.skill===label||q.depthBand===label)),n,day+'|'+label);
  if(pool.length!==n)return {ready:false,missing:{band:label,required:n,available:pool.length}};
  for(const q of pool){used.add(q.id);chosen.push(q);}
 }
 return {ready:true,chosen};
}
function redactQuestion(q) {
 return {questionId:q.id,conceptId:q.conceptId||null,subject:q.subject,year:q.year,topicId:q.topicId,role:q.roles.join(','),depthBand:q.depthBand||null};
}
function packageTask(task,questionRows,selectedTopic,extras={}) {
 return {id:task.id,kind:task.kind,target:task.target,subject:selectedTopic?.subject||task.subject||null,
  topicId:selectedTopic?.topicId||null, questions:questionRows.map(redactQuestion),
  questionIds:questionRows.map(q=>q.id),...extras};
}
/** Creates an all-or-nothing plan; blocked plans must never be used for live practice.
 * Question adapters are responsible for audited roles, depthBand, and taught-topic status.
 * Inputs from persistent history require persisted:true.
 */
export function planDailyV2(input={}) {
 const {day,questionBank=[],priorAttempts=[],taughtTopicIds=[],correctQuestionIds=[],
        masteryStages={},subjectExposure={},existingPlan=null}=input;
 if(!validDay(day))throw new Error('DailyV2: invalid plan date');
 if(existingPlan!==null){
  if(existingPlan.version!==2||existingPlan.day!==day||existingPlan.status!=='ready'
     ||!Array.isArray(existingPlan.tasks)||existingPlan.tasks.length!==DAILY_V2_TASKS.length){
   throw new Error('DailyV2: invalid frozen plan');
  }
  return existingPlan; // never silently reroll an in-progress plan
 }
 const taught=new Set(taughtTopicIds);
 const {questions,errors}=normalizeQuestions(questionBank,day,taught);
 const catalogById=new Map(questions.map(q=>[q.id,q]));
 const past=priorAttempts.filter(a=>a?.persisted===true && isId(a.questionId) && validDay(a.day) && a.day<day);
 const previousCorrect=new Set([...correctQuestionIds,
  ...past.filter(a=>a.correct===true).map(a=>a.questionId)]);
 const assigned=new Set(),assignedPrompts=new Set(),taskRows=[];
 const diagnostics=[...errors];const usedTopics=new Set();
 const allowed=q=>!assigned.has(q.id)&&!previousCorrect.has(q.id)&&
   (!q._promptKey||!assignedPrompts.has(q._promptKey));
 const take=rows=>{for(const q of rows){assigned.add(q.id);if(q._promptKey)assignedPrompts.add(q._promptKey);}};
 const fail=(task,code,detail={})=>diagnostics.push({taskId:task.id,code,...detail});
 const get=type=>DAILY_V2_TASKS.find(t=>t.id===type);
 const taskById=new Map();

 // Reserve hardest-to-fill mastery topics first; new questions are never
 // replaced by a bank metadata count or by easy questions merely to fill 20.
 for(const task of DAILY_V2_TASKS.filter(t=>t.kind==='mastery')){
  const options=groupByTopic(questions.filter(q=>q.roles.includes('mastery')
     &&!q.roles.includes('gcse')&&allowed(q)&&!usedTopics.has(q.topicId)
     &&masteryStages[q.topicId]!=='mastered'),20,day,subjectExposure);
  let result=null,firstDeficiency=null;
  for(const [,items] of options) {
   const quota=allocateQuotas(items,QUOTAS.mastery,day+'|'+task.id);
   if(quota.ready){result={items:quota.chosen,topic:items[0]};break;}
   if(!firstDeficiency)firstDeficiency={topicId:items[0].topicId,...quota.missing};
  }
  if(!result){fail(task,'MASTERY_BANK_OR_DEPTH_SHORTAGE',{eligibleTopics:options.length,firstDeficiency});
    continue;}
  take(result.items);usedTopics.add(result.topic.topicId);
  taskById.set(task.id,packageTask(task,result.items,result.topic));
 }
 // GCSE is reserved before standard: distinct IDs AND distinct wording.
 const exam=get('gcse-exam-skills');
 const examQ=[];
 for(const marks of [1,2,3]){
  const candidates=questions.filter(q=>q.roles.includes('gcse') &&Number(q.marks)===marks &&
    !assigned.has(q.id) && (!q._promptKey||!assignedPrompts.has(q._promptKey)) &&
    !examQ.some(e=>e._promptKey&&e._promptKey===q._promptKey) &&
    !questions.some(e=>e.id!==q.id && !e.roles.includes('gcse') && e._promptKey && e._promptKey===q._promptKey));
  const found=choose(candidates,1,day+'|exam-'+marks)[0];
  if(found)examQ.push(found);else fail(exam,'EXCLUSIVE_EXAM_MARK_SHORTAGE',{marks});
 }
 if(examQ.length===3){take(examQ);taskById.set(exam.id,packageTask(exam,examQ,null,{marks:[1,2,3]}));}

 // Standard tracks demand their own types. Science is restricted to one topic.
 for(const task of DAILY_V2_TASKS.filter(t=>t.kind==='standard')){
  const options=groupByTopic(questions.filter(q=>q.roles.includes(task.id) &&allowed(q) &&
    (task.subject!=='science'||['biology','chemistry','physics'].includes(q.subject))),task.target,day,subjectExposure);
  let best=null,deficiency=null;
  for(const [,items] of options){
   const quota=task.id==='science-standard'
     ? {ready:true,chosen:choose(items,task.target,day+'|'+task.id)}
     : allocateQuotas(items,QUOTAS[task.id],day+'|'+task.id);
   if(quota.ready){best={items:quota.chosen,topic:items[0]};break;}
   if(!deficiency)deficiency={topicId:items[0].topicId,...quota.missing};
  }
  if(!best){fail(task,'STANDARD_BANK_OR_SKILL_SHORTAGE',{eligibleTopics:options.length,firstDeficiency:deficiency});continue;}
  take(best.items);taskById.set(task.id,packageTask(task,best.items,best.topic));
 }

 // Progressive Year 9: all questions from a taught Y9 topic, in skill order.
 const progressive=get('year9-progressive');
 const y9Options=groupByTopic(questions.filter(q=>q.year===9&&q.roles.includes('year9-progressive')&&allowed(q)),20,day,subjectExposure);
 let y9Choice=null;
 for(const [,items] of y9Options){
  const quota=allocateQuotas(items,QUOTAS['year9-progressive'],day+'|year9');
  if(quota.ready){y9Choice={items:quota.chosen,topic:items[0]};break;}
 }
 if(y9Choice){
  const order={foundation:0,application:1,challenge:2};
  y9Choice.items.sort((a,b)=>order[a.depthBand]-order[b.depthBand]||a.id.localeCompare(b.id));
  take(y9Choice.items);
  taskById.set(progressive.id,packageTask(progressive,y9Choice.items,y9Choice.topic));
 }else fail(progressive,'YEAR9_PROGRESSIVE_BANK_OR_DEPTH_SHORTAGE',{eligibleTopics:y9Options.length});

 // Vocabulary cycles by *concept*, never by question direction. Least-seen
 // concepts are selected first. Earlier fully exhausted cycles repeat.
 for(const task of DAILY_V2_TASKS.filter(t=>t.kind==='vocab')){
  const known=new Map();
  for(const a of past){
   if(a.taskId!==task.id||a.correct!==true||!isId(a.conceptId))continue;
   const token=a.conceptId+'|'+a.day;
   known.set(token,true);
  }
  const count=new Map();
  for(const pair of known.keys()){const concept=pair.slice(0,pair.lastIndexOf('|'));count.set(concept,(count.get(concept)||0)+1);}
  const creditedToday=new Set(priorAttempts.filter(a=>a?.persisted===true&&a.day===day&&a.taskId===task.id&&a.correct===true).map(a=>a.conceptId));
  const vocabQ=questions.filter(q=>q.roles.includes(task.id)&&q.subject===task.subject&&!assigned.has(q.id));
  const chosen=[];const conceptUse=new Set();
  for(const [year,quota] of [[8,25],[9,5]]){
   const groups=new Map();
   for(const q of vocabQ){
    if(!isId(q.conceptId)||creditedToday.has(q.conceptId)|| (year===8?q.year===9:q.year!==9))continue;
    if(!groups.has(q.conceptId))groups.set(q.conceptId,[]);
    groups.get(q.conceptId).push(q);
   }
   const concepts=[...groups.keys()].filter(x=>!conceptUse.has(x)).sort((a,b)=>
     (count.get(a)||0)-(count.get(b)||0)||stableHash(day+'|'+a)-stableHash(day+'|'+b)||a.localeCompare(b));
   if(concepts.length<quota)fail(task,'VOCAB_CONCEPT_SHORTAGE',{year,needed:quota,available:concepts.length});
   for(const concept of concepts.slice(0,quota)){
    const variant=choose(groups.get(concept).filter(q=>!assigned.has(q.id)&&(!q._promptKey||!assignedPrompts.has(q._promptKey))),1,day+'|'+concept)[0];
    if(!variant){fail(task,'VOCAB_VARIANT_COLLISION',{concept});continue;}
    conceptUse.add(concept);chosen.push(variant);
   }
  }
  if(chosen.length===30){take(chosen);taskById.set(task.id,packageTask(task,chosen,null,{year7to8:25,year9:5}));}
 }

 // Historical retrieval: only actual persisted prior question identities.
 // GCSE's exclusivity is lifelong, not merely same-day.
 const retention=get('spaced-retention');
 const last=new Map();
 for(const a of past){
  if(!catalogById.has(a.questionId))continue;
  const old=last.get(a.questionId);
  if(!old||old.day<a.day)last.set(a.questionId,a);
 }
 const seenRetention=[...last.values()].map(a=>({entry:a,question:catalogById.get(a.questionId)}))
  .filter(({question})=>question && !question.roles.includes('gcse')&&!assigned.has(question.id) &&
    (!question._promptKey||!assignedPrompts.has(question._promptKey)));
 const dueScore=row=>{
  const gap=daySpan(day,row.entry.day);
  return gap>=7?0:gap>=2?1:2;
 };
 seenRetention.sort((a,b)=>
  dueScore(a)-dueScore(b)||(a.entry.correct===false?-1:0)-(b.entry.correct===false?-1:0)
  ||daySpan(day,b.entry.day)-daySpan(day,a.entry.day)||a.question.id.localeCompare(b.question.id));
 const reviewItems=seenRetention.slice(0,10).map(r=>r.question);
 if(reviewItems.length!==10)fail(retention,'INSUFFICIENT_PERSISTED_HISTORY',{available:reviewItems.length,needed:10});
 else{take(reviewItems);taskById.set(retention.id,packageTask(retention,reviewItems,null,{historicalOnly:true}));}

 const finalTasks=DAILY_V2_TASKS.map(t=>taskById.get(t.id)).filter(Boolean);
 const blocked=diagnostics.length>0||finalTasks.length!==10;
 return {version:2,day,status:blocked?'blocked':'ready',target:163,
  tasks:blocked?[]:finalTasks,diagnostics,preflight:{
    validatedQuestions:questions.length,
    plannedQuestions:blocked?0:finalTasks.reduce((s,t)=>s+t.questions.length,0),
    taskCount:blocked?0:finalTasks.length,
    unpublished:blocked
  }};
}
