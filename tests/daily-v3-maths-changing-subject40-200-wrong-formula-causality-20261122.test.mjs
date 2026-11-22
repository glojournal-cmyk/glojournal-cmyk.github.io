import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bank=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const qs=bank.questions.filter(q=>q.topicId==='math-y9-changing-subject');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));
function unpack(expr){
 const s=expr.replace(/\\left|\\right/g,'').replace(/\s/g,'');
 function group(p){
  assert.equal(s[p],'{','Unrecognized source fraction brace in '+s);
  let d=0;for(let i=p;i<s.length;i++){
   if(s[i]==='{')d++;
   if(s[i]==='}'&&--d===0)return [s.slice(p+1,i),i+1];
  }
  throw Error('Unclosed source math '+s);
 }
 let out='';
 for(let i=0;i<s.length;){
  if(s.startsWith('\\dfrac',i)||s.startsWith('\\frac',i)){
   const p=i+(s.startsWith('\\dfrac',i)?6:5);
   const [a,j]=group(p),[b,k]=group(j);
   out+='(('+unpack(a)+')/('+unpack(b)+'))';i=k;
  }else if(s.startsWith('\\sqrt',i)){
   const [a,j]=group(i+5);out+='sqrt('+unpack(a)+')';i=j;
  }else if(s[i]==='{'){
   const [a,j]=group(i);out+='('+unpack(a)+')';i=j;
  }else out+=s[i++];
 }
 return out;
}
function evaluate(expr,x=0,y=0){
 const s=unpack(expr),items=s.match(/sqrt|\d+(?:\.\d+)?|[xy()+\-*/^]/g)||[];
 assert.equal(items.join(''),s,'Unrecognized math source in '+expr);
 const tokens=[],ends=t=>/^\d|^[xy]$|^\)$/.test(t),
  starts=t=>/^\d|^[xy]$|^\($|^sqrt$/.test(t);
 for(let i=0;i<items.length;i++){
  if(i&&ends(items[i-1])&&starts(items[i]))tokens.push('*');
  tokens.push(items[i]);
 }
 let p=0;
 function primary(){
  const t=tokens[p++];
  if(t==='('){const v=expression();assert.equal(tokens[p++],')');return v}
  if(t==='sqrt'){
   assert.equal(tokens[p++],'(');
   const v=expression();assert.equal(tokens[p++],')');return Math.sqrt(v);
  }
  if(t==='x')return x;if(t==='y')return y;
  if(/^\d/.test(t||''))return Number(t);
  throw Error('Unknown arithmetic token '+t+' in '+expr);
 }
 function power(){
  let v=primary();if(tokens[p]==='^'){p++;v=v**unary()}return v;
 }
 function unary(){
  if(tokens[p]==='-'){p++;return -unary()}
  if(tokens[p]==='+'){p++;return unary()}
  return power();
 }
 function term(){
  let v=unary();while(tokens[p]==='*'||tokens[p]==='/'){
   const op=tokens[p++],b=unary();v=op==='*'?v*b:v/b;
  }return v;
 }
 function expression(){
  let v=term();while(tokens[p]==='+'||tokens[p]==='-'){
   const op=tokens[p++],b=term();v=op==='+'?v+b:v-b;
  }return v;
 }
 const val=expression();assert.equal(p,tokens.length,'Unused math tokens in '+expr);return val;
}
function sourceFraction(src){
 const start=src.indexOf('\\dfrac')>=0?src.indexOf('\\dfrac'):src.indexOf('\\frac');
 assert.ok(start>=0,'Source must contain rational fraction');
 const length=src.startsWith('\\dfrac',start)?6:5,s=src.slice(start+length);
 function grp(pos){
  assert.equal(s[pos],'{');let d=0;
  for(let i=pos;i<s.length;i++){
   if(s[i]==='{')d++;if(s[i]==='}'&&--d===0)return [s.slice(pos+1,i),i+1];
  }
  throw Error('Unclosed nested fraction '+s);
 }
 const [num,p]=grp(0),[den]=grp(p);
 return {num,den};
}
function modelFromActualStem(q){
 const n=Number(q.sourceId.slice(-3)),
  equation=[...q.stem.matchAll(/\$([^$]+)\$/g)].map(m=>m[1]).find(t=>t.includes('='));
 assert.ok(equation,'Missing original equation');
 const [lhs,rhs]=equation.split('=');
 if(n>=5&&n<=8){
  const m=rhs.match(/^(\d+)\\sqrt\{(\d+)x\+(\d+)\}-(\d+)$/);
  assert.ok(m,'Unexpected original affine principal-root expression '+rhs);
  const [a,b,c,d]=m.slice(1).map(Number);
  return {family:'affine-root',a,b,c,d};
 }
 if(n>=25&&n<=28){
  const m=rhs.match(/^(\d+)\+\\dfrac\{(\d+)\}\{\\sqrt\{(\d+)x\+(\d+)\}\}$/);
  assert.ok(m,'Unexpected reciprocal root '+rhs);
  const [s,a,b,c]=m.slice(1).map(Number);
  return {family:'root-reciprocal',s,a,b,c};
 }
 if(n>=33&&n<=36){
  const m=rhs.match(/^(\d+)\+\\dfrac\{(\d+)\}\{(\d+)\+\\dfrac\{(\d+)\}\{x\+(\d+)\}\}$/);
  assert.ok(m,'Unexpected nested rational expression '+rhs);
  const [s,a,b,c,d]=m.slice(1).map(Number);
  return {family:'nested',s,a,b,c,d};
 }
 const {num,den}=sourceFraction(rhs),
  a=evaluate(num,1)-evaluate(num,0),b=evaluate(num,0),
  c=evaluate(den,1)-evaluate(den,0),d=evaluate(den,0);
 let s=0;
 if(lhs==='\\dfrac{1}{y}'){
  const match=rhs.match(/\}\+(\d+)$/);
  assert.ok(match,'Missing reciprocal-of-y shift');
  s=Number(match[1]);
 }else{
  assert.equal(lhs,'y','Unexpected dependent variable');
  const prefix=rhs.match(/^(\d+)\+/);
  if(prefix)s=Number(prefix[1]);
 }
 const family=lhs==='\\dfrac{1}{y}'?'reciprocal-y':
  rhs.includes('\\sqrt{')?'rational-root':'rational';
 return {family,a,b,c,d,s};
}
function forward(Q,x){
 if(Q.family==='affine-root')return Q.a*Math.sqrt(Q.b*x+Q.c)-Q.d;
 if(Q.family==='root-reciprocal')return Q.s+Q.a/Math.sqrt(Q.b*x+Q.c);
 if(Q.family==='nested')return Q.s+Q.a/(Q.b+Q.c/(x+Q.d));
 const quotient=(Q.a*x+Q.b)/(Q.c*x+Q.d);
 if(Q.family==='reciprocal-y')return 1/(Q.s+quotient);
 if(Q.family==='rational-root')return Q.s+Math.sqrt(quotient);
 return Q.s+quotient;
}
function reproducedWrongInverse(Q,y,r,sourceId){
 let z,U,V;
 if(Q.family==='affine-root'){
  const {a,b,c,d}=Q;z=(y+d)/a;
  const wrong={
   'Undo the square root without squaring.':(z-c)/b,
   'Add the constant inside the root when isolating x.':(z*z+c)/b,
   'Multiply by the coefficient of x at the final step.':b*(z*z-c),
   'Square the numerator but leave its divisor unsquared.':
    (((y+d)**2/a)-c)/b,
   'Move the outside subtraction with the wrong sign.':
    (((y-d)/a)**2-c)/b
  };
  if(Object.hasOwn(wrong,r))return wrong[r];
 }
 if(Q.family==='root-reciprocal'){
  const {s,a,b,c}=Q;z=y-s;
  const wrong={
   'Invert the reciprocal but omit the squaring step.':(a/z-c)/b,
   'Square the reciprocal of the required root.':((z/a)**2-c)/b,
   'Add the inner constant when isolating x.':(a*a/(z*z)+c)/b,
   'Multiply by the coefficient of x at the last step.':b*(a*a/(z*z)-c),
   'Move the outer shift with the wrong sign.':(a*a/(y+s)**2-c)/b
  };
  if(Object.hasOwn(wrong,r))return wrong[r];
 }
 if(Q.family==='nested'){
  const {s,a,b,c,d}=Q;
  z=a/(y-s)-b;U=z;V=c-d*z;
  const wrong={
   'Move the denominator constant across the equality without changing its sign.':
    (c+d*z)/U,
   'Multiply by the collected coefficient of x instead of dividing.':V*U,
   'Reverse the final division.':U/V,
   'Distribute the left multiplier to the x-term only.':(c-d)/U,
   'Drop the left multiplier from the coefficient of x.':V
  };
  if(Object.hasOwn(wrong,r))return wrong[r];
 }else if(['rational','reciprocal-y','rational-root'].includes(Q.family)){
  const {a,b,c,d,s}=Q;
  z=Q.family==='reciprocal-y'?1/y-s:
   Q.family==='rational-root'?(y-s)**2:y-s;
  U=c*z-a;V=b-d*z;
  // Five independently stated erroneous rearrangement operations:
  const wrong={
   'Move the denominator constant across the equality without changing its sign.':
    (b+d*z)/U,
   'Move the numerator x-term across without changing its sign.':
    V/(c*z+a),
   'Multiply by the collected coefficient of x instead of dividing.':V*U,
   'Reverse the final division.':U/V,
   'Distribute the left multiplier to the x-term only.':(b-d)/U,
   'Drop the left multiplier from the coefficient of x.':V/(c-a)
  };
  if(Object.hasOwn(wrong,r))return wrong[r];
  // Q23 has five custom algebraic error paths; calculate from actual stem.
  if(sourceId==='LUX-MATH-Y9-REARRANGING-023'){
   if(r.startsWith('Ignore the outer +1'))return (b-d*y)/(c*y-a);
   if(r.startsWith('After expanding z(x+6)=4x+5'))
    return (b+d*z)/(c*z-a);
   if(r.startsWith('Mistakenly distribute 6(y−1) as 6y−1'))
    return (b-(d*y-1))/(c*z-a);
   if(r.startsWith('Collect 4x on the wrong side'))
    return V/(c*z+a);
   if(r.startsWith('Add the external 1 instead of subtracting'))
    return (b-d*(y+s))/(c*(y+s)-a);
  }
 }
 throw Error(sourceId+' cannot derive stated mistaken inverse '+r);
}
test('200 revised Changing Subject wrong formula alternatives reproduce their claimed algebraic errors',()=>{
 assert.equal(qs.length,40);
 const samples=[-25,-16,-10,-7,-5,-4,-3,-2,-1,0,1,2,3,4,5,7,9,12,20,35,60,90];
 let checked=0,evaluations=0;
 for(const q of qs){
  assert.equal(q.dailyEligible,false,'Causal algebra is not independent GCSE Grade QA');
  const source=modelFromActualStem(q);
  for(const option of q.options.filter(o=>o.id!==q.correctOptionId)){
   let good=0;
   for(const x of samples){
    const y=forward(source,x);
    if(!Number.isFinite(y)||Math.abs(y)>1e7)continue;
    const wrong=reproducedWrongInverse(source,y,option.errorPath,q.sourceId);
    const answer=evaluate(option.latex,0,y);
    if(!Number.isFinite(wrong)||!Number.isFinite(answer)||
      Math.abs(wrong)>1e12||Math.abs(answer)>1e12)continue;
    assert.ok(near(wrong,answer),q.sourceId+' '+option.id+
     ': rationale yields '+wrong+' but displayed formula gives '+answer+
     ' at y='+y+'; '+option.errorPath);
    good++;evaluations++;
   }
   assert.ok(good>=8,'Insufficient source-derived mathematical domain probes '+q.sourceId+' '+option.id);
   checked++;
  }
 }
 assert.equal(checked,200);
 assert.ok(evaluations>=3500,'Insufficient cross-domain option proof coverage');
});
