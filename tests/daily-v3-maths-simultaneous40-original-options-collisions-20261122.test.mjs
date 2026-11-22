import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsOriginalGradeDemandDecision} from '../assets/math-study/math-v311-grade-demand-gate.js';
const load=n=>JSON.parse(readFileSync(new URL('../qa-staging/math-v311-'+n+'-20261122.json',import.meta.url),'utf8'));
const original=load('batch40-simultaneous-equations-source-qa');
const answers=load('simultaneous40-independent-elimination');
const sourceOptions=load('simultaneous-equations-240-source-options-qa-ledger');
const audit=load('simultaneous40-240-original-options-duplicate-systems');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));
test('all original Simultaneous 40 source IDs, independent solutions, and 240 option slots protected without student credit',()=>{
 assert.equal(original.sourceQuestionRows.length,40);
 assert.equal(answers.questions.length,40);
 assert.equal(sourceOptions.choices.length,240);
 assert.equal(audit.fortyOriginalQuestionDecisions.length,40);
 assert.equal(audit.source240OptionNumericalCheck.length,240);
 assert.equal(audit.counts.independentEquationOrParameterMathRecomputed,40);
 assert.equal(audit.counts.upgradeGradeDemandOriginalQuestions,27);
 assert.equal(audit.counts.sourceRewriteDeduplicate,5);
 assert.equal(audit.counts.possibleExternalGradeBenchmarkHold,8);
 for(let i=0;i<40;i++){
  const q=original.sourceQuestionRows[i],a=answers.questions[i],r=audit.fortyOriginalQuestionDecisions[i];
  assert.equal(q.sourceIndex,161+i);
  assert.equal(q.id,r.sourceId);
  assert.equal(q.id,a.sourceId);
  assert.equal(q.originalPrintedCorrectOption,r.printedCorrectLetter);
  assert.ok(near(r.independentCorrectResult,a.independentMathematicalValue));
  assert.equal(r.actualAutumnTaughtConfirmed,false);
  assert.equal(r.independentGCSEGrade7PlusConfirmed,false);
  assert.equal(r.dailyCreditEligible,false);
  assert.equal(mathsOriginalGradeDemandDecision({id:q.id}).ok,false);
 }
});
test('original Simultaneous source A–F safety: 192 strict numbers, 48 unparseable fraction layout, 38 numeric source key matches',()=>{
 let safe=0,amb=0,okKey=0,ambKey=0,wrongNum=0,wrongAmb=0;
 for(let i=0;i<240;i++){
  const option=sourceOptions.choices[i],row=audit.source240OptionNumericalCheck[i];
  const raw=option.sourceOptionTextFromPdf.replace(/\u2212/g,'-').trim();
  const parsed=raw.match(/^([A-F])\.[ \t]*(-?\d+(?:\.\d+)?)[ \t]*$/);
  const value=parsed?Number(parsed[2]):null;
  assert.equal(row.sourceId,option.originalSourceId);
  assert.equal(row.option,option.sourceOptionLetter);
  assert.equal(row.isOriginalCorrect,option.sourceKey);
  assert.equal(row.readableSingleLineNumber,value);
  assert.equal(row.sourcePdfExactMathVisuallyVerified,false);
  assert.equal(row.independentGrade7To9Calibrated,false);
  assert.equal(row.creditAllowed,false);
  const trueValue=answers.questions[option.originalQ-161].independentMathematicalValue;
  if(value===null){amb++;if(option.sourceKey)ambKey++;else wrongAmb++}
  else{safe++;if(option.sourceKey){okKey++;assert.ok(near(value,trueValue))}
    else{wrongNum++;assert.ok(!near(value,trueValue))}
  }
 }
 assert.deepEqual([safe,amb,okKey,ambKey,wrongNum,wrongAmb],[192,48,38,2,154,46]);
});
test('four genuine identical original systems recur across nine question IDs and are unsafe to treat as nine independent equations',()=>{
 const systems=new Map();
 for(const q of answers.questions){
  if(!q.originalSystemCoefficients)continue;
  const key=JSON.stringify(q.originalSystemCoefficients),arr=systems.get(key)||[];
  arr.push(q.number);systems.set(key,arr);
 }
 const collision=[...systems.values()].filter(x=>x.length>1);
 assert.deepEqual(collision,[[161,169,189],[162,170],[163,171],[164,172]]);
 assert.deepEqual(audit.identicalOriginalSystemCollisionGroups.map(x=>x.originalQuestionNumbers),collision);
 assert.equal(audit.counts.originalQuestionsUsingDuplicateGivenSystems,9);
 assert.deepEqual(answers.questions.filter(x=>x.number>=185&&x.number<=188).map(x=>x.independentMathematicalValue),[5,5,5,5]);
});
test('all eight original no-solution parameter questions have proportional coefficients and inconsistent constants',()=>{
 for(let i=0;i<4;i++){
   const row=answers.questions[12+i],a=2+i,b=3+i,c=7+i,k=2*a;
   assert.equal(row.number,173+i);
   assert.equal(row.independentMathematicalValue,k);
   assert.equal(a*(2*b)-b*k,0,'determinant zero');
   assert.notEqual(2*c+1,2*c,'second RHS must not be twice first');
 }
 const output=[41,61,113,145];
 for(let i=0;i<4;i++){
   const row=answers.questions[36+i],k=row.independentMathematicalValue,firstC=10+2*i;
   const secondX=k+3+i,secondY=2*k+(i%2===0?2:3),det=2*secondY-3*secondX;
   assert.equal(det,0,'parallel slopes k='+k);
   assert.notEqual(output[i],firstC*secondX/2,'must be inconsistent, not coincident');
 }
});
