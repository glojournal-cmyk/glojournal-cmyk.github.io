import fs from "node:fs";
import path from "node:path";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^bio-y9-b\d+\.json$/.test(f)).sort((a,b)=>Number(a.match(/b(\d+)/)[1])-Number(b.match(/b(\d+)/)[1]));
const norm=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[’‘`]/g,"'").toLowerCase().replace(/\s+/g," ").trim();
const docs=new Map();
const failures=[], warnings=[], seen=new Map(), formats={};
let questions=0;

function fail(file,id,type,extra={}){failures.push({file,id:id||null,type,...extra})}
function warn(file,id,type,extra={}){warnings.push({file,id:id||null,type,...extra})}
function hasText(v){return typeof v==="string"&&v.trim().length>0}
function accepted(a={}){return Array.isArray(a.accepted)?a.accepted.filter(hasText):[]}
function topicText(doc){return JSON.stringify(doc).toLowerCase()}

for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  docs.set(doc.topicId,doc);
  const qs=Array.isArray(doc.questions)?doc.questions:[];
  questions+=qs.length;
  const statusCounts={enabled:0,preview:0,disabled:0};

  if(doc.subject!=="biology"||doc.year!==9) fail(file,null,"bad-topic-metadata",{subject:doc.subject,year:doc.year});
  if(!hasText(doc.note?.overview)) fail(file,null,"missing-note-overview");
  for(const key of ["mustMemoriseRules","mustMemoriseVocabulary","detailedExplanation","commonMistakes","examTips","quickCheck"]){
    const v=doc.note?.[key];
    if(!Array.isArray(v)||!v.length) fail(file,null,"empty-note-section",{section:key});
  }
  for(const rule of doc.note?.mustMemoriseRules||[]){
    if(/^[-–—\s]*$/.test(String(rule))||/\b(todo|tbd|placeholder)\b/i.test(String(rule))) fail(file,null,"placeholder-rule",{rule});
  }

  for(const q of qs){
    formats[q.format]=(formats[q.format]||0)+1;
    if(q.status in statusCounts) statusCounts[q.status]++; else fail(file,q.id,"unknown-status",{status:q.status});
    if(seen.has(q.id)) fail(file,q.id,"duplicate-id",{other:seen.get(q.id)}); else seen.set(q.id,file);
    if(q.topicId!==doc.topicId) fail(file,q.id,"topic-id-mismatch",{expected:doc.topicId,actual:q.topicId});
    if(!hasText(q.prompt)) fail(file,q.id,"missing-prompt");
    if(!hasText(q.task?.label)||!hasText(q.task?.instruction)) fail(file,q.id,"missing-task-instruction");
    if(!hasText(q.feedback?.short)||!Array.isArray(q.feedback?.steps)||!q.feedback.steps.length) fail(file,q.id,"weak-feedback");
    const a=q.answer||{};
    if(!hasText(a.mode)) fail(file,q.id,"missing-answer-mode");

    if(q.format==="mc_single"){
      const opts=(q.options||[]).filter(hasText), ons=opts.map(norm), A=accepted(a);
      if(opts.length<3) fail(file,q.id,"mc-too-few-options",{count:opts.length});
      if(new Set(ons).size!==ons.length) fail(file,q.id,"mc-duplicate-options",{options:opts});
      if(!A.length) fail(file,q.id,"mc-no-key");
      if(A.length&&!A.some(x=>ons.includes(norm(x)))) fail(file,q.id,"mc-key-not-in-options",{accepted:A,options:opts});
    }

    if(["typed_exact","typed_short","spelling_restore"].includes(q.format)){
      const scorable=accepted(a).length||hasText(a.modelAnswer)||(a.requiredGroups||[]).length||(a.markPoints||[]).length;
      if(!scorable) fail(file,q.id,"text-unscorable");
    }

    if(["mark_points","extended_response","practical_design"].includes(q.format)){
      const marks=(a.markPoints||[]).filter(hasText);
      if(!marks.length&&!hasText(a.modelAnswer)&&!accepted(a).length) fail(file,q.id,"open-unscorable");
      if(typeof a.totalMarks==="number"&&marks.length&&a.totalMarks!==marks.length) fail(file,q.id,"mark-count-mismatch",{totalMarks:a.totalMarks,markPoints:marks.length});
      if(typeof q.stimulus?.marks==="number"&&typeof a.totalMarks==="number"&&q.stimulus.marks!==a.totalMarks) fail(file,q.id,"stimulus-mark-mismatch",{stimulus:q.stimulus.marks,totalMarks:a.totalMarks});
    }

    if(q.format==="calculation"){
      if(typeof a.value!=="number"||!Number.isFinite(a.value)) fail(file,q.id,"calculation-missing-value");
      if(!Array.isArray(a.units)) fail(file,q.id,"calculation-units-not-array");
      if(typeof a.tolerance!=="number"||a.tolerance<0) fail(file,q.id,"calculation-bad-tolerance");
      if(!hasText(a.modelAnswer)) fail(file,q.id,"calculation-missing-model");
      if(!hasText(a.working)&&!(a.markPoints||[]).length) fail(file,q.id,"calculation-missing-working");
    }

    if(q.format==="matching"){
      const pairs=a.pairs||[], L=pairs.map(p=>p.left), R=pairs.map(p=>p.right), sL=q.stimulus?.left||[], sR=q.stimulus?.right||[];
      if(!pairs.length) fail(file,q.id,"matching-no-pairs");
      if(new Set(L.map(norm)).size!==L.length||new Set(R.map(norm)).size!==R.length) fail(file,q.id,"matching-duplicate-values");
      if(L.map(norm).sort().join("|")!==sL.map(norm).sort().join("|")||R.map(norm).sort().join("|")!==sR.map(norm).sort().join("|")) fail(file,q.id,"matching-stimulus-mismatch");
    }

    if(q.format==="sorting"){
      const cats=a.categories||{}, answerItems=Object.values(cats).flat(), stim=q.stimulus?.items||[], stimCats=q.stimulus?.categories||[];
      if(!Object.keys(cats).length) fail(file,q.id,"sorting-no-categories");
      if(new Set(answerItems.map(norm)).size!==answerItems.length) fail(file,q.id,"sorting-duplicate-items");
      if(answerItems.map(norm).sort().join("|")!==stim.map(norm).sort().join("|")) fail(file,q.id,"sorting-item-mismatch");
      if(Object.keys(cats).map(norm).sort().join("|")!==stimCats.map(norm).sort().join("|")) fail(file,q.id,"sorting-category-mismatch");
    }

    if(q.format==="diagram_label"){
      const lm=a.labelMap||{}, anchors=q.stimulus?.anchors||[], labels=q.stimulus?.labels||[];
      if(Object.keys(lm).sort().join("|")!==anchors.slice().sort().join("|")) fail(file,q.id,"diagram-anchor-mismatch");
      if(Object.values(lm).map(norm).sort().join("|")!==labels.map(norm).sort().join("|")) fail(file,q.id,"diagram-label-mismatch");
    }

    if(["word_tiles","sequence"].includes(q.format)){
      const tiles=(q.stimulus?.tiles||[]).filter(hasText), key=accepted(a)[0]||a.modelAnswer||"";
      if(!tiles.length) fail(file,q.id,"ordered-missing-tiles");
      if(!hasText(key)) fail(file,q.id,"ordered-missing-key");
      if(tiles.length&&key){
        let remaining=norm(key);
        for(const tile of [...tiles].sort((x,y)=>norm(y).length-norm(x).length)){
          const t=norm(tile), i=remaining.indexOf(t);
          if(i<0){fail(file,q.id,"ordered-key-missing-tile",{tile,key});break}
          remaining=(remaining.slice(0,i)+" "+remaining.slice(i+t.length)).replace(/\s+/g," ").trim();
        }
        if(remaining.replace(/[+→=,;:.\-]/g,"").trim()) fail(file,q.id,"ordered-key-extra-text",{remaining,key});
      }
    }

    if(q.format==="unordered_set"){
      const groups=a.requiredGroups||[];
      if(!groups.length||groups.some(g=>!Array.isArray(g.alternatives)||!g.alternatives.some(hasText))) fail(file,q.id,"unordered-set-bad-groups");
    }
  }

  for(const key of ["enabled","preview","disabled"]){
    if((doc[key]||0)!==statusCounts[key]) fail(file,null,"status-count-mismatch",{status:key,metadata:doc[key]||0,actual:statusCounts[key]});
  }
}

if(files.length!==16) fail("(bank)",null,"topic-count",{expected:16,actual:files.length});
if(questions<923) fail("(bank)",null,"question-count-regressed",{minimum:923,actual:questions});

// Tiffin Girls / AQA source-lock checks for known high-risk Biology content.
{
  const b1=docs.get("bio-y9-b1");
  const q=b1?.questions.find(q=>q.id==="bio-y9-b1-app-sort-cell-structures");
  const ribosomeCat=Object.entries(q?.answer?.categories||{}).find(([,items])=>items.includes("ribosome"))?.[0]||"";
  if(!/bacterial/i.test(ribosomeCat)) fail("bio-y9-b1.json",q?.id,"ribosome-category-must-include-bacteria",{ribosomeCat});
}
{
  const b4=docs.get("bio-y9-b4"), t=topicText(b4);
  if(!/no more than 25|maximum temperature of 25|max(?:imum)?[^.]{0,30}25/.test(t)) fail("bio-y9-b4.json",null,"rp2-missing-25c-cap");
  if(/incubat[^.]{0,60}\b37\s*°?c\b/.test(t)) fail("bio-y9-b4.json",null,"rp2-unsafe-37c-incubation");
  if(!/tape/.test(t)||!/invert/.test(t)) fail("bio-y9-b4.json",null,"rp2-missing-tape-or-invert");
}
{
  const b5=docs.get("bio-y9-b5"), enabled=(b5?.questions||[]).filter(q=>q.status==="enabled");
  const t=JSON.stringify(enabled).toLowerCase();
  for(const phase of ["prophase","metaphase","anaphase","telophase"]) if(t.includes(phase)) fail("bio-y9-b5.json",null,"detailed-mitosis-phase-out-of-scope",{phase});
}
{
  const b6=docs.get("bio-y9-b6"), t=topicText(b6);
  if(!/viral infection/.test(t)) fail("bio-y9-b6.json",null,"stem-cell-source-risk-missing");
  if(/(?:tumou?r|cancer)[^.]{0,35}risk/.test(t)) fail("bio-y9-b6.json",null,"unsupported-stem-cell-risk");
}
for(const [topicId,needle] of [["bio-y9-b7","complementary-base-pairing"],["bio-y9-b15","inverse-square-light-relationship"]]){
  const doc=docs.get(topicId), qs=(doc?.questions||[]).filter(q=>q.id.includes(needle));
  if(qs.length&&qs.some(q=>q.status!=="preview")) fail(topicId+".json",null,"extension-not-preview",{needle,statuses:qs.map(q=>q.status)});
}
{
  const b9=docs.get("bio-y9-b9"), rule=(b9?.note?.mustMemoriseRules||[]).find(x=>/^osmosis\b/i.test(x))||"";
  if(!/dilute/i.test(rule)||!/concentrated/i.test(rule)||!/partially permeable/i.test(rule)) fail("bio-y9-b9.json",null,"osmosis-definition-incomplete",{rule});
}
{
  const b15=docs.get("bio-y9-b15"), q=b15?.questions.find(q=>q.id==="bio-y9-b15-app-gas-v-bubbles");
  const pts=(q?.answer?.markPoints||[]).join(" ");
  if(!/bubble/i.test(pts)||!/size/i.test(pts)) fail("bio-y9-b15.json",q?.id,"bubble-size-reliability-reason-missing",{pts});
}
{
  const b16=docs.get("bio-y9-b16");
  if((b16?.note?.mustMemoriseRules||[]).length<5) fail("bio-y9-b16.json",null,"glucose-rules-too-thin");
  if((b16?.note?.mustMemoriseVocabulary||[]).length<5) fail("bio-y9-b16.json",null,"glucose-vocab-too-thin");
}

const byType={}; for(const f of failures) byType[f.type]=(byType[f.type]||0)+1;
const summary={files:files.length,questions,formats,failures:failures.length,warnings:warnings.length,byType};
console.log("BIOLOGY_QUALITY_SUMMARY "+JSON.stringify(summary));
console.log("BIOLOGY_QUALITY_FAILURES "+JSON.stringify(failures.slice(0,150)));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/biology-content-quality.json",JSON.stringify({summary,failures,warnings},null,2));
if(failures.length) process.exit(2);
