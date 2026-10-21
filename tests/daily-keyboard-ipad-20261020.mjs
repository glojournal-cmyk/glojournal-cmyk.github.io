/* The October 20 viewport-scrolling experiment caused iPad Safari jitter and was
   rolled back. Keep a permanent regression gate against re-enabling it. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const entry=fs.readFileSync('assets/index-BLVOhKhN.js','utf8');
const css=fs.readFileSync('assets/daily-practice-ux-v2-20261020.css','utf8');
const ipad=fs.readFileSync('assets/ipad-experience-20261004.js','utf8');
assert.ok(!entry.includes("import('/assets/daily-keyboard-safe-20261020.js"),
  'Do not reintroduce the old visualViewport scrollBy feedback loop');
assert.ok(css.includes('html.lux-daily-typing .lux-daily-study-nav') &&
  css.includes('html.lux-daily-ux-ready :is([data-lux-question-card], :where([data-question-id] .rounded-xl.bg-card.p-5 > div))'),
  'Daily Practice must compact its layout and hide nav while typing with CSS, not a stale magic comment');
assert.ok(!/scroll-behavior:\s*smooth/.test(css),
  'The Daily Practice stylesheet must not force smooth scrolling against the keyboard');
assert.ok(ipad.includes("document.activeElement?.matches?.('.lux-practice-view [data-question-id] input"),
  'The iPad legacy page parking must yield to a focused quiz input');
console.log('PASS: old iPad keyboard jank helper disabled; CSS-only replacement is present.');
