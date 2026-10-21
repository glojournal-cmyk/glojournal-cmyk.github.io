/* Regression guard: the superseded small-card CSS-only layout must not be
 * treated as the accepted iPad fix. The full iPad browser checks are in
 * ipad-spacious-keyboard-20261020.mjs. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('assets/daily-practice-ux-v2-20261020.css','utf8');
const ipad=fs.readFileSync('assets/ipad-experience-20261004.js','utf8');
const entry=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
assert.ok(css.includes('iPad spacious answer stage: keyboard-visible'),'spacious question stage missing');
assert.ok(!css.includes('iPad text-entry mode: pure CSS'),'old compact design must not return');
assert.ok(!entry.includes("import('/assets/daily-keyboard-safe-20261020.js"),'old keyboard scroll script must remain off');
assert.ok(ipad.includes("active?.matches?.('input,textarea')&&active?.closest?.('.lux-practice-view [data-question-id]')"),
 'legacy iPad park must not move the page while editing');
console.log('PASS: deprecated compact layout remains off and no auto-scroll is activated');
