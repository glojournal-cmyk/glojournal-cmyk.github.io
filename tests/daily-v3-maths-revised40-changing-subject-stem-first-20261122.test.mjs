import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const questions=bank.questions.filter(q=>q.topicId==='math-y9-changing-subject');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));

// Separate stem-first numerical grammar: no source key, solution text or stored family model used.
function expand(source){
 const s=source.replace(/\\left|\\right/g,'').replace(/\s/g,'');
 function group(pos){
  assert.equal(s[pos],'{','Missing maths group in '+s);
  let depth=0;
  for(let j=pos;j<s.length;j++){
   if(s[j]==='{')depth++;
   if(s[j]==='}'&&--depth===0)return [s.slice(pos+1,j),j+1];
  }
  throw Error('Unclosed maths group in '+s);
 }
 let out='';
 for(let i=0;i<s.length;){
  if(s.startsWith('\\dfrac',i)||s.startsWith('\\frac',i)){
   const p=i+(s.startsWith('\\dfrac',i)?6:5);
   const [a,j]=group(p),[b,k]=group(j);
   out+='(('+expand(a)+')/('+expand(b)+'))';i=k;
  }else if(s.startsWith('\\sqrt',i)){
   const [a,j]=group(i+5);out+='sqrt('+expand(a)+')';i=j;
  }else if(s[i]==='{'){
   const [a,j]=group(i);out+='('+expand(a)+')';i=j;
  }else out+=s[i++];
 }
 return out;
}
function evaluate(source,x=0,y=0){
 const s=expand(source),parts=s.match(/sqrt|\d+(?:\.\d+)?|[xy()+\-*/^]/g)||[];
 assert.equal(parts.join(''),s,'Unparsed mathematical expression: '+s);
 const tokens=[],ends=t=>/^\d|^[xy]$|^\)$/.test(t),
  starts=t=>/^\d|^[xy]$|^\($|^sqrt$/.test(t);
 for(let i=0;i<parts.length;i++){
  if(i&&ends(parts[i-1])&&starts(parts[i]))tokens.push('*');
  tokens.push(parts[i]);
 }
 let pos=0;
 function primary(){
  const t=tokens[pos++];
  if(t==='('){const n=expression();assert.equal(tokens[pos++],')');return n}
  if(t==='sqrt'){
   assert.equal(tokens[pos++],'(');
   const n=expression();assert.equal(tokens[pos++],')');return Math.sqrt(n);
  }
  if(t==='x')return x;if(t==='y')return y;
  if(/^\d/.test(t||''))return Number(t);
  throw Error('Bad arithmetic token: '+t+' in '+s);
 }
 function power(){let n=primary();if(tokens[pos]==='^'){pos++;n=n**unary()}return n}
 function unary(){
  if(tokens[pos]==='-'){pos++;return -unary()}
  if(tokens[pos]==='+'){pos++;return unary()}
  return power();
 }
 function term(){
  let n=unary();while(tokens[pos]==='*'||tokens[pos]==='/'){
   const op=tokens[pos++],v=unary();n=op==='*'?n*v:n/v;
  }return n;
 }
 function expression(){
  let n=term();while(tokens[pos]==='+'||tokens[pos]==='-'){
   const op=tokens[pos++],v=term();n=op==='+'?n+v:n-v;
  }return n;
 }
 const result=expression();assert.equal(pos,tokens.length,'Trailing tokens in '+s);
 return result;
}
function forwardFromActualStem(q,x){
 const math=[...q.stem.matchAll(/\$([^$]+)\$/g)].map(m=>m[1]);
 const equation=math.find(t=>t.includes('='));
 assert.ok(equation,'No rearrangement equation '+q.sourceId);
 const [left,right]=equation.split('=');
 if(left==='y')return evaluate(right,x);
 // Four reciprocal-of-y questions require inverting the actual left side.
 if(left==='\\dfrac{1}{y}')return 1/evaluate(right,x);
 throw Error('Unrecognised actual source left side '+left+' at '+q.sourceId);
}
test('40 revised subject formulas independently invert their actual stems at 920 valid samples',()=>{
 assert.equal(questions.length,40);
 const xs=[-37,-25,-17,-9,-6,-5,-4,-3,-2.5,-2,-1.5,-1,0,0.2,1,2,3,4,5,6,7,11,16,25,53,120];
 let tested=0,comparedPairs=0;
 for(const q of questions){
  assert.equal(q.dailyEligible,false,'staged subject item cannot award formal credit');
  assert.equal(q.options.length,6);
  const candidatePoints=xs.map(x=>({x,y:forwardFromActualStem(q,x)}))
   .filter(({y})=>Number.isFinite(y)&&Math.abs(y)<1e7);
  const rows=[];
  for(const point of candidatePoints){
   const options=q.options.map(o=>({id:o.id,value:evaluate(o.latex,0,point.y)}));
   const correct=options.find(o=>o.id===q.correctOptionId).value;
   if(!Number.isFinite(correct))continue;
   assert.ok(near(correct,point.x),q.sourceId+
    ' wrong revised inverse at x='+point.x+', y='+point.y);
   rows.push(options);tested++;
  }
  assert.ok(rows.length>=8,'Too few valid source samples: '+q.sourceId);
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
   let seenFinite=0,seenDifferent=false;
   for(const options of rows){
    const a=options[i].value,b=options[j].value;
    if(!Number.isFinite(a)||!Number.isFinite(b))continue;
    seenFinite++;
    if(!near(a,b))seenDifferent=true;
   }
   assert.ok(seenFinite>=5,'Insufficient option-pair domain points: '+q.sourceId);
   assert.ok(seenDifferent,q.sourceId+' equivalent option formulas '+
    q.options[i].id+' and '+q.options[j].id);
   comparedPairs++;
  }
 }
 assert.equal(tested,920);
 assert.equal(comparedPairs,40*15);
});
test('four reciprocal-left-side forms cannot be silently treated as y=f(x)',()=>{
 const rows=questions.filter(q=>/REARRANGING-0(19|20|21|22)$/.test(q.sourceId));
 assert.equal(rows.length,4);
 for(const q of rows){
  assert.match(q.stem,/\\dfrac\{1\}\{y\}=/);
  const y=forwardFromActualStem(q,1);
  assert.ok(Number.isFinite(y)&&y!==0);
 }
});
