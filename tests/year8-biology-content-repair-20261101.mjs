import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const topics=['bio-y8-ber','bio-y8-continuous-variation','bio-y8-correlation','bio-y8-mixed-exam'];
const target=25;
const catalogue=JSON.parse(fs.readFileSync('content/catalog.json','utf8'));
const active=q=>q.status==='enabled'&&q.preview!==true&&q.formal!==false&&!q._repair;
const source=(p,ref='origin/main')=>JSON.parse(execFileSync('git',['show',ref+':'+p],{encoding:'utf8',maxBuffer:5000000}));
let newCount=0;
for(const topicId of topics){
 const p='content/topics/'+topicId+'.json';
 const data=JSON.parse(fs.readFileSync(p,'utf8'));
 const original=source(p),catalog=catalogue.topics.find(t=>t.topicId===topicId);
 assert.equal(data.subject,'biology');
 assert.equal(data.year,8);
 assert.equal(data.topicId,topicId);
 assert.ok(catalog,'missing catalog topic '+topicId);
 // Existing questions, ID, answer keys, model text and marking must remain unchanged.
 assert.deepEqual(data.questions.slice(0,original.questions.length),original.questions,'original question changed: '+topicId);
 const eligible=data.questions.filter(active);
 assert.equal(eligible.length,target,'wrong actual eligible count: '+topicId);
 assert.equal(catalog.enabled,eligible.length,'catalog enabled mismatch: '+topicId);
 assert.equal(catalog.questions,data.questions.length,'catalog total mismatch: '+topicId);
 const ids=new Set(),keys=new Set(),concepts=new Set();
 for(const q of data.questions){
   assert.ok(typeof q.id==='string'&&q.id.length>4,'missing ID');
   assert.ok(!ids.has(q.id),'duplicate ID '+q.id);
   ids.add(q.id);
 }
 const fresh=data.questions.slice(original.questions.length);
 newCount+=fresh.length;
 for(const q of fresh){
   assert.equal(q.year,8,q.id);
   assert.equal(q.subject,'biology',q.id);
   assert.equal(q.topicId,topicId,q.id);
   assert.equal(q.status,'enabled',q.id);
   assert.equal(q.formal,true,q.id);
   assert.ok(q.origin?.publicationGate || q.origin?.verification,'no publication gate '+q.id);
   assert.ok(q.conceptId,'no concept id '+q.id);
   assert.ok(!concepts.has(q.conceptId),'reused conceptId in new records '+q.id);
   concepts.add(q.conceptId);
   const fingerprint=JSON.stringify([String(q.prompt||'').replace(/\s+/g,' ').trim().toLowerCase(),q.stimulus||{}]);
   assert.ok(!keys.has(fingerprint),'duplicate prompt/stimulus '+q.id);
   keys.add(fingerprint);
   assert.ok(q.prompt?.trim(),'missing prompt '+q.id);
   assert.ok(q.answer && typeof q.answer==='object','missing answer '+q.id);
   assert.ok(q.feedback?.short,'missing feedback '+q.id);
   if(q.answer.mode==='numeric'){
     assert.equal(q.format,'calculation',q.id);
     assert.equal(q.answer.totalMarks,1,'numeric final answer is a single auto mark '+q.id);
     assert.ok(Number.isFinite(q.answer.value),'invalid numeric answer '+q.id);
     assert.ok(Array.isArray(q.answer.units) && q.answer.units.length,'missing numeric units '+q.id);
     assert.ok(q.answer.working && q.answer.modelAnswer,'missing numeric model '+q.id);
   }else if(q.answer.mode==='mark_points'){
     assert.equal(q.format,'mark_points',q.id);
     assert.ok(Array.isArray(q.answer.markPoints) && q.answer.markPoints.length>0,'invalid rubric '+q.id);
     assert.equal(q.answer.totalMarks,q.answer.markPoints.length,'rubric mark count '+q.id);
     assert.ok(q.answer.markPoints.every(x=>typeof x==='string'&&x.length>10),'rubric point too short '+q.id);
     assert.equal(q.answer.manualReviewFallback,true,'needs human fallback '+q.id);
   }else if(q.answer.mode==='exact_or_equivalent'){
     assert.ok(['typed_equivalent'].includes(q.format),q.id);
     assert.ok(Array.isArray(q.answer.accepted)&&q.answer.accepted.every(x=>typeof x==='string'&&x.trim()),'invalid accepted forms '+q.id);
   }else{
     throw Error('unexpected new answer mode '+q.id+': '+q.answer.mode);
   }
 }
 // Grader-specific signed numerical reference cases, including correction of a seven-day unit bug.
 if(topicId==='bio-y8-ber'){
   const cases={'bio-y8-ber-20261026-repair-01':[5184,'kJ/day'],
                'bio-y8-ber-20261026-repair-02':[7776,'kJ/day'],
                'bio-y8-ber-20261026-repair-03':[50,'kg'],
                'bio-y8-ber-20261026-repair-04':[1296,'kJ/day'],
                'bio-y8-ber-20261026-repair-05':[45360,'kJ'],
                'bio-y8-ber-20261026-repair-06':[7980,'kJ/day'],
                'bio-y8-ber-20261101-35kg':[4536,'kJ/day'],
                'bio-y8-ber-20261101-65kg':[8424,'kJ/day'],
                'bio-y8-ber-20261101-reverse40':[40,'kg'],
                'bio-y8-ber-20261101-activity1200':[8976,'kJ/day'],
                'bio-y8-ber-20261101-hourly50':[270,'kJ']};
   for(const [id,[v,u]] of Object.entries(cases)){
     const q=data.questions.find(q=>q.id===id);
     assert.ok(q,'missing reference calculation '+id);
     assert.equal(q.answer.value,v,id);
     assert.ok(q.answer.units.includes(u),'incorrect dimensional unit '+id);
     assert.equal(q.answer.modelAnswer,v+' '+u,id);
   }
 }
 console.log(topicId, 'original:',original.questions.length,'new:',fresh.length,'eligible:',eligible.length,
   'MC:',eligible.filter(q=>q.format==='mc_single').length,
   'markPoints:',eligible.filter(q=>q.format==='mark_points').length);
}
assert.equal(newCount,54,'expected exactly 54 additional question records');
console.log('PASS: four Year 8 Biology topic banks / 54 source-preserving additions; 25 eligible each.');
console.log('ACADEMIC NOTE: structural/number/units QA does not certify free-text semantic marking or taught pupil history.');
