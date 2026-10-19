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
    // Equip a real, built-in starter scene through the existing player store.
    await page.waitForFunction(()=>typeof window.__luxStore?.getState?.().equipScene==='function');
    const sceneBefore=await page.evaluate(()=>window.__luxStore.getState().equippedScene);
    await page.evaluate(()=>window.__luxStore.getState().equipScene('classroom'));
    await page.waitForFunction(()=>document.querySelector('#lux-rpg-live-home')?.dataset.equippedScene==='classroom');
    assert.match(await page.locator('#lux-rpg-live-home').evaluate(el=>getComputedStyle(el).backgroundImage),/art\/stages\/classroom\.jpg/);
    assert.match(await page.locator('#lux-rpg-live-home .rpg-scene-picker-live').innerText(),/Classroom/);
    await page.evaluate(()=>window.__luxStore.getState().equipScene('dusk'));
    await page.waitForFunction(()=>document.querySelector('#lux-rpg-live-home')?.dataset.equippedScene==='dusk');
    assert.match(await page.locator('#lux-rpg-live-home').evaluate(el=>getComputedStyle(el).backgroundImage),/art\/stages\/dusk\.jpg/);

    // A player can select any OWNED reward. Verify grounding for the full catalogue
    // on desktop and representatives on iPad / phone, using test-only progress.
    const ownedBefore=await page.evaluate(()=>({
      selected:window.__luxStore.getState().equippedScene,
      owned:[...(window.__luxStore.getState().unlockedScenes||[])]
    }));
    const sceneCatalog=['dusk','classroom','courtyard','garden','library-hall',
      'dusk-court','form-room','conservatory','fountain','chem-lab','bio-lab',
      'phys-lab','sports-hall','herb-walk','boss-moon-garden',
      'boss-grand-library','boss-observatory'];
    const sampled = run.label==='desktop-chromium'
      ? sceneCatalog : ['dusk','classroom','garden','fountain','bio-lab'];
    await page.evaluate(ids=>{
      const state=window.__luxStore.getState();
      window.__luxStore.setState({unlockedScenes:[...new Set([...(state.unlockedScenes||[]),...ids])]});
    },sceneCatalog);
    for (const sceneId of sampled) {
      await page.evaluate(id=>window.__luxStore.getState().equipScene(id),sceneId);
      await page.waitForFunction(id=>
        document.querySelector('#lux-rpg-live-home')?.dataset.equippedScene===id &&
        document.querySelector('#lux-rpg-live-home .rpg-cast-live')?.dataset.sceneGround===id,
        sceneId,{timeout:10000});
      const frame=await page.evaluate(()=>{
        const root=document.querySelector('#lux-rpg-live-home');
        const cast=root.querySelector('.rpg-cast-live');
        const a=root.querySelector('.rpg-scholar-live').getBoundingClientRect();
        const b=root.querySelector('.rpg-pet-live img').getBoundingClientRect();
        const rail=root.querySelector('.rpg-rail-live').getBoundingClientRect();
        return {s:a.bottom,p:b.bottom,scholarX:a.x+a.width/2,petX:b.x+b.width/2,
          petRight:b.right,railLeft:rail.left,bg:getComputedStyle(root).backgroundImage,
          mood:root.dataset.sceneMood,
          contact:getComputedStyle(cast,'::before').content};
      });
      assert.ok(Math.abs(frame.s-frame.p)<4,'feet disconnected in '+sceneId);
      assert.ok(frame.scholarX<frame.petX,'pet in front of Scholar in '+sceneId);
      assert.ok(frame.contact!=='none' && frame.mood,'missing grounding in '+sceneId);
      assert.ok(frame.bg.includes('/art/'),'missing equipped art in '+sceneId);
      if(run.label==='desktop-chromium'){
        assert.ok(frame.petRight<frame.railLeft+3,'Pet overlaps quests in '+sceneId);
        if(['dusk','classroom','garden','fountain','bio-lab'].includes(sceneId))
          await page.screenshot({path:`test-results/rpg-home/scene-${sceneId}-desktop.png`});
      }
    }
    await page.evaluate(previous=>{
      const store=window.__luxStore;
      store.setState({unlockedScenes:previous.owned});
      store.getState().equipScene(previous.selected||'dusk');
    },ownedBefore);
    await page.waitForFunction(id=>document.querySelector('#lux-rpg-live-home')?.dataset.equippedScene===id,
      ownedBefore.selected||'dusk',{timeout:10000});

    assert.equal(await page.locator('#lux-rpg-live-home').count(),1,'only one new home layer');
    assert.equal(await page.locator('#lux-rpg-live-home .rpg-orb-live').count(),3);
    assert.equal(await page.locator('#lux-rpg-live-home .rpg-nav-live a, #lux-rpg-live-home .rpg-nav-live button').count(),9);
    const imageStatus=await page.locator('#lux-rpg-live-home img').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),ok:img.complete && img.naturalWidth>0})));
    assert.ok(imageStatus.every(x=>x.ok),'missing Home art '+JSON.stringify(imageStatus.filter(x=>!x.ok)));
    const liveTasks=await page.locator('#lux-rpg-live-home .rpg-quests-live .rpg-task-live').count();
    const waiting=await page.locator('#lux-rpg-live-home .rpg-loading-live').count();
    assert.ok(liveTasks===12 || waiting===1,'official 10 tasks or honest waiting state, no fake counts');
    // Exercise ten real-format quests even when a fresh CI browser has no saved daily plan.
    await page.evaluate(() => {
      window.LuxHomeJourneyV2Logic.homeJourney = () => ({
        ready:true,count:7,total:10,
        next:{kind:'resume',title:'Latin vocab',subtitle:'Question 3 / 30 · saved place',
          href:'/study/latin/practise?daily=1&task=latin-vocab'},
        rows:Array.from({length:10},(_,i)=>({
          id:'qa-task-'+i,title:['French vocab','Latin vocab','Biology focus','Chemistry review',
            'Physics mastery','Year 8 practice','Mistake recovery','Latin standard','PE session','Garden'][i],
          progress:i<7?10:0,target:10,done:i<7,
          href:'/study/latin/practise?daily=1&task=latin-vocab'
        }))
      });
      window.dispatchEvent(new Event('scholar:pet-changed'));
    });
    await page.locator('#lux-rpg-live-home .rpg-continue-live').waitFor({timeout:10000});
    const rows=await page.locator('#lux-rpg-live-home .rpg-quests-live .rpg-task-live').evaluateAll(els=>
      els.map(el=>({name:el.querySelector('strong')?.textContent?.trim(),
        text:el.textContent.trim(),width:el.querySelector('strong')?.getBoundingClientRect().width||0,
        display:getComputedStyle(el.querySelector('strong')).display})));
    assert.equal(rows.length,12,'two school items plus ten missions');
    assert.ok(rows.every(r=>r.name && r.text.includes(r.name) && r.width>12 && r.display!=='none'),
      'missing or hidden quest titles: '+JSON.stringify(rows));
    assert.match(await page.locator('#lux-rpg-live-home .rpg-continue-live').innerText(),/Resume saved question/);
    await page.screenshot({path:`test-results/rpg-home/${run.label}-ten-quests.png`,fullPage:true});
    // Both characters must stand on the same visible ground plane rather than
    // floating beside reward-scene furniture (tested on desktop, iPad, phone).
    const footing=await page.evaluate(()=>{
      const cast=document.querySelector('#lux-rpg-live-home .rpg-cast-live');
      const a=document.querySelector('#lux-rpg-live-home .rpg-scholar-live').getBoundingClientRect();
      const b=document.querySelector('#lux-rpg-live-home .rpg-pet-live img').getBoundingClientRect();
      return {scholarBottom:a.bottom,petBottom:b.bottom,scholarX:a.left+a.width/2,
        petX:b.left+b.width/2,ground:cast.dataset.sceneGround,
        shadow:getComputedStyle(cast,'::before').content,viewport:innerWidth};
    });
    assert.ok(Math.abs(footing.scholarBottom-footing.petBottom)<3,'character and pet have separate but aligned ground anchors');
    assert.notEqual(footing.shadow,'none','character should have a contact shadow');
    assert.ok(footing.scholarX<footing.petX,'pet belongs beside scholar, not on top of her feet');
    if(run.label==='desktop-chromium'){
      assert.ok(footing.scholarX>footing.viewport*.39&&footing.scholarX<footing.viewport*.58,
        'Scholar should occupy a clear center-left floor location');
    }
    const rowSizes=await page.locator('#lux-rpg-live-home .rpg-quests-live .rpg-task-live').evaluateAll(rows=>rows.map(row=>Math.round(row.getBoundingClientRect().height)));
    assert.ok(rowSizes.every(size=>size<=42),'quest rows must stay compact: '+rowSizes.join(','));
    await page.screenshot({path:`test-results/rpg-home/${run.label}.png`,fullPage:true});
    // Recovery control must open the original recovery engine without awarding credit.
    const original=await page.evaluate(()=>{
      const s=window.__luxStore?.getState?.();
      return s?JSON.stringify({xp:s.xp,daily:s.daily,dailyLog:s.dailyLog,recoveryTaskByDay:s.recoveryTaskByDay}):null;
    });
    await page.locator('#lux-rpg-live-home .rpg-orb-live').last().click();
    await page.locator('#lux-rpg-live-home .rpg-return').waitFor();
    assert.equal(await page.locator('main').count(),1,'original Home must remain accessible');
    assert.equal(await page.locator('#lux-recovery-quests').count(),1,'native Recovery panel must exist');
    assert.ok(await page.locator('#lux-recovery-quests').isVisible(),'native Recovery panel must become visible');
    const after=await page.evaluate(()=>{
      const s=window.__luxStore?.getState?.();
      return s?JSON.stringify({xp:s.xp,daily:s.daily,dailyLog:s.dailyLog,recoveryTaskByDay:s.recoveryTaskByDay}):null;
    });
    assert.equal(after,original,'opening Recovery must not mutate existing records');
    await page.locator('#lux-rpg-live-home .rpg-return').click();
    await page.locator('#lux-rpg-live-home .rpg-quests-live h1').waitFor();
    await context.close();
    process.stdout.write(`PASS ${run.label}\n`);
  } finally {await browser.close();}
}
