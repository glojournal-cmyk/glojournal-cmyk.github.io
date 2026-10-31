/* Conservative Daily V2 release QA. Counts ONLY source-bound certified bank
 * entries. A slot-count floor is NECESSARY, never sufficient: prompt collisions,
 * taught-topic proof, mastery topic diversity, learner history and real iPad
 * storage must separately pass before ANY production release.
 */
const DAY_COUNT=30;
const uniqueIds=rows=>new Set(rows.map(q=>q.id)).size;
const eligible=(bank,role)=>bank.filter(q=>q?.roles?.includes(role));
const by=(rows,key,value)=>rows.filter(q=>q?.[key]===value);
const item=(role,criterion,needed,rows)=>({
 role,criterion,minimumDistinctThirtyDaySlots:needed,
 certifiedUniqueQuestionIds:uniqueIds(rows),
 shortfall:Math.max(0,needed-uniqueIds(rows)),
 floorMet:uniqueIds(rows)>=needed
});
export function auditDailyV2ReleaseCapacity(questionBank=[],taughtTopicIds=[]){
 if(!Array.isArray(questionBank)||!Array.isArray(taughtTopicIds))
  throw Error('DailyV2 capacity: certified bank and taught topic IDs must be arrays');
 const taught=new Set(taughtTopicIds);
 const rows=[],vocabulary=[];
 for(const subject of ['latin','french']){
  const vocab=eligible(questionBank,subject+'-vocab').filter(q=>q.subject===subject&&
    [7,8,9].includes(Number(q.year)));
  const y78=new Set(vocab.filter(q=>Number(q.year)!==9&&
    typeof q.conceptId==='string'&&q.conceptId.trim()).map(q=>q.conceptId));
  const y9=new Set(vocab.filter(q=>Number(q.year)===9&&
    taught.has(q.topicId)&&typeof q.conceptId==='string'&&q.conceptId.trim())
    .map(q=>q.conceptId));
  // 30 credits on two consecutive days with no correct concept repeated;
  // at most 5 verified-taught Y9 concepts on each day.
  const maxTwoDayFresh=y78.size+Math.min(10,[...y9].filter(c=>!y78.has(c)).length);
  vocabulary.push({subject,perDay:30,dayOneAndTwoRequired:60,
    certifiedYear7to8Concepts:y78.size,certifiedTaughtYear9Concepts:y9.size,
    maxDistinctTwoDayCredits:maxTwoDayFresh,
    shortfall:Math.max(0,60-maxTwoDayFresh),
    floorMet:maxTwoDayFresh>=60&&y78.size>=50,
    note:'Necessary two-day no-repeat lower bound; cannot prove source wording, past learner history or future daily allocation.'});
 }
 for(const subject of ['latin','french']){
  const role=subject+'-standard',pool=eligible(questionBank,role).filter(q=>q.subject===subject);
  const quota=subject==='latin'?[['grammar',4],['translation',3],['passage',3]]:
   [['grammar',4],['translation',3],['writing',3]];
  for(const [skill,n] of quota)rows.push(item(role,skill,DAY_COUNT*n,by(pool,'skill',skill)));
 }
 rows.push(item('science-standard','all-science',300,eligible(questionBank,'science-standard')
  .filter(q=>['biology','chemistry','physics'].includes(q.subject))));
 const mastery=eligible(questionBank,'mastery');
 for(const [band,n] of [['foundation',8],['application',20],['challenge',12]])
  rows.push(item('mastery',band,DAY_COUNT*n,by(mastery,'depthBand',band)));
 const progressive=eligible(questionBank,'year9-progressive')
  .filter(q=>Number(q.year)===9&&taught.has(q.topicId));
 for(const [band,n] of [['foundation',6],['application',11],['challenge',3]])
  rows.push(item('year9-progressive',band,DAY_COUNT*n,by(progressive,'depthBand',band)));
 const exam=eligible(questionBank,'gcse');
 for(const marks of [1,2,3])
  rows.push(item('gcse','original-'+marks+'-mark',DAY_COUNT,
   exam.filter(q=>Number(q.marks)===marks)));
 return {
  sampleDays:DAY_COUNT,fullDayTarget:163,
  totalAssignmentSlots:163*DAY_COUNT,
  certifiedQuestionCount:uniqueIds(questionBank),
  vocabulary,
  minimumFreshQuestionSupply:rows,
  retention:{target:10,perThirtyDays:300,proven:false,
   reason:'Requires at least 10 source-identifiable previously persisted learner attempts; real history is not read in CI.'},
  floorsMet:vocabulary.every(v=>v.floorMet)&&rows.every(r=>r.floorMet),
  releaseReady:false,
  limitations:[
   'Counts are necessary upper-bound source supply, not proof of independently suitable topics or full 30-day planner success.',
   'Rows can overlap in roles and prompts; same-day/exam exclusivity may reduce usable supply.',
   'Year 9 candidates require verified taught-topic evidence; unverified Year 9 remains excluded.',
   'No real learner history or Safari/iPad storage migration was read or changed.'
  ]
 };
}
