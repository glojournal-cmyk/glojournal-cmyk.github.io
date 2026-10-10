import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";

const root=process.cwd();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
 ".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",
 ".webp":"image/webp",".woff2":"font/woff2",".ico":"image/x-icon"};
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost");
  let name=decodeURIComponent(url.pathname);
  if(name.endsWith("/"))name+="index.html";
  const target=path.resolve(root,"."+name);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  const stat=fs.statSync(target);
  const resolved=stat.isDirectory()?path.join(target,"index.html"):target;
  const data=fs.readFileSync(resolved);
  res.writeHead(200,{"content-type":mime[path.extname(resolved)]||"application/octet-stream",
   "cache-control":"no-store"});res.end(data);
 }catch{res.writeHead(404);res.end("Not Found")}
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base="http://127.0.0.1:"+server.address().port;
fs.mkdirSync("test-results",{recursive:true});
const failures=[],reports=[];
try{
 for(const [name,launcher] of [["chromium",chromium],["webkit",webkit]]){
  const browser=await launcher.launch({headless:true});
  try{
   for(const vp of [{width:1560,height:920},{width:1280,height:800},{width:834,height:1112},{width:390,height:844}]){
    const context=await browser.newContext({viewport:vp,locale:"en-GB",
     timezoneId:"Europe/London",hasTouch:vp.width===834});
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    try{
     const response=await page.goto(base+"/study/",{waitUntil:"domcontentloaded",timeout:35000});
     assert.equal(response.status(),200,"Study HTTP status");
     await page.waitForFunction(()=>{
       const nav=document.getElementById("lux-study-paths-v2");
       const app=document.querySelector("main h1");
       return !!nav && !!app && /Continue Learning/i.test(app.textContent||"");
     },null,{timeout:30000});
     // Approved B celestial academy symbol must be visible and decodable.
     const brand=await page.evaluate(()=>{
       const select=window.innerWidth>=1280
         ? 'aside.fixed > a[href="/"] > span:first-child'
         : 'header a[href="/"]';
       const el=document.querySelector(select);
       if(!el)return null;
       const style=window.innerWidth>=1280?getComputedStyle(el):getComputedStyle(el,'::before');
       return {background:style.backgroundImage,width:parseFloat(style.width),
         height:parseFloat(style.height)};
     });
     assert.ok(brand,"branded header exists");
     assert.ok(brand.background.includes("lux-celestial-b-symbol-20261010.png"),
       "approved B emblem is displayed");
     if(vp.width>=1280)assert.ok(brand.width>=130 && brand.height>=125,
       "desktop B logo is not cramped");
     const logoResponse=await page.request.get(base+"/assets/lux-celestial-b-symbol-20261010.png");
     assert.equal(logoResponse.status(),200,"approved B logo file exists");
     assert.match(logoResponse.headers()["content-type"] || "",/image\/png/);
     const imageLoads=await page.evaluate(()=>new Promise(resolve=>{
       const img=new Image();
       img.onload=()=>resolve(img.naturalWidth>=190&&img.naturalHeight>=180);
       img.onerror=()=>resolve(false);
       img.src="/assets/lux-celestial-b-symbol-20261010.png";
     }));
     assert.equal(imageLoads,true,"B logo image pixels load in this browser");
     // Real first-screen UX: Quest Hall precedes every Study/library panel.
     await page.waitForFunction(()=>{
       const quest=document.querySelector("#lux-study-paths-v2");
       const parent=quest?.parentElement;
       return !!quest && parent?.dataset.luxQuestReady==="true"
         && parent.firstElementChild===quest;
     },null,{timeout:10000});
     const fold=await page.evaluate(()=>{
       const rect=sel=>document.querySelector(sel)?.getBoundingClientRect()?.toJSON();
       const quest=document.querySelector("#lux-study-paths-v2");
       const siblings=quest?.parentElement;
       return {quest:rect("#lux-study-paths-v2"),subjects:rect("#lux-study-subjects-v2"),
         noDirectory:!document.getElementById("subject-directory-entry"),
         first:siblings?.firstElementChild===quest,
         redundant:[...siblings.children].filter(el=>el.dataset.luxQuestLegacyShortcut==="true")
           .map(el=>({name:el.querySelector("h2")?.textContent||"",
             display:getComputedStyle(el).display})),
         yearVisible:!!document.querySelector("main select:has(option[value='8'])")?.getClientRects().length};
     });
     assert.ok(fold.noDirectory,"obsolete Browse subjects directory must be removed");
     assert.ok(fold.first,"Quest Hall must be the first Study content, not Subjects");
     assert.ok(fold.quest.top<240,"Quest Hall must appear in first screen: "+JSON.stringify(fold));
     assert.ok(fold.subjects.top>fold.quest.top+250,
       "original six-subject library must come after the Quest Hall");
     assert.ok(fold.redundant.length===2 &&
       fold.redundant.every(x=>x.display==="none"),
       "legacy Start your next topic and Today must not duplicate Quest Hall: "+JSON.stringify(fold));
     assert.ok(fold.yearVisible,"native Year 8/9 picker stays visible");
     assert.equal(await page.locator("#lux-study-paths-v2 article").count(),3);
     // All three destinations are now navigable in the character-and-pet scene.
     assert.equal(await page.locator(".lux-path-portals a").count(),3);
     assert.equal(await page.locator(".lux-path-sigils span").count(),10);
     assert.ok((await page.locator(".lux-path-portal").first().innerText()).includes("Daily Quest"));
     assert.ok((await page.locator(".lux-path-portal").nth(1).innerText()).includes("Scholar"));
     assert.ok((await page.locator(".lux-path-portal").nth(2).innerText()).includes("Trial Chamber"));
     // Daily Quest must not be mistaken for a task progress row by the theme.
     await page.waitForTimeout(250);
     const portalLayout=await page.locator(".lux-path-portals .lux-path-portal").evaluateAll(links=>
       links.map(link=>{
         const glyph=link.querySelector(":scope > .lux-portal-glyph")?.getBoundingClientRect();
         const card=link.getBoundingClientRect();
         const words=link.querySelector(":scope > span:last-child")?.getBoundingClientRect();
         return {width:glyph?.width,height:glyph?.height,cardHeight:card.height,
           cardRight:card.right,textRight:words?.right,
           injectedIcon:!!link.querySelector(".lux-ico")};
       }));
     assert.equal(portalLayout.length,3);
     for(const [i,p] of portalLayout.entries()){
       assert.equal(p.injectedIcon,false,
         "unexpected green icon in portal "+i+": "+JSON.stringify(portalLayout));
       assert.ok(p.width>=26&&p.width<=36&&Math.abs(p.width-p.height)<=2,
         "oval star icon in portal "+i+": "+JSON.stringify(portalLayout));
       assert.ok(p.cardHeight<132,
         "portal wrap regression "+i+": "+JSON.stringify(portalLayout));
       assert.ok(p.textRight<=p.cardRight+2,
         "portal text overflow "+i+": "+JSON.stringify(portalLayout));
     }


     // User-requested Study change: a shorter visual and NO pet, while
     // Current Quest, equipped girl and all three portal buttons remain usable.
     assert.equal(await page.locator(".lux-path-hero-pet").count(),0,
       "Study page must not render pet illustration");
     assert.equal(await page.locator(".lux-path-hero-links a[href='/pet/']").count(),0,
       "Study scene must not show a Companion shortcut");
     const layout=await page.evaluate(()=>{
       const box=sel=>document.querySelector(sel)?.getBoundingClientRect()?.toJSON();
       const scholar=document.querySelector(".lux-path-hero-scholar");
       return {hero:box(".lux-path-hero"),stage:box(".lux-path-hero-stage"),
         quest:box(".lux-quest-now"),copy:box(".lux-path-hero-copy"),
         portals:box(".lux-path-portals"),girl:box(".lux-path-hero-scholar"),
         onePortal:box(".lux-path-portal"),girlLoaded:!!scholar?.complete&&scholar.naturalWidth>0};
     });
     assert.ok(layout.stage&&layout.quest&&layout.portals&&layout.girl&&layout.girlLoaded,
       "compact Study stage must show real artwork and Current Quest");
     assert.ok(layout.stage.height<470,"scene must be smaller than old 525-625px version: "+JSON.stringify(layout));
     if(vp.width>=1001)assert.ok(layout.stage.height<=380,
       "desktop Study scene should be about 370px");
     const fits=(a,b,margin=2)=>a.bottom<=b.top+margin;
     assert.ok(fits(layout.quest,layout.portals),
       "Current Quest and portals may not overlap: "+JSON.stringify(layout));
     assert.ok(fits(layout.copy,layout.portals),
       "Quest text and portals may not overlap: "+JSON.stringify(layout));
     assert.ok(fits(layout.girl,layout.portals),
       "Girl may not be cut off by portal footer: "+JSON.stringify(layout));
     assert.ok(layout.quest.bottom<=layout.stage.bottom+2,
       "Entire Current Quest must fit inside shorter scene: "+JSON.stringify(layout));
     assert.ok(layout.copy.bottom<=layout.stage.bottom+2,
       "All Quest controls must fit inside shorter scene: "+JSON.stringify(layout));
     assert.ok(layout.onePortal.bottom<=layout.portals.bottom+2,
       "All three portals must fit inside footer");
     assert.ok(layout.hero.height>=layout.stage.height+layout.portals.height-2,
       "Scene and portals require separate layout space");
     if(vp.width>=800)assert.ok(layout.girl.x>layout.quest.right-20,
       "Scholar must not stand over quest card");
     // Changing clothes updates only the original girl sprite; the pet stays absent.
     await page.evaluate(async()=>{
       const mod=await import("/assets/index-BLVOhKhN.js?v=20261010-chem-marking1");
       mod.C.setState({equippedOutfit:"library"});
       window.dispatchEvent(new Event("storage"));
     });
     await page.waitForFunction(()=>{
       const a=document.querySelector(".lux-path-hero-scholar");
       return a?.getAttribute("src")==="/art/doll/cardigan.png"
         && a.complete && a.naturalWidth>0;
     },null,{timeout:20000});
     assert.equal(await page.locator(".lux-path-hero-pet").count(),0);
     assert.equal(await page.locator('a[href="/assessment/"]').count()>0,true);
     assert.equal(await page.locator("#lux-study-paths-v2 a[href^='/']").count()>0,true);
     assert.equal(await page.locator('main a[href="/study/latin"]').count()>0,true);
     assert.equal(await page.locator('main a[href="/study/chemistry"]').count()>0,true);
     assert.ok((await page.locator("main").innerText()).length>250,"non-blank Study page");
     const homeResponse=await page.request.get(base+"/");
     const homeText=await homeResponse.text();
     assert.doesNotMatch(homeText,/study-navigation-v2-20261010/,"Home untouched");
     // The UX year buttons must delegate to the existing Study year selection.
     await page.locator("#lux-study-paths-v2 .lux-path-expand > summary").click();
     await page.locator('#lux-study-paths-v2 button[data-lux-year="8"]').click();
     await page.waitForTimeout(700);
     assert.equal(await page.locator('main select:has(option[value="8"])').inputValue(),"8",
       "native Study year switch");
     const href=await page.locator("#lux-study-paths-v2 article").first().locator("a").getAttribute("href");
     assert.ok(href?.startsWith("/"),"daily link same-origin");
     if(errors.length)throw Error("JS errors: "+errors.slice(0,4).join("; "));
     reports.push({engine:name,viewport:vp.width,panels:3,studyAlive:true,year8Works:true});
     await page.screenshot({path:"test-results/study-nav-"+name+"-"+vp.width+".png",fullPage:true});
     // Regression guard from the earlier blank Home release: no Study scripts
     // may be loaded on Home and its React content must render normally.
     const home=await page.goto(base+"/",{waitUntil:"domcontentloaded",timeout:35000});
     assert.equal(home.status(),200,"Home route returns 200");
     await page.waitForFunction(()=>document.querySelector("main h1")?.textContent?.includes("Scholar"),
       null,{timeout:30000});
     assert.ok((await page.locator("main").innerText()).length>300,"Home is not blank");
     assert.equal(await page.locator("#subject-directory-entry").count(),0,
       "Home must not open on the obsolete Browse subjects panel");

     assert.equal(await page.locator("#lux-study-paths-v2").count(),0,"no Study-only UI on Home");
     const homeBrand=await page.evaluate(()=>{
       const element=window.innerWidth>=1280
         ? document.querySelector('aside.fixed > a[href="/"] > span:first-child')
         : document.querySelector('header a[href="/"]');
       if(!element)return "";
       return getComputedStyle(element,window.innerWidth>=1280?null:"::before").backgroundImage;
     });
     assert.ok(homeBrand.includes("lux-celestial-b-symbol-20261010.png"),
       "approved B logo visible on Home");
     await page.screenshot({path:"test-results/home-b-brand-"+name+"-"+vp.width+".png",fullPage:true});

    }catch(e){
     failures.push({engine:name,viewport:vp.width,message:e.message,errors});
     await page.screenshot({path:"test-results/study-nav-FAILED-"+name+"-"+vp.width+".png",fullPage:true}).catch(()=>{});
    }finally{await context.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(r=>server.close(r))}
console.log("STUDY_NAV_BROWSER_QA "+JSON.stringify({base,reports,failures}));
assert.deepEqual(failures,[],"Study navigation must render in Chromium and iPad WebKit");
