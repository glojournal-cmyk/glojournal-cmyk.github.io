import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewLegacyDailyV2Import} from '../src/legacy-review.js';

const day='2026-10-26';
const make=(rows,opts={})=>reviewLegacyDailyV2Import({day,legacyRows:rows,...opts});
test('traceable 28/30 vocab progress survives without invented concepts',()=>{
 const ids=Array.from({length:28},(_,i)=>'latin-concept-'+i);
 const r=make([{taskId:'latin-vocab',day,verifiedCorrectSlots:28,verifiedCorrectConceptIds:ids}],{
  targetByTask:{'latin-vocab':30}});
 assert.equal(r.status,'ready-for-staging-import');
 assert.equal(r.legacyBaselines['latin-vocab'].count,28);
 assert.deepEqual(r.legacyBaselines['latin-vocab'].knownKeys,ids);
});
test('opaque French 28/30 is retained but visibly requires review',()=>{
 const r=make([{taskId:'french-vocab',day,verifiedCorrectSlots:28,verifiedCorrectIds:['old-q1']}]);
 assert.equal(r.legacyBaselines['french-vocab'].count,28);
 assert.equal(r.legacyBaselines['french-vocab'].knownKeys.length,0);
 assert.equal(r.reconciliation[0].unprovenIdentities,28);
 assert.equal(r.status,'requires-review');
});
test('old question IDs are not silently treated as vocabulary concepts',()=>{
 const r=make([{taskId:'latin-vocab',day,progress:3,verifiedCorrectQuestionIds:['q1','q2','q3']}]);
 assert.equal(r.legacyBaselines['latin-vocab'].knownKeys.length,0);
 assert.equal(r.status,'requires-review');
});
test('ordinary Mastery questions carry known historical identity',()=>{
 const r=make([{taskId:'y8-mastery-a',day,verifiedCorrectSlots:20,
  verifiedCorrectQuestionIds:Array.from({length:20},(_,i)=>'mastery-q'+i)}],{
   taskMap:{'y8-mastery-a':'mastery-a'}});
 assert.equal(r.status,'ready-for-staging-import');
 assert.equal(r.legacyBaselines['mastery-a'].count,20);
});
test('unmapped legacy tasks are ignored and explicitly reported',()=>{
 const r=make([{taskId:'old-recovery-only',day,progress:10}]);
 assert.equal(r.ignored[0].reason,'UNMAPPED_LEGACY_TASK');
 assert.deepEqual(r.legacyBaselines,{});
});
test('wrong day cannot be migrated into today',()=>{
 const r=make([{taskId:'latin-vocab',day:'2026-10-25',progress:30}]);
 assert.equal(r.status,'requires-review');assert.equal(r.legacyBaselines['latin-vocab'],undefined);
});
test('the highest conflicting credit count is preserved but disagreement reported',()=>{
 const r=make([{taskId:'latin-vocab',day,progress:0,verifiedCorrectSlots:28}]);
 assert.equal(r.legacyBaselines['latin-vocab'].count,28);
 assert.ok(r.issues.some(x=>x.code==='LEGACY_SCORE_FIELD_DISAGREEMENT'));
});
test('records from two devices with divergent counters cannot silently be treated as certain',()=>{
 const r=make([
 {taskId:'latin-vocab',day,progress:27},
 {taskId:'latin-vocab',day,progress:28}]);
 assert.equal(r.legacyBaselines['latin-vocab'].count,28);
 assert.ok(r.issues.some(x=>x.code==='DIVERGENT_LEGACY_COUNTERS'));
});
test('historical completion exceeding new target cannot silently be clamped',()=>{
 const r=make([{taskId:'mastery-a',day,progress:25}],{targetByTask:{'mastery-a':20}});
 assert.equal(r.legacyBaselines['mastery-a'],undefined);
 assert.ok(r.issues.some(x=>x.code==='COUNT_EXCEEDS_OR_INVALID_NEW_TARGET'));
});
test('more known identities than credit count is a migration blocker',()=>{
 const r=make([{taskId:'latin-vocab',day,progress:1,
 verifiedCorrectConceptIds:['one','two']}]);
 assert.equal(r.legacyBaselines['latin-vocab'],undefined);
 assert.ok(r.issues.some(x=>x.code==='MORE_KNOWN_IDENTITIES_THAN_CREDITS'));
});
test('review code does not mutate raw imported rows',()=>{
 const source=[{taskId:'latin-vocab',day,verifiedCorrectSlots:2,
 verifiedCorrectConceptIds:['word-a','word-b']}];
 const before=JSON.stringify(source);make(source);
 assert.equal(JSON.stringify(source),before);
});
test('production migration is never silently authorized',()=>{
 const r=make([{taskId:'latin-vocab',day,progress:0}]);
 assert.equal(r.productionMigrationAuthorized,false);assert.equal(r.readOnly,true);
});

