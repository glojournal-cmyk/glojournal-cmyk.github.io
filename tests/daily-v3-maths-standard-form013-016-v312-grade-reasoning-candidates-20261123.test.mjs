import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const pack=JSON.parse(readFileSync(new URL('../qa-staging/math-v312-standard-form013-016-reasoning-replacement-candidates-20261123.json',import.meta.url),'utf8'));
const current=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const letters=['A','B','C','D','E','F'];
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function numbersFromActualStem(stem){
 const matches=[...stem.matchAll(/(\d+(?:\.\d+)?)\\times10\^\{(-?\d+)\}/g)];
 return matches.map(m=>({coefficient:Number(m[1]),coefficientString:m[1],
  exponent:Number(m[2]),value:Number(m[1])*10**Number(m[2])}));
}
function exactOptionValue(latex){
 const s=latex.replace(/\s/g,'');
 if(/^\d+(?:\.\d+)?$/.test(s))return Number(s);
 const m=s.match(/^(\d+(?:\.\d+)?)\\times10\^\{(-?\d+)\}$/);
 assert.ok(m,'Unrecognised standard-form A-F option: '+latex);
 const coeff=Number(m[1]),power=Number(m[2]);
 assert.ok(coeff>=1&&coeff<10,'Not normalised standard form: '+latex);
 return coeff*10**power;
}
const significant=(x,n)=>Number(x.toPrecision(n));
function calculateIndependentSource(q){
 const num=Number(q.sourceId.slice(-3)),stem=q.stem,
  values=numbersFromActualStem(stem),v=i=>values[i].value;
 let correct,wrong,reason;
 if(num===13){
  assert.equal(values.length,3);
  assert.match(stem,/minimum whole number of drives/);
  const m=stem.match(/to (\d+)% of their original size/);
  assert.ok(m,'Compression retained percentage is missing');
  const remain=Number(m[1])/100,raw=v(0)*v(1),
   compressed=raw*remain,capacity=v(2),needed=compressed/capacity;
  assert.ok(raw>0&&capacity>0&&remain>0&&remain<1);
  correct=Math.ceil(needed);
  wrong={
   A:Math.floor(needed),C:Math.ceil(raw/capacity),
   D:Math.ceil(raw*(1-remain)/capacity),
   E:Math.ceil(raw*remain**2/capacity),
   F:Math.ceil(compressed/(capacity/10))
  };
  reason={
   A:/Round.*down/,C:/Ignore compression/,D:/reduced by 70%/,
   E:/retention twice/,F:/factor of ten too small/
  };
 }else if(num===14){
  assert.equal(values.length,2);
  assert.equal((stem.match(/to 2 significant figures/g)||[]).length,2);
  assert.match(stem,/upper bound/);
  const increment=i=>{
   const mantissa=values[i].coefficientString,
    decimals=mantissa.includes('.')?mantissa.split('.')[1].length:0;
   return 10**(values[i].exponent-decimals);
  };
  const mass=v(0),volume=v(1);
  const loMass=mass-increment(0)/2,upMass=mass+increment(0)/2;
  const loVolume=volume-increment(1)/2,upVolume=volume+increment(1)/2;
  assert.ok(loMass>0&&loVolume>0);
  correct=significant(upMass/loVolume,3);
  wrong={
   A:significant(mass/volume,3),
   B:significant(loMass/loVolume,3),
   C:significant(upMass/upVolume,3),
   D:significant(upMass/volume,3),
   F:significant(upMass/(loVolume-increment(1)/2),3)
  };
  reason={
   A:/both reported central/,B:/lower bound of mass/,
   C:/upper bounds for both/,D:/central reported value/,
   F:/790 cm³ instead of 795/
  };
 }else if(num===15){
  assert.equal(values.length,2);
  assert.match(stem,/total original mass/);
  const p=stem.match(/removes (\d+)%/);
  assert.ok(p,'Retention fraction missing');
  const loss=Number(p[1])/100,remain=1-loss,known=v(0),final=v(1);
  assert.ok(loss>0&&loss<1);
  correct=final/remain-known;
  wrong={
   B:final-known,
   C:final*remain-known,
   D:final*(1+loss)-known,
   E:final-known*remain,
   F:final/(1-0.20)-known
  };
  reason={
   B:/Ignore the 15%/,C:/applying the loss again/,
   D:/Add 15% of the final mass/,E:/only to material A/,
   F:/stated loss as 20%/
  };
 }else if(num===16){
  assert.equal(values.length,2);
  assert.match(stem,/square panel/);
  assert.match(stem,/side length.*mm/);
  assert.match(stem,/area.*cm²/);
  const sideMm=v(0),areaCm2=v(1);
  assert.ok(sideMm>0&&areaCm2>0);
  const sideCm=sideMm/10,originalAreaCm2=sideCm**2,ratio=areaCm2/originalAreaCm2;
  correct=Math.sqrt(ratio);
  wrong={
   A:ratio,
   B:Math.sqrt(areaCm2/(sideMm**2)),
   C:Math.sqrt(areaCm2/((sideMm/100)**2)),
   D:Math.sqrt(areaCm2),
   F:areaCm2/(4*sideCm)
  };
  reason={
   A:/ratio of the areas/,B:/omitting the mm-to-cm conversion/,
   C:/dividing by 100 rather than by 10/,
   D:/side length in centimetres but report/,
   F:/area as a perimeter/
  };
 }else throw Error('Unexpected Standard Form replacement '+q.sourceId);
 assert.ok(Number.isFinite(correct)&&correct>0,'Source has no finite positive solution');
 return {correct,wrong,reason};
}
function inspect(q){
 const original=current.questions.find(x=>x.sourceId===q.sourceId);
 assert.ok(original&&original.dailyEligible===false,'Need unchanged blocked original');
 assert.notEqual(q.stem,original.stem,'Not an actual different reasoning item');
 assert.notEqual(q.revisionId,original.revisionId);
 assert.equal(q.academicQA,'pending');
 assert.equal(q.dailyEligible,false);
 assert.equal(q.masteryEligible,false);
 assert.equal(q.independentGradeCalibrated,false);
 assert.equal(q.teacherTaughtConfirmed,false);
 assert.equal(q.independentStudentMisconceptionCertified,false);
 assert.equal(q.options.length,6);
 assert.deepEqual(q.options.map(o=>o.id),letters);
 assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
 const evidence=calculateIndependentSource(q);
 const key=exactOptionValue(q.correctAnswerLatex);
 assert.ok(near(key,evidence.correct),q.sourceId+' independent source answer mismatch '+key+' vs '+evidence.correct);
 const options=q.options.map(o=>({id:o.id,value:exactOptionValue(o.latex),errorPath:o.errorPath}));
 assert.deepEqual(options.filter(o=>near(o.value,evidence.correct)).map(o=>o.id),
  [q.correctOptionId],q.sourceId+' must have exactly one correct option');
 for(const option of options.filter(o=>o.id!==q.correctOptionId)){
  const expected=evidence.wrong[option.id],re=evidence.reason[option.id];
  assert.ok(re&&Number.isFinite(expected),q.sourceId+' unsupported wrong path '+option.id);
  assert.match(option.errorPath,re,q.sourceId+' inaccurate error-path description '+option.id);
  assert.ok(near(option.value,expected),q.sourceId+' '+option.id+
   ' shown answer '+option.value+' inconsistent with wrong route '+expected);
 }
 // Rendering with exact offline MathML, not a visual browser/PWA approval.
 assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);
 for(const o of q.options)assert.match(mathsOptionHTML(o),/^<math xmlns=/);
 assert.equal(q.workedSolutionSteps.length,3);
 for(const step of q.workedSolutionSteps){
  assert.ok(typeof step==='string'&&step.length>=35);
  assert.match(mathsRichTextHTML(step),/<math xmlns=/);
 }
}
test('four different Standard Form situations: four source-derived answers and twenty numeric wrong-route proofs',()=>{
 assert.equal(pack.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
 assert.equal(pack.questions.length,4);
 assert.equal(current.questions.length,200);
 assert.deepEqual(pack.questions.map(q=>Number(q.sourceId.slice(-3))),[13,14,15,16]);
 assert.equal(new Set(pack.questions.map(q=>q.stem.toLowerCase()
  .replace(/\d+(?:\.\d+)?/g,'#'))).size,4,'Replacement needs genuinely distinct situations');
 for(const q of pack.questions)inspect(q);
 assert.equal(current.questions.filter(q=>q.dailyEligible===true).length,0);
});
test('wrong key, wrong distractor, altered source arithmetic and forged Daily permission all fail',()=>{
 for(const candidate of pack.questions){
  const copy=()=>JSON.parse(JSON.stringify(candidate));
  const badKey=copy();badKey.correctAnswerLatex='999';
  assert.throws(()=>inspect(badKey));
  const badWrong=copy();badWrong.options.find(o=>o.id!==badWrong.correctOptionId).latex='999';
  assert.throws(()=>inspect(badWrong));
  const badStem=copy();
  const replacements={
   '013':['to 70%','to 60%'],
   '014':['8.0\\times10^{2}','8.0\\times10^{3}'],
   '015':['removes 15%','removes 10%'],
   '016':['3.6\\times10^{7}','4.0\\times10^{7}']
  };
  const [before,after]=replacements[candidate.sourceId.slice(-3)];
  assert.ok(badStem.stem.includes(before));
  badStem.stem=badStem.stem.replace(before,after);
  assert.throws(()=>inspect(badStem));
  const forged=copy();forged.dailyEligible=true;
  assert.throws(()=>inspect(forged));
 }
});
