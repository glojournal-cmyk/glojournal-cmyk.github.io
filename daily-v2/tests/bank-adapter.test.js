import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adaptCertifiedDailyV2Bank,certifiedTaughtTopicIds,fingerprintDailyV2Source} from '../src/bank-adapter.js';
import {planDailyV2} from '../src/planner.js';

const q=(id='q1',opts={})=>({
 id,topicId:'la-y8-set-text-translation',status:'enabled',
 format:'controlled_translation',difficulty:4,
 prompt:'TRANSLATE — Translate this set-text sentence into natural English.',
 stimulus:{text:'nos urbem petivimus, quod valde timebamus.',direction:'Latin → English'},
 answer:{mode:'semantic_groups',accepted:['We headed for the city because we were very afraid.']},...opts
});
const topic=(questions=[q()],opts={})=>({
 subject:'latin',year:8,topicId:'la-y8-set-text-translation',status:'enabled',questions,...opts
});
const cert=(roles,opts={})=>({
 reviewed:true,reviewer:'curriculum-reviewer',reviewedAt:'2026-10-26',roles,sourceFingerprint:fingerprintDailyV2Source(topic(),q()),...opts
});
test('uncertified real questions are skipped, not guessed from difficulty=4',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic()]});
 assert.equal(r.summary.scanned,1);assert.equal(r.summary.certified,0);
 assert.deepEqual(r.uncertified,['q1']);
});
test('certified Latin passage becomes correct Daily Standard format',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic()],certifications:{q1:cert(['latin-standard'],{skill:'passage'})}});
 assert.equal(r.summary.certified,1);
 assert.equal(r.questionBank[0].skill,'passage');
 assert.equal(r.questionBank[0].stimulus.text,'nos urbem petivimus, quod valde timebamus.');
});
test('actual identical translation instructions with different Latin stimulus are not duplicated',()=>{
 const two=q('q2',{stimulus:{text:'ego, postquam urbem intravi, clamorem ingentem audivi.',direction:'Latin → English'}});
 const c={q1:cert(['latin-standard'],{skill:'translation'}),q2:cert(['latin-standard'],{skill:'translation',sourceFingerprint:fingerprintDailyV2Source(topic([two]),two)})};
 const r=adaptCertifiedDailyV2Bank({topics:[topic([q(),two])],certifications:c});
 assert.equal(r.questionBank.length,2);
 // Planner cannot certify a complete day here, but it should accept two distinct question identities.
 assert.notEqual(r.questionBank[0].stimulus.text,r.questionBank[1].stimulus.text);
});
test('Mastery cannot be approved merely because source difficulty is 4',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic()],certifications:{q1:cert(['mastery'],{depthBand:'challenge'})}});
 assert.equal(r.questionBank.length,0);
 assert.ok(r.errors.some(x=>x.code==='MASTERY_RUBRIC_NOT_CERTIFIED'));
});
test('reviewer-certified Mastery must carry independently marked cognitive rubric',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic()],certifications:{q1:cert(['mastery'],{
  depthBand:'challenge',masteryRubric:{reviewed:true,cognitiveDemand:'translate full multi-clause sentence',independentResponse:'free response without options'}
 })}});
 assert.equal(r.questionBank.length,1);
 assert.equal(r.questionBank[0].depthBand,'challenge');
});
test('vocab headword concept must be explicitly certified, not assigned by format',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic()],certifications:{q1:cert(['latin-vocab'],{vocabConceptId:'puella'})}});
 assert.equal(r.questionBank.length,0);
 assert.ok(r.errors.some(x=>x.code==='VOCAB_LEXICAL_CERTIFICATION_MISSING'));
});
test('lexically certified vocab includes stable concept ID',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic()],certifications:{q1:cert(['latin-vocab'],{vocabConceptId:'latin-puella',lexicalUnitCertified:true})}});
 assert.equal(r.questionBank[0].conceptId,'latin-puella');
});
test('GCSE cannot be double-assigned to a Standard role',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic()],certifications:{q1:cert(['gcse','latin-standard'],{skill:'translation'})}});
 assert.ok(r.errors.some(x=>x.code==='GCSE_MUST_BE_EXCLUSIVE'));
});
test('GCSE must pass exact marks and original-authoring certification',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic()],certifications:{q1:cert(['gcse'],{
  gcseMarks:2,gcseMarkScheme:['point one'],gcseOriginalityChecked:true
 })}});
 assert.ok(r.errors.some(x=>x.code==='GCSE_MARK_SCHEME_NOT_CERTIFIED'));
});
test('reviewed GCSE carries marks and independent mark scheme',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic()],certifications:{q1:cert(['gcse'],{
  gcseMarks:2,gcseMarkScheme:['point one','point two'],gcseOriginalityChecked:true
 })}});
 assert.equal(r.questionBank.length,1);
 assert.deepEqual(r.questionBank[0].markScheme,['point one','point two']);
});
test('invalid subject-year metadata cannot be certified',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic([q()],{subject:'english',year:6})],certifications:{q1:cert(['mastery'],{depthBand:'challenge',masteryRubric:{reviewed:true,cognitiveDemand:'reason',independentResponse:'typing'}})}});
 assert.ok(r.errors.some(x=>x.code==='INVALID_TOPIC'));
});
test('duplicate IDs across topic bundles cannot be silently counted',()=>{
 const r=adaptCertifiedDailyV2Bank({topics:[topic(),topic()],certifications:{q1:cert(['latin-standard'],{skill:'passage'})}});
 assert.equal(r.questionBank.length,1);
 assert.ok(r.errors.some(x=>x.code==='DUPLICATE_OR_MISSING_ID'));
});
test('unverified Y9 taught status never unlocks a topic',()=>{
 const t=certifiedTaughtTopicIds([
  {topicId:'fr-y9-unit1',taught:true,verified:false,source:'school',confirmedAt:'2026-10-26'},
  {topicId:'la-y9-unit1',taught:true,verified:true,source:'school',confirmedAt:'2026-10-26'},
  {topicId:'bio-y9-cells',taught:false,verified:true,source:'school',confirmedAt:'2026-10-26'}]);
 assert.deepEqual(t,['la-y9-unit1']);
});
test('a real question carrying same generic prompt but changed stimulus is distinct in planner',()=>{
 const bank=[
  {id:'q1',subject:'latin',year:8,topicId:'lat',status:'enabled',roles:['retention-source'],prompt:'TRANSLATE',stimulus:{text:'sum'}},
  {id:'q2',subject:'latin',year:8,topicId:'lat',status:'enabled',roles:['retention-source'],prompt:'TRANSLATE',stimulus:{text:'eram'}}];
 const result=planDailyV2({day:'2026-10-26',questionBank:bank,priorAttempts:[
  {persisted:true,day:'2026-10-24',questionId:'q1'},
  {persisted:true,day:'2026-10-24',questionId:'q2'}]});
 const retentionError=result.diagnostics.find(x=>x.code==='INSUFFICIENT_PERSISTED_HISTORY');
 assert.equal(retentionError?.available,2);
});

