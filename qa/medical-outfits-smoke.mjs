import { chromium, webkit } from 'playwright';
import fs from 'node:fs';
const base='http://127.0.0.1:8787';
fs.mkdirSync('qa-artifacts',{recursive:true});
const catalog=JSON.parse(fs.readFileSync('art/doll/medical/manifest.json','utf8')).items;
const report=[];
async function run(kind,browserType,masteries){
  const browser=await browserType.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:1180,height:820},deviceScaleFactor:2,hasTouch:true});
  if(masteries!==0){
    await ctx.addInitScript((m)=>{
      const topicStats=Object.fromEntries(Array.from({length:m},(_,i)=>['medical-qa-topic-'+(i+1),{state:'mastered'}]));
      const data={state:{version:10,topicStats,unlockedOutfits:['day'],equippedOutfit:'day'},version:10};
      localStorage.setItem('lux-scholar-garden-v1',JSON.stringify(data));
    },masteries);
  }
  const page=await ctx.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  try{
    await page.goto(base+'/scholar/',{waitUntil:'domcontentloaded',timeout:35000});
    await page.getByRole('button',{name:'Wardrobe',exact:true}).first().click({timeout:30000}).catch(()=>{});
    await page.getByRole('button',{name:'Medical',exact:true}).waitFor({timeout:30000});
    await page.getByRole('button',{name:'Medical',exact:true}).click();
    await page.waitForTimeout(600);
    const images=page.locator('.lux-scholar-looks img[src*="/art/doll/medical/"]');
    const count=await images.count();
    if(count!==10) throw Error(kind+' at '+masteries+' Masteries rendered '+count+' Medical PNGs, expected 10');
    const decoded=await images.evaluateAll(async imgs=>{
      const list=[];
      for(const img of imgs){img.loading='eager';await img.decode().catch(()=>{});list.push({src:img.getAttribute('src'),ok:img.naturalWidth===941&&img.naturalHeight===1672})}
      return list;
    });
    if(decoded.some(x=>!x.ok))throw Error('A medical image failed to decode '+JSON.stringify(decoded.filter(x=>!x.ok)));
    const store=await page.evaluate(()=>{
      const s=window.__luxStore?.getState?.();
      return {has:!!s,unlocked:s?.unlockedOutfits??[],equipped:s?.equippedOutfit};
    });
    if(!store.has)throw Error('Shared outfit store missing');
    const unlocked=catalog.filter((x,i)=>store.unlocked.includes('medical-'+String(i+1).padStart(2,'0')+'-'+x.id)).length;
    const expected=masteries/10;
    if(unlocked!==expected)throw Error('Mastery '+masteries+': '+unlocked+' outfits unlocked, expected '+expected);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    if(overflow>5)throw Error('Horizontal iPad page overflow: '+overflow+'px');
    await page.screenshot({path:'qa-artifacts/'+kind+'-'+masteries+'-wardrobe.png',fullPage:true});
    if(masteries===10){
      await page.getByText('Forensic Pathologist',{exact:true}).first().click();
      await page.waitForFunction(()=>window.__luxStore?.getState?.().equippedOutfit==='medical-01-forensic-pathologist',{timeout:10000});
      await page.goto(base+'/',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__luxStore?.getState?.().equippedOutfit==='medical-01-forensic-pathologist',{timeout:20000});
      await page.waitForTimeout(600);
      const hero=page.locator('img[src*="/art/doll/medical/01-forensic-pathologist.png"]');
      if(await hero.count()<1) throw Error('Home avatar did not follow the chosen Medical outfit');
      await page.screenshot({path:'qa-artifacts/'+kind+'-10-home.png',fullPage:true});
      await page.goto(base+'/scholar/',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__luxStore?.getState?.().equippedOutfit==='medical-01-forensic-pathologist',{timeout:20000});
    }
    if(errors.length)throw Error('Runtime exceptions: '+errors.join(' | '));
    report.push({browser:kind,masteries,images:count,decoded:true,unlocked,overflowPx:overflow,status:'PASS'});
  }finally{await browser.close();}
}
for(const [kind,type] of [['chromium',chromium],['ipad-webkit',webkit]]){
 for(const mastery of [0,10,100])await run(kind,type,mastery);
}
fs.writeFileSync('qa-artifacts/medical-outfits-qa.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
