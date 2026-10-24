import { chromium, webkit } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";

const ROOT="http://127.0.0.1:8787";
const catalog=JSON.parse(fs.readFileSync("art/doll/festival/manifest.json","utf8")).items;
const DEST="qa-artifacts/festival";
fs.mkdirSync(DEST,{recursive:true});
const results=[];

async function scenario(name,engine,viewport){
  const browser=await engine.launch({headless:true});
  const ctx=await browser.newContext({viewport,deviceScaleFactor:2,hasTouch:true});
  const page=await ctx.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  try{
    await page.goto(ROOT+"/scholar/",{waitUntil:"domcontentloaded",timeout:40000});
    await page.getByRole("button",{name:"Wardrobe",exact:true}).first().click({timeout:25000}).catch(()=>{});
    await page.getByRole("button",{name:"Festival",exact:true}).waitFor({timeout:25000});
    await page.getByRole("button",{name:"Festival",exact:true}).click();
    const arts=page.locator('.lux-scholar-looks img[src*="/art/doll/festival/"]');
    await page.waitForFunction(() =>
      document.querySelectorAll('.lux-scholar-looks img[src*="/art/doll/festival/"]').length===10,{timeout:25000});
    assert.equal(await arts.count(),10,name+": expected 10 full-look portraits");
    const decoded=await arts.evaluateAll(async imgs=>{
      const values=[];
      for(const img of imgs){
        img.loading="eager";
        await img.decode().catch(()=>{});
        values.push({src:img.getAttribute("src"),w:img.naturalWidth,h:img.naturalHeight});
      }
      return values;
    });
    assert(decoded.every(x=>x.w>=1000&&x.h>=1000&&x.src.endsWith('-same-scholar-v3.png')),JSON.stringify(decoded));
    const expected=catalog.map(x=>x.id);
    await page.waitForFunction(ids => {
      const s=window.__luxStore?.getState?.();
      return s&&ids.every(id=>s.unlockedOutfits?.includes(id));
    },expected,{timeout:20000});
    // All ten generated cutouts can be selected; scene controls must not cover the character.
    assert.equal(await page.locator(".lux-scholar-stage button").count(),0,"Scene controls obstruct protagonist");
    const savedBefore=await page.evaluate(()=>{
      const s=window.__luxStore.getState();
      return JSON.stringify({xp:s.xp,history:s.history,topicStats:s.topicStats,daily:s.daily,reviews:s.reviews});
    });
    const testLooks=name.startsWith("chromium")?catalog:[catalog[0],catalog[4],catalog[9]];
    for(const look of testLooks){
      await page.locator(".lux-scholar-looks button").filter({hasText:look.name}).first().click({timeout:20000});
      await page.waitForFunction(id=>window.__luxStore?.getState?.().equippedOutfit===id,look.id,{timeout:20000});
      await page.waitForFunction(url=>document.querySelector('.lux-scholar-stage img[alt*=" in "]')?.getAttribute('src')===url,look.art,{timeout:20000});
    }
    const savedAfter=await page.evaluate(()=>{
      const s=window.__luxStore.getState();
      return JSON.stringify({xp:s.xp,history:s.history,topicStats:s.topicStats,daily:s.daily,reviews:s.reviews});
    });
    assert.equal(savedAfter,savedBefore,"Outfit selection must not change learner records");
    // Restore Halloween only for cross-page Home/reload sync checks.
    await page.locator(".lux-scholar-looks button").filter({hasText:catalog[0].name}).first().click({timeout:20000});
    await page.waitForFunction(()=>window.__luxStore?.getState?.().equippedOutfit==="festival-halloween",null,{timeout:20000});
    await page.screenshot({path:DEST+"/"+name+"-wardrobe.png",fullPage:true});
    await page.goto(ROOT+"/",{waitUntil:"domcontentloaded",timeout:40000});
    await page.waitForFunction(()=>window.__luxStore?.getState?.().equippedOutfit==="festival-halloween",{timeout:20000});
    await page.locator('img[src*="/art/doll/festival/01-halloween-same-scholar-v3.png"]').first().waitFor({timeout:20000});
    await page.screenshot({path:DEST+"/"+name+"-home.png",fullPage:true});
    await page.reload({waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>window.__luxStore?.getState?.().equippedOutfit==="festival-halloween",{timeout:20000});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert(overflow<=5,name+" horizontal overflow "+overflow);
    // Browser-only localhost CORS diagnostics from legacy preloads/blobs.
    // All other JavaScript exceptions remain failures.
    const unexpected=errors.filter(e=>!(name.startsWith("webkit-") &&
      e.includes("due to access control checks.") &&
      (e.startsWith("Fetch API cannot load http: /127.0.0.1:8787/") ||
       e.startsWith("Cannot load blob: ttp://127.0.0.1:8787/") || e.startsWith("/127.0.0.1:8787/assessment/")))));
    assert.equal(unexpected.length,0,"Uncaught exceptions: "+unexpected.join(" | "));
    results.push({browser:name,outfits:decoded.length,imagesDecoded:true,allUnlocked:true,homeSync:true,reloadPersists:true,allTenSelectable:name.startsWith("chromium"),recordsUnchanged:true,overflowPx:overflow,status:"PASS"});
  }finally{await browser.close();}
}
try{
  await scenario("chromium-ipad-landscape",chromium,{width:1180,height:820});
  await scenario("webkit-ipad-landscape",webkit,{width:1180,height:820});
  await scenario("webkit-ipad-portrait",webkit,{width:820,height:1180});
}catch(e){
  results.push({status:"FAIL",error:String(e)});
  throw e;
}finally{
  fs.writeFileSync(DEST+"/result.json",JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
}
