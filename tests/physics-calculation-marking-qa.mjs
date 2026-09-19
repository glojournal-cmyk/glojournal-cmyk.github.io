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
const files=fs.readdirSync(root).filter(f=>/^phys-.*\.json$/.test(f)).sort();
const calcs=[];
for(const file of files){
 const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
 for(const q of doc.questions||[]) if(q.format==="calculation") calcs.push({...q,__file:file});
}
const failures=[], cases=[];
const compactUnit=u=>String(u??"").replace(/²/g,"2").replace(/³/g,"3").replace(/·/g," ").replace(/\s+/g,"").trim();
for(const q of calcs){
 const a=q.answer, unit=a.units?.[0]||"";
 const value=a.value;
 const canonical=unit?value+" "+unit:String(value);
 const r=B(q,canonical,"physics",{});
 cases.push({id:q.id,input:canonical,result:r});
 if(!r.ok) failures.push({type:"canonical-rejected",file:q.__file,id:q.id,input:canonical,answer:a,result:r});
 if(unit){
   const noUnit=B(q,String(value),"physics",{});
   if(noUnit.ok) failures.push({type:"missing-unit-accepted",file:q.__file,id:q.id,input:String(value),units:a.units,result:noUnit});
   for(const alias of a.units||[]){
     const ar=B(q,value+" "+alias,"physics",{});
     if(!ar.ok) failures.push({type:"listed-unit-alias-rejected",file:q.__file,id:q.id,input:value+" "+alias,alias,answer:a,result:ar});
   }
 }
 const comma=Number.isInteger(value)&&Math.abs(value)>=1000?value.toLocaleString("en-GB"):null;
 if(comma){
   const input=comma+(unit?" "+unit:"");
   const rr=B(q,input,"physics",{});
   if(!rr.ok) failures.push({type:"thousands-separator-rejected",file:q.__file,id:q.id,input,answer:a,result:rr});
 }
 if(value!==0 && Math.abs(value)>=1000){
   const exp=Math.floor(Math.log10(Math.abs(value))), coeff=value/(10**exp);
   const input=coeff+" x 10^"+exp+(unit?" "+unit:"");
   const rr=B(q,input,"physics",{});
   if(!rr.ok) failures.push({type:"scientific-notation-rejected",file:q.__file,id:q.id,input,answer:a,result:rr});
 }
}
const byType={};for(const f of failures)byType[f.type]=(byType[f.type]||0)+1;
const summary={calculations:calcs.length,failures:failures.length,byType};
console.log("PHYSICS_CALC_MARKING_SUMMARY "+JSON.stringify(summary));
console.log("PHYSICS_CALC_MARKING_FAILURES "+JSON.stringify(failures.slice(0,150)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/physics-calculation-marking.json",JSON.stringify({summary,failures,cases},null,2));
if(failures.length) process.exit(2);
