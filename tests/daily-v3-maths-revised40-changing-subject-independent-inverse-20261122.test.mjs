import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>JSON.parse(readFileSync(new URL('../qa-staging/'+p,import.meta.url),'utf8'));
const bank=load('math-v311-reviewed-200.json');
const original=load('math-v311-changing-subject40-independent-inverse-check-20261122.json');
const topic=bank.questions.filter(q=>q.topicId==='math-y9-changing-subject');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));
function expandMath(tex){
 const input=tex.replace(/\\left|\\right/g,'').replace(/−/g,'-');let i=0;
 function group(){
  while(input[i]===' ')i++;
  if(input[i]!=='{')throw Error('Missing source math group: '+input.slice(i));
  i++;let depth=1,start=i;
  while(depth){if(i>=input.length)throw Error('Unclosed TeX math group');
   if(input[i]==='{')depth++;if(input[i]==='}')depth--;i++}
  return input.slice(start,i-1);
 }
 let out='';
 while(i<input.length){
  if(input.startsWith('\\dfrac',i)||input.startsWith('\\frac',i)){
   i+=input.startsWith('\\dfrac',i)?6:5;
   const num=group(),den=group();out+='(('+expandMath(num)+')/('+expandMath(den)+'))';
  }else if(input.startsWith('\\sqrt',i)){i+=5;out+='sqrt('+expandMath(group())+')'}
  else if(input.startsWith('\\times',i)||input.startsWith('\\cdot',i)){
   i+=input.startsWith('\\times',i)?6:5;out+='*';
  }else if(input[i]==='{'){out+='('+expandMath(group())+')'}
  else{out+=input[i];i++}
 }return out;
}
function evaluate(tex,y){
 const raw=expandMath(tex).replace(/\s+/g,'');
 const tokens=raw.match(/sqrt|\d+(?:\.\d+)?|[yY]|[()+\-*/^]/g)||[];
 if(tokens.join('')!==raw)throw Error('Unparsed TeX token in '+tex);
 const toks=[],end=t=>/^\d|^[yY]$|^\)$/.test(t),start=t=>/^\d|^[yY]$|^\($|^sqrt$/.test(t);
 for(let i=0;i<tokens.length;i++){
  if(i>0&&end(tokens[i-1])&&start(tokens[i]))toks.push('*');
  toks.push(tokens[i]);
 }
 let at=0;
 const precedence={'+':10,'-':10,'*':20,'/':20,'^':30};
 const parseAtom=()=>{
  const t=toks[at++];
  if(!t)throw Error('Unexpected end '+tex);
  if(t==='+'||t==='-'){const n=parse(29);return t==='-'?-n:n}
  if(t==='sqrt'){assert.equal(toks[at++],'(');const n=parse(0);assert.equal(toks[at++],')');return Math.sqrt(n)}
  if(t==='('){const n=parse(0);assert.equal(toks[at++],')');return n}
  if(t==='y'||t==='Y')return y;
  if(/^\d/.test(t))return Number(t);
  throw Error('Unexpected token '+t+' in '+tex);
 };
 const parse=threshold=>{
  let left=parseAtom();
  while(precedence[toks[at]]!==undefined&&precedence[toks[at]]>=threshold){
   const op=toks[at++],p=precedence[op],right=parse(p+(op==='^'?0:1));
   left=op==='+'?left+right:op==='-'?left-right:op==='*'?left*right:op==='/'?left/right:left**right;
  }
  return left;
 };
 const result=parse(0);
 if(at!==toks.length)throw Error('Unused TeX tokens '+toks.slice(at)+' in '+tex);
 return result;
}
function revisedForward(q,p,x){
 const f=p.verifiedStructuralFamily,v=p.sourceParameters,[a,b,c,d,e]=v;
 if(q.sourceId.endsWith('-025')||q.sourceId.endsWith('-026')||
    q.sourceId.endsWith('-027')||q.sourceId.endsWith('-028')){
    // Editorial revision changes sqrt(a/(b*x+c)) into a/sqrt(b*x+c).
    assert.equal(f,'root-reciprocal');
    const exact='\\dfrac{'+b+'}{\\sqrt{'+c+'x+'+d+'}}';
    assert.ok(q.stem.includes(exact),'Actual revised stem differs from modeled equation '+q.sourceId);
    return a+b/Math.sqrt(c*x+d);
 }
 switch(f){
 case 'simple-rational':case 'shifted-rational-original':case 'shifted-rational-secondary':
   return a+(b*x+c)/(d*x+e);
 case 'affine-surd':return a*Math.sqrt(b*x+c)-d;
 case 'shifted-reciprocal':return a+b/(c*x+d);
 case 'reciprocal-of-y':return 1/(a+b/(c*x+d));
 case 'root-reciprocal':return a+Math.sqrt(b/(c*x+d));
 case 'factor-fraction':return a+b*(x+c)/(d*x+e);
 case 'nested-denominator':return a+b/(c+d/(x+e));
 case 'surds-of-rational':return a+Math.sqrt((b*x+c)/(d*x+e));
 }
 throw Error('Unexpected original source family '+f);
}
test('40 revised subject questions: evaluate 40 keyed inverses and all 200 wrong options against actual revised source equations',()=>{
 assert.equal(topic.length,40);assert.equal(original.questions.length,40);
 const xs=[-37,-17,-9,-6,-5,-4,-3,-2.5,-2,-1.5,-1,0,0.2,1,2,3,4,5,6,7,11,16,25,53];
 let correctEvaluations=0,wrongCounterexamples=0,wrongEvaluations=0;
 for(let i=0;i<40;i++){
  const q=topic[i],source=original.questions[i];
  assert.equal(q.sourceId,source.sourceId);
  const pts=xs.map(x=>({x,y:revisedForward(q,source,x)}))
    .filter(pt=>Number.isFinite(pt.y)&&Math.abs(pt.y)<1e7);
  assert.ok(pts.length>=8,q.sourceId+' insufficient usable input values');
  for(const option of q.options){
   let used=0,wrong=0;
   for(const pt of pts){
    const recovered=evaluate(option.latex,pt.y);
    if(!Number.isFinite(recovered))continue;
    used++;
    if(!near(recovered,pt.x))wrong++;
   }
   assert.ok(used>=7,q.sourceId+' '+option.id+' fewer than seven finite tests');
   if(option.id===q.correctOptionId){
    assert.equal(wrong,0,q.sourceId+' keyed answer does not invert its revised stem');
    correctEvaluations+=used;
   }else{
    assert.ok(wrong>=1,q.sourceId+' '+option.id+' appears to be a second valid inverse');
    assert.ok(option.errorPath?.trim().length>=10);
    wrongCounterexamples++;wrongEvaluations+=used;
   }
  }
 }
 assert.equal(wrongCounterexamples,200);
 assert.ok(correctEvaluations>=480);
 assert.ok(wrongEvaluations>=2200);
});
test('Q105–108 square-root placement changed: old source model MUST NOT be used to judge revised keys',()=>{
 const four=topic.slice(24,28);
 assert.deepEqual(four.map(x=>x.sourceId),[25,26,27,28].map(n=>
  'LUX-MATH-Y9-REARRANGING-'+String(n).padStart(3,'0')));
 for(let i=0;i<4;i++){
  const q=four[i],[s,a,b,c]=original.questions[24+i].sourceParameters;
  assert.match(q.stem,/\\dfrac\{\d+\}\{\\sqrt\{/);
  const x=3,y=s+a/Math.sqrt(b*x+c),originalY=s+Math.sqrt(a/(b*x+c));
  assert.ok(!near(y,originalY));
  assert.ok(near(evaluate(q.correctAnswerLatex,y),x));
 }
});
