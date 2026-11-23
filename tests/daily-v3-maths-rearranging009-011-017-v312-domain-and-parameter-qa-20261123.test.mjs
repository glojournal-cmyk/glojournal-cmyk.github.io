import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const pack=JSON.parse(readFileSync(new URL('../qa-staging/math-v312-rearranging009-011-017-inverse-domain-reasoning-candidates-20261123.json',import.meta.url),'utf8'));
const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
const letters=['A','B','C','D','E','F'];
const nums=s=>{
  const matches=s.match(/\d+/g);return matches?matches.map(Number):[];
};
function linear(source,variable,value){
 const s=source.replace(/\s/g,'');
 let m=s.match(/^([+-]?\d+)([a-z])([+-]\d+)$/);
 if(m){assert.equal(m[2],variable);return Number(m[1])*value+Number(m[3]);}
 m=s.match(/^([+-]?\d+)-(\d*)([a-z])$/);
 if(m){assert.equal(m[3],variable);return Number(m[1])-Number(m[2]||'1')*value;}
 m=s.match(/^([a-z])([+-]\d+)$/);
 if(m){assert.equal(m[1],variable);return value+Number(m[2]);}
 m=s.match(/^([+-]?\d+)$/);
 if(m)return Number(m[1]);
 throw Error('Unsupported linear source math '+source+' for '+variable);
}
function expression(source,variable,value){
 const s=source.replace(/\s/g,'');
 const m=s.match(/^\\frac\{([^{}]+)\}\{([^{}]+)\}$/);
 if(m)return linear(m[1],variable,value)/linear(m[2],variable,value);
 return linear(s,variable,value);
}
function parseFormula(option,dependent){
 const s=option.latex,fragments=s.split(',').map(x=>x.trim());
 const first=fragments.shift(),m=first.match(/^([xp])=(.+)$/);
 assert.ok(m,'Expected a named inverse expression '+s);
 return {name:m[1],at:v=>expression(m[2],dependent,v),constraint:fragments.join(',').trim()};
}
function domainValue(rest){
 if(!rest)return null;
 let m=rest.match(/^y\\ne(-?)\\frac\{(\d+)\}\{(\d+)\}$/);
 if(m)return (m[1]?-1:1)*Number(m[2])/Number(m[3]);
 m=rest.match(/^y\\ne(-?\d+)$/);
 assert.ok(m,'Unrecognised excluded output value '+rest);
 return Number(m[1]);
}
function range(rest){
 const s=rest.replace(/\s/g,'');
 let m=s.match(/^(\d+)(\\le|<)t<(\d+)$/);
 if(m)return {lower:Number(m[1]),lowerStrict:m[2]==='<',upper:Number(m[3])};
 m=s.match(/^t>(\d+)$/);
 if(m)return {lower:Number(m[1]),lowerStrict:true,upper:Infinity};
 throw Error('Unrecognised candidate range '+rest);
}
function compareWrong(q,option,source){
 const n=Number(q.sourceId.slice(-3)),O=parseFormula(option,n===10?'t':'y');
 if(n===9){
  const {a,b,c,d}=source,y=2.7;
  const expected={
   A:(d*y-b)/(c*y-a),
   B:(d*y+b)/(a-c*y),
   C:(d*y+b)/(c*y-a),
   D:(c*y-a)/(d*y+b),
   E:(d*y+b)/(c*y-a),
   F:(d*y+b)/(c*y-a)
  };
  const excluded={
   A:a/c,B:a/c,C:a/c,D:-b/d,E:d/c,F:-b/d
  };
  assert.equal(O.name,'x');
  assert.ok(near(O.at(y),expected[option.id]),'Q9 wrong manipulation does not produce option '+option.id);
  assert.ok(near(domainValue(O.constraint),excluded[option.id]),'Q9 wrong domain path '+option.id);
  return option.id==='C';
 }
 if(n===10){
  const {a,b,c}=source,t=(a+b/c)/2;
  const expected={
   A:(b-c*t)/(t-a),B:(b-c*t)/(a-t),C:(b-c*t)/(t-a),
   D:(b+c*t)/(t-a),E:(b-c*t)/(t-a),F:(t-a)/(b-c*t)
  };
  const expectedRange={
   A:{lower:a,lowerStrict:false,upper:b/c},
   B:{lower:a,lowerStrict:true,upper:b/c},
   C:{lower:a,lowerStrict:true,upper:b/c},
   D:{lower:a,lowerStrict:true,upper:b/c},
   E:{lower:a,lowerStrict:true,upper:Infinity},
   F:{lower:a,lowerStrict:true,upper:b/c}
  };
  const R=range(O.constraint),want=expectedRange[option.id];
  assert.equal(O.name,'p');
  assert.ok(near(O.at(t),expected[option.id]),'Q10 wrong operation does not produce option '+option.id);
  assert.equal(R.lower,want.lower);assert.equal(R.lowerStrict,want.lowerStrict);assert.equal(R.upper,want.upper);
  return option.id==='C';
 }
 if(n===17){
  const {hole,square}=source,y=13;
  const expected={
   A:y-hole,B:y+hole,C:y-hole,D:y-hole,E:y-hole,F:y-square
  };
  const excluded={A:hole,B:2*hole,C:-2*hole,D:2*hole,E:null,F:2*hole};
  assert.equal(O.name,'x');
  assert.ok(near(O.at(y),expected[option.id]),'Q17 wrong manipulation '+option.id);
  const given=domainValue(O.constraint);
  if(excluded[option.id]===null)assert.equal(given,null);
  else assert.ok(near(given,excluded[option.id]),'Q17 wrong exclusion '+option.id);
  return option.id==='D';
 }
 throw Error('Unexpected option computation '+n);
}
function inspect(q){
 const old=bank.questions.find(x=>x.sourceId===q.sourceId);
 assert.ok(old&&old.dailyEligible===false,'Original blocked bank must be preserved');
 assert.notEqual(q.revisionId,old.revisionId);
 assert.notEqual(q.stem,old.stem);
 for(const f of ['dailyEligible','masteryEligible','independentGradeCalibrated','independentStudentMisconceptionCertified'])
   assert.equal(q[f],false,q.sourceId+' forged '+f);
 assert.equal(q.academicQA,'pending');
 assert.equal(q.options.length,6);
 assert.deepEqual(q.options.map(x=>x.id),letters);
 assert.equal(new Set(q.options.map(x=>x.latex)).size,6);
 assert.ok(q.workedSolutionSteps.length===3);
 assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);
 for(const o of q.options)assert.match(mathsOptionHTML(o),/^<math xmlns=/);
 for(const step of q.workedSolutionSteps){
   assert.ok(step.length>=35);
   assert.ok(mathsRichTextHTML(step).length>0);
 }
 const n=Number(q.sourceId.slice(-3));let source,correct;
 if(n===9){
  const m=q.stem.match(/y=\\frac\{(\d+)x\+(\d+)\}\{(\d+)x-(\d+)\}/);
  assert.ok(m,'Q9 source relation cannot be read');
  const [a,b,c,d]=m.slice(1).map(Number);
  assert.match(q.stem,/x\\ne\\frac\{5\}\{2\}/);
  assert.ok(near(d/c,5/2),'Q9 excluded original x must follow source coefficients');
  source={a,b,c,d};
  for(const x of [-9,-4,-1,0,1,2,3,5,10]){
   if(near(c*x-d,0))continue;
   const y=(a*x+b)/(c*x-d);
   assert.ok(!near(y,a/c),'Q9 output restriction not proved');
   const key=parseFormula(q.options.find(o=>o.id===q.correctOptionId),'y');
   assert.ok(near(key.at(y),x),'Q9 inverse wrong at '+x);
   assert.ok(near(domainValue(key.constraint),a/c));
  }
  correct='C';
 }else if(n===10){
  const m=q.stem.match(/t=\\frac\{(\d+)p\+(\d+)\}\{p\+(\d+)\}/);
  assert.ok(m,'Q10 source p/t relation cannot be read');
  const [a,b,c]=m.slice(1).map(Number);
  assert.match(q.stem,/p>0/);
  assert.ok(b>a*c,'Q10 positive p image should have finite upper bound');
  source={a,b,c};
  for(const p of [0.1,0.5,1,2,4,9,20,100]){
   const t=(a*p+b)/(p+c);
   assert.ok(t>a&&t<b/c,'Q10 derived strict output interval mismatch');
   const key=parseFormula(q.options.find(o=>o.id===q.correctOptionId),'t');
   assert.ok(near(key.at(t),p),'Q10 inverse wrong at p='+p);
   assert.deepEqual(range(key.constraint),{lower:a,lowerStrict:true,upper:b/c});
  }
  correct='C';
 }else if(n===11){
  const m=q.stem.match(/y=\\frac\{kx\+(\d+)\}\{(\d+)x\+k\}/);
  assert.ok(m,'Q11 coefficient parameters cannot be parsed');
  const [b,c]=m.slice(1).map(Number);
  source={b,c};
  const expected=Math.sqrt(b*c),values=[];
  for(const option of q.options){
   let s=option.latex.replace(/\s/g,'');
   let match=s.match(/^k=\\pm(?:(\d+))?\\sqrt\{(\d+)\}$/);
   let positive;
   if(match)positive=(match[1]?Number(match[1]):1)*Math.sqrt(Number(match[2]));
   else{
    match=s.match(/^k=\\pm(\d+)$/);
    assert.ok(match,'Q11 candidate root must specify plus/minus '+s);
    positive=Number(match[1]);
   }
   const desired={
    A:Math.sqrt(b),B:Math.sqrt(b*(c-1)),C:Math.sqrt(b*c/2),
    D:Math.sqrt(b*c),E:b,F:c*Math.sqrt(b)
   }[option.id];
   assert.ok(near(positive,desired),'Q11 claimed wrong determinant operation does not match '+option.id);
   for(const k of [positive,-positive]){
    let v0=null;
    for(const x of [-7,-3,-1,0,1,2,4]){
     const den=c*x+k;if(near(den,0))continue;
     const y=(k*x+b)/den;
     if(v0===null)v0=y;
     else if(option.id==='D')assert.ok(near(v0,y),'Q11 constant candidate varied with x');
    }
   }
   values.push(positive);
  }
  assert.equal(values.length,6);
  assert.ok(values.every((a,i)=>values.every((b,j)=>i===j||!near(a,b))),
   'Q11 equivalent paired parameter answers');
  assert.ok(near(values[3],expected));
  correct='D';
 }else if(n===17){
  const m=q.stem.match(/y=\\frac\{x\^2-(\d+)\}\{x-(\d+)\}/);
  assert.ok(m,'Q17 removable-point source cannot be read');
  const [square,hole]=m.slice(1).map(Number);
  assert.equal(square,hole*hole,'Q17 should truly have removable factor');
  assert.match(q.stem,/x\\ne5/);
  assert.equal(hole,5);
  source={square,hole};
  for(const x of [-13,-8,-2,0,2,4,7,11,15]){
   if(x===hole)continue;
   const y=(x*x-square)/(x-hole);
   assert.ok(!near(y,2*hole));
   const key=parseFormula(q.options.find(o=>o.id===q.correctOptionId),'y');
   assert.ok(near(key.at(y),x),'Q17 reverse formula incorrect');
   assert.equal(domainValue(key.constraint),2*hole);
  }
  correct='D';
 }else throw Error('Unexpected candidate id '+n);
 assert.equal(q.correctOptionId,correct);
 assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===correct).latex);
 const modelVerified=q.options.map(o=>({id:o.id,correct: n===11?o.id==='D':compareWrong(q,o,source)}));
 assert.deepEqual(modelVerified.filter(x=>x.correct).map(x=>x.id),[correct],
   'Every alternative requires exactly one correct algebra+domain answer');
 for(const o of q.options.filter(x=>x.id!==correct))
   assert.ok(o.errorPath&&o.errorPath.length>35,'Explain actual mathematical error');
}
test('four inverse/domain/parameter reasoning questions are mathematically independent and exactly one A-F statement correct',()=>{
 assert.equal(pack.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
 assert.equal(pack.questions.length,4);
 assert.equal(bank.questions.length,200);
 assert.deepEqual(pack.questions.map(q=>q.sourceId.slice(-3)),['009','010','011','017']);
 for(const q of pack.questions)inspect(q);
 assert.equal(bank.questions.filter(q=>q.dailyEligible===true).length,0);
});
test('wrong key, broken domain, changed stem coefficients and forged credit all cause QA to fail',()=>{
 for(const candidate of pack.questions){
  const copy=()=>JSON.parse(JSON.stringify(candidate));
  const badKey=copy();badKey.correctOptionId='A';assert.throws(()=>inspect(badKey));
  const badWrong=copy();
  badWrong.options.find(o=>o.id!==badWrong.correctOptionId).latex='x=y+999';
  assert.throws(()=>inspect(badWrong));
  const badDomain=copy();
  const correct=badDomain.options.find(o=>o.id===badDomain.correctOptionId);
  correct.latex+=' y\\ne999';assert.throws(()=>inspect(badDomain));
  const forged=copy();forged.dailyEligible=true;assert.throws(()=>inspect(forged));
  const changed=copy(),replacements={
   '009':['3x+4','4x+4'],
   '010':['3p+12','4p+12'],
   '011':['kx+6','kx+7'],
   '017':['x^2-25','x^2-36']
  };
  const [before,after]=replacements[candidate.sourceId.slice(-3)];
  assert.ok(changed.stem.includes(before));
  changed.stem=changed.stem.replace(before,after);
  assert.throws(()=>inspect(changed));
 }
});
