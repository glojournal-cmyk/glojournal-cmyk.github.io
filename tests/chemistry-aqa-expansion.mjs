import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const bank=JSON.parse(read('assessment/chemistry-school-1.json'));
const addon=JSON.parse(read('assessment/chemistry-school-style-20260927.json'));
const src=read('assessment/app-v2.js');
const context=vm.createContext({Math,Set,String,Object,RegExp,Number,window:{},state:{results:[]},save(){},grantWardrobe(){}});
vm.runInContext(src.slice(src.indexOf('function shuffle(a)'),src.indexOf('function selectCreusa(')),context);
vm.runInContext(src.slice(src.indexOf('function normal('),src.indexOf('async function start(')),context);
vm.runInContext(src.slice(src.indexOf('function questionMarks('),src.indexOf('function finish(')),context);
vm.runInContext(read('assessment/marking-hotfix-v3.js'),context);

const fresh=bank.questions.filter(q=>q.contentTier==='school_aqa_style');
assert.equal(fresh.length,72);
assert.equal(bank.bankSize,202);
assert.equal(bank.questions.length+addon.questions.length,230);
assert.equal(new Set(fresh.map(q=>q.conceptId)).size,72);
assert.ok(fresh.every(q=>q.source.file&&q.source.locator&&q.marks>=1&&q.marks<=4));
assert.ok(fresh.every(q=>['chem-y9-c1','chem-y9-c3','chem-y9-c4'].includes(q.topicId)));
for(const q of fresh){
  assert.equal(context.mark(q,q.modelAnswer).credit,1,q.id+' model answer');
  assert.equal(context.mark(q,q.modelAnswer.toUpperCase()).credit,1,q.id+' case handling');
  assert.equal(context.mark(q,'').credit,0,q.id+' blank');
  assert.equal(context.mark(q,'banana').credit,0,q.id+' unrelated answer');
  assert.equal(context.questionMarks(q),q.marks);
  for(const point of q.answer.points)for(const alt of point.alternatives||[]){
    assert.ok(context.mark(q,alt).matched>=1,q.id+' declared alternative: '+alt);
  }
}
const get=id=>fresh.find(q=>q.id.endsWith('-'+id));
assert.equal(context.mark(get('002'),'He left gaps for undiscovered elements.').matched,1,'One distinct point earns one mark');
assert.equal(context.mark(get('002'),'He left gaps for undiscovered elements. He left gaps for undiscovered elements.').matched,1,'Repeating one point cannot earn a second mark');
assert.equal(context.mark(get('012'),'Newlands left gaps and Mendeleev left no gaps.').matched,0,'Reversing scientists is wrong');
assert.equal(context.mark(get('046'),'Ethanol is not flammable.').matched,0,'A negated hazard must not score');
assert.equal(context.mark(get('051'),'0.50').matched,1,'Final answer alone earns its mark');
assert.equal(context.mark(get('051'),'40 / 80 = 0.50').matched,2,'Method plus final answer earns both marks');
assert.equal(context.mark(get('051'),'40 / 80 = 0.75').matched,1,'Wrong final answer keeps method mark');
assert.equal(context.mark(get('051'),'0.50 mm').matched,0,'Rf has no unit');
assert.equal(context.mark(get('053'),'70 mm').matched,1,'Distance final answer with unit');
assert.equal(context.mark(get('053'),'70 cm').matched,0,'Wrong unit is not equivalent');
assert.equal(context.mark(get('060'),'0.453125').matched,0,'Two-decimal rounding required');
assert.equal(context.questionMarks(bank.questions[0]),1,'Legacy questions retain one mark');
assert.equal(context.mark({id:'french-test',answer:{mode:'exact_or_equivalent',accepted:['bonjour']}},'bonjour').credit,1,'Other subjects retain marking');

