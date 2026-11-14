// 14 November 2026: academic-content regression across ALL newly issued teaching material.
// These checks supplement substantive reading against the actual school guides
// and the AQA specifications; they are not teacher/awarding-body moderation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LATIN_BOOKLET_RECORDS} from '../assets/latin-vocabulary-booklet-20261023.js';
import {MOCK} from '../study/latin/november-2026/exam-data.js';
import {UNSEEN_PASSAGES,validateUnseens} from '../study/latin/november-2026/unseen-passages.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const chem=JSON.parse(read('content/exam-revision/chemistry-nov16-2026-applied.json'));
const chemTopic=JSON.parse(read('content/topics/chem-y9-c7.json'));
const physics=JSON.parse(read('assessment/physics-nov26-20261113.json'));
const biology=JSON.parse(read('assessment/biology-cell-structure-20261003.json'));
const frenchHtml=read('assessment/french-nov26/index.html');
const biologyGuide=read('assessment/biology-cell-structure/index.html');
const phys=physics.groups.flatMap(g=>g.questions);
const bioNew=biology.questions.filter(q=>q.id.startsWith('bio-cell-20261114-'));
const mapById=qs=>new Map(qs.map(q=>[q.id,q]));
const phyById=mapById(phys),chemById=mapById(chem.questions),bioById=mapById(biology.questions);
const unique=qs=>new Set(qs.map(q=>q.id)).size===qs.length;

test('Latin: 130 taught headwords, 5x10 MC and 50-minute 75-mark mock are separate',()=>{
  const booklet=LATIN_BOOKLET_RECORDS.filter(x=>[1,2,3].includes(x.chapter));
  assert.equal(booklet.length,130);
  assert.equal(validateUnseens(),true);
  assert.equal(UNSEEN_PASSAGES.length,5);
  assert.ok(UNSEEN_PASSAGES.every(p=>p.questions.length===10));
  assert.equal(MOCK.durationMinutes,50);
  assert.deepEqual(MOCK.sections.map(s=>s.questions.reduce((n,q)=>n+q.points.length,0)),[11,14,50]);
});

test('Chemistry: 88 new applied questions, all rubrics and choices internally correct',()=>{
  assert.equal(chem.questions.length,88);
  assert.ok(unique(chem.questions));
  assert.equal(chem.assessmentExclusions.length,16);
  assert.equal(new Set(chem.assessmentExclusions).size,16);
  assert.equal(chem.assessmentIncludedCount,134);
  for(const q of chem.questions){
    assert.ok(q.prompt&&q.feedback?.steps?.length&&q.answer?.accepted?.length,q.id);
    assert.ok(Number.isInteger(q.marks)&&q.marks>=1&&q.marks<=6,q.id);
    if(q.format==='rubric_response'){
      assert.equal(q.markScheme.length,q.marks,q.id);
      assert.equal(q.answer.mode,'self_review_rubric',q.id);
      assert.ok(q.markScheme.every(p=>p.length>8),q.id);
    }
    if(q.format==='mc_single'){
      assert.equal(q.answer.mode,'choice',q.id);
      assert.equal(new Set(q.options).size,q.options.length,q.id);
      assert.equal(q.options.filter(x=>x===q.answer.accepted[0]).length,1,q.id);
    }
  }
});

test('Chemistry school scope: 12 new out-of-scope isotope, ion and electron-shell questions are never eligible',()=>{
  const off=Array.from({length:18},(_,i)=>'chem-nov16-2026-calc-applied-'+String(i+1).padStart(2,'0'))
    .filter(id=>chem.assessmentExclusions.includes(id));
  assert.deepEqual(off,[
    'chem-nov16-2026-calc-applied-03','chem-nov16-2026-calc-applied-04',
    'chem-nov16-2026-calc-applied-05','chem-nov16-2026-calc-applied-06',
    'chem-nov16-2026-calc-applied-07','chem-nov16-2026-calc-applied-08',
    'chem-nov16-2026-calc-applied-10','chem-nov16-2026-calc-applied-11',
    'chem-nov16-2026-calc-applied-12','chem-nov16-2026-calc-applied-13',
    'chem-nov16-2026-calc-applied-15','chem-nov16-2026-calc-applied-16'
  ]);
  assert.ok(chem.questions.filter(q=>!chem.assessmentExclusions.includes(q.id)).length===76);
  assert.ok(chem.questions.filter(q=>q.id.includes('-calc-scope-')).length===16);
  assert.deepEqual(chem.scope,['C1.5 History of the atom','C1.6 Atomic structure','chemical formulae','balancing equations']);
});

