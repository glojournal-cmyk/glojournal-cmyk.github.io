import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import vm from "node:vm";

// Audit the actual deployed Practice B() scorer, not a parallel imitation.
const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
const a=quiz.indexOf("function A(e){"),b=quiz.indexOf("function V(e){",a);
assert.ok(a>=0&&b>a,"Practice marking block found");
function stripAccent(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/æ/g,"ae").replace(/œ/g,"oe").toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim()}
function preserved(s){return String(s??"").normalize("NFC").trim().replace(/\s+/g," ")}
function latinWords(s){return String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ']/g,"").replace(/\s+/g," ").trim()}
const {B}=new Function("a","d","x",quiz.slice(a,b)+";return {B};")(latinWords,stripAccent,preserved);

const topicFiles=fs.readdirSync("content/topics").filter(x=>/^chem-.*\.json$/.test(x)).sort();
const failures=[],seen=new Set(),formats={},summary={topicFiles:topicFiles.length,questions:0,acceptedVariants:0,assessmentQuestions:0,specialCases:0};
for(const file of topicFiles){
 const bank=JSON.parse(fs.readFileSync(path.join("content/topics",file),"utf8"));
 for(const q of bank.questions||[]){
  summary.questions++;
  formats[q.format]=(formats[q.format]||0)+1;
  if(seen.has(q.id))failures.push({type:"duplicate-chemistry-question-id",file,id:q.id});
  seen.add(q.id);
  // Some formats require a structured response rather than text.
  if(["matching","sorting","diagram_label","sequence","word_tiles","practical_design"].includes(q.format))continue;
  if(q.format==="calculation"){
   const value=q.answer?.value,units=q.answer?.units||[];
   if(!Number.isFinite(value))failures.push({type:"missing-numeric-answer",file,id:q.id});
   continue;
  }
  for(const answer of [...new Set([...(q.answer?.accepted||[]),q.answer?.modelAnswer].filter(s=>typeof s==="string"&&s.trim()))]){
   summary.acceptedVariants++;
   const grade=B(q,answer,"chemistry",{});
   if(!grade.ok)failures.push({type:"approved-answer-rejected",file,id:q.id,format:q.format,answer,grade});
  }
 }
}
const assessment=JSON.parse(fs.readFileSync("assessment/chemistry-school-1.json","utf8"));
const supplement=JSON.parse(fs.readFileSync("assessment/chemistry-school-style-20260927.json","utf8"));
summary.assessmentQuestions=assessment.questions.length+supplement.questions.length;
assert.equal(summary.assessmentQuestions,230,"Assessment question count");
const source=fs.readFileSync("assessment/app-v2.js","utf8");
const ctx=vm.createContext({window:{},state:{results:[]},save(){},grantWardrobe(){}});
vm.runInContext(source.slice(source.indexOf("function normal("),source.indexOf("async function start(")),ctx);
vm.runInContext(fs.readFileSync("assessment/marking-hotfix-v3.js","utf8"),ctx);
for(const q of [...assessment.questions,...supplement.questions]){
 const canonical=q.modelAnswer||q.answer?.accepted?.[0];
 if(!canonical)failures.push({type:"assessment-missing-model",id:q.id});
 else if(ctx.mark(q,canonical).credit<.999)failures.push({type:"assessment-model-rejected",id:q.id,answer:canonical,grade:ctx.mark(q,canonical)});
 const alternatives=(q.answer?.points||[]).flatMap(p=>p.alternatives||[]);
 for(const phrase of alternatives){
  summary.specialCases++;
  if(ctx.mark(q,phrase).matched<1)
   failures.push({type:"assessment-declared-alternative-rejected",id:q.id,answer:phrase,grade:ctx.mark(q,phrase)});
 }
 if(canonical&&ctx.mark(q,"NOT "+canonical).credit!==0)
   failures.push({type:"assessment-denial-accepted",id:q.id,answer:"NOT "+canonical,grade:ctx.mark(q,"NOT "+canonical)});
}
const negatives=[
 {id:"chem-aqa-20260930-001",value:"not strict mass order",expected:1},
 {id:"chem-aqa-20260930-009",value:"not an element",expected:1},
 {id:"chem-aqa-20260930-001",value:"not similar chemical properties",expected:0}
];
for(const c of negatives){
 const q=assessment.questions.find(x=>x.id===c.id),grade=ctx.mark(q,c.value);
 if(grade.matched!==c.expected)failures.push({type:"negative-semantic-regression",...c,grade});
}
summary.formats=formats;summary.failures=failures.length;
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/chemistry-answer-bank-qa.json",JSON.stringify({summary,failures},null,2));
console.log("CHEMISTRY_ANSWER_BANK_QA "+JSON.stringify(summary));
console.log("CHEMISTRY_ANSWER_BANK_FAILURES "+JSON.stringify(failures.slice(0,90)));
if(failures.length)process.exitCode=1;
