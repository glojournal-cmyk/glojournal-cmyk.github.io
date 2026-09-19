import fs from "node:fs";
import path from "node:path";

const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
function grab(src,a,b){const i=src.indexOf(a),j=src.indexOf(b,i);if(i<0||j<0)throw new Error("extract failed");return src.slice(i,j)}
const block=grab(quiz,"function A(e){","function V(e){");
function AS(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/æ/g,"ae").replace(/œ/g,"oe").toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim()}
function jS(e){return String(e??"").normalize("NFC").trim().replace(/\s+/g," ")}
function MS(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ']/g,"").replace(/\s+/g," ").trim()}
const {B}=new Function("a","d","x",block+";return {B};")(MS,AS,jS);

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^bio-y9-b\d+\.json$/.test(f)).sort();
const calcs=[];
for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  for(const q of doc.questions||[]) if(q.format==="calculation"&&q.status==="enabled") calcs.push({...q,__file:file});
}
const failures=[];
for(const q of calcs){
  const a=q.answer||{}, value=a.value, units=a.units||[];
  if(typeof value!=="number"||!Number.isFinite(value)){failures.push({type:"bad-value",file:q.__file,id:q.id});continue}
  const canonical=units.length?value+" "+units[0]:String(value);
  const r=B(q,canonical,"biology",{});
  if(!r.ok) failures.push({type:"canonical-rejected",file:q.__file,id:q.id,input:canonical,answer:a,result:r});
  for(const alias of units){
    const input=value+" "+alias, ar=B(q,input,"biology",{});
    if(!ar.ok) failures.push({type:"listed-unit-alias-rejected",file:q.__file,id:q.id,input,alias,answer:a,result:ar});
  }
  if(value<0){
    const unicodeMinus=(String(value).replace("-","−"))+(units.length?" "+units[0]:"");
    const ur=B(q,unicodeMinus,"biology",{});
    if(!ur.ok) failures.push({type:"unicode-minus-rejected",file:q.__file,id:q.id,input:unicodeMinus,result:ur});
  }
}
const byType={};for(const f of failures)byType[f.type]=(byType[f.type]||0)+1;
const summary={calculations:calcs.length,failures:failures.length,byType};
console.log("BIOLOGY_CALC_MARKING_SUMMARY "+JSON.stringify(summary));
console.log("BIOLOGY_CALC_MARKING_FAILURES "+JSON.stringify(failures.slice(0,100)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/biology-calculation-marking.json",JSON.stringify({summary,failures},null,2));
if(failures.length) process.exit(2);