function normalizeEquation(s){
  return s.replace(/[₀-₉]/g,ch=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(ch)))
   .replace(/\s/g,'').replaceAll('→','->');
}
function formulaAtoms(s){
  let i=0;
  const number=()=>{let st=i;while(/[0-9]/.test(s[i]||''))i++;return st===i?1:Number(s.slice(st,i))};
  function parseGroup(){
    const totals={};
    while(i<s.length&&s[i]!==')'){
      if(s[i]==='('){i++;const child=parseGroup();assert.equal(s[i],')','Unclosed parenthesis in '+s);i++;const n=number();for(const [e,v] of Object.entries(child))totals[e]=(totals[e]||0)+v*n;}
      else {assert.match(s[i],/[A-Z]/,'Invalid chemical symbol in '+s);const a=s[i++];let b='';if(/[a-z]/.test(s[i]||''))b=s[i++];const n=number(),k=a+b;totals[k]=(totals[k]||0)+n;}
    }
    return totals;
  }
  const result=parseGroup();assert.equal(i,s.length,'Unparsed atom formula '+s);return result;
}
function sideAtoms(text){
  const totals={};
  for(const term of text.split('+')){
    const match=term.match(/^(\d*)(.*)$/);const n=Number(match[1]||'1');assert.ok(n>0);
    for(const [element,count] of Object.entries(formulaAtoms(match[2])))totals[element]=(totals[element]||0)+n*count;
  }
  return Object.fromEntries(Object.entries(totals).sort(([a],[b])=>a.localeCompare(b)));
}
const balanceReferences={
 '01':'2H₂ + O₂ → 2H₂O','04':'2Mg + O₂ → 2MgO','05':'4Al + 3O₂ → 2Al₂O₃',
 '07':'2H₂O₂ → 2H₂O + O₂','08':'C₃H₈ + 5O₂ → 3CO₂ + 4H₂O',
 '09':'2Cu + O₂ → 2CuO','10':'2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O',
 '11':'2Na + 2H₂O → 2NaOH + H₂','12':'Mg + 2HCl → MgCl₂ + H₂',
 '13':'Ca(OH)₂ + 2HCl → CaCl₂ + 2H₂O','18':'Mg + 2HCl → MgCl₂ + H₂',
 '19':'2H₂ + O₂ → 2H₂O','20':'Fe₂O₃ + 3CO → 2Fe + 3CO₂',
 '22':'2H₂ + O₂ → 2H₂O'
};
test('Chemistry: 14 independent equation keys conserve every element',()=>{
  for(const [short,equation] of Object.entries(balanceReferences)){
    const q=chemById.get('chem-nov16-2026-balance-applied-'+short);
    assert.ok(q,'Missing balanced-equation question '+short);
    const full=normalizeEquation(equation);
    assert.ok(q.answer.accepted.some(x=>normalizeEquation(x).includes(full)),'Incorrect published mark scheme '+q.id);
    const [left,right]=full.split('->');
    assert.deepEqual(sideAtoms(left),sideAtoms(right),'Atom balance fails in '+q.id);
  }
  const o=chemById.get('chem-nov16-2026-balance-applied-15');
  assert.match(o.answer.accepted[0],/3\.3\s*g/);
  assert.match(chemById.get('chem-nov16-2026-calc-applied-01').answer.accepted[0],/12 neutrons/);
  assert.match(chemById.get('chem-nov16-2026-calc-applied-02').answer.accepted[0],/20/);
});
test('Chemistry main topic: 90 distinct, markable Year 9 formula/equation items',()=>{
  assert.equal(chemTopic.questions.length,90);
  assert.ok(unique(chemTopic.questions));
  for(const q of chemTopic.questions){
    assert.ok(q.prompt&&q.answer,q.id);
    if(q.format==='mc_single'){
      assert.equal(new Set(q.options).size,q.options.length,q.id);
      assert.equal(q.options.filter(x=>x===q.answer.accepted[0]).length,1,q.id);
    }else if(q.answer.mode==='mark_points'){
      assert.ok(q.answer.markPoints?.length>0,q.id);
      assert.equal(q.answer.totalMarks,q.answer.markPoints.length,q.id);
    }else if(q.answer.mode==='pair_map'){
      assert.equal(q.answer.pairs.length,4,q.id);
      assert.equal(new Set(q.answer.pairs.map(p=>p.left)).size,4,q.id);
      assert.equal(new Set(q.answer.pairs.map(p=>p.right)).size,4,q.id);
    }else assert.ok(q.answer.accepted?.length,q.id);
  }
});

