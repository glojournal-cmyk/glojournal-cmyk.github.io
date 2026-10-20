import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const src=p=>fs.readFileSync(p,"utf8");
const between=(source,start,end)=>{const i=source.indexOf(start),j=source.indexOf(end,i);assert(i>=0&&j>i,"missing "+start);return source.slice(i,j)};
const quiz=src("assets/quiz-session-y8fix-20260920.js");
const legacy=src("assets/quiz-session-rWAnuDVj.js");
const MS=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ']/g,"").replace(/\s+/g," ").trim();
const AS=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/æ/g,"ae").replace(/œ/g,"oe").toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();
const JS=x=>String(x??"").normalize("NFC").trim().replace(/\s+/g," ");
const block=between(quiz,"function A(e){","function V(e){");
const L= new Function("a","d","x",block+";return {I,B};")(MS,AS,JS);
const LL=new Function("a","d","x",between(legacy,"function A(e){","function V(e){")+";return {I,B};")(MS,AS,JS);
const A=new Function(between(src("assessment/app-v2.js"),"function acceptedForMarking(e){","function textWords(x){")+";return acceptedForMarking;")();
const q=(format,answer,prompt="Translate ONE meaning.")=>({id:"test-equivalent",format,prompt,answer:{accepted:[answer]}});
const cases=[
 ["slash single words",q("typed_equivalent","happy / glad"),"glad","english",true],
 ["first alternative",q("typed_equivalent","happy / glad"),"happy","english",true],
 ["or alternative",q("typed_equivalent","happy or glad"),"glad","english",true],
 ["spaced French alternatives",q("typed_equivalent","relaxant / reposant"),"reposant","french",true],
 ["long French example alternatives",q("typed_equivalent","Je bois de l’eau. / Je mange des frites."),"Je mange des frites.","french",true],
 ["French independent clauses",q("typed_equivalent","Tu aimes… ? / Vous aimez… ?"),"Vous aimez… ?","french",true],
 ["French shared prefix",q("controlled_translation","Je joue au badminton / au basket / au tennis"),"Je joue au basket","french",true],
 ["reject bare fragment",q("controlled_translation","Je joue au badminton / au basket"),"au basket","french",false],
 ["female adjective ending",q("controlled_translation","trop épicé / trop épicée"),"trop épicée","french",true],
 ["possessives",q("controlled_translation","mon père / ma mère"),"ma mère","french",true],
 ["shared suffix",q("controlled_translation","he / she gets up"),"he gets up","english",true],
 ["shared article suffix",q("controlled_translation","le / la prof"),"le prof","french",true],
 ["two full prepositional phrases",q("controlled_translation","à la mer / au bord de la mer"),"au bord de la mer","french",true],
 ["shared adjective and noun",q("controlled_translation","dans un petit / grand appartement"),"dans un grand appartement","french",true],
 ["shared English adjective and noun",q("controlled_translation","in a small / large flat"),"in a small flat","english",true],
 ["science divided formula preserved",{...q("typed_short","total distance / total time"),id:"phys-y8-ratio-test"},"total distance","physics",false],
 ["compact vocab synonym", {...q("typed_equivalent","happy/glad"),id:"fr-y8-test"},"glad","english",true],
 ["reject typo",q("typed_equivalent","happy / glad"),"gladd","english",false],
 ["reject abbreviated unit as alternative",q("typed_equivalent","m/s"),"m","physics",false],
 ["reject informal pronoun fragment",q("typed_equivalent","he/she/it had gone"),"she","english",false],
 ["explicit two required",q("typed_equivalent","happy / glad","Give two separate meanings."),"happy","english",false],
];
for(const [name,question,answer,subject,expected] of cases) {
 for (const [where,grader] of [["daily",L],["other practice",LL]]) {
  const result=grader.B(question,answer,subject,{});
  assert.equal(result.ok,expected,name+" in "+where+": "+JSON.stringify(result));
 }
 const actual=A(question);
 if(name==="reject abbreviated unit as alternative")assert.deepEqual(actual,["m/s"]);
 if(name==="reject informal pronoun fragment")assert.deepEqual(actual,["he/she/it had gone"]);
 if(name==="explicit two required")assert.deepEqual(actual,["happy / glad"]);
 if(expected)assert(actual.some(s=>MS(s)===MS(answer)),name+" assessment accepted list");
}
const formats={};
const flagged=[];
const counts={topics:0,questions:0,spacedSlashQuestions:0,expandedQuestions:0,unresolvedQuestions:0};
for(const file of fs.readdirSync("content/topics").filter(f=>f.endsWith(".json"))) {
 const doc=JSON.parse(src(path.join("content/topics",file)));
 counts.topics++;
 for(const question of doc.questions||[]) {
  counts.questions++;
  const accepted=[...(question.answer?.accepted||[]),question.answer?.modelAnswer||""].filter(v=>typeof v==="string");
  if(!accepted.some(v=>/\s+\/\s+/.test(v)))continue;
  counts.spacedSlashQuestions++;
  formats[question.format]=(formats[question.format]||0)+1;
  const result=L.I(question);
  if(result.length>new Set(accepted).size)counts.expandedQuestions++;
  else if(["typed_equivalent","typed_short","typed_exact","controlled_translation"].includes(question.format)){
   counts.unresolvedQuestions++;
   if(flagged.length<160)flagged.push({file,id:question.id,format:question.format,accepted:accepted.slice(0,2),prompt:String(question.prompt).slice(0,80)});
  }
 }
}
for(const file of fs.readdirSync("assessment").filter(f=>f.endsWith(".json"))) {
 const doc=JSON.parse(src(path.join("assessment",file)));
 for(const question of doc.questions||[]) {
  if(!["exact_or_equivalent","typed_equivalent"].includes(question.answer?.mode))continue;
  const accepted=(question.answer.accepted||[]).filter(v=>/\s+\/\s+/.test(v));
  if(accepted.length&&!A(question).some(v=>accepted.every(c=>c!==v)))flagged.push({file,id:question.id,issue:"Assessment explicit slash alternatives not expanded"});
 }
}
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/answer-alternatives-audit-20261020.json",JSON.stringify({counts,formats,flagged},null,2));
console.log("ANSWER_ALTERNATIVES_AUDIT "+JSON.stringify({counts,formats,sample:flagged.slice(0,10)}));
console.log("ANSWER_ALTERNATIVES_FLAGS "+JSON.stringify(flagged));
console.log("PASS "+cases.length+" regression cases across Daily/Practice/Assessment candidate lists");
