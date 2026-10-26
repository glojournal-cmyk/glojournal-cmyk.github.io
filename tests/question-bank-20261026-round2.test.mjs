import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const get=n=>JSON.parse(fs.readFileSync('content/topics/'+n+'.json','utf8'));
const sets=[
 {slug:'bio-y8-continuous-variation',old:13,added:7,formats:{typed_equivalent:3,mark_points:4}},
 {slug:'bio-y8-correlation',old:13,added:7,formats:{typed_equivalent:3,mark_points:4}},
 {slug:'bio-y8-ber',old:10,added:10,formats:{calculation:6,mark_points:4}}
];
for(const x of sets)test(x.slug+' upgraded safely to 20 enabled and valid independent questions',()=>{
 const d=get(x.slug),q=d.questions,added=q.filter(z=>z.id?.includes('20261026-repair'));
 assert.equal(q.length,20);assert.equal(d.enabled,20);assert.equal(added.length,x.added);
 assert.equal(q.filter(z=>!z.id.includes('20261026-repair')).length,x.old);
 assert.equal(new Set(q.map(z=>z.id)).size,20,'IDs unique');
 assert.equal(new Set(q.map(z=>JSON.stringify([z.prompt,z.stimulus,z.format]))).size,20,'within-topic exact duplicates');
 const formats=added.reduce((a,z)=>(a[z.format]=(a[z.format]||0)+1,a),{});
 assert.deepEqual(formats,x.formats);
 for(const question of added){
  assert.equal(question.status,'enabled');assert.ok(question.conceptId&&question.prompt&&question.answer);
  assert.ok(question.difficulty>=2);
  if(question.format==='mark_points'){
   assert.ok(question.answer.manualReviewFallback);
   assert.equal(question.answer.totalMarks,question.answer.markPoints.length);
   assert.ok(question.answer.markPoints.every(v=>v.id&&v.text));
  }else if(question.format==='calculation'){
   assert.equal(question.answer.mode,'numeric');assert.ok(Number.isFinite(question.answer.value));
   assert.ok(question.answer.units.length);
   assert.ok(question.answer.totalMarks>=1);
  }else assert.ok(question.answer.accepted.length);
 }
});
test('BER direct and reverse calculations reflect 5.4 kJ per kg per hour school model',()=>{
 const q=get('bio-y8-ber').questions;
 const keyed=Object.fromEntries(q.filter(x=>x.id.includes('20261026-repair')&&x.format==='calculation').map(x=>[x.id.slice(-2),x.answer.value]));
 assert.deepEqual(keyed,{
 '01':5184,'02':7776,'03':50,'04':1296,'05':45360,'06':7980
 });
 assert.equal(5.4*24*55,7128.000000000001); // floating-point reference
 assert.equal(Math.round(5.4*24*55),7128);
});
