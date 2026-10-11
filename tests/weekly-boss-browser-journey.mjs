import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright';
const root=process.cwd(),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.webp':'image/webp'};
const server=createServer((req,res)=>{
 try{const u=new URL(req.url,'http://localhost'),name=decodeURIComponent(u.pathname).replace(/\/$/,'/index.html'),file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep))throw Error('outside root');
  const data=fs.readFileSync(file);res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data)
 }catch{res.writeHead(404);res.end('Not Found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [name,launcher] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await launcher.launch();
  try{
   const context=await browser.newContext({viewport:{width:name==='webkit'?834:1280,height:name==='webkit'?1112:800},hasTouch:name==='webkit',locale:'en-GB',timezoneId:'Europe/London'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/play/weekly-boss/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('.sm-theme-picker button')?.textContent?.includes('Observatory'),null,{timeout:30000});
   assert.equal(await page.locator('.sm-theme-picker button').count(),4);
   for(const [theme,label] of [['french','Moonlit Masquerade'],['chemistry','Alchemist'],['biology','Secret Cell'],['physics','Lost Observatory']]){
    await page.getByRole('button',{name:new RegExp(label)}).click();
    await page.waitForFunction(theme=>!!document.querySelector('.sm-challenge.sm-theme-'+theme),theme);
    const image=page.locator('.sm-theme-illustration');
    await image.evaluate(img=>img.decode());
    assert.ok(await image.evaluate(img=>img.naturalWidth>0),'illustration '+theme);
    assert.ok((await page.locator('.sm-reward-preview').getAttribute('src')).includes(theme));
   }
   await page.getByRole('button',{name:/Moonlit Masquerade/}).click();
   // First answer locks the selection, and a reload restores it.
   const answer=await page.locator('.sm-options button').first().textContent();
   await page.locator('.sm-options button').first().click();
   await page.waitForTimeout(300);
   assert.ok((await page.locator('.sm-theme-picker button:disabled').count())===4);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForSelector('.sm-theme-picker button',{timeout:30000});
   assert.ok((await page.locator('.sm-challenge').getAttribute('class')).includes('sm-theme-french'));
   assert.equal(await page.locator('.sm-theme-picker button:disabled').count(),4);
   // Finish the second French challenge to unlock the Chapter Cleared screen.
   await page.locator('.sm-options button').first().click();
   await page.waitForSelector('.sm-chapter-reveal',{timeout:8000});
   assert.ok((await page.locator('.sm-chapter-reveal').innerText()).includes('Chapter 1 cleared'));
   assert.equal(await page.locator('.sm-task').count(),0,'the next question must wait behind Continue');
   await page.getByRole('button',{name:/Continue to Chapter 2/}).click();
   await page.waitForSelector('.sm-task',{timeout:8000});
   assert.equal(await page.locator('.sm-chapter-reveal').count(),0);
   assert.equal(errors.length,0,name+': '+errors.join(' | '));
   results.push({engine:name,themeButtons:4,artwork:true,themeLockedAfterAnswer:true,reload:true,chapterReveal:true,continueChapter:true});
   await context.close();
  }finally{await browser.close()}
 }
 console.log('WEEKLY_BOSS_BROWSER_JOURNEY '+JSON.stringify(results));
}finally{await new Promise(resolve=>server.close(resolve))}
