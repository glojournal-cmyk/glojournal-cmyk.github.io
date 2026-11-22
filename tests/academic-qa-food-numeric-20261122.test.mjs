import fs from "node:fs";
import assert from "node:assert/strict";

// Regression QA: food-test observation -> answer key; GCSE maths worked
// examples; numeric final-answer extraction and fair UK units.
// Run: node tests/academic-qa-food-numeric-20261122.test.mjs

const readJson=path=>JSON.parse(fs.readFileSync(path,"utf8"));
const food=readJson("content/topics/bio-y8-food-tests.json");
const cases=food.questions.filter(q=>q.id.startsWith("bio-y8-food-tests-case-"));
assert.equal(cases.length,64,"Expected 64 practical interpretation cases");
const nutrients=["starch","reducing sugar","protein","lipid"];
function detect(prompt){
  const tests=[
    /iodine blue-black/i.test(prompt),
    /Benedict's (?:green|yellow|orange|brick-red)/i.test(prompt),
    /Biuret lilac \/ purple/i.test(prompt),
    /emulsion test cloudy white emulsion/i.test(prompt)
  ];
  return nutrients.filter((_,i)=>tests[i]).join(", ")||"none of these four nutrients";
}
for(const q of cases){
  const expected=detect(q.prompt);
  assert.deepEqual(q.answer.accepted,[expected],q.id+" answer must match observations");
  assert.ok(q.options.includes(expected),q.id+" must offer correct choice");
  for(const feedback of [q.feedback.short,q.feedback.remember,...q.feedback.steps]){
    assert.ok(feedback.startsWith("Detected: "+expected+"."),q.id+" feedback incorrect");
  }
}
const allPositive=cases.find(q=>/iodine blue-black/i.test(q.prompt)&&/Benedict's green/i.test(q.prompt)&&/Biuret lilac/i.test(q.prompt)&&/emulsion test cloudy white/i.test(q.prompt));
assert.ok(allPositive);
assert.equal(detect(allPositive.prompt),"starch, reducing sugar, protein, lipid");

const indices=readJson("assets/math-study/math-y9-indices.json").questions;
const q73=indices.find(q=>q.id==="T1-073"),q75=indices.find(q=>q.id==="T1-075");
assert.ok(q73.solution.includes("6 + 2 − 3 = 5")&&q73.solution.includes("x⁵"),"T1-073 method wrong");
assert.ok(q75.solution.includes("8 + 4 − 3 = 9")&&q75.solution.includes("x⁹"),"T1-075 method wrong");
assert.ok(!q73.solution.includes("(2+1)")&&!q75.solution.includes("(2+1)"));

const script=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
const start=script.indexOf("function A(e){"),end=script.indexOf("function V(e){",start);
assert.ok(start>=0&&end>start,"Cannot extract live quiz scorer");
const as=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/æ/g,"ae").replace(/œ/g,"oe").toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();
const js=s=>String(s??"").normalize("NFC").trim().replace(/\s+/g," ");
const ms=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ']/g,"").replace(/\s+/g," ").trim();
const {B,NX}=new Function("a","d","x",script.slice(start,end)+";return {B,NX};")(ms,as,js);

const bmi=readJson("content/topics/bio-y8-energy-bmi.json").questions.find(q=>q.id==="bio-y8-app-bmi-60-150");
const chem=readJson("content/topics/chem-y8-energy-changes.json").questions.find(q=>q.id==="chem-y8-energy-changes-profile-exo-apply");
assert.ok(bmi&&chem,"Known science calculations missing");
function check(q,input,ok,label){
  const output=B(q,input,q.topicId?.startsWith("bio-")?"biology":"chemistry",{});
  assert.equal(output.ok,ok,label+": "+JSON.stringify(output));
}
assert.equal(NX("60 / (1.50 x 1.50) = 26.7 kg/m2").value,26.7,"Must not take first working number");
check(bmi,"60 / (1.50 x 1.50) = 26.7 kg/m2",true,"Working and final BMI");
check(bmi,"60 / (1.50 x 1.50) = 26.7 kg/m²",true,"Unicode squared");
check(bmi,"26.7 kg/m^2",true,"Caret squared");
check(bmi,"26.7 kg m-2",true,"Negative exponent unit");
check(bmi,"60 / (1.50 x 1.50) = 26.0 kg/m²",false,"Incorrect final BMI");
check(bmi,"26.7 kg/m3",false,"Incorrect dimensions");
check(chem,"250 - 400 = -150 kJ exothermic",true,"Correct numeric and exothermic classification");
check(chem,"-150 kJ endothermic",false,"Wrong classification must not count correct");
check(chem,"-140 kJ exothermic",false,"Incorrect energy change");

