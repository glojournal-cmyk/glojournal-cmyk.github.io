import {chromium, webkit, devices} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:8777';
const runs = [
  {label:'desktop-chromium',engine:chromium,opts:{viewport:{width:1280,height:800}}},
  {label:'ipad-webkit',engine:webkit,opts:{...devices['iPad (gen 7)'],viewport:{width:1024,height:768}}},
  {label:'mobile-chromium',engine:chromium,opts:{viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2}}
];
fs.mkdirSync('test-results/rpg-home',{recursive:true});
for (const run of runs) {
  const browser = await run.engine.launch({headless:true});
  try {
    const context=await browser.newContext(run.opts);
    const page=await context.newPage();
    await page.goto(base, {waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('#lux-rpg-live-home .rpg-quests-live h1').waitFor({timeout:45000});
    assert.equal(await page.locator('#lux-rpg-live-home').count(),1,'only one new home layer');
    assert.equal(await page.locator('#lux-rpg-live-home .rpg-orb-live').count(),3);
    assert.equal(await page.locator('#lux-rpg-live-home .rpg-nav-live a, #lux-rpg-live-home .rpg-nav-live button').count(),9);
    const imageStatus=await page.locator('#lux-rpg-live-home img').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),ok:img.complete && img.naturalWidth>0})));
    assert.ok(imageStatus.every(x=>x.ok),'missing Home art '+JSON.stringify(imageStatus.filter(x=>!x.ok)));
    const liveTasks=await page.locator('#lux-rpg-live-home .rpg-quests-live .rpg-task-live').count();
    const waiting=await page.locator('#lux-rpg-live-home .rpg-loading-live').count();
    assert.ok(liveTasks===12 || waiting===1,'official 10 tasks or honest waiting state, no fake counts');
    const rowSizes=await page.locator('#lux-rpg-live-home .rpg-quests-live .rpg-task-live').evaluateAll(rows=>rows.map(row=>Math.round(row.getBoundingClientRect().height)));
    assert.ok(rowSizes.every(size=>size<=42),'quest rows must stay compact: '+rowSizes.join(','));
    await page.screenshot({path:`test-results/rpg-home/${run.label}.png`,fullPage:true});
    await page.locator('#lux-rpg-live-home .rpg-orb-live').last().click();
    await page.locator('#lux-rpg-live-home .rpg-return').waitFor();
    assert.equal(await page.locator('main').count(),1,'original Home must remain accessible');
    await page.locator('#lux-rpg-live-home .rpg-return').click();
    await page.locator('#lux-rpg-live-home .rpg-quests-live h1').waitFor();
    await context.close();
    process.stdout.write(`PASS ${run.label}\n`);
  } finally {await browser.close();}
}