test('verified old vocabulary assignment universe is preserved for safe disjoint post-legacy credit',()=>{
 const possible=Array.from({length:30},(_,i)=>'vocab-original-'+i);
 const r=make([{taskId:'french-vocab',day,verifiedCorrectSlots:28,
  assignedVocabularyConceptIds:possible,
  assignmentEvidenceVerified:true,assignmentEvidenceSource:'read-only-old-french-manifest'}]);
 assert.equal(r.status,'requires-review');
 assert.equal(r.legacyBaselines['french-vocab'].potentialKeysVerified,true);
 assert.equal(r.legacyBaselines['french-vocab'].potentialLegacyKeys.length,30);
 assert.equal(r.reconciliation[0].safePostLegacyCreditPossible,true);
});
test('old question IDs do not count as a verified vocabulary assignment universe',()=>{
 const r=make([{taskId:'french-vocab',day,verifiedCorrectSlots:28,
  assignedQuestionIds:Array.from({length:30},(_,i)=>'legacy-q-'+i),
  assignmentEvidenceVerified:true,assignmentEvidenceSource:'wrong-kind'}]);
 assert.equal(r.legacyBaselines['french-vocab'].potentialKeysVerified,false);
 assert.equal(r.reconciliation[0].safePostLegacyCreditPossible,false);
 assert.ok(r.issues.some(x=>x.code==='INCOMPLETE_VERIFIED_ASSIGNMENT_UNIVERSE'));
});
test('unverified roster metadata cannot prove disjoint historical credits',()=>{
 const possible=Array.from({length:30},(_,i)=>'vocab-original-'+i);
 const r=make([{taskId:'french-vocab',day,progress:28,
  assignedVocabularyConceptIds:possible,assignmentEvidenceVerified:false,
  assignmentEvidenceSource:'untrusted'}]);
 assert.equal(r.legacyBaselines['french-vocab'].potentialKeysVerified,false);
});
test('conflicting merged device rosters do not produce falsely verified assignment universe',()=>{
 const possible=Array.from({length:30},(_,i)=>'word-'+i);
 const r=make([
 {taskId:'french-vocab',day,progress:28,assignedVocabularyConceptIds:possible,
   assignmentEvidenceVerified:true,assignmentEvidenceSource:'device-A'},
 {taskId:'french-vocab',day,progress:28,assignedVocabularyConceptIds:possible,
   assignmentEvidenceVerified:true,assignmentEvidenceSource:'device-B'}
 ]);
 assert.equal(r.legacyBaselines['french-vocab'].potentialKeysVerified,false);
});

test('historical import rejects impossible Gregorian calendar dates, not only malformed strings',()=>{
 for(const invalid of ['2026-02-30','2026-04-31','2025-02-29']){
  assert.throws(()=>reviewLegacyDailyV2Import({day:invalid,legacyRows:[]}),/invalid date/);
 }
 const leap=reviewLegacyDailyV2Import({day:'2024-02-29',legacyRows:[]});
 assert.equal(leap.day,'2024-02-29');
});
