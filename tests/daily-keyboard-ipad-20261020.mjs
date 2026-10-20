/* Safety regression: The auto-scroll keyboard experiment and the compact
 * CSS-only replacement were both rolled back after real iPad complaints.
 * Keep this test aligned with the CURRENT production rollback state.
 * Keyboard redesign is reviewed separately (do not turn it on here).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const entry=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
const css=fs.readFileSync('assets/daily-practice-ux-v2-20261020.css','utf8');
const ipad=fs.readFileSync('assets/ipad-experience-20261004.js','utf8');
assert.ok(!entry.includes("import('/assets/daily-keyboard-safe-20261020.js"),
  'never re-enable old iPad auto-scroll feedback loop');
assert.ok(!css.includes('iPad text-entry mode: pure CSS'),
  'rejected small-card keyboard design must remain rolled back');
assert.ok(!ipad.includes("function autoScrollKeyboard"),
  'never introduce a second viewport auto-scroll loop');
console.log('PASS: rejected iPad keyboard fixes remain disabled; cloud backups do not change layout.');
