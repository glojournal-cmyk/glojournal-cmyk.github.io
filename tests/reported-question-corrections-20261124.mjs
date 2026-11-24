import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { diagramMarkup } from '../study/physics/mastery/diagrams.js';
import { modelMatch } from '../assets/latin-oct17-bank.js';

const read = path => fs.readFileSync(path, 'utf8');
const register = 'qa-reports/reported-question-corrections-20261124.csv';
const rows = JSON.parse(execFileSync('python3', ['-c',
  'import csv,json,sys; print(json.dumps(list(csv.DictReader(open(sys.argv[1],encoding="utf-8")))))', register],
  { maxBuffer: 6_000_000 }));
const ids = new Set(rows.map(row => row.question_id));
const questions = new Map();
function collect(data) {
  if (!data || typeof data !== 'object') return;
  const id = data.id ?? data.i;
  if (ids.has(id) && !questions.has(id)) {
    questions.set(id, data.i ? { id, format: data.f, prompt: data.p, answer: data.a, stimulus: data.s || {} } : data);
  }
  Object.values(data).forEach(collect);
}
for (const path of new Set(rows.flatMap(row => row.source_locations.split(' | ')))) {
  if (path.includes('..')) {
    const folder = 'content/school-update-20260919/';
    const encoded = fs.readdirSync(folder).filter(p => /^runtime-\d+\.txt$/.test(p)).sort().map(p => read(folder+p)).join('');
    collect(JSON.parse(gunzipSync(Buffer.from(encoded,'base64'))));
  } else collect(JSON.parse(read(path)));
}
const core = read('assets/index-BLVOhKhN.core.js');
function normalizer(name) {
  const source = core.match(new RegExp('function '+name+'\\(e\\)\\{return [^}]+\\}'))[0];
  return new Function('return '+source)();
}
const scorers = ['quiz-session-rWAnuDVj.js','quiz-session-y8fix-20260920.js'].map(name => {
  const script = read('assets/'+name);
  return new Function('a','d','x',script.slice(script.indexOf('function A(e){'),script.indexOf('function V(e){'))+';return B;')
    (normalizer('MS'),normalizer('AS'),text => text.normalize('NFC').trim());
});
const assessment = read('assessment/app-v2.js');
const gradePhysics = vm.runInNewContext(assessment.slice(assessment.indexOf('function physicsUnitCanon('),
  assessment.indexOf('\nfunction mark(q,value){'))+';physicsNov26Mark');
const context = {window:{},globalThis:{}};
vm.runInNewContext(read('assessment/biology-nov2-marking-20261017.js'),context);
const gradeBiology = context.globalThis.LuxBiologyNov2.grade;
let checks = 0, tested = 0;
for (const row of rows) {
  if (row.disposition === 'Academic review outstanding') continue;
  const id = row.question_id, q = questions.get(id);
  assert.ok(q,id);
  tested++;
  function check(test, description) {
    checks++;
    assert.ok(test,id+' | '+description);
  }
  const a = q.answer || {};
  if (id.startsWith('PHY-')) {
    check(diagramMarkup(q.diagram).startsWith('<svg'),'existing diagram');
  } else if (id.startsWith('phys-nov26-')) {
    check(gradePhysics(q,q.modelAnswer).credit===1,'assessment model');
    check(gradePhysics(q,'irrelevant').credit===0,'unrelated response');
  } else if (id.startsWith('bio-nov2-')) {
    const [,size,magnification] = q.prompt.match(/([\d.]+) mm at x(\d+)/);
    const working = size+' mm = '+size*1000+' µm. '+size*1000+'/'+magnification+' = '+a.numeric.value+' µm';
    check(gradeBiology(q,working).credit===1,'converted units and working');
    check(gradeBiology(q,'irrelevant').credit===0,'unrelated response');
  } else if (id.startsWith('la-oct17-')) {
    for (const answer of a.accepted) check(modelMatch(q,answer),answer);
    check(!modelMatch(q,'irrelevant'),'unrelated response');
  } else for (const grade of scorers) {
    const mark = (input,details={}) => grade(q,input,row.subject,details);
    const expect = (input,ok) => check(mark(input).ok===ok,input);
    if (a.reviewOnly) {
      for (const input of [a.modelAnswer || 'example','another response']) {
        const result = mark(input);
        check(result.reviewOnly && result.total===0,'ungraded writing');
      }
      continue;
    }
    if (q.format==='diagram_label') {
      const n=Object.keys(a.labelMap).length;
      const model=mark('pairs',{pairs:a.labelMap}), empty=mark('pairs',{pairs:{}});
      check(model.ok && model.score===n,'all labels');
      check(!empty.ok && empty.score===0,'no labels');
      continue;
    }
    if (a.reviewedParts) {
      const model=a.reviewedParts.map(variants=>variants[0]);
      expect(model.join('\n'),true);
      expect([...model].reverse().join('\n'),new Set(model).size===1);
    } else if (a.checkFinalQuantity) {
      const unit=a.units?.[0] || '';
      const sign=a.direction || (/classif/i.test(q.prompt) ? (a.value<0?'exothermic':'endothermic') : '');
      for (const [value,ok] of [[a.value,true],[a.value+100,false]]) expect('working = '+value+' '+unit+' '+sign,ok);
    } else if (a.numericFinalForms) {
      expect('calculation = '+a.numericFinalForms[0],true);
    } else if (q.format==='unordered_set' && a.requiredGroups) {
      expect(a.requiredGroups.map(part=>part.alternatives.at(-1)).join(a.acceptFrenchEtSeparator?' et ':', '),true);
    } else if (a.basePairing) {
      expect('Adenine pairs with thymine and cytosine pairs with guanine.',true);
      expect('adenine pairs with guanine and thymine pairs with cytosine',false);
    } else if (a.phCategoriesCorrection || (/CHEM-P2-20|PHY-P2-22/.test(row.reported_finding) && a.markPoints?.length)) {
      expect(a.modelAnswer,true);
      expect(q.feedback.commonError,false);
      expect('The claim is incorrect.',false);
    } else if (a.markPoints?.length && !a.reviewedEquivalents?.length && !a.chemicalNotation) {
      expect(a.modelAnswer || a.markPoints.join('. '),true);
    } else if (q.format==='word_tiles' && q.stimulus?.tiles) {
      const model=a.accepted[0];
      check(mark(model,{tiles:model.split(' ')}).ok,'correct tile order');
    } else if (q.format==='mc_single') {
      check(q.options.filter(option=>mark(option).ok).length===1,'one correct option');
    } else {
      const variants=a.reviewedEquivalents?.length ? a.reviewedEquivalents : a.accepted;
      assert.ok(variants?.length,id+' | missing test case');
      for (const answer of variants) expect(answer,true);
    }
    expect('entirely unrelated answer',false);
  }
}
assert.equal(tested,1711);
console.log(tested+' items, '+checks+' checks passed.');
