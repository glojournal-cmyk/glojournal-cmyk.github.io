import {missionFor,weekOf} from '../assets/star-map-state-20261004.js';
import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";

const root=process.cwd();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
 ".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",
 ".webp":"image/webp",".woff2":"font/woff2",".ico":"image/x-icon"};
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url,"http://localhost");
  let name=decodeURIComponent(url.pathname);
  if(name.endsWith("/"))name+="index.html";
  const target=path.resolve(root,"."+name);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  const stat=fs.statSync(target);
  const resolved=stat.isDirectory()?path.join(target,"index.html"):target;
  const data=fs.readFileSync(resolved);
  res.writeHead(200,{"content-type":mime[path.extname(resolved)]||"application/octet-stream",
   "cache-control":"no-store"});res.end(data);
 }catch{res.writeHead(404);res.end("Not Found")}
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base="http://127.0.0.1:"+server.address().port;
try{for(const launcher of [chromium,webkit]){const browser=await launcher.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:834,height:1112},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/play/weekly-boss/',{waitUntil:'networkidle'});await page.waitForSelector('.sm-theme-picker');
 const labels={french:'Moonlit Masquerade',chemistry:'Alchemist',biology:'Secret Cell',physics:'Lost Observatory'},week=weekOf(Date.now());
 for(const [theme,label] of Object.entries(labels)){
 await page.evaluate(async()=>{const {C:store}=await import('/assets/index-BLVOhKhN.js?v=20261011-vault2');store.setState({starMapChallenge:null})});
 await page.getByRole('button',{name:new RegExp(label)}).click();const tasks=missionFor(week,theme,2);
 if(theme==='french'){await page.getByRole('textbox',{name:'Your answer'}).fill('Saturday');await page.waitForLoadState('networkidle');await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.sm-task');assert.ok((await page.locator('.sm-challenge').getAttribute('class')).includes('sm-theme-french'));assert.equal(await page.getByRole('textbox',{name:'Your answer'}).inputValue(),'Saturday');}
 const xpBefore=await page.evaluate(async()=>{const {C:store}=await import('/assets/index-BLVOhKhN.js?v=20261011-vault2');return store.getState().xp});
 for(let i=0;i<8;i++){
 const q=tasks[i];await page.waitForSelector('.sm-task');
 if(q.tokens){for(const token of q.tokens)await page.locator('.sm-tokens').getByRole('button',{name:token,exact:true}).click();await page.getByRole('button',{name:'Check sequence',exact:true}).click()}
 else if(q.options)await page.locator('.sm-options').getByRole('button',{name:q.answer,exact:true}).click();
 else{await page.getByRole('textbox',{name:'Your answer'}).fill(q.answer??`${q.numeric} ${q.unit}`);await page.getByRole('button',{name:'Restore this fragment'}).click()}
 if(i===0){await page.waitForLoadState('networkidle');await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.sm-task');assert.equal(await page.locator('.sm-theme-picker button:disabled').count(),4)}
 if(i%2===1&&i<7){await page.waitForSelector('.sm-chapter-reveal');assert.equal(await page.locator('.sm-task').count(),0);await page.getByRole('button',{name:new RegExp('Continue to Chapter '+(Math.floor(i/2)+2))}).click()}
 }
 await page.waitForSelector('.sm-prize');const state=await page.evaluate(async()=>{const {C:store}=await import('/assets/index-BLVOhKhN.js?v=20261011-vault2');const s=store.getState();return {xp:s.xp,collection:Object.keys(s.starMapChallenge.collection).length}});assert.equal(state.xp,xpBefore);assert.equal(state.collection,1);assert.ok((await page.locator('.sm-field-notes').innerText()).includes('4 / 4 clues'));console.log(launcher.name(),theme,'8 mixed puzzles, reload, clues and one prize passed');
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.close();
 }finally{await browser.close()}}}finally{server.close()}
