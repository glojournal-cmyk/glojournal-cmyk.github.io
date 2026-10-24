import fs from "node:fs";
import assert from "node:assert/strict";
const suites=[["physics","phys-y9-p2",4,"8463"],["chemistry","chem-y9-c4",4,"8462"],["biology","bio-y9-b3",4,"8461"]];
const catalog=JSON.parse(fs.readFileSync("content/catalog.json","utf8"));
let checked=0,extended=0,pointBased=0,numeric=0;
for(const [subject,id,count,spec] of suites){
 const doc=JSON.parse(fs.readFileSync("content/topics/"+id+".json","utf8"));
 const q=doc.questions.filter(q=>q.id.includes("-aqa-exam-20261024-"));
 assert.equal(q.length,count,id+" new exam tasks");
 assert.equal(doc.questions.length,doc.enabled+doc.preview+doc.disabled);
 assert.equal(catalog.topics.find(t=>t.topicId===id).questions,doc.questions.length);
 const ids=new Set();
 for(const task of q){
  assert.ok(!ids.has(task.id),"duplicate "+task.id);ids.add(task.id);
  assert.equal(task.examPractice.board,"AQA");
  assert.equal(task.examPractice.specification,spec);
  assert.equal(task.examPractice.marking,"formative");
  assert.equal(task.formal,false);
  assert.equal(task.status,"enabled");
  assert.ok(task.task.label.includes("MARK"));
  if(task.format==="calculation"){
   assert.equal(task.answer.mode,"numeric");
   assert.ok(Number.isFinite(task.answer.value));
   assert.ok(task.answer.working);
   numeric++;
  }else{
   assert.equal(task.answer.mode,"mark_points");
   assert.ok([4,6].includes(task.answer.totalMarks));
   assert.equal(task.stimulus.marks,task.answer.totalMarks);
   assert.equal(task.answer.markPoints.length,task.answer.totalMarks);
   assert.equal(task.answer.markPointAlternatives.length,task.answer.totalMarks);
   assert.equal(task.answer.requireFullMarks,true);
   assert.ok(task.answer.markPoints.every(x=>x.trim().length>12));
   if(task.format==="extended_response")extended++;
   pointBased++;
  }
  checked++;
 }
}
assert.equal(checked,12);
assert.equal(extended,6);
assert.equal(pointBased,9);
assert.equal(numeric,3);
assert.equal(catalog.totals.questions,16539);
assert.equal(catalog.totals.enabled,15410);
console.log("AQA_SCIENCE_EXAM_QA",JSON.stringify({checked,extended,pointBased,numeric,year9Questions:{physics:1044,chemistry:1090,biology:992},failures:0}));
