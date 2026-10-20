/* Regression for the actual parent-approved iPad keyboard rollback.
 * The old viewport-scroll experiment caused jumping; the small-font CSS
 * experiment was rejected and reverted. Keep both OFF.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const entry=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
const css=fs.readFileSync('assets/daily-practice-ux-v2-20261020.css','utf8');
assert.ok(!entry.includes("import('/assets/daily-keyboard-safe-20261020.js"),
 'the feedback-loop scroll helper must not be re-enabled');
assert.ok(!css.includes('iPad text-entry mode: pure CSS'),
 'the rejected compact/small-font iPad answer layout must not return');
console.log('PASS: backup changes do not activate the two rejected iPad keyboard variants');
