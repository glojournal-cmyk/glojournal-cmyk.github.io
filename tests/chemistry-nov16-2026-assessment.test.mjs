import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = p => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const catalog = read('content/catalog.json');
const topics = [5, 6, 7].map(n => read('content/topics/chem-y9-c' + n + '.json'));
const added = topics.flatMap(t => t.questions.filter(q => q.id.includes('nov16-2026-')));
const selected = kind => added.filter(q => q.id.includes('-' + kind + '-'));
const ordinary = s => String(s ?? '').normalize('NFKC').replace(/→/g, '->').replace(/\s+/g, '');
const charCounts = formula => {
  const frames = [{}];
  for (let i = 0; i < formula.length;) {
    if (formula[i] === '(') { frames.push({}); i++; continue; }
    if (formula[i] === ')') {
      i++;
      const digits = /^\d*/.exec(formula.slice(i))[0]; i += digits.length;
      const sub = frames.pop(); assert.ok(frames.length, 'unexpected close bracket');
      for (const [el, n] of Object.entries(sub)) frames.at(-1)[el] = (frames.at(-1)[el] || 0) + n * Number(digits || 1);
      continue;
    }
    const match = /^([A-Z][a-z]?)(\d*)/.exec(formula.slice(i));
    assert.ok(match, 'invalid formula: ' + formula);
    frames.at(-1)[match[1]] = (frames.at(-1)[match[1]] || 0) + Number(match[2] || 1);
    i += match[0].length;
  }
  assert.equal(frames.length, 1, 'unclosed formula bracket');
  return frames[0];
};
const sideCounts = side => {
  const result = {};
  for (const item of side.split('+')) {
    const match = /^(\d+)?([A-Za-z0-9()]+)$/.exec(item.trim());
    assert.ok(match, 'invalid equation term: ' + item);
    for (const [el, count] of Object.entries(charCounts(match[2]))) {
      result[el] = (result[el] || 0) + Number(match[1] || 1) * count;
    }
  }
  return result;
};
const balanced = equation => {
  const sides = ordinary(equation).split('->');
  assert.equal(sides.length, 2, 'complete equation needed');
  return JSON.stringify(Object.entries(sideCounts(sides[0])).sort()) ===
    JSON.stringify(Object.entries(sideCounts(sides[1])).sort());
};
const quiz = fs.readFileSync(new URL('assets/quiz-session-rWAnuDVj.js', root), 'utf8');
const start = quiz.indexOf('function A(e){'), end = quiz.indexOf('function V(e){', start);
assert.ok(start >= 0 && end > start, 'deployed Practice scorer found');
const accent = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/æ/g, 'ae').replace(/œ/g, 'oe').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const exact = s => String(s ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
const latin = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ']/g, '').replace(/\s+/g, ' ').trim();
const {B: grade} = new Function('a', 'd', 'x', quiz.slice(start, end) + ';return {B};')(latin, accent, exact);

test('62 distinct assessment items distributed across school topics', () => {
  assert.equal(added.length, 62);
  assert.equal(new Set(added.map(q => q.id)).size, added.length);
  assert.equal(new Set(added.map(q => q.conceptId)).size, added.length);
  assert.equal(selected('balance').length, 30);
  assert.equal(selected('formula').length, 14);
  assert.equal(selected('calc').length, 10);
  assert.equal(selected('history').length, 8);
  for (const q of added) {
    assert.equal(q.year, 9);
    assert.equal(q.subject, 'chemistry');
    assert.equal(q.status, 'enabled');
    assert.ok(q.prompt && q.answer?.accepted?.length && q.feedback?.steps?.length);
  }
});

test('all balancing equations conserve each element and originally require balancing', () => {
  for (const q of selected('balance')) {
    const source = q.prompt.match(/Balance this chemical equation: (.*?)\. Write/);
    assert.ok(source, 'source equation in prompt: ' + q.id);
    assert.equal(balanced(source[1]), false, 'source should require balancing: ' + q.id);
    for (const target of q.answer.accepted) assert.equal(balanced(target), true, q.id);
  }
});

test('live Chemistry scorer credits model answers and rejects wrong answers', () => {
  for (const q of added) {
    for (const canonical of q.answer.accepted) {
      assert.equal(grade(q, canonical, 'chemistry', {}).ok, true, q.id + ': ' + canonical);
    }
    if (q.format === 'mc_single') {
      assert.equal(grade(q, q.options.find(x => x !== q.answer.accepted[0]), 'chemistry', {}).ok, false, q.id);
    }
    if (q.id.includes('-formula-')) {
      const wrongCase = q.answer.accepted.at(-1).toLowerCase();
      assert.equal(grade(q, wrongCase, 'chemistry', {}).ok, false, q.id + ': wrong element case');
    }
  }
});

test('catalog totals, topic counts and enabled counts stay in sync', () => {
  // Other subjects may add questions independently; guard the aggregate against its source rows.
  assert.equal(catalog.totals.questions, catalog.bySubjectYear.reduce((sum,row)=>sum+row.questions,0));
  assert.equal(catalog.totals.enabled, catalog.bySubjectYear.reduce((sum,row)=>sum+row.enabled,0));
  const summary = catalog.bySubjectYear.find(x => x.subject === 'chemistry' && x.year === 9);
  assert.equal(summary.questions, 1222);
  assert.equal(summary.enabled, 1212);
  for (const doc of topics) {
    const meta = catalog.topics.find(x => x.topicId === doc.topicId);
    assert.ok(meta, doc.topicId);
    assert.equal(meta.questions, doc.questions.length);
    assert.equal(meta.enabled, doc.questions.filter(x => x.status === 'enabled').length);
    assert.equal(meta.formats.typed_short, doc.formats.typed_short);
  }
});
