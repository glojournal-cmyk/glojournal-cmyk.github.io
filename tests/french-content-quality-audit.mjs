import fs from "node:fs";
import path from "node:path";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^fr-.*\.json$/.test(f)).sort();
const norm=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[’‘`]/g,"'").toLowerCase().replace(/[^a-z0-9' -]+/g," ").replace(/\s+/g," ").trim();
const stripInstruction=p=>String(p??"").split(/\n/).map(x=>x.trim()).filter(Boolean).at(-1)||"";
const type=v=>{
  const s=String(v??"").trim();
  if(/^[-+]?\d+(?:[.,]\d+)?$/.test(s)) return "number";
  const words=s.split(/\s+/).filter(Boolean);
  if(words.length===1) return "word";
  if(/[.!?]$/.test(s)||words.length>=5) return "sentence";
  return "phrase";
};
const report={files:files.length,questions:0,mc:0,exactDuplicates:[],duplicateOptions:[],categoryOutliers:[],lengthOutliers:[],reciprocalPairs:[],denseConcepts:[],byFile:{}};
const seenPrompt=new Map();
const concepts=new Map();

for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  const qs=Array.isArray(doc.questions)?doc.questions:[];
  report.questions+=qs.length;
  const stat={questions:qs.length,mc:0,exactDuplicates:0,duplicateOptions:0,categoryOutliers:0,lengthOutliers:0};
  for(const q of qs){
    const ans=q.answer?.accepted?.[0]||q.answer?.modelAnswer||"";
    const core=stripInstruction(q.prompt);
    const promptKey=norm(q.prompt);
    const exactKey=promptKey+"||"+norm(ans);
    if(seenPrompt.has(exactKey)){
      report.exactDuplicates.push({file,id:q.id,other:seenPrompt.get(exactKey),prompt:q.prompt,answer:ans});
      stat.exactDuplicates++;
    } else seenPrompt.set(exactKey,{file,id:q.id});

    if(core&&ans){
      const ck=[norm(core),norm(ans)].sort().join("::");
      if(ck && ck!=="::"){
        if(!concepts.has(ck)) concepts.set(ck,[]);
        concepts.get(ck).push({file,id:q.id,format:q.format,prompt:q.prompt,answer:ans});
      }
    }

    if(q.format!=="mc_single") continue;
    report.mc++; stat.mc++;
    const opts=(q.options||[]).filter(Boolean);
    const on=opts.map(norm);
    if(new Set(on).size!==on.length){
      report.duplicateOptions.push({file,id:q.id,prompt:q.prompt,options:opts,answer:ans});
      stat.duplicateOptions++;
    }
    const cats=opts.map(type);
    const correctIdx=opts.findIndex(o=>norm(o)===norm(ans));
    if(correctIdx>=0){
      const correctCat=cats[correctIdx];
      const same=cats.filter(c=>c===correctCat).length;
      if(same===1 && opts.length>=4){
        report.categoryOutliers.push({file,id:q.id,prompt:q.prompt,answer:ans,options:opts,categories:cats});
        stat.categoryOutliers++;
      }
      const lengths=opts.map(o=>norm(o).length);
      const cl=lengths[correctIdx]||1;
      const others=lengths.filter((_,i)=>i!==correctIdx).filter(Boolean).sort((a,b)=>a-b);
      const med=others[Math.floor(others.length/2)]||1;
      if((cl>med*2.5&&cl-med>=10)||(med>cl*3&&med-cl>=10)){
        report.lengthOutliers.push({file,id:q.id,prompt:q.prompt,answer:ans,options:opts,lengths});
        stat.lengthOutliers++;
      }
    }
  }
  report.byFile[file]=stat;
}
for(const [concept,items] of concepts){
  if(items.length>=2){
    const dirs=new Set(items.map(x=>norm(stripInstruction(x.prompt))+"=>"+norm(x.answer)));
    if(dirs.size>=2) report.reciprocalPairs.push({concept,items});
  }
  if(items.length>=5) report.denseConcepts.push({concept,count:items.length,items:items.slice(0,10)});
}
const worst=Object.entries(report.byFile).sort((a,b)=>{
  const score=x=>x.categoryOutliers*3+x.lengthOutliers*2+x.exactDuplicates*2+x.duplicateOptions*4;
  return score(b[1])-score(a[1]);
}).slice(0,15);
const summary={
  files:report.files,questions:report.questions,mc:report.mc,
  exactDuplicates:report.exactDuplicates.length,
  duplicateOptions:report.duplicateOptions.length,
  categoryOutliers:report.categoryOutliers.length,
  lengthOutliers:report.lengthOutliers.length,
  reciprocalConcepts:report.reciprocalPairs.length,
  denseConcepts:report.denseConcepts.length,
  worst
};
console.log("FRENCH_QUALITY_SUMMARY "+JSON.stringify(summary));
console.log("FRENCH_CATEGORY_OUTLIERS "+JSON.stringify(report.categoryOutliers.slice(0,120)));
console.log("FRENCH_LENGTH_OUTLIERS "+JSON.stringify(report.lengthOutliers.slice(0,80)));
console.log("FRENCH_DUPLICATES "+JSON.stringify(report.exactDuplicates.slice(0,80)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/french-content-quality.json",JSON.stringify(report,null,2));
if(report.duplicateOptions.length) process.exitCode=1;
