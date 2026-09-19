import fs from "node:fs";
import path from "node:path";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^phys-.*\.json$/.test(f)).sort();
const norm=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const report={files:files.length,questions:0,formats:{},mc:0,calculations:0,duplicateIds:[],duplicateOptions:[],missingCorrectOption:[],calculationSchema:[],unitSets:{},conceptCounts:{},byFile:{}};
const ids=new Map();

for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  const qs=doc.questions||[];
  const stat={questions:qs.length,formats:{},calculations:0,mc:0};
  report.questions+=qs.length;
  for(const q of qs){
    report.formats[q.format]=(report.formats[q.format]||0)+1;
    stat.formats[q.format]=(stat.formats[q.format]||0)+1;
    if(ids.has(q.id)) report.duplicateIds.push({id:q.id,file,other:ids.get(q.id)});
    else ids.set(q.id,file);
    if(q.conceptId) report.conceptCounts[q.conceptId]=(report.conceptCounts[q.conceptId]||0)+1;

    if(q.format==="mc_single"){
      report.mc++; stat.mc++;
      const opts=(q.options||[]).filter(Boolean), on=opts.map(norm);
      if(new Set(on).size!==on.length) report.duplicateOptions.push({file,id:q.id,prompt:q.prompt,options:opts});
      const accepted=q.answer?.accepted?.[0];
      if(accepted&&!opts.some(o=>norm(o)===norm(accepted))) report.missingCorrectOption.push({file,id:q.id,prompt:q.prompt,accepted,options:opts});
    }
    if(q.format==="calculation"){
      report.calculations++; stat.calculations++;
      const a=q.answer||{};
      const units=Array.isArray(a.units)?a.units.filter(Boolean):[];
      const issue=[];
      if(typeof a.value!=="number"||!Number.isFinite(a.value)) issue.push("missing numeric value");
      if(!a.modelAnswer) issue.push("missing modelAnswer");
      if(!Array.isArray(a.markPoints)||!a.markPoints.length) issue.push("missing markPoints");
      if(typeof a.tolerance!=="number"||a.tolerance<0) issue.push("missing/invalid tolerance");
      if(issue.length) report.calculationSchema.push({file,id:q.id,prompt:q.prompt,issue,answer:a});
      const key=units.join(" | ")||"(no unit)";
      report.unitSets[key]=(report.unitSets[key]||0)+1;
    }
  }
  report.byFile[file]=stat;
}
const repeatedConcepts=Object.entries(report.conceptCounts).filter(([,n])=>n>1).length;
const maxConceptMultiplicity=Math.max(0,...Object.values(report.conceptCounts));
const summary={
  files:report.files,questions:report.questions,formats:report.formats,mc:report.mc,calculations:report.calculations,
  duplicateIds:report.duplicateIds.length,duplicateOptions:report.duplicateOptions.length,
  missingCorrectOption:report.missingCorrectOption.length,calculationSchemaIssues:report.calculationSchema.length,
  repeatedConcepts,maxConceptMultiplicity,unitSets:report.unitSets
};
console.log("PHYSICS_QUALITY_SUMMARY "+JSON.stringify(summary));
console.log("PHYSICS_CALC_SCHEMA "+JSON.stringify(report.calculationSchema.slice(0,100)));
console.log("PHYSICS_BAD_MC "+JSON.stringify({duplicateOptions:report.duplicateOptions.slice(0,80),missingCorrectOption:report.missingCorrectOption.slice(0,80)}));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/physics-content-quality.json",JSON.stringify(report,null,2));
if(report.duplicateIds.length||report.duplicateOptions.length||report.missingCorrectOption.length||report.calculationSchema.length) process.exitCode=1;
