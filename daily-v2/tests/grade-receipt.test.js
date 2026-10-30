import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {DAILY_V2_TASKS} from '../src/planner.js';
import {fingerprintDailyV2Source} from '../src/bank-adapter.js';
import {commitDailyV2Plan,commitDailyV2Answer,
 createMemoryDailyV2Repository,commitSignedDailyV2AnswerForStaging} from '../src/storage.js';
import {previewFrozenDailyV2ObjectiveSubmission} from '../src/staging-score-gate.js';
import {digestDailyV2Value,serializeDailyV2GradeReceipt,
 makeDailyV2UnsignedReceipt,verifyDailyV2SignedReceipt} from '../src/grade-receipt.js';

const subtle=(globalThis.crypto||webcrypto).subtle;
const source=JSON.parse(readFileSync(new URL('../../content/topics/bio-y8-ber.json',import.meta.url),'utf8'));
const question=source.questions.find(q=>q.id==='bio-y8-app-ber-55');
const day='2026-10-30',taskId='science-standard',questionId=question.id;
const fp=fingerprintDailyV2Source(source,question);
const response='7128 kJ/day';
const eventId='qa-signed-event-001',keyId='qa-ephemeral-key';
const ledgerScope='qa-pseudonymous-learner-a';
const scorerId='daily-v2-objective-v1',scorerVersion='qa-v1';
const reviewId='qa-independent-reviewed-001';

