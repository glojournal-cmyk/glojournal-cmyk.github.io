import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const bank=JSON.parse(fs.readFileSync(new URL('../assessment/chemistry-school-1.json',import.meta.url)));
const script=fs.readFileSync(new URL('../assessment/app-v2.js',import.meta.url),'utf8');
const context=vm.createContext({Math,Set,String,Object});
vm.runInContext(script.slice(script.indexOf('function shuffle(a)'),script.indexOf('function selectCreusa(')),context);
vm.runInContext(script.slice(script.indexOf('function normal('),script.indexOf('async function start(')),context);

assert.equal(bank.questions.length,100);
assert.equal(new Set(bank.questions.map(q=>q.id)).size,bank.questions.length);
assert.ok(bank.questions.every(q=>q.conceptId),'Every chemistry question needs a concept ID');
for(const q of bank.questions.filter(q=>Number(q.id.split('-').at(-1))>=88)){
  assert.equal(context.mark(q,q.modelAnswer).credit,1,`${q.id} must accept its model answer`);
}

const quotas={'Periodic table':6,'Separation':8,'RP6 method':5,'RP6 errors':1,'Chromatogram':2,'Rf':5,'Solvents':1,'RP6':2};
let previous=[];
for(let attempt=0;attempt<500;attempt++){
  const paper=context.selectChemistry(bank.questions,30,previous,quotas);
  assert.equal(paper.length,30);
  assert.equal(new Set(paper.map(q=>q.conceptId)).size,30,'Repeated concept in one paper');
  const diagrams=paper.map(q=>q.diagram).filter(Boolean);
  assert.equal(new Set(diagrams).size,diagrams.length,'Repeated diagram in one paper');
  assert.ok(new Set(paper.map(q=>q.topic)).size>=7,'Paper needs topic variety');
  assert.ok(paper.filter(q=>!q.options?.length).length>=15,'Paper needs substantial written work');
  previous=paper.map(q=>q.id);
}
console.log('Chemistry bank: 100 questions, 500 papers checked for unique concepts and figures.');