test('editing an approved original answer invalidates the certification',()=>{
 const reviewed=cert(['latin-standard'],{skill:'translation'});
 const changed=q('q1',{answer:{mode:'semantic_groups',accepted:['Different meaning!']}});
 const result=adaptCertifiedDailyV2Bank({topics:[topic([changed])],certifications:{q1:reviewed}});
 assert.equal(result.questionBank.length,0);
 assert.ok(result.errors.some(e=>e.code==='STALE_OR_UNBOUND_CERTIFICATION'));
});
test('editing an approved stimulus invalidates the certification',()=>{
 const reviewed=cert(['latin-standard'],{skill:'translation'});
 const changed=q('q1',{stimulus:{text:'puer erat',direction:'Latin → English'}});
 const result=adaptCertifiedDailyV2Bank({topics:[topic([changed])],certifications:{q1:reviewed}});
 assert.equal(result.questionBank.length,0);
 assert.ok(result.errors.some(e=>e.code==='STALE_OR_UNBOUND_CERTIFICATION'));
});
test('a previously reviewed manifest without fingerprint is never trusted',()=>{
 const reviewed=cert(['latin-standard'],{skill:'translation',sourceFingerprint:undefined});
 const result=adaptCertifiedDailyV2Bank({topics:[topic()],certifications:{q1:reviewed}});
 assert.equal(result.questionBank.length,0);
 assert.ok(result.errors.some(e=>e.code==='STALE_OR_UNBOUND_CERTIFICATION'));
});

