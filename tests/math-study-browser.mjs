import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
const root=process.cwd();
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.json':'application/json','.css':'text/css;charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=createServer((req,res)=>{try{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.endsWith('/'))pathname+='index.html';
  const full=path.resolve(root,'.'+pathname);
  if(!full.startsWith(root+path.sep)||!fs.existsSync(full)||!fs.statSync(full).isFile()){res.writeHead(404);res.end('Missing '+pathname);return;}
  res.writeHead(200,{'content-type':types[path.extname(full)]||'application/octet-stream'});fs.createReadStream(full).pipe(res);
}catch(e){res.writeHead(500);res.end(String(e));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
fs.mkdirSync('test-results/maths-study',{recursive:true});
let checks=0;
try{
  for(const engine of [chromium,webkit]){
    const browser=await engine.launch({headless:true});
    try{
      for(const viewport of [{width:1024,height:768},{width:390,height:844}]){
        const context=await browser.newContext({viewport});
        // Verify the page reads actual persisted selections, not painted-in
        // placeholder art or a second hydrated Scholar application.
        await context.addInitScript(()=>{
          localStorage.setItem('lux-scholar-garden-v1',JSON.stringify({state:{equippedOutfit:'medical-01-forensic-pathologist'}}));
          localStorage.setItem('lux-pet-companion-v1',JSON.stringify({species:'moss-hornling',petLevels:{'moss-hornling':2}}));
        });
        const page=await context.newPage();
        const errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.goto(base+'/study/maths/',{waitUntil:'domcontentloaded'});
        await page.locator('.maths-topic-card').first().waitFor({timeout:15000});
        assert.equal(await page.locator('.maths-topic-card').count(),5);
        assert.equal(await page.locator('.maths-nav a').count(),7);
        await page.waitForFunction(()=>{
          const outfit=document.querySelector('.maths-scholar'),pet=document.querySelector('.maths-pet');
          return outfit?.complete&&outfit.naturalWidth>0&&!outfit.hidden&&
            pet?.complete&&pet.naturalWidth>0&&!pet.hidden;
        },null,{timeout:15000});
        assert.match(await page.locator('.maths-scholar').getAttribute('src'),/medical\/01-forensic-pathologist\.png/);
        assert.match(await page.locator('.maths-pet').getAttribute('src'),/level-2/);
        checks+=2;
        await page.screenshot({path:'test-results/maths-study/'+engine.name()+'-'+viewport.width+'-topics.png'});
        await page.locator('.maths-topic-card').first().click();
        await page.locator('.maths-option-grid a').first().waitFor({timeout:15000});
        assert.equal(await page.locator('.maths-option-grid a').count(),3);
        checks++;
        await page.locator('.maths-option-grid a').first().click();
        await page.locator('.maths-worked').first().waitFor({timeout:15000});
        assert.ok(await page.locator('.maths-worked').count()>0);
        checks++;
        await page.screenshot({path:'test-results/maths-study/'+engine.name()+'-'+viewport.width+'-learn.png'});
        await page.goto(base+'/study/maths/practise/?topic=math-y9-indices');
        await page.locator('.maths-mode').first().waitFor({timeout:15000});
        assert.equal(await page.locator('.maths-mode').count(),4);
        checks++;
        await page.locator('.maths-mode').nth(1).click();
        await page.locator('.maths-mode').first().waitFor({timeout:15000});
        assert.ok(await page.locator('.maths-mode').count()>0,'Topic practise opens skill selection');
        checks++;
        await page.goto(base+'/study/maths/practise/?topic=math-y9-indices&mode=quick&start=1');
        await page.locator('#math-answer').waitFor({timeout:15000});
        assert.equal(await page.locator('[data-qindex]').count(),10);
        await page.locator('#math-answer').fill('x^5');
        await page.locator('#maths-reveal-btn').click();
        await page.locator('[data-review="yes"]').waitFor({timeout:15000});
        await page.locator('[data-review="yes"]').click();
        checks+=2;
        await page.screenshot({path:'test-results/maths-study/'+engine.name()+'-'+viewport.width+'-practice.png'});
        await page.goto(base+'/study/maths/progress/?topic=math-y9-indices');
        await page.locator('.maths-progress-summary').waitFor({timeout:15000});
        assert.ok((await page.locator('.maths-progress-summary').innerText()).includes('1 / 100'));
        checks++;
        await page.screenshot({path:'test-results/maths-study/'+engine.name()+'-'+viewport.width+'-progress.png'});
        assert.deepEqual(errors,[],engine.name()+' uncaught app errors: '+errors.join(' / '));
        checks++;
        await context.close();
      }
    }finally{await browser.close();}
  }
}finally{server.close();}
console.log('MATHS BROWSER QA PASS',checks,'checks across Chromium/WebKit desktop and mobile');
