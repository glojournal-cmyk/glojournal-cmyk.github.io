import fs from "node:fs";
import assert from "node:assert/strict";

const targets = [
 [1,67,77,"d1aca4b6"],[2,57,80,"f43738c8"],[3,40,63,"d6f23e07"],
 [4,56,72,"b0f792f6"],[5,46,65,"5c054f36"],
 [7,47,63,"5bd9de49"],[10,45,64,"4b40097c"]
];
const catalog = JSON.parse(fs.readFileSync("content/catalog.json","utf8"));
const hashIds = ids => {
 let h = 2166136261;
 for(const s of ids){
  for(let i=0;i<s.length;i++) h = Math.imul(h ^ s.charCodeAt(i),16777619) >>> 0;
  h = Math.imul(h ^ 10,16777619) >>> 0;
 }
 return h.toString(16);
};
const norm=s=>String(s??"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const score=(points,text)=>{
 const clauseList=String(text).split(/[.;\n]|\bbut\b/i).map(norm).filter(Boolean);
 return points.filter(point=>{
  const tokens=norm(point).split(" ").filter(t=>t.length>3||["not","no","air","gas","ion"].includes(t));
  return clauseList.some(clause=>{
   const words=new Set(clause.split(" "));
   const required=Math.max(1,Math.ceil(tokens.length*0.6));
   return tokens.filter(t=>words.has(t)).length>=required;
  });
 }).length;
};
let added=0,questions=0,calcs=0,mc=0,corrected=0;const allIds=new Set(),seenPrompt=new Set();
for(const [number,prior,expected,baseline] of targets){
 const id=`phys-y9-p${number}`,file=`content/topics/${id}.json`;
 const doc=JSON.parse(fs.readFileSync(file,"utf8"));
 assert.equal(doc.topicId,id);
 assert.equal(doc.questions.length,expected,`${id} question count`);
 const old=doc.questions.filter(q=>!q.id.includes("-gcse-oct20-")&&!q.id.includes("-aqa-exam-20261024-"));
 const fresh=doc.questions.filter(q=>q.id.includes("-gcse-oct20-"));
 assert.equal(old.length,prior,`${id}: all original question IDs kept`);
 assert.equal(hashIds(old.map(q=>q.id)),baseline,`${id}: original question IDs or order changed`);
 assert.ok(doc.questions.length>=60,`${id}: fewer than 60`);
 const cat=catalog.topics.find(t=>t.topicId===id);
 assert.ok(cat,`${id}: absent from catalog`);
 assert.equal(cat.questions,doc.questions.length);
 assert.equal(cat.enabled,doc.enabled);
 assert.deepEqual(cat.formats,doc.formats);
 assert.equal(doc.enabled,doc.questions.filter(q=>q.status==="enabled").length);
 questions+=doc.questions.length;added+=fresh.length;
 for(const q of doc.questions){
  assert.ok(!allIds.has(q.id),`duplicate question ID ${q.id}`);allIds.add(q.id);
  assert.equal(q.topicId,id);
  assert.ok(q.prompt && q.answer && q.format && q.feedback,`incomplete question ${q.id}`);
  const marks=q.answer.totalMarks??q.stimulus?.marks??1;
  assert.ok(marks>0 && marks<=6,`${q.id}: 1–6 marks allowed`);
  if(q.answer.markPoints){
   assert.equal(q.answer.totalMarks,q.answer.markPoints.length,`${q.id}: point count mismatch`);
   assert.equal(q.stimulus.marks,q.answer.totalMarks,`${q.id}: displayed marks mismatch`);
  }
  if(q.format==="calculation"){
   calcs++;
   assert.ok(Number.isFinite(q.answer.value));
   assert.ok(q.answer.units?.length && q.answer.modelAnswer && q.answer.working);
   assert.ok(q.answer.tolerance>=0);
  }
  if(q.format==="mc_single"){
   mc++;
   const options=(q.options||[]).map(norm);
   assert.equal(new Set(options).size,options.length,`${q.id}: duplicate MC option`);
   assert.ok(options.includes(norm(q.answer.accepted?.[0])),`${q.id}: correct MC option missing`);
  }
  if(q.id.includes("-gcse-oct20-")){
   const key=norm(q.prompt);
   assert.ok(!seenPrompt.has(key),`${q.id}: repeated new prompt`);seenPrompt.add(key);
   assert.ok(q.difficulty>=2 && q.difficulty<=4,`${q.id}: difficulty`);
   assert.ok(/\(\d marks?\)/i.test(q.prompt)||q.format==="mc_single",`${q.id}: missing visible GCSE mark allocation`);
   if(q.answer.markPoints){
    const result=score(q.answer.markPoints,q.answer.modelAnswer);
    assert.equal(result,q.answer.markPoints.length,`${q.id}: full model answer cannot earn full marks`);
   }
  }
 }
}
assert.equal(questions,484);
assert.equal(added,122);
assert.equal(catalog.bySubjectYear.find(r=>r.subject==="physics"&&r.year===9).enabled,1044);
assert.equal(catalog.totals.enabled,15410);
assert.equal(catalog.totals.questions,16539);
assert.ok(catalog.version.includes("phys-gcse-20261020"));
const read=n=>JSON.parse(fs.readFileSync(`content/topics/phys-y9-p${n}.json`,"utf8"));
assert.match(JSON.stringify(read(1)).toLowerCase(),/brownian motion/);
assert.match(JSON.stringify(read(1)).toLowerCase(),/diffusion/);
assert.match(JSON.stringify(read(4)).toLowerCase(),/convection/);
assert.match(JSON.stringify(read(2)).toLowerCase(),/zero error/);
for(const [n,id] of [[2,"phys-y9-p2-app-irregular-method"],[4,"phys-y9-p4-app-insulation-practical"]]){
 const q=read(n).questions.find(x=>x.id===id);
 assert.equal(q.answer.totalMarks,5);
 assert.equal(q.stimulus.marks,5);
 corrected++;
}
for(let n=1;n<=18;n++){
 const topic=read(n);
 for(const q of topic.questions){
  const marks=q.answer?.totalMarks??q.stimulus?.marks??1;
  assert.ok(marks<=6,`Year 9 Physics P${n}: over-five-mark question ${q.id}`);
 }
}
for(const [n,id] of [[6,"phys-y9-p6-app-shc-practical"],[11,"phys-y9-p11-app-boyle-controls"],[16,"phys-y9-p16-app-spring-practical"],[18,"phys-y9-p18-app-efficiency-boss"]]){
 const q=read(n).questions.find(x=>x.id===id);
 assert.equal(q.answer.totalMarks,5,`${id} remains over five marks`);
 assert.equal(q.answer.markPoints.length,5);
}
console.log("PHYSICS_GCSE_OCT20_QA",JSON.stringify({topics:targets.length,baseline:358,added,total:questions,calculations:calcs,multipleChoice:mc,shortPracticalCorrections:corrected,legacyIdsPreserved:true,failures:0}));
