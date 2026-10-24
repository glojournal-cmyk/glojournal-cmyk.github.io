import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const {webkit,chromium}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright/index.mjs':'playwright');
const root=process.cwd(),bank=JSON.parse(fs.readFileSync('content/exam-practice/gcse-20261024.json'));
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=createServer((req,res)=>{let p=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const key='scholar-gcse-exam-practice-v1',errors=[];
try{
for(const [engine,name,viewport] of [[chromium,'desktop',{width:1280,height:900}],[webkit,'ipad',{width:820,height:1180}],[webkit,'phone',{width:390,height:844}]]){
 const browser=await engine.launch({headless:true});
 try{
 const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(name+': '+e.message));
 await page.goto(base+'/study/exam-practice/?subject=physics');await page.locator('#answer').waitFor();
 await page.evaluate(()=>localStorage.setItem('scholar-original-progress-guard','untouched'));
 for(const subject of Object.keys(bank.subjects)){
  await page.selectOption('#subject',subject);assert.equal(await page.locator('#question option').count(),12);
  for(const q of bank.questions.filter(q=>q.subject===subject)){
   await page.selectOption('#question',q.id);assert.match(await page.locator('h2').innerText(),new RegExp(q.topic.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
   await page.getByRole('button',{name:'Reveal mark scheme',exact:true}).click();assert.ok((await page.locator('#rubric').innerText()).includes(q.markScheme[0]));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} overflow ${q.id}`);
  }
 }
 await page.selectOption('#subject','physics');await page.selectOption('#question','physics-exam-20261024-01');
 await page.fill('#answer','Volume = 24 cm³. Density = 9000 kg/m³.');await page.selectOption('#score','4');
 await page.reload();await page.locator('#answer').waitFor();assert.equal(await page.inputValue('#answer'),'Volume = 24 cm³. Density = 9000 kg/m³.');assert.equal(await page.inputValue('#score'),'4');
 await page.fill('#answer','Edited working');assert.equal(await page.inputValue('#score'),'');
 assert.equal(await page.evaluate(()=>localStorage.getItem('scholar-original-progress-guard')),'untouched');
 const download=page.waitForEvent('download');await page.click('#export');const file=await download;const exported=JSON.parse(fs.readFileSync(await file.path(),'utf8'));assert.equal(exported.answers['physics-exam-20261024-01'].text,'Edited working');
 // Valid import does not overwrite existing work; invalid import is all-or-nothing.
 const incoming={version:1,answers:{'physics-exam-20261024-01':{text:'older copy',revealed:true,score:0},'physics-exam-20261024-02':{text:'restored',revealed:true,score:3}}};
 await page.setInputFiles('#import',{name:'answers.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Restored'));
 assert.equal(await page.inputValue('#answer'),'Edited working');await page.selectOption('#question','physics-exam-20261024-02');assert.equal(await page.inputValue('#answer'),'restored');
 await page.setInputFiles('#import',{name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"answers":{"no-such-id":{"text":"bad"}}}')});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('invalid'));assert.equal(await page.inputValue('#answer'),'restored');
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});await page.fill('#answer','Still here despite full storage');assert.match(await page.locator('#status').innerText(),/could not save/);assert.equal(await page.inputValue('#answer'),'Still here despite full storage');
 await page.screenshot({path:'/tmp/gcse-'+name+'.png',fullPage:true});
 console.log(`PASS ${name}: all 60 tasks render, no horizontal overflow, reveal/review, reload, edit invalidation, export/import, quota warning and original-state isolation.`);
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);
}finally{server.close();}
