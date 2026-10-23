import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const PAGE_FILES = [
  'index.html', '404.html', 'study/index.html',
  'study/latin/practise/index.html', 'study/french/practise/index.html',
  'study/biology/practise/index.html', 'study/chemistry/practise/index.html',
  'study/physics/practise/index.html', 'study/english/practise/index.html',
  'garden/index.html', 'play/index.html', 'scholar/index.html',
  'assets/daily-progress-save.js', 'assets/quest-recovery-20261011.js'
];
test('one canonical module specifier avoids loading duplicate Zustand app stores on iPad Safari', () => {
  const specifiers = new Map();
  for (const file of PAGE_FILES) {
    const text = readFileSync(new URL('../' + file, import.meta.url),'utf8');
    const found=[...text.matchAll(/\\/assets\\/index-BLVOhKhN\\.js\\?v=[^"'<>\\s\\)]+/g)].map(m => m[0]);
    assert.ok(found.length, file + ' must load/reference the main app');
    specifiers.set(file, [...new Set(found)]);
    assert.equal(new Set(found).size,1,file+' mixes module URLs');
  }
  const all = new Set([...specifiers.values()].flat());
  assert.equal(all.size, 1,
    'Distinct query strings cause multiple app module evaluations and competing save stores: '+
    JSON.stringify(Object.fromEntries(specifiers)));
});
