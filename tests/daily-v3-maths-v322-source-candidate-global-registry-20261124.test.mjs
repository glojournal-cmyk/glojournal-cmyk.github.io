import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const readRaw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(readRaw(p));
const gitBlobHash=text=>createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex');
const registry=read('qa-staging/math-v322-all-versioned-candidate-packs-200-source-dedup-and-credit-deny-20261124.json');
const source=read('qa-staging/math-v311-reviewed-200.json');
const sources=new Map(source.questions.map(q=>[q.sourceId,q]));
const packContents=new Map(registry.packs.map(p=>[p.path,read(p.path)]));
const packByPath=new Map(registry.packs.map(p=>[p.path,p]));

test('the entire canonical 200 and all 17 versioned Maths candidate packs are source-blob pinned and release-denied',()=>{
 assert.equal(registry.kind,'V322_ALL_MATHS_CANDIDATE_SOURCE_VERSION_REGISTRY_NO_IMPORT');
 assert.equal(registry.canonicalUntouched,true);
 assert.equal(registry.canonicalBankPath,'qa-staging/math-v311-reviewed-200.json');
 assert.equal(gitBlobHash(readRaw(registry.canonicalBankPath)),registry.canonicalBlobSha);
 assert.equal(source.questions.length,200);
 assert.equal(sources.size,200);
 assert.ok(source.questions.every(q=>q.dailyEligible===false));
 assert.equal(registry.counts.canonicalQuestions,200);
 assert.equal(registry.counts.questionBearingQAStagingPacks,17);
 assert.equal(registry.counts.stagedQAQuestionVersions,112);
 assert.equal(registry.counts.distinctCanonicalSourceIDsRepresented,87);
 assert.equal(registry.counts.sourceIDsWithMultipleDraftRecords,20);
 assert.equal(registry.counts.sourceIDsWithBothReasoningAndEditorial,12);
 assert.equal(registry.counts.reasoningCandidateVersions,58);
 assert.equal(registry.counts.editorialOriginalWordingVersions,54);
 assert.equal(registry.counts.sourceIDsWithReasoningCandidates,45);
 assert.equal(registry.counts.sourceIDsWithEditorialOnly,42);
 assert.equal(registry.counts.ambiguousLatestReasoningSelection,0);
 assert.equal(registry.counts.formalAcademicApprovals,0);
 assert.equal(registry.counts.studentDailyEligible,0);
 assert.equal(registry.counts.studentMasteryEligible,0);
 assert.equal(registry.releaseDecision,'BLOCKED_0_200_NO_AUTOMATIC_MERGE_NO_STUDENT_CREDIT');
 let count=0;
 for(const info of registry.packs){
  assert.ok(/qa-staging\/math-v3/.test(info.path));
  const stored=packContents.get(info.path);
  assert.equal(stored.kind,info.kind);
  assert.equal(gitBlobHash(readRaw(info.path)),info.sha,'Blob moved for '+info.path);
  assert.equal(stored.questions.length,info.questionCount);
  assert.deepEqual(stored.questions.map(q=>q.sourceId),info.sourceIds);
  count+=info.questionCount;
  assert.ok(['REASONING_OR_TOPIC_REDESIGN','EDITORIAL_ORIGINAL_OPTION_WORDING_ONLY'].includes(info.category));
 }
 assert.equal(count,112);
});

