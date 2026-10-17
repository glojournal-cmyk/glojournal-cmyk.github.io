import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const {webkit}=await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright/index.mjs');
const root=process.cwd(),bank=JSON.parse(fs.readFileSync('assessment/biology-nov2-20261017.json'));
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.pdf':'application/pdf','.webp':'image/webp','.png':'image/png'};
const server=createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(500).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port,errors=[],results=[];
let browser;
try{
  browser=await webkit.launch({headless:true,...(process.env.BIOLOGY_WEBKIT_EXECUTABLE?{executablePath:process.env.BIOLOGY_WEBKIT_EXECUTABLE}:{})});
  for(const [name,viewport] of [['desktop',{width:1280,height:900}],['ipad',{width:820,height:1180}]]){
    const context=await browser.newContext({viewport,isMobile:name==='ipad',hasTouch:name==='ipad'}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(name+': '+e.message));page.on('dialog',dialog=>dialog.accept());
    await page.goto(base+'/assessment/biology-nov2/practice/');
    await page.locator('#nov2-start').waitFor();
    await page.evaluate(()=>localStorage.setItem('bio-nov2-unrelated-guard','keep-me'));
    await page.locator('#nov2-count').selectOption('5');await page.locator('#nov2-start').click();
    const current=async()=>{const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('scholar-biology-nov2-practice-v1')));return {state,q:bank.questions.find(q=>q.id===state.ids[state.index])};};
    let {q}=await current();await page.locator('#nov2-answer').fill(q.modelAnswer);await page.getByRole('button',{name:'Check answer',exact:true}).click();
    assert.match(await page.locator('#nov2-feedback').innerText(),new RegExp(`${q.marks} / ${q.marks} marks`));
    await page.reload();await page.locator('#nov2-feedback').waitFor();assert.equal(await page.locator('#nov2-answer').inputValue(),q.modelAnswer);
    await page.locator('#nov2-next').click();await page.locator('#nov2-answer').fill('I do not know');await page.getByRole('button',{name:'Check answer',exact:true}).click();await page.locator('#nov2-next').click();
    await page.locator('#nov2-answer').fill('An unfinished answer');await page.reload();await page.locator('#nov2-answer').waitFor();assert.equal(await page.locator('#nov2-answer').inputValue(),'An unfinished answer');
    for(let i=0;i<3;i++){({q}=await current());await page.locator('#nov2-answer').fill(q.modelAnswer);await page.getByRole('button',{name:'Check answer',exact:true}).click();await page.locator('#nov2-next').click();}
    await page.getByRole('heading',{name:'Practice set complete',exact:true}).waitFor();
    await page.locator('#nov2-topic').selectOption('weak');await page.locator('#nov2-start').click();
    let before=await current();assert.equal(before.state.ids.length,1);({q}=before);
    await page.locator('#nov2-answer').fill(q.modelAnswer);await page.getByRole('button',{name:'Check answer',exact:true}).click();await page.locator('#nov2-next').click();
    assert.match(await page.locator('.nov2-result').innerText(),/100%/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('bio-nov2-unrelated-guard')),'keep-me');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'practice horizontal overflow');
    fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:`test-results/biology-nov2-${name}.png`,fullPage:true});
    await page.goto(base+'/assessment/?paper=biology-nov2');await page.locator('#response').waitFor();
    const draft=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lux-assessment-v1')).drafts['biology-nov2']);
    let d=await draft();assert.equal(d.questions.length,20);assert.equal(new Set(d.questions.map(q=>q.topic)).size,6);
    const firstIds=d.questions.map(q=>q.id);
    await page.locator('#response').fill(d.questions[0].modelAnswer);await page.locator('#next').click();await page.locator('#response').fill('Saved timed answer');
    await page.reload();await page.locator('#response').waitFor();assert.equal(await page.locator('#response').inputValue(),'Saved timed answer');
    for(let i=1;i<20;i++){d=await draft();assert.equal(d.index,i);await page.locator('#response').fill(d.questions[i].modelAnswer);assert.equal(await page.getByText('How to earn full marks',{exact:true}).count(),0,'answers shown before submission');await page.locator('#next').click();}
    await page.getByRole('heading',{name:'Passed · 100/100',exact:true}).waitFor();
    assert.equal(await page.getByText('How to earn full marks',{exact:true}).count(),20);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('lux-assessment-v1')));
    assert.equal(stored.results.at(-1).paperId,'biology-nov2');assert.equal(stored.results.at(-1).score,100);assert(!stored.drafts['biology-nov2']);
    await page.goto(base+'/assessment/?paper=biology-nov2');await page.locator('#response').waitFor();d=await draft();assert(d.questions.every(q=>!firstIds.includes(q.id)),'timed set repeats previous paper');
    await page.goto(base+'/assessment/?tab=tracker');await page.locator('#tracker-list').waitFor();assert.match(await page.locator('#tracker-list').innerText(),/2 November 2026/i);assert.match(await page.locator('#tracker-list').innerText(),/16 November 2026/i);
    const pdf=await page.request.get(base+'/assessment/biology-nov2/notes.pdf');assert(pdf.ok());assert.match((await pdf.body()).subarray(0,5).toString(),/%PDF/);
    await page.goto(base+'/study/biology/practise/');await page.locator('#biology-nov2-entry').waitFor({state:'visible'});assert.equal(await page.locator('#biology-nov2-entry a').first().getAttribute('href'),'/assessment/biology-nov2/practice/');
    results.push({name,practiceResume:true,draftResume:true,mistakeRetry:true,timedScore:100,balancedTopics:6,newPaperNoOverlap:true,trackerBothDates:true,notesAvailable:true,practiceEntry:true});
    await context.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({results,errors},null,2));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
