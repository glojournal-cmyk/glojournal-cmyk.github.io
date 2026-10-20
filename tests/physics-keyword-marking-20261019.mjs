import fs from "node:fs";
import assert from "node:assert/strict";
import {gradePhysicsAnswer} from "../assets/physics-keyword-marking-20261019.js";

const root="content/topics";
const files=fs.readdirSync(root).filter(f=>/^phys-.*\.json$/.test(f));
const questions=files.flatMap(f=>JSON.parse(fs.readFileSync(root+"/"+f,"utf8")).questions||[]);
let checked=0;
for(const q of questions){
 const model=q.answer?.modelAnswer||q.answer?.accepted?.[0]||q.answer?.markPoints?.join("; ");
 if(!model)continue;
 const result=gradePhysicsAnswer(q,model,model);
 if(!result)continue;
 assert.equal(result.ok,true,"Canonical physics answer failed: "+q.id);
 checked++;
}
const question=id=>{const result=questions.find(q=>q.id.endsWith(id));assert.ok(result,id);return result};
const mark=(id,input)=>{const q=question(id);return gradePhysicsAnswer(q,input,q.answer?.modelAnswer||q.answer?.accepted?.[0]||q.answer?.markPoints?.join("; "))?.ok};
for(const answer of [
 "Current is rate of flow of electric charge measured in amperes",
 "  Current  is the rate of flow of electric charge, measured in amperes (A)! "
])assert.equal(mark("current-typed",answer),true,answer);
for(const answer of [
 "Current is the rate of flwo of electric charge measured in amperes",
 "Current is the rate of flow of electric charge"
])assert.equal(mark("current-typed",answer),false,answer);
assert.equal(mark("pole-rule-typed","Like poles repel and unlike poles attract"),true);
assert.equal(mark("pole-rule-typed","Like poles attract and unlike poles repel"),false);
assert.equal(mark("field-strength-typed","A stronger magnetic field"),true);
assert.equal(mark("field-strength-typed","A stronger magentic field"),false);
assert.equal(mark("store-list-typed","kinetic, thermal, chemical, nuclear"),true);
assert.equal(mark("store-list-typed","kinetic, thermal, chemical, unicorn"),false);
assert.equal(mark("pressure-equation-typed","pressure = force / area"),true);
assert.equal(mark("pressure-equation-typed","pressure = area / force"),false);
assert.equal(mark("current-typed","Current rate flow electric charge measured A"),true);
assert.equal(mark("potential-difference-typed","Energy transferred per unit charge, measured in volts (V)."),true);
assert.equal(mark("potential-difference-typed","Energy transferred per unit charge measured in V"),true);
assert.equal(mark("law-reflection-typed","angle incidence = angle reflection"),true);
assert.equal(mark("pressure-equation-typed","pressure equals force divided by area"),true);
assert.equal(mark("pressure-equation-typed","pressure equals area divided by force"),false);
assert.equal(mark("magnetic-materials-typed","iron,nickel,cobalt"),true);
assert.equal(mark("magnetic-materials-typed","iron nikcel cobalt"),false);
const short=question("current-apply");
const exact=short.answer.markPoints.join("; ");
assert.equal(gradePhysicsAnswer(short,exact,exact)?.ok,true);
assert.equal(gradePhysicsAnswer(short,"The switch breaks the conducting loop; charge can flow continuously; current is zero",exact)?.ok,false);
const calc=questions.find(q=>q.format==="calculation");
assert.ok(calc);
assert.equal(gradePhysicsAnswer(calc,"123","123"),null,"Calculations must use strict existing marker");
console.log("Physics rubric QA passed: "+checked+" canonical short/prose answers plus strict spelling, units, direction, math, punctuation and contrast cases.");
