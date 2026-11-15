// Real browser/iPad smoke of every general Assessment paper.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8777';
const papers=[
 ['Physics','physics-nov26',25],['Biology','biology-nov2',20],
 ['Biology','biology-cell-structure',24],['French','french',25],
 ['Chemistry','chemistry',30],['Latin','latin-verbs',24],
 ['Latin','latin-creusa',24],['Latin','latin-conjugations',25],
 ['Biology','biology-school',30],['Latin','latin',30],
 ['Biology','biology',30],['Physics','physics',30],['English','english',30]
];
for(const [engineName,engine] of [['Chromium',chromium],['iPad WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1024,height:768},serviceWorkers:'block',timezoneId:'Europe/London'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [subject,id,total] of papers){
   await page.goto(base+'/assessment/?subject='+subject.toLowerCase(),{waitUntil:'domcontentloaded'});
   await page.locator('#subject-bar [data-subject="'+subject+'"]').waitFor({timeout:30000});
   await page.evaluate(id=>{
    const k='lux-assessment-v1',s=JSON.parse(localStorage.getItem(k)||'{}');
    s.drafts||={};delete s.drafts[id];localStorage.setItem(k,JSON.stringify(s));
   },id);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#subject-bar [data-subject="'+subject+'"]').click();
   await page.locator('#paper-list [data-paper="'+id+'"]').click();
   await page.locator('#exam .question').waitFor({timeout:30000});
   for(let i=0;i<Math.min(5,total);i++){
    const text=(await page.locator('#exam .question').innerText()).trim();
    assert.ok(text.length>=5,engineName+' '+id+' blank visible question '+(i+1));
    assert.ok(!/best matches this description\?$/i.test(text),engineName+' '+id+' malformed description');
    assert.match(await page.locator('#exam').innerText(),new RegExp('Question '+(i+1)+' of '+total),engineName+' '+id+' incorrect count');
    const numChoices=await page.locator('#choices button').count();
    assert.ok(numChoices===0||numChoices>=3,engineName+' '+id+' unavailable choices');
    if(i===0){
      if(numChoices)await page.locator('#choices button').last().click();
      else{await page.locator('#response').fill('Saved assessment QA draft response');}
    }
    if(i<4)await page.locator('#next').click();
   }
   const draft=await page.evaluate(id=>JSON.parse(localStorage.getItem('lux-assessment-v1')).drafts[id],id);
   assert.equal(draft.questions.length,total,engineName+' '+id+' wrong draft bank length');
   assert.ok(draft.answers[0],engineName+' '+id+' first response not saved');
   assert.equal(draft.index,4,engineName+' '+id+' navigation/draft index not persisted');
   assert.ok(draft.questions.every(q=>q.prompt?.trim()&&!/best matches this description\?$/i.test(q.prompt.trim())),engineName+' '+id+' unanswerable draft');
   await page.locator('#exit').click();
  }
  assert.deepEqual(errors,[],engineName+' assessment runtime JS errors');
  console.log(engineName+' ASSESSMENT_PAPERS_BROWSER_QA_PASS',JSON.stringify({papers:papers.length,checkedFirstFive:papers.length*5,draftsSaved:papers.length,viewport:'iPad landscape'}));
  await page.close();
 }finally{await browser.close();}
}
