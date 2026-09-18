import fs from "node:fs";
import path from "node:path";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>f.endsWith(".json")).sort();
const norm=v=>String(v??"").normalize("NFKC").replace(/[’‘`]/g,"'").replace(/\s+/g," ").trim().toLowerCase().replace(/[.!?]+$/g,"");
const report={
  files:files.length,questions:0,bySubject:{},byYear:{},byFormat:{},
  fatal:[],warnings:[],duplicateIds:[],checks:{}
};
const seen=new Map();
const bump=(o,k,n=1)=>o[k]=(o[k]||0)+n;
const fail=(subject,file,id,type,extra={})=>report.fatal.push({subject,file,id,type,...extra});
const warn=(subject,file,id,type,extra={})=>report.warnings.push({subject,file,id,type,...extra});
const hasText=v=>typeof v==="string"&&v.trim().length>0;
const acceptedOf=a=>Array.isArray(a.accepted)?a.accepted.filter(hasText):[];
const hasGroups=a=>Array.isArray(a.requiredGroups)&&a.requiredGroups.length>0&&a.requiredGroups.every(g=>Array.isArray(g.alternatives)&&g.alternatives.some(hasText));
const hasMarks=a=>Array.isArray(a.markPoints)&&a.markPoints.some(hasText);

function numericFromText(v){
  const m=String(v??"").match(/-?\d+(?:\.\d+)?/);
  return m?Number(m[0]):NaN;
}
function displayModel(q){
  const a=q.answer||{};
  const accepted=acceptedOf(a);
  if(hasText(a.modelAnswer)) return a.modelAnswer;
  if(accepted.length) return accepted[0];
  if(hasGroups(a)) return a.requiredGroups.map(g=>g.alternatives.find(hasText)).filter(Boolean).join(" ");
  if(hasMarks(a)) return a.markPoints.join("; ");
  if(typeof a.value==="number"){
    const unit=Array.isArray(a.units)&&a.units.length?a.units[0]:"";
    return String(a.value)+(unit?" "+unit:"");
  }
  if(Array.isArray(a.pairs)&&a.pairs.length) return a.pairs.map(p=>`${p.left} → ${p.right}`).join("; ");
  return "";
}
function schemaScorable(q){
  const a=q.answer||{}, accepted=acceptedOf(a);
  if(q.format==="mc_single") return accepted.length>0;
  if(q.format==="matching") return Array.isArray(a.pairs)&&a.pairs.length>0&&a.pairs.every(p=>hasText(p.left)&&hasText(p.right));
  if(q.format==="sorting") return a.categories&&typeof a.categories==="object"&&Object.keys(a.categories).length>0;
  if(q.format==="diagram_label") return a.labelMap&&typeof a.labelMap==="object"&&Object.keys(a.labelMap).length>0;
  if(q.format==="sequence"||q.format==="word_tiles") return accepted.length>0||hasText(a.modelAnswer);
  if(q.format==="calculation") return typeof a.value==="number"&&Number.isFinite(a.value)&&Array.isArray(a.units);
  if(["mark_points","typed_short","extended_response","practical_design"].includes(q.format)) return hasMarks(a)||hasGroups(a)||accepted.length>0||hasText(a.modelAnswer);
  if(hasGroups(a)) return true;
  return accepted.length>0||hasText(a.modelAnswer);
}

for(const file of files){
  let doc;
  try{doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));}
  catch(e){report.fatal.push({file,type:"invalid_json",message:e.message});continue;}
  const subject=doc.subject||file.split("-")[0]||"unknown";
  const year=doc.year??"unknown";
  const qs=Array.isArray(doc.questions)?doc.questions:[];
  bump(report.bySubject,subject,qs.length);bump(report.byYear,subject+"-y"+year,qs.length);
  for(const q of qs){
    report.questions++;bump(report.byFormat,q.format||"missing");
    const id=q.id||"(missing-id)";
    if(seen.has(id))report.duplicateIds.push({id,first:seen.get(id),second:file}); else seen.set(id,file);
    const a=q.answer||{}, accepted=acceptedOf(a), options=Array.isArray(q.options)?q.options.filter(hasText):[];

    if(!schemaScorable(q)) fail(subject,file,id,"unscorable_schema",{format:q.format,answer:a});

    if(q.format==="mc_single"){
      if(options.length<2) fail(subject,file,id,"mc_missing_options",{options});
      const optionNorms=new Set(options.map(norm));
      const matching=accepted.filter(v=>optionNorms.has(norm(v)));
      if(!matching.length) fail(subject,file,id,"mc_no_accepted_option",{accepted,options});
      const extras=accepted.filter(v=>!optionNorms.has(norm(v)));
      if(extras.length) warn(subject,file,id,"mc_extra_accepted_synonyms",{extras});
    }

    if(q.format==="word_tiles"||q.format==="sequence"){
      const tiles=Array.isArray(q.stimulus?.tiles)?q.stimulus.tiles.filter(hasText):[];
      if(q.format==="word_tiles"&&tiles.length<2) fail(subject,file,id,"word_tiles_missing_tiles",{tiles});
      if(!accepted.length&&!hasText(a.modelAnswer)) fail(subject,file,id,"ordered_missing_key");
    }

    if(q.format==="calculation"&&typeof a.value==="number"){
      if(!Array.isArray(a.units)) fail(subject,file,id,"calculation_units_not_array");
      const model=displayModel(q);
      const parsed=numericFromText(model);
      const tol=Math.max(a.tolerance??0,1e-4);
      if(!Number.isFinite(parsed)||Math.abs(parsed-a.value)>tol) fail(subject,file,id,"calculation_display_value_mismatch",{value:a.value,model});
      if(Array.isArray(a.units)&&a.units.length){
        const mn=norm(model);
        const unitOk=a.units.some(u=>mn.includes(norm(u)));
        if(!unitOk) fail(subject,file,id,"calculation_display_unit_mismatch",{units:a.units,model});
      }
    }

    const model=displayModel(q);
    if(["mc_single","typed_exact","typed_equivalent","controlled_translation","spelling_restore","listen_type"].includes(q.format)&&!model){
      fail(subject,file,id,"empty_display_answer",{format:q.format});
    }
  }
}
if(report.duplicateIds.length) for(const x of report.duplicateIds) report.fatal.push({...x,type:"duplicate_id"});
report.checks={
  fatalCount:report.fatal.length,
  warningCount:report.warnings.length,
  duplicateIds:report.duplicateIds.length,
  byFatalType:Object.fromEntries([...new Set(report.fatal.map(x=>x.type))].map(t=>[t,report.fatal.filter(x=>x.type===t).length])),
  byWarningType:Object.fromEntries([...new Set(report.warnings.map(x=>x.type))].map(t=>[t,report.warnings.filter(x=>x.type===t).length]))
};
const summary={files:report.files,questions:report.questions,bySubject:report.bySubject,byYear:report.byYear,byFormat:report.byFormat,...report.checks};
console.log("ANSWER_KEY_AUDIT_SUMMARY "+JSON.stringify(summary));
console.log("ANSWER_KEY_AUDIT_FATAL_SAMPLE "+JSON.stringify(report.fatal.slice(0,100)));
console.log("ANSWER_KEY_AUDIT_WARNING_SAMPLE "+JSON.stringify(report.warnings.slice(0,40)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/answer-key-audit.json",JSON.stringify(report,null,2));
if(process.env.STRICT==="1"&&report.fatal.length)process.exitCode=1;
