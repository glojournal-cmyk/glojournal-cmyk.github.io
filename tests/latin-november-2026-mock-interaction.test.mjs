import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {LATIN_BOOKLET_RECORDS} from "../assets/latin-vocabulary-booklet-20261023.js";
import {SYLLABUS, GRAMMAR, PRACTICE, MOCK, validateMock} from "../study/latin/november-2026/exam-data.js";

const client=readFileSync(new URL("../study/latin/november-2026/exam.js",import.meta.url),"utf8")
  .replace(/^import .*?;\r?\n/gm,"");

function appHarness(){
  const handlers={},elements=new Map();
  const app={innerHTML:"",addEventListener(type,fn){handlers[type]=fn;}};
  const tabs=["overview","vocabulary","grammar","practice","mock"].map(tab=>({
    dataset:{tab},attrs:{},listeners:{},
    addEventListener(type,fn){this.listeners[type]=fn;},
    setAttribute(name,value){this.attrs[name]=value;}
  }));
  let timerCallback=null;
  const doc={
    getElementById(id){
      if(id==="app")return app;
      if(!app.innerHTML.includes('id="'+id+'"'))return null;
      if(!elements.has(id))elements.set(id,{textContent:"",scrollIntoView(){}});
      return elements.get(id);
    },
    querySelectorAll(selector){
      assert.equal(selector,"[data-tab]");
      return tabs;
    }
  };
  const ctx=vm.createContext({
    document:doc,window:{confirm(){return true},print(){}},
    LATIN_BOOKLET_RECORDS,SYLLABUS,GRAMMAR,PRACTICE,MOCK,validateMock,
    setInterval(callback){timerCallback=callback;return 1;},
    clearInterval(){timerCallback=null;},
    Date,Math,Set,Map,Number,String,Object,Array
  });
  vm.runInContext(client,ctx,{filename:"exam.js",timeout:1500});
  return {
    app,tabs,doc,
    tab(name){tabs.find(x=>x.dataset.tab===name).listeners.click();},
    click(name){handlers.click({target:{closest:()=>({dataset:{action:name}})}});},
    mark(q,i,checked){handlers.change({target:{dataset:{award:q+"-"+i},checked}});},
    tick(){timerCallback?.()},
    text(id){return doc.getElementById(id)?.textContent}
  };
}
test("Live UI mock: 50-minute paper conceals answers until finished",()=>{
  const h=appHarness();h.tab("mock");
  assert.match(h.app.innerHTML,/50-minute/);
  assert.doesNotMatch(h.app.innerHTML,/data-award=/);
  h.click("mock-start");
  assert.match(h.app.innerHTML,/Time left: /);
  assert.match(h.app.innerHTML,/data-response="A1"/);
  assert.match(h.app.innerHTML,/data-response="C9"/);
  assert.doesNotMatch(h.app.innerHTML,/Model answer/);
  assert.doesNotMatch(h.app.innerHTML,/data-award=/);
  h.click("mock-submit");
  assert.match(h.app.innerHTML,/Model answer/);
  const checks=[...h.app.innerHTML.matchAll(/data-award="([A-C]\d+-\d+)"/g)].map(m=>m[1]);
  assert.equal(checks.length,75);
  assert.equal(new Set(checks).size,75);
  assert.equal(h.text("score-text"),"0/75 marks awarded");
  for(const sec of MOCK.sections)for(const q of sec.questions)for(let i=0;i<q.points.length;i++)h.mark(q.id,i,true);
  assert.equal(h.text("score-text"),"75/75 marks awarded");
  assert.equal(h.text("score-section-A"),"11");
  assert.equal(h.text("score-section-B"),"14");
  assert.equal(h.text("score-section-C"),"50");
  h.mark("C9",4,false);
  assert.equal(h.text("score-text"),"74/75 marks awarded");
  assert.equal(h.text("score-section-C"),"49");
  h.click("mock-reset");h.click("mock-start");h.click("mock-submit");
  assert.equal(h.text("score-text"),"0/75 marks awarded");
});
test("All pre-mock tabs remain independent",()=>{
  const h=appHarness();
  h.tab("vocabulary");assert.match(h.app.innerHTML,/130 dictionary entries/);
  h.tab("grammar");assert.match(h.app.innerHTML,/Grammar practice/);
  h.tab("practice");assert.match(h.app.innerHTML,/Translation & comprehension/);
  h.tab("mock");assert.match(h.app.innerHTML,/revised paper/);
});
