import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewDailyV2ObjectiveScore as grade} from '../src/objective-scorer.js';
const load=path=>JSON.parse(readFileSync(new URL('../../content/topics/'+path+'.json',import.meta.url),'utf8'));
const get=(topic,id)=>topic.questions.find(q=>q.id===id);
const score=(topic,question,response)=>grade({topic,question,response});
const diet=load('bio-y8-balanced-diet');
const ber=load('bio-y8-ber');
const acid=load('chem-y8-acids-indicators-ph');
test('real numeric BER answer: exact number, permissible units, and no live credit',()=>{
 const question=get(ber,'bio-y8-app-ber-55');
 for(const answer of ['7128 kJ/day','7,128 kJ per day','7128 kJ day-1']){
  const r=score(ber,question,answer);
  assert.equal(r.marksEarned,2,answer);assert.equal(r.marksPossible,2);
  assert.equal(r.correct,true);assert.equal(r.releaseGrade,false);
  assert.equal(r.ledgerEligible,false);
  assert.equal(r.reviewRequired,false);
  assert.ok(r.sourceFingerprint);
 }
});
test('missing unit, wrong unit or arithmetic result never guesses working marks',()=>{
 const question=get(ber,'bio-y8-app-ber-55');
 for(const response of ['7128','7128 mg','7127 kJ/day','7,12,8 kJ/day','not sure']){
  const r=score(ber,question,response);
  assert.equal(r.reviewRequired,true,response);
  assert.equal(r.marksEarned,null,response);
  assert.equal(r.releaseGrade,false);
 }
});
test('real numeric tolerance permits small differences, refuses excess tolerance',()=>{
 const topic={...ber,questions:[]};
 const q={...get(ber,'bio-y8-app-ber-change')};
 assert.equal(score(topic,q,'259.3 kJ/day').marksEarned,2);
 assert.equal(score(topic,q,'259.31 kJ/day').marksEarned,null);
});
test('real matching source uses one point per exact pair and accepts explicit slash alternatives',()=>{
 const question=get(diet,'bio-y8-app-digestion-products');
 const full=score(diet,question,{starch:'glucose',protein:'amino acids',lipid:'fatty acids and glycerol'});
 assert.equal(full.marksEarned,3);assert.equal(full.correct,true);
 const partial=score(diet,question,{starch:'simple sugars',protein:'fats',lipid:'fatty acids and glycerol'});
 assert.equal(partial.marksEarned,2);assert.equal(partial.correct,false);
 assert.equal(partial.releaseGrade,false);
});
test('missing matching pairs do not grant accidental credit, unknown labels require review',()=>{
 const question=get(diet,'bio-y8-app-digestion-products');
 assert.equal(score(diet,question,{}).marksEarned,0);
 const x=score(diet,question,{starch:'glucose',unknown:'anything'});
 assert.equal(x.marksEarned,null);assert.equal(x.reviewRequired,true);
});
test('real pH sorting accepts numeric item keys regardless of input object ordering',()=>{
 const q=get(acid,'chem-y8-acids-indicators-ph-challenge');
 const full=score(acid,q,{'12':'alkaline','7':'neutral','1':'acidic','8':'alkaline','5':'acidic'});
 assert.equal(full.marksPossible,5);assert.equal(full.marksEarned,5);
 assert.equal(full.correct,true);
 const partial=score(acid,q,{'1':'acidic','5':'neutral','7':'neutral','8':'alkaline','12':'acidic'});
 assert.equal(partial.marksEarned,3);
});
test('sorting with duplicated expected category items cannot produce a scored preview',()=>{
 const q={id:'duplicate',topicId:acid.topicId,answer:{mode:'category_map',categories:{a:[1,1],b:[2]}}};
 assert.throws(()=>score(acid,q,{'1':'a','2':'b'}),/invalid source/);
});
test('unordered seven nutrients score is order-independent and supports partial credit',()=>{
 const q=get(diet,'bio-y8-app-seven-nutrients');
 const words=['water','minerals','vitamins','fibre','lipid','protein','carbohydrate'];
 const full=score(diet,q,words);
 assert.equal(full.marksPossible,7);assert.equal(full.marksEarned,7);
 assert.equal(full.correct,true);
 assert.equal(score(diet,q,'water, carbohydrate / protein; vitamins, minerals, lipid').marksEarned,6);
 assert.equal(score(diet,q,['water','water','protein']).marksEarned,2,
  'duplicate submitted word must never earn a second mark');
});
test('unknown extra answers do not grant all marks or automatically mark the response',()=>{
 const q=get(diet,'bio-y8-app-seven-nutrients');
 const r=score(diet,q,['water','minerals','vitamins','fibre','lipid','protein','carbohydrate','wrong']);
 assert.equal(r.marksEarned,null);
 assert.equal(r.reviewRequired,true);
});
test('one submitted synonym cannot satisfy multiple overlapping rubric groups',()=>{
 const topic={subject:'biology',year:8,topicId:'test-groups'};
 const q={id:'overlap',topicId:'test-groups',answer:{mode:'unordered_required_groups',requiredGroups:[
  {alternatives:['glucose','sugar']},{alternatives:['glucose','dextrose']}
 ],totalMarks:2}};
 const r=score(topic,q,['glucose']);
 assert.equal(r.marksEarned,1);
 assert.equal(r.correct,false);
 const both=score(topic,q,['glucose','dextrose']);
 assert.equal(both.marksEarned,2);
});
test('numeric total marks include working: no fabricated partial credit for a wrong answer',()=>{
 const q=get(ber,'bio-y8-app-ber-55');
 const s=score(ber,q,'1000 kJ/day');
 assert.equal(s.marksPossible,2);
 assert.equal(s.marksEarned,null);
 assert.equal(s.reviewRequired,true);
});
test('rubric scoring mismatch is flagged for human review rather than invented fraction',()=>{
 const q={id:'wrong-quota',topicId:diet.topicId,answer:{
  mode:'pair_map',totalMarks:5,pairs:[{left:'a',right:'b'},{left:'c',right:'d'}]
 }};
 const s=score(diet,q,{a:'b',c:'d'});
 assert.equal(s.marksEarned,null);assert.equal(s.reviewRequired,true);
});
test('open-ended mark points, French semantic groups and unsupported modes remain manual-only',()=>{
 const q={id:'essay',topicId:diet.topicId,answer:{mode:'mark_points',markPoints:['a scientific reason']}};
 assert.throws(()=>score(diet,q,'a scientific reason'),/unsupported or semantic/);
 const s={...q,answer:{mode:'semantic_groups',requiredGroups:[{alternatives:['oui']}]}};
 assert.throws(()=>score(diet,s,['oui']),/unsupported or semantic/);
});
test('malformed source or response cannot silently earn credit',()=>{
 const question=get(ber,'bio-y8-app-ber-55');
 assert.throws(()=>score({...ber,topicId:'wrong'},question,'7128 kJ/day'),/invalid source/);
 assert.throws(()=>score(ber,question,{value:7128,unit:7}),/invalid source/);
 assert.throws(()=>score(diet,get(diet,'bio-y8-app-seven-nutrients'),[1,2]),/invalid source/);
});

