import fs from "node:fs";
import path from "node:path";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^la-.*\.json$/.test(f)).sort();
const norm=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[’‘`]/g,"'").toLowerCase().replace(/[^a-z0-9' -]+/g," ").replace(/\s+/g," ").trim();
const corePrompt=p=>String(p??"").split(/\n/).map(x=>x.trim()).filter(Boolean).at(-1)||"";
const kind=v=>{
  const s=String(v??"").trim(), w=s.split(/\s+/).filter(Boolean);
  if(/^[-+]?\d+(?:[.,]\d+)?$/.test(s)) return "number";
  if(w.length===1) return "word";
  if(/[.!?]$/.test(s)||w.length>=5) return "sentence";
  return "phrase";
};
const isVocabMc=q=>{
  const p=String(q.prompt||"").toLowerCase();
  const topic=String(q.topic||"").toLowerCase();
  return q.format==="mc_single" && (
    /meaning|translate|latin entry|english meaning|exact latin|best english/.test(p) ||
    /vocab/.test(topic) ||
    /stage \d+ vocabulary/.test(topic)
  );
};
const report={files:files.length,questions:0,mc:0,vocabMc:0,exactDuplicates:[],duplicateOptions:[],categoryOutliers:[],lengthOutliers:[],denseConcepts:[],repeatedConcepts:[],byFile:{}};
const seen=new Map(), concepts=new Map();

for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  const qs=Array.isArray(doc.questions)?doc.questions:[];
  report.questions+=qs.length;
  const stat={questions:qs.length,mc:0,vocabMc:0,exactDuplicates:0,duplicateOptions:0,categoryOutliers:0,lengthOutliers:0};
  for(const q of qs){
    const ans=q.answer?.accepted?.[0]||q.answer?.modelAnswer||"";
    const exact=norm(q.prompt)+"||"+norm(ans);
    if(seen.has(exact)){report.exactDuplicates.push({file,id:q.id,other:seen.get(exact),prompt:q.prompt,answer:ans});stat.exactDuplicates++;}
    else seen.set(exact,{file,id:q.id});
    const concept=q.conceptId||[norm(corePrompt(q.prompt)),norm(ans)].sort().join("::");
    if(concept){if(!concepts.has(concept))concepts.set(concept,[]);concepts.get(concept).push({file,id:q.id,format:q.format,prompt:q.prompt,answer:ans});}
    if(q.format!=="mc_single") continue;
    report.mc++;stat.mc++;
    if(isVocabMc(q)){report.vocabMc++;stat.vocabMc++;}
    const opts=(q.options||[]).filter(Boolean), on=opts.map(norm);
    if(new Set(on).size!==on.length){report.duplicateOptions.push({file,id:q.id,prompt:q.prompt,options:opts,answer:ans});stat.duplicateOptions++;}
    const ci=opts.findIndex(o=>norm(o)===norm(ans));
    if(ci<0) continue;
    const cats=opts.map(kind), ck=cats[ci], same=cats.filter(x=>x===ck).length;
    if(same===1 && opts.length>=4 && isVocabMc(q)){
      report.categoryOutliers.push({file,id:q.id,prompt:q.prompt,answer:ans,options:opts,categories:cats});
      stat.categoryOutliers++;
    }
    const lens=opts.map(o=>norm(o).length), cl=lens[ci]||1, others=lens.filter((_,i)=>i!==ci).sort((a,b)=>a-b), med=others[Math.floor(others.length/2)]||1;
    if(isVocabMc(q)&&((cl>med*2.5&&cl-med>=8)||(med>cl*3&&med-cl>=8))){
      report.lengthOutliers.push({file,id:q.id,prompt:q.prompt,answer:ans,options:opts,lengths:lens});
      stat.lengthOutliers++;
    }
  }
  report.byFile[file]=stat;
}
for(const [concept,items] of concepts){
  if(items.length>=2) report.repeatedConcepts.push({concept,count:items.length,items:items.slice(0,12)});
  if(items.length>=5) report.denseConcepts.push({concept,count:items.length,items:items.slice(0,12)});
}
const score=x=>x.categoryOutliers*3+x.lengthOutliers*2+x.exactDuplicates*2+x.duplicateOptions*4;
const worst=Object.entries(report.byFile).sort((a,b)=>score(b[1])-score(a[1])).slice(0,20);
const summary={
  files:report.files,questions:report.questions,mc:report.mc,vocabMc:report.vocabMc,
  exactDuplicates:report.exactDuplicates.length,duplicateOptions:report.duplicateOptions.length,
  categoryOutliers:report.categoryOutliers.length,lengthOutliers:report.lengthOutliers.length,
  repeatedConcepts:report.repeatedConcepts.length,denseConcepts:report.denseConcepts.length,worst
};
console.log("LATIN_QUALITY_SUMMARY "+JSON.stringify(summary));
console.log("LATIN_CATEGORY_OUTLIERS "+JSON.stringify(report.categoryOutliers.slice(0,120)));
console.log("LATIN_LENGTH_OUTLIERS "+JSON.stringify(report.lengthOutliers.slice(0,80)));
console.log("LATIN_DUPLICATES "+JSON.stringify(report.exactDuplicates.slice(0,80)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/latin-content-quality.json",JSON.stringify(report,null,2));
if(report.duplicateOptions.length) process.exitCode=1;
