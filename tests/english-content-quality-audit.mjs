import fs from "node:fs";
import path from "node:path";
import {buildAdaptiveRuntime,countWindowRepeats,sessionConcept} from "./adaptive-runtime-test-utils.mjs";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^eng-.*\.json$/.test(f)).sort();
const runtime=buildAdaptiveRuntime();
const failures=[],warnings=[],ids=new Map();
const report={files:files.length,questions:0,formats:{},duplicateIds:[],emptyPrompts:[],missingConcepts:[],answerSchema:[],mcIssues:[],feedbackIssues:[],sessionIssues:[],byFile:{}};
const norm=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[’‘`]/g,"'").toLowerCase().replace(/\s+/g," ").trim();

for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  const qs=Array.isArray(doc.questions)?doc.questions:[];
  report.questions+=qs.length;
  const stat={questions:qs.length,formats:{}};
  for(const q of qs){
    const fmt=String(q.format||"");
    report.formats[fmt]=(report.formats[fmt]||0)+1;
    stat.formats[fmt]=(stat.formats[fmt]||0)+1;
    if(!q.id){failures.push({file,type:"missing-id",prompt:q.prompt});continue;}
    if(ids.has(q.id)){const row={file,id:q.id,other:ids.get(q.id)};report.duplicateIds.push(row);failures.push({...row,type:"duplicate-id"});} else ids.set(q.id,file);
    if(!String(q.prompt||"").trim()){const row={file,id:q.id};report.emptyPrompts.push(row);failures.push({...row,type:"empty-prompt"});}
    if(!q.conceptId){const row={file,id:q.id,prompt:q.prompt};report.missingConcepts.push(row);failures.push({...row,type:"missing-concept"});}

    const a=q.answer||{};
    const hasAccepted=Array.isArray(a.accepted)&&a.accepted.some(x=>String(x??"").trim());
    const hasPoints=Array.isArray(a.markPoints)&&a.markPoints.length>0;
    const hasGroups=Array.isArray(a.requiredGroups)&&a.requiredGroups.length>0;
    const hasValue=typeof a.value==="number"||typeof a.value==="string";
    if(!(hasAccepted||hasPoints||hasGroups||hasValue||a.correct!=null||a.index!=null)){
      const row={file,id:q.id,format:fmt,prompt:q.prompt};report.answerSchema.push(row);failures.push({...row,type:"missing-answer"});
    }
    if(["typed_exact","typed_short","typed_equivalent","controlled_translation","spelling_restore"].includes(fmt)&&!hasAccepted){
      const row={file,id:q.id,format:fmt,prompt:q.prompt};report.answerSchema.push(row);failures.push({...row,type:"typed-without-accepted"});
    }
    if(["mark_points","extended_response","practical_design"].includes(fmt)&&!(hasPoints||hasGroups||hasAccepted)){
      const row={file,id:q.id,format:fmt,prompt:q.prompt};report.answerSchema.push(row);failures.push({...row,type:"open-response-without-marking"});
    }
    if(fmt==="mc_single"){
      const opts=(q.options||[]).filter(x=>String(x??"").trim()),on=opts.map(norm);
      const accepted=(a.accepted||[]).filter(Boolean);
      if(opts.length<2||new Set(on).size!==on.length||!accepted.length||!accepted.some(ans=>on.includes(norm(ans)))){
        const row={file,id:q.id,prompt:q.prompt,options:opts,accepted};report.mcIssues.push(row);failures.push({...row,type:"bad-mc"});
      }
    }
    if(!q.feedback?.short||!Array.isArray(q.feedback?.steps)||!q.feedback.steps.length){
      const row={file,id:q.id,prompt:q.prompt};report.feedbackIssues.push(row);warnings.push({...row,type:"thin-feedback"});
    }
    const first=String(a.accepted?.[0]||"").trim();
    if(first.length>=14&&norm(q.prompt).includes(norm(first)))warnings.push({file,id:q.id,type:"answer-text-in-prompt",prompt:q.prompt,answer:first});
  }

  runtime.setState({});
  const target=Math.min(10,qs.length);
  if(target){
    const selected=runtime.rankAdaptiveQuestions(qs,"english",target).slice(0,target);
    const idsSelected=selected.map(q=>q.id);
    const concepts=selected.map(sessionConcept);
    const content=selected.map(q=>q._sessionContent||"");
    const distinctAvailable=new Set(qs.map(q=>q.conceptId||q.id)).size;
    const windowRepeats=countWindowRepeats(selected,2);
    const issue={
      wrongLength:selected.length!==target,
      duplicateIds:new Set(idsSelected).size!==idsSelected.length,
      duplicateContent:content.some((x,i)=>x&&content.indexOf(x)!==i),
      windowRepeats:distinctAvailable>=target?windowRepeats:0
    };
    if(issue.wrongLength||issue.duplicateIds||issue.duplicateContent||issue.windowRepeats){
      const row={file,target,selected:idsSelected,concepts,issue};report.sessionIssues.push(row);failures.push({...row,type:"session-quality"});
    }
  }
  report.byFile[file]=stat;
}
if(files.length<8)failures.push({type:"english-topic-count-too-low",files:files.length});
if(report.questions<100)failures.push({type:"english-question-count-too-low",questions:report.questions});

const summary={
  files:report.files,questions:report.questions,formats:report.formats,
  duplicateIds:report.duplicateIds.length,emptyPrompts:report.emptyPrompts.length,
  missingConcepts:report.missingConcepts.length,answerSchemaIssues:report.answerSchema.length,
  mcIssues:report.mcIssues.length,feedbackWarnings:report.feedbackIssues.length,
  sessionIssues:report.sessionIssues.length,failures:failures.length,warnings:warnings.length
};
console.log("ENGLISH_QUALITY_SUMMARY "+JSON.stringify(summary));
console.log("ENGLISH_QUALITY_FAILURES "+JSON.stringify(failures.slice(0,100)));
console.log("ENGLISH_QUALITY_WARNINGS "+JSON.stringify(warnings.slice(0,80)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/english-content-quality.json",JSON.stringify({summary,failures,warnings,report},null,2));
if(failures.length)process.exit(2);
