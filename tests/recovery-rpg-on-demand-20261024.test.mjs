import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
const home = read('assets/home-rpg-live-20261019.js');
const quest = read('assets/quest-recovery-20261011.js');
const css = read('assets/home-rpg-live-20261019.css');
const continueJS = read('assets/home-continue-20261010.js');
const restorer = read('assets/home-extras-restorer-20261023.js');
const html = read('index.html');

test('RPG Recovery actually loads the dated task panel on tap, not an empty-state timer', () => {
 assert.match(home, /void import\('\.\/quest-recovery-20261011\.js\?v=20261024-on-demand-rpg1'\)/);
 assert.match(home, /module\.mountRecoveryPanel\(\)/);
 assert.doesNotMatch(home, /No Recovery tasks are currently available/);
 assert.match(quest, /export function mountRecoveryPanel\(\)/);
 assert.match(quest, /rpgHome\?document\.body/);
 assert.match(quest, /lux-rpg-recovery-open/);
});

test('Recovery never overlays ordinary Home and does not observe all animated DOM nodes', () => {
 assert.match(css, /not\(\.lux-rpg-recovery-open\)/);
 assert.match(css, /lux-rpg-recovery-open #lux-recovery-quests/);
 assert.doesNotMatch(quest, /new MutationObserver\(schedule\)/);
 assert.match(quest, /Check saved backup for missing dates/);
});

test('iPad module bootstrap cache versions match after Recovery fix', () => {
 assert.match(html, /home-extras-restorer-20261023\.js\?v=20261024-recovery-cache1/);
 assert.match(restorer, /home-continue-20261010\.js\?v=20261024-recovery-cache1/);
 assert.match(continueJS, /home-rpg-live-20261019\.js\?v=20261024-recovery-dialog1/);
 assert.match(home, /home-rpg-live-20261019\.css\?v=20261024-recovery-dialog1/);
 assert.match(restorer, /quest-recovery-20261011\.js\?v=20261024-on-demand-rpg1/);
 assert.equal(html, read('404.html'));
});

test('no result is credited merely by opening a Recovery modal', () => {
 assert.doesNotMatch(home, /\bstore\.setState\s*\(/);
 const ledger=read('assets/recovery-task-ledger-20261017.js');
 assert.match(ledger, /return n===1\|\|n===2/);
 assert.match(ledger, /if\(!task\|\|Number\(task\.target\)<=0/);
 const engine=read('assets/index-BLVOhKhN.js');
 assert.match(engine, /const supported = \["mistake-review","adaptive-focus","study-session",\.\.\.YEAR8_RECOVERY_TASKS\]/);
 assert.match(engine, /const YEAR8_RECOVERY_TASKS=\[/);
 assert.match(engine, /"latin-standard"/);
});
