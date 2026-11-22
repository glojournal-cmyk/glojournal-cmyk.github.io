import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const questions=bank.questions.filter(q=>q.topicId==='math-y9-straight-line-graphs');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b));

// Small, closed arithmetic grammar; no eval/Function or source answer oracle.
function numberAt(source,xValue=0){
 const s=source.replace(/\\left|\\right/g,'')
   .replace(/\\frac{([\-0-9]+)}{([\-0-9]+)}/g,'($1/$2)')
   .replace(/\s/g,'').replace(/−/g,'-');
 const parts=s.match(/\d+(?:\.\d+)?|[x()+\-*/]/g)||[];
 assert.equal(parts.join(''),s,'unreadable candidate numeric expression: '+s);
 const tokens=[],end=u=>/^\d|^x$|^\)$/.test(u),start=u=>/^\d|^x$|^\($/.test(u);
 for(let j=0;j<parts.length;j++){
  if(j&&end(parts[j-1])&&start(parts[j]))tokens.push('*');
  tokens.push(parts[j]);
 }
 let i=0;
 function atom(){
  const t=tokens[i++];
  if(t==='-')return -atom();if(t==='+')return atom();
  if(t==='('){const v=expr();assert.equal(tokens[i++],')');return v}
  if(t==='x')return xValue;
  if(/^\d/.test(t||''))return Number(t);
  throw Error('Bad arithmetic token in '+source+': '+t);
 }
 function term(){let v=atom();while(tokens[i]==='*'||tokens[i]==='/'){
  const op=tokens[i++],w=atom();v=op==='*'?v*w:v/w;
 }return v}
 function expr(){let v=term();while(tokens[i]==='+'||tokens[i]==='-'){
  const op=tokens[i++],w=term();v=op==='+'?v+w:v-w;
 }return v}
 const value=expr();assert.equal(i,tokens.length,'unparsed remainder in '+source);return value;
}
function lines(stem){
 return [...stem.matchAll(/\$y=([^$]+)\$/g)].map(m=>({
  m:numberAt(m[1],1)-numberAt(m[1],0),b:numberAt(m[1],0)
 }));
}
function points(stem){
 return [...stem.matchAll(/\$(?:[AB])?\((k|[+-]?\d+),\s*([+-]?\d+)\)\$/g)]
  .map(m=>[m[1]==='k'?null:Number(m[1]),Number(m[2])]);
}
function fromStem(q){
 const n=Number(q.sourceId.slice(-3)),e=lines(q.stem),p=points(q.stem);
 const gradient=(a,b)=>(b[1]-a[1])/(b[0]-a[0]);
 const cross=(a,b)=>{const x=(b.b-a.b)/(a.m-b.m);return [x,a.m*x+a.b]};
 const bisector=(a,b)=>{
  const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],m=-1/gradient(a,b);
  return {m,b:mid[1]-m*mid[0],mid};
 };
 if(n<=4){const m=gradient(p[0],p[1]);return p[2][0]+p[2][1]*m}
 if(n<=8)return bisector(p[0],p[1]).b;
 if(n<=12){const P=cross(e[0],e[1]);return P[1]-e[2].m*P[0]}
 if(n<=16){const P=cross(e[0],e[1]);return P[0]+P[1]*e[2].m}
 if(n<=20)return cross(bisector(p[0],p[1]),e[0])[0];
 if(n<=24){
  const l=e[0],mid=[-l.b/l.m/2,l.b/2];
  return mid[1]+mid[0]/l.m;
 }
 if(n<=28){const P=cross(e[0],e[1]);return P[0]-P[1]/gradient(p[0],p[1])}
 if(n<=32)return p[1][0]-(p[0][1]-p[1][1])*e[0].m;
 if(n<=36){const P=cross(e[0],e[1]);return P[0]+P[1]*gradient(p[0],p[1])}
 const b=bisector(p[0],p[1]),P=cross(b,e[0]);
 if(n===37)return P[0]*P[0]+P[1]*P[1];
 if(n===38)return Math.abs(P[0]*P[1])/2;
 if(n===39)return P[1]-b.mid[1];
 if(n===40)return P[1]/P[0];
 throw Error('Unknown question geometry family: '+q.sourceId);
}
test('40 revised straight-line graph stems: independently compute answer from original coordinates and line statements',()=>{
 assert.equal(questions.length,40);
 const sourceIds=new Set();let checkedOptions=0;
 for(const q of questions){
  assert.ok(!sourceIds.has(q.sourceId),'duplicate '+q.sourceId);sourceIds.add(q.sourceId);
  const computed=fromStem(q),key=numberAt(q.correctAnswerLatex);
  assert.ok(near(computed,key),q.sourceId+' wrong candidate answer: expected '+computed+' got '+key);
  assert.equal(q.options.length,6);
  const vals=q.options.map(o=>[o.id,numberAt(o.latex)]);
  assert.ok(vals.every((a,i)=>vals.every((b,j)=>i===j||!near(a[1],b[1])),
    q.sourceId+' numerically equivalent A-F options');
  assert.equal(vals.filter(([id,v])=>near(v,computed)).length,1,
    q.sourceId+' has multiple correct or no correct alternatives');
  assert.ok(near(vals.find(([id])=>id===q.correctOptionId)[1],computed),
    q.sourceId+' wrong stored key ID');
  assert.equal(q.dailyEligible,false,'QA candidate cannot award credit '+q.sourceId);
  checkedOptions+=vals.length;
 }
 assert.equal(checkedOptions,240);
});
test('12 perpendicular bisector variants remain Spring taught-scope holds, not approved Autumn daily',()=>{
 const ids=new Set([5,6,7,8,17,18,19,20,37,38,39,40].map(x=>String(x).padStart(3,'0')));
 const held=questions.filter(q=>ids.has(q.sourceId.slice(-3)));
 assert.equal(held.length,12);
 for(const q of held){
  assert.match(q.stem,/perpendicular bisector/i);
  assert.equal(q.dailyEligible,false);
 }
});
