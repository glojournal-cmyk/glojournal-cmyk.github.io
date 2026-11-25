import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import path from 'node:path';

const playwright=createRequire(import.meta.url)('playwright');
const manifest=JSON.parse(await readFile('qa-staging/math-priority116-ten-question-scoring-rehearsal-20261125.json'));
function findRecord(node,revisionId){
  if(!node||typeof node!=='object')return;
  if(node.revisionId===revisionId&&node.options)return node;
  for(const value of Object.values(node)){
    const match=findRecord(value,revisionId);
    if(match)return match;
  }
}
const bank=await Promise.all(manifest.questions.map(async row=>{
  const bytes=await readFile(row.sourcePath);
  const sha=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  assert.equal(sha,row.sourceBlobSha,row.sourcePath);
  const q=findRecord(JSON.parse(bytes),row.revisionId);
  assert.equal(q.sourceId,row.sourceId);
  assert.equal(q.correctOptionId,row.correctOptionId);
  assert.equal(q.options.find(o=>o.id===q.correctOptionId).latex,row.correctAnswerLatex);
  // These IDs and approvals exist only inside an isolated browser context.
  return {...q,id:'fixture-'+q.sourceId,subject:'maths',year:9,
    topic:q.topicId.replace('math-y9-',''),grade:row.trialBand.slice(1),difficultyTarget:row.trialBand,
    academicQA:'approved',taughtVerified:true,mathDailyEnabled:true,renderRequired:true,
    templateId:row.skill,conceptFamilyId:row.skill,conceptFamilyEvidence:'test fixture',conceptFamilyReviewer:'test fixture',
    sourceRef:row.sourcePath,qaReviewer:'test fixture',mathsChecker:'test fixture',
    options:q.options.map(o=>({...o,text:o.latex,misconception:o.errorPath})),workedSolution:q.workedSolutionSteps};
}));
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/blank'){res.setHeader('content-type','text/html');res.end('<title>Fixture setup</title>');return;}
    const name=decodeURIComponent(url.pathname);
    const file=path.resolve('.','.'+name+(name.endsWith('/')?'index.html':''));
    assert.ok(file.startsWith(process.cwd()+path.sep));
    const bytes=await readFile(file);
    res.setHeader('content-type',({'.js':'text/javascript','.html':'text/html','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
    res.end(bytes);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const daily=origin+'/study/maths/daily/';
const planner='/assets/daily-tasks-v3-20261122.js';
const day='2026-11-25';
async function pageFor(context){
  const page=await context.newPage();
  await page.clock.setFixedTime(new Date(day+'T12:00:00Z'));
  return page;
}
async function exercise(browser,score){
  const context=await browser.newContext({timezoneId:'Europe/London'});
  try{
    await context.route(origin+planner,route=>route.fulfill({contentType:'text/javascript',body:
      'import * as implementation from "'+planner+'?original";export * from "'+planner+'?original";'+
      'export const V3_APPROVED={...implementation.V3_APPROVED,mathsRuntimeReady:true,maths:'+JSON.stringify(bank)+'};'}));
    let page=await pageFor(context);
    await page.goto(origin+'/blank');
    const task=await page.evaluate(async({planner,day})=>{
      const {buildDailyV3,V3_APPROVED}=await import(planner);
      const state={today:day,daily:[],dailyLog:{},formalAttemptLog:[],seenCorrect:{},reviews:{}};
      state.daily=buildDailyV3(state,[],V3_APPROVED);
      localStorage.setItem('lux-scholar-garden-v1',JSON.stringify({version:10,state}));
      return state.daily.find(t=>t.id==='maths-daily');
    },{planner,day});
    assert.equal(task.approvedQuestionIds?.length,10,JSON.stringify(task));
    for(const query of ['?recover=2026-11-24','?qa=1','?assisted=1']){
      await page.goto(daily+query);
      assert.ok(await page.locator('#formal-maths').isHidden());
    }
    await page.goto(daily);
    for(const [i,id] of task.approvedQuestionIds.entries()){
      await page.waitForFunction(id=>document.querySelector('#daily-question')?.dataset.questionId===id,id,{timeout:8000});
      const choices=page.locator('#daily-options button');
      assert.equal(await choices.count(),6);
      const correct=task.approvedCorrectOptionByQuestion[id];
      const wrong=correct==='A'?'B':'A';
      const selected=i<10-score?wrong:correct;
      const choose=(p,option)=>p.locator('#daily-options [data-option-id="'+option+'"]').click();
      let stale;
      if(i===0&&score===9){
        stale=await pageFor(context);
        await stale.goto(daily);
        await stale.locator('#daily-options button').first().waitFor();
      }
      await choose(page,selected);
      await page.locator('#daily-feedback li').first().waitFor();
      if(stale){
        await choose(stale,correct);
        await stale.waitForFunction(()=>document.querySelector('#daily-status').innerText==='Question 2 of 10');
        await stale.close();
      }
      if(i===2){
        await page.close();
        page=await pageFor(context);
        await page.goto(daily);
      }else await page.locator('#daily-next').click();
    }
    const expected=score>=9?'Counted into today’s Daily Tasks · '+score+'/10 correct.':'Finished · '+score+'/10 correct. The Daily target is 9/10.';
    await page.waitForFunction(s=>document.querySelector('#daily-status').textContent===s,expected);
    await page.reload();
    await page.waitForFunction(s=>document.querySelector('#daily-status').textContent===s,expected);
    // Exercise two simultaneous writes at the journal boundary on the same key.
    // Neither a late wrong choice nor a late correct choice can replace the winner.
    const replay=await page.evaluate(async({planner,day,task})=>{
      const {readMarkedAnswers,saveFirstMathsAnswer}=await import('/assets/durable-study-evidence-20261018.js');
      const {mathsEvidence,buildDailyV3,V3_APPROVED}=await import(planner);
      const answers=await readMarkedAnswers();
      const first=answers[0];
      const competing=await Promise.all(['A','B'].map(selectedOptionId=>
        saveFirstMathsAnswer({...first,selectedOptionId,correct:selectedOptionId===task.approvedCorrectOptionByQuestion[first.questionId]})));
      if(competing.some(row=>row.selectedOptionId!==first.selectedOptionId))throw Error('A saved answer changed');
      if((await readMarkedAnswers()).length!==10)throw Error('Duplicate answers in journal');
      const {state}=JSON.parse(localStorage.getItem('lux-scholar-garden-v1'));
      const home=buildDailyV3({...state,formalAttemptLog:answers},[],V3_APPROVED).find(t=>t.id==='maths-daily');
      return {count:answers.length,score:mathsEvidence(answers,day,task),done:home.done};
    },{planner,day,task});
    assert.equal(replay.count,10);
    assert.equal(replay.score.correct,score);
    assert.equal(replay.score.attemptFinished,true);
    assert.equal(replay.done,score>=9);
    console.log(score+'/10; ten durable first answers, correct Daily result after reopening');
  }finally{await context.close();}
}
try{
  for(const engine of (process.env.MATHS_BROWSER_ENGINES||'chromium').split(',')){
    const executablePath=engine==='chromium'?process.env.MATHS_CHROMIUM_PATH:undefined;
    const browser=await playwright[engine].launch({executablePath});
    try{
      const held=await browser.newContext();
      const page=await pageFor(held);
      await page.goto(daily);
      assert.ok(await page.locator('#formal-maths').isHidden());
      assert.ok(await page.locator('#maths-hold').isVisible());
      assert.equal(await page.evaluate(()=>localStorage.length),0);
      await held.close();
      for(const score of [8,9,10])await exercise(browser,score);
    }finally{await browser.close();}
  }
}finally{server.close();}
