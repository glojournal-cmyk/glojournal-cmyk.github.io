import fs from "node:fs";
import path from "node:path";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^fr-.*\.json$/.test(f)).sort();
const norm=v=>String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[’‘`]/g,"'").toLowerCase().replace(/[^a-z0-9' -]+/g," ").replace(/\s+/g," ").trim();
const kind=v=>{
  const s=String(v??"").trim();
  if(/^[-+]?\d+(?:[.,]\d+)?$/.test(s)) return "number";
  const w=s.split(/\s+/).filter(Boolean);
  if(w.length===1) return "word";
  if(/[.!?]$/.test(s)||w.length>=5) return "sentence";
  return "phrase";
};
const direction=q=>{
  const p=String(q.prompt||"").toLowerCase();
  const l=String(q.task?.label||"").toLowerCase();
  if(p.includes("translate into english")||p.includes("best english meaning")||l.includes("translate into english")) return "f2e";
  if(p.includes("translate into french")||p.includes("which of these french entries can mean")||l.includes("translate into french")) return "e2f";
  return "other";
};
const cue=q=>{
  const p=String(q.prompt||"");
  let m=p.match(/mean [“"]([^”"]+)[”"]/i); if(m) return m[1];
  m=p.match(/«([^»]+)»/); if(m) return m[1];
  const lines=p.split(/\n/).map(x=>x.trim()).filter(Boolean);
  return q.stimulus?.text||lines.at(-1)||p;
};
const compatible=(a,b)=>a===b || ((a==="phrase"||a==="sentence")&&(b==="phrase"||b==="sentence"));
const stats={files:0,mcSeen:0,mcRebuilt:0,unchangedInsufficientPool:0};
const unresolved=[];

for(const file of files){
  const full=path.join(root,file);
  const doc=JSON.parse(fs.readFileSync(full,"utf8"));
  const qs=Array.isArray(doc.questions)?doc.questions:[];
  const mc=qs.map((q,index)=>({q,index})).filter(x=>x.q.format==="mc_single" && Array.isArray(x.q.answer?.accepted) && x.q.answer.accepted[0]);
  let changed=false;
  for(const row of mc){
    const q=row.q, correct=q.answer.accepted[0], dir=direction(q), k=kind(correct), qCue=norm(cue(q)), qConcept=q.conceptId||"";
    stats.mcSeen++;
    if(dir==="other") continue;
    const pool=mc.filter(c=>{
      if(c.q.id===q.id || direction(c.q)!==dir) return false;
      const ans=c.q.answer?.accepted?.[0];
      if(!ans || norm(ans)===norm(correct)) return false;
      if(qConcept && c.q.conceptId===qConcept) return false;
      const cCue=norm(cue(c.q));
      if(qCue && cCue===qCue) return false;
      return kind(ans)===k;
    });
    let candidates=pool;
    if(candidates.length<3){
      candidates=mc.filter(c=>{
        if(c.q.id===q.id || direction(c.q)!==dir) return false;
        const ans=c.q.answer?.accepted?.[0];
        if(!ans || norm(ans)===norm(correct)) return false;
        if(qConcept && c.q.conceptId===qConcept) return false;
        const cCue=norm(cue(c.q));
        if(qCue && cCue===qCue) return false;
        return compatible(kind(ans),k);
      });
    }
    if(candidates.length<3){
      stats.unchangedInsufficientPool++;
      continue;
    }
    const clen=Math.max(1,norm(correct).length);
    const style=String(q.id||"").includes("-gen-")?"gen":String(q.id||"").includes("-src-")?"src":"other";
    candidates.sort((a,b)=>{
      const score=c=>{
        const ans=c.q.answer.accepted[0], alen=Math.max(1,norm(ans).length);
        const len=Math.abs(alen-clen)/Math.max(alen,clen);
        const dist=Math.abs(c.index-row.index)/Math.max(1,qs.length);
        const diff=Math.abs((Number(c.q.difficulty)||1)-(Number(q.difficulty)||1));
        const cstyle=String(c.q.id||"").includes("-gen-")?"gen":String(c.q.id||"").includes("-src-")?"src":"other";
        const stylePenalty=cstyle===style?0:.18;
        return len*.55+dist*.35+diff*.08+stylePenalty;
      };
      return score(a)-score(b)||String(a.q.id).localeCompare(String(b.q.id));
    });
    const distractors=[];
    const used=new Set([norm(correct)]);
    for(const c of candidates){
      const ans=c.q.answer.accepted[0], n=norm(ans);
      if(!n||used.has(n)) continue;
      used.add(n); distractors.push(ans);
      if(distractors.length===3) break;
    }
    if(distractors.length<3){stats.unchangedInsufficientPool++;continue;}
    const next=[correct,...distractors];
    const old=(q.options||[]).map(norm).sort().join("|");
    const neu=next.map(norm).sort().join("|");
    if(old!==neu){
      q.options=next;
      stats.mcRebuilt++;
      changed=true;
    }
  }
  if(changed){
    fs.writeFileSync(full,JSON.stringify(doc,null,2)+"\n");
    stats.files++;
  }
}

for(const file of files){
  const doc=JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  for(const q of doc.questions||[]){
    if(q.format!=="mc_single") continue;
    const opts=(q.options||[]).filter(Boolean), acc=q.answer?.accepted?.[0];
    if(opts.length!==4||new Set(opts.map(norm)).size!==4||!opts.some(o=>norm(o)===norm(acc))){
      unresolved.push({file,id:q.id,options:opts,accepted:acc});
    }
  }
}
console.log("FRENCH_MC_REPAIR_SUMMARY "+JSON.stringify(stats));
if(unresolved.length){
  console.error("FRENCH_MC_REPAIR_UNRESOLVED "+JSON.stringify(unresolved.slice(0,100)));
  process.exit(2);
}
