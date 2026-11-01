// Preview-only allocation. Never writes learner progress, XP, MP or Daily assignments.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const key=q=>JSON.stringify([String(q.prompt||'').replace(/\s+/g,' ').trim().toLowerCase(),q.stimulus||{}]);
const status=q=>q.status==='enabled' && q.preview!==true && q.formal!==false && !q._repair;
const independentFormats=new Set(['controlled_translation','typed_exact','typed_short','typed_equivalent','spelling_restore','unordered_set','mark_points','calculation']);
export function loadCandidateSources(manifest,base=root){
  const sources={},used=new Set();
  for(const group of manifest.groups){
    for(const topicId of group.sourceTopics){
      if(used.has(topicId))throw new Error('Topic assigned to two candidate groups: '+topicId);
      used.add(topicId);
      const p=path.join(base,'content/topics',topicId+'.json');
      if(!fs.existsSync(p))throw new Error('Missing source topic '+topicId);
      const obj=JSON.parse(fs.readFileSync(p,'utf8'));
      if(obj.topicId!==topicId || obj.subject!=='latin' || Number(obj.year)!==8)
        throw new Error('Incorrect year/subject source '+topicId);
      if(obj.status!=='enabled'||!Array.isArray(obj.questions))throw new Error('Source not enabled '+topicId);
      const ids=new Set();
      for(const q of obj.questions){if(!q.id || ids.has(q.id))throw new Error('Duplicate source ID '+topicId);ids.add(q.id);}
      sources[topicId]=obj.questions.filter(status).map(q=>({...q,topicId}));
    }
  }
  return sources;
}
// Only a synthetic preview selector. Real Daily must preflight historical dates, due and same-day reservations.
export function selectPreview(group,sources,{limit=15,excludedIds=[],excludedConcepts=[],excludedPrompts=[]}={}){
  if(!Number.isInteger(limit)||limit<1)throw new Error('bad requested size');
  const bannedIds=new Set(excludedIds),bannedConcepts=new Set(excludedConcepts),
        bannedPrompts=new Set(excludedPrompts);
  const pools=group.sourceTopics.map(topicId=>[...(sources[topicId]||[])]
    .filter(q=>!bannedIds.has(q.id))
    .sort((a,b)=>Number(independentFormats.has(b.format))-Number(independentFormats.has(a.format))
                 || String(a.id).localeCompare(String(b.id))));
  const result=[],usedIds=new Set(),usedConcepts=new Set(bannedConcepts),usedPrompt=new Set(bannedPrompts);
  let advanced=true;
  while(result.length<limit&&advanced){
    advanced=false;
    for(const list of pools){
      while(list.length){
        const q=list.shift(),concept=q.conceptId||q.id,fingerprint=key(q);
        if(usedIds.has(q.id)||usedConcepts.has(concept)||usedPrompt.has(fingerprint))continue;
        result.push({id:q.id,topicId:q.topicId,conceptId:concept,format:q.format,prompt:q.prompt});
        usedIds.add(q.id);usedConcepts.add(concept);usedPrompt.add(fingerprint);
        advanced=true;break;
      }
      if(result.length>=limit)break;
    }
  }
  return {requested:limit,filled:result.length,shortfall:Math.max(0,limit-result.length),
          questionRefs:result,sourceTopicIds:group.sourceTopics};
}
export function audit(manifest,sources){
  return manifest.groups.map(group=>{
    const qs=group.sourceTopics.flatMap(topicId=>sources[topicId]||[]);
    const preview=selectPreview(group,sources,{limit:manifest.resultContract.defaultSetSize});
    return {id:group.id,sourceTopics:group.sourceTopics.length,sourceEligible:qs.length,
      independentlyAnswered:qs.filter(q=>independentFormats.has(q.format)).length,
      uniqueSourceConcepts:new Set(qs.map(q=>q.conceptId||q.id)).size,
      distinctPromptStimulus:new Set(qs.map(key)).size,
      samplePreviewFilled:preview.filled,samplePreviewIds:preview.questionRefs.map(q=>q.id),
      cannotClaimMastery:true};
  });
}
if(process.argv[1] && fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'content/year8-latin-composites-20261101.json'),'utf8'));
 const sources=loadCandidateSources(manifest),rows=audit(manifest,sources);
 const dir=path.join(root,'qa-reports/year8-latin-composites');
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'source-capacity.json'),JSON.stringify({year:8,mode:manifest.mode,groups:rows},null,2)+'\n');
 const text=['# Year 8 Latin micro-topic composite preview (not deployed)','',
 '|Group|Source topics|Eligible original questions|Independent-format records|Unique concept IDs|15-slot synthetic preview|',
 '|---|---:|---:|---:|---:|---:|',
 ...rows.map(r=>['|'+r.id,r.sourceTopics,r.sourceEligible,r.independentlyAnswered,r.uniqueSourceConcepts,r.samplePreviewFilled+'/15|'].join('|')),
 '', 'This is a preview with no student history, taught-topic data or progress writes; it cannot grant mastery or Daily credit.'].join('\n');
 fs.writeFileSync(path.join(dir,'summary.md'),text+'\n');
 console.log(text);
 if(rows.some(r=>r.samplePreviewFilled<15))process.exitCode=1;
}
