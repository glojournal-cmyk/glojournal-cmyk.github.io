import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const home = path.resolve(import.meta.dirname,'..');
const js = fs.readFileSync(path.join(home,'assets/home-rpg-live-20261019.js'),'utf8');
const css = fs.readFileSync(path.join(home,'assets/home-rpg-live-20261019.css'),'utf8');

test('integration files are valid and contain no progress writes',()=>{
  const source=js.replace(/^import .*;$/gm,'').replace(/\bconst store = window.previewStore;/,'');
  new vm.Script(source);
  assert.doesNotMatch(js,/\bstore\.setState\s*\(/);
  assert.doesNotMatch(js,/\b(localStorage|sessionStorage)\.setItem\s*\(/);
  assert.doesNotMatch(js,/\baward(?:XP|Credit|Reward)?\s*\(/i);
});
test('official journey selects live 10 tasks and delays display until App ready',()=>{
  assert.match(js,/LuxHomeJourneyV2Logic\?\.homeJourney/);
  assert.match(js,/progress\.ready/);
  assert.match(js,/window\.__luxAppReady/);
  assert.match(js,/Waiting for today's official ten-task plan/);
  assert.doesNotMatch(js,/Year 7–8 Latin vocab/);
});
test('recovery opens existing panel and never generates substitute Recovery tasks',()=>{
  assert.match(js,/getElementById\('lux-recovery-quests'\)/);
  assert.match(js,/panel\.open = true/);
  assert.doesNotMatch(js,/prepareUnopenedRecovery/);
  assert.doesNotMatch(js,/recordRecoveryAnswer/);
  assert.doesNotMatch(js,/Finish today's ten tasks to rebuild this day/);
});
test('30 day record uses saved dailyLog, including partial evidence but no synthetic credit',()=>{
  assert.match(js,/state\.dailyLog\?\.\[date\]/);
  assert.match(js,/state\.formalAttemptLog\?\.some/);
  assert.match(js,/if \(row\?\.complete/);
  assert.match(js,/nativePanel\('record'\)/);
});
test('uses original uploaded artwork and responsive layout',()=>{
  for(const f of ['scholar-clean.png','shield-cardigan.png','shield-recovery.png','shield-starmap.png'])
    assert.ok(fs.statSync(path.join(home,'art/home-rpg',f)).size > 10000,f);
  for(const f of ['art/garden-wide.jpg','art/scholar-avatar.jpg','art/rpg/moss.png'])
    assert.ok(fs.statSync(path.join(home,f)).size > 10000,f);
  assert.match(css,/@media\(max-width:700px\)/);
  assert.match(css,/rpg-home-live/);
  assert.match(js,/state\.equippedOutfit/);
  assert.match(js,/lux-rpg-live-css/);
  assert.match(js,/make\('div','rpg-nav-live'\)/); // Avoid Pet auto-inserting a duplicate nav item
  assert.match(js,/make\('div',row.href \?/); // Avoid native anchor/button decorators
  assert.match(js,/rpg-continue-live/);
  assert.match(js,/next\.href/);
});

test('RPG Home uses the authoritative evolving pet sprites, not retired thumbnails',()=>{
  assert.ok(js.includes("import { petArtUrl } from '/pet/pet-art-hd-20261009.js"));
  assert.ok(js.includes('pet.petLevels?.[species]'));
  assert.ok(js.includes('creature.src = petArtUrl(species, stage)'));
  assert.ok(!js.includes('companion-${species}.webp'));
});

test('official Biology date corrected from the old prototype',()=>{
  assert.match(js,/Biology · cell structure test/);
  assert.match(js,/progress:'2 Nov'/);
  assert.doesNotMatch(js,/16 Nov/);
});

test('background is selected from owned rewards, not static garden-wide art',()=>{
  assert.match(js,/B as rewardScenes/);
  assert.match(js,/selectedRewardScene\(state, rewardScenes\)/);
  assert.match(js,/root\.style\.backgroundImage/);
  assert.match(js,/root\.dataset\.equippedScene/);
  assert.match(js,/rpg-scene-picker-live/);
  assert.doesNotMatch(css,/background:#1c3a4a url\('\/art\/garden-wide\.jpg'\)/);
  assert.match(css,/rpg-cast-live::before/);
  assert.match(css,/rpg-pet-live::before/);
  assert.match(js,/cast\.dataset\.sceneGround = scene\.id/);
  assert.match(js,/floorPresets\[scene\.id\]/);
  assert.doesNotMatch(css,/margin-left:clamp\(6rem,22vw,25rem\)/);
});
test('does not replace shared route-shell HTML',()=>{
  // Preview is enabled via pet/home-pet.js only on the home route.
  assert.match(js,/window\.__luxRpgLiveHome/);
  assert.doesNotMatch(js,/document\.write/);
});
