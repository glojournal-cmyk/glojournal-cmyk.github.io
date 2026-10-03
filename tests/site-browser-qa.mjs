import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";
const base=process.env.QA_BASE_URL||"https://glojournal-cmyk.github.io";
const routes=["/assessment","/garden","/","/pet","/play/case-locker","/play/dictation-dash","/play/element-match","/play/error-hunter","/play/force-match","/play/forma-forge","/play","/play/manuscript","/play/mot-match","/play/organelle-match","/play/pe-circuit","/play/phrase-mosaic","/play/runway-check","/play/sentence-mosaic","/play/sixty-blitz","/play/verbum-match","/play/weekly-boss","/play/word-match","/preview","/scholar","/session/french-vocab","/session/french-writing","/study/biology","/study/biology/learn","/study/biology/play","/study/biology/practise","/study/biology/progress","/study/biology/school-notes","/study/chemistry","/study/chemistry/learn","/study/chemistry/play","/study/chemistry/practise","/study/chemistry/progress","/study/english","/study/english/learn","/study/english/play","/study/english/practise","/study/english/progress","/study/french","/study/french/learn","/study/french/play","/study/french/practise","/study/french/progress","/study","/study/latin","/study/latin/learn","/study/latin/play","/study/latin/practise","/study/latin/progress","/study/physics","/study/physics/learn","/study/physics/play","/study/physics/practise","/study/physics/progress"];
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
   page.on("pageerror",e=>row.errors.push(e.message));
   page.on("response",r=>{if(r.status()>=400&&r.url().startsWith(base))row.badResponses.push({status:r.status(),url:r.url().slice(base.length)});});
   try{
    if(item.year){
     await page.goto(base+"/",{waitUntil:"domcontentloaded"});
     await page.waitForTimeout(1800);
     await page.evaluate(async year=>{
      const src=[...document.scripts].map(s=>s.src).find(s=>s.includes("/assets/index-BLVOhKhN.js"));
      const mod=await import(src);mod.C.getState().setYear(year);
     },item.year);
     row.errors=[];row.badResponses=[];
    }
    const response=await page.goto(base+item.route,{waitUntil:"domcontentloaded",timeout:45000});row.status=response?.status();
    await page.waitForTimeout(4500);
    const snap=await page.evaluate(()=>({
      title:document.title,headings:[...document.querySelectorAll("h1,h2,h3")].filter(e=>e.getBoundingClientRect().height).map(e=>e.textContent),
      text:(document.querySelector("main")||document.body).innerText,controls:document.querySelectorAll("button,input,textarea,select").length,
      question:document.querySelector("[data-question-id]")?.dataset.questionId,
      links:[...document.querySelectorAll("a[href]")].map(a=>({href:a.getAttribute("href"),text:a.innerText.trim()})).filter(a=>a.href.startsWith("/")),
      brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.getBoundingClientRect().height).map(i=>i.getAttribute("src"))
    }));
    Object.assign(row,{title:snap.title,headings:snap.headings,controls:snap.controls,question:snap.question,links:snap.links,excerpt:snap.text.slice(0,700)});
    if(snap.text.trim().length<35)problem(row,"empty-page",snap.text);
    if(/Something went wrong|Cannot read properties|Page not found|This page could not be found/i.test(snap.text))problem(row,"error-page",snap.text.slice(0,500));
    if(row.errors.length)problem(row,"javascript",row.errors);
    if(row.badResponses.length)problem(row,"http",row.badResponses);
    if(snap.brokenImages.length)problem(row,"images",snap.brokenImages);
    if(item.route.startsWith("/play/")&&snap.controls===0)problem(row,"game-no-controls",snap.text.slice(0,500));
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
