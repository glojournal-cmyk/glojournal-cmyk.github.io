import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";

const BASE="http://127.0.0.1:8787";
const scenes=JSON.parse(fs.readFileSync("art/scenes/festival/manifest.json","utf8")).scenes;
const out="qa-artifacts/festival-backgrounds";
fs.mkdirSync(out,{recursive:true});
const results=[];

async function scenario(label,type,viewport,checkAll=false){
  const browser=await type.launch({headless:true});
  const ctx=await browser.newContext({viewport,hasTouch:true,deviceScaleFactor:2});
  const page=await ctx.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e?.message||e)));
  try{
    await page.goto(BASE+"/scholar/",{waitUntil:"domcontentloaded",timeout:40000});
    await page.getByRole("button",{name:"Wardrobe",exact:true}).first().click({timeout:25000}).catch(()=>{});
    await page.getByRole("button",{name:"Backgrounds",exact:true}).waitFor({timeout:30000});
    await page.getByRole("button",{name:"Backgrounds",exact:true}).click();

    const imgs=page.locator('.lux-scholar-looks img[src*="/art/scenes/festival/"]');
    await page.waitForFunction(()=>document.querySelectorAll('.lux-scholar-looks img[src*="/art/scenes/festival/"]').length===10,null,{timeout:25000});
    assert.equal(await imgs.count(),10, "Ten unique Festival background choices");
    const decoded=await imgs.evaluateAll(async images=>{
      const rows=[];
      for(const img of images){img.loading='eager';await img.decode().catch(()=>{});rows.push({src:img.getAttribute('src'),w:img.naturalWidth,h:img.naturalHeight})}
      return rows;
    });
    assert.equal(new Set(decoded.map(x=>x.src)).size,10);
    assert(decoded.every(x=>x.w>=1400&&x.h>=1000),JSON.stringify(decoded));

    const baseline=await page.evaluate(()=>{
      const s=window.__luxStore.getState();
      return JSON.stringify({xp:s.xp,topicStats:s.topicStats,dailyLog:s.dailyLog,history:s.history});
    });

    const list=checkAll?scenes:[scenes[0],scenes[9]];
    for(const item of list){
      await page.locator('.lux-scholar-looks button').filter({hasText:item.name}).first().click({timeout:15000});
      await page.waitForFunction(id=>window.__luxStore?.getState?.().equippedScene===id,item.id,{timeout:10000});
      const selectedSrc=await page.locator('.lux-scholar-stage > img').first().getAttribute("src");
      assert.equal(selectedSrc,item.art,"Stage did not update with manual scene choice");
    }
    // Always persist Halloween for the cross-page demonstration.
    await page.locator('.lux-scholar-looks button').filter({hasText:scenes[0].name}).first().click();
    await page.waitForFunction(id=>window.__luxStore?.getState?.().equippedScene===id,scenes[0].id,{timeout:10000});
    await page.screenshot({path:out+"/"+label+"-scene-picker.png",fullPage:true});

    const now=await page.evaluate(()=>{
      const s=window.__luxStore.getState();
      return JSON.stringify({xp:s.xp,topicStats:s.topicStats,dailyLog:s.dailyLog,history:s.history});
    });
    assert.equal(now,baseline,"Switching scenes must not edit learning progress");

    await page.goto(BASE+"/",{waitUntil:"domcontentloaded",timeout:40000});
    await page.waitForFunction(id=>{
      const el=document.getElementById("lux-rpg-live-home");
      return el?.dataset?.equippedScene===id&&el?.style?.backgroundImage?.includes('/art/scenes/festival/halloween.webp');
    },scenes[0].id,{timeout:30000});
    await page.screenshot({path:out+"/"+label+"-home.png",fullPage:true});

    await page.goto(BASE+"/garden/",{waitUntil:"domcontentloaded",timeout:40000});
    await page.locator('img[src*="/art/scenes/festival/halloween.webp"]').first().waitFor({timeout:25000});

    await page.goto(BASE+"/scholar/",{waitUntil:"domcontentloaded",timeout:40000});
    await page.reload({waitUntil:"domcontentloaded"});
    await page.waitForFunction(id=>window.__luxStore?.getState?.().equippedScene===id,scenes[0].id,{timeout:30000});

    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert(overflow<=5,"Unexpected iPad horizontal overflow: "+overflow);
    const unexpected=errors.filter(e=>!(label.includes("webkit")&&e.includes("due to access control checks.")&&
      (e.startsWith("Fetch API cannot load http: /127.0.0.1:8787/")||e.startsWith("Cannot load blob: ttp://127.0.0.1:8787/"))));
    assert.equal(unexpected.length,0,"Unexpected runtime errors: "+unexpected.join(" | "));
    results.push({browser:label,images:10,decoded:true,manualSwitch:true,scenePicker:true,homeSync:true,gardenSync:true,persistAfterReload:true,recordsUnchanged:true,overflowPx:overflow,status:"PASS"});
  }finally{await browser.close()}
}
try{
  await scenario("chromium-ipad-landscape",chromium,{width:1180,height:820},true);
  await scenario("webkit-ipad-landscape",webkit,{width:1180,height:820});
  await scenario("webkit-ipad-portrait",webkit,{width:820,height:1180});
}catch(e){results.push({status:"FAIL",error:String(e)});throw e}
finally{fs.writeFileSync(out+"/results.json",JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));}
