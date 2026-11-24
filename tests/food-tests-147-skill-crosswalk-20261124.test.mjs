import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canEarnFormalCredit} from '../assets/food-tests-qa-credit-gate-20261122.js';
const raw=p=>readFileSync(new URL('../'+p,import.meta.url));
const read=p=>JSON.parse(raw(p).toString('utf8'));
const map=read('qa/food-tests-147-candidate-skill-crosswalk-20261124.json');
const structured=read(map.sourceFiles[0].path).items.flatMap(g=>g.parts.map(p=>({...p,sourceId:g.sourceId})));
const replacement=read(map.sourceFiles[1].path).questions;
const prior=read('qa/food-tests-48x99-cross-pool-skill-overlap-second-pass-20261124.json');
const records=map.records;
const byId=new Map(records.map(x=>[x.id,x]));
const pair=(a,b)=>[a,b].sort().join('|');
const conflicts=new Map(map.conflicts.map(x=>[pair(x.a,x.b),x]));
test('147 crosswalk rows bind to exact original candidate blobs, stems, keys and source IDs',()=>{
 for(const f of map.sourceFiles){const b=raw(f.path);assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),f.blob);}
 assert.equal(structured.length,99);assert.equal(replacement.length,48);
 assert.equal(records.length,147);assert.equal(byId.size,147);
 for(const [i,p] of structured.entries()){
  const r=byId.get(p.pointId);assert.ok(r);assert.equal(r.pool,'structured');assert.equal(r.ordinal,i+1);assert.equal(r.sourceId,p.sourceId);assert.equal(r.stem,p.stem);assert.equal(r.key,p.keyedAnswer);
 }
 for(const [i,p] of replacement.entries()){
  const r=byId.get(p.sourceId);assert.ok(r);assert.equal(r.pool,'replacement');assert.equal(r.ordinal,i+1);assert.equal(r.sourceId,p.sourceId);assert.equal(r.stem,p.prompt);assert.equal(r.key,p.answer.accepted[0]);
 }
 for(const r of records){assert.ok(r.skills.length);assert.equal(new Set(r.skills).size,r.skills.length);assert.equal(r.formalCreditEligible,false);assert.equal(canEarnFormalCredit(r.id),false);}
 assert.equal(map.counts.approved,0);assert.equal(map.policy.release,'BLOCKED');assert.equal(map.policy.formalCreditEligible,false);assert.equal(map.policy.liveSelectorChanged,false);assert.equal(map.policy.allowMultiSkillItemToEarnMultipleMasteryCredits,false);
});
test('recompute all 10,731 pairs; no shared tag or same source can escape rotation constraints',()=>{
 let total=0,base=0,cross=0;
 for(let i=0;i<records.length;i++)for(let j=i+1;j<records.length;j++){
  total++;const a=records[i],b=records[j],shared=a.skills.filter(x=>b.skills.includes(x)),same=a.sourceId===b.sourceId;
  const edge=conflicts.get(pair(a.id,b.id));
  if(shared.length||same){base++;assert.ok(edge,pair(a.id,b.id));assert.deepEqual(edge.shared,shared);assert.equal(edge.sameSource,same);assert.equal(edge.explicitRelatedRisk,undefined);}
  else if(edge){assert.ok(edge.explicitRelatedRisk);assert.ok(prior.issues.some(x=>pair(x.candidateId,x.structuredPointId)===pair(a.id,b.id)&&x.risk===edge.explicitRelatedRisk));}
  if(edge){assert.equal(edge.crossPool,a.pool!==b.pool);if(edge.crossPool)cross++;}
 }
 assert.equal(total,10731);assert.equal(base,map.counts.sharedSkillOrSiblingConflicts);assert.equal(cross,map.counts.crossPoolConflicts);assert.equal(conflicts.size,map.conflicts.length);assert.equal(conflicts.size,map.counts.totalRotationConflicts);
 const groups={};for(const r of records)for(const tag of r.skills)(groups[tag]??=[]).push(r.id);
 assert.deepEqual(groups,map.groups);assert.equal(Object.keys(groups).length,map.counts.distinctProvisionalSkillTags);
 assert.equal(records.filter(r=>r.skills.length>1).length,map.counts.multiSkillItems);
});
test('all 17 previously flagged pairs stay constrained without merging different pipetting skills',()=>{
 assert.equal(prior.issues.length,17);
 for(const x of prior.issues)assert.ok(conflicts.has(pair(x.candidateId,x.structuredPointId)));
 const edge=map.conflicts.find(x=>x.explicitRelatedRisk==='RELATED_PIPETTING_SAFETY');assert.ok(edge);assert.deepEqual(edge.shared,[]);assert.equal(map.counts.priorSpecificFlagsCovered,17);
});
test('QA-only greedy rotation example is reproducible and pairwise non-conflicting',()=>{
 const selected=[];for(const r of records)if(selected.every(x=>!conflicts.has(pair(x.id,r.id))))selected.push(r);
 assert.deepEqual(selected.map(r=>r.id),map.qaSimulation.nonConflictingPoolExample);
 assert.deepEqual(selected.slice(0,10).map(r=>r.id),map.qaSimulation.example10);
 assert.equal(map.qaSimulation.example10.length,10);assert.equal(map.qaSimulation.formalCreditEligible,false);
 for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++)assert.ok(!conflicts.has(pair(selected[i].id,selected[j].id)));
});
