import fs from "node:fs";
import path from "node:path";

const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
function grab(src,a,b){const i=src.indexOf(a),j=src.indexOf(b,i);if(i<0||j<0)throw new Error("extract failed");return src.slice(i,j)}
const block=grab(quiz,"function A(e){","function V(e){");
function AS(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/æ/g,"ae").replace(/œ/g,"oe").toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim()}
function jS(e){return String(e??"").normalize("NFC").trim().replace(/\s+/g," ")}
function MS(e){return String(e??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ']/g,"").replace(/\s+/g," ").trim()}
const {B}=new Function("a","d","x",block+";return {B};")(MS,AS,jS);

const elements=new Set(["H","He","Li","Be","B","C","N","O","F","Ne","Na","Mg","Al","Si","P","S","Cl","Ar","K","Ca","Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr","Rb","Sr","Ag","Sn","I","Ba","Pt","Au","Hg","Pb"]);
function formulaLike(s){
  const x=String(s??"").trim();
  if(!x||x.length>60||/[a-z]{3,}/.test(x)) return false;
  const stripped=x.replace(/[0-9₀-₉\s+\-()=><→⇌.·^]/g,"");
  if(!stripped) return false;
  const toks=stripped.match(/[A-Z][a-z]?/g);
  return !!toks&&toks.join("")===stripped&&toks.every(t=>elements.has(t));
}
const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^chem-.*\.json$/.test(f)).sort();
const candidates=[],failures=[];
for(const file of files){
 const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
 for(const q of doc.questions||[]){
   if(q.format==="mc_single") continue;
   const meta=(q.prompt||"")+" "+(q.task?.label||"")+" "+(q.task?.instruction||"")+" "+(q.stimulus?.text||"");
   if(!/formula|symbol|equation|ion|charge|oxidation state/i.test(meta)) continue;
   for(const ans of q.answer?.accepted||[]){
     if(!formulaLike(ans)) continue;
     candidates.push({file,id:q.id,format:q.format,prompt:q.prompt,answer:ans});
     const lower=ans.replace(/[A-Za-z]/g,ch=>ch.toLowerCase());
     if(lower===ans) continue;
     const rr=B(q,lower,"chemistry",{});
     if(rr.ok) failures.push({type:"wrong-case-accepted",file,id:q.id,format:q.format,prompt:q.prompt,official:ans,input:lower,result:rr});
   }
 }
}
const summary={candidates:candidates.length,failures:failures.length};
console.log("CHEMISTRY_NOTATION_SUMMARY "+JSON.stringify(summary));
console.log("CHEMISTRY_NOTATION_CANDIDATES "+JSON.stringify(candidates.slice(0,100)));
console.log("CHEMISTRY_NOTATION_FAILURES "+JSON.stringify(failures.slice(0,100)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/chemistry-notation-qa.json",JSON.stringify({summary,candidates,failures},null,2));
if(failures.length) process.exit(2);
