import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scoreConceptChoices} from '../assets/food-tests-structured-concept-checks-20261122.js';
import {canEarnFormalCredit,foodTestsPupilVerdict} from '../assets/food-tests-qa-credit-gate-20261122.js';
import {verifiedQuizSlots} from '../assets/daily-session-credit-20261021.js';
import {addMasteryEvidence} from '../assets/mastery-v2-20261018.js';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const read=p=>JSON.parse(raw(p));
const c=read('qa/food-tests-143-consolidated-held-candidate-20261124.json');
const probes=read('qa/food-tests-typed-15-adversarial-probes-20261123.json');
const qs=c.groups.filter(g=>g.question).map(g=>g.question);
function extract(s,n){
 const a=s.indexOf(n);assert.ok(a>=0,n);
 const b=s.indexOf('{',a);let level=0;
 for(let k=b;k<s.length;k++){if(s[k]==='{')level++;else if(s[k]==='}'&&--level===0)return s.slice(a,k+1);}
 throw Error('unclosed '+n);
}
// Execute the actual imported AS normalizer and B/L/I scorer code.
// Only unrelated legacy prose scorers are stubbed; no full React/iPad player claim.
const d=extract(raw('assets/index-BLVOhKhN.core.js'),'function AS(');
function makeScore(path){
 const s=raw(path);
 const names=['function scienceProse(','function scienceSymbolConflict(','function CY(','function I(e){','function L(e){','function reviewedMark(','function B(e,t,n,r)'];
 if(s.includes('function scienceConclusionEquivalent('))names.unshift('function scienceConclusionEquivalent(');
 return new Function('scoreFoodTestsGuarded','scoreFoodTestsEthanolSafety','scoreFoodTestsRemaining37',d+'\nconst d=AS;\n'+names.map(n=>extract(s,n)).join('\n')+'\nreturn B;')(()=>null,()=>null,()=>null);
}
for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
 test(path+': all current MC options, accepted typed variants, contradictions and matching masks',()=>{
  const score=makeScore(path);let count=0;
  const check=(q,a,r,expected,total=1)=>{const z=score(q,a,'biology',r);assert.equal(z.score,expected,q.id+' / '+JSON.stringify(a)+' '+JSON.stringify(r));assert.equal(z.total,total);count++;};
  for(const q of qs){
   if(q.format.startsWith('typed')){
    for(const a of q.answer.accepted)check(q,a,{},1);
    const p=probes.questions.find(x=>x.questionId===q.id);
    for(const a of [p.invalidAlternative,'not '+q.answer.accepted[0],q.answer.accepted[0]+' but the correct answer is '+p.invalidAlternative])check(q,a,{},0);
   }else if(q.format==='matching'){
    const pairs=q.answer.pairs;assert.equal(pairs.length,4);
    for(let mask=0;mask<16;mask++){
     const responses=Object.fromEntries(pairs.map((p,i)=>[p.left,mask&(1<<i)?p.right:pairs[(i+1)%4].right]));
     check(q,'',{pairs:responses},mask.toString(2).split('1').length-1,4);
    }
   }else if(q.format==='mc_single')for(const a of q.options)check(q,a,{},Number(q.answer.accepted.includes(a)));
  }
  assert.equal(count,478);
 });
 test(path+': iodine negative evidence alternatives accepted, contradictory conclusions and disputed shorthand remain held',()=>{
  const score=makeScore(path),q=qs.find(q=>q.id===c.scoringFollowup.sourceId);
  for(const a of c.scoringFollowup.addedAccepted){
   assert.equal(score(q,a,'biology',{}).score,1,a);
   assert.equal(score(q,'not '+a,'biology',{}).score,0,a);
   assert.equal(score(q,a+' but starch was detected','biology',{}).score,0,a);
  }
  for(const a of ['starch is absent','no starch present','starch is not present','no starch is present','no starch was detected but it was present','not no starch was detected'])assert.equal(score(q,a,'biology',{}).score,0,a);
  assert.equal(canEarnFormalCredit(q),false);
 });
}
test('actual structured scorer: all 396 choices and all complete combinations of 52 groups, never formal credit',()=>{
 let choices=0,combinations=0;
 for(const g of c.groups.filter(g=>g.kind==='structured-candidate')){
  const held={...g,totalMarks:g.sourceTotalMarks,academicReview:'pending'};
  const correct=Object.fromEntries(g.parts.map(p=>[p.pointId,p.correctOptionId]));
  const blocked=scoreConceptChoices(held,correct);
  assert.equal(blocked.status,'academic-qa-pending');assert.equal(blocked.score,0);assert.equal(blocked.formalCreditEligible,false);
  const fixture={...held,academicReview:'approved',parts:g.parts.map(p=>({...p,approved:true}))};
  for(const p of fixture.parts)for(const o of p.options){
   const z=scoreConceptChoices(fixture,{[p.pointId]:o.id});
   assert.equal(z.score,Number(o.id===p.correctOptionId));assert.equal(z.formalCreditEligible,false);choices++;
  }
  function walk(i,answers,expected){
   if(i===fixture.parts.length){const z=scoreConceptChoices(fixture,answers);assert.equal(z.score,expected);assert.equal(z.total,fixture.parts.length);assert.equal(z.formalCreditEligible,false);combinations++;return;}
   const p=fixture.parts[i];for(const o of p.options)walk(i+1,{...answers,[p.pointId]:o.id},expected+Number(o.id===p.correctOptionId));
  }
  walk(0,{},0);
 }
 assert.equal(choices,396);assert.ok(combinations>396);console.log('Structured full combinations:',combinations);
});
test('all 190 integrated rotation units refuse direct and wrapped verified Daily / Mastery credit',()=>{
 const old={stage:'learning',roundTarget:20,attempts:[]};
 for(const u of c.rotation.units){
  const q={id:u.id,topicId:'unmapped-candidate'},alias={id:'display-wrapper-id',sourceId:u.sourceId,pointId:u.id,topicId:'unrelated'};
  for(const x of [q,alias]){
   assert.equal(canEarnFormalCredit(x),false);assert.equal(foodTestsPupilVerdict(x).score,null);
   const answers=[{questionId:x.id,correct:true,formal:true}];
   assert.deepEqual(verifiedQuizSlots([x],answers),[]);
   assert.strictEqual(addMasteryEvidence({masteryV2:old},{...x,questionId:x.id,year:8,mode:'mastery',day:'2026-11-24',correct:true,formal:true,format:'mc_single'}),old);
  }
 }
 assert.deepEqual(old.attempts,[]);
 assert.equal(verifiedQuizSlots([{id:'unrelated-id'}],[{questionId:'unrelated-id',correct:true,formal:true}]).length,1);
});

