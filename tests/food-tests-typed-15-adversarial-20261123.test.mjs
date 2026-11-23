// Real QuizSession B() logic + explicit, bounded answer normaliser injected.
// QA-only diagnostics: tests do not approve any formal Food Tests credit.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isFoodTestsQaHeld,canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=JSON.parse(read('content/topics/bio-y8-food-tests.json'));
const probes=JSON.parse(read('qa/food-tests-typed-15-adversarial-probes-20261123.json'));
const byId=new Map(source.questions.map(q=>[q.id,q]));
function functionAt(s,needle){
 const a=s.indexOf(needle);
 if(a<0)return null;
 const open=s.indexOf('{',a);
 let level=0;
 for(let k=open;k<s.length;k++){
  if(s[k]==='{')level++;
  else if(s[k]==='}'&&--level===0)return s.slice(a,k+1);
 }
 throw Error('Could not close function '+needle);
}
function scorer(path){
 const s=read(path);
 const names=['function scienceProse(','function scienceConclusionEquivalent(',
  'function scienceSymbolConflict(','function CY(','function I(e){','function B(e,t,n,r)'];
 const impl=names.map(n=>{
  const code=functionAt(s,n);
  if(code)return code;
  if(n.includes('scienceConclusionEquivalent'))return 'function scienceConclusionEquivalent(){return false}';
  throw Error('Missing required scorer function '+path+': '+n);
 }).join('\n');
 // This is NOT the complete web app: the real B() and all its science
 // comparison functions run with an explicit deterministic normaliser, and
 // irrelevant rubric functions stubbed for typed-only inputs.
 const d=v=>String(v??'').normalize('NFKC').toLowerCase().replace(/[’']/g,'')
  .replace(/[^a-z0-9-]+/g,' ').replace(/\s+/g,' ').trim();
 return new Function('d','scoreFoodTestsGuarded','scoreFoodTestsEthanolSafety',
  'scoreFoodTestsRemaining37','L',impl+'\nreturn B;')(
   d,()=>null,()=>null,()=>null,q=>q.answer.accepted?.[0]||''
  );
}
test('15 QA probes match exact typed source IDs, and all remain academically held',()=>{
 assert.equal(source.questions.length,143);
 assert.equal(probes.questions.length,15);
 assert.equal(probes.boundaryCases.length,2);
 assert.equal(new Set(probes.questions.map(x=>x.questionId)).size,15);
 assert.equal(probes.approval,0);
 assert.equal(probes.released,false);
 for(const p of probes.questions){
  const q=byId.get(p.questionId);
  assert.ok(q,p.questionId);
  assert.ok(['typed_exact','typed_short'].includes(q.format));
  assert.ok(q.answer.accepted.includes(p.validAlternative),
    'new legitimate science spelling/phrase must be in source answer set: '+p.questionId);
  assert.ok(!q.answer.accepted.includes(p.invalidAlternative),
    'incorrect observation may not be listed among accepted variants: '+p.questionId);
  assert.ok(isFoodTestsQaHeld(q));
  assert.equal(canEarnFormalCredit(q),false);
 }
});
for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
 test(path+': 15 scientific positives accepted, 15 incorrect responses rejected',()=>{
  const score=scorer(path);
  for(const p of probes.questions){
   const q=byId.get(p.questionId);
   assert.equal(score(q,p.validAlternative,'biology',{}).score,1,
    path+' correctly accepts '+p.questionId+' / '+p.validAlternative);
   assert.equal(score(q,p.invalidAlternative,'biology',{}).score,0,
    path+' correctly rejects '+p.questionId+' / '+p.invalidAlternative);
  }
 });
 test(path+': false double-negation and explicit negation cannot earn the typed mark',()=>{
  const score=scorer(path);
  for(const c of probes.boundaryCases){
   const q=byId.get(c.questionId);
   assert.equal(score(q,c.answer,'biology',{}).score,0,
    path+' should reject '+c.answer);
  }
  for(const p of probes.questions){
   const q=byId.get(p.questionId);
   const contradiction='not '+q.answer.accepted[0];
   assert.equal(score(q,contradiction,'biology',{}).score,0,
    path+' should reject negated canonical answer '+p.questionId);
  }
 });
}
