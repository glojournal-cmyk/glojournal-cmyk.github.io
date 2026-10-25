import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {replayDailyAnswerCredit} from '../assets/daily-answer-replay-20261021.js';
import {buildYear8DailyV2} from '../assets/year8-daily-v2-20261018.js';

test('all production JS and HTML references resolve to one wrapper and one core URL',()=>{
 const urls={};
 function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(['.git','node_modules','tests','test-results','scripts'].includes(e.name))continue;
  const path=dir+'/'+e.name;
  if(e.isDirectory())walk(path);
  else if(/\.(js|html)$/.test(path)&&!path.includes('__grok/install/')){
   for(const m of fs.readFileSync(path,'utf8').matchAll(/index-BLVOhKhN(\.core)?\.js\?[^"'`<>\s)]+/g)){
    (urls[m[1]?'core':'wrapper']??=new Set()).add(m[0]);
   }
  }
 }}walk('.');
 assert.equal(urls.wrapper.size,1,[...urls.wrapper].join('\n'));
 assert.equal(urls.core.size,1,[...urls.core].join('\n'));
});

test('duplicate callbacks and repeated correct attempts count one Daily question',()=>{
 const day='2026-10-25';
 const catalog=s=>Array.from({length:3},(_,i)=>({subject:s,year:8,topicId:s+'-y8-'+i,title:'Topic '+i,status:'enabled',enabled:40}));
 const initial={today:day,year:9,daily:[],dailyLog:{},topicStats:{},formalAttemptLog:[],reviews:{},dailyVocabByDay:{}};
 const plan=buildYear8DailyV2(initial,catalog);
 const task=plan.find(t=>t.id==='y8-standard-a');
 const events=Array.from({length:3},(_,i)=>({day,at:day+'T12:00:0'+i+'Z',attemptId:'duplicate-'+i,
  questionId:'same-question',correct:true,formal:true,repair:false,dailyTaskId:task.id,
  subject:task.assignedSubject,year:task.assignedYear,topicId:task.assignedTopic,mode:'standard'}));
 const state={...initial,daily:plan,formalAttemptLog:events};
 assert.equal(replayDailyAnswerCredit(state).daily.find(t=>t.id===task.id).progress,1);
 assert.equal(buildYear8DailyV2(state,catalog).find(t=>t.id===task.id).progress,1);
});

test('both deployed quiz markers accept French accent omission without accepting another word',()=>{
 const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
 for(const path of ['assets/quiz-session-rWAnuDVj.js','assets/quiz-session-y8fix-20260920.js']){
  const code=fs.readFileSync(path,'utf8');
  const mark=new Function('a','d','x',code.slice(code.indexOf('function A(e){'),code.indexOf('function V(e){'))+';return B;')(norm,norm,s=>s);
  const q={id:'accent-qa',format:'typed_exact',answer:{accepted:['un musée']}};
  assert.equal(mark(q,'  UN MUSEE  ','french').ok,true,path);
  assert.equal(mark(q,'une gare','french').ok,false,path);
 }
});
