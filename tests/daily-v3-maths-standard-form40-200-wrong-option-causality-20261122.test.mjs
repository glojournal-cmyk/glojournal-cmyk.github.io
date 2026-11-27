import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const qs=bank.questions.filter(q=>q.topicId==='math-y9-standard-form');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function terms(s){
 return [...s.matchAll(/(\d+(?:\.\d+)?)\\times\s*10\^(?:\{(-?\d+)\}|(-?\d+))/g)]
  .map(m=>({coefficient:Number(m[1]),exponent:Number(m[2]??m[3]),
   value:Number(m[1])*10**Number(m[2]??m[3])}));
}
function num(source){
 const s=source.replace(/\s/g,'');
 if(/^-?\d+(?:\.\d+)?$/.test(s))return Number(s);
 let m=s.match(/^(-?\d+(?:\.\d+)?)\\times10\^\{(-?\d+)\}$/);
 if(m)return Number(m[1])*10**Number(m[2]);
 m=s.match(/^(-?)\\frac\{(-?\d+)\}\{(-?\d+)\}$/);
 assert.ok(m,'Unsupported numeric candidate: '+source);
 return (m[1]?-1:1)*Number(m[2])/Number(m[3]);
}
function wrongPath(q,o){
 const n=Number(q.sourceId.slice(-3)),r=o.errorPath,
  termsFound=terms(q.stem),v=i=>termsFound[i].value,t=termsFound;
 const choices=map=>{
  assert.ok(Object.hasOwn(map,o.id),
    q.sourceId+' choice '+o.id+' lost dedicated misconception proof');
  return map[o.id];
 };
 const description=map=>{
  assert.ok(Object.hasOwn(map,r),
    q.sourceId+' choice '+o.id+' has unrecognised error path: '+r);
  return map[r];
 };
 // Distinct introductory density stories: directly derived incorrect steps.
 if(n===1){
  const M=v(0)*v(1),V=v(2);
  return choices({A:M/(V/10),B:M/(V*10),C:2*M/V,D:M,
   E:v(0)*(t[1].coefficient-1)*10**t[1].exponent/V});
 }
 if(n===2){
  const a=v(0)*v(2),b=v(1)*v(2),vol=v(3)+v(4);
  return choices({A:a/vol,B:b/vol,C:(a+b)/v(4),
   D:(a+b)/(vol/2),F:(a+b)/(vol*10)});
 }
 if(n===3){
  const M=v(0)*v(1),V=v(2);
  return choices({A:M/V,B:M*.2/V,D:M*.8**2/V,
   E:M*.8/(V/10),F:M*.8/(V*10)});
 }
 if(n===4){
  const M=v(0)*v(1),granuleMass=v(2);
  return choices({B:v(0)*(v(1)/10)/granuleMass,
   C:v(0)*(v(1)*10)/granuleMass,
   D:M/10**t[2].exponent,E:v(0)/granuleMass,F:M/(granuleMass*100)});
 }
 if(n>=5&&n<=8){
  const a=v(0),b=v(1),duration=v(2);
  return description({
   'Add the two coefficients as if their powers matched.':
    (t[0].coefficient+t[1].coefficient)*10**t[0].exponent/duration,
   'Shift the second coefficient one place too far.':(a+b/10)/duration,
   'Read the divisor as one tenth of its stated value.':(a+b)/(duration/10),
   'Read the divisor as ten times its stated value.':(a+b)/(duration*10),
   'Stop at the combined numerator without dividing.':a+b,
   'Subtract the second leg.':(a-b)/duration,
   'Ignore the second leg.':a/duration,
   'Use only the second leg.':b/duration
  });
 }
 if(n>=9&&n<=16){
  const a=v(0),b=v(1),den=n<=12?
   Number((q.stem.match(/into (\d+) containers/)||[])[1]):v(2);
  assert.ok(den>0,'Actual divider missing');
  return description({
   'Add the amount that should be subtracted.':(a+b)/den,
   'Ignore the subtracted amount.':a/den,
   'Divide only the subtracted amount.':b/den,
   'Subtract unaligned coefficients.':
    (t[0].coefficient-t[1].coefficient)*10**t[0].exponent/den,
   'Shift the smaller term one decimal place too far.':(a-b/10)/den,
   'Read the divisor as one tenth of its stated value.':(a-b)/(den/10),
   'Read the divisor as ten times its stated value.':(a-b)/(den*10),
   'Stop at the combined numerator without dividing.':a-b
  });
 }
 if(n===17){
  const M=v(0)*v(1),V=v(2);
  return choices({A:M*.75/(V/10),B:M*.5/V,D:M*.25/V,
   E:M*.75/(V/t[2].coefficient),F:M/V});
 }
 if(n===18){
  const A=v(0)*v(1),B=v(2)*v(3),M=A+B,V=v(4);
  return choices({A:M/V,C:A*.8/V,D:M*.2/V,
   E:M*.8/(V*10),F:M*.8/(V/10)});
 }
 if(n===19){
  const M=v(0)*v(1),startingVolume=v(2),finalVolume=v(3);
  return choices({A:M/finalVolume,B:M*.75/startingVolume,
   D:M*.25/finalVolume,E:M*.75**2/finalVolume,
   F:M*.75/(finalVolume*10)});
 }
 if(n===20){
  const volume=v(0),initialMass=v(1)*v(2),target=volume*v(3);
  return choices({B:target-initialMass,C:target,
   D:target-initialMass*.5,E:target-initialMass*.25,
   F:target*2/3-initialMass*.75});
 }
 if(n>=21&&n<=24){
  const newer=v(0),older=v(1),corrected=.9*newer,diff=corrected-older;
  return description({
   'Ignore the calibration.':(newer-older)/older*100,
   'Report the corrected amount as a percentage of the old one.':corrected/older*100,
   'Use the corrected reading as the comparison base.':diff/corrected*100,
   'Use the uncorrected new reading as the comparison base.':diff/newer*100,
   'Subtract ten percentage points from the uncorrected percentage increase.':
    (newer-older)/older*100-10
  });
 }
 if(n>=25&&n<=28){
  const base=v(0)*v(1);
  return description({
   'Skip the cubic unit conversion.':base,
   'Use the linear conversion factor 100.':base*100,
   'Use the square conversion factor.':base*10000,
   'Convert the volume in the opposite direction.':base/1000000,
   'Use the number of litres per cubic metre as the number of cubic centimetres.':
    base*1000
  });
 }
 if(n>=29&&n<=32){
  const a=v(0),b=v(1),c=v(2),d=v(3);
  return description({
   'Add the final term rather than subtracting it.':(a+b+c)/d,
   'Subtract both smaller terms.':(a-b-c)/d,
   'Ignore the last subtraction.':(a+b)/d,
   'Ignore the middle addition.':(a-c)/d,
   'Combine the coefficients without aligning the powers.':
    (t[0].coefficient+t[1].coefficient-t[2].coefficient)*10**t[0].exponent/d
  });
 }
 if(n===33){
  const a=v(0),b=v(1),packets=v(2),M=a+b;
  return choices({A:M/packets,C:M*1.1/packets,D:a*.9/packets,
   E:M*.1/packets,F:M*.9/(packets/10)});
 }
 if(n===34){
  const a=v(0),reserve=v(1),bags=v(2);
  return choices({A:a*.85/bags,B:(a*.85*.85-reserve)/bags,
   C:(a*.85+reserve)/bags,D:(a-reserve)*.85/bags,
   E:(a*.15-reserve)/bags});
 }
 if(n===35){
  const added=v(0),packed=v(1)*v(2),afterLoss=packed-added;
  return choices({A:afterLoss,B:afterLoss/.2,D:(packed+added)/.8,
   E:afterLoss*.8,F:packed/.8});
 }
 if(n===36){
  const a=v(0),packets=v(1);
  return choices({A:a*.55/packets,C:a*.75/packets,D:a*.8/packets,
   E:a*.2*.75/packets,F:a*.8*1.25/packets});
 }
 if(n>=37&&n<=40){
  const batchSize=v(0),added=v(1),final=v(2),retained=final-added;
  return description({
   'Apply the 20% loss again instead of reversing it.':retained*.8/batchSize,
   'Forget to remove the later addition.':final/(batchSize*.8),
   'Ignore the loss.':retained/batchSize,
   'Add the later addition again.':(final+added)/(batchSize*.8),
   'Assume only 20% was retained.':retained/(batchSize*.2)
  });
 }
 throw Error('Unsupported original question ID '+q.sourceId);
}
test('200 Standard Form wrong options reproduce the stated mistaken arithmetic, independently of answer key',()=>{
 assert.equal(qs.length,40);
 let checked=0;
 for(const q of qs){
  assert.equal(q.dailyEligible,false,'Wrong-option QA alone cannot permit formal credit');
  assert.equal(q.options.length,6);
  for(const option of q.options.filter(o=>o.id!==q.correctOptionId)){
   assert.ok(option.errorPath.length>=10,q.sourceId+' '+option.id+' missing rationale');
   const predicted=wrongPath(q,option),actual=num(option.latex);
   assert.ok(near(predicted,actual),q.sourceId+' '+option.id+
    ': stated wrong method gives '+predicted+' but option shows '+actual+
    '\n'+option.errorPath);
   checked++;
  }
 }
 assert.equal(checked,200);
});
