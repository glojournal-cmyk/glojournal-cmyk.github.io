import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
const base=process.env.QA_BASE_URL||"http://127.0.0.1:8765";
const docs=fs.readdirSync("content/topics").filter(f=>/^(fr|la)-y8-.*\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync(path.join("content/topics",f),"utf8")));
const browser=await chromium.launch({headless:true});
const results=[];
try{
for(const [subject,task,mode] of [["french","french-vocab","y8vocab"],["latin","latin-vocab","y8vocab"],["latin","y8-mastery","standard"]]){
const page=await browser.newPage();
page.setDefaultTimeout(8000);
const errors=[];page.on("pageerror",e=>errors.push(e.message));
const route="/study/"+subject+"/practise?daily=%221%22&locked=%221%22&year=%228%22&mode="+mode+"&task="+task;
await page.goto(base+route);
await page.waitForTimeout(4500);
await page.evaluate(async()=>{
  const mod=await import("/assets/index-BLVOhKhN.js?v=20261003-repeat1");
  window.qaStore=mod.C;
  window.qaEvents=[];
  window.addEventListener("scholar:question-answered",e=>window.qaEvents.push(e.detail));
});
const bank=docs.filter(d=>d.subject===subject).flatMap(d=>d.questions||[]);
const selectedWords=new Set();
for(let step=0;step<(mode==="y8vocab"?30:25);step++){
 if(mode!=="y8vocab"&&step===10){
   const next=await page.evaluate(({task,subject})=>{
     const state=window.qaStore.getState();
     const id=task==="y8-mastery"&&state.daily.find(t=>t.id===task)?.assignedSubject!==subject?"year8-long-review":task;
     return state.daily.find(t=>t.id===id)?.href;
   },{task,subject});
   assert.ok(next,"Second phase needs the saved task route");
   await page.goto(base+next);await page.waitForTimeout(2000);
   await page.evaluate(async()=>{
     const mod=await import("/assets/index-BLVOhKhN.js?v=20261003-repeat1");
     window.qaStore=mod.C;window.qaEvents=[];
     window.addEventListener("scholar:question-answered",e=>window.qaEvents.push(e.detail));
   });
 }
 await page.waitForTimeout(300);
 const visible=await page.evaluate(()=>({id:document.querySelector("[data-question-id]")?.dataset.questionId,body:document.body.innerText,prompt:[...document.querySelectorAll("p")].find(p=>p.classList.contains("font-display")&&p.classList.contains("text-2xl"))?.textContent||"",stimulus:[...document.querySelectorAll("p")].find(p=>p.classList.contains("rounded-lg")&&p.classList.contains("bg-sage/60"))?.textContent||""}));
 const clean=q=>{let prompt=String(q.prompt||"").trim(),label=String(q.task?.label||"").trim();if(label&&prompt.toLowerCase().startsWith(label.toLowerCase()))prompt=prompt.slice(label.length).replace(/^[\s—–:-]+/,"").trim();if(q.format==="mc_single")prompt=prompt.replace(/^write\b/i,"Choose");return prompt;};
 const candidates=bank.filter(q=>clean(q)===visible.prompt);
 const question=bank.find(q=>q.id===visible.id)||candidates.find(q=>String(q.stimulus?.text||"").trim()===visible.stimulus.trim())||candidates.find(q=>!q.stimulus?.text||q.stimulus.text===q.prompt)||candidates[0];
 assert.ok(question,"Could not identify question: "+JSON.stringify(visible)+" errors "+JSON.stringify(errors));
 const answer=question.answer?.accepted?.[0]||question.answer?.modelAnswer;
 assert.ok(typeof answer==="string","Unsupported test answer "+question.id+" "+JSON.stringify(question.answer));
 if(mode==="y8vocab"){
  assert.ok(question.conceptId?.startsWith((subject==="french"?"fr":"la")+"-y8-concept-vocab-"),"Daily vocabulary must not ask grammar/comprehension: "+question.id);
  assert.ok(!selectedWords.has(question.conceptId),"One word must not be asked twice in a set");selectedWords.add(question.conceptId);
 }
 console.log("DAILY_BROWSER_STEP "+JSON.stringify({subject,task,step,id:question.id,format:question.format,answer,prompt:visible.prompt,errors}));
 if(await page.getByRole("button",{name:answer,exact:true}).count())await page.getByRole("button",{name:answer,exact:true}).click();
 else if(question.format==="word_tiles"){
   const tiles=page.locator("button.min-h-10.rounded-md");
   const values=await tiles.allTextContents();
   const norm=s=>String(s).normalize("NFKD").replace(/[\u0300-\u036f\s]/g,"").toLowerCase();
   const target=norm(answer);
   const search=(remaining,used=[])=>{if(!remaining)return used;for(let i=0;i<values.length;i++){const tile=norm(values[i]);if(tile&&!used.includes(i)&&remaining.startsWith(tile)){const result=search(remaining.slice(tile.length),[...used,i]);if(result)return result;}}return null;};
   const order=search(target);assert.ok(order,"Cannot build tiles "+question.id);
   for(const index of order)await tiles.nth(index).click();
   await page.getByRole("button",{name:"Submit",exact:true}).click();
 }
 else{const field=page.locator("form input, form textarea").first();await field.fill(answer);await page.getByRole("button",{name:"Submit",exact:true}).click();}
 await page.waitForTimeout(350);
 const snapshot=await page.evaluate(()=>({events:window.qaEvents,day:window.qaStore.getState().today,daily:window.qaStore.getState().daily,ledger:window.qaStore.getState().dailyVocabByDay,attempts:window.qaStore.getState().dailyTopicAttemptsByDay,saved:JSON.parse(localStorage.getItem("lux-scholar-garden-v1")||"null")?.state}));
 const event=snapshot.events.at(-1);assert.equal(event?.correct,true,"Model answer should be accepted "+JSON.stringify(event));
 const creditedTask=task==="y8-mastery"&&subject==="latin"&&snapshot.daily.find(t=>t.id===task)?.assignedSubject!=="latin"?"year8-long-review":task;
 const live=snapshot.daily.find(t=>t.id===creditedTask);assert.ok(live?.progress>=step+1,task+" failed to count: "+JSON.stringify({live,event,ledger:snapshot.ledger,attempts:snapshot.attempts,errors}));
 results.push({subject,task,step,progress:live.progress,topic:event.topicId});
 await page.getByRole("button",{name:/^(Next question|Finish)$/}).click();
}
const savedTask=await page.evaluate(({task,subject})=>task==="y8-mastery"&&window.qaStore.getState().daily.find(t=>t.id===task)?.assignedSubject!==subject?"year8-long-review":task,{task,subject});
const before=await page.evaluate(task=>window.qaStore.getState().daily.find(t=>t.id===task)?.progress,savedTask);
await page.goto(base+"/");
await page.waitForTimeout(1000);
const after=await page.evaluate(async task=>{const m=await import("/assets/index-BLVOhKhN.js?v=20261003-repeat1");return m.C.getState().daily.find(t=>t.id===task)?.progress},savedTask);
assert.ok(after>=before,task+" lost progress returning home");
await page.reload();await page.waitForTimeout(1000);
const restored=await page.evaluate(async task=>{const m=await import("/assets/index-BLVOhKhN.js?v=20261003-repeat1");return m.C.getState().daily.find(t=>t.id===task)?.progress},savedTask);
assert.ok(restored>=before,task+" lost progress reloading");
await page.close();
}
console.log("DAILY_BROWSER_QA "+JSON.stringify(results));
}finally{await browser.close();}