test('all 112 actual candidate records are true source-linked six-choice questions, never marked Academic approved or score-credit eligible',()=>{
 const seenVersions=new Set();let counter=0,editorial=0,reasoning=0;
 for(const pack of registry.packs){
  const j=packContents.get(pack.path);
  for(const q of j.questions){
   const original=sources.get(q.sourceId);
   assert.ok(original,'Source ID missing '+q.sourceId);
   assert.equal(q.topicId,original.topicId);
   assert.ok(q.revisionId);
   assert.ok(!seenVersions.has(q.revisionId),'Candidate revision duplicated '+q.revisionId);
   seenVersions.add(q.revisionId);
   assert.equal(q.academicQA,'pending');
   assert.equal(q.dailyEligible,false);
   assert.equal(q.masteryEligible,false);
   assert.equal(q.options.length,6);
   assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
   assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
   assert.equal(q.options.find(o=>o.id===q.correctOptionId)?.latex,q.correctAnswerLatex);
   assert.ok(q.options.filter(o=>o.id!==q.correctOptionId&&o.errorPath?.length>0).length===5);
   if(pack.category==='EDITORIAL_ORIGINAL_OPTION_WORDING_ONLY'){
    editorial++;
    assert.equal(q.stem,original.stem,'Editorial candidate accidentally changed the original stem');
    assert.equal(q.correctOptionId,original.correctOptionId,'Editorial candidate silently changed key');
    assert.equal(q.correctAnswerLatex,original.correctAnswerLatex);
    assert.deepEqual(q.options.map(o=>o.latex),original.options.map(o=>o.latex));
   } else {
    reasoning++;
    assert.notEqual(q.stem,original.stem,'Reasoning replacement identical to original');
   }
   counter++;
  }
 }
 assert.equal(counter,112);
 assert.equal(seenVersions.size,112);
 assert.equal(editorial,54);
 assert.equal(reasoning,58);
});

test('87 canonical IDs are deduplicated with 20 source-specific history collisions and no unsafe editorial-to-redesign patch transfer',()=>{
 assert.equal(registry.rows.length,87);
 const seen=new Set();let multi=0,shared=0,withReasoning=0,editorialOnly=0;
 const counts={};
 for(const row of registry.rows){
  const orig=sources.get(row.sourceId);
  assert.ok(orig&&!seen.has(row.sourceId));
  seen.add(row.sourceId);
  assert.equal(row.originalRevisionId,orig.revisionId);
  assert.equal(row.topicId,orig.topicId);
  assert.equal(row.canonicalCorrectOptionId,orig.correctOptionId);
  assert.equal(row.academicDecision,'HOLD');
  assert.equal(row.independentGrade7PlusCertified,false);
  assert.equal(row.latestVersionIsNotFormalApproval,true);
  assert.equal(row.dailyEligible,false);
  assert.equal(row.masteryEligible,false);
  assert.equal(row.importAllowed,false);
  assert.equal(row.totalVersionedQARecords,row.versionedCandidates.length);
  if(row.totalVersionedQARecords>1)multi++;
  if(row.editorialMustNotBeMergedIntoReasoningWithoutNewSourceSpecificQA)shared++;
  if(row.reasoningDrafts>0)withReasoning++;else editorialOnly++;
  const keys=new Set();
  let e=0,c=0;
  for(const item of row.versionedCandidates){
   const p=packByPath.get(item.packPath),data=packContents.get(item.packPath);
   const actual=data.questions.find(q=>q.revisionId===item.revisionId&&q.sourceId===row.sourceId);
   assert.ok(actual&&!keys.has(item.revisionId));
   keys.add(item.revisionId);
   assert.equal(item.packBlobSha,p.sha);
   assert.equal(item.correctOptionId,actual.correctOptionId);
   assert.equal(item.correctAnswerLatex,actual.correctAnswerLatex);
   assert.equal(item.sourceStemUnchanged,actual.stem===orig.stem);
   assert.equal(item.academicQA,'pending');
   assert.equal(item.dailyEligible,false);
   assert.equal(item.masteryEligible,false);
   if(item.category==='EDITORIAL_ORIGINAL_OPTION_WORDING_ONLY'){
    e++;assert.equal(item.disposition,'ORIGINAL_STEM_EDIT_ONLY_NO_AUTOMATIC_TRANSFER');
   }else {
    c++;assert.ok(['LATEST_REVIEW_ONLY_NOT_IMPORTABLE','OLDER_OR_ALTERNATE_DRAFT_NOT_IMPORTABLE'].includes(item.disposition));
   }
  }
  assert.equal(e,row.originalWordingEditorialDrafts);
  assert.equal(c,row.reasoningDrafts);
  if(c){
   const newest=Math.max(...row.versionedCandidates.filter(v=>v.category==='REASONING_OR_TOPIC_REDESIGN').map(v=>Number(v.packPath.match(/math-v(\d+)/)[1])));
   const latest=row.versionedCandidates.filter(v=>v.disposition==='LATEST_REVIEW_ONLY_NOT_IMPORTABLE');
   assert.equal(latest.length,1);
   assert.equal(Number(latest[0].packPath.match(/math-v(\d+)/)[1]),newest);
   assert.equal(latest[0].revisionId,row.latestReasoningReviewCandidate);
   assert.equal(latest[0].packPath,row.latestReasoningPack);
  }else {
   assert.equal(row.latestReasoningReviewCandidate,null);
  }
  if(e&&c)assert.equal(row.editorialMustNotBeMergedIntoReasoningWithoutNewSourceSpecificQA,true);
  counts[row.topicId]=(counts[row.topicId]||0)+1;
 }
 assert.equal(seen.size,87);
 assert.equal(multi,20);
 assert.equal(shared,12);
 assert.equal(withReasoning,45);
 assert.equal(editorialOnly,42);
 assert.ok(Object.keys(counts).length>=4);
});

