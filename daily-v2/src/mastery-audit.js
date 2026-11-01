/* Daily V2 — read-only education QA review queue from genuine topic JSON.
 * Source difficulty and question format are only reviewer TRIAGE signals.
 * This module NEVER confers Mastery, challenge status or Daily eligibility.
 */
import {fingerprintDailyV2Source} from './bank-adapter.js';

const independentFormats=new Set([
 'typed_short','typed_exact','typed_equivalent','controlled_translation',
 'mark_points','extended_response','practical_design','calculation','unordered_set'
]);
const possibleChallengeFormats=new Set([
 'controlled_translation','mark_points','extended_response','practical_design','calculation'
]);
const simpleFormats=new Set(['mc_single','spelling_restore','word_tiles','matching','sorting','sequence','listen_type']);
const keyOf=q=>JSON.stringify([q.prompt||'',q.stimulus?.text||'',q.stimulus?.direction||'',
 q.options||[],q.answer?.accepted||[]]);
export function buildDailyV2MasteryReviewQueue(topics=[]){
 if(!Array.isArray(topics))throw Error('DailyV2 review: topic array required');
 const summaries=[],candidates=[],seen=new Set(),issues=[];
 for(const t of topics){
  if(!t||t.status!=='enabled'||!Array.isArray(t.questions))continue;
  let enabled=0,independent=0,depth3to4=0,sourceHighCandidates=0;
  const byDifficulty={1:0,2:0,3:0,4:0,other:0},formats={},sourceKeys=new Set(),topicCandidates=[];
  for(const q of t.questions){
   if(!q||q.status!=='enabled'||q.preview===true||q.formal===false||q._repair)continue;
   enabled++;
   const format=String(q.format||'unknown');
   formats[format]=(formats[format]||0)+1;
   const difficulty=Number(q.difficulty);
   const band=[1,2,3,4].includes(difficulty)?String(difficulty):'other';
   byDifficulty[band]++;
   if(independentFormats.has(format))independent++;
   if(difficulty>=3)depth3to4++;
   const composite=keyOf(q);
   if(sourceKeys.has(composite))issues.push({topicId:t.topicId,questionId:q.id,code:'DUPLICATE_FULL_QUESTION'});
   sourceKeys.add(composite);
   if(!q.id||seen.has(q.id)){
    issues.push({topicId:t.topicId,questionId:q.id||null,code:'DUPLICATE_OR_MISSING_ID'});continue;
   }
   seen.add(q.id);
   if(difficulty>=3&&possibleChallengeFormats.has(format)){
    sourceHighCandidates++;
    topicCandidates.push({
     topicId:t.topicId,questionId:q.id,sourceDifficulty:difficulty,format,
     sourceFingerprint:fingerprintDailyV2Source(t,q),reviewRequired:true,
     certifiedMastery:false
    });
   }
   if(simpleFormats.has(format)&&difficulty>=3)issues.push({
    topicId:t.topicId,questionId:q.id,code:'HIGH_DIFFICULTY_TAG_ON_SIMPLE_FORMAT_REVIEW'
   });
  }
  const qa={
   topicId:t.topicId,subject:t.subject,year:Number(t.year),enabled,
   independent,depth3to4,sourceHighCandidates,byDifficulty,formats,
   uniqueCompleteQuestions:sourceKeys.size,
   // Structural availability is NOT certified Mastery; only a triage priority.
   cannotMeetChallengeQuotaBySourceHints:sourceHighCandidates<6,
   manualReviewStillRequired:true
  };
  summaries.push(qa);
  candidates.push(...topicCandidates);
 }
 const subjectPriority={latin:0,french:1,biology:2,chemistry:3,physics:4};
 summaries.sort((a,b)=>(subjectPriority[a.subject]??9)-(subjectPriority[b.subject]??9)
  ||Number(b.cannotMeetChallengeQuotaBySourceHints)-Number(a.cannotMeetChallengeQuotaBySourceHints)
  ||a.sourceHighCandidates-b.sourceHighCandidates||a.topicId.localeCompare(b.topicId));
 return {status:'review-required',
  scannedTopics:summaries.length,scannedQuestions:summaries.reduce((n,t)=>n+t.enabled,0),
  summaries,candidates,issues,
  certifiedMasteryQuestions:0,
  reason:'These are source metadata hints only; a curriculum reviewer must check each question and mark scheme.'};
}
