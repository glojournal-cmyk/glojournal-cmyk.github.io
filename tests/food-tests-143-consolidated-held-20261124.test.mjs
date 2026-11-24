import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url));
const read=p=>JSON.parse(raw(p).toString('utf8'));
const c=read('qa/food-tests-143-consolidated-held-candidate-20261124.json');
const inputs=Object.fromEntries(c.inputs.map(x=>[x.key,read(x.path)]));
const groups=c.groups, units=c.rotation.units;
const pair=(a,b)=>[a,b].sort().join('|');
const edges=new Map(c.rotation.edges.map(x=>[pair(x.a,x.b),x]));
const byId=new Map(units.map(x=>[x.id,x]));
test('all 143 source IDs appear exactly once, all 190 rotation units are held, every input blob is pinned',()=>{
 for(const f of c.inputs){const b=raw(f.path);assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),f.blob);}
 assert.deepEqual(groups.map(x=>x.sourceId),inputs.source.questions.map(x=>x.id));
 assert.equal(groups.length,143);assert.equal(new Set(groups.map(x=>x.sourceId)).size,143);
 assert.equal(groups.filter(x=>x.kind==='retained').length,43);assert.equal(groups.filter(x=>x.kind==='replacement').length,48);assert.equal(groups.filter(x=>x.kind==='structured-candidate').length,52);
 assert.equal(units.length,190);assert.equal(byId.size,190);
 assert.equal(c.release,'BLOCKED');assert.equal(c.formalCreditEligible,false);assert.equal(c.counts.approved,0);
 for(const k of ['liveSelectorChanged','legacyFreeTextForFormalCredit','academicSignoff','scopeSignoff','deviceSignoff'])assert.equal(c.policy[k],false);
 for(const g of groups){
  assert.equal(g.formalCreditEligible,false);assert.equal(g.academicApproved,false);
  if(g.kind==='structured-candidate'){assert.equal(g.legacyFreeTextFormalCredit,false);assert.equal(g.parts.length,g.sourceTotalMarks);for(const p of g.parts){assert.equal(p.formalCreditEligible,false);assert.equal(p.approved,false);assert.equal(byId.get(p.pointId).sourceId,g.sourceId);assert.equal(byId.get(p.pointId).stem,p.stem);assert.equal(p.options.filter(o=>o.id===p.correctOptionId).length,1);}}
  else{const q=g.question;assert.equal(q.id,g.sourceId);assert.equal(q.formalCreditEligible,false);assert.equal(q.academicApproved,false);assert.equal(q.status,'qa-pending');assert.equal(byId.get(q.id).stem,q.prompt);if(q.format==='mc_single')assert.equal(q.options.filter(o=>o===q.answer.accepted[0]).length,1);}
 }
 for(const u of units){assert.equal(u.formalCreditEligible,false);assert.equal(canEarnFormalCredit(u.id),false);assert.ok(u.skills.length);assert.equal(new Set(u.skills).size,u.skills.length);}
});
test('18 editorial overlays and 48 replacement records survive integration; three additional wording edits only',()=>{
 const bySource=new Map(groups.map(g=>[g.sourceId,g]));
 for(const x of inputs.editorial.items)assert.deepEqual(bySource.get(x.sourceId).question,x.question);
 for(const x of inputs.replacement.questions){const q=bySource.get(x.sourceId).question;assert.equal(q.prompt,x.prompt);assert.deepEqual(q.options,x.options);assert.deepEqual(q.answer,x.answer);}
 const originals=inputs.structured.items.flatMap(g=>g.parts), current=groups.filter(g=>g.kind==='structured-candidate').flatMap(g=>g.parts);
 assert.equal(current.length,99);
 for(let i=0;i<99;i++){const a=originals[i],b=current[i];assert.equal(a.pointId,b.pointId);assert.deepEqual(a.options,b.options);assert.equal(a.correctOptionId,b.correctOptionId);if(a.pointId!=='bio-y8-food-tests-brick-red-explain::p1')assert.equal(a.stem,b.stem);else assert.match(b.stem,/strongest positive endpoint/);}
 const typed=bySource.get('bio-y8-food-tests-brick-red-name').question;assert.match(typed.prompt,/strongest positive result/);assert.deepEqual(typed.answer,inputs.source.questions.find(q=>q.id===typed.id).answer);
 const matching=bySource.get('bio-y8-match-food-tests-food-test-results-1').question;assert.match(matching.answer.pairs.find(p=>p.left==='brick-red').right,/strongest positive/);
 assert.equal(c.additionalCorrections.length,3);
});
test('all prior risk edges persist; verify every one of 17,955 new rotation pairs and deterministic sample',()=>{
 const prior=inputs.crosswalk;
 for(const x of prior.records)assert.deepEqual(byId.get(x.id).skills,x.skills);
 for(const x of prior.conflicts)assert.ok(edges.has(pair(x.a,x.b)));
 const explicit=new Map(prior.conflicts.filter(x=>x.explicitRelatedRisk).map(x=>[pair(x.a,x.b),x.explicitRelatedRisk]));
 let examined=0,expected=0;
 for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){examined++;const a=units[i],b=units[j],k=pair(a.id,b.id),shared=a.skills.filter(s=>b.skills.includes(s)),same=a.sourceId===b.sourceId,related=explicit.get(k),e=edges.get(k);
 if(shared.length||same||related){expected++;assert.ok(e,k);assert.deepEqual(e.shared,shared);assert.equal(e.sameSource,same);assert.equal(e.explicitRelatedRisk,related);}else assert.equal(e,undefined);}
 assert.equal(examined,17955);assert.equal(expected,edges.size);assert.equal(edges.size,c.rotation.edges.length);
 assert.equal(c.counts.rotationConflicts,expected);
 const selected=[];for(const u of units)if(selected.every(x=>!edges.has(pair(x.id,u.id))))selected.push(u);
 assert.deepEqual(selected.map(x=>x.id),c.rotation.simulation.selectedIds);assert.deepEqual(selected.slice(0,10).map(x=>x.id),c.rotation.simulation.example10);assert.equal(c.rotation.simulation.example10.length,10);
 const cases=units.filter(x=>x.skills.includes('four-test-complete-set'));assert.equal(cases.length,16);
 for(const x of cases)assert.equal(x.skills.length,5);
 assert.equal(c.policy.matchingPairMarksAreNotIndependentDailyExposures,true);assert.equal(c.policy.multiSkillQuestionIsOneRotationExposure,true);
});
