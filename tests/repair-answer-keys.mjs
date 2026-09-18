import fs from "node:fs";
import path from "node:path";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>f.endsWith(".json")).sort();
const norm=v=>String(v??"").normalize("NFKC").replace(/[’‘`]/g,"'").replace(/\s+/g," ").trim().toLowerCase().replace(/[.!?]+$/g,"");
const manual=new Map(Object.entries({
  "la-y8-gen-16aug-perfect-07-mc":"abiit",
  "la-y8-gen-31jul-prep-12-mc":"under (movement towards/under)",
  "la-y8-gen-15aug-prep-12-meaning-mc":"under (movement towards/under)",
  "la-y8-src-19aug-extra-tense-1":"imperfect",
  "la-y8-src-19aug-extra-tense-2":"imperfect",
  "la-y8-src-19aug-extra-tense-5":"imperfect",
  "la-y8-src-19aug-extra-tense-6":"pluperfect",
  "la-y8-src-18aug-model-tense-01":"imperfect",
  "la-y8-src-18aug-model-tense-02":"imperfect",
  "la-y8-src-18aug-model-tense-03":"imperfect",
  "la-y8-src-18aug-model-tense-04":"imperfect",
  "la-y8-src-18aug-model-tense-05":"imperfect",
  "la-y8-src-18aug-model-tense-06":"imperfect",
  "la-y8-src-18aug-model-tense-07":"imperfect",
  "la-y8-src-18aug-model-tense-08":"imperfect",
  "la-y8-gen-15aug-adj-2-f-mc":"pulchrae",
  "la-y8-gen-16aug-perfect-01-mc":"custodivit",
  "la-y8-gen-16aug-perfect-22-mc":"cupivit",
  "la-y8-gen-15aug-pron-15-2-3-mc":"nostri / nostrum"
}));
const stats={mc:0,sequence:0,diagram:0,calcNumeric:0,calcSelfCheck:0,calcModel:0,files:0};
const unresolved=[];

function mapToOption(raw, options){
  const r=norm(raw); if(!r) return null;
  return options.find(o=>norm(o)===r) || options.find(o=>r.includes(norm(o)) && norm(o).length>=3) || null;
}
function recoverMc(q){
  const options=(q.options||[]).filter(Boolean);
  if(manual.has(q.id)) return manual.get(q.id);
  const lines=[q.feedback?.short,...(q.feedback?.steps||[]),q.feedback?.remember].filter(Boolean).map(String);
  const patterns=[
    /the correct choice is [“"]([^”"]+)[”"]/i,
    /the required source meaning is [“"]([^”"]+)[”"]/i,
    /write and check the latin answer:\s*[“"]([^”"]+)[”"]/i,
    /the required source (?:answer|latin|form|translation) is [“"]([^”"]+)[”"]/i,
    /correct answer(?: is|:)?\s*[“"]([^”"]+)[”"]/i,
    /key answer:\s*(.+)$/i,
    /source-locked answer:\s*(.+)$/i
  ];
  for(const line of lines) for(const re of patterns){
    const m=line.match(re); if(!m) continue;
    const hit=mapToOption(m[1],options); if(hit) return hit;
  }
  const short=String(q.feedback?.short||"");
  const colon=short.match(/^\s*([^:]{1,100})\s*:/);
  if(colon){const hit=mapToOption(colon[1],options); if(hit) return hit;}
  const whole=norm(lines.join(" "));
  const mentioned=[...new Set(options.filter(o=>norm(o).length>=2 && whole.includes(norm(o))))];
  if(mentioned.length===1) return mentioned[0];
  return null;
}
function sequenceItems(q){
  let raw=String(q.feedback?.remember||q.feedback?.short||"").replace(/^\s*Key answer:\s*/i,"").trim();
  const items=raw.split(/\s*(?:→|->)\s*/).map(x=>x.trim()).filter(Boolean);
  return items.length>=2?items:null;
}
const unitMap={
  "a":["A","ampere","amperes"],"v":["V","volt","volts"],"n":["N","newton","newtons"],
  "j":["J","joule","joules"],"w":["W","watt","watts"],"pa":["Pa","pascal","pascals"],
  "g":["g","gram","grams"],"kg":["kg","kilogram","kilograms"],"m":["m","metre","metres","meter","meters"],
  "s":["s","second","seconds"],"m/s":["m/s","m s-1","metres per second","meters per second"],
  "%":["%","percent","percentage"],"°":["°","degree","degrees"]
};
function lastNumeric(s){
  const re=/(-?\d+(?:\.\d+)?)\s*(kg\/m(?:3|³)|m\/s|[A-Za-z]+|[%°])?/g;
  let m,last=null; while((m=re.exec(String(s)))!==null) last={value:Number(m[1]),unit:(m[2]||"").trim()};
  return last;
}
function unitsFor(unit){
  const k=String(unit||"").toLowerCase();
  if(!k) return [];
  return unitMap[k]||[unit];
}
function modelFor(value,units){return String(value)+(units?.length?` ${units[0]}`:"");}

for(const file of files){
  const full=path.join(root,file);
  const doc=JSON.parse(fs.readFileSync(full,"utf8"));
  let changed=false;
  for(const q of doc.questions||[]){
    q.answer=q.answer||{};
    if(Array.isArray(q.answer.markPoints) && q.answer.markPoints.some(mp=>mp && typeof mp==="object")){
      q.answer.markPoints=q.answer.markPoints.map(mp=>typeof mp==="string"?mp:String(mp?.text??mp?.label??mp?.answer??"").trim()).filter(Boolean);
      changed=true;
    }
    if(q.format==="mc_single" && !(Array.isArray(q.answer.accepted)&&q.answer.accepted.length)){
      const candidate=recoverMc(q);
      if(!candidate || !(q.options||[]).some(o=>norm(o)===norm(candidate))){unresolved.push({file,id:q.id,type:"mc",candidate}); continue;}
      q.answer.accepted=[candidate]; stats.mc++; changed=true;
    }
    if(q.format==="sequence" && !(q.answer.accepted?.length) && !q.answer.modelAnswer){
      const items=sequenceItems(q);
      if(!items){unresolved.push({file,id:q.id,type:"sequence"}); continue;}
      q.format="word_tiles";
      q.answer={...q.answer,mode:"exact_or_equivalent",accepted:[items.join(" ")]};
      q.stimulus={...(q.stimulus||{}),tiles:[...items].reverse()};
      q.task={...(q.task||{}),label:"ORDER THE STEPS",instruction:"Tap each tile in the correct order."};
      stats.sequence++; changed=true;
    }
    if(q.format==="diagram_label" && (!q.answer.labelMap || typeof q.answer.labelMap!=="object")){
      const labels=(q.answer.requiredLabels||q.stimulus?.labels||[]).filter(Boolean);
      if(!labels.length){unresolved.push({file,id:q.id,type:"diagram"}); continue;}
      q.format="typed_short";
      q.formal=false;
      q.answer={...q.answer,mode:"required_groups",requiredGroups:labels.map(label=>({label,alternatives:[label]})),modelAnswer:labels.join(", ")};
      q.task={...(q.task||{}),label:"LABEL CHECK",instruction:"Type all required labels, separated by commas. This self-check does not affect formal Mastery until diagram anchors are mapped."};
      stats.diagram++; changed=true;
    }
    if(q.format==="calculation"){
      if(!Array.isArray(q.answer.units)){q.answer.units=[]; changed=true;}
      if(typeof q.answer.value==="number"){
        if(!q.answer.modelAnswer){q.answer.modelAnswer=modelFor(q.answer.value,q.answer.units); stats.calcModel++; changed=true;}
      } else if(Array.isArray(q.answer.markPoints) && q.answer.markPoints.length){
        const finals=q.answer.markPoints.map(lastNumeric).filter(Boolean);
        const unique=[...new Set(finals.map(x=>x.value))];
        if(unique.length===1){
          const final=finals[finals.length-1];
          q.answer.mode="numeric"; q.answer.value=final.value; q.answer.units=unitsFor(final.unit); q.answer.tolerance=q.answer.tolerance??0.001;
          q.answer.modelAnswer=modelFor(final.value,q.answer.units); stats.calcNumeric++; changed=true;
        } else {
          q.format="mark_points"; q.formal=false; q.answer.mode="mark_points"; q.answer.modelAnswer=q.answer.markPoints.join("; ");
          q.task={...(q.task||{}),instruction:"Show the method and all requested results, then self-check against the approved mark points. This open response does not affect formal Mastery."};
          stats.calcSelfCheck++; changed=true;
        }
      } else if(q.answer.mode==="structured" && q.answer.working){
        q.format="mark_points"; q.formal=false; q.answer.mode="mark_points";
        const model=String(q.feedback?.remember||q.feedback?.short||q.answer.working).replace(/^\s*Key answer:\s*/i,"").trim();
        q.answer.markPoints=[q.answer.working, model].filter((v,i,a)=>v&&a.indexOf(v)===i);
        q.answer.modelAnswer=model;
        q.task={...(q.task||{}),instruction:"Show the method and all requested results, then self-check against the approved answer. This multi-part response does not affect formal Mastery."};
        stats.calcSelfCheck++; changed=true;
      } else {
        unresolved.push({file,id:q.id,type:"calculation"});
      }
    }
  }
  if(changed){fs.writeFileSync(full,JSON.stringify(doc,null,2)+"\n"); stats.files++;}
}
if(unresolved.length){console.error("UNRESOLVED "+JSON.stringify(unresolved,null,2)); process.exit(2);}
console.log("REPAIR_SUMMARY "+JSON.stringify(stats));
