/* Explicit Mastery draft content integrity gate.
 * This verifies structural completeness, NOT independent scientific/language
 * accuracy, pupil-taught eligibility, or automated semantic marking.
 */
export const MASTERY_DRAFT_FILES = Object.freeze([
 'latin-y8-adjective-agreement.json',
 'french-y8-negatives-tenses-writing.json',
 'biology-y8-digestion-absorption.json',
 'chemistry-y8-formulae-equations.json',
 'physics-y8-speed-time.json'
]);
export const MASTERY_BATCH_2_FILES = Object.freeze([
 'latin-y8-verb-tenses.json',
 'french-y8-reflexive-routines.json',
 'biology-y8-photosynthesis.json',
 'chemistry-y8-acids-neutralisation.json',
 'physics-y8-series-parallel.json'
]);
export const ALL_MASTERY_DRAFT_FILES = Object.freeze([...MASTERY_DRAFT_FILES,...MASTERY_BATCH_2_FILES]);
const REQUIRED = Object.freeze({foundation:4,application:10,challenge:6});
const FORMATS = new Set(['typed_short','mark_points','controlled_translation','calculation','extended_response']);
const ok=s=>typeof s==='string'&&s.trim().length>0;
export function auditDailyV2MasteryDrafts(topics){
 if(!Array.isArray(topics))throw Error('Mastery drafts require topic array');
 const errors=[],report=[],uniqueIds=new Set(),fullPrompts=new Set();
 for(const t of topics){
  const counts={foundation:0,application:0,challenge:0};
  if(!t||!Array.isArray(t.questions)||!ok(t.topicId)){
   errors.push({topicId:t?.topicId||null,code:'INVALID_TOPIC'});continue;
  }
  if(!['latin','french','biology','chemistry','physics'].includes(t.subject)
      ||t.year!==8||t.status!=='enabled'||!ok(t.title))
   errors.push({topicId:t.topicId,code:'INVALID_SUBJECT_YEAR_OR_STATUS'});
  if(t.curriculumReview!=='pending-independent-review'
     ||t.taughtStatus!=='not-verified-for-student'
     ||t.origin!=='daily-v2-isolated-draft')
   errors.push({topicId:t.topicId,code:'UNVERIFIED_DRAFT_MUST_NOT_APPEAR_CERTIFIED'});
  if(t.questions.length!==20)errors.push({topicId:t.topicId,code:'REQUIRES_EXACTLY_20_ITEMS'});
  let marks=0;
  for(const q of t.questions){
   if(!ok(q?.id)||uniqueIds.has(q.id)){errors.push({topicId:t.topicId,questionId:q?.id,code:'MISSING_OR_DUPLICATE_ID'});continue;}
   uniqueIds.add(q.id);
   if(q.topicId!==t.topicId||q.status!=='enabled'||!Array.isArray(q.roles)
      ||q.roles.length!==1||q.roles[0]!=='mastery')
    errors.push({topicId:t.topicId,questionId:q.id,code:'INVALID_ITEM_SCOPE'});
   if(!['foundation','application','challenge'].includes(q.depthBand))
    errors.push({topicId:t.topicId,questionId:q.id,code:'INVALID_DEPTH'});
   else counts[q.depthBand]++;
   if(!FORMATS.has(q.format)||q.format==='mc_single'||
     !ok(q.prompt)||!ok(q.stimulus?.text))
    errors.push({topicId:t.topicId,questionId:q.id,code:'INVALID_HIGH_LEVEL_QUESTION_FORMAT'});
   const key=(q.prompt+' | '+q.stimulus?.text).toLowerCase().replace(/\s+/g,' ').trim();
   if(fullPrompts.has(key))errors.push({topicId:t.topicId,questionId:q.id,code:'DUPLICATE_PROMPT_AND_STIMULUS'});
   fullPrompts.add(key);
   const ans=q.answer||{};
   if(ans.mode!=='rubric_review'||ans.requiresSemanticAssessment!==true||
      !Array.isArray(ans.accepted)||!ans.accepted.every(ok)||!ans.accepted.length||
      !ok(ans.modelAnswer)||!Array.isArray(ans.markPoints)||
      ans.markPoints.length<1||!ans.markPoints.every(ok)||
      ans.totalMarks!==ans.markPoints.length)
    errors.push({topicId:t.topicId,questionId:q.id,code:'MISSING_OR_INVALID_SEMANTIC_MARK_SCHEME'});
   if(q.reviewStatus!=='author-draft-awaiting-curriculum-review')
    errors.push({topicId:t.topicId,questionId:q.id,code:'ITEM_PREMATURELY_CERTIFIED'});
   if(q.format==='mc_single'||(q.depthBand==='challenge'&&ans.totalMarks<3))
    errors.push({topicId:t.topicId,questionId:q.id,code:'INSUFFICIENT_CHALLENGE_DEMAND'});
   marks+=ans.totalMarks||0;
  }
  for(const [band,n] of Object.entries(REQUIRED))if(counts[band]!==n)
   errors.push({topicId:t.topicId,code:'BAND_QUOTA',band,required:n,actual:counts[band]});
  report.push({subject:t.subject,topicId:t.topicId,questionCount:t.questions.length,
   bandCounts:counts,rubricMarks:marks,
   certifiedQuestions:0,reviewStatus:t.curriculumReview});
 }
 if(report.length!==5||new Set(report.map(x=>x.subject)).size!==5)
  errors.push({code:'FIVE_DISTINCT_SUBJECTS_REQUIRED'});
 return {readyForIndependentReview:errors.length===0,
  eligibleForLiveDaily:false,questionCount:report.reduce((n,t)=>n+t.questionCount,0),
  topics:report,errors,
  disclaimer:'Structural QA does not authorise students to receive questions or validate free-response marking.'};
}