// Ethanol emulsion tests are unheated. Never reintroduce the erroneous
// description that heating ethanol is a required food-test step.
const waterBathIds=[
 "bio-y8-food-tests-water-bath-mc",
 "bio-y8-food-tests-water-bath-name",
 "bio-y8-food-tests-water-bath-explain"
];
for(const id of waterBathIds){
 const item=food.questions.find(q=>q.id===id);
 assert.ok(item,"Missing revised water-bath concept "+id);
 const all=JSON.stringify(item);
 assert.ok(!/required indirect heating method for ethanol/i.test(all),id);
 if(item.format==="mark_points"){
  assert.equal(item.answer.markPoints.length,1);
  assert.match(item.answer.markPoints[0],/heating Benedict's test mixture indirectly/);
  assert.ok(!/ethanol/i.test(item.answer.markPoints[0]),"one mark must test one clear water-bath role");
 }else{
  assert.ok(all.includes("ethanol emulsion test does not require heating"),id);
  assert.ok(item.answer.accepted.includes("water bath"),id+" answer changed");
 }
}
const waterBathMC=food.questions.find(q=>q.id===waterBathIds[0]);
assert.equal(waterBathMC.options.length,4);
assert.equal(new Set(waterBathMC.options).size,4);
assert.ok(waterBathMC.options.includes("water bath"));
const ethanol=food.questions.find(q=>q.id==="bio-y8-app-ethanol-safety");
assert.ok(ethanol);
assert.ok(/why heating is unnecessary/i.test(ethanol.prompt));
assert.equal(ethanol.answer.totalMarks,2);
assert.equal(ethanol.answer.markPoints.length,2);
assert.ok(ethanol.answer.markPoints[0].includes("highly flammable"));
assert.ok(ethanol.answer.markPoints[1].includes("heating is not needed"));
assert.ok(!/ethanol must be heated in a water bath/i.test(JSON.stringify(ethanol)));
// One mark tests a single independently scoreable idea. Procedure, observation
// and scientific inference must not be bundled as mandatory extra sentences.
const expectedPoints={
 "bio-y8-food-tests-benedict-s-solution-explain":["the reagent used to detect reducing sugar"],
 "bio-y8-food-tests-water-bath-explain":["a safe, controlled method for heating Benedict's test mixture indirectly"],
 "bio-y8-app-ethanol-safety":[
  "ethanol is highly flammable, so it must be kept away from naked flames",
  "heating is not needed for the ethanol emulsion test"
 ],
 "bio-y8-food-tests-application-20261025-ethanol-emulsion-stages":[
  "shake the food sample with ethanol","add water after shaking the sample with ethanol"
 ],
 "bio-y8-food-tests-application-20261025-positive-sugar":[
  "heated Benedict's solution changes from blue to orange","reducing sugar is present"
 ],
 "bio-y8-food-tests-application-20261025-recording":[
  "record the reagent or type of test used","record the observed colour change or appearance"
 ],
 "bio-y8-food-tests-application-20261025-sample-separation":[
  "using separate portions prevents reagent from one test interfering with the other",
  "iodine and Benedict's tests use different reagents and conditions"
 ]
};
for(const [id,points] of Object.entries(expectedPoints)){
 const item=food.questions.find(q=>q.id===id);
 assert.ok(item,id);
 assert.deepEqual(item.answer.markPoints,points,id+" mark scheme drift");
 assert.equal(item.answer.totalMarks||points.length,points.length,id+" mark total mismatch");
}
assert.equal(food.questions.length,143);
console.log("PASS: 64 food cases, 4 unheated ethanol corrections, 2 indices workings, 9 numeric/units checks");
