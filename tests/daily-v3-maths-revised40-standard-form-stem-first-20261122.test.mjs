import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const data=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const questions=data.questions.filter(q=>q.topicId==='math-y9-standard-form');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function values(stem){
 return [...stem.matchAll(/(\d+(?:\.\d+)?)\\times\s*10\^(?:\{(-?\d+)\}|(-?\d+))/g)]
  .map(m=>Number(m[1])*10**Number(m[2]??m[3]));
}
function numeric(tex){
 const s=tex.replace(/\s/g,'');
 let m=s.match(/^(-?\d+(?:\.\d+)?)\\times10\^\{(-?\d+)\}$/);
 if(m)return Number(m[1])*10**Number(m[2]);
 m=s.match(/^(-?)\\(?:d?frac)\{(-?\d+)\}\{(-?\d+)\}$/);
 if(m)return (m[1]?-1:1)*Number(m[2])/Number(m[3]);
 assert.match(s,/^-?\d+(?:\.\d+)?$/,'Cannot parse candidate value '+s);
 return Number(s);
}
function fromStem(q){
 const n=Number(q.sourceId.slice(-3)),v=values(q.stem),s=q.stem;
 const expectPercent=p=>assert.ok(s.includes(p+'\\%'),
  'Recheck changed source discount percentage in '+q.sourceId);
 let result;
 if(n===1)result=v[0]*v[1]/v[2];
 else if(n===2)result=(v[0]+v[1])*v[2]/(v[3]+v[4]);
 else if(n===3){expectPercent(20);result=v[0]*v[1]*.8/v[2]}
 else if(n===4)result=v[0]*v[1]/v[2];
 else if(n<=8)result=(v[0]+v[1])/v[2];
 else if(n<=12){
  const m=s.match(/into (\d+) containers/);assert.ok(m);
  result=(v[0]-v[1])/Number(m[1]);
 }else if(n<=16)result=(v[0]-v[1])/v[2];
 else if(n===17){expectPercent(25);result=v[0]*v[1]*.75/v[2]}
 else if(n===18){expectPercent(20);result=(v[0]*v[1]+v[2]*v[3])*.8/v[4]}
 else if(n===19){expectPercent(25);result=v[0]*v[1]*.75/v[3]}
 else if(n===20){expectPercent(25);result=v[0]*v[3]-v[1]*v[2]*.75}
 else if(n<=24){expectPercent(10);result=(v[0]*.9-v[1])/v[1]*100}
 else if(n<=28){
  assert.match(s,/10\^6/,'Source unit conversion must specify m³ to cm³');
  result=v[0]*1e6*v[1];
 }else if(n<=32)result=(v[0]+v[1]-v[2])/v[3];
 else if(n===33){expectPercent(10);result=(v[0]+v[1])*.9/v[2]}
 else if(n===34){expectPercent(15);result=(v[0]*.85-v[1])/v[2]}
 else if(n===35){expectPercent(20);result=(v[1]*v[2]-v[0])/.8}
 else if(n===36){expectPercent(20);expectPercent(25);result=v[0]*.8*.75/v[1]}
 else{expectPercent(20);result=(v[2]-v[1])/(v[0]*.8)}
 assert.ok(Number.isFinite(result)&&result>0,'Impossible nonpositive source quantity '+q.sourceId);
 return result;
}
test('40 revised Standard Form stems: independent dimensional arithmetic, exact six-option mapping',()=>{
 assert.equal(questions.length,40);
 let choices=0;
 for(const q of questions){
  const expected=fromStem(q),key=numeric(q.correctAnswerLatex);
  assert.ok(near(expected,key),q.sourceId+' source/key mismatch: '+expected+' vs '+key);
  assert.equal(q.options.length,6);
  const vals=q.options.map(o=>({id:o.id,value:numeric(o.latex)}));
  assert.ok(vals.every((a,i)=>vals.every((b,j)=>i===j||!near(a.value,b.value)),
   q.sourceId+' equivalent numerical choices');
  assert.deepEqual(vals.filter(o=>near(o.value,expected)).map(o=>o.id),[q.correctOptionId],
   q.sourceId+' wrong candidate correctOptionId');
  assert.equal(q.dailyEligible,false,q.sourceId+' remains draft');
  choices+=vals.length;
 }
 assert.equal(choices,240);
});
test('8 relative-percentage and reverse/compound contexts are not automatically TGS Autumn certified',()=>{
 const held=questions.filter(q=>[21,22,23,24,35,36,39,40]
   .includes(Number(q.sourceId.slice(-3))));
 assert.equal(held.length,8);
 assert.ok(held.every(q=>q.dailyEligible===false));
});
