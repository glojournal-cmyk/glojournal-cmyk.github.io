// Read-only Year 8 real-source capacity report. Never reads student storage or rewrites topic content.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cat = JSON.parse(fs.readFileSync(path.join(root, 'content/catalog.json'), 'utf8'));
const topics = cat.topics.filter(t => Number(t.year) === 8 && t.status === 'enabled');
const out = path.join(root, 'qa-reports/year8-capacity-current');
fs.mkdirSync(out, {recursive:true});
const rows = [], bad = [];
const clean = s => String(s ?? '').toLowerCase().replace(/\\s+/g, ' ').trim();
const quote = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
for (const t of topics) {
  const src = path.join(root, 'content/topics', t.topicId + '.json');
  if (!fs.existsSync(src)) { bad.push('MISSING ' + t.topicId); continue; }
  let file;
  try { file = JSON.parse(fs.readFileSync(src,'utf8')); }
  catch (err) { bad.push('INVALID JSON ' + t.topicId + ': ' + err.message); continue; }
  if (!Array.isArray(file.questions) || file.topicId !== t.topicId || Number(file.year)!==8 || file.subject!==t.subject) {
    bad.push('SCHEMA/TOPIC MISMATCH ' + t.topicId);continue;
  }
  const seen=new Set();
  for(const q of file.questions){if(!q.id||seen.has(q.id))bad.push('MISSING OR REPEATED ID ' + t.topicId + ' / ' + q.id);seen.add(q.id);}
  const active=file.questions.filter(q => q.status==='enabled' && q.preview!==true && q.formal!==false && !q._repair);
  const promptKey=q=>clean(q.prompt)+'|'+clean(JSON.stringify(q.stimulus||{}));
  const uniquePrompts=new Set(active.map(promptKey)).size;
  const uniqueConcepts=new Set(active.map(q=>q.conceptId||q.id)).size;
  const formalTypes=new Set(['typed_exact','typed_short','typed_equivalent','spelling_restore','controlled_translation','mark_points','extended_response','practical_design','calculation','unordered_set']);
  const independent=active.filter(q=>formalTypes.has(q.format)).length;
  const available=active.length;
  const risk=available<15?'P0: below Standard':available<20?'P1: below Mastery':available<25?'P2: no five-item reserve':available<30?'WATCH: under ten spare':'COUNT ONLY';
  rows.push({subject:t.subject,id:t.topicId,title:t.title,catalog:Number(t.enabled)||0,source:available,raw:file.questions.length,mc:active.filter(q=>q.format==='mc_single').length,independent,concepts:uniqueConcepts,uniquePrompts,diff:available-(Number(t.enabled)||0),risk});
}
rows.sort((a,b)=>a.subject.localeCompare(b.subject)||a.source-b.source||a.id.localeCompare(b.id));
const header=['subject','topic_id','title','catalog_enabled','real_source_eligible','total_source_records','eligible_mc','eligible_independent','unique_concept_ids','unique_prompt_stimulus','source_minus_catalog','capacity_flag'];
const csv=[header.join(','),...rows.map(r=>[r.subject,r.id,r.title,r.catalog,r.source,r.raw,r.mc,r.independent,r.concepts,r.uniquePrompts,r.diff,r.risk].map(quote).join(','))].join('\\n')+'\\n';
fs.writeFileSync(path.join(out,'topics.csv'),csv);
const subs=['latin','french','biology','chemistry','physics'];
const stats=subs.map(s=>{const a=rows.filter(r=>r.subject===s);return '|'+[s,a.length,a.reduce((n,r)=>n+r.source,0),a.filter(r=>r.source<15).length,a.filter(r=>r.source>=15&&r.source<20).length,a.filter(r=>r.source>=20&&r.source<25).length,a.filter(r=>r.diff!==0).length].join('|')+'|';});
const message=['# Year 8 real source-file question-capacity audit','', 'Source-eligible = status enabled, not preview, formal not false, not _repair. Counts do NOT establish Mastery quality, past-correct freshness, taught status, or learner-specific capacity.','','|Subject|Topics|Source eligible|Below 15|15–19|20–24|Catalog discrepancies|','|---|---:|---:|---:|---:|---:|---:|',...stats,'','Problems found in source validation: '+bad.length,'',...bad.map(x=>'- '+x),'','Topics below 25 actual source questions:',...rows.filter(r=>r.source<25).map(r=>'- '+r.id+': '+r.source+' eligible; '+r.risk),'','See topics.csv for all topic rows.'].join('\\n')+'\\n';
fs.writeFileSync(path.join(out,'summary.md'),message);
console.log(message);
if (rows.length!==topics.length || bad.length) process.exitCode=1;
