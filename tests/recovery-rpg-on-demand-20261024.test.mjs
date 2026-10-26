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
 assert.ok(home.includes("void import('./quest-recovery-20261011.js?v="));
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

test('iPad Recovery bootstrap shares one version of each reused module', () => {
 const version=(src,name)=>{
   const matches=[...src.matchAll(new RegExp(name.replaceAll('.','\\.')+
     '\\.js\\?v=([A-Za-z0-9-]+)','g'))].map(x=>x[1]);
   assert.ok(matches.length,'Missing versioned import of '+name);
   assert.equal(new Set(matches).size,1,'Duplicate versions of '+name+' inside one source');
   return matches[0];
 };
 const quest=version(html,'quest-recovery-20261011');
 assert.equal(version(restorer,'quest-recovery-20261011'),quest);
 assert.equal(version(home,'quest-recovery-20261011'),quest);
 const next=version(html,'home-continue-20261010');
 assert.equal(version(restorer,'home-continue-20261010'),next);
 const rpg=version(continueJS,'home-rpg-live-20261019');
 assert.ok(rpg);
 assert.ok(version(html,'home-extras-restorer-20261023'));
 assert.ok(home.includes('home-rpg-live-20261019.css?v='));
 const shell=(html.match(/index-BLVOhKhN\\.js\\?v=([^&"'\\s]+)/)||[])[1];
 assert.ok(shell,'index shell must identify its app-store module version');
 assert.ok(read('404.html').includes('index-BLVOhKhN.js?v='+shell));
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
