/* Daily V2 actual-source review triage, not automatic curriculum certification.
 * Read-only: evaluate individual active source records before any claim of
 * independently approved roles, grading or daily-question capacity.
 */
const SUBJECTS=new Set(['latin','french','biology','chemistry','physics']);
const str=x=>typeof x==='string'&&x.trim().length>0;
const active=q=>q&&q.status!=='disabled'&&q.status!=='preview'&&
  q.preview!==true&&q.formal!==false&&!q._repair;
const count=(obj,key)=>{obj[key]=(obj[key]||0)+1;};
export function triageDailyV2Sources(topics=[]){
 if(!Array.isArray(topics))throw Error('DailyV2 source triage requires topic files');
 const inventory=[],idCounts=new Map();
 for(const topic of topics){
  if(!topic||topic.status!=='enabled')continue;
  if(!Array.isArray(topic.questions))throw Error('DailyV2 source triage missing questions list');
  for(const question of topic.questions){
   if(!active(question))continue;
   const id=question.id;
   if(str(id))idCounts.set(id,(idCounts.get(id)||0)+1);
   inventory.push({topic,question});
  }
 }
 const bySubjectYear={},reasonCounts={},samples={};
 let supported=0,ready=0,repair=0,unsupported=0,rubricReview=0,structuredReview=0,
  adapterIntegration=0;
 const rubricSamples=[],structuredSamples=[];
 for(const {topic,question} of inventory){
  const key=String(topic.subject)+'-y'+String(topic.year);
  const bucket=bySubjectYear[key]||(bySubjectYear[key]={
   records:0,readyForReview:0,needsRepair:0,unsupported:0,
   manualMarkPointReview:0,structuredAnswerReview:0
  });
  bucket.records++;
  if(!SUBJECTS.has(topic.subject)){unsupported++;bucket.unsupported++;continue;}
  supported++;
  const reasons=[];
  if(!str(topic.topicId)||![7,8,9].includes(Number(topic.year)))reasons.push('INVALID_TOPIC_METADATA');
  if(!str(question.id))reasons.push('MISSING_QUESTION_ID');
  else if(idCounts.get(question.id)>1)reasons.push('DUPLICATE_QUESTION_ID');
  if(str(question.topicId)&&question.topicId!==topic.topicId)reasons.push('QUESTION_TOPIC_MISMATCH');
  if(!str(question.prompt))reasons.push('MISSING_PROMPT');
  const accepted=Array.isArray(question.answer?.accepted)&&question.answer.accepted.some(str);
  const validMarkPoints=question.answer?.mode==='mark_points'&&
   Array.isArray(question.answer.markPoints)&&question.answer.markPoints.length>0&&
   question.answer.markPoints.every(str);
  const validPairs=question.answer?.mode==='pair_map'&&
   Array.isArray(question.answer.pairs)&&question.answer.pairs.length>0&&
   question.answer.pairs.every(p=>str(p?.left)&&str(p?.right));
  const validGroups=['unordered_required_groups','semantic_groups'].includes(question.answer?.mode)&&
   Array.isArray(question.answer.requiredGroups)&&
   question.answer.requiredGroups.length>0&&
   question.answer.requiredGroups.every(g=>
    Array.isArray(g?.alternatives)&&g.alternatives.some(str));
  const validNumeric=question.answer?.mode==='numeric'&&
   typeof question.answer.value==='number'&&Number.isFinite(question.answer.value)&&
   (question.answer.tolerance===undefined||
    (typeof question.answer.tolerance==='number'&&
     Number.isFinite(question.answer.tolerance)&&question.answer.tolerance>=0))&&
   (question.answer.units===undefined||
    (Array.isArray(question.answer.units)&&question.answer.units.every(str)));
  const categories=question.answer?.categories;
  const validCategories=question.answer?.mode==='category_map'&&
   categories!==null&&typeof categories==='object'&&!Array.isArray(categories)&&
   Object.keys(categories).length>0&&
   Object.values(categories).every(vals=>Array.isArray(vals)&&vals.length>0&&
    vals.every(v=>str(v)||(typeof v==='number'&&Number.isFinite(v))));
  if(!accepted&&!validMarkPoints&&!validPairs&&!validGroups&&!validNumeric&&!validCategories)
   reasons.push('MISSING_MARKING_CONTENT');
  // The current certifying adapter accepts only answer.accepted[]. A genuine
  // source rubric of another mode is structurally meaningful, but still needs
  // a separately validated scoring adapter before Daily can use it.
  if(!accepted&&(validMarkPoints||validPairs||validGroups||validNumeric||validCategories))
   adapterIntegration++;
  if(validPairs||validGroups||validNumeric||validCategories){
   structuredReview++;bucket.structuredAnswerReview++;
   if(structuredSamples.length<6)structuredSamples.push({topicId:topic.topicId,
    questionId:question.id,subject:topic.subject,year:topic.year,
    mode:question.answer.mode});
  }
  // An existing mark_points rubric is NOT a missing answer. It must be
  // independently checked and explicitly integrated into manual partial-credit
  // scoring before any learner-facing Daily V2 use.
  if(validMarkPoints){
   rubricReview++;bucket.manualMarkPointReview++;
   if(rubricSamples.length<6)rubricSamples.push({topicId:topic.topicId,
    questionId:question.id,subject:topic.subject,year:topic.year});
  }
  if(reasons.length){
   repair++;bucket.needsRepair++;
   for(const reason of reasons){
    count(reasonCounts,reason);
    if(!samples[reason])samples[reason]=[];
    if(samples[reason].length<6)samples[reason].push({
     topicId:topic.topicId||null,questionId:question.id||null,
     subject:topic.subject,year:topic.year
    });
   }
  }else{ready++;bucket.readyForReview++;}
 }
 return {
  inspectedRecords:inventory.length,
  supportedSubjectRecords:supported,
  unsupportedSubjectRecords:unsupported,
  readyForHumanReview:ready,
  needsSourceRepair:repair,
  requiresManualMarkPointReview:rubricReview,
  requiresStructuredAnswerReview:structuredReview,
  requiresScoringAdapterIntegration:adapterIntegration,
  markPointReviewSamples:rubricSamples,
  structuredReviewSamples:structuredSamples,
  bySubjectYear,
  reasonCounts,samples,
  curriculumCertified:0,
  note:'Existing marking forms include accepted-text, mark_points, pair_map, semantic_groups, unordered_required_groups, numeric and category_map (including numeric labels). All structured formats require verified scoring integration and independent content review before Daily certification.'
 };
}
