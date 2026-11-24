import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {foodTestsPupilVerdict,canEarnFormalCredit,isFoodTestsQaHeld} from '../assets/food-tests-qa-credit-gate-20261122.js';

const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const bank = JSON.parse(read('content/topics/bio-y8-food-tests.json'));

test('Unapproved Food Tests prose is saved without a correct or incorrect verdict', () => {
  assert.equal(bank.questions.length, 143);
  for (const question of bank.questions) {
    const shown = foodTestsPupilVerdict(question);
    assert.equal(canEarnFormalCredit(question), false);
    assert.equal(shown.formalCredit, false);
    assert.equal(shown.practiceOnly, true);
    assert.equal(shown.ok, false);
    assert.equal(shown.errorKind, 'unmarked');
    assert.equal(shown.score, null);
    assert.equal(shown.total, null);
    assert.equal(shown.pointResults, null);
    assert.equal(shown.model.includes('No Daily / MP / Mastery credit'), true);
    assert.equal(/blue-black|brick-red|iodine solution|model answer/i.test(shown.model), false);
  }
  assert.equal(foodTestsPupilVerdict({id: 'unrelated-maths-item'}), null);
  assert.equal(isFoodTestsQaHeld('unrelated-maths-item'), false);
});

test('Both quiz sessions use the held verdict and do not reveal the prose model', () => {
  for (const file of ['assets/quiz-session-y8fix-20260920.js', 'assets/quiz-session-rWAnuDVj.js']) {
    const source = read(file);
    assert.equal(source.includes('foodTestsPupilVerdict'), true, file);
    assert.equal(source.includes('Practice saved. Not a formal mark.'), true, file);
    assert.equal(source.includes('${n.model||L(Y)}'), false, file);
    assert.equal(source.includes('!G.practiceOnly&&!G.ok&&correction?.reason'), true, file);
  }
});