test('Physics: all 200 questions in five explicitly teacher-taught topics',()=>{
  assert.equal(phys.length,200);
  assert.ok(unique(phys));
  assert.deepEqual(physics.groups.map(g=>g.questions.length),[40,40,40,40,40]);
  assert.ok(physics.groups.every(g=>!/(convection|radiation)/i.test(g.title)));
  assert.ok(phys.every(q=>!/(convection|radiation)/i.test(q.prompt)),'Question outside conduction-only school scope');
  for(const q of phys){
    assert.ok(q.prompt&&q.modelAnswer&&q.answer?.accepted?.length,q.id);
    if(q.format==='mc_single'){
      assert.equal(new Set(q.options).size,q.options.length,q.id);
      assert.equal(q.options.filter(o=>o===q.answer.accepted[0]).length,1,q.id);
    }else{
      assert.equal(q.answer.points.length,q.marks,q.id);
      assert.ok(q.answer.points.every(p=>p.label&&p.patterns?.length),q.id);
    }
  }
});
test('Physics: density, temperature, graph and measured-liquid methods agree with worked calculations',()=>{
  const check=(id,...fragments)=>{const a=phyById.get(id)?.modelAnswer||'';assert.ok(a,id);for(const x of fragments)assert.ok(a.includes(x),id+' missing '+x);};
  check('phys-nov26-d02','2.7 g/cm³');
  check('phys-nov26-d03','135 g');check('phys-nov26-d04','50 cm³');
  check('phys-nov26-d06','0.24 kg');check('phys-nov26-d08','600 kg/m³');
  check('phys-nov26-d09','25 cm³','3 g/cm³');check('phys-nov26-d10','6 g/cm³');
  check('phys-nov26-d11','0.003 m³');check('phys-nov26-d12','240 g','0.240 kg');
  check('phys-nov26-d13','16.1 g/cm³','19.3 g/cm³');
  check('phys-nov26-i04','19.7 °C');
  check('phys-nov26-i05','11.6 °C','26.9 °C');
  check('phys-nov26-i11','1.16 °C/min');check('phys-nov26-r06','3 g/cm³');
  check('phys-nov26-r11','19 cm³');
  const c=phyById.get('phys-nov26-c13');
  assert.match(c.prompt,/same material, surface area and temperature difference/);
  assert.match(c.modelAnswer,/temperature gradient/);
  assert.equal(c.answer.points.length,3);
  const l=phyById.get('phys-nov26-r05');
  assert.match(l.modelAnswer,/combined mass of the cylinder and liquid/);
  assert.match(l.modelAnswer,/Subtract the empty-cylinder mass/);
  assert.equal(l.answer.points.length,4);
});

