import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";
const base=process.env.QA_BASE_URL||"https://glojournal-cmyk.github.io";
const routes=["/assessment","/garden","/","/pet","/play/case-locker","/play/dictation-dash","/play/element-match","/play/error-hunter","/play/force-match","/play/forma-forge","/play","/play/","/play/manuscript","/play/mot-match","/play/organelle-match","/play/pe-circuit","/play/phrase-mosaic","/play/runway-check","/play/sentence-mosaic","/play/sixty-blitz","/play/verbum-match","/play/weekly-boss","/play/word-match","/preview","/scholar","/session/french-dictation","/session/french-vocab","/session/french-writing","/study/biology","/study/biology/learn","/study/biology/play","/study/biology/practise","/study/biology/progress","/study/biology/school-notes","/study/chemistry","/study/chemistry/learn","/study/chemistry/play","/study/chemistry/practise","/study/chemistry/progress","/study/english","/study/english/learn","/study/english/play","/study/english/practise","/study/english/progress","/study/french","/study/french/learn","/study/french/play","/study/french/practise","/study/french/progress","/study","/study/","/study/latin","/study/latin/learn","/study/latin/play","/study/latin/practise","/study/latin/progress","/study/physics","/study/physics/learn","/study/physics/play","/study/physics/practise","/study/physics/progress"];
const results=[],failures=[];
function problem(row,type,detail){failures.push({engine:row.engine,route:row.route,year:row.year,type,detail});}
for(const [engine,launcher] of [["chromium",chromium],["webkit",webkit]]){
 const browser=await launcher.launch({headless:true});
 const queue=[...routes.map(route=>({route})),...["latin","french","biology","chemistry","physics"].flatMap(subject=>["learn","practise"].map(kind=>({route:"/study/"+subject+"/"+kind,year:8})))];
 async function worker(){
  while(queue.length){
   const item=queue.shift(),row={engine,route:item.route,year:item.year||9,errors:[],badResponses:[]};
   const context=await browser.newContext({viewport:{width:1024,height:1366},isMobile:engine==="webkit",hasTouch:true,timezoneId:"Europe/London"});
   const page=await context.newPage();
   page.on("pageerror",e=>row.errors.push(e.stack||e.message));
   page.on("response",r=>{if(r.status()>=400&&r.url().startsWith(base))row.badResponses.push({status:r.status(),url:r.url().slice(base.length)});});
   try{
    // Load the target document first. Setting Year 8 on a separate Home
   // document then navigating away aborts pending Home fetches in WebKit.
   // Those old-document errors were incorrectly attributed to this route.
   // Switching the actual target page also exercises the real year selector
   // and keeps genuine errors, HTTP failures and broken assets observable.
    const response=await page.goto(base+item.route,{waitUntil:"domcontentloaded",timeout:45000});row.status=response?.status();
    if(item.year){
     await page.evaluate(async year=>{
      const src=[...document.scripts].map(s=>s.src).find(s=>s.includes("/assets/index-BLVOhKhN.js"));
      if(!src) throw new Error("Study route does not load the expected app bundle");
      const mod=await import(src);mod.C.getState().setYear(year);
     },item.year);
    }
    await page.waitForTimeout(4500);
    // Safari/WebKit can complete DOMContentLoaded before a lazy game route
    // hydrates. Wait for meaningful visible content, but still fail if it
    // remains empty rather than masking a genuinely broken page.
    await page.waitForFunction(() => {
      const root=document.querySelector("main") || document.body;
      return (root?.innerText || "").trim().length >= 35;
    }, null, {timeout:12000}).catch(()=>{});
    const snap=await page.evaluate(()=>({
      title:document.title,headings:[...document.querySelectorAll("h1,h2,h3")].filter(e=>e.getBoundingClientRect().height).map(e=>e.textContent),
      text:((location.pathname==="/" && document.documentElement.classList.contains("lux-rpg-live-active") ? document.querySelector("#lux-rpg-live-home") : null) || ((/^\/study\/?$/.test(location.pathname) && document.documentElement.classList.contains("lux-study-rpg-active")) ? document.querySelector("#lux-study-rpg-integrated") : null) || ((/^\/play\/?$/.test(location.pathname) && document.documentElement.classList.contains("lux-play-hall-active")) ? document.querySelector("#lux-play-hall-preview") : null) || document.querySelector("main") || document.body).innerText,playCards:document.querySelectorAll("#lux-play-hall-preview .lux-play-hall-card").length,studyCards:document.querySelectorAll("#lux-study-rpg-integrated .lux-study-rpg-card").length,controls:document.querySelectorAll("button,input,textarea,select").length,
      question:document.querySelector("[data-question-id]")?.dataset.questionId,
      links:[...document.querySelectorAll("a[href]")].map(a=>({href:a.getAttribute("href"),text:a.innerText.trim()})).filter(a=>a.href.startsWith("/")),
      brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.getBoundingClientRect().height).map(i=>i.getAttribute("src"))
    }));
    Object.assign(row,{title:snap.title,headings:snap.headings,controls:snap.controls,question:snap.question,links:snap.links,excerpt:snap.text.slice(0,700)});
    if(item.route==="/scholar"){
      const visual=await page.evaluate(()=>{
        const stage=document.querySelector(".lux-scholar-stage");
        const closet=document.querySelector(".lux-scholar-closet");
        const cards=document.querySelector(".lux-scholar-looks");
        return {
          stage:!!stage,closet:!!closet,cards:!!cards,
          backdrop:stage?getComputedStyle(stage).backgroundColor:"",
          sceneVisible:stage?getComputedStyle(stage.querySelector("img")).display!=="none":false,
          newRail:document.querySelectorAll(".lux-scholar-play-nav>a[data-lux-scholar-nav]").length,
          extraRailLinksHidden:[...document.querySelectorAll(".lux-scholar-play-nav>a:not([data-lux-scholar-nav])")].every(a=>getComputedStyle(a).display==="none"),
          oldHeaderHidden:!!document.querySelector(".paper-wash>header.sticky")&&getComputedStyle(document.querySelector(".paper-wash>header.sticky")).display==="none",
          noGardenOverlay:!document.querySelector(".lux-scholar-stage .lux-life-strip, .lux-scholar-stage .lux-hero-wash"),
          noOldWeeklyCard:[...document.querySelectorAll('a[href="/progress/weekly/"]:not(.lux-scholar-weekly-link)')].every(a=>a.getBoundingClientRect().height===0),
          columns:cards?getComputedStyle(cards).gridTemplateColumns.split(" ").filter(Boolean).length:0
        };
      });
      if(!visual.stage||!visual.closet||!visual.cards||!visual.sceneVisible||visual.newRail!==7||!visual.extraRailLinksHidden||!visual.oldHeaderHidden||!visual.noGardenOverlay||!visual.noOldWeeklyCard||visual.columns!==(1024<=1050?2:3))
        problem(row,"scholar-visual-regression",visual);
      const railStability=await page.evaluate(async()=>{
        const original=document.querySelector(".lux-scholar-play-nav");
        const owned=[...original?.querySelectorAll("a[data-lux-scholar-nav]")||[]];
        let disappearing=0,replaced=0,hiddenExtra=0;
        const check=()=>{
          const nav=document.querySelector(".lux-scholar-play-nav");
          if(nav!==original||!nav?.isConnected){replaced++;return;}
          const rect=nav.getBoundingClientRect(),style=getComputedStyle(nav);
          if(style.display==="none"||style.visibility==="hidden"||Number(style.opacity)<0.8||
             rect.width<200||rect.height<35||rect.bottom>innerHeight+2||rect.top<0)disappearing++;
          if(owned.some(a=>!a.isConnected||!nav.contains(a)))replaced++;
          if([...nav.querySelectorAll("a:not([data-lux-scholar-nav])")].some(a=>getComputedStyle(a).display!=="none"))hiddenExtra++;
        };
        for(let i=0;i<35;i++){check();await new Promise(resolve=>setTimeout(resolve,55));}
        return {replaced,disappearing,hiddenExtra,owned:owned.length};
      });
      if(railStability.replaced||railStability.disappearing||railStability.hiddenExtra||railStability.owned!==7)
        problem(row,"scholar-bottom-nav-flashing",railStability);
      for(const [tab,selector] of [["Collection",".lux-scholar-collection .lux-scholar-collectible"],["Achievements",".lux-scholar-achievements .lux-scholar-medal"],["Settings",".lux-scholar-settings .lux-scholar-weekly-link"]]){
        await page.getByRole("button",{name:tab,exact:true}).click();
        if(await page.locator(selector).count()===0)problem(row,"scholar-tab-layout-missing",{tab,selector});
      }
    }
    if(snap.text.trim().length<35)problem(row,"empty-page",snap.text);
    if(/^\/study\/?$/.test(item.route) && snap.studyCards!==6)problem(row,"missing-study-cards",{actual:snap.studyCards,expected:6});
    if(/^\/play\/?$/.test(item.route) && snap.playCards!==4)problem(row,"missing-play-halls",{actual:snap.playCards,expected:4});
    if(/Something went wrong|Cannot read properties|Page not found|This page could not be found/i.test(snap.text))problem(row,"error-page",snap.text.slice(0,500));
    if(row.errors.length)problem(row,"javascript",row.errors);
    if(row.badResponses.length)problem(row,"http",row.badResponses);
    if(snap.brokenImages.length)problem(row,"images",snap.brokenImages);
    if(item.route.startsWith("/play/")&&!["/play/runway-check","/play/dictation-dash","/play/sixty-blitz"].includes(item.route)&&snap.controls===0)problem(row,"game-no-controls",snap.text.slice(0,500));
   }catch(e){problem(row,"navigation",e.message);}
   results.push(row);console.log("SITE_ROUTE_QA "+JSON.stringify(row));await context.close();
  }
 }
 await Promise.all([worker(),worker(),worker()]);await browser.close();
}
const summary={base,pages:results.length,engines:["chromium","webkit"],failures:failures.length};
console.log("SITE_BROWSER_SUMMARY "+JSON.stringify(summary));console.log("SITE_BROWSER_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});fs.writeFileSync("test-results/site-browser-qa.json",JSON.stringify({summary,failures,results},null,2));
assert.equal(failures.length,0,JSON.stringify(failures));
