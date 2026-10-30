/**
 * Daily V2 test-only signed marking receipt PROTOCOL.
 * Verifies ECDSA P-256 SHA-256 signatures (WebCrypto), without holding
 * private signing keys. Keys must be pinned by an independent trusted host.
 * NO real reviewer keys or approved curriculum manifest ship in this repo.
 * This verifier NEVER releases grade, XP or an actual learner ledger write.
 */
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const expect=(v,code)=>{if(!v)throw Error('DailyV2 signed receipt: '+code);};
const HEX=/^[0-9a-f]+$/;
const fields=[
 'version','keyId','eventId','day','taskId','questionId','sourceFingerprint',
 'answerDigest','planDigest','scorerId','scorerVersion','reviewId',
 'marksEarned','marksPossible','correct','scoredAt'
];
const sorted=(a,b)=>a.sort().join('|')===b.sort().join('|');
export function serializeDailyV2GradeReceipt(p){
 expect(p&&typeof p==='object'&&!Array.isArray(p),'INVALID_RECEIPT');
 expect(sorted(Object.keys(p),[...fields]),'UNEXPECTED_RECEIPT_FIELDS');
 expect(p.version===1,'INVALID_PROTOCOL_VERSION');
 for(const name of ['keyId','eventId','day','taskId','questionId',
  'sourceFingerprint','answerDigest','planDigest','scorerId','scorerVersion',
  'reviewId','scoredAt'])expect(nonempty(p[name]),'MISSING_'+name.toUpperCase());
 expect(/^\d{4}-\d{2}-\d{2}$/.test(p.day),'INVALID_DAY');
 expect(/^fnv1a32-[0-9a-f]{8}$/.test(p.sourceFingerprint),'INVALID_SOURCE_FINGERPRINT');
 for(const name of ['answerDigest','planDigest'])
  expect(/^[0-9a-f]{64}$/.test(p[name]),'INVALID_'+name.toUpperCase());
 expect(Number.isInteger(p.marksEarned)&&Number.isInteger(p.marksPossible)&&
  p.marksPossible>=1&&p.marksEarned>=0&&p.marksEarned<=p.marksPossible,
  'INVALID_MARKS');
 expect(typeof p.correct==='boolean'&&p.correct===(p.marksEarned===p.marksPossible),
  'INCORRECT_MARKS_FLAG');
 expect(!Number.isNaN(Date.parse(p.scoredAt)),'INVALID_SCORING_TIME');
 return JSON.stringify(fields.map(k=>p[k]));
}
function bytes(s){return new TextEncoder().encode(s);}
function toHex(buf){return Array.from(new Uint8Array(buf),n=>n.toString(16).padStart(2,'0')).join('');}
export async function digestDailyV2Value(value){
 expect(globalThis.crypto?.subtle,'WEBCRYPTO_NOT_AVAILABLE');
 return toHex(await globalThis.crypto.subtle.digest('SHA-256',bytes(JSON.stringify(value))));
}
function hexBytes(hex){
 expect(typeof hex==='string'&&hex.length===128&&HEX.test(hex),'INVALID_SIGNATURE');
 return Uint8Array.from(hex.match(/../g).map(h=>parseInt(h,16)));
}
export function makeDailyV2UnsignedReceipt({keyId,eventId,day,taskId,
 questionId,sourceFingerprint,answerDigest,planDigest,scorerId,
 scorerVersion,reviewId,marksEarned,marksPossible,correct,scoredAt}={}){
 const payload={version:1,keyId,eventId,day,taskId,questionId,
  sourceFingerprint,answerDigest,planDigest,scorerId,scorerVersion,
  reviewId,marksEarned,marksPossible,correct,scoredAt};
 serializeDailyV2GradeReceipt(payload);
 return Object.freeze(payload);
}
/**
 * Trusted keys and reviewed manifests are independent inputs, NEVER taken
 * from the receipt itself. The caller must pin these in trusted configuration.
 * A GitHub field reviewed:true alone is not sufficient proof.
 */
export async function verifyDailyV2SignedReceipt({
 payload,signatureHex,trustedPublicKeys,reviewManifest,
 expected,allowedScorerId
}={}){
 const message=serializeDailyV2GradeReceipt(payload);
 expect(expected&&typeof expected==='object','EXPECTED_SUBMISSION_REQUIRED');
 for(const name of ['day','taskId','questionId','sourceFingerprint',
  'answerDigest','planDigest','eventId']){
  expect(expected[name]===payload[name],'RECEIPT_BINDING_MISMATCH_'+name.toUpperCase());
 }
 expect(expected.marksEarned===payload.marksEarned&&
  expected.marksPossible===payload.marksPossible&&
  expected.correct===payload.correct,'RECEIPT_MARKS_MISMATCH');
 expect(nonempty(allowedScorerId)&&payload.scorerId===allowedScorerId,'SCORER_NOT_ALLOWED');
 const review=reviewManifest?.[payload.questionId];
 expect(review?.reviewed===true&&review?.scorerApproved===true&&
  nonempty(review.reviewer)&&nonempty(review.reviewedAt)&&
  review.sourceFingerprint===payload.sourceFingerprint&&
  review.scorerId===payload.scorerId&&
  review.scorerVersion===payload.scorerVersion&&
  review.reviewId===payload.reviewId&&
  review.authorizedKeyId===payload.keyId,
  'INDEPENDENT_REVIEW_MISSING_OR_STALE');
 const key=trustedPublicKeys?.[payload.keyId];
 expect(key&&typeof key==='object'&&key.kty==='EC'&&key.crv==='P-256',
  'TRUSTED_PUBLIC_KEY_MISSING');
 expect(globalThis.crypto?.subtle,'WEBCRYPTO_NOT_AVAILABLE');
 const imported=await globalThis.crypto.subtle.importKey('jwk',key,
  {name:'ECDSA',namedCurve:'P-256'},false,['verify']);
 const valid=await globalThis.crypto.subtle.verify(
  {name:'ECDSA',hash:'SHA-256'},imported,hexBytes(signatureHex),bytes(message));
 expect(valid,'INVALID_SIGNATURE');
 return Object.freeze({
  verifiedSignature:true,reviewBound:true,
  day:payload.day,eventId:payload.eventId,questionId:payload.questionId,
  sourceFingerprint:payload.sourceFingerprint,
  marksEarned:payload.marksEarned,marksPossible:payload.marksPossible,
  correct:payload.correct,
  // Signing protocol is validated, but NO production authority or user-scoped
  // identity/permissions/key provisioning has been approved.
  stagingOnly:true,releaseGrade:false,ledgerEligible:false
 });
}
