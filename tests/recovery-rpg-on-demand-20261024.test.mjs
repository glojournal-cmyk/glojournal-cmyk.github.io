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
 assert.match(home, /void import\('\.\/quest-recovery-20261011\.js\?v=20261026-bio-year9-savefix2&ten=20261030-1'\)/);
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
 // Compare actual shell-to-restorer-to-RPG cache stamps, not an obsolete
 // hard-coded version. A mixed version is unsafe for iPad offline resume.
 const versionFor=(source,stem)=>{
   const marker=stem+'.js?v=';
   const at=source.indexOf(marker);
   return at<0?null:source.slice(at+marker.length).split(/["'<>\\s]/)[0];
 };
 const shellBoot=versionFor(html,'home-extras-restorer-20261023');
 const restorerNext=versionFor(restorer,'home-continue-20261010');
 const continueNext=versionFor(continueJS,'home-rpg-live-20261019');
 assert.ok(shellBoot,'root must specify Recovery bootstrap cache version');
 assert.equal(restorerNext,shellBoot,'Recovery restorer and continuation must have one version');
 assert.equal(continueNext,shellBoot,'Home RPG must have the same continuation version');
 assert.match(home, /home-rpg-live-20261019\\.css\\?v=20261024-recovery-dialog1/);
 assert.match(restorer, /quest-recovery-20261011\\.js\\?v=20261026-bio-year9-savefix2&ten=20261030-1/);
 const shellVersion=(html.match(/index-BLVOhKhN\\.js\\?v=([^&"'\\s]+)/)||[])[1];
 assert.ok(shellVersion,'index shell must identify its app-store module version');
 assert.ok(read('404.html').includes('index-BLVOhKhN.js?v='+shellVersion));
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
