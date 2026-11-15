import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
await import('../assessment/biology-nov2-marking-20261017.js');
const bank=JSON.parse(fs.readFileSync('assessment/biology-nov2-20261017.json'));
const {grade,select}=globalThis.LuxBiologyNov2;
assert.equal(bank.assessmentDate,'2026-11-02');
assert.equal(bank.questions.length,84);
assert.equal(new Set(bank.questions.map(q=>q.id)).size,84);
assert.equal(new Set(bank.questions.map(q=>q.topic)).size,6);
const numbers=bank.questions.filter(q=>q.answer.numeric);
assert.equal(numbers.length,24);
for(const q of bank.questions){
  assert(q.marks>=1&&q.marks<=4,q.id);
  assert.equal(q.marks,q.answer.points.length,q.id);
  assert.equal(grade(q,q.modelAnswer).credit,1,'model rejected: '+q.id);
  assert.equal(grade(q,'').credit,0,q.id);
  assert.equal(grade(q,'I do not know').credit,0,q.id);
  assert.equal(grade(q,q.modelAnswer.toUpperCase().replaceAll(' ','   ')).credit,1,'case/spacing: '+q.id);
  assert(q.hint&&q.examGuidance?.strategy&&q.examGuidance.commonError,q.id);
  assert(!/culturing|aseptic|mitosis|differentiation/i.test(q.topic+' '+q.prompt),'outside scope: '+q.id);
}
for(const q of numbers){
  const {value,unit}=q.answer.numeric;
  const aliases=unit==='µm'?['µm','μm','um','micrometres','micrometers']:unit?[unit,'millimetres']:['','times'];
  for(const alias of aliases){
    const got=grade(q,`${value}${alias}`);
    assert.equal(got.pointResults[0],false,q.id+' bare answer awarded the method mark: '+alias);
    assert.equal(got.matched,q.marks-1,`${q.id}: ${alias}`);
  }
  assert.equal(grade(q,`${value*7+1} ${unit}`).credit,0,'wrong final number: '+q.id);
  if(unit){
    assert.equal(grade(q,String(value)).matched,1,'missing unit should keep only the answer mark: '+q.id);
    const wrongUnit=unit==='µm'?'mm':'µm';
    assert(grade(q,`${value} ${wrongUnit}`).credit<1,'wrong unit accepted: '+q.id);
  }
  const sentence=grade(q,`My final answer is ${value} ${unit}.`);
  assert.equal(sentence.pointResults[0],false,q.id+' final sentence awarded method');
  assert.equal(sentence.matched,q.marks-1,q.id);
}
const q=fragment=>bank.questions.find(q=>q.prompt.includes(fragment));
assert.equal(grade(q('two structures present'),'Chloroplasts / cell wall').credit,1);
assert.equal(grade(q('two structures present'),'chloroplasts, chloroplasts').matched,1);
assert.equal(grade(q('two adaptations that help a sperm'),'The tail makes it swim. Lots of mitochondria release energy for moving.').credit,1);
assert.equal(grade(q('many mitochondria.'),'Mitochondria do not release energy. Energy is not needed for contraction.').credit,0);
assert.equal(grade(q('stain used for an onion'),'Iodine').matched,1,'partial scientific answer');
const wording=[
 ['role of lignin','Lignin reinforces the walls and stops them collapsing.',1],
 ['acrosome helps','Enzymes in the acrosome break down the egg coat.',1],
 ['long axon of a neurone','It sends nerve signals a long distance along the arm.',1],
 ['red blood cell is flexible','It can bend. It squeezes through narrow capillaries.',1],
 ['ciliated epithelial cells','Cilia waft mucus to the throat. Mucus traps dust.',1],
 ['sieve plates help','Pores let the sugar solution pass between the sieve tube elements.',1],
 ['conducting cells in mature xylem','Xylem cells are dead. Sieve tubes are alive.',1],
 ['lower the coverslip','Lower the coverslip at an angle with a needle so fewer air bubbles are trapped.',1],
 ['Compare magnification and resolution','Magnification enlarges the image. Resolution separates close points.',1],
 ['objective magnification of x50','10 times 50 = 500',1],
 ['drawing length in mm at x2500','0.01 multiplied by 2500 = 25 millimetres',1]
];
for(const [fragment,answer,credit] of wording)assert.equal(grade(q(fragment),answer).credit,credit,fragment);
for(const topic of new Set(bank.questions.map(q=>q.topic))){
  const set=select(bank.questions,{topic,size:5});assert.equal(set.length,5);assert(set.every(q=>q.topic===topic));
  assert(set.every((q,i)=>i===0||q.difficulty>=set[i-1].difficulty));
}
for(let i=0;i<50;i++){
  const first=select(bank.questions,{size:10}),next=select(bank.questions,{size:10,previous:first.map(q=>q.id)});
  assert.equal(new Set(next.map(q=>q.id)).size,10);assert(next.every(q=>!first.some(p=>p.id===q.id)));
}
assert.deepEqual(select(bank.questions,{topic:'weak',weak:[]}),[]);
assert.deepEqual(select(bank.questions,{topic:'weak',weak:[bank.questions[0].id]}).map(q=>q.id),[bank.questions[0].id]);
const source=fs.readFileSync('assessment/app-v2.js','utf8'),context=vm.createContext({Math,Set});
vm.runInContext(source.slice(0,source.indexOf('const GARDEN_KEY'))+'\nglobalThis.papers=PAPERS;',context);
vm.runInContext(source.slice(source.indexOf('function shuffle('),source.indexOf('function chemistryLevel(')),context);
const paper=context.papers.find(p=>p.id==='biology-nov2');
assert.equal(paper.count,20);assert.equal(paper.minutes,45);assert(context.papers.some(p=>p.id==='biology-cell-structure'),'16 November paper preserved');
const first=context.select(bank.questions,paper.count,[],paper.groups),next=context.select(bank.questions,paper.count,first.map(q=>q.id),paper.groups);
assert.equal(first.length,20);assert(next.every(q=>!first.some(p=>p.id===q.id)));
for(const [topic,n] of Object.entries(paper.groups))assert.equal(first.filter(q=>q.topic===topic).length,n);
const wrap=vm.createContext({mark:()=>({credit:.25})});
vm.runInContext(fs.readFileSync('assessment/biology-nov2-marking-20261017.js','utf8'),wrap);
assert.equal(wrap.mark(bank.questions[0],bank.questions[0].modelAnswer).credit,1);
assert.equal(wrap.mark({assessmentId:'other'},'test').credit,.25,'unrelated marking changed');
console.log('Biology Nov2 QA passed: 84 model answers, 24 calculation rubrics and unit aliases, partial/negative answers, topic sets, non-repetition, balanced timed papers and isolated marking.');
