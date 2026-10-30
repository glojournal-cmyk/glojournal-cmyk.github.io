/* Daily V2 real-topic adapter; certification is explicit and conservative.
 * This module never treats existing difficulty, question count or format labels
 * as evidence that an item is genuine Mastery / an independent GCSE question.
 * A reviewer-authored manifest must certify each role/skill/depth before use.
 * No legacy progress, student state or topic JSON is mutated.
 */
import {inspectDailyV2AnswerShape} from './source-answer.js';

export const DAILY_V2_ROLES = Object.freeze([
 'latin-vocab','french-vocab','latin-standard','french-standard',
 'science-standard','mastery','retention-source','gcse','year9-progressive'
]);
const ROLES=new Set(DAILY_V2_ROLES);
const LANG_SKILLS={
 'latin-standard':new Set(['grammar','translation','passage']),
 'french-standard':new Set(['grammar','translation','writing'])
};
const DEPTH=new Set(['foundation','application','challenge']);
const SUBJECTS=new Set(['latin','french','biology','chemistry','physics']);
const okString=x=>typeof x==='string'&&x.trim().length>0;

/** Stable, review-bound source checksum (FNV-1a32).
 * This is a change detector, NOT a cryptographic authenticity guarantee.
 * A certified question must be re-reviewed if prompt/stimulus/marking changes.
 */
