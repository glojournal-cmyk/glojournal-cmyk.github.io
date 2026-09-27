import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const bank=JSON.parse(fs.readFileSync(new URL('../assessment/chemistry-school-1.json',import.meta.url)));
const script=fs.readFileSync(new URL('../assessment/app-v2.js',import.meta.url),'utf8');
const context=vm.createContext({Math,Set,String,Object});
vm.runInContext(script.slice(script.indexOf('function shuffle(a)'),script.indexOf('function selectCreusa(')),context);
vm.runInContext(script.slice(script.indexOf('function normal('),script.indexOf('async function start(')),context);

assert.equal(bank.questions.length,130);
assert.equal(new Set(bank.questions.map(q=>q.id)).size,bank.questions.length);
assert.ok(bank.questions.every(q=>q.conceptId),'Every chemistry question needs a concept ID');
for(const q of bank.questions.filter(q=>Number(q.id.split('-').at(-1))>=88)){
  assert.equal(context.mark(q,q.modelAnswer).credit,1,`${q.id} must accept its model answer`);
}

const addon=JSON.parse(fs.readFileSync(new URL('../assessment/chemistry-school-style-20260927.json',import.meta.url)));
const scriptAddon=fs.readFileSync(new URL('../assessment/chemistry-schoolstyle-20260927.js',import.meta.url),'utf8');
const mappedIds=['chem-schoolstyle-201','chem-schoolstyle-204','chem-schoolstyle-205','chem-schoolstyle-212','chem-schoolstyle-217'];
for(const id of mappedIds)assert.ok(scriptAddon.includes(`'${id}':'chem-rf-calc-direct'`));
const combined=[...bank.questions,...addon.questions.map(q=>mappedIds.includes(q.id)?{...q,conceptId:'chem-rf-calc-direct'}:q.id==='chem-schoolstyle-219'?{...q,conceptId:'chem-rf-calc-spot-distance'}:q)];
const quotas={'Periodic table':4,'Separation':4,'RP6 method':4,'RP6 errors':2,'Chromatogram':4,'Rf':9,'Solvents':1,'RP6':2};
assert.equal(Object.values(quotas).reduce((a,b)=>a+b,0),30);
assert.equal(new Set(bank.questions.slice(100).map(q=>q.conceptId)).size,15);
for(const q of bank.questions.slice(100)){
  assert.equal(q.topic,'Rf');
  assert.equal(context.mark(q,q.modelAnswer).credit,1,`${q.id} must accept its final answer`);
  assert.equal(context.mark(q,'99').credit,0,`${q.id} must reject a wrong number`);
  assert.ok(q.workedSolution.includes('='),`${q.id} must show working`);
}
assert.equal(context.mark(bank.questions.find(q=>q.id==='chem-school-1-102'),'0.47').credit,0,'Rounding must be correct');
let previous=[];
for(let attempt=0;attempt<500;attempt++){
  const paper=context.selectChemistry(combined,30,previous,quotas);
  assert.equal(paper.length,30);
  assert.equal(new Set(paper.map(q=>q.conceptId)).size,30,'Repeated concept in one paper');
  const diagrams=paper.map(q=>q.diagram).filter(Boolean);
  assert.equal(new Set(diagrams).size,diagrams.length,'Repeated diagram in one paper');
  assert.ok(new Set(paper.map(q=>q.topic)).size>=7,'Paper needs topic variety');
  assert.equal(paper.filter(q=>q.topic==='Rf').length,9,'Paper needs nine Rf questions');
  assert.ok(paper.filter(q=>!q.options?.length).length>=15,'Paper needs substantial written work');
  previous=paper.map(q=>q.id);
}
console.log('Chemistry bank: 130 base + 28 school-style questions, 500 papers checked for unique concepts, figures and nine Rf questions.');
