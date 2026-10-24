import fs from 'node:fs';
import assert from 'node:assert/strict';

const sources=['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js'];
const read=p=>fs.readFileSync(p,'utf8');
function marker(path){
  const source=read(path);
  const begin=source.indexOf('const MARK_SYNONYM_FAMILIES=');
  const end=source.indexOf('function z(',begin);
  assert.ok(begin>0&&end>begin,path+' semantic matcher present');
  return new Function(source.slice(begin,end)+';return {R,semanticPointMatch};')();
}
const implementations=sources.map(marker);
const checks=[
 ['Higher-energy particles are more likely to escape.','The most energetic molecules leave the surface.',true],
 ['The escaping particles carry energy away.','Molecules leave taking their energy with them.',true],
 ['Average kinetic energy and temperature of the remaining liquid decrease unless energy is replaced.','The remaining liquid cools because its molecules have less average energy.',true],
 ['Peel a thin layer of onion epidermis and place it on a clean slide.','Put a thin piece of onion skin on a microscope slide.',true],
 ['Lower a coverslip at an angle to reduce air bubbles.','Tilt the cover slip while putting it down to prevent bubbles.',true],
 ['Start with the lowest-power objective and use coarse focus.','Begin with a low magnification lens and adjust the coarse focus knob.',true],
 ['The escaping particles carry energy away.','The particles do not carry energy away.',false],
 ['More surface particles have enough energy to escape per unit time.','Particles cannot escape the liquid.',false],
 ['The temperature rises.','The temperature decreases.',false],
 ['Increase the temperature.','Decrease the temperature.',false],
 ['Use coarse focus.','Use fine focus.',false],
 ['Apply iodine stain.','No stain is needed.',false],
 ['Two Rf values match.','Two Rf values DO NOT match.',false],
 ['No shading is used.','Shading is used.',false],
 ['The temperature rises.','Not the temperature rises.',false],
 ['The solution contains 0.45 units.','The solution contains 0.54 units.',false]
];
const topics=['phys-y9-p10','phys-y9-p2','phys-y9-p4','phys-y9-p7','phys-y9-p11','bio-y9-b3','chem-y9-c4'];
let models=0;
for(const {R,semanticPointMatch} of implementations){
  for(const [point,student,expected] of checks)
    assert.equal(semanticPointMatch(point,student),expected,point+' / '+student);
  for(const id of topics){
    const bank=JSON.parse(read('content/topics/'+id+'.json'));
    for(const q of bank.questions){
      const points=q.answer?.markPoints;
      if(!points?.length)continue;
      const actual=R(points,q.answer.modelAnswer||points.join('. '),q.answer.markPointAlternatives);
      assert.equal(actual,points.length,id+' '+q.id+': full model answer must earn full marks');
      models++;
    }
  }
}
console.log('DAILY_SEMANTIC_MARKING_QA',JSON.stringify({
  bundles:implementations.length, paraphraseAndContradictionCases:checks.length,
  modelAnswerChecks:models, pass:true
}));

// Reuse the production quiz-scoring code, not a copy of its rules.
// Spacing and typography are never separate science marks.
function fullGrader(path){
 const source=read(path);
 const start=source.indexOf('function A(e){');
 const end=source.indexOf('function V(e){',start);
 assert.ok(start>0&&end>start,path+' quiz grading functions present');
 const normalize=value=>String(value??'').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
 const keep=value=>String(value??'').normalize('NFC').trim().replace(/\s+/g,' ');
 return new Function('a','d','x',source.slice(start,end)+';return B;')(normalize,normalize,keep);
}
const short={id:'phys-punctuation-qa',format:'typed_short',
 answer:{accepted:['water vapour condenses on a cold surface']}};
const decimal={id:'phys-decimal-qa',format:'typed_exact',
 answer:{accepted:['0.45']}};
const chemical={id:'chem-symbol-qa',format:'typed_exact',
 answer:{accepted:['H₂O']}};
const long={id:'phys-long-punctuation-qa',format:'mark_points',
 answer:{markPoints:['Higher-energy particles are more likely to escape.',
   'The escaping particles carry energy away.']}};
const punctuationCases=[
 [short,'Water-vapour condenses on a cold surface',1,'physics'],
 [short,'Water—vapour condenses on a cold surface',1,'physics'],
 [short,'water vapour:condenses on a cold surface',1,'physics'],
 [short,'water.vapour condenses on a cold surface',1,'physics'],
 [short,'water    vapour condenses on a cold surface!',1,'physics'],
 [short,'water,vapour condenses on a cold surface',1,'physics'],
 [short,"(Water vapour)\n condenses on a 'cold' surface.",1,'physics'],
 [short,'water vapour condenses on a hot surface',0,'physics'],
 [long,'The most energetic! molecules, leave the surface; Molecules leave taking their energy with them.',2,'physics'],
 [long,'Higher energy. particles are more likely; to escape. The escaping particles; carry energy away.',2,'physics'],
 [long,'Higher-energy particles are more likely to escape. The escaping particles carry energy away.',2,'physics'],
 [long,'The particles do not escape and do not carry energy away',0,'physics'],
 [decimal,'0.45',1,'physics'],
 [decimal,'0.54',0,'physics'],
 [chemical,'H₂O',1,'chemistry'],
 [chemical,'H2O',1,'chemistry'],
 [chemical,'H2O2',0,'chemistry']
];
for(const source of sources){
 const grade=fullGrader(source);
 for(const [question,answer,expected,subject] of punctuationCases)
  assert.equal(grade(question,answer,subject).score,expected,
    source+' '+question.id+': '+answer);
}
console.log('DAILY_SCIENCE_PUNCTUATION_QA',JSON.stringify({
  bundles:sources.length,cases:punctuationCases.length,
  verified:punctuationCases.length*sources.length,pass:true
}));
