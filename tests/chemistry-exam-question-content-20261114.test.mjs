import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const docs=[5,6,7].map(n=>JSON.parse(fs.readFileSync(new URL('../content/topics/chem-y9-c'+n+'.json',import.meta.url),'utf8')));
const questions=docs.flatMap(d=>d.questions.filter(q=>q.id.includes('nov16-2026-')));
const group=key=>questions.filter(q=>q.id.includes('-'+key+'-'));
const canonical=s=>String(s).normalize('NFKC').replace(/→/g,'->').replace(/\s+/g,'');
const counts=x=>Object.entries(x).sort(([a],[b])=>a.localeCompare(b));
function formulaAtoms(input){
 const text=canonical(input);let pos=0;const stack=[{}];
 while(pos<text.length){
  if(text[pos]==='('){stack.push({});pos++;continue;}
  if(text[pos]===')'){
   pos++;const digits=/^\d*/.exec(text.slice(pos))[0];pos+=digits.length;
   const elements=stack.pop();assert.ok(stack.length,'unbalanced parentheses');
   for(const [element,count] of Object.entries(elements))
    stack.at(-1)[element]=(stack.at(-1)[element]||0)+count*Number(digits||1);
   continue;
  }
  const match=/^([A-Z][a-z]?)(\d*)/.exec(text.slice(pos));
  assert.ok(match,'invalid chemical formula: '+input);
  stack.at(-1)[match[1]]=(stack.at(-1)[match[1]]||0)+Number(match[2]||1);
  pos+=match[0].length;
 }
 assert.equal(stack.length,1,'unclosed brackets: '+input);
 return stack[0];
}
function sideAtoms(input){
 const output={};
 for(const token of canonical(input).split('+')){
  const match=/^(\d*)(.+)$/.exec(token);
  assert.ok(match,'bad chemical species: '+token);
  for(const [element,value] of Object.entries(formulaAtoms(match[2])))
    output[element]=(output[element]||0)+Number(match[1]||1)*value;
 }
 return output;
}
const gcd=(a,b)=>b?gcd(b,a%b):a;

test('Chemistry November paper: all 62 questions are unique, complete, enabled and matched to scope',()=>{
 assert.equal(questions.length,62);
 assert.equal(new Set(questions.map(q=>q.id)).size,62);
 assert.deepEqual(['history','calc','formula','balance'].map(k=>group(k).length),[8,10,14,30]);
 for(const q of questions){
  assert.equal(q.year,9);assert.equal(q.status,'enabled');assert.equal(q.subject,'chemistry');
  assert.ok(q.prompt&&q.answer?.accepted?.length&&q.feedback?.steps?.[0],q.id);
 }
});

test('30 key equations: conserve every atom, need balancing, have minimal whole-number coefficients and element-specific feedback',()=>{
 for(const q of group('balance')){
  const original=q.prompt.match(/Balance this chemical equation: (.*?)\. Write/)?.[1];
  assert.ok(original,'No original equation: '+q.id);
  const output=q.answer.accepted[0];
  const [sourceL,sourceR]=canonical(original).split('->');
  const [keyL,keyR]=canonical(output).split('->');
  assert.ok(keyL&&keyR&&sourceL&&sourceR,q.id);
  assert.notDeepEqual(counts(sideAtoms(sourceL)),counts(sideAtoms(sourceR)),'Already balanced: '+q.id);
  assert.deepEqual(counts(sideAtoms(keyL)),counts(sideAtoms(keyR)),'Unbalanced key: '+q.id);
  const coeffs=canonical(output).split(/->|\+/).map(x=>Number(x.match(/^\d+/)?.[0]||1));
  assert.equal(coeffs.reduce(gcd),1,'Nonminimal coefficients: '+q.id);
  assert.match(q.feedback.steps[0],/Before balancing: reactants/);
  assert.match(q.feedback.steps[0],/Recount:/);
  assert.match(q.feedback.steps[1],/Marking \(1 mark\)/);
 }
});

test('14 ionic formula keys balance charges in the lowest whole-number ratio',()=>{
 const subToStandard=s=>s.replace(/[₀-₉]/g,c=>'₀₁₂₃₄₅₆₇₈₉'.indexOf(c));
 const superToStandard=s=>s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c));
 function readIon(s){
  const match=/^(.+?)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/.exec(s.trim());
  assert.ok(match,'Ion charge notation missing: '+s);
  return {atoms:formulaAtoms(subToStandard(match[1])),charge:Number(superToStandard(match[2])||1)*(match[3]==='⁺'?1:-1)};
 }
 for(const q of group('formula')){
  const match=q.prompt.match(/using these ions: (.*?) and (.*?)\. Give the formula only/);
  assert.ok(match,'Missing ion prompt: '+q.id);
  const plus=readIon(match[1]),minus=readIon(match[2]);
  assert.ok(plus.charge>0&&minus.charge<0,q.id);
  const total=Math.abs(plus.charge*minus.charge)/gcd(plus.charge,Math.abs(minus.charge));
  const nPlus=total/plus.charge,nMinus=total/Math.abs(minus.charge);
  const predicted={};
  for(const [ion,count] of [[plus,nPlus],[minus,nMinus]])for(const [element,n] of Object.entries(ion.atoms))
   predicted[element]=(predicted[element]||0)+n*count;
  assert.deepEqual(counts(formulaAtoms(q.answer.accepted[0])),counts(predicted),'Charge/atom imbalance: '+q.id);
  assert.match(q.feedback.steps[0],/The simplest neutral formula is/);
  assert.match(q.feedback.steps[1],/Marking \(1 mark\)/);
 }
});

test('10 atomic-structure numeric and shell answers are independently calculated',()=>{
 for(const q of group('calc')){
  const target=q.answer.accepted[0];
  if(q.prompt.includes('electron arrangement')){
   const electrons=Number(q.prompt.match(/with (\d+) electrons/)?.[1]);
   assert.ok(electrons>=1&&electrons<=20,q.id);
   let n=electrons;const shells=[];
   for(const cap of [2,8,8,2]){if(!n)break;const fill=Math.min(n,cap);shells.push(fill);n-=fill;}
   assert.equal(target,shells.join(','),q.id);
  }else{
   const mass=Number(q.prompt.match(/-([0-9]+) atom/)?.[1]);
   const atomic=Number(q.prompt.match(/atomic number (\d+)/)?.[1]);
   assert.ok(mass&&atomic,q.id);
   const expected=q.prompt.includes('How many neutrons')?mass-atomic:atomic;
   assert.equal(Number(target),expected,q.id);
  }
  assert.ok(q.feedback.steps?.length,q.id);
 }
});

test('8 atomic-history MCQs have one correct, four unique options, substantive explanations',()=>{
 const expected=[
  "Dalton's solid-sphere model","The electron","Most of an atom is empty space",
  "There is a small, dense, positively charged nucleus",
  "It lacked a concentrated positive nucleus capable of large deflections",
  "Electrons occupy particular shells or energy levels","James Chadwick",
  "New experimental evidence can disprove or improve existing explanations"
 ];
 const questions=group('history').sort((a,b)=>a.id.localeCompare(b.id));
 for(let i=0;i<questions.length;i++){
  const q=questions[i];
  assert.equal(q.answer.accepted[0],expected[i],q.id);
  assert.equal(q.options.length,4,q.id);
  assert.equal(new Set(q.options).size,4,q.id);
  assert.equal(q.options.filter(x=>x===expected[i]).length,1,q.id);
  assert.ok(q.feedback.steps[0].length>35,q.id);
 }
});
