import fs from "node:fs";
import path from "node:path";

const root = path.resolve("content/topics");
const files = fs.readdirSync(root).filter(f => f.endsWith(".json")).sort();
const norm = v => String(v ?? "").normalize("NFKC").replace(/[’‘`]/g,"'").replace(/\s+/g," ").trim().toLowerCase().replace(/[.!?]+$/g,"");
const exactFormats = new Set(["mc_single","typed_exact","typed_equivalent","controlled_translation","spelling_restore"]);
const markFormats = new Set(["mark_points","typed_short","extended_response","practical_design"]);
const report = {
  files: files.length, questions: 0, bySubject: {}, byYear: {}, byFormat: {},
  fatal: [], warnings: [], duplicateIds: [], mcMissingAccepted: {}, mcAcceptedNotOption: {},
  obviousMcKeyMismatch: {}, missingScorableAnswer: {}, recoverableMissingMC: {}, unresolvedMissingMC: {}, schema: {}
};
const seen = new Map();
const bump=(obj,k,n=1)=>obj[k]=(obj[k]||0)+n;
const add=(bucket,subject,item)=>{ if(!bucket[subject]) bucket[subject]=[]; bucket[subject].push(item); };

function recoverMcCandidate(q, options) {
  const positive=[q.feedback?.short,...(q.feedback?.steps||[]),q.feedback?.remember].filter(Boolean).join(" ");
  const pnorm=norm(positive);
  let candidates=options.filter(o=>norm(o) && pnorm.includes(norm(o)));
  candidates=[...new Set(candidates)];
  if(candidates.length===1) return candidates;
  const patterns=[
    /key answer:\s*([^\n]+)/i,
    /source-locked answer:\s*([^\n]+)/i,
    /required source (?:meaning|answer|latin|form) is [“"]([^”"]+)[”"]/i,
    /correct answer(?: is|:)?\s*[“"]?([^”"\n]+)[”"]?/i
  ];
  for(const re of patterns){
    const m=positive.match(re); if(!m) continue;
    const hit=options.find(o=>norm(o)===norm(m[1])||norm(m[1]).includes(norm(o)));
    if(hit) return [hit];
  }
  return candidates;
}

for (const file of files) {
  let doc;
  try { doc = JSON.parse(fs.readFileSync(path.join(root,file),"utf8")); }
  catch (e) { report.fatal.push({file,type:"invalid_json",message:e.message}); continue; }
  const subject=doc.subject||file.split("-")[0]||"unknown";
  const year=doc.year ?? "unknown";
  const qs=Array.isArray(doc.questions)?doc.questions:[];
  bump(report.bySubject,subject,qs.length); bump(report.byYear,subject+"-y"+year,qs.length);
  for (const q of qs) {
    report.questions++;
    bump(report.byFormat,q.format||"missing");
    const id=q.id||"(missing-id)";
    if(seen.has(id)) report.duplicateIds.push({id,first:seen.get(id),second:file});
    else seen.set(id,file);
    const a=q.answer||{};
    const accepted=Array.isArray(a.accepted)?a.accepted.filter(v=>String(v).trim()):[];
    const options=Array.isArray(q.options)?q.options.filter(Boolean):[];
    if(q.format==="mc_single"){
      if(!accepted.length){
        const candidates=recoverMcCandidate(q,options);
        const item={file,id,prompt:q.prompt,options,candidates};
        add(report.mcMissingAccepted,subject,item);
        if(candidates.length===1) add(report.recoverableMissingMC,subject,{...item,candidate:candidates[0]});
        else add(report.unresolvedMissingMC,subject,item);
        report.fatal.push({subject,file,id,type:"mc_missing_accepted"});
      } else {
        const optionNorms=new Set(options.map(norm));
        const bad=accepted.filter(v=>!optionNorms.has(norm(v)));
        if(bad.length){
          const item={file,id,accepted,bad,options};
          add(report.mcAcceptedNotOption,subject,item); report.fatal.push({subject,file,id,type:"mc_accepted_not_option",bad});
        }
        const candidates=recoverMcCandidate(q,options);
        if(candidates.length===1 && !accepted.some(v=>norm(v)===norm(candidates[0]))){
          const item={file,id,accepted,feedbackCandidate:candidates[0],options};
          add(report.obviousMcKeyMismatch,subject,item); report.fatal.push({subject,file,id,type:"mc_feedback_key_mismatch"});
        }
      }
    }
    if(exactFormats.has(q.format) && q.format!=="mc_single"){
      if(!accepted.length && !a.modelAnswer && !(Array.isArray(a.requiredGroups)&&a.requiredGroups.length)){
        const item={file,id,format:q.format};
        add(report.missingScorableAnswer,subject,item); report.fatal.push({subject,file,id,type:"missing_scorable_answer",format:q.format});
      }
    }
    if(q.format==="calculation"){
      if(typeof a.value!=="number" || !Array.isArray(a.units)) report.fatal.push({subject,file,id,type:"bad_calculation_schema",value:a.value,units:a.units});
    }
    if(q.format==="matching" && !Array.isArray(a.pairs)) report.fatal.push({subject,file,id,type:"matching_missing_pairs"});
    if(q.format==="sorting" && (!a.categories || typeof a.categories!=="object")) report.fatal.push({subject,file,id,type:"sorting_missing_categories"});
    if(q.format==="diagram_label" && (!a.labelMap || typeof a.labelMap!=="object")) report.fatal.push({subject,file,id,type:"diagram_missing_label_map"});
    if((q.format==="sequence"||q.format==="word_tiles") && !accepted.length && !a.modelAnswer) report.fatal.push({subject,file,id,type:"ordered_missing_answer"});
    if(markFormats.has(q.format) && !(Array.isArray(a.markPoints)&&a.markPoints.length) && !(Array.isArray(a.requiredGroups)&&a.requiredGroups.length) && !accepted.length && !a.modelAnswer){
      report.fatal.push({subject,file,id,type:"open_missing_marking_key",format:q.format});
    }
  }
}
if(report.duplicateIds.length) report.fatal.push(...report.duplicateIds.map(x=>({...x,type:"duplicate_id"})));
const summary={
  files:report.files,questions:report.questions,bySubject:report.bySubject,byYear:report.byYear,byFormat:report.byFormat,
  fatalCount:report.fatal.length,
  mcMissingAccepted:Object.fromEntries(Object.entries(report.mcMissingAccepted).map(([k,v])=>[k,v.length])),
  mcAcceptedNotOption:Object.fromEntries(Object.entries(report.mcAcceptedNotOption).map(([k,v])=>[k,v.length])),
  obviousMcKeyMismatch:Object.fromEntries(Object.entries(report.obviousMcKeyMismatch).map(([k,v])=>[k,v.length])),
  recoverableMissingMC:Object.fromEntries(Object.entries(report.recoverableMissingMC).map(([k,v])=>[k,v.length])),
  unresolvedMissingMC:Object.fromEntries(Object.entries(report.unresolvedMissingMC).map(([k,v])=>[k,v.length])),
  missingScorableAnswer:Object.fromEntries(Object.entries(report.missingScorableAnswer).map(([k,v])=>[k,v.length])),
  duplicateIds:report.duplicateIds.length
};
console.log("ANSWER_KEY_AUDIT_SUMMARY "+JSON.stringify(summary));
console.log("ANSWER_KEY_AUDIT_FATAL_SAMPLE "+JSON.stringify(report.fatal.slice(0,80)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/answer-key-audit.json",JSON.stringify(report,null,2));
if(process.env.STRICT==="1" && report.fatal.length) process.exitCode=1;
