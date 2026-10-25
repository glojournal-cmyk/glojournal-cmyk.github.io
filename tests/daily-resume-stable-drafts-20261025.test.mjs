import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../assets/practice-drafts-20261004.js',import.meta.url),'utf8');
class Store {
  #data=new Map();
  getItem(key){return this.#data.get(key)??null}
  setItem(key,value){this.#data.set(key,String(value))}
  removeItem(key){this.#data.delete(key)}
}
const url=(task='year9-light',recover='')=>'https://glojournal-cmyk.github.io/study/biology/practise?daily=1&locked=1&year=9&mode=standard&topic=bio-y9-b1&task='+task+(recover?'&recover='+recover:'');
const setup=()=>{
 const browser={URL,Intl,Date,Promise,Map,Set,localStorage:new Store(),
   sessionStorage:new Store(),location:{href:url()},console};
 browser.globalThis=browser;
 runInNewContext(source,browser,{filename:'practice-drafts-20261004.js'});
 return browser;
};
const identify=(p,size,task='year9-light')=>p.LuxPracticeDrafts.key('biology',9,size,'bio-y9-b1',task,'standard');
const base=Array.from({length:15},(_,i)=>({id:'biology-'+i,topicId:'bio-y9-b1'}));
const data={base,rr:[],j:5,N:'',F:{},R:null,H:[],oe:[],G:null,q:5,ce:false,sessionLog:base.slice(0,5).map(q=>({questionId:q.id,correct:true,formal:true,repair:false}))};
test('Biology locked Daily uses SAME draft ID for 15, 10 and 1 questions remaining',()=>{
 const p=setup();
 assert.equal(identify(p,15),identify(p,10));
 assert.equal(identify(p,10),identify(p,1));
 const key=JSON.parse(identify(p,15));
 assert.equal(key[2],'locked-task');
 assert.equal(key[4],'year9-light');
});
test('different Daily task and different Recovery date cannot read one another\'s drafts',()=>{
 const p=setup(),today=identify(p,15);
 assert.notEqual(today,identify(p,10,'due-review'));
 p.location.href=url('year9-light','2026-10-23');
 const missed=identify(p,10);
 p.location.href=url('year9-light','2026-10-24');
 assert.notEqual(identify(p,10),missed);
 assert.notEqual(missed,today);
});
test('partly answered legacy 15-question Bio draft resumes after 5 correct leave 10 remaining',async()=>{
 const p=setup();
 const stable=identify(p,10);
 const old=JSON.parse(stable);old[2]=15;
 assert.equal(await p.LuxPracticeDrafts.save(JSON.stringify(old),data),true);
 const resumed=p.LuxPracticeDrafts.read(stable);
 assert.equal(resumed.j,5);
 assert.equal(resumed.base.length,15);
 assert.equal(resumed.sessionLog.length,5);
 assert.equal(resumed.sessionLog.filter(x=>x.correct).length,5);
 // On re-entry, a 10-question set must not replace the original 15-question sitting.
 assert.equal(identify(p,10),identify(p,15));
 const updated={...resumed,j:7,sessionLog:data.sessionLog.concat(
   base.slice(5,7).map(q=>({questionId:q.id,correct:true,formal:true,repair:false})))};
 assert.equal(await p.LuxPracticeDrafts.save(stable,updated),true);
 assert.equal(p.LuxPracticeDrafts.read(stable).j,7);
 assert.equal(p.LuxPracticeDrafts.read(stable).sessionLog.length,7);
});
test('ordinary nonlocked practice retains question count in draft key',()=>{
 const p=setup();
 p.location.href='https://glojournal-cmyk.github.io/study/biology/practise?year=9&mode=standard';
 assert.notEqual(identify(p,15),identify(p,10));
});