const mapped=new Set(['chem-schoolstyle-201','chem-schoolstyle-204','chem-schoolstyle-205','chem-schoolstyle-212','chem-schoolstyle-217']);
const questions=[...bank.questions,...addon.questions.map(q=>mapped.has(q.id)?{...q,conceptId:'chem-rf-calc-direct'}:q.id==='chem-schoolstyle-219'?{...q,conceptId:'chem-rf-calc-spot-distance'}:q)];
const quotas={'Periodic table':4,'Separation':4,'RP6 method':4,'RP6 errors':2,'Chromatogram':4,'Rf':9,'Solvents':1,'RP6':2};
let previous=[];
for(let i=0;i<500;i++){
  const paper=context.selectChemistry(questions,30,previous,quotas);
  assert.equal(paper.length,30);
  assert.equal(context.chemistryLevel(paper[0]),1,'Start with foundation recall');
  assert.ok(paper.filter(q=>context.chemistryLevel(q)===1).length>=3,'Include foundation across topics');
  assert.equal(new Set(paper.map(q=>q.conceptId)).size,30);
  assert.ok(paper.filter(q=>q.contentTier==='school_aqa_style').length>=16,'AQA-style questions must appear');
  assert.equal(paper.filter(q=>q.topic==='Rf').length,9);
  const total=paper.reduce((sum,q)=>sum+context.questionMarks(q),0);
  assert.ok(total>=38&&total<=62,'45-minute blend of one-mark and multi-mark questions');
  assert.ok(paper.every((q,j)=>j===0||context.chemistryLevel(paper[j-1])<=context.chemistryLevel(q)),'Easy-to-hard progression');
  previous=paper.map(q=>q.id);
}

const catalog=JSON.parse(read('content/catalog.json'));
for(const [id,added] of [['chem-y9-c1',16],['chem-y9-c3',22],['chem-y9-c4',34]]){
  const doc=JSON.parse(read('content/topics/'+id+'.json'));
  const entry=catalog.topics.find(t=>t.topicId===id);
  assert.equal(doc.questions.filter(q=>q.contentTier==='school_aqa_style').length,added);
  assert.equal(entry.questions,doc.questions.length);
  assert.equal(entry.enabled,doc.enabled);
  assert.equal(new Set(doc.questions.map(q=>q.id)).size,doc.questions.length);
}
// Exercise the whole submitted-paper calculation and saved history, not only individual answers.
let rendered='';
context.$=()=>({set innerHTML(v){rendered=v},set onclick(v){}});
context.state={results:[],recent:{},drafts:{}};
context.clearInterval=()=>{};context.timer=null;
context.cards=()=>{};context.esc=x=>String(x??'');context.showAnswer=q=>q.modelAnswer||q.answer.accepted[0];
context.formatMarks=n=>String(n);context.PRIZES={};
vm.runInContext(src.slice(src.indexOf('function finish(')),context);
const paper={id:'chemistry',name:'Chemistry'};
const draft={questions:[get('002'),bank.questions[0]],answers:{0:'He left gaps for undiscovered elements.',1:bank.questions[0].answer.accepted[0]}};
context.finish(paper,draft);
assert.equal(context.state.results[0].marks,2);
assert.equal(context.state.results[0].total,3);
assert.equal(context.state.results[0].score,66);
assert.ok(rendered.includes('How to earn full marks'));
assert.ok(rendered.includes('Awarded · 1 mark:'));
assert.ok(rendered.includes('Missing · 1 mark:'));
assert.ok(rendered.includes('1 of 2 marks'),'Partial-credit feedback uses actual marks');
console.log('72 source-scoped questions; rubrics, units, partial marks, history totals, Master metadata and 500 new paper selections passed.');
// Full-mark mastery is scoped to these chemistry rubrics; existing subjects keep their policy.
const masterSrc=read('assets/quiz-session-rWAnuDVj.js');
const startB=masterSrc.indexOf('function B(e,t,n,r)');
const endB=masterSrc.indexOf('function ',startB+9);
const master=vm.createContext({L:q=>q.answer.modelAnswer,I:()=>[],R:()=>3,Math});
vm.runInContext(masterSrc.slice(startB,endB),master);
const fourPoint={format:'mark_points',answer:{markPoints:['a','b','c','d'],requireFullMarks:true}};
assert.equal(master.B(fourPoint,'response','chemistry').ok,false,'3/4 is partial, not full mastery');
assert.equal(master.B(fourPoint,'response','chemistry').score,3,'Keep earned partial marks');
assert.equal(master.B({...fourPoint,answer:{...fourPoint.answer,requireFullMarks:false}},'response','biology').ok,true,'Existing marking policy unchanged');
master.R=()=>4;
assert.equal(master.B(fourPoint,'response','chemistry').ok,true,'4/4 completes mastery');
