import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>JSON.parse(readFileSync(new URL('../qa-staging/math-v311-'+p+'-20261122.json',import.meta.url),'utf8'));
const layout=load('original-1200-option-layout-safety');
const indices=load('indices40-all200-wrong-options-math-triage');
const topics=['indices','standard-form','changing-subject','straight-line-graphs','simultaneous-equations'];
const oneLineInteger=s=>/^([A-F])\.[ \t]*([−-]?(?:\d+(?:\.\d+)?))[ \t]*$/.test(s.replace(/\r/g,''))&&
 Number.isInteger(Number(s.match(/([−-]?\d+(?:\.\d+)?)[ \t]*$/)?.[1]?.replace('−','-')));
test('full original 1200-option PDF layout screening flags 723 not reliably parseable instead of silently treating stacked fractions as integers',()=>{
 assert.equal(layout.safetyRows.length,1200);
 assert.equal(layout.counts.safeSingleLineInteger,477);
 assert.equal(layout.counts.formattedOrMultiline,723);
 assert.equal(layout.counts.allIndependentPedagogyApproved,0);
 assert.equal(layout.studentCreditAllowed,false);
 const source=new Map();
 for(const topic of topics){
   const pack=load(topic+'-240-source-options-qa-ledger');
   assert.equal(pack.choices.length,240);
   for(const choice of pack.choices)
     source.set(choice.originalSourceId+'-'+choice.sourceOptionLetter,choice);
 }
 assert.equal(source.size,1200);
 const summary={};
 for(const row of layout.safetyRows){
  const key=row.sourceId+'-'+row.letter;
  const sourceOption=source.get(key);
  assert.ok(sourceOption,key);
  assert.equal(row.originalRawOptionSnippet,sourceOption.sourceOptionTextFromPdf);
  const safe=oneLineInteger(sourceOption.sourceOptionTextFromPdf);
  assert.equal(row.layoutSafetyStatus,safe?'SINGLE_LINE_INTEGER_VALUE_READABLE':'FORMATTED_OR_MULTILINE_SOURCE_MATH_VISUAL_REVIEW',key);
  assert.equal(row.provisionalSafeIntegerOnly,safe?Number(sourceOption.sourceOptionTextFromPdf.match(/([−-]?\d+(?:\.\d+)?)[ \t]*$/)[1].replace('−','-')):null,key);
  for(const field of ['visuallyConfirmed','fullSymbolicParseCertified','diagnosticWrongOperationDerived','independentQAApproved','creditAllowed'])
    assert.equal(row[field],false,key+' '+field);
  summary[row.topic]=(summary[row.topic]||0)+(safe?0:1);
 }
 assert.deepEqual(summary,{indices:98,'standard-form':224,'changing-subject':240,'straight-line-graphs':113,'simultaneous-equations':48});
});
test('ambiguous indices PDFs cannot silently promote apparent integer to verified value',()=>{
 for(const [n,letter] of [[5,'A'],[5,'B'],[6,'D'],[7,'E'],[8,'E'],[9,'A'],[17,'A'],[33,'C']]){
  const row=layout.safetyRows.find(x=>x.topic==='indices'&&x.question===n&&x.letter===letter);
  assert.ok(row,'source option '+n+letter);
  assert.equal(row.layoutSafetyStatus,'FORMATTED_OR_MULTILINE_SOURCE_MATH_VISUAL_REVIEW');
  assert.equal(row.provisionalSafeIntegerOnly,null);
 }
});
test('Indices 40/40 source answers preserve 200 original wrong choices with four *proven* mathematical error models only',()=>{
 assert.equal(indices.sourceQuestionRows.length,40);
 assert.equal(indices.summary.totalOriginalChoices,240);
 assert.equal(indices.summary.totalOriginalWrongChoices,200);
 assert.equal(indices.summary.wrongChoicesWithMechanisticMathematicalErrorDerivation,4);
 assert.equal(indices.summary.wrongChoicesReadableIntegerNumericallyDifferentFromCorrect,112);
 assert.equal(indices.summary.wrongChoicesRequireOriginalPDFMathLayout,84);
 assert.equal(indices.summary.allQuestionTaughtGradePedagogyApproved,0);
 let nWrong=0,nMath=0;
 const sourceIndex=load('indices40-independent-calculation').questions;
 for(const row of indices.sourceQuestionRows){
  assert.equal(row.originalAtoF.length,6);
  assert.deepEqual(row.originalAtoF.map(q=>q.originalOption),['A','B','C','D','E','F']);
  assert.equal(row.originalAtoF.filter(q=>q.sourcePrintedKey).length,1);
  assert.equal(row.independentAQA7PlusSignoff,false);
  assert.equal(row.exactTGSAlreadyTaught,false);
  assert.equal(row.independentDistractorPedagogySigned,false);
  assert.equal(row.dailyMathsCreditAllowed,false);
  assert.equal(row.mathematicallyIndependentlySolvedCorrectValue,sourceIndex[row.originalQ-1].independentlyCalculatedValue);
  for(const opt of row.originalAtoF){
   if(!opt.sourcePrintedKey)nWrong++;
   assert.equal(opt.creditEligible,false);
   assert.equal(opt.independentGrade7PlusBenchmarked,false);
   assert.equal(opt.independentlyPlausibleMisconceptionSigned,false);
   assert.equal(opt.visualOriginalFractionAndGlyphsChecked,false);
   if(opt.mathematicalWrongPathReviewed){
    nMath++;
    const a=row.originalQ-3,b=row.originalQ-4,c=row.originalQ-3;
    const expected=2**(2*(2*a+3*b)+c);
    assert.equal(opt.reconstructedWrongMath.wrongValue,expected);
    assert.equal(opt.reconstructedWrongMath.wrongExponent,2*(2*a+3*b)+c);
    assert.ok(opt.originalSnippet.includes(String(expected)));
   }else assert.equal(opt.reconstructedWrongMath,undefined);
   if(opt.classification==='NUMERICALLY_WRONG_BUT_MISCONCEPTION_ROUTE_NOT_ESTABLISHED'){
    assert.equal(opt.sourcePrintedKey,false);
    const safe=opt.recoveredOneLineInteger;
    const correctText=row.mathematicallyIndependentlySolvedCorrectValue;
    const correct=correctText.includes('/')?Number(correctText.split('/')[0])/Number(correctText.split('/')[1]):Number(correctText);
    assert.ok(Number.isInteger(safe));
    assert.notEqual(safe,correct);
   }
  }
 }
 assert.equal(nWrong,200);
 assert.equal(nMath,4);
});
