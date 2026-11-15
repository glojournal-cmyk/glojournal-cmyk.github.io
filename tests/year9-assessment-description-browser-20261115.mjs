import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:8777';
const cases=[
  {id:'physics',title:'Physics',old:'Which physics term or rule best matches this description?'},
  {id:'biology',title:'Biology',old:'Which biological term best matches this description?'}
];
for(const [name,browserType] of [['Chromium',chromium],['iPad WebKit',webkit]]){
 const browser=await browserType.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block',timezoneId:'Europe/London'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const subject of cases){
   await page.goto(base+'/assessment/?subject='+subject.id,{waitUntil:'domcontentloaded'});
   await page.locator('#subject-bar [data-subject="'+subject.title+'"]').waitFor({timeout:20000});

   // Reproduce old stored iPad draft: all question prompts have lost descriptions.
   await page.evaluate(async ({id,old})=>{
     const response=await fetch('/assessment/banks/'+id+'.json');
     const bank=await response.json();
     const list=bank.groups.flatMap(group=>group.questions);
     const questions=list.slice(0,30).map(q=>({...q,prompt:old}));
     const key='lux-assessment-v1',state=JSON.parse(localStorage.getItem(key)||'{}');
     state.drafts||={};
     state.drafts[id]={version:2,questions,answers:{0:questions[0].options[0]},index:0,remaining:19*60,running:true};
     localStorage.setItem(key,JSON.stringify(state));
   },{id:subject.id,old:subject.old});

   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#subject-bar [data-subject="'+subject.title+'"]').click();
   await page.locator('#paper-list [data-paper="'+subject.id+'"]').click();
   await page.locator('#exam .question').waitFor({timeout:20000});
   const status=await page.locator('#exam').innerText();
   assert.match(status,/We repaired 30 incomplete questions/,name+' '+subject.id+': old draft not repaired');
   assert.match(status,/Question 1 of 30/,name+' '+subject.id+': question count');
   assert.equal(await page.locator('#choices .chosen').count(),0,name+': unfair old choice should be cleared');
   assert.ok((await page.locator('#clock').innerText()).startsWith('35:'),name+': the full 35-minute timer must be restored');

   for(let i=0;i<30;i++){
     const prompt=(await page.locator('#exam .question').innerText()).trim();
     assert.ok(prompt.includes('following description?'),name+' '+subject.id+' #'+(i+1)+': lost description');
     assert.ok(prompt.length>105,name+' '+subject.id+' #'+(i+1)+': no scientific clue');
     assert.equal(await page.locator('#choices button').count(),4,name+' '+subject.id+' #'+(i+1)+': invalid choices');
     if(i<29)await page.locator('#next').click();
   }
   assert.match(await page.locator('#next').innerText(),/Submit whole paper/);
   const oldAnswer=await page.evaluate(id=>JSON.parse(localStorage.getItem('lux-assessment-v1')).drafts[id].answers[0],subject.id);
   assert.equal(oldAnswer,undefined,'unfair answer must not be scored after repair');
   await page.locator('#exit').click();
   // Check that fresh papers (not just repaired stored drafts) use complete prompts.
   await page.evaluate(id=>{const k='lux-assessment-v1',s=JSON.parse(localStorage.getItem(k));delete s.drafts[id];localStorage.setItem(k,JSON.stringify(s));},subject.id);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#subject-bar [data-subject="'+subject.title+'"]').click();
   await page.locator('#paper-list [data-paper="'+subject.id+'"]').click();
   const newPrompt=(await page.locator('#exam .question').innerText()).trim();
   assert.ok(newPrompt.includes('following description?')&&newPrompt.length>105,name+' '+subject.id+': fresh question incomplete');
  }
  assert.deepEqual(errors,[],name+' unexpected browser errors');
  console.log(name+' Year 9 general Physics + Biology, 30 repaired iPad questions each + fresh paper: PASS');
  await context.close();
 }finally{await browser.close();}
}