test('Biology: 72 new Year 9 questions align to six AQA 4.1.1 sections',()=>{
  assert.equal(biology.questions.length,144);
  assert.equal(bioNew.length,72);
  assert.ok(unique(biology.questions));
  const specs=['4.1.1.1','4.1.1.2','4.1.1.3','4.1.1.4','4.1.1.5','4.1.1.6'];
  for(const s of specs){
    const qs=bioNew.filter(q=>q.specification===s);
    assert.equal(qs.length,12,s);
    assert.equal(qs.filter(q=>q.marks===2).length,6,s);
    assert.equal(qs.filter(q=>q.marks===3).length,6,s);
  }
  for(const q of bioNew){
    assert.ok(q.prompt&&q.modelAnswer&&q.markKeywords?.length,q.id);
    assert.equal(q.answer?.mode,'biology_rubric',q.id);
    assert.equal(q.answer?.points?.length,q.marks,q.id);
  }
  assert.equal((biologyGuide.match(/class="question"/g)||[]).length,156);
  assert.ok(biologyGuide.includes(bioById.get('bio-cell-20261114-083').prompt));
  assert.ok(biologyGuide.includes('plasmid inheritance is not guaranteed'));
});
test('Biology: new calculation answers verified independently',()=>{
  const expected={
    '073':['10:1','one order of magnitude'],
    '076':['0.8 micrometres','0.0008 mm'],
    '078':['5000 nanometres','5 × 10^-6'],
    '079':['40 times'],
    '081':['2.5 micrometres','2500 nanometres'],
    '121':['×400'],
    '122':['×600'],
    '127':['0.03 mm','30 µm'],
    '128':['×3000'],
    '129':['300 µm'],
    '132':['2 µm','2000 nm'],
    '133':['16 bacteria'],
    '137':['78.5 mm²'],
    '139':['3200 bacteria'],
    '140':['1600'],
    '141':['radius 9 mm','radius 6 mm'],
    '144':['154.0 mm²']
  };
  for(const [num,chunks] of Object.entries(expected)){
    const answer=bioById.get('bio-cell-20261114-'+num)?.modelAnswer||'';
    assert.ok(answer,'Missing new Biology calculation '+num);
    for(const text of chunks)assert.ok(answer.includes(text),'Incorrect '+num+': expected '+text);
  }
  const q=bioById.get('bio-cell-20261114-083');
  assert.match(q.prompt,/may contain plasmids/);
  assert.match(q.modelAnswer,/not guaranteed/);
  assert.equal(q.answer.points.length,3);
});

test('French: teacher dictation vocabulary, 25 valid writing models and AQA Higher 25-mark grid',()=>{
  const v=JSON.parse(frenchHtml.match(/var V=(\[[\s\S]*?\]);\s*var G=/)[1]);
  const g=JSON.parse(frenchHtml.match(/var G=(\[[\s\S]*?\]);\s*var P=/)[1]);
  const prompts=(new Function('return '+frenchHtml.match(/var P=(\[[\s\S]*?\]);\s*var D=/)[1]))();
  assert.equal(v.length,49);assert.equal(new Set(v.map(x=>x[1])).size,49);
  assert.equal(g.length,25);assert.equal(prompts.length,4);
  const must=['cher','chère',"c'était",'néanmoins','pendant lequel',"que je n'ai pas aimé",'nous irons','il a plu','rendre visite à','à bientôt'];
  for(const term of must)assert.ok(v.some(x=>x[1]===term),'Missing school dictation '+term);
  const checkedModels=[
    'Demain, nous visiterons un monument célèbre à Paris.',
    "L'année prochaine, je voyagerai dans le sud de la France.",
    'Vous admirerez une belle vue.',
    'Ils prendront beaucoup de photos au bord de la mer.',
    'Tu découvriras un quartier ancien.',
    "Mes amis iront à l'office du tourisme.",
    'Nous ferons le tour du quartier historique.',
    'Je me promènerai dans le quartier historique.',
    'Tu essaieras un nouveau restaurant.',
    'Elles rendront visite à leur famille.',
    'Vous verrez une église richement décorée.',
    'Je sentirai le sable chaud sous mes pieds.',
    "L'année prochaine, nous irons dans un pays exotique.",
    'Elle se détendra au bord de la mer.',
    "J'aimerai sentir le vent froid dans mes cheveux.",
    "Hier, j'ai mangé dans un restaurant.",
    "L'année dernière, nous avons visité un musée.",
    'Il a joué au football.',
    'Elle est allée à Paris.',
    'Elles sont sorties.',
    'Je me suis amusée.',
    "Je n'ai pas aimé l'hôtel.",
    'Nous sommes restés à Nice pendant une semaine.',
    'Il a plu pendant les vacances.',
    'Nous passerons deux semaines au Québec.'
  ];
  assert.deepEqual(g.map(q=>q[1]),checkedModels);
  for(const p of prompts)assert.ok(p.b1&&p.b2&&p.title);
  assert.match(frenchHtml,/AO2: Content and communication/);
  assert.match(frenchHtml,/AO3 Grid 1: Range and complexity/);
  assert.match(frenchHtml,/AO3 Grid 2: Accuracy/);
  assert.match(frenchHtml,/covered<2&&p\.ao2!==undefined&&p\.ao2>12/);
  assert.match(frenchHtml,/if\(p\.ao2===0\)/);
  assert.match(frenchHtml,/accents are optional/i);
});
