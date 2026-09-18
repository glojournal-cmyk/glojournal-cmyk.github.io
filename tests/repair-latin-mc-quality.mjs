import fs from "node:fs";
import path from "node:path";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^la-.*\.json$/.test(f)).sort();
const norm=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[’‘`]/g,"'").toLowerCase().replace(/[^a-z0-9' -]+/g," ").replace(/\s+/g," ").trim();
const kind=v=>{
  const s=String(v??"").trim(), w=s.split(/\s+/).filter(Boolean);
  if(/^[-+]?\d+(?:[.,]\d+)?$/.test(s)) return "number";
  if(w.length===1) return "word";
  if(/[.!?]$/.test(s)||w.length>=5) return "sentence";
  return "phrase";
};
const compatible=(a,b)=>a===b||((a==="phrase"||a==="sentence")&&(b==="phrase"||b==="sentence"));
const direction=q=>{
  const d=String(q.stimulus?.direction||"").toLowerCase();
  if(d.includes("latin")&&d.includes("english")) return d.indexOf("latin")<d.indexOf("english")?"l2e":"e2l";
  const p=String(q.prompt||"").toLowerCase();
  if(/english meaning|translate .* into english|meaning is required/.test(p)) return "l2e";
  if(/latin answer|exact latin|translate .* into latin/.test(p)) return "e2l";
  return "other";
};
const isVocabMc=(q,file)=>{
  if(q.format!=="mc_single"||file.startsWith("la-y9-")) return false;
  const d=direction(q);
  const topic=String(q.topic||"").toLowerCase();
  return d!=="other" || /vocab|dictionary|preposition|verb meaning/.test(topic);
};
const idTokens=id=>String(id||"").toLowerCase().split(/[^a-z0-9]+/).filter(x=>x&&!["la","y9","s01","mc","src","gen","concept"].includes(x));
const similarity=(a,b)=>{
  const A=idTokens(a),B=idTokens(b), bs=new Set(B);
  let shared=0;
  for(const t of A) if(bs.has(t)) shared+=/^(1sg|2sg|3sg|1pl|2pl|3pl)$/.test(t)?1.5:1;
  return shared/Math.max(1,new Set([...A,...B]).size);
};

const stats={files:0,vocabMcSeen:0,vocabMcRebuilt:0,y9McSeen:0,y9McRebuilt:0,unchanged:0};
const unresolved=[];

for(const file of files){
  const full=path.join(root,file);
  const doc=JSON.parse(fs.readFileSync(full,"utf8"));
  const qs=Array.isArray(doc.questions)?doc.questions:[];
  const rows=qs.map((q,index)=>({q,index})).filter(x=>x.q.format==="mc_single"&&Array.isArray(x.q.answer?.accepted)&&x.q.answer.accepted[0]);
  let changed=false;

  for(const row of rows){
    const q=row.q, correct=q.answer.accepted[0], targetKind=kind(correct);
    let candidates=[], mode=null;

    if(file.startsWith("la-y9-")){
      stats.y9McSeen++; mode="y9";
      candidates=rows.filter(c=>{
        if(c.q.id===q.id) return false;
        const ans=c.q.answer?.accepted?.[0];
        return ans&&norm(ans)!==norm(correct)&&compatible(kind(ans),targetKind);
      }).sort((a,b)=>{
        const sa=similarity(q.id,a.q.id), sb=similarity(q.id,b.q.id);
        const la=Math.abs(norm(a.q.answer.accepted[0]).length-norm(correct).length);
        const lb=Math.abs(norm(b.q.answer.accepted[0]).length-norm(correct).length);
        return sb-sa || la-lb || Math.abs(a.index-row.index)-Math.abs(b.index-row.index);
      });
    } else if(isVocabMc(q,file)){
      stats.vocabMcSeen++; mode="vocab";
      const dir=direction(q), concept=q.conceptId||"";
      candidates=rows.filter(c=>{
        if(c.q.id===q.id||!isVocabMc(c.q,file)||direction(c.q)!==dir) return false;
        const ans=c.q.answer?.accepted?.[0];
        if(!ans||norm(ans)===norm(correct)) return false;
        if(concept&&c.q.conceptId===concept) return false;
        return kind(ans)===targetKind;
      });
      if(candidates.length<3){
        candidates=rows.filter(c=>{
          if(c.q.id===q.id||!isVocabMc(c.q,file)||direction(c.q)!==dir) return false;
          const ans=c.q.answer?.accepted?.[0];
          if(!ans||norm(ans)===norm(correct)) return false;
          if(concept&&c.q.conceptId===concept) return false;
          return compatible(kind(ans),targetKind);
        });
      }
      const clen=Math.max(1,norm(correct).length);
      candidates.sort((a,b)=>{
        const aa=a.q.answer.accepted[0], bb=b.q.answer.accepted[0];
        const al=Math.abs(norm(aa).length-clen)/Math.max(clen,norm(aa).length);
        const bl=Math.abs(norm(bb).length-clen)/Math.max(clen,norm(bb).length);
        return al-bl || Math.abs(a.index-row.index)-Math.abs(b.index-row.index);
      });
    } else continue;

    const distractors=[], used=new Set([norm(correct)]);
    for(const c of candidates){
      const ans=c.q.answer.accepted[0], n=norm(ans);
      if(!n||used.has(n)) continue;
      used.add(n); distractors.push(ans);
      if(distractors.length===3) break;
    }
    if(distractors.length<3){stats.unchanged++;continue;}
    const next=[correct,...distractors];
    const old=(q.options||[]).map(norm).sort().join("|"), neu=next.map(norm).sort().join("|");
    if(old!==neu){
      q.options=next; changed=true;
      if(mode==="y9") stats.y9McRebuilt++; else stats.vocabMcRebuilt++;
    }
  }

  if(changed){
    fs.writeFileSync(full,JSON.stringify(doc)+"\n");
    stats.files++;
  }
}

for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  for(const q of doc.questions||[]){
    if(q.format!=="mc_single") continue;
    const opts=(q.options||[]).filter(Boolean), acc=q.answer?.accepted?.[0];
    if(opts.length<2||new Set(opts.map(norm)).size!==opts.length||!opts.some(o=>norm(o)===norm(acc))){
      unresolved.push({file,id:q.id,options:opts,accepted:acc});
    }
  }
}
console.log("LATIN_MC_REPAIR_SUMMARY "+JSON.stringify(stats));
if(unresolved.length){console.error("LATIN_MC_REPAIR_UNRESOLVED "+JSON.stringify(unresolved.slice(0,100)));process.exit(2);}
