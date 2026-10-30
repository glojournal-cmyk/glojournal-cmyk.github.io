/* Daily V2 — conservative staged rubric review for free-text Mastery.
 * No guessed keyword marks. NEVER automatically save grades to the student's
 * ledger; independent review + safe integration are release prerequisites.
 */
import {fingerprintDailyV2Source} from './bank-adapter.js';
const invariant=(v,msg)=>{if(!v)throw new Error('DailyV2 rubric: '+msg)};
const nonempty=s=>typeof s==='string'&&s.trim().length>0;
function normalize(s,accentInsensitive=false){
 let out=String(s??'').normalize('NFKC').toLowerCase()
  .replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}\s']/gu,' ').replace(/\s+/g,' ').trim();
 if(accentInsensitive)out=out.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 return out;
}
function validateQuestion(topic,question){
 invariant(topic&&question?.topicId===topic.topicId&&nonempty(question.id),'question identity does not match topic');
 const mode=question.answer?.mode;
 // Existing real-source mark_points questions were previously impossible to
 // review: this tool only accepted newly authored rubric_review drafts.
 // This is a manual, staged review, NEVER an auto-grading / XP pathway.
 invariant((mode==='rubric_review'&&question.answer.requiresSemanticAssessment===true)||
  mode==='mark_points'||
  (mode==='numeric'&&Number.isInteger(question.answer.totalMarks)&&
   question.answer.totalMarks>1),
  'question must be free-response rubric_review, source mark_points or multi-mark numeric with explicit points');
 const points=question.answer.markPoints;
 invariant(Array.isArray(points)&&points.length>0&&points.every(nonempty)&&
  (question.answer.totalMarks===undefined||question.answer.totalMarks===points.length) &&
  (mode!=='rubric_review'||question.answer.totalMarks===points.length),
  'invalid scored mark-point rubric');
 return points;
}
/** No unverified free-text auto marks. A model-answer match is a hint only. */
export function previewDailyV2Rubric(topic,question,studentResponse){
 const points=validateQuestion(topic,question);
 invariant(nonempty(studentResponse),'answer text required');
 const isFrench=topic.subject==='french';
 const match=(question.answer.accepted||[]).some(a=>nonempty(a)&&
   normalize(a,isFrench)===normalize(studentResponse,isFrench));
 return {
  status:'review-required',
  questionId:question.id,sourceFingerprint:fingerprintDailyV2Source(topic,question),
  marksPossible:points.length,marksEarned:null,correct:null,
  sourceAnswerMode:question.answer.mode,
  modelAnswerMatch:match,markPoints:[...points],
  reasons:['Open-ended answers can be equivalent without identical words.',
   'Numeric final values cannot prove working, method, direction or explanation marks.',
   'Matching isolated keywords cannot prove causality, correct negation or full reasoning.'],
  releaseGrade:false
 };
}
/** A recorded POINT-BY-POINT reviewer judgement for staging, NOT auto-grading.
 * 0/1 marks per independent rubric point; no inferred marks or hidden boosts.
 * The caller is responsible for independently validating reviewer authority.
 */
export function recordDailyV2RubricReview({
 topic,question,studentResponse,sourceFingerprint,
 reviewerId,reviewId,pointAwards,reviewerNotes
}={}){
 const preview=previewDailyV2Rubric(topic,question,studentResponse);
 invariant(sourceFingerprint===preview.sourceFingerprint,'stale question/answer source; do not mark against changed content');
 invariant(nonempty(reviewerId)&&nonempty(reviewId),'auditable reviewer and review IDs required');
 invariant(Array.isArray(pointAwards)&&pointAwards.length===preview.marksPossible,
  'one explicit award decision per mark point required');
 invariant(Array.isArray(reviewerNotes)&&reviewerNotes.length===preview.marksPossible,
  'one reviewer note per mark point required');
 for(let i=0;i<pointAwards.length;i++){
  invariant(pointAwards[i]===0||pointAwards[i]===1,'each mark point is awarded 0 or 1');
  invariant(nonempty(reviewerNotes[i]),'reviewer evidence/explanation required for every point');
 }
 const earned=pointAwards.reduce((sum,n)=>sum+n,0);
 const points=preview.markPoints.map((criterion,i)=>({
   criterion,awarded:pointAwards[i],reviewerNote:reviewerNotes[i]
 }));
 return {
  status:'staging-review-recorded',
  questionId:question.id,reviewId,reviewerId,sourceFingerprint,
  marksPossible:preview.marksPossible,marksEarned:earned,
  fullCredit:earned===preview.marksPossible,
  points,studentResponse,
  // Whether independently approved or not, no caller gets to turn a reviewed
  // draft into a production credit without separate validated integration.
  releaseGrade:false,autoGraded:false,
  note:'Manual per-point mark record only; no daily-task/XP/student ledger write.'
 };
}
