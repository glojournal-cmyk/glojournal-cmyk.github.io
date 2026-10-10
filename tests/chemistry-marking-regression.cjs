'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const questionBank=JSON.parse(file('assessment/chemistry-school-1.json')).questions;

function assessmentMarker(){
  const source=file('assessment/app-v2.js');
  const start=source.indexOf('function normal(');
  const end=source.indexOf('async function start(',start);
  assert.ok(start>=0&&end>start,'Assessment marking definitions found');
  const context=vm.createContext({
    window:{},document:{querySelector:()=>null},state:{results:[]},
    save:()=>{},grantWardrobe:()=>{}
  });
  vm.runInContext(source.slice(start,end)+'\n'+file('assessment/marking-hotfix-v3.js'),context,{timeout:10000});
  assert.equal(typeof context.mark,'function');
  return context.mark;
}
function practiceMarker(){
  const source=file('assets/quiz-session-y8fix-20260920.js');
  const start=source.indexOf('function CX(');
  const end=source.indexOf('function V(',start);
  assert.ok(start>=0&&end>start,'Live practice marking definitions found');
  const context=vm.createContext({
    I:q=>[...(q.answer.accepted||[])],
    L:q=>q.answer.modelAnswer||q.answer.accepted?.[0]||''
  });
  vm.runInContext(source.slice(start,end),context,{timeout:10000});
  assert.equal(typeof context.B,'function');
  return context.B;
}
const q=id=>{
  const found=questionBank.find(row=>row.id===id);
  assert.ok(found,'Known Chemistry question '+id);
  return found;
};
const marks=assessmentMarker(),practice=practiceMarker();

test('all 202 Chemistry model answers receive full credit',()=>{
  assert.equal(questionBank.length,202);
  for(const row of questionBank){
    assert.equal(marks(row,row.answer.accepted[0]).credit,1,row.id+' model answer');
  }
});
test('all 202 Chemistry model answers preceded by NOT are rejected',()=>{
  for(const row of questionBank){
    assert.equal(marks(row,'NOT '+row.answer.accepted[0]).credit,0,row.id+' negated answer');
  }
});
test('Chemistry accepts genuine equivalents without accepting negated science',()=>{
  const cases=[
    ['chem-school-1-01',' LAVOISIER. ',1],
    ['chem-school-1-01','not Lavoisier',0],
    ['chem-school-1-02','relative atomic mass',1],
    ['chem-school-1-02','atomic number not atomic mass',0],
    ['chem-school-1-02','Newlands used atomic mass, not atomic number',1],
    ['chem-school-1-39','0.6',1],
    ['chem-school-1-39','0.60',1],
    ['chem-school-1-39','0.8',0]
  ];
  for(const [id,answer,credit] of cases)
    assert.equal(marks(q(id),answer).credit,credit,id+': '+answer);
});
test('daily Chemistry pH scientific equivalents and wrong relationships',()=>{
  const question={id:'chem-y8-acids-indicators-ph-ph-categories-typed',format:'typed_exact',answer:{
    accepted:['Acid below 7; neutral 7; alkali above 7']
  }};
  const cases=[
    ['Acid below 7, neutral 7, alkali above 7',true],
    ['acid <7; neutral =7; alkali >7',true],
    ['pH less than 7 is acidic, pH 7 is neutral, pH greater than 7 is alkaline',true],
    ['pH < 7 is acidic, pH = 7 is neutral, pH > 7 is alkaline',true],
    ['Acidic pH below 7, neutral pH 7, alkaline pH above 7',true],
    ['Acidic is below pH 7; neutral is pH 7; alkaline is above pH 7',true],
    ['Acidic means pH lower than 7, neutral pH equals 7, basic pH higher than 7',true],
    ['Acid below 7 neutral 7 alkali above 7',true],
    ['acid greater than 7, neutral 7, alkali below 7',false],
    ['Acid below 7, neutral 7, alkali above 7, acid above 7',false],
    ['acid 7, neutral below 7, alkali above 7',false]
  ];
  for(const [answer,expected] of cases)
    assert.equal(practice(question,answer,'chemistry').ok,expected,answer);
});
test('daily Chemistry tolerates case, whitespace and chemical subscripts',()=>{
  const prose={id:'chem-regression-prose',format:'typed_exact',answer:{accepted:['a mixture of gases']}};
  assert.equal(practice(prose,' A MIXTURE   OF GASES. ','chemistry').ok,true);
  const formula={id:'chem-regression-formula',format:'typed_exact',answer:{accepted:['H₂O']}};
  for(const value of ['H2O','H₂O','H 2 O'])
    assert.equal(practice(formula,value,'chemistry').ok,true,value);
});
