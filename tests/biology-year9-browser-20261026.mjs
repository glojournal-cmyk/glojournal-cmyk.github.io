import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
const root=process.cwd(),out='test-results/biology-year9-urgent';
fs.mkdirSync(out,{recursive:true});
const entry=fs.readFileSync('index.html','utf8').match(/\/assets\/index-BLVOhKhN\.js\?v=[^"']+/)?.[0];
assert.ok(entry);
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(p!==root&&!p.startsWith(root+path.sep))throw Error('outside root');
  const file=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;
  res.setHeader('content-type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const bank=JSON.parse(fs.readFileSync('content/topics/bio-y9-b1.json')).questions;
const day='2026-10-26',topic='bio-y9-b1',task='year9-light';
const correctIds=['bio-y9-b1-nucleus-14d84707fa-mc-definition','bio-y9-b1-nucleus-14d84707fa-mc-term','bio-y9-b1-eukaryotic-cell-57fcf093ee-typed','bio-y9-b1-cell-membrane-fae9fbdf9d-mc-term','bio-y9-b1-chloroplast-2c5a2a3188-mc-definition','bio-y9-b1-mitochondrion-bd24164e26-mc-term'];
const href='/study/biology/practise?daily=1&locked=1&year=9&mode=standard&task='+task+'&topic='+topic;
const report=[];
try{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1194,height:834},hasTouch:true,isMobile:engine===webkit});
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.clock.install({time:new Date(day+'T21:15:00Z')});
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   await page.evaluate(async({entry,day,topic,task,correctIds,href})=>{
    const {C:store}=await import(entry),s=store.getState();
    const bio={id:task,title:'Biology cell structure',planDate:day,assignedSubject:'biology',assignedYear:9,
     assignedTopic:topic,target:15,progress:12,href,verifiedCorrectIds:correctIds,verifiedCorrectSlots:12,
     verifiedCorrectAssignment:[day,task,'biology',topic,9,'standard',15].join('|')};
    const tasks=(s.daily||[]).filter(t=>t.id!==task).slice(0,9).map(t=>({...t,planDate:day,progress:t.target,done:true}));
    assertTen:if(tasks.length!==9)throw Error('Expected nine companion tasks, got '+tasks.length);
    tasks.push(bio);
    store.setState({year:8,today:day,daily:tasks,seenCorrect:{},reviews:{},
     formalAttemptLog:correctIds.map((questionId,i)=>({day,at:day+'T20:56:00Z',attemptId:'prior-'+i,
      dailyTaskId:task,subject:'biology',year:8,topicId:topic,questionId,correct:true,formal:true,repair:false,mode:'standard'})),
     dailyLog:{[day]:{date:day,tasks,done:9,total:10,complete:false}}});
   },{entry,day,topic,task,correctIds,href});
   await page.goto(origin+href,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   const answered=[];
   for(let i=0;i<3;i++){
    await page.waitForSelector('[data-question-id]');
    const id=await page.locator('[data-question-id]').last().getAttribute('data-question-id');
    assert.ok(!correctIds.includes(id),'Already-credited question was repeated: '+id);
    assert.ok(!answered.includes(id),'A new question repeated within the sitting');
    const q=bank.find(q=>q.id===id);assert.ok(q,'Unknown bank question '+id);
    const answer=q.answer?.accepted?.[0]||q.answer?.modelAnswer;
    assert.equal(typeof answer,'string','Test needs a usable model answer: '+id);
    const choice=page.getByRole('button',{name:answer,exact:true});
    if(await choice.count())await choice.click();
    else{
     await page.locator('form input,form textarea').first().fill(answer);
     await page.getByRole('button',{name:'Submit',exact:true}).click();
    }
    await page.getByText('Well done!',{exact:true}).waitFor();
    answered.push(id);
    await page.getByRole('button',{name:/^(Next question|Finish)$/}).click();
   }
   await page.waitForFunction(async({entry,task})=>{
    const {C}=await import(entry);return C.getState().daily.find(t=>t.id===task)?.progress===15;
   },{entry,task});
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__luxAppReady===true);
   const result=await page.evaluate(async({entry,task})=>{
    const {C}=await import(entry),s=C.getState();return{year:s.year,
     task:s.daily.find(t=>t.id===task),done:s.daily.filter(t=>t.progress>=t.target).length,
     events:s.formalAttemptLog.filter(e=>e.dailyTaskId===task).slice(-3),
     dailyLog:s.dailyLog[s.today]?.tasks.find(t=>t.id===task)};
   },{entry,task});
   assert.equal(result.task.progress,15);assert.equal(result.task.target,15);
   assert.equal(result.dailyLog.progress,15);assert.equal(result.done,10);
   assert.equal(result.year,8,'Do not change the learner global year selector');
   assert.ok(result.events.every(e=>e.year===9),'Actual answer journal must use Year 9');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:out+'/'+engine.name()+'-home.png',fullPage:true});
   report.push({browser:engine.name(),progress:result.task.progress,done:result.done,answered});
  }catch(error){
   await page.screenshot({path:out+'/'+engine.name()+'-failure.png',fullPage:true});
   fs.writeFileSync(out+'/'+engine.name()+'-failure.txt',String(error.stack)+'\n'+await page.locator('body').innerText()+'\n'+JSON.stringify(errors));
   throw error;
  }finally{await browser.close();}
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally{await new Promise(resolve=>server.close(resolve));}
