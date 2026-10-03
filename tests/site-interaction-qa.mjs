import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium,webkit} from "playwright";
// Revision 20261003-assessment2 includes the composed Chemistry bank.
const base=process.env.QA_BASE_URL||"https://glojournal-cmyk.github.io";
const papers=[["Latin","latin-verbs"],["Latin","latin-creusa"],["Latin","latin-conjugations"],["Latin","latin"],["Chemistry","chemistry"],["French","french"],["Biology","biology-school"],["Biology","biology"],["Physics","physics"],["English","english"]];
const results=[];
for(const [engine,launcher]of [["chromium",chromium],["webkit",webkit]]){
 const browser=await launcher.launch();const context=await browser.newContext({viewport:{width:1024,height:1366},isMobile:engine==="webkit",hasTouch:true,timezoneId:"Europe/London"});
 const page=await context.newPage();page.setDefaultTimeout(12000);
 page.on("dialog",dialog=>dialog.accept());const errors=[];page.on("pageerror",e=>errors.push(e.stack||e.message));
 for(const [subject,id]of papers){
  await page.goto(base+"/assessment/");await page.locator('[data-subject="'+subject+'"]').click();await page.locator('[data-paper="'+id+'"]').click();
  await page.locator("#next").waitFor();
  const ids=await page.evaluate(id=>JSON.parse(localStorage.getItem("lux-assessment-v1")).drafts[id].questions.map(q=>q.id),id);
  assert.equal(new Set(ids).size,ids.length,id+" duplicate question");
  for(let i=0;i<ids.length;i++){
   const q=await page.evaluate(id=>{const d=JSON.parse(localStorage.getItem("lux-assessment-v1")).drafts[id];return d.questions[d.index];},id);
   const answer=q.answer.mode==="choice"?q.answer.accepted[0]:q.modelAnswer||q.answer.accepted[0];
   assert.equal(await page.locator("#exam .entry").count(),0,"Assessment must not reveal marking before submission");
   if(q.options?.length)await page.getByRole("button",{name:answer,exact:true}).click();
   else await page.locator("#response").fill(answer);
   await page.locator("#next").click();
   if(i===2){
    await page.reload();await page.locator('[data-subject="'+subject+'"]').click();await page.locator('[data-paper="'+id+'"]').click();await page.locator("#next").waitFor();
    const draft=await page.evaluate(id=>JSON.parse(localStorage.getItem("lux-assessment-v1")).drafts[id],id);
    assert.equal(draft.index,3);assert.ok(draft.answers[0],"Answer survives reload");
   }
  }
  await page.locator("#back-to-papers").waitFor();
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem("lux-assessment-v1")).results.at(-1));
  assert.equal(result.paperId,id);assert.equal(result.score,100,id+" official model score "+JSON.stringify(result));
  results.push({engine,paper:id,questions:ids.length,score:result.score,draftReload:true});
  console.log("INTERACTION_PAPER "+JSON.stringify(results.at(-1)));
 }
 await page.goto(base+"/garden");await page.getByRole("button",{name:"Water the garden",exact:true}).click();
 await page.getByRole("button",{name:"Watered today",exact:true}).waitFor();
 await page.reload();await page.getByRole("button",{name:"Watered today",exact:true}).waitFor();
 await page.goto(base+"/");await page.getByRole("button",{name:"Search revision topics",exact:false}).first().click();
 await page.getByPlaceholder("Vocabulary, cases, photosynthesis…").fill("Numbers Age");
 const resultButton=page.getByRole("dialog").getByRole("button").filter({hasText:/Numbers.*Age/i}).first();
 await resultButton.click();await page.waitForURL(/\/study\/french\/learn/);
 const searchURL=new URL(page.url()),rawTopic=searchURL.searchParams.get("topic");
 const topic=rawTopic?.replace(/^"|"$/g,"");assert.equal(topic,"fr-y8-s24-numbers-and-age");
 await page.waitForTimeout(1500);
 assert.equal(await page.getByRole("combobox",{name:"Study year"}).inputValue(),"8","Search selects the result's year");
 await page.goto(base+"/pet/");await page.locator('[data-pet-action="pat"]').waitFor();const startingBond=await page.evaluate(()=>JSON.parse(localStorage.getItem("lux-pet-companion-v1"))?.care?.bond||0);await page.locator('[data-pet-action="pat"]').click();
 const petBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem("lux-pet-companion-v1")));
 assert.equal(petBefore.care.bond,startingBond+1);await page.reload();
 assert.ok(await page.locator('[data-pet-action="pat"]').isDisabled(),"Pat limit survives reload");
 await page.goto(base+"/");await page.locator("#daily-save-button").waitFor();
 await page.evaluate(async()=>{
  const src=[...document.scripts].map(s=>s.src).find(s=>s.includes("/assets/index-BLVOhKhN.js"));
  const mod=await import(src),state=mod.C.getState();
  mod.C.setState({dailyTopicAttemptsByDay:{[state.today]:{"la-y8-stage-1-vocabulary":25}}});
 });
 // Let completion rewards settle before taking the complete backup snapshot.
 await page.waitForTimeout(500);
 const exported=await page.evaluate(async()=>{
  const src=[...document.scripts].map(s=>s.src).find(s=>s.includes("/assets/index-BLVOhKhN.js"));
  const mod=await import(src);return mod.C.getState().exportProgress();
 });
 const petAtExport=await page.evaluate(()=>JSON.parse(localStorage.getItem("lux-pet-companion-v1")));
 await page.locator("#daily-save-button").click();
 const manual=await page.evaluate(()=>JSON.parse(localStorage.getItem("lux-daily-manual-backup-v1")));
 assert.equal(JSON.parse(manual.data).assessmentProgress.results.length,papers.length);
 const saved=JSON.parse(exported);
 assert.equal(saved.assessmentProgress.results.length,papers.length);assert.equal(saved.petCompanion.care.bond,petAtExport.care.bond);
 await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator("#daily-backup-file").waitFor({state:"attached"});
 await page.locator("#daily-backup-file").setInputFiles({name:"qa-progress.json",mimeType:"application/json",buffer:Buffer.from(exported)});
 await page.waitForTimeout(2500);
 const restored=await page.evaluate(()=>({app:JSON.parse(localStorage.getItem("lux-scholar-garden-v1")).state,assessment:JSON.parse(localStorage.getItem("lux-assessment-v1")),pet:JSON.parse(localStorage.getItem("lux-pet-companion-v1"))}));
 assert.equal(restored.assessment.results.length,papers.length);assert.equal(restored.pet.care.bond,petAtExport.care.bond);
 assert.equal(restored.app.dailyTopicAttemptsByDay[saved.state.today]["la-y8-stage-1-vocabulary"],25);
 assert.equal(errors.length,0,JSON.stringify(errors));
 results.push({engine,gardenReload:true,searchTopic:true,petReload:true,fileBackupRoundtrip:true});
 await browser.close();
}
fs.mkdirSync("test-results",{recursive:true});fs.writeFileSync("test-results/site-interaction-qa.json",JSON.stringify(results,null,2));
console.log("SITE_INTERACTION_QA "+JSON.stringify(results));
