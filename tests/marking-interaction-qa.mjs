import fs from "node:fs";
import path from "node:path";

const quizPath="assets/quiz-session-rWAnuDVj.js";
const corePath="assets/index-BLVOhKhN.core.js";
const quiz=fs.readFileSync(quizPath,"utf8");
const core=fs.readFileSync(corePath,"utf8");

function grab(src,startMarker,endMarker){
  const a=src.indexOf(startMarker), b=src.indexOf(endMarker,a);
  if(a<0||b<0) throw new Error("Cannot extract "+startMarker);
  return src.slice(a,b);
}
const scorerBlock=grab(quiz,"function A(e){","function V(e){");
function AS(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/æ/g,"ae").replace(/œ/g,"oe").toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim()}
function jS(e){return String(e??"").normalize("NFC").trim().replace(/\s+/g," ")}
function MS(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ']/g,"").replace(/\s+/g," ").trim()}
const scorer=new Function("a","d","x",scorerBlock+";return {A,j,M,normalizeFrenchAnswer,P,F,I,L,R,z,B};")(MS,AS,jS);
const {B,normalizeFrenchAnswer}=scorer;

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^(fr|la)-.*\.json$/.test(f)).sort();
const questions=[];
for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  const subject=file.startsWith("fr-")?"french":"latin";
  for(const q of doc.questions||[]) questions.push({...q,__file:file,__subject:subject});
}
const failures=[];
const stats={questions:questions.length,french:0,latin:0,acceptedVariants:0,unorderedSet:0,controlledTranslation:0,wordTiles:0,sequence:0};

const stripAccents=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const addSpaces=s=>"   "+String(s??"").replace(/\s+/g,"   ")+"   ";
const straight=s=>String(s??"").replace(/[’‘`]/g,"'");
const curly=s=>String(s??"").replace(/'/g,"’");
const isTextual=q=>!["matching","sorting","diagram_label"].includes(q.format)&&q.format!=="calculation";

for(const q of questions){
  stats[q.__subject]++;
  if(q.format==="unordered_set") stats.unorderedSet++;
  if(q.format==="controlled_translation") stats.controlledTranslation++;
  if(q.format==="word_tiles") stats.wordTiles++;
  if(q.format==="sequence") stats.sequence++;
  const accepted=[...(q.answer?.accepted||[])].filter(v=>typeof v==="string"&&v.trim());
  for(const ans of accepted){
    stats.acceptedVariants++;
    if(isTextual(q)){
      const r=B(q,ans,q.__subject,{});
      if(!r.ok) failures.push({type:"official-accepted-rejected",file:q.__file,id:q.id,format:q.format,subject:q.__subject,answer:ans,result:r});
    }
  }
  const first=accepted[0];
  if(!first) continue;

  if(q.__subject==="french"&&isTextual(q)){
    const variants=[
      ["uppercase",first.toUpperCase()],
      ["spaces",addSpaces(first)],
      ["straight-apostrophe",straight(first)],
      ["curly-apostrophe",curly(straight(first))],
      ["no-trailing-punctuation",String(first).replace(/[.!?]+$/,"")],
      ["accentless",stripAccents(first)]
    ];
    for(const [kind,value] of variants){
      if(!String(value).trim()) continue;
      const r=B(q,value,"french",{});
      if(!r.ok) failures.push({type:"french-normalization-false-negative",kind,file:q.__file,id:q.id,format:q.format,official:first,input:value,result:r});
    }
  }

  if(q.__subject==="latin"&&isTextual(q)){
    const variants=[
      ["uppercase",first.toUpperCase()],
      ["spaces",addSpaces(first)],
      ["macronless",stripAccents(first)]
    ];
    for(const [kind,value] of variants){
      const r=B(q,value,"latin",{});
      if(!r.ok) failures.push({type:"latin-normalization-false-negative",kind,file:q.__file,id:q.id,format:q.format,official:first,input:value,result:r});
    }
  }

  if(q.format==="word_tiles"&&Array.isArray(q.stimulus?.tiles)&&q.stimulus.tiles.length){
    const answer=(q.answer?.accepted?.[0]||q.answer?.modelAnswer||"");
    const compact=AS(answer.replace(/\s+/g,""));
    const tiles=[...q.stimulus.tiles];
    // If the stored tiles already form the official answer, structured marking must accept them.
    if(AS(tiles.join("").replace(/\s+/g,""))===compact){
      const r=B(q,"",q.__subject,{tiles});
      if(!r.ok) failures.push({type:"word-tiles-structured-rejected",file:q.__file,id:q.id,tiles,answer,result:r});
    }
  }

  if(q.format==="unordered_set"){
    const details={file:q.__file,id:q.id,prompt:q.prompt,answer:q.answer,stimulus:q.stimulus};
    const groups=q.answer?.requiredGroups||[];
    const values=groups.map(g=>g.alternatives?.[0]).filter(Boolean);
    if(values.length>=2){
      const forms=[
        values.join(", "),
        [...values].reverse().join(", "),
        values.join(" / "),
        values.join(" and ")
      ];
      for(const input of forms){
        const r=B(q,input,q.__subject,{});
        if(!r.ok) failures.push({type:"unordered-set-false-negative",input,details,result:r});
      }
      if(values.length>1){
        const missing=values.slice(0,-1).join(", ");
        const r=B(q,missing,q.__subject,{});
        if(r.ok) failures.push({type:"unordered-set-false-positive-missing-item",input:missing,details,result:r});
      }
    } else {
      failures.push({type:"unordered-set-schema-unhandled",details});
    }
  }

  if(q.__subject==="latin"&&q.format==="controlled_translation"&&first.split(/\s+/).length>=3){
    const targetEnglish=/translate into english|english meaning/i.test(String(q.prompt||"")+" "+String(q.task?.label||"")+" "+String(q.stimulus?.direction||""));
    const reversed=first.split(/\s+/).reverse().join(" ");
    const r=B(q,reversed,"latin",{});
    if(targetEnglish&&r.ok&&AS(reversed)!==AS(first)){
      failures.push({type:"latin-english-scramble-false-positive",file:q.__file,id:q.id,prompt:q.prompt,official:first,input:reversed,result:r});
    }
  }
}

const byType={};
for(const f of failures) byType[f.type]=(byType[f.type]||0)+1;
const summary={...stats,failures:failures.length,byType};
console.log("MARKING_INTERACTION_SUMMARY "+JSON.stringify(summary));
console.log("MARKING_INTERACTION_FAILURES "+JSON.stringify(failures.slice(0,150)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/marking-interaction-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length) process.exit(2);