async function setup(){
 const repo=createMemoryDailyV2Repository();
 const plan={version:2,status:'ready',day,target:163,
  tasks:DAILY_V2_TASKS.map(task=>({
   ...task,questions:Array.from({length:task.target},(_,i)=>({
    questionId:task.id+'-fixture-'+i,
    conceptId:task.kind==='vocab'?task.subject+'-concept-'+i:null,
    marks:task.kind==='exam'?i+1:null
   }))
  }))};
 plan.tasks.find(t=>t.id===taskId).questions[0]={
  questionId,subject:source.subject,year:source.year,
  topicId:source.topicId,sourceFingerprint:fp,
  conceptId:null,marks:null
 };
 await commitDailyV2Plan(repo,plan);
 const keys=await subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const publicKey=await subtle.exportKey('jwk',keys.publicKey);
 const trustedPublicKeys={[keyId]:publicKey};
 const reviewManifest={[questionId]:{
  reviewed:true,scorerApproved:true,
  reviewer:'qa-reviewer-only',reviewedAt:'2026-10-30',
  sourceFingerprint:fp,scorerId,scorerVersion,reviewId,authorizedKeyId:keyId
 }};
 return {repo,plan,keys,trustedPublicKeys,reviewManifest};
}
async function signPayload(keys,payload){
 const b=await subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,
  new TextEncoder().encode(serializeDailyV2GradeReceipt(payload)));
 return Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
}
async function signed(ctx,overrides={}){
 const staged=await previewFrozenDailyV2ObjectiveSubmission(ctx.repo,{
  day,taskId,questionId,topic:source,question,response});
 const payload=makeDailyV2UnsignedReceipt({
  keyId,eventId,ledgerScope,day,taskId,questionId,sourceFingerprint:fp,
  answerDigest:await digestDailyV2Value(response),
  planDigest:await digestDailyV2Value(ctx.plan),
  scorerId,scorerVersion,reviewId,marksEarned:staged.marksEarned,
  marksPossible:staged.marksPossible,correct:staged.correct,
  scoredAt:'2026-10-30T12:00:00Z',...overrides
 });
 return {payload,signatureHex:await signPayload(ctx.keys,payload)};
}
const submit=(ctx,receipt,overrides={})=>commitSignedDailyV2AnswerForStaging(ctx.repo,{
 ...receipt,trustedPublicKeys:ctx.trustedPublicKeys,
 reviewManifest:ctx.reviewManifest,ledgerScope,day,taskId,questionId,
 topic:source,question,response,...overrides
});
test('signed receipt is a canonical stable projection, with no private signing key in repo',async()=>{
 const ctx=await setup(),r=await signed(ctx);
 assert.equal(r.payload.sourceFingerprint,fp);
 assert.equal(r.payload.correct,true);
 assert.ok(r.signatureHex.length===128);
 const proof=await verifyDailyV2SignedReceipt({
  ...r,trustedPublicKeys:ctx.trustedPublicKeys,reviewManifest:ctx.reviewManifest,
  allowedScorerId:scorerId,
  expected:{
   eventId,ledgerScope,day,taskId,questionId,sourceFingerprint:fp,
   answerDigest:r.payload.answerDigest,planDigest:r.payload.planDigest,
   marksEarned:2,marksPossible:2,correct:true
  }
 });
 assert.equal(proof.verifiedSignature,true);
 assert.equal(proof.stagingOnly,true);
 assert.equal(proof.releaseGrade,false);
});
test('valid fixture-signed, reviewed original source answer commits only to memory sandbox',async()=>{
 const ctx=await setup(),receipt=await signed(ctx);
 const result=await submit(ctx,receipt);
 assert.equal(result.verified,true);
 assert.equal(result.creditDelta,1);
 assert.equal(result.newVerifiedCredit,true);
 assert.equal(result.verifiedSignature,true);
 assert.equal(result.stagingOnly,true);
 assert.equal(result.releaseGrade,false);
 assert.equal(result.ledgerEligible,false);
 assert.equal(result.awardXP,false);
 assert.equal(result.awardMP,false);
 assert.equal(ctx.repo.readOnlySnapshot(day).ledger.attempts.length,1);
});
test('exact same signed event replay has zero new rewards and one stored event',async()=>{
 const ctx=await setup(),receipt=await signed(ctx);
 const first=await submit(ctx,receipt);
 const again=await submit(ctx,receipt);
 assert.equal(first.creditDelta,1);
 assert.equal(again.alreadyRecorded,true);
 assert.equal(again.creditDelta,0);
 assert.equal(again.newVerifiedCredit,false);
 assert.equal(ctx.repo.readOnlySnapshot(day).ledger.attempts.length,1);
});
test('tampering marks or correctness after signing fails and leaves ledger unchanged',async()=>{
 const ctx=await setup(),receipt=await signed(ctx),prior=ctx.repo.readOnlySnapshot(day);
 for(const change of [{marksEarned:1,correct:false},{correct:false},{marksPossible:3}]){
  await assert.rejects(submit(ctx,{...receipt,payload:{...receipt.payload,...change}}),
   /RECEIPT_MARKS_MISMATCH|INCORRECT_MARKS_FLAG/);
 }
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('a mismatched response is not bound to old signed receipt, even if correct',async()=>{
 const ctx=await setup(),receipt=await signed(ctx),prior=ctx.repo.readOnlySnapshot(day);
 await assert.rejects(submit(ctx,receipt,{response:'7,128 kJ per day'}),
  /RECEIPT_BINDING_MISMATCH_ANSWERDIGEST/);
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('signing key id and review record are necessary; reviewer fields alone are not enough',async()=>{
 const ctx=await setup(),receipt=await signed(ctx);
 const prior=ctx.repo.readOnlySnapshot(day);
 await assert.rejects(submit(ctx,receipt,{trustedPublicKeys:{}}),/TRUSTED_PUBLIC_KEY_MISSING/);
 await assert.rejects(submit(ctx,receipt,{reviewManifest:{}}),/INDEPENDENT_REVIEW_MISSING/);
 await assert.rejects(submit(ctx,receipt,{reviewManifest:{[questionId]:{
  ...ctx.reviewManifest[questionId],scorerApproved:false
 }}}),/INDEPENDENT_REVIEW_MISSING/);
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('signature is rejected when payload is modified but marks look consistent',async()=>{
 const ctx=await setup(),receipt=await signed(ctx),prior=ctx.repo.readOnlySnapshot(day);
 const changed={...receipt.payload,scoredAt:'2026-10-31T12:00:00Z'};
 await assert.rejects(submit(ctx,{...receipt,payload:changed}),/INVALID_SIGNATURE/);
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('valid signature by a different key is refused by externally pinned trusted key',async()=>{
 const ctx=await setup(),receipt=await signed(ctx),prior=ctx.repo.readOnlySnapshot(day);
 const different=await subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 await assert.rejects(submit(ctx,{payload:receipt.payload,
  signatureHex:await signPayload(different,receipt.payload)}),/INVALID_SIGNATURE/);
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('edited source rubric or updated prompt invalidates signed grading',async()=>{
 const ctx=await setup(),receipt=await signed(ctx),prior=ctx.repo.readOnlySnapshot(day);
 await assert.rejects(submit(ctx,receipt,{question:{...question,
  answer:{...question.answer,value:9999}}}),/SOURCE_CHANGED_SINCE_FROZEN_PLAN/);
 await assert.rejects(submit(ctx,receipt,{question:{...question,
  prompt:question.prompt+' changed'}}),/SOURCE_CHANGED_SINCE_FROZEN_PLAN/);
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('unsigned or directly forged answer still cannot bypass signed source guard',async()=>{
 const ctx=await setup(),receipt=await signed(ctx),prior=ctx.repo.readOnlySnapshot(day);
 await assert.rejects(commitDailyV2Answer(ctx.repo,{eventId,day,taskId,questionId,correct:true}),
  /SOURCE_BOUND_GRADE_RELEASE_NOT_APPROVED/);
 await assert.rejects(submit(ctx,{...receipt,signatureHex:'0'.repeat(128)}),/INVALID_SIGNATURE/);
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('production-shaped repository object is always rejected by staged signed commit',async()=>{
 const ctx=await setup(),receipt=await signed(ctx),prior=ctx.repo.readOnlySnapshot(day);
 const external={read:day=>ctx.repo.read(day),
  compareAndSwap:()=>{throw Error('must never write');}};
 await assert.rejects(commitSignedDailyV2AnswerForStaging(external,{
  ...receipt,trustedPublicKeys:ctx.trustedPublicKeys,reviewManifest:ctx.reviewManifest,
  ledgerScope,day,taskId,questionId,topic:source,question,response
 }),/STAGING_MEMORY_ONLY/);
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('zero and partial objective previews must never become guessed work/GCSE marks',async()=>{
 const ctx=await setup(),receipt=await signed(ctx),prior=ctx.repo.readOnlySnapshot(day);
 await assert.rejects(submit(ctx,receipt,{response:'1000 kJ/day'}),
  /SCORING_REQUIRES_REVIEW/);
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('extra fields or malicious JSON cannot change canonical signed protocol',async()=>{
 const ctx=await setup(),receipt=await signed(ctx);
 assert.throws(()=>serializeDailyV2GradeReceipt({...receipt.payload,
  releaseGrade:true}),/UNEXPECTED_RECEIPT_FIELDS/);
 assert.throws(()=>serializeDailyV2GradeReceipt({...receipt.payload,
  marksEarned:3}),/INVALID_MARKS/);
});

test('grade signed for one learner scope cannot be replayed into a different learner profile',async()=>{
 const ctx=await setup(),receipt=await signed(ctx),prior=ctx.repo.readOnlySnapshot(day);
 await assert.rejects(submit(ctx,receipt,{ledgerScope:'qa-pseudonymous-learner-b'}),
  /RECEIPT_BINDING_MISMATCH_LEDGERSCOPE/);
 assert.deepEqual(ctx.repo.readOnlySnapshot(day),prior);
});
test('a receipt with missing learner scope is invalid before signature verification',async()=>{
 const ctx=await setup(),receipt=await signed(ctx);
 assert.throws(()=>serializeDailyV2GradeReceipt({...receipt.payload,ledgerScope:''}),
  /MISSING_LEDGERSCOPE/);
 await assert.rejects(submit(ctx,receipt,{ledgerScope:''}),/TRUSTED_LEDGER_SCOPE_REQUIRED/);
});
