import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const questions=bank.questions.filter(q=>q.topicId==='math-y9-simultaneous-equations');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));
function expand(source){
 const s=source.replace(/\\left|\\right/g,'').replace(/\s+/g,'');
 function group(p){
  assert.equal(s[p],'{','Missing brace at '+p+' in '+s);
  let depth=0;
  for(let j=p;j<s.length;j++){
   if(s[j]==='{')depth++;
   if(s[j]==='}'&&--depth===0)return [s.slice(p+1,j),j+1];
  }
  throw Error('Unclosed maths group '+s);
 }
 let out='';
 for(let i=0;i<s.length;){
  if(s.startsWith('\\dfrac',i)||s.startsWith('\\frac',i)){
   const n=s.startsWith('\\dfrac',i)?6:5;
   const [a,j]=group(i+n),[b,k]=group(j);
   out+='(('+expand(a)+')/('+expand(b)+'))';i=k;
  }else if(s.startsWith('\\times',i)){out+='*';i+=6}
  else if(s[i]==='{'){const [a,j]=group(i);out+='('+expand(a)+')';i=j}
  else out+=s[i++];
 }
 return out;
}
// Closed arithmetic parser. Independent from draft solution text, no eval or dynamic code.
function calculate(source,x=0,y=0,k=0){
 const s=expand(source),parts=s.match(/\d+(?:\.\d+)?|[xyk()+\-*/^]/g)||[];
 assert.equal(parts.join(''),s,'Unsupported stem arithmetic: '+s);
 const tokens=[],ends=u=>/^\d|^[xyk]$|^\)$/.test(u),
  starts=u=>/^\d|^[xyk]$|^\($/.test(u);
 for(let i=0;i<parts.length;i++){
  if(i&&ends(parts[i-1])&&starts(parts[i]))tokens.push('*');
  tokens.push(parts[i]);
 }
 let pos=0;
 function atom(){
  const t=tokens[pos++];
  if(t==='-')return -atom();if(t==='+')return atom();
  if(t==='('){const z=expr();assert.equal(tokens[pos++],')');return z}
  if(t==='x')return x;if(t==='y')return y;if(t==='k')return k;
  if(/^\d/.test(t||''))return Number(t);
  throw Error('Invalid mathematical atom '+t+' in '+s);
 }
 function pow(){
  let z=atom();if(tokens[pos]==='^'){pos++;z=Math.pow(z,pow())}
  return z;
 }
 function term(){
  let z=pow();while(tokens[pos]==='*'||tokens[pos]==='/'){
   const op=tokens[pos++],w=pow();z=op==='*'?z*w:z/w;
  }return z;
 }
 function expr(){
  let z=term();while(tokens[pos]==='+'||tokens[pos]==='-'){
   const op=tokens[pos++],w=term();z=op==='+'?z+w:z-w;
  }return z;
 }
 const result=expr();assert.equal(pos,tokens.length,'Trailing maths tokens '+s);
 return result;
}
function equation(source,k=0){
 const [left,right]=source.split('=');
 assert.ok(right!==undefined,'Missing equality: '+source);
 const f=(x,y)=>calculate(left,x,y,k)-calculate(right,x,y,k);
 const origin=f(0,0);
 return {a:f(1,0)-origin,b:f(0,1)-origin,c:-origin};
}
function system(stem,k=0){
 const m=stem.match(/\\begin\{cases\}([\s\S]+?)\\end\{cases\}/);
 assert.ok(m,'Missing 2-equation system in '+stem);
 const rows=m[1].split('\\\\');assert.equal(rows.length,2);
 return rows.map(row=>equation(row,k));
}
function solve(r,s){
 const det=r.a*s.b-s.a*r.b;
 assert.ok(Math.abs(det)>1e-10,'Question is unexpectedly dependent');
 return {x:(r.c*s.b-r.b*s.c)/det,y:(r.a*s.c-r.c*s.a)/det};
}
function wordProblem(stem,n){
 if(n>=5&&n<=8||n>=17&&n<=20){
  const costs=[...stem.matchAll(/(\d+) adult tickets? and (\d+) child tickets? costs? £(\d+)/g)]
   .map(m=>[Number(m[1]),Number(m[2]),Number(m[3])]);
  assert.equal(costs.length,2);
  const target=stem.match(/(?:How much do|What is the price of) (\d+) adult tickets? and (\d+) child tickets?/);
  assert.ok(target,'Missing ticket-cost target');
  const {x,y}=solve({a:costs[0][0],b:costs[0][1],c:costs[0][2]},
   {a:costs[1][0],b:costs[1][1],c:costs[1][2]});
  assert.ok(x>0&&y>0,'A price cannot be negative');
  return x*Number(target[1])+y*Number(target[2]);
 }
 if(n>=25&&n<=28){
  const masses=[...stem.matchAll(/total mass (\d+) kg/g)].map(m=>Number(m[1]));
  assert.equal(masses.length,2);
  assert.match(stem,/Three crates and two boxes/);
  assert.match(stem,/Two crates and five boxes/);
  const {x,y}=solve({a:3,b:2,c:masses[0]},{a:2,b:5,c:masses[1]});
  assert.ok(x>0&&y>0,'A crate or box cannot have negative mass');
  return n===25?x-y:n===26?2*x-y:n===27?x+2*y:3*x-y;
 }
 throw Error('Unrecognised word-problem family '+n);
}
function expectedFromStem(q){
 const n=Number(q.sourceId.slice(-3));
 if(n>=5&&n<=8||n>=17&&n<=20||n>=25&&n<=28)return wordProblem(q.stem,n);
 if(n>=13&&n<=16||n>=37){
  const [first,second0]=system(q.stem,0),[,second1]=system(q.stem,1);
  const det=k=>first.a*(second0.b+k*(second1.b-second0.b))
   -(second0.a+k*(second1.a-second0.a))*first.b;
  const root=-det(0)/(det(1)-det(0));
  assert.ok(Number.isFinite(root),'Degenerate parameter');
  const [a,b]=system(q.stem,root);
  assert.ok(near(a.a*b.b,a.b*b.a),'No-solution criterion missing parallelism');
  assert.ok(!near(b.c*a.a,a.c*b.a),'No-solution case is coincident');
  assert.ok(!near(det(root+1),0),'Parameter does not give unique no-solution condition');
  return root;
 }
 if(n>=33&&n<=36){
  assert.match(q.stem,/x=2y\+1/);
  const [first]=system(q.stem,0);
  const y=(first.c-first.a)/(2*first.a+first.b),x=2*y+1;
  const a=system(q.stem,0)[1],b=system(q.stem,1)[1];
  const zero=a.a*x+a.b*y-a.c,unit=b.a*x+b.b*y-b.c;
  return -zero/(unit-zero);
 }
 const [first,second]=system(q.stem);
 const {x,y}=solve(first,second);
 const final=[...q.stem.matchAll(/\$([^$]+)\$/g)].at(-1);
 assert.ok(final,'Missing requested output expression');
 return calculate(final[1],x,y);
}
test('all 40 revised simultaneous stems independently solved, 240 answers unique, no forged credit',()=>{
 assert.equal(questions.length,40);let checked=0;
 for(const q of questions){
  const calculated=expectedFromStem(q),key=calculate(q.correctAnswerLatex);
  assert.ok(near(calculated,key),q.sourceId+' stem/key mismatch '+calculated+' vs '+key);
  assert.equal(q.options.length,6,q.sourceId+' missing MC answers');
  const vals=q.options.map(o=>[o.id,calculate(o.latex)]);
  assert.ok(vals.every((a,i)=>vals.every((b,j)=>i===j||!near(a[1],b[1]))),
   q.sourceId+' numerically equivalent wrong choices');
  assert.equal(vals.filter(([id,value])=>near(value,calculated)).length,1,
   q.sourceId+' multiple correct responses');
  assert.ok(near(vals.find(([id])=>id===q.correctOptionId)[1],calculated),
   q.sourceId+' stored correct ID mismatch');
  assert.equal(q.dailyEligible,false,q.sourceId+' draft not allowed credit');
  checked+=vals.length;
 }
 assert.equal(checked,240);
});
test('eight parameter questions assert parallel but distinct, not coincident lines',()=>{
 const rows=questions.filter(q=>{const n=Number(q.sourceId.slice(-3));return n>=13&&n<=16||n>=37});
 assert.equal(rows.length,8);
 for(const q of rows)assert.match(q.stem,/no solution/);
});
