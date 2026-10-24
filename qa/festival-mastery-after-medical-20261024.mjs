import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const base="http://127.0.0.1:8787";
const festival=JSON.parse(fs.readFileSync("art/doll/festival/manifest.json","utf8")).items;
const scenes=JSON.parse(fs.readFileSync("art/scenes/festival/manifest.json","utf8")).scenes;
const results=[], folder="qa-artifacts/festival-mastery";
fs.mkdirSync(folder,{recursive:true});
const expected=[110,120,130,140,150,160,170,180,190];
assert.deepEqual(festival.slice(1).map(x=>x.needIf.masteredTopics),expected);
assert.deepEqual(scenes.slice(1).map(x=>x.needIf.masteredTopics),expected);
async function runScenario(label, engine, viewport) {
 const browser=await engine.launch({headless:true});
 const ctx=await browser.newContext({viewport,deviceScaleFactor:2,hasTouch:true});
 const page=await ctx.newPage();
 const errors=[];
 page.on("pageerror",e=>errors.push(String(e?.message||e)));
 try{
   await page.goto(base+"/scholar/",{waitUntil:"domcontentloaded",timeout:40000});
   await page.waitForFunction(()=>window.__luxStore?.getState?.().festivalMasteryGateV1===true,null,{timeout:30000});
   const read=()=>page.evaluate(()=>{
     const s=window.__luxStore.getState();
     return {outfits:s.unlockedOutfits,scenes:s.unlockedScenes,eqOutfit:s.equippedOutfit,
       eqScene:s.equippedScene,mastery:Object.values(s.topicStats||{}).filter(v=>v?.state==="mastered").length,
       flag:s.festivalMasteryGateV1,xp:s.xp,records:s.history?.length};
   });
   let st=await read();
   assert(st.outfits.includes("festival-halloween"),"Halloween outfit should be free");
   assert(st.scenes.includes("festival-scene-halloween"),"Halloween backdrop should be free");
   assert(!st.outfits.includes("festival-bonfire"),"Unmastered Bonfire should be locked");
   assert(!st.scenes.includes("festival-scene-bonfire"),"Unmastered Bonfire background should be locked");
   const xpBefore=st.xp, historyBefore=st.records;
   await page.getByRole("button",{name:"Festival",exact:true}).click();
   const thumbs=page.locator('.lux-scholar-looks img[src*="/art/doll/festival/"]');
   await page.waitForFunction(()=>document.querySelectorAll('.lux-scholar-looks img[src*="/art/doll/festival/"]').length===10,null,{timeout:15000});
   assert.equal(await thumbs.count(),10);
   const fullyLoaded=await thumbs.evaluateAll(async els=>{
     const values=[];
     for(const el of els){el.loading="eager";await el.decode().catch(()=>{});values.push([el.naturalWidth,el.naturalHeight])}
     return values;
   });
   assert(fullyLoaded.every(x=>x[0]===1086 && x[1]===1448),JSON.stringify(fullyLoaded));
   const bonfire=page.locator('.lux-scholar-looks button').filter({hasText:"Bonfire Night"}).first();
   assert((await bonfire.innerText()).includes("110"),"Locked card must display required Mastery");
   await page.getByRole("button",{name:"Backgrounds",exact:true}).click();
   const bonfireBackground=page.locator('.lux-scholar-looks button').filter({hasText:"Bonfire Night · Fireworks"}).first();
   assert((await bonfireBackground.innerText()).includes("110"),"Locked scene must display required Mastery");

   async function setMastery(total){
     await page.evaluate(total=>{
       const topicStats=Object.fromEntries(Array.from({length:total},(_,i)=>["qa-mastery-"+String(i+1).padStart(3,"0"),{state:"mastered"}]));
       window.__luxStore.setState({topicStats});
     },total);
     await page.waitForFunction(total=>Object.values(window.__luxStore.getState().topicStats||{}).filter(v=>v?.state==="mastered").length===total,total);
   }
   await setMastery(100);
   await page.waitForFunction(()=>window.__luxStore.getState().unlockedOutfits.includes("medical-10-medical-student"));
   st=await read();
   assert(!st.outfits.includes("festival-bonfire")&&!st.scenes.includes("festival-scene-bonfire"),"Medical 100 cannot grant Festival 110");
   await setMastery(110);
   await page.waitForFunction(()=>window.__luxStore.getState().unlockedOutfits.includes("festival-bonfire")&&
     window.__luxStore.getState().unlockedScenes.includes("festival-scene-bonfire"));
   st=await read();
   assert(!st.outfits.includes("festival-christmas")&&!st.scenes.includes("festival-scene-christmas"));
   await setMastery(190);
   await page.waitForFunction(ids=>ids.every(id=>window.__luxStore.getState().unlockedOutfits.includes(id)),
      festival.slice(1).map(x=>x.id));
   st=await read();
   assert(scenes.slice(1).every(scene=>st.scenes.includes(scene.id)),"Pair backgrounds must unlock with outfits");

   // Once truly earned, the rewards are retained even if a topic is revisited.
   await setMastery(0);
   st=await read();
   assert(festival.slice(1).every(x=>st.outfits.includes(x.id)));
   assert(scenes.slice(1).every(x=>st.scenes.includes(x.id)));

   // Simulate an old account where a previous release auto-granted 10 looks/scenes;
   // keep what was actively equipped but gate the other freebies until Mastery.
   await page.evaluate(({outfitIds,sceneIds})=>{
     const state=window.__luxStore.getState();
     window.__luxStore.setState({
       topicStats:{},
       festivalMasteryGateV1:false,
       equippedOutfit:"festival-christmas",
       equippedScene:"festival-scene-christmas",
       unlockedOutfits:[...new Set(["day",...outfitIds])],
       unlockedScenes:[...new Set(["dusk","classroom",...sceneIds])],
     });
   },{outfitIds:festival.map(x=>x.id),sceneIds:scenes.map(x=>x.id)});
   await page.waitForFunction(()=>{
     const s=window.__luxStore.getState();
     return s.festivalMasteryGateV1===true && !s.unlockedOutfits.includes("festival-bonfire")
       && !s.unlockedScenes.includes("festival-scene-bonfire");
   });
   st=await read();
   assert(st.outfits.includes("festival-christmas")&&st.scenes.includes("festival-scene-christmas"),"Retain actively equipped legacy look/scene");
   assert(st.outfits.includes("festival-halloween")&&st.scenes.includes("festival-scene-halloween"));

   await page.reload({waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>window.__luxStore?.getState?.().festivalMasteryGateV1===true);
   st=await read();
   assert(st.outfits.includes("festival-christmas")&&st.scenes.includes("festival-scene-christmas"),"Legacy equipped pair must persist on reload");
   assert(!st.outfits.includes("festival-bonfire")&&!st.scenes.includes("festival-scene-bonfire"));
   assert.equal(st.xp,xpBefore,"Only reward-state logic, never change learner XP");
   assert.equal(st.records,historyBefore,"Never delete or rewrite learner history");
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert(overflow<=5,"Horizontal overflow "+overflow);
   const unexpected=errors.filter(e=>!(label.startsWith("webkit") &&
       e.includes("due to access control checks.") &&
       (e.includes("127.0.0.1:8787/assessment/") || e.includes("Cannot load blob:"))));
   assert.equal(unexpected.length,0,"Uncaught runtime errors "+unexpected.join(" | "));
   await page.screenshot({path:folder+"/"+label+".png",fullPage:true});
   results.push({browser:label,medicalLast:100,festivalTiers:expected.length,firstFestival:110,lastFestival:190,
     pairedUnlock:true,halloweenFree:true,legacyEquippedPreserved:true,reloadPersists:true,
     academicRecordsUnchanged:true,overflowPx:overflow,status:"PASS"});
 }finally{await browser.close();}
}
try{
 await runScenario("chromium-ipad-landscape",chromium,{width:1180,height:820});
 await runScenario("webkit-ipad-landscape",webkit,{width:1180,height:820});
 await runScenario("webkit-ipad-portrait",webkit,{width:820,height:1180});
}catch(error){results.push({status:"FAIL",error:String(error)});throw error}
finally{fs.writeFileSync(folder+"/results.json",JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2))}
