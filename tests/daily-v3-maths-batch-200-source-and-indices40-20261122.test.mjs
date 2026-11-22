import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsOriginalGradeDemandDecision} from '../assets/math-study/math-v311-grade-demand-gate.js';
const load=(p)=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const slugs=['indices','standard-form','changing-subject','straight-line-graphs','simultaneous-equations'];
const packs=slugs.map(slug=>load('../qa-staging/math-v311-batch40-'+slug+'-source-qa-20261122.json'));
const triage=load('../qa-staging/math-v311-200-item-grade-demand-triage-20261122.json');
const ind=load('../qa-staging/math-v311-indices40-independent-calculation-20261122.json');
const rows=packs.flatMap(p=>p.sourceQuestionRows);
const formula=(number)=>{
 const q=number;
 if(q<=4)return String(q+1);
 if(q<=8)return String(2**(9-q));
 if(q<=12)return '1/'+String(2**(3*(q-8)+4));
 if(q<=16)return String(q-11);
 if(q<=20)return String(q-15);
 if(q<=24)return String(q-19);
 if(q<=28){const n=q-23;return String(n*n-2*n)}
 if(q<=32)return String(q-26);
 if(q<=36)return String(q-31);
 const n=q-35;return String(n*n-n);
};
test('five genuine 40-original-question packets reconstruct all 200 PDFs and source register IDs',()=>{
 assert.equal(packs.length,5);
 assert.equal(rows.length,200);
 assert.equal(new Set(rows.map(q=>q.id)).size,200);
 assert.deepEqual(rows.map(q=>q.sourceIndex),Array.from({length:200},(_,i)=>i+1));
 const templates=new Map();
 for(let p=0;p<packs.length;p++){
  const pack=packs[p];
  assert.equal(pack.sourceQuestionRows.length,40);
  assert.equal(pack.counts.questions,40);
  assert.equal(pack.counts.sourceFamilies,10);
  assert.equal(pack.counts.variantsPerFamily,4);
  assert.equal(pack.counts.allSixALetters,40);
  assert.equal(pack.counts.sourceAnswerOptionMatch,40);
  assert.equal(pack.counts.formalQAApproved,0);
  assert.equal(pack.counts.mathsDailyEligible,0);
  assert.equal(pack.studentCreditGuard.Daily,false);
  assert.equal(pack.studentCreditGuard.XP,false);
  assert.equal(pack.studentCreditGuard.MP,false);
  assert.equal(pack.studentCreditGuard.Mastery,false);
  assert.equal(pack.studentCreditGuard.Recovery,false);
  for(const q of pack.sourceQuestionRows){
   assert.equal(q.sourceIndex>p*40&&q.sourceIndex<=(p+1)*40,true);
   assert.equal(q.originalSixOptionOrder,'ABCDEF',q.id);
   assert.equal(q.originalRegisteredCorrectOption,q.originalPrintedCorrectOption,q.id);
   assert.equal(q.grade7PlusIndependentSignoff,false);
   assert.equal(q.independentDistractorFiveSignoff,false);
   assert.equal(q.exactSchoolAutumnTaughtSubskillSigned,false);
   assert.equal(q.eligibleForDaily,false);
   assert.deepEqual(q.extractionFlags,[],q.id);
   assert.match(q.extractedStudentQuestionText,new RegExp('^Q'+q.sourceIndex+'\\.\\s'));
   assert.match(q.extractedWorkedAnswerText,new RegExp('^Q'+q.sourceIndex+'\\.\\s'));
   assert.match(q.extractedWorkedAnswerText,/Correct answer:/);
   assert.equal(q.optionLineStartText.map(x=>x.letter).join(''),'ABCDEF');
   assert.ok(Number.isInteger(q.originalSourceStudentPdfPage));
   assert.ok(Number.isInteger(q.originalSourceAnswersPdfPage));
   const t=triage.rows[q.sourceIndex-1];
   assert.equal(q.id,t.id);
   assert.equal(q.triageAction,t.triageAction);
   assert.equal(q.originalProvisionalGrade,t.originalProvisionalGrade);
   assert.equal(q.templateId,t.sourceTemplateId);
   assert.equal(mathsOriginalGradeDemandDecision({id:q.id}).ok,false,q.id+' must stay off');
   templates.set(q.templateId,(templates.get(q.templateId)||0)+1);
  }
 }
 assert.equal(templates.size,50);
 for(const [family,count] of templates)assert.equal(count,4,'source family '+family);
 assert.equal(rows.filter(q=>q.triageAction==='UPGRADE_STEM_FOR_G7PLUS').length,79);
 assert.equal(rows.filter(q=>q.triageAction==='REWRITE_CONTEXT_OR_DUPLICATE').length,17);
 assert.equal(rows.filter(q=>q.triageAction==='QUARANTINE_TAUGHT_SCOPE').length,80);
 assert.equal(rows.filter(q=>q.triageAction==='RETAIN_FOR_EXTERNAL_BENCHMARK').length,24);
});
test('Independent arithmetic re-evaluation of every Indices Q1–40 answer value, not independent GCSE grade',()=>{
 assert.equal(ind.status,'SOURCE_40_OF_40_NUMERIC_KEY_CHECK_PASS_ONLY_GRADE_AND_DISTRACTORS_HOLD');
 assert.equal(ind.sourceQuestionCount,40);
 assert.equal(ind.independentAnswerValuesMatchOriginalWorkedKeys,40);
 assert.equal(ind.qaSignoff,0);
 assert.equal(ind.questions.length,40);
 const src=packs[0].sourceQuestionRows;
 for(let i=0;i<40;i++){
  const q=ind.questions[i];
  assert.equal(q.originalNumber,i+1);
  assert.equal(q.sourceId,src[i].id);
  assert.equal(q.originalPrintedCorrectOption,src[i].originalRegisteredCorrectOption);
  assert.equal(q.independentlyCalculatedValue,formula(i+1),q.sourceId);
  assert.equal(q.matchedOriginalWorkedAnswerNumeric,true);
  for(const prop of ['answerOptionValueFromTypesetPDFVisuallyVerified',
    'allFiveWrongOptionsPedagogicallyVerified','originalGrade7OrAboveConfirmed',
    'originalTgsExactSubskillConfirmed','eligibleForStudentCredit'])assert.equal(q[prop],false);
 }
});
test('Audit explicitly identifies 4 variants per each source family — not four independent Mastery concepts',()=>{
 for(const pack of packs){
  assert.equal(Object.keys(pack.familyToOriginalQuestionIds).length,10);
  for(const [family,ids] of Object.entries(pack.familyToOriginalQuestionIds)){
   assert.equal(ids.length,4);
   assert.equal(new Set(ids).size,4);
   assert.ok(pack.sourceQuestionRows.filter(q=>q.templateId===family).length===4);
  }
 }
});
