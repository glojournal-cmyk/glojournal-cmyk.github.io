import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const specs={
 'bio-y8-dna-structure':{prior:18,added:2},
 'bio-y8-fats-cholesterol':{prior:19,added:1},
 'bio-y8-genetic-disorders':{prior:15,added:5},
 'bio-y8-nutrition-labels':{prior:16,added:4},
 'bio-y8-practical-conclusions':{prior:16,added:4},
 'bio-y8-punnett-squares':{prior:17,added:3}
};
const open=key=>JSON.parse(fs.readFileSync('content/topics/'+key+'.json','utf8'));
for(const [topic,{prior,added}]of Object.entries(specs)){
 test(topic+' has 20 enabled questions, stable originals, valid newly authored answers',()=>{
  const b=open(topic),fresh=b.questions.filter(q=>q.id.includes('capacity-20261026'));
  assert.equal(b.questions.length,20);assert.equal(b.enabled,20);
  assert.equal(fresh.length,added);assert.equal(b.questions.length-fresh.length,prior);
  assert.equal(new Set(b.questions.map(q=>q.id)).size,20);
  assert.equal(new Set(b.questions.map(q=>JSON.stringify([q.prompt,q.stimulus,q.format]))).size,20);
  for(const q of fresh){
   assert.equal(q.status,'enabled');assert.equal(q.year,8);
   assert.equal(q.topicId,topic);assert.ok(q.prompt&&q.conceptId&&q.answer);
   assert.ok(q.difficulty>=2);
   if(q.format==='mark_points'){
    assert.equal(q.answer.mode,'mark_points');
    assert.equal(q.answer.totalMarks,q.answer.markPoints.length);
    assert.ok(q.answer.markPoints.every(x=>typeof x==='string'&&x.trim()));
   }else if(q.format==='calculation'){
    assert.equal(q.answer.totalMarks,1,'current app auto grades final numeric answer out of one mark');
    assert.ok(Number.isFinite(q.answer.value));
    assert.ok(q.answer.units?.length>0);
   }else {
    assert.ok(['typed_equivalent','typed_exact'].includes(q.format));
    assert.equal(q.answer.mode,'exact_or_equivalent');
    assert.ok(q.answer.accepted?.length>0);
   }
  }
 });
}
test('nutrition label calculations have independently checked correct keys',()=>{
 const q=open('bio-y8-nutrition-labels').questions.filter(x=>x.id.includes('capacity-20261026')&&x.format==='calculation');
 assert.equal(q.length,2);
 assert.equal(q[0].answer.value,13.5);
 assert.equal(q[1].answer.value,240);
});
test('new genetics probability keys are coherent',()=>{
 const q=open('bio-y8-genetic-disorders').questions.filter(x=>x.id.includes('capacity-20261026'));
 assert.ok(q.some(x=>x.prompt.includes('Aa × Aa')&&x.answer.accepted.includes('25%')));
 assert.ok(q.some(x=>x.prompt.includes('unaffected carrier')&&x.answer.accepted.includes('Aa')));
});
