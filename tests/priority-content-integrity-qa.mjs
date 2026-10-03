import fs from 'node:fs';
import path from 'node:path';
const target=file=>/^(fr-|la-|bio-)/.test(file);
const files=fs.readdirSync('content/topics').filter(f=>target(f)&&f.endsWith('.json')).map(f=>'content/topics/'+f);
files.push(...['biology-cell-structure-20261003','biology-school-20260927','french-school-1','latin-verbs-1','latin-creusa-1','latin-conjugations-20260928'].map(f=>'assessment/'+f+'.json'));
const report={date:'2026-10-03',scope:'French, Latin and Biology topic packs plus their school assessment banks',packs:files.length,questions:0,available:0,disabledDuplicates:0,diagramQuestions:0,figures:[],failures:[],difficulty:{},reviewNotes:['Text checks verify structure, keys, duplicates and local figures; they do not certify every possible free-text synonym.','Different formats and reverse translations remain separate learning tasks. Copies across different topic packs are not automatically deleted.','MC distractor category and length heuristics are review signals, not proof of an incorrect question.'],biologySource:'https://www.aqa.org.uk/subjects/biology/gcse/biology-8461/specification/subject-content/cell-biology'};
const fail=(file,q,type)=>report.failures.push({file,id:q?.id||null,type});
const figures=new Set();
for(const file of files){
 const doc=JSON.parse(fs.readFileSync(file,'utf8')),ids=new Set(),duplicates=new Map();
 for(const q of doc.questions||[]){
  report.questions++;
  if(ids.has(q.id))fail(file,q,'duplicate-id');ids.add(q.id);
  if(q.status==='disabled'){if(q.duplicateOf)report.disabledDuplicates++;continue;}
  report.available++;
  if(!q.prompt?.trim())fail(file,q,'empty-prompt');
  const a=q.answer||{};
  if(!a.accepted?.length&&!a.modelAnswer&&!a.points?.length&&!a.markPoints?.length&&!a.requiredGroups?.length&&!a.pairs?.length&&!a.labelMap&&!a.categories&&typeof a.value!=='number')fail(file,q,'missing-answer-key');
  if(!['choice','biology_rubric','chemistry_rubric','exact_or_equivalent','keywords'].includes(a.mode)&&!q.format)fail(file,q,'unknown-marking-shape');
  const exact=JSON.stringify([q.format,q.prompt,q.stimulus,a]);
  if(duplicates.has(exact))fail(file,q,'exact-available-duplicate');else duplicates.set(exact,q.id);
  if(q.format==='mc_single'||a.mode==='choice'){
   const norm=v=>String(v).normalize('NFKD').toLowerCase().replace(/\s+/g,' ').trim();
   const options=(q.options||[]).map(norm);
   if(options.length<2||new Set(options).size!==options.length)fail(file,q,'duplicate-or-missing-options');
   if(!(a.accepted||[]).some(v=>options.includes(norm(v))))fail(file,q,'correct-answer-not-in-options');
  }
  if(q.difficulty)report.difficulty[q.difficulty]=(report.difficulty[q.difficulty]||0)+1;
  const image=q.stimulus?.image||q.image||(q.diagram?'/assessment/diagrams/'+q.diagram:'');
  if(q.format==='diagram_label'){
   report.diagramQuestions++;
   if(!image)fail(file,q,'missing-label-figure');
   if(JSON.stringify(Object.keys(a.labelMap||{}).sort())!==JSON.stringify([...(q.stimulus?.anchors||[])].sort()))fail(file,q,'anchor-key-mismatch');
  }
  if(image&&image.startsWith('/')){
   const local=path.resolve(image.split('?')[0].slice(1));figures.add(image.split('?')[0]);
   if(!fs.existsSync(local)||!fs.statSync(local).size)fail(file,q,'missing-local-image');
   else if(image.endsWith('.svg')&&q.format==='diagram_label'){
    const svg=fs.readFileSync(local,'utf8');
    for(const letter of q.stimulus.anchors)if(!svg.includes('>'+letter.toUpperCase()+'</text>'))fail(file,q,'letter-not-visible-in-figure');
   }
  }
 }
 if(file.startsWith('content/topics/'))for(const status of ['enabled','preview','disabled'])if((doc[status]||0)!==(doc.questions||[]).filter(q=>q.status===status).length)fail(file,null,'stale-'+status+'-count');
}
report.figures=[...figures].sort();
fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/priority-content-integrity.json',JSON.stringify(report,null,2)+'\n');
console.log('PRIORITY_CONTENT_INTEGRITY '+JSON.stringify({...report,figures:report.figures.length,reviewNotes:undefined}));
if(report.failures.length)process.exit(1);
