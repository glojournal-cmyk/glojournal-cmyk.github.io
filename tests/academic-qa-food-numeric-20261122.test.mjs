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

console.log("PASS: 64 food-test cases and feedback, 2 indices workings, 9 numeric/units/classification checks");