test('changing source GCSE mark points invalidates reviewer certificate even when answer unchanged',()=>{
 const original=q('q1',{markScheme:['identify first cause','explain second cause']});
 const sourceTopic=topic([original]);
 const certification={
  reviewed:true,reviewer:'curriculum-reviewer',reviewedAt:'2026-10-26',
  roles:['gcse'],gcseMarks:2,gcseOriginalityChecked:true,
  sourceFingerprint:fingerprintDailyV2Source(sourceTopic,original)
 };
 const first=adaptCertifiedDailyV2Bank({topics:[sourceTopic],certifications:{q1:certification}});
 assert.equal(first.summary.certified,1);
 const revised=q('q1',{markScheme:['identify first cause','different second mark point']});
 const result=adaptCertifiedDailyV2Bank({topics:[topic([revised])],certifications:{q1:certification}});
 assert.equal(result.summary.certified,0);
 assert.ok(result.errors.some(e=>e.code==='STALE_OR_UNBOUND_CERTIFICATION'));
});
test('changing any manually reviewed source GCSE marking rubric requires re-certification',()=>{
 const original=q('q1',{markScheme:['first']});
 const certFingerprint=fingerprintDailyV2Source(topic([original]),original);
 const changed=q('q1',{markScheme:['not the reviewed point']});
 assert.notEqual(fingerprintDailyV2Source(topic([changed]),changed),certFingerprint);
});

test('certification must not accept a question whose own topic ID points elsewhere',()=>{
 const wrong=q('q1',{topicId:'foreign-topic'});
 const found=topic([wrong]);
 const c={reviewed:true,reviewer:'independent-reviewer',reviewedAt:'2026-10-30',
  roles:['latin-standard'],skill:'translation',
  sourceFingerprint:fingerprintDailyV2Source(found,wrong)};
 const r=adaptCertifiedDailyV2Bank({topics:[found],certifications:{q1:c}});
 assert.equal(r.summary.certified,0);
 assert.ok(r.errors.some(e=>e.code==='QUESTION_TOPIC_MISMATCH'));
});
test('source question topic reassignment invalidates an older reviewed fingerprint',()=>{
 const original=q();
 const fingerprint=fingerprintDailyV2Source(topic(),original);
 const edited=q('q1',{topicId:'another-topic'});
 assert.notEqual(fingerprint,fingerprintDailyV2Source(topic([edited]),edited));
});
test('empty or non-text accepted answer cannot pass even with reviewer metadata',()=>{
 for(const accepted of [[],[''],['   '],[null],[0]]) {
  const edited=q('q1',{answer:{mode:'text',accepted}});
  const source=topic([edited]);
  const c={reviewed:true,reviewer:'reviewer',reviewedAt:'2026-10-30',
   roles:['latin-standard'],skill:'translation',
   sourceFingerprint:fingerprintDailyV2Source(source,edited)};
  const r=adaptCertifiedDailyV2Bank({topics:[source],certifications:{q1:c}});
  assert.equal(r.summary.certified,0,JSON.stringify(accepted));
  assert.ok(r.errors.some(x=>x.code==='NO_MARKING_ANSWER'));
 }
});
