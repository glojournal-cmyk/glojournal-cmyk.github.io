import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/index-BLVOhKhN.js',import.meta.url),'utf8');
test('No unconditional full 30-day history normalization on every store change',()=>{
 assert.doesNotMatch(source,/store\.subscribe\(\(\) => normalizeState\(\)\)/);
 assert.match(source,/NORMALIZE_LEARNING_FIELDS\s*=\s*\[/);
 assert.match(source,/next\[key\] !== previous\[key\]/);
 assert.match(source,/if \(!allowNormalize \|\| normalizing \|\| sealingDay/);
});
test('Answer submission defers full-history scan instead of synchronously repeating it',()=>{
 const begin=source.indexOf('function patchedRecordAttempt(');
 const end=source.indexOf('// Find a prior daily Vocab',begin);
 assert.ok(begin>0&&end>begin);
 const attempt=source.slice(begin,end);
 assert.doesNotMatch(attempt,/\bnormalizeState\(\)/);
 assert.match(attempt,/scheduleNormalizeState\(\)/);
});
test('Vocabulary and spelling keep immediate answer writes, but coalesce history scan',()=>{
 const v=source.slice(source.indexOf('function recordDailyVocabAttempt('),source.indexOf('function patchedRecordSpelling('));
 assert.match(v,/store\.setState\(\{ dailyVocabByDay: all \}\);/);
 assert.match(v,/scheduleNormalizeState\(\)/);
 const spelling=source.slice(source.indexOf('function patchedRecordSpelling('),source.indexOf('store.setState({\n  award:',source.indexOf('function patchedRecordSpelling(')));
 assert.match(spelling,/scheduleNormalizeState\(\)/);
});
test('Queued normalization never overwrites student progress, runs only when needed',()=>{
 const anchor=source.indexOf('let normalizePendingTimer=null;');
 const end=source.indexOf('store.persist?.onFinishHydration',anchor);
 const logic=source.slice(anchor,end);
 assert.match(logic,/setTimeout\(\(\) => \{/);
 assert.match(logic, /normalizePendingTimer !== null\) return/);
 assert.match(logic,/normalizeState\(\)/);
 assert.doesNotMatch(logic,/localStorage\.clear|removeItem|resetAll|importProgress/);
});