test('a zero-tolerance numeric answer is genuinely exact, not loosened by floating-point slack',()=>{
 const q=get(ber,'bio-y8-app-ber-55');
 assert.equal(score(ber,q,'7128.00000001 kJ/day').marksEarned,null);
 assert.equal(score(ber,q,'7128 kJ/day').marksEarned,2);
});
test('large-number tolerance cannot grow by nearly an extra whole unit',()=>{
 const topic={topicId:'large-precise',subject:'physics',year:8};
 const q={id:'large-numeric',topicId:topic.topicId,answer:{
  mode:'numeric',value:1000000000000000,tolerance:0.1,totalMarks:1
 }};
 assert.equal(score(topic,q,'1000000000000000.5').marksEarned,null);
 assert.equal(score(topic,q,'1000000000000000').marksEarned,1);
});

test('duplicate identical submitted synonyms cannot earn two overlapping group credits',()=>{
 const topic={subject:'biology',year:8,topicId:'synonym-overlap'};
 const q={id:'ambiguous',topicId:topic.topicId,answer:{mode:'unordered_required_groups',
  totalMarks:2,requiredGroups:[
   {alternatives:['glucose','sugar']},{alternatives:['glucose','dextrose']}
  ]}};
 const repeated=score(topic,q,['glucose','glucose']);
 assert.equal(repeated.marksEarned,1);
 assert.equal(repeated.correct,false);
 const distinct=score(topic,q,['glucose','dextrose']);
 assert.equal(distinct.marksEarned,2);
 assert.equal(distinct.correct,true);
});
