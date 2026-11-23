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

for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
 test(path+': exhaustive held typed source accepted-string matrix',()=>{
  const score=scorer(path);
  const typed=source.questions.filter(q=>['typed_exact','typed_short'].includes(q.format));
  assert.equal(typed.length,15);
  let checked=0;
  for(const q of typed){
   for(const alternative of q.answer.accepted){
    assert.equal(score(q,alternative,'biology',{}).score,1,
     path+' should accept source-listed response '+q.id+' / '+JSON.stringify(alternative));
    checked++;
   }
  }
  assert.ok(checked>=60,'source answer coverage must remain broad');
  for(const q of typed)assert.equal(canEarnFormalCredit(q),false);
 });
 test(path+': contradictory trailing and leading prose cannot earn a Food Tests typed mark',()=>{
  const score=scorer(path);
  for(const p of probes.questions){
   const q=byId.get(p.questionId);
   const misleading=p.validAlternative+' but the correct answer is '+p.invalidAlternative;
   const reversed=p.invalidAlternative+'; it is not '+p.validAlternative;
   assert.equal(score(q,misleading,'biology',{}).score,0,
     path+' must reject contradictory suffix '+p.questionId);
   assert.equal(score(q,reversed,'biology',{}).score,0,
     path+' must reject contradictory prefix '+p.questionId);
  }
 });
}

const extraProbes=JSON.parse(read('qa/food-tests-typed-15-unseen-paraphrases-20261123.json'));
test('15 previously unlisted learner-style scientific paraphrases have inspectable QA evidence only',()=>{
 assert.equal(extraProbes.count,15);
 assert.equal(extraProbes.probes.length,15);
 assert.equal(extraProbes.academicApproved,0);
 assert.equal(extraProbes.sourceEdited,true);
 assert.equal(extraProbes.status,'QA_BRANCH_ACCEPTED_VARIANTS_PENDING_INDEPENDENT_SIGNOFF');
 assert.deepEqual(extraProbes.probes.map(row=>row.questionId),
  source.questions.filter(q=>['typed_exact','typed_short'].includes(q.format)).map(q=>q.id));
 for(const row of extraProbes.probes){
  const q=byId.get(row.questionId);
  assert.ok(row.scienceBasis.length>25);
  assert.equal(q.answer.accepted.includes(row.pupilStyleAnswer),true,'uncredited after candidate addition: '+row.questionId);
  assert.equal(row.formalCreditEligible,false);
  assert.equal(canEarnFormalCredit(q),false);
 }
});
for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
 test(path+': unseen-style paraphrase diagnostic, no credit',()=>{
  const score=scorer(path),notAccepted=[];
  for(const row of extraProbes.probes){
   const result=score(byId.get(row.questionId),row.pupilStyleAnswer,'biology',{});
   assert.ok([0,1].includes(result.score),'unexpected numeric outcome '+row.questionId);
   if(result.score!==1)notAccepted.push({id:row.questionId,answer:row.pupilStyleAnswer,score:result.score});
   assert.equal(result.score,1,'bounded source-listed QA alternative must now be accepted: '+row.questionId);
  }
  console.log('DIAGNOSTIC '+path+': accepted '+(15-notAccepted.length)+'/15; undercredit_candidates='+JSON.stringify(notAccepted));
  assert.equal(extraProbes.academicApproved,0);
  assert.equal(extraProbes.sourceEdited,true);
 });
}

for(const path of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
 test(path+': expanded typed QA alternates do not accept adversarial negation or contradiction',()=>{
  const score=scorer(path);
  for(const row of extraProbes.probes){
   const q=byId.get(row.questionId);
   const knownBad=probes.questions.find(x=>x.questionId===row.questionId)?.invalidAlternative;
   assert.ok(knownBad,row.questionId);
   for(const wrong of ['not '+row.pupilStyleAnswer,row.pupilStyleAnswer+' but the correct answer is '+knownBad]){
    assert.equal(score(q,wrong,'biology',{}).score,0,path+' must reject '+row.questionId+' / '+wrong);
   }
   assert.equal(canEarnFormalCredit(q),false);
  }
 });
}
