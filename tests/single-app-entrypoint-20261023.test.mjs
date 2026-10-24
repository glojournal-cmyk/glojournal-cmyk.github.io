import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Check the ACTUAL module dependency graph as well as static entry documents.
// A prior HTML-only check passed while Home routes imported the same app under
// a second ?v= URL, rehydrating the large Scholar store more than once.
const PATHS = [
 'index.html', '404.html', 'study/index.html',
 'study/latin/practise/index.html', 'study/french/practise/index.html',
 'study/biology/practise/index.html', 'study/chemistry/practise/index.html',
 'study/physics/practise/index.html', 'study/english/practise/index.html',
 'garden/index.html', 'play/index.html', 'scholar/index.html',
 'assets/daily-progress-save.js', 'assets/quest-recovery-20261011.js',
 'assets/routes-BEd1a0JC.js', 'assets/routes-BEd1a0JC.core.js',
 'assets/study-B6lojWPd.js', 'assets/study.index-CBZ0Frux.js',
 'assets/study._subject.practise-D_PWgUd7.js',
 'assets/quiz-session-rWAnuDVj.js', 'assets/scholar-iJ2ilQWG.js'
];
const EXPECTED='/assets/index-BLVOhKhN.js?v=20261024-correct-credit1&ux=20261013-corrections2&uxfix=20261022-priority-ux1';
test('HTML and loaded route modules use exactly one app URL, avoiding duplicate hydration of large original Chrome storage', () => {
  const all = new Map();
  for (const path of PATHS) {
    const contents=readFileSync(new URL('../'+path,import.meta.url),'utf8');
    const urls=[...contents.matchAll(/(?:\/assets\/|\.\/)index-BLVOhKhN\.js\?v=[^"'<>\s\)]+/g)]
      .map(m=>m[0].replace(/^\.\/index-/, '/assets/index-'));
    assert.ok(urls.length, path+' must reference the actual main app');
    const unique=[...new Set(urls)];
    assert.equal(unique.length,1,path+' has mismatched internal version references');
    assert.equal(unique[0],EXPECTED,path+' must resolve to canonical Home route app');
    all.set(path,unique[0]);
  }
  assert.equal(new Set(all.values()).size,1,'App must not hydrate multiple stores');
});
