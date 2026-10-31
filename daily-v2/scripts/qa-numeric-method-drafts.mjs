/**
 * Reviewer draft integrity gate. NO proposed mark point is a real assessment
 * certificate; this script never writes into topic files, student ledgers,
 * official review manifests, scorer registry or XP/MP.
 */
import {readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadObjectiveReviewQueue} from './build-objective-review-queue.mjs';
const file=join(dirname(fileURLToPath(import.meta.url)),'../review/NUMERIC_METHOD_MARK_PROPOSALS.json');
const drafts=JSON.parse(readFileSync(file,'utf8'));
const req=(x,message)=>{if(!x)throw Error('DailyV2 unapproved mark proposals: '+message);};
export function validateNumericMethodMarkDrafts({queue=loadObjectiveReviewQueue(),doc=drafts}={}){
 req(doc?.scope==='SUGGESTED_METHOD_MARK_CRITERIA_NOT_APPROVED','draft scope must not certify');
 req(doc?.productionRelease===false&&doc?.reviewDecision==='pending','drafts must remain pending');
 req(Array.isArray(doc.proposals),'missing proposals');
 const pending=queue.rows.filter(x=>x.flags.includes('INDEPENDENT_MARK_POINTS_NOT_SPECIFIED'));
 const byId=new Map(pending.map(x=>[x.questionId,x])),seen=new Set();
 for(const proposal of doc.proposals){
  req(proposal&&typeof proposal.questionId==='string','invalid question');
  req(!seen.has(proposal.questionId),'duplicate proposal '+proposal.questionId);
  seen.add(proposal.questionId);
  const row=byId.get(proposal.questionId);
  req(row,'proposal is not an actual source question awaiting point criteria: '+proposal.questionId);
  req(proposal.sourceSha256===row.sourceSha256,
   'STALE_SOURCE_DIGEST for '+proposal.questionId);
  req(proposal.reviewStatus==='needs-independent-approval'&&
   proposal.studentCreditPermitted===false&&
   proposal.sourceAnswerUnchanged===true,'proposed marks must never authorise grading');
  req(Number.isInteger(row.markCeiling)&&row.markCeiling>=2,'expected multi-mark rubric');
  req(proposal.pointsSuggested===row.markCeiling&&
   Array.isArray(proposal.suggestedMarkPoints)&&
   proposal.suggestedMarkPoints.length===row.markCeiling&&
   proposal.suggestedMarkPoints.every(x=>typeof x==='string'&&x.trim().length>15),
   'must propose one clear individual criterion per source mark (still unapproved)');
 }
 req(seen.size===pending.length,
  'source review queue requires '+pending.length+' drafts, got '+seen.size);
 return {
  status:'review-drafts-internal-consistency-only',
  proposals:seen.size,coveredOriginalNumericRubrics:pending.length,
  proposedPoints:doc.proposals.reduce((n,x)=>n+x.pointsSuggested,0),
  sourceDigestsMatch:true,independentlyApproved:0,
  autoScoringEnabled:false,studentDataRead:false,studentCreditsWritten:0,
  warning:'No reviewer is authenticated and no student mark is authorised by these proposals.'
 };
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked)process.stdout.write(JSON.stringify(validateNumericMethodMarkDrafts(),null,2)+'\n');
