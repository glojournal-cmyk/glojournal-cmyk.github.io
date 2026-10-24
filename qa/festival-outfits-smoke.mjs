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
    assert(decoded.every(x=>x.w>=300&&x.h===512),JSON.stringify(decoded));
    const expected=catalog.map(x=>x.id);
    await page.waitForFunction(ids => {
      const s=window.__luxStore?.getState?.();
      return s&&ids.every(id=>s.unlockedOutfits?.includes(id));
    },expected,{timeout:20000});
    await page.screenshot({path:DEST+"/"+name+"-wardrobe.png",fullPage:true});
    const first=page.getByText("Halloween Night",{exact:true}).first();
    await first.click({timeout:20000});
    await page.waitForFunction(()=>window.__luxStore?.getState?.().equippedOutfit==="festival-halloween",{timeout:20000});
    await page.goto(ROOT+"/",{waitUntil:"domcontentloaded",timeout:40000});
    await page.waitForFunction(()=>window.__luxStore?.getState?.().equippedOutfit==="festival-halloween",{timeout:20000});
    await page.locator('img[src*="/art/doll/festival/01-halloween.webp"]').first().waitFor({timeout:20000});
    await page.screenshot({path:DEST+"/"+name+"-home.png",fullPage:true});
    await page.reload({waitUntil:"domcontentloaded"});
    await page.waitForFunction(()=>window.__luxStore?.getState?.().equippedOutfit==="festival-halloween",{timeout:20000});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert(overflow<=5,name+" horizontal overflow "+overflow);
    assert.equal(errors.length,0,"Uncaught exceptions: "+errors.join(" | "));
    results.push({browser:name,outfits:decoded.length,imagesDecoded:true,allUnlocked:true,homeSync:true,reloadPersists:true,overflowPx:overflow,status:"PASS"});
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
