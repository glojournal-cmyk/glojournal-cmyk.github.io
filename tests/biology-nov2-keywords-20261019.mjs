import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../assessment/biology-nov2-marking-20261017.js',import.meta.url),'utf8'),context);
const {grade}=context.LuxBiologyNov2;
const bank=JSON.parse(fs.readFileSync(new URL('../assessment/biology-nov2-20261017.json',import.meta.url),'utf8')).questions;
let checked=0;
for(const q of bank){
  assert.equal(grade(q,q.modelAnswer).credit,1,q.id+' model');
  checked++;
  if(!q.answer.numeric){
    assert.equal(grade(q,q.modelAnswer.replace(/[.,;]/g,' ')).credit,1,q.id+' punctuation omitted');checked++;
  }
}
const cases=[["002","aerobic respiration releases energy",2],["002","AEROBIC RESPIRATION / ENERGY RELEASE",2],["002","releases energy aerobic respiration",2],["002","aerobik respiration releases energy",1],["002","aerobic respirations releases energy",1],["002","aerobic respiration releases energi",1],["002","aerobic respiration does not release energy",1],["002","mitochondria do not carry out aerobic respiration and do not release energy",0],["001","DNA controls cell activities",2],["001","dnaa controls cell activities",1],["001","contains DNA controls cell activites",1],["003","selectively permeable",1],["003","controls entry and exit",1],["005","ribosomes",1],["005","ribosomess",0],["005","ribosomee",0],["010","tail for swimming mitochondria for energy",2],["010","tail for swimming mitochonria for energy",1],["017","respiration releases energy for contraction",2],["017","respiration releases energy for contraktion",1],["025","large surface area absorption of water and mineral ions",2],["026","osmosis",1],["026","osmosiss",0],["026","osmossis",0],["027","active transport respiration releases energy",2],["027","active transpoort respiration releases energy",1],["031","strengthens walls prevents collapse",2],["031","strenghtens walls prevents collapse",1],["035","respiration releases energy active transport of sugar",2],["051","clear single lines no shading",2],["052","straight lines must not cross",2],["007","chloroplasts permanent vacuole",2],["007","chloroplaasts permanent vacuole",1],["039","methylene blue increases contrast",2],["039","methyline blue increases contrast",1],["019","binds oxygen",1],["019","binds oxygenn",0],["070","13 micrometres",3],["070","13 micrometress",2],["070","13 umm",2]];
for(const [id,response,marks] of cases){
  const q=bank.find(q=>q.id.endsWith(id));
  assert.equal(grade(q,response).matched,marks,id+': '+response);checked++;
}
console.log(checked+' Biology marking checks passed: models, terse keywords, spelling, partial credit and negation.');