// The latest near-miss overlay is deliberately separate from the prior pinned package.
const nearMiss=read('qa/food-tests-16-near-miss-distractor-proposals-20261124.json');
function permutations(a){return a.length===0?[[]]:a.flatMap((v,i)=>permutations(a.filter((_,j)=>j!==i)).map(rest=>[v,...rest]));}
for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
 test(path+': all 16 near-miss draft cases score by answer text under all 24 option orders, but remain held',()=>{
  const score=makeScore(path);let checked=0;
  for(const row of nearMiss.items){
   const base=qs.find(q=>q.id===row.sourceId);assert.ok(base);
   assert.equal(base.prompt,row.prompt);assert.deepEqual(base.answer.accepted,row.sourceAnswer);
   const orders=permutations(row.newOptions);assert.equal(orders.length,24);
   for(const options of orders){
    const q={...base,options};
    for(const a of options){
     const expected=Number(a===row.sourceAnswer[0]),result=score(q,a,'biology',{});
     assert.equal(result.score,expected,q.id+' '+a);assert.equal(result.total,1);
     assert.equal(result.ok,expected===1);
     assert.equal(canEarnFormalCredit(q),false);
     assert.equal(foodTestsPupilVerdict(q).score,null);
     assert.deepEqual(verifiedQuizSlots([q],[{questionId:q.id,correct:true,formal:true}]),[]);
     checked++;
    }
   }
  }
  assert.equal(checked,16*24*4);
 });
}
