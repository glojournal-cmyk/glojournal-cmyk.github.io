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
  assert.equal(values.length,4);
  assert.match(stem,/Drives may be mixed/);
  const m=stem.match(/to (\d+)% of their original size/);
  assert.ok(m,'Compression retained percentage is missing');
  const remain=Number(m[1])/100,raw=v(0)*v(1),compressed=raw*remain,
   capA=v(2),capB=v(3),costs=[...stem.matchAll(/costs £(\d+)/g)]
    .map(m=>Number(m[1]));
  assert.equal(costs.length,2,'Need two independently priced storage options');
  assert.ok(capA>0&&capB>0&&compressed>0&&remain>0&&remain<1);
  const feasible=[],maxA=Math.ceil(compressed/capA)+1,
   maxB=Math.ceil(compressed/capB)+1;
  for(let a=0;a<=maxA;a++)for(let b=0;b<=maxB;b++){
   const capacity=a*capA+b*capB,cost=a*costs[0]+b*costs[1];
   if(capacity>=compressed)feasible.push({a,b,cost});
  }
  correct=Math.min(...feasible.map(x=>x.cost));
  assert.ok(q.workedSolutionSteps[2].includes('b\\ge5') && q.workedSolutionSteps[2].includes('£275'),
   'Must prove optimality against arbitrarily many B drives, not only b=0..4');

  assert.deepEqual(feasible.filter(x=>x.cost===correct).map(x=>[x.a,x.b]),[[2,2]]);
  assert.ok(5*capA<compressed,'Five A drives must be insufficient');
  assert.ok(4*capA+capB>=compressed);
  assert.ok(6*capA>=compressed);
  assert.ok(capA+3*capB>=compressed);
  assert.ok(4*capB>=compressed);
  wrong={
   A:5*costs[0],C:4*costs[0]+costs[1],D:6*costs[0],
   E:costs[0]+3*costs[1],F:4*costs[1]
  };
  reason={
   A:/overlook that they hold only/,C:/four A drives and one B/,
   D:/six type-A drives/,E:/one A drive and three B/,
   F:/four type-B drives/
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
  assert.match(stem,/limiting upper bound/,'Density estimate must identify an unattained limiting supremum');
  assert.match(q.workedSolutionSteps[2],/unattained/);
  assert.ok(correct>=upMass/loVolume,'Rounded upper-limit approximation must not fall below the true supremum');

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
  const p=stem.match(/removes (\d+)% of material A and (\d+)% of material B/);
  assert.ok(p,'Two distinct percentage losses must be stated');
  const lossA=Number(p[1])/100,lossB=Number(p[2])/100,
   retainA=1-lossA,retainB=1-lossB,known=v(0),final=v(1);
  assert.ok(lossA>0&&lossA<1&&lossB>0&&lossB<1&&lossA!==lossB);
  const retainedB=final-retainA*known;
  assert.ok(retainedB>0);
  correct=retainedB/retainB;
  wrong={
   B:final-known,
   C:retainedB,
   D:retainedB/retainA,
   E:retainedB*retainB,
   F:(final-known/retainA)/retainB
  };
  reason={
   B:/Ignore both percentage losses/,
   C:/retained B mass without undoing/,
   D:/20% loss rate for B/,
   E:/apply B's 10% loss again/,
   F:/Reverse A's 20% loss instead/
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
  assert.ok(mathsRichTextHTML(step).length>0);
 }
 assert.ok(q.workedSolutionSteps.filter(step=>mathsRichTextHTML(step).includes('<math xmlns=')).length>=2,
  'At least two worked lines must include rendered mathematics');
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
   '015':['removes 20% of material A','removes 30% of material A'],
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
