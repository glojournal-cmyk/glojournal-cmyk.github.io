// Visual regression: production finish() renders white result cards inside dark exam.
// Exercise Chromium and iPad WebKit at landscape and portrait viewports.
// Use a disposable browser session with synthetic answer data only.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8777';
const toRGB=s=>{const m=String(s).match(/rgba?\(([^)]+)\)/);if(!m)throw Error('Unsupported CSS color: '+s);return m[1].split(',').slice(0,3).map(Number)};
const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const [x,y]=[luminance(toRGB(a)),luminance(toRGB(b))].sort((a,b)=>b-a);return (x+.05)/(y+.05)};
for(const [engineName,engine] of [['Chromium',chromium],['iPad WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const viewport of [{width:1024,height:768},{width:834,height:1112}]){
   const ctx=await browser.newContext({viewport,serviceWorkers:'block',timezoneId:'Europe/London'});
   const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/assessment/?subject=physics',{waitUntil:'domcontentloaded'});
   await page.locator('#subject-bar [data-subject="Physics"]').waitFor({timeout:30000});
   await page.evaluate(async()=>{
     const bank=await (await fetch('/assessment/physics-nov26-20261113.json')).json();
     const all=bank.groups.flatMap(g=>g.questions);
     const q=all.find(q=>q.prompt.includes('trapped air is a good insulator'));
     if(!q||q.answer?.points?.length!==3)throw Error('Expected original 3-mark insulation question');
     const paper=PAPERS.find(p=>p.id==='physics-nov26');
     show('exam');
     finish(paper,{version:2,questions:[q],answers:{0:'Trapped air acts as a good insulator because particles are arranged in a gas.'},index:0,remaining:15,running:false,started:Date.now()});
   });
   await page.locator('#exam .entries > article.entry .feedback').last().waitFor({timeout:15000});
   const colors=await page.evaluate(()=>{
     const pick=selector=>{const el=document.querySelector(selector);if(!el)throw Error('No result element '+selector);const s=getComputedStyle(el);return {color:s.color,background:s.backgroundColor,text:el.textContent.trim().slice(0,120),size:parseFloat(s.fontSize)}};
     return {
      card:pick('#exam .entries > article.entry'),
      label:pick('#exam .entries > article.entry .tag'),
      question:pick('#exam .entries > article.entry > div > p:not(.feedback)'),
      answer:pick('#exam .entries > article.entry > div > p:nth-of-type(2)'),
      bold:pick('#exam .entries > article.entry > div > p b'),
      feedback:pick('#exam .entries > article.entry .feedback'),
      feedbackP:pick('#exam .entries > article.entry .feedback p'),
      feedbackMuted:pick('#exam .entries > article.entry .feedback p.muted')
     };
   });
   const light=colors.card.background;
   for(const k of ['card','label','question','answer','bold']){
     const r=ratio(colors[k].color,light);
     assert.ok(r>=7,engineName+' '+viewport.width+' low light-card contrast '+k+': '+r.toFixed(2)+' ('+colors[k].color+' on '+light+')');
   }
   for(const k of ['feedback','feedbackP','feedbackMuted']){
     const r=ratio(colors[k].color,colors.feedback.background);
     assert.ok(r>=4.5,engineName+' '+viewport.width+' low navy-feedback contrast '+k+': '+r.toFixed(2));
   }
   assert.match(colors.question.text,/Explain using particles why trapped air/);
   assert.deepEqual(errors,[],engineName+' '+viewport.width+' runtime errors');
   console.log('ASSESSMENT_RESULTS_CONTRAST_PASS',JSON.stringify({engine:engineName,viewport,lightCard:light,primaryContrast:Number(ratio(colors.question.color,light).toFixed(2)),statusContrast:Number(ratio(colors.label.color,light).toFixed(2)),feedbackContrast:Number(ratio(colors.feedbackP.color,colors.feedback.background).toFixed(2))}));
   await ctx.close();
  }
 }finally{await browser.close();}
}