export function fingerprintDailyV2Source(topic,question){
 const payload=JSON.stringify([
  topic?.topicId??null,topic?.subject??null,Number(topic?.year)||null,
  question?.id??null,question?.topicId??null,
  question?.format??null,question?.prompt??null,
  question?.stimulus??null,question?.options??null,question?.answer??null,
  // Source-provided GCSE mark points are part of the assessed material.
  // Changing a mark scheme must invalidate previously reviewed certificates.
  question?.markScheme??null
 ]);
 let hash=2166136261;
 for(let i=0;i<payload.length;i++){hash^=payload.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return 'fnv1a32-'+(hash>>>0).toString(16).padStart(8,'0');
}

function certificationIssues(question,topic,c){
 const issues=[];
 if(!c||c.reviewed!==true||!okString(c.reviewer)||!okString(c.reviewedAt))return ['NOT_CERTIFIED'];
 if(c.sourceFingerprint!==fingerprintDailyV2Source(topic,question))issues.push('STALE_OR_UNBOUND_CERTIFICATION');
 if(!Array.isArray(c.roles)||c.roles.length===0||c.roles.some(r=>!ROLES.has(r)))issues.push('INVALID_ROLES');
 if(!okString(topic.topicId)||!SUBJECTS.has(topic.subject)||![7,8,9].includes(Number(topic.year)))issues.push('INVALID_TOPIC');
 if(!okString(question.id)||!okString(question.prompt))issues.push('INVALID_QUESTION');
 if(okString(question.topicId)&&question.topicId!==topic.topicId)
  issues.push('QUESTION_TOPIC_MISMATCH');
 const answerShape=inspectDailyV2AnswerShape(question.answer);
 if(answerShape.structuredMode){
  // Even accepted[] with semantic_groups/mark_points is not a permit to
  // auto-grade multi-part answers using a generic string comparator.
  issues.push(answerShape.structuredEvidence?
   'STRUCTURED_SCORING_ADAPTER_NOT_VERIFIED':'STRUCTURED_MARKING_EVIDENCE_INVALID');
 }else if(!answerShape.accepted)issues.push('NO_MARKING_ANSWER');
 if(c.roles?.includes('gcse')&&c.roles.length!==1)issues.push('GCSE_MUST_BE_EXCLUSIVE');
 const vocabRoles=(c.roles||[]).filter(r=>r==='latin-vocab'||r==='french-vocab');
 if(vocabRoles.length){
  if(vocabRoles.length!==1||vocabRoles[0]!==topic.subject+'-vocab')issues.push('VOCAB_SUBJECT_MISMATCH');
  if(!okString(c.vocabConceptId)||c.lexicalUnitCertified!==true)issues.push('VOCAB_LEXICAL_CERTIFICATION_MISSING');
 }
 for(const role of Object.keys(LANG_SKILLS)){
  if(c.roles?.includes(role)&&
    (topic.subject+'-standard'!==role||!LANG_SKILLS[role].has(c.skill)))issues.push('LANGUAGE_SKILL_NOT_CERTIFIED');
 }
 if(c.roles?.includes('science-standard')&&!['biology','chemistry','physics'].includes(topic.subject))issues.push('SCIENCE_SUBJECT_MISMATCH');
 if(c.roles?.includes('year9-progressive')){
  if(Number(topic.year)!==9||!DEPTH.has(c.depthBand))issues.push('YEAR9_DEPTH_NOT_CERTIFIED');
 }
 if(c.roles?.includes('mastery')){
  if(!DEPTH.has(c.depthBand)||!c.masteryRubric||c.masteryRubric.reviewed!==true||
      !okString(c.masteryRubric.cognitiveDemand)||!okString(c.masteryRubric.independentResponse))
   issues.push('MASTERY_RUBRIC_NOT_CERTIFIED');
 }
 if(c.roles?.includes('gcse')){
  const markScheme=c.gcseMarkScheme||question.markScheme;
  if(![1,2,3].includes(Number(c.gcseMarks))||!Array.isArray(markScheme)||markScheme.length!==Number(c.gcseMarks)
     ||markScheme.some(s=>!okString(s)))issues.push('GCSE_MARK_SCHEME_NOT_CERTIFIED');
  if(c.gcseOriginalityChecked!==true)issues.push('GCSE_ORIGINALITY_NOT_CERTIFIED');
 }
 return [...new Set(issues)];
}
export function adaptCertifiedDailyV2Bank({topics=[],certifications={},includeUncertifiedDiagnostics=true}={}){
 if(!Array.isArray(topics)||!certifications||typeof certifications!=='object')
  throw Error('DailyV2 bank: invalid input');
 const bank=[],errors=[],uncertified=[],seen=new Set();
 let scanned=0;
 for(const topic of topics){
  if(!topic||topic.status!=='enabled'||!Array.isArray(topic.questions))continue;
  for(const question of topic.questions){
   if(!question||question.status==='disabled'||question.status==='preview'||question.preview===true||
      question.formal===false||question._repair)continue;
   scanned++;
   if(!okString(question.id)||seen.has(question.id)){
    errors.push({questionId:question?.id||null,code:'DUPLICATE_OR_MISSING_ID'});continue;
   }
   seen.add(question.id);
   const cert=certifications[question.id];
   if(!cert){if(includeUncertifiedDiagnostics)uncertified.push(question.id);continue;}
   const issues=certificationIssues(question,topic,cert);
   if(issues.length){for(const code of issues)errors.push({questionId:question.id,code});continue;}
   const q={
    id:question.id,conceptId:cert.vocabConceptId||question.conceptId||null,
    subject:topic.subject,year:Number(topic.year),topicId:topic.topicId,
    prompt:question.prompt,stimulus:question.stimulus||{},
    format:question.format,status:'enabled',formal:true,roles:[...new Set(cert.roles)],
    skill:cert.skill||null,depthBand:cert.depthBand||null,
    answer:question.answer
   };
   if(cert.roles.includes('gcse')){
    q.marks=Number(cert.gcseMarks);
    q.markScheme=[...(cert.gcseMarkScheme||question.markScheme)];
   }
   bank.push(q);
  }
 }
 return {questionBank:bank,errors,uncertified,summary:{
  scanned,certified:bank.length,unclassified:uncertified.length,
  rejected:errors.length,
  byRole:Object.fromEntries(DAILY_V2_ROLES.map(role=>[role,bank.filter(q=>q.roles.includes(role)).length]))
 }};
}
/** Status alone is not teaching evidence; only validated externally sourced,
 * topic-level taught evidence should be passed to planDailyV2.
 */
export function certifiedTaughtTopicIds(evidence=[]){
 if(!Array.isArray(evidence))throw Error('DailyV2 bank: taught evidence array required');
 return [...new Set(evidence.filter(x=>x?.taught===true&&x?.verified===true&&
   okString(x.topicId)&&okString(x.source)&&okString(x.confirmedAt)).map(x=>x.topicId))];
}
