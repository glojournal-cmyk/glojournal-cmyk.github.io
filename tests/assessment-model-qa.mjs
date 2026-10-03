import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source=fs.readFileSync("assessment/app-v2.js","utf8");
const context=vm.createContext({Math,Set,String,Object,RegExp,Number,window:{},state:{results:[]},save(){},grantWardrobe(){}});
vm.runInContext(source.slice(source.indexOf("function normal("),source.indexOf("async function start(")),context);
vm.runInContext(fs.readFileSync("assessment/marking-hotfix-v3.js","utf8"),context);
const paths=["french-school-1.json","chemistry-school-1.json","chemistry-school-style-20260927.json","latin-verbs-1.json","latin-creusa-1.json","latin-conjugations-20260928.json","biology-school-20260927.json",...["latin","biology","physics","english"].map(s=>"banks/"+s+".json")];
let count=0;const failures=[];
for(const path of paths){
 const bank=JSON.parse(fs.readFileSync("assessment/"+path,"utf8"));
 const questions=bank.groups?bank.groups.flatMap(g=>g.questions):bank.questions;
 for(const q of questions){
  const model=q.modelAnswer||q.answer?.accepted?.[0];if(!model)continue;count++;
  const marked=context.mark(q,model);
  if(marked.credit<.999)failures.push({path,id:q.id,model,marked});
  if(context.mark(q,"").credit!==0)failures.push({path,id:q.id,type:"blank-scored"});
 }
}
console.log("ASSESSMENT_MODEL_QA "+JSON.stringify({papers:10,banks:paths.length,questions:count,failures}));
assert.equal(failures.length,0,JSON.stringify(failures));
