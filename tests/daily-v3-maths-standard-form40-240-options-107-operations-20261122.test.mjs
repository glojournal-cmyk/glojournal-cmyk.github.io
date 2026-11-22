import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=n=>JSON.parse(readFileSync(new URL('../qa-staging/math-v311-'+n+'-20261122.json',import.meta.url),'utf8'));
const orig=load('batch40-standard-form-source-qa'),ind=load('standard-form40-independent-calculation');
const ledger=load('standard-form-240-source-options-qa-ledger');
const checked=load('standard-form40-source-240-option-numeric-review');
const derived=load('standard-form40-original-200-distractor-operation-candidates');
const near=(a,b,label='')=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b)),label+': '+a+' vs '+b);
const parse=raw=>{
 const x=raw.replace(/\u2212/g,'-').trim();
 let m=x.match(/^([A-F])\.[ \t]*(-?(?:\d+(?:\.\d+)?|\.\d+))[ \t]*×[ \t]*10(-?\d+)[ \t]*$/);
 if(m)return {letter:m[1],num:Number(m[2])*10**Number(m[3]),kind:'STANDARD_FORM_ONE_LINE'};
 m=x.match(/^([A-F])\.[ \t]*(-?(?:\d+(?:\.\d+)?|\.\d+))[ \t]*$/);
 if(m)return {letter:m[1],num:Number(m[2]),kind:'PLAIN_ONE_LINE_NUMBER'};
 return {letter:null,num:null,kind:'ORIGINAL_PDF_FRACTION_OR_LAYOUT_UNRESOLVED'};
};
test('All forty source Standard Form questions retain exact six source choices; strict reader checks 232 numeric snippets and quarantines eight fractions',()=>{
 assert.equal(orig.sourceQuestionRows.length,40);
 assert.equal(ledger.choices.length,240);
 assert.equal(ind.questions.length,40);
 assert.equal(checked.sourceChoices.length,240);
 assert.deepEqual([checked.summary.oneLineSourceScientificNotation,checked.summary.oneLineSourcePlainNumber,
  checked.summary.originalSourceUnresolvedFractionOrLayout,checked.summary.correctKeyNumericallyMatches,
  checked.summary.wrongChoiceNumericallyDifferent,checked.summary.wrongChoiceRequiresOriginalPDFVisual],
  [216,16,8,40,192,8]);
 let sc=0,plain=0,unres=0,keys=0,wrong=0;
 for(let i=0;i<240;i++){
   const source=ledger.choices[i],row=checked.sourceChoices[i],val=parse(source.sourceOptionTextFromPdf);
   const q=orig.sourceQuestionRows[source.originalQ-41];
   assert.equal(q.id,source.originalSourceId);
   assert.equal(source.sourceOptionLetter,row.letter);
   assert.equal(source.sourceKey,row.isSourceCorrect);
   assert.equal(val.kind,row.strictLexicalNumeric.kind);
   if(val.num===null){unres++;assert.equal(row.strictLexicalNumeric.value,null);}
   else {near(val.num,row.strictLexicalNumeric.value,q.id+' '+row.letter);
     if(val.kind==='STANDARD_FORM_ONE_LINE')sc++;else plain++;
     const solution=ind.questions[source.originalQ-41].independentCalculatedNumeric;
     if(source.sourceKey){keys++;near(val.num,solution,q.id+' key')}
     else {wrong++;assert.ok(Math.abs(val.num-solution)>1e-10*Math.max(1,Math.abs(val.num),Math.abs(solution)),
        'wrong option duplicates source correct result');}
   }
   for(const field of ['independentlyRealisticMisconceptionSigned','visuallyExactOriginalPDFMathCertified',
    'independentGCSEGrade7PlusCertified','exactTGSClassTaughtConfirmed','eligibleForStudentCredit'])
      assert.equal(row[field],false);
 }
 assert.deepEqual({sc,plain,unres,keys,wrong},{sc:216,plain:16,unres:8,keys:40,wrong:192});
});
test('Eight source fractions cannot become fake integer alternatives by deleting newlines',()=>{
 const expected={61:['B','C','D','E'],63:['E','F'],64:['E','F']};
 const amb=checked.sourceChoices.filter(x=>x.strictLexicalNumeric.value===null);
 assert.equal(amb.length,8);
 for(const [q,letters] of Object.entries(expected)){
  const rows=amb.filter(x=>x.printedNumber===+q);
  assert.deepEqual(rows.map(x=>x.letter),letters);
  assert.ok(rows.every(x=>x.originalSourceTextSnippet.includes('\n')));
  assert.ok(rows.every(x=>parse(x.originalSourceTextSnippet).num===null));
 }
});
test('40-question 200-distractor ledger has 107 computed wrong-operation matches, 85 unresolved semantics and 8 unsafe layout; zero approvals',()=>{
 assert.equal(derived.allSourceOptions.length,240);
 const count={};
 for(let i=0;i<240;i++){
  const x=derived.allSourceOptions[i],s=checked.sourceChoices[i];
  assert.equal(x.paperQ,s.printedNumber);
  assert.equal(x.originalOption,s.letter);
  assert.equal(x.parsedNumeric,s.strictLexicalNumeric.value);
  count[x.classification]=(count[x.classification]||0)+1;
  assert.equal(x.independentTeacherPedagogySigned,false);
  assert.equal(x.externalG7PlusGradeBenchmarked,false);
  assert.equal(x.studentCreditAllowed,false);
  if(x.classification==='WRONG_VALUE_REPRODUCIBLE_FROM_SPECIFIC_ALGEBRA_OPERATION'){
    assert.equal(x.isCorrect,false);
    assert.ok(x.sourceSpecificMathematicallyReproducibleOperations.length>0);
    for(const rule of x.sourceSpecificMathematicallyReproducibleOperations){
      near(rule.wrongValue,x.parsedNumeric,x.originalSourceId+' '+x.originalOption);
      assert.ok(rule.wrongOperation.length>55);
    }
  }else assert.deepEqual(x.sourceSpecificMathematicallyReproducibleOperations,[]);
 }
 assert.deepEqual(count,{
   ORIGINAL_CORRECT_KEY:40,
   WRONG_VALUE_REPRODUCIBLE_FROM_SPECIFIC_ALGEBRA_OPERATION:107,
   WRONG_NUMERIC_VALUE_BUT_NO_REPRODUCED_MECHANISM:85,
   SOURCE_MATH_LAYOUT_UNRESOLVED:8
 });
 assert.equal(derived.counts.questionsWithAtLeastOneReproducedWrongOperation,37);
});
test('Independent arithmetic anchors for all ten Standard Form original template families',()=>{
 const get=(q,l)=>derived.allSourceOptions.find(x=>x.paperQ===q&&x.originalOption===l);
 const anchors=[
  [41,'A',(2e12*3e-9)/(2e-1),'MISREAD_VOLUME_BASE10_EXPONENT_MINUS_2'],
  [45,'B',2*(4e6+2e5)/3e3,'COUNT_INPUT_2_TIMES'],
  [49,'F',(6e5+3e4)/2,'SUBTRACTION_REPLACED_BY_ADDITION'],
  [53,'C',(6e8-3e7)*2e6,'MULTIPLY_INSTEAD_OF_DIVIDE'],
  [57,'F',(2e11*3e-7)/1.5e2,'IGNORE_REMOVED_25_PERCENT'],
  [62,'D',-((.9*7-5)/5)*100,'REVERSE_NEW_MINUS_OLD'],
  [65,'D',(2.5e-3)*1e5*4e3,'CM3_M3_CONVERSION_POWER_SHIFT_-1'],
  [69,'D',-((8e8+4e7-2e7)/2e6),'NEGATE_COMBINED_TOTAL'],
  [73,'D',(6e9+2e8)*.9/1e5,'WRONG_PACKET_COUNT_SCALE_2'],
  [77,'D',(4.9e8-1e7)/.8/4e4,'WRONG_PACKET_COUNT_SCALE_2']
 ];
 for(const [q,l,value,rule] of anchors){
   const x=get(q,l);assert.ok(x,q+' '+l);
   assert.equal(x.classification,'WRONG_VALUE_REPRODUCIBLE_FROM_SPECIFIC_ALGEBRA_OPERATION');
   near(x.parsedNumeric,value,q+' '+l);
   assert.ok(x.sourceSpecificMathematicallyReproducibleOperations.some(a=>a.rule===rule));
 }
});
test('Existing 11 QA-only candidate repairs and Spring scope still quarantined',()=>{
 const d=load('standard-form-density-7-repairs');
 const t=load('standard-form-033-036-distinct-replacements');
 assert.equal(d.patches.length,7);
 assert.equal(t.patches.length,4);
 assert.equal(d.canonicalBankModified,false);
 assert.equal(d.studentCredit,false);
 assert.equal(d.independentTeacherTaughtConfirmed,false);
 assert.equal(t.applyToCanonicalBank,false);
 assert.equal(t.mathDailyEnabled,false);
 assert.equal(t.independentGradeCalibrated,false);
 assert.equal(t.independentDistractorApproved,false);
 assert.equal(t.patches.find(x=>x.questionId.endsWith('035')).curriculumSafety.officialTermScope,'SPRING_REVERSE_PERCENTAGE');
 assert.equal(t.patches.find(x=>x.questionId.endsWith('036')).curriculumSafety.officialTermScope,'SPRING_COMPOUND_PERCENTAGE_CHANGE');
 for(const q of ind.questions.filter(x=>x.question>=73&&x.question<=76))near(q.independentCalculatedNumeric,111600);
});
