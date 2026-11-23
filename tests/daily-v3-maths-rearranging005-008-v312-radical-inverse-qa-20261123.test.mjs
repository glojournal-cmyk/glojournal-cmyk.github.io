import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const pack=JSON.parse(readFileSync(new URL('../qa-staging/math-v312-rearranging005-008-radical-inverse-reasoning-candidates-20261123.json',import.meta.url),'utf8'));
const original=JSON.parse(readFileSync(new URL('../qa-staging/math-v311-reviewed-200.json',import.meta.url),'utf8'));
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const letters=['A','B','C','D','E','F'];

function brace(s,start){
 assert.equal(s[start],'{','Expected LaTeX opening brace');
 let depth=0;
 for(let i=start;i<s.length;i++){
  if(s[i]==='{')depth++;
  else if(s[i]==='}'&&--depth===0)return [s.slice(start+1,i),i+1];
 }
 throw Error('Unclosed LaTeX braces '+s);
}
function expanded(tex){
 const s=tex.replace(/\s/g,''),out=[];
 for(let i=0;i<s.length;){
  if(s.startsWith('\\frac',i)||s.startsWith('\\dfrac',i)){
   const p=i+(s.startsWith('\\dfrac',i)?6:5);
   const [top,j]=brace(s,p),[bottom,k]=brace(s,j);
   out.push('(('+expanded(top)+')/('+expanded(bottom)+'))');i=k;
  }else if(s.startsWith('\\sqrt',i)){
   const [rad,j]=brace(s,i+5);
   out.push('sqrt('+expanded(rad)+')');i=j;
  }else if(s[i]==='{'){
   const [inner,j]=brace(s,i);out.push('('+expanded(inner)+')');i=j;
  }else{out.push(s[i]);i++;}
 }
 return out.join('');
}
function calculate(tex,vars={}){
 const expr=expanded(tex),tokens0=[...expr.matchAll(/sqrt|\d+(?:\.\d+)?|[a-z]|[()+\-*/^]/g)].map(m=>m[0]);
 assert.equal(tokens0.join(''),expr,'Cannot parse source-derived formula '+tex);
 const tokens=[];
 const ends=s=>/^\d|^[a-z]$|^\)$/.test(s);
 const begins=s=>/^\d|^[a-z]$|^\($|^sqrt$/.test(s);
 for(let i=0;i<tokens0.length;i++){
  if(i&&ends(tokens0[i-1])&&begins(tokens0[i]))tokens.push('*');
  tokens.push(tokens0[i]);
 }
 let i=0;
 function atom(){
  const s=tokens[i++];
  if(s==='('){const v=sum();assert.equal(tokens[i++],')');return v;}
  if(s==='sqrt'){assert.equal(tokens[i++],'(');const v=sum();assert.equal(tokens[i++],')');return Math.sqrt(v);}
  if(/^\d/.test(s||''))return Number(s);
  if(/^[a-z]$/.test(s||'')){assert.ok(Object.hasOwn(vars,s),'Unknown variable '+s);return vars[s];}
  throw Error('Bad algebra token '+s);
 }
 function unary(){
  if(tokens[i]==='-'){i++;return -unary();}
  if(tokens[i]==='+'){i++;return unary();}
  return atom();
 }
 function power(){
  const v=unary();if(tokens[i]==='^'){i++;return v**power();}return v;
 }
 function mul(){
  let v=power();
  while(tokens[i]==='*'||tokens[i]==='/'){
   const op=tokens[i++],rhs=power();
   v=op==='*'?v*rhs:v/rhs;
  }
  return v;
 }
 function sum(){
  let v=mul();
  while(tokens[i]==='+'||tokens[i]==='-'){
   const op=tokens[i++],rhs=mul();
   v=op==='+'?v+rhs:v-rhs;
  }
  return v;
 }
 const value=sum();assert.equal(i,tokens.length,'Unparsed algebra '+tex);
 return value;
}
function splitFormula(option){
 const pieces=option.latex.split(',').map(s=>s.trim());
 assert.equal(pieces.length,2,'Each option must state an expression and exact admissibility clause');
 assert.match(pieces[0],/^x=/);
 return {expression:pieces[0].slice(2),restriction:pieces[1]};
}
function intervals(t){
 const s=t.replace(/\s/g,'');
 let m=s.match(/^y(\\ge|>|\\le|<)(\d+)$/);
 if(m)return {kind:'lower',bound:Number(m[2]),closed:m[1]==='\\ge'};
 m=s.match(/^(\d+)(\\le|<)y(\\le|<)(\d+)$/);
 if(m)return {kind:'both',lower:Number(m[1]),upper:Number(m[4]),
  lowerClosed:m[2]==='\\le',upperClosed:m[3]==='\\le'};
 throw Error('Cannot read output restriction '+s);
}
const causalText={
  5:{A:/wrong sign/i,C:/square only the numerator/i,D:/Fail to square/i,
    E:/exclude x=0/i,F:/at least zero/i},
  6:{A:/smaller quadratic root/i,B:/permitted boundary/i,C:/plus rather than a minus/i,
    E:/Forget to square/i,F:/without squaring the denominator/i},
  7:{A:/Invert the ratio/i,B:/Exclude the allowed endpoint/i,C:/Include y=1/i,
    D:/wrong sign/i,E:/Forget to square/i},
  8:{A:/Exclude y=3/i,C:/squaring 3/i,D:/Discard the valid/i,
    E:/another square root/i,F:/two distinct non-negative solutions at y=0/i}
};
function proof(q){
 const n=Number(q.sourceId.slice(-3)),s=q.stem;
 if(n===5){
  const m=s.match(/y=\\sqrt\{x\+(\d+)\}\+\\sqrt\{x\}/),d=s.match(/x\\ge(\d+)/);
  assert.ok(m&&d,'Two-root source coefficients missing');
  const k=Number(m[1]),xmin=Number(d[1]),ymin=Math.sqrt(k+xmin)+Math.sqrt(xmin);
  assert.equal(xmin,0);assert.equal(ymin,2);
  const samples=[2,2.5,3,4,5,8];
  const correct=y=>(y*y-k)**2/(4*y*y);
  for(const option of q.options){
   const {expression,restriction}=splitFormula(option),R=intervals(restriction);
   const expectedMin=option.id==='F'?0:ymin,strict=option.id==='E';
   assert.deepEqual(R,{kind:'lower',bound:expectedMin,closed:!strict},
    'Q5 wrong lower output threshold '+option.id);
   for(const y of samples){
    const alt=calculate(expression,{y});
    const expected=option.id==='A'?(y*y+k)**2/(4*y*y):
     option.id==='C'?(y*y-k)**2/(4*y):
     option.id==='D'?(y*y-k)/(2*y):correct(y);
    assert.ok(near(alt,expected),'Q5 incorrect mathematical causal option '+option.id);
    if(option.id==='B'){
     const x=correct(y);
     assert.ok(near(Math.sqrt(x+k)+Math.sqrt(x),y),'Q5 inverse fails source substitution');
    }
   }
  }
  assert.equal(q.correctOptionId,'B');
 }else if(n===6){
  const m=s.match(/y=\\sqrt\{x\+(\d+)\}\+\\frac\{(\d+)\}\{\\sqrt\{x\+(\d+)\}\}/),d=s.match(/x\\ge(\d+)/);
  assert.ok(m&&d,'Root plus reciprocal-root source missing');
  const [shift,k,secondShift]=m.slice(1).map(Number),xmin=Number(d[1]);
  assert.equal(shift,secondShift,'Both expressions must share the same radical');
  const tmin=Math.sqrt(xmin+shift);
  assert.ok(near(tmin*tmin,k),'Peak-branch location does not match x restriction');
  const ymin=2*Math.sqrt(k);
  const yValues=[ymin,ymin+.25,5,6,8,12];
  const tplus=y=>(y+Math.sqrt(y*y-4*k))/2;
  const tminus=y=>(y-Math.sqrt(y*y-4*k))/2;
  const correct=y=>tplus(y)**2-shift;
  for(const o of q.options){
   const {expression,restriction}=splitFormula(o),R=intervals(restriction);
   assert.deepEqual(R,{kind:'lower',bound:ymin,closed:o.id!=='B'},'Q6 exact lower boundary '+o.id);
   for(const y of yValues){
    const alt=calculate(expression,{y}),want=
     o.id==='A'?tminus(y)**2-shift:
     o.id==='C'?((y+Math.sqrt(y*y+4*k))/2)**2-shift:
     o.id==='E'?tplus(y)-shift:
     o.id==='F'?(y+Math.sqrt(y*y-4*k))**2/2-shift:correct(y);
    assert.ok(near(alt,want),'Q6 wrong-root derivation does not match '+o.id);
    if(o.id==='D'){
     const x=alt,t=Math.sqrt(x+shift);
     assert.ok(x>=xmin-1e-9);
     assert.ok(near(t+k/t,y),'Q6 plus-branch inverse does not reconstruct given source');
    }
   }
  }
  assert.equal(q.correctOptionId,'D');
 }else if(n===7){
  const m=s.match(/y=\\frac\{\\sqrt\{x\+(\d+)\}-(\d+)\}\{\\sqrt\{x\+(\d+)\}\+(\d+)\}/),b=s.match(/x\\ge(-?\d+)/);
  assert.ok(m&&b,'Nested sqrt-rational source missing');
  const [shift,a,secondShift,secondA]=m.slice(1).map(Number),xmin=Number(b[1]);
  assert.equal(shift,secondShift);assert.equal(a,secondA);
  assert.ok(near(Math.sqrt(xmin+shift),a),'Original x endpoint should generate y=0');
  const vals=[0,.1,.25,.5,.75,.9],u=y=>a*(1+y)/(1-y),correct=y=>u(y)**2-shift;
  for(const o of q.options){
   const {expression,restriction}=splitFormula(o),R=intervals(restriction);
   assert.deepEqual(R,{kind:'both',lower:0,upper:1,lowerClosed:o.id!=='B',upperClosed:o.id==='C'},
    'Q7 source domain/range should have correct half-open endpoint logic');
   for(const y of vals){
    const result=calculate(expression,{y}),wrong=o.id==='A'?(a*(1-y)/(1+y))**2-shift:
     o.id==='D'?u(y)**2+shift:
     o.id==='E'?u(y)-shift:correct(y);
    assert.ok(near(result,wrong),'Q7 causal wrong inverse cannot be reproduced '+o.id);
    if(o.id==='F'){
     const x=result,t=Math.sqrt(x+shift);
     assert.ok(x>=xmin-1e-9);
     assert.ok(near((t-a)/(t+a),y),'Q7 inverse does not reconstruct original');
    }
   }
  }
  assert.equal(q.correctOptionId,'F');
 }else if(n===8){
  const m=s.match(/y=\\sqrt\{\(x-(\d+)\)\^2\}/),b=s.match(/x\\ge(-?\d+)/);
  assert.ok(m&&b,'Source square-root absolute value missing');
  const center=Number(m[1]),xmin=Number(b[1]);assert.equal(xmin,0);
  const sampleY=[0,.1,1,2,3,3.1,4,9,10];
  for(const o of q.options){
   const {expression,restriction}=splitFormula(o),R=intervals(restriction);
   const expectedRange=o.id==='F'?{kind:'lower',bound:0,closed:true}:
    {kind:'both',lower:0,upper:o.id==='C'?center*center:center,
     lowerClosed:false,upperClosed:o.id!=='A'};
   assert.deepEqual(R,expectedRange,'Q8 wrong two-solution interval '+o.id);
   assert.match(expression,/^3(?:\\pm y|\+y|\\pm\\sqrt\{y\})$/);
   for(const y of sampleY){
    const branch=expression.includes('\\pm')?
     [calculate(expression.replace('\\pm','+'),{y}),calculate(expression.replace('\\pm','-'),{y})]:
     [calculate(expression,{y})];
    const solutionCount=branch.filter(x=>x>=xmin-1e-9&&near(Math.sqrt((x-center)**2),y)).length;
    const claimed=R.kind==='lower'?y>=0:y>0&&y<=(o.id==='C'?center*center:center)
      &&(o.id!=='A'||y<center);
    const actuallyTwo=y>0&&y<=center;
    if(o.id==='B')assert.equal(claimed,actuallyTwo,'Q8 claimed true interval is wrong at y='+y);
    if(o.id==='B'&&claimed){
     assert.equal(solutionCount,2,'Both branches must be valid and distinct at y='+y);
     assert.ok(!near(branch[0],branch[1]));
    }
    if(o.id==='D'&&y===2)assert.equal(solutionCount,1,'Missing lower branch must be diagnosed');
    if(o.id==='E'&&y===2)assert.equal(solutionCount,0,'Spurious second root must not pass');
    if(o.id==='F'&&y===4)assert.equal(solutionCount,1,'Negative branch above y=3 is excluded');
   }
  }
  assert.equal(q.correctOptionId,'B');
 }else throw Error('Unexpected source '+q.sourceId);
 for(const o of q.options.filter(o=>o.id!==q.correctOptionId)){
  assert.ok(o.errorPath?.length>=35,'Distractor must explain underlying wrong operation');
  assert.match(o.errorPath,causalText[n][o.id],
   q.sourceId+' '+o.id+' error rationale not tied to actual wrong method');
 }
}
function inspect(q){
 const old=original.questions.find(old=>old.sourceId===q.sourceId);
 assert.ok(old&&old.dailyEligible===false,'Original review source missing or approved');
 assert.notEqual(old.stem,q.stem);
 assert.equal(q.replacesRevisionId,old.revisionId);
 assert.notEqual(q.revisionId,old.revisionId);
 assert.equal(q.academicQA,'pending');
 for(const k of ['dailyEligible','masteryEligible','independentGradeCalibrated','independentStudentMisconceptionCertified'])
  assert.equal(q[k],false,'Forged educational permission '+q.sourceId+' '+k);
 assert.equal(q.options.length,6);
 assert.deepEqual(q.options.map(o=>o.id),letters);
 assert.equal(new Set(q.options.map(o=>o.latex)).size,6,'Duplicate A-F mathematical statement');
 assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===q.correctOptionId).latex);
 assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);
 for(const o of q.options)assert.match(mathsOptionHTML(o),/^<math xmlns=/);
 assert.equal(q.workedSolutionSteps.length,3);
 for(const s of q.workedSolutionSteps){
  assert.ok(s.length>=35,'Incomplete worked step');
  assert.ok(mathsRichTextHTML(s).includes('<math xmlns='),'Model solution must render');
 }
 proof(q);
}
test('Four distinct root inverse/rearrangement reasoning questions, 24 statements and source-derived domain constraints',()=>{
 assert.equal(pack.kind,'STANDALONE_QA_REPLACEMENT_CANDIDATES_NOT_APPROVED');
 assert.equal(pack.questions.length,4);
 assert.equal(original.questions.length,200);
 assert.deepEqual(pack.questions.map(q=>q.sourceId.slice(-3)),['005','006','007','008']);
 for(const q of pack.questions)inspect(q);
 assert.equal(original.questions.filter(q=>q.dailyEligible===true).length,0);
});
test('source coefficient changes, wrong keys, false endpoint, wrong formula and forged Daily approval must each fail',()=>{
 const replacements={
  '005':['\\sqrt{x+4}','\\sqrt{x+9}'],
  '006':['\\frac{4}{\\sqrt{x+1}}','\\frac{5}{\\sqrt{x+1}}'],
  '007':['\\sqrt{x+2}-1','\\sqrt{x+2}-2'],
  '008':['(x-3)^2','(x-4)^2']
 };
 for(const q of pack.questions){
  const clone=()=>JSON.parse(JSON.stringify(q));
  const badKey=clone();badKey.correctOptionId=q.correctOptionId==='B'?'A':'B';
  assert.throws(()=>inspect(badKey));
  const badWrong=clone();
  badWrong.options.find(o=>o.id!==q.correctOptionId).latex='x=999, y>0';
  assert.throws(()=>inspect(badWrong));
  const changedCorrect=clone();
  changedCorrect.options.find(o=>o.id===q.correctOptionId).latex+=';y\\ne999';
  assert.throws(()=>inspect(changedCorrect));
  const changedSource=clone(),[before,after]=replacements[q.sourceId.slice(-3)];
  assert.ok(changedSource.stem.includes(before));
  changedSource.stem=changedSource.stem.replace(before,after);
  assert.throws(()=>inspect(changedSource));
  const badRationale=clone();badRationale.options.find(o=>o.id!==q.correctOptionId).errorPath='An invented misconception without a matching mathematical operation.';
  assert.throws(()=>inspect(badRationale));
  const forged=clone();forged.dailyEligible=true;assert.throws(()=>inspect(forged));
 }
});
