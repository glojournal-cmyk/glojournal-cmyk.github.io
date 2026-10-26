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
const reserves={'bio-y8-dna-structure':7,'bio-y8-punnett-squares':6};
for(const [topic,{prior,added}]of Object.entries(specs)){
 test(topic+' preserves originals and has valid supplemental questions',()=>{
  const b=open(topic),fresh=b.questions.filter(q=>q.id.includes('capacity-20261026'));
  const extra=b.questions.filter(q=>q.id.includes('reserve-20261026'));
  const expected=20+(reserves[topic]||0);
  assert.equal(b.questions.length,expected);assert.equal(b.enabled,expected);
  assert.equal(fresh.length,added);assert.equal(extra.length,reserves[topic]||0);
  assert.equal(b.questions.length-fresh.length-extra.length,prior);
  assert.equal(new Set(b.questions.map(q=>q.id)).size,expected);
  assert.equal(new Set(b.questions.map(q=>JSON.stringify([q.prompt,q.stimulus,q.format]))).size,expected);
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

test('20 enabled does NOT mean 20 fresh after five prior correct questions',async()=>{
 const {diagnoseTaskQuestionEligibility}=await import('../src/lib/daily/question-eligibility-diagnostics-20261026.mjs');
 for(const topic of Object.keys(specs)){
  const bank=open(topic),previouslyCorrect=Object.fromEntries(bank.questions.slice(0,5).map(q=>[q.id,1]));
  const task={id:'mastery-'+topic,subject:'biology',year:8,topicId:topic,target:20,mode:'mastery'};
  const r=diagnoseTaskQuestionEligibility(task,bank.questions,{today:'2026-10-26',seenCorrect:previouslyCorrect},'2026-10-26');
  const informal=bank.questions.filter(q=>q.formal===false||q._repair||q.status!=='enabled').length;
  const eligibleBeforeHistory=bank.questions.length-informal;
  const expectedEligible=eligibleBeforeHistory-5;
  assert.equal(r.nominal,bank.questions.length,topic);
  assert.equal(r.eligible,expectedEligible,topic+' must exclude nonformal diagrams and previous successes');
  assert.equal(r.shortage,Math.max(0,20-expectedEligible),topic);
 }
});


test('DNA and Punnett each offer 20 formal Mastery questions after five prior correct answers',async()=>{
 const {diagnoseTaskQuestionEligibility}=await import('../src/lib/daily/question-eligibility-diagnostics-20261026.mjs');
 for(const [topic,amount] of Object.entries(reserves)){
  const b=open(topic),res=b.questions.filter(q=>q.id.includes('reserve-20261026'));
  assert.equal(res.length,amount);
  assert.ok(res.every(q=>q.formal===true&&q.status==='enabled'&&q.origin?.reviewStatus==='requires-academic-and-grading-QA'));
  assert.ok(res.every(q=>q.subject==='biology'&&q.year===8&&q.topicId===topic&&q.difficulty>=3));
  const formal=b.questions.filter(q=>q.status==='enabled'&&q.formal!==false&&!q._repair);
  assert.equal(formal.length,25);
  assert.equal(new Set(formal.map(q=>q.conceptId)).size>=12,true);
  for(const q of res){
   if(q.format==='mark_points'){
    assert.equal(q.answer.totalMarks,q.answer.markPoints.length);
    assert.ok(q.answer.markPoints.length>=2&&q.answer.markPoints.every(x=>typeof x==='string'&&x.trim()));
    assert.equal(q.answer.manualReviewFallback,true);
   } else {
    assert.equal(q.format,'typed_equivalent');
    assert.equal(q.answer.mode,'exact_or_equivalent');
    assert.ok(q.answer.accepted?.length>=2);
   }
  }
  const seenCorrect=Object.fromEntries(formal.slice(0,5).map(q=>[q.id,1]));
  const t={id:'mastery-'+topic,mode:'mastery',subject:'biology',year:8,topicId:topic,target:20};
  const diagnostic=diagnoseTaskQuestionEligibility(t,b.questions,{today:'2026-10-26',seenCorrect},'2026-10-26');
  assert.equal(diagnostic.eligible,20,topic);
  assert.equal(diagnostic.shortage,0,topic);
 }
});
