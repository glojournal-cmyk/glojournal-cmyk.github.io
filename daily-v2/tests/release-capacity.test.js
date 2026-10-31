import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditDailyV2ReleaseCapacity} from '../src/release-capacity.js';
import {buildRealSourceCapacityReport} from '../scripts/qa-real-capacity.mjs';

const make=(role,amount,options={})=>Array.from({length:amount},(_,i)=>({
 id:role+'-'+(options.skill||options.depthBand||options.marks||'x')+'-'+i,
 roles:[role],...options
}));
test('30-day release report is explicitly blocked by the actual uncertified real bank',()=>{
 const r=buildRealSourceCapacityReport();
 assert.equal(r.bank.certified,0);
 assert.equal(r.thirtyDayRoleSupply.floorsMet,false);
 assert.equal(r.thirtyDayRoleSupply.releaseReady,false);
 assert.equal(r.thirtyDayRoleSupply.totalAssignmentSlots,4890);
 assert.equal(r.thirtyDayRoleSupply.vocabulary.length,2);
 assert.ok(r.thirtyDayRoleSupply.vocabulary.every(v=>v.shortfall===60));
 assert.ok(r.thirtyDayRoleSupply.minimumFreshQuestionSupply.every(v=>!v.floorMet));
 assert.equal(r.thirtyDayRoleSupply.retention.proven,false);
});
test('two-day vocab floor requires 60 distinct concepts with no untaught Y9 loophole',()=>{
 const y8=Array.from({length:50},(_,i)=>({id:'f-'+i,roles:['french-vocab'],
  subject:'french',year:8,conceptId:'f-c'+i}));
 const y9=Array.from({length:10},(_,i)=>({id:'f-y9-'+i,roles:['french-vocab'],
  subject:'french',year:9,topicId:'fr-y9-taught',conceptId:'f-y9-c'+i}));
 const noProof=auditDailyV2ReleaseCapacity([...y8,...y9],[]);
 assert.equal(noProof.vocabulary[1].maxDistinctTwoDayCredits,50);
 assert.equal(noProof.vocabulary[1].floorMet,false);
 const withProof=auditDailyV2ReleaseCapacity([...y8,...y9],['fr-y9-taught']);
 assert.equal(withProof.vocabulary[1].maxDistinctTwoDayCredits,60);
 assert.equal(withProof.vocabulary[1].floorMet,true);
});
test('60 genuine Year 7-8 concepts permit spacing without a single Y9 question',()=>{
 const vocab=Array.from({length:60},(_,i)=>({id:'la-'+i,roles:['latin-vocab'],
  subject:'latin',year:8,conceptId:'la-concept-'+i}));
 const r=auditDailyV2ReleaseCapacity(vocab);
 assert.equal(r.vocabulary[0].floorMet,true);
 assert.equal(r.vocabulary[0].certifiedTaughtYear9Concepts,0);
 assert.equal(r.releaseReady,false,'vocabulary supply is not full V2 release approval');
});
test('role floors require 120/90/90 language skills, 240/600/360 mastery, 180/330/90 Year9 and 30 GCSE per mark',()=>{
 const bank=[];
 for(const subject of ['latin','french']){
  for(const [skill,count] of (subject==='latin'?
   [['grammar',120],['translation',90],['passage',90]]:
   [['grammar',120],['translation',90],['writing',90]]))
   bank.push(...make(subject+'-standard',count,{subject,skill}));
  bank.push(...Array.from({length:60},(_,i)=>({id:subject+'-vocab-'+i,
   roles:[subject+'-vocab'],subject,year:8,conceptId:subject+'-concept-'+i})));
 }
 bank.push(...make('science-standard',300,{subject:'biology'}));
 for(const [band,count] of [['foundation',240],['application',600],['challenge',360]])
  bank.push(...make('mastery',count,{depthBand:band}));
 for(const [band,count] of [['foundation',180],['application',330],['challenge',90]])
  bank.push(...make('year9-progressive',count,{year:9,topicId:'taught-y9',depthBand:band}));
 for(const marks of [1,2,3])bank.push(...make('gcse',30,{marks}));
 const r=auditDailyV2ReleaseCapacity(bank,['taught-y9']);
 assert.equal(r.floorsMet,true);
 assert.ok(r.minimumFreshQuestionSupply.every(x=>x.floorMet));
 assert.ok(r.vocabulary.every(x=>x.floorMet));
 assert.equal(r.releaseReady,false,'role totals cannot establish quality, topic diversity or iPad safety');
 const oneMissing=bank.filter(q=>q.id!=='mastery-challenge-359');
 assert.ok(auditDailyV2ReleaseCapacity(oneMissing,['taught-y9'])
  .minimumFreshQuestionSupply.some(x=>x.role==='mastery'&&x.criterion==='challenge'&&x.shortfall===1));
});
test('all source checks are read only and never assert pupil history exists',()=>{
 const r=auditDailyV2ReleaseCapacity([],[]);
 assert.equal(r.certifiedQuestionCount,0);
 assert.equal(r.retention.proven,false);
 assert.throws(()=>auditDailyV2ReleaseCapacity(null),/certified bank/);
 assert.ok(r.limitations.some(x=>x.includes('learner history')));
});
