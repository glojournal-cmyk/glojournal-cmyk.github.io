/* Original iPad keyboard fix caused feedback-loop scrolling. Preserve the
 * regression gate, and require full-size prompt instead of small-card CSS. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const entry=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
const css=fs.readFileSync('assets/daily-practice-ux-v2-20261020.css','utf8');
const ipad=fs.readFileSync('assets/ipad-experience-20261004.js','utf8');
assert.ok(!entry.includes("import('/assets/daily-keyboard-safe-20261020.js"),'never enable old viewport scroll helper');
assert.ok(css.includes('iPad spacious answer stage: keyboard-visible'),'large answer layout not installed');
assert.ok(css.includes('font-size:clamp(32px,3.45vw,47px)!important'),'question font must stay large');
assert.ok(ipad.includes("e.matches?.('input,textarea')&&e.closest?.('.lux-practice-view [data-question-id]')"),
 'keepVisible must not programmatically scroll an actively typed Daily question');
console.log('PASS: old feedback-loop code is disabled and full-size question is preserved');