test('V320 N9 final-answer discrimination is mathematically necessary; V321 review lineage cannot be mistaken for learner approval',()=>{
 const v320=packContents.get('qa-staging/math-v320-two-standard-form-n9-final-output-rebalanced-candidates-20261123.json');
 const versioned=read('qa-staging/math-v321-v315-v318-v320-three-question-candidate-supersession-manifest-20261123.json');
 const provenance=versioned.packProvenance.find(x=>x.path==='qa-staging/math-v320-two-standard-form-n9-final-output-rebalanced-candidates-20261123.json');
 assert.equal(provenance.sha,gitBlobHash(readRaw(provenance.path)));
 assert.equal(versioned.counts.academicApprovals,0);
 assert.equal(versioned.counts.latestCandidateRevisions,3);
 assert.equal(versioned.counts.supersededCandidateRevisions,5);
 const q009=v320.questions.find(q=>q.sourceId.endsWith('STANDARD_FORM-009'));
 const q025=v320.questions.find(q=>q.sourceId.endsWith('STANDARD_FORM-025'));
 assert.ok(q009&&q025);
 const group009=q009.options.filter(o=>o.latex.startsWith('(3,2,250,'));
 const group025=q025.options.filter(o=>o.latex.startsWith('(2,3,'));
 assert.deepEqual(group009.map(x=>x.id),['C','D']);
 assert.deepEqual(group025.map(x=>x.id),['C','F']);
 assert.equal(group009.filter(x=>x.id===q009.correctOptionId).length,1);
 assert.equal(group025.filter(x=>x.id===q025.correctOptionId).length,1);
 assert.equal(group009[0].latex,'(3,2,250,6\\times10^3)');
 assert.equal(group009[1].latex,'(3,2,250,9\\times10^4)');
 assert.equal(group025[0].latex,'(2,3,1.2\\times10^7)');
 assert.equal(group025[1].latex,'(2,3,1.2\\times10^6)');
 assert.match(group025[1].errorPath,/ten times too small/);
 assert.equal(q009.dailyEligible,false);
 assert.equal(q025.dailyEligible,false);
});

test('adversarial credit, duplicate revision and normalized choice mutation have release-failing evidence checks',()=>{
 const cases=registry.rows.map(x=>({sourceId:x.sourceId,importAllowed:x.importAllowed}));
 assert.equal(cases.some(x=>x.importAllowed),false);
 cases[0].importAllowed=true;
 assert.equal(cases.some(x=>x.importAllowed),true);
 const q=JSON.parse(JSON.stringify(packContents.get('qa-staging/math-v320-two-standard-form-n9-final-output-rebalanced-candidates-20261123.json').questions[1]));
 const expected=q.options.find(o=>o.id==='C').latex;
 q.options.find(o=>o.id==='C').latex='(2,3,1.2\\times10^6)';
 assert.notEqual(q.options.find(o=>o.id==='C').latex,expected);
 assert.equal(new Set(q.options.map(o=>o.latex)).size,5,'A mutated N9 key should collide with original wrong option F');
});