#!/usr/bin/env node
// READ ONLY: never edits question banks or student data.
import fs from 'node:fs';
import path from 'node:path';
const directory='content/topics';
const files=fs.readdirSync(directory).filter(x=>x.endsWith('.json')).sort();
const independent=new Set(['typed_exact','typed_short','typed_equivalent','spelling_restore','controlled_translation','mark_points','extended_response','practical_design','calculation','unordered_set']);
const application=new Set(['calculation','mark_points','extended_response','practical_design','controlled_translation','sequence','sorting','diagram_label']);
const tally=(xs,fn)=>xs.reduce((a,x)=>{const k=String(fn(x)??'unknown');a[k]=(a[k]||0)+1;return a;},{});
const sum=(xs,fn)=>xs.reduce((n,x)=>n+fn(x),0);
const clean=x=>String(x??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const topics=[],errors=[],warnings=[],ids=new Map(),fingerprints=new Map();
for (const filename of files){
 const file=path.join(directory,filename);let d;
 try{d=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){errors.push(file+': '+e.message);continue;}
 if(!Array.isArray(d.questions)){errors.push(file+': missing questions array');continue;}
 const q=d.questions,en=q.filter(x=>x.status==='enabled'&&x.formal!==false&&!x._repair);
 const enabledAll=q.filter(x=>x.status==='enabled').length;
 const marks=x=>Number(x.answer?.totalMarks||(x.answer?.markPoints||[]).length||0);
 const mp=en.filter(x=>x.format==='mark_points');
 const topic={file,topicId:d.topicId||filename.replace('.json',''),subject:d.subject||filename.split('-y')[0],year:Number(d.year)||Number(filename.match(/-y(\d+)-/)?.[1]),title:d.title,
 questions:q.length,enabled:en.length,preview:q.filter(x=>x.status==='preview').length,disabled:q.filter(x=>x.status==='disabled').length,
 concepts:new Set(en.map(x=>x.conceptId).filter(Boolean)).size,
 formats:tally(en,x=>x.format),difficulty:tally(en,x=>x.difficulty),
 independent:en.filter(x=>independent.has(x.format)).length,
 application:en.filter(x=>application.has(x.format)).length,
 high:en.filter(x=>Number(x.difficulty)>=3).length,
 extended:en.filter(x=>['extended_response','practical_design'].includes(x.format)).length,
 mark4:mp.filter(x=>marks(x)>=4).length,mark2:mp.filter(x=>marks(x)<=2).length,
 metadataMismatch:typeof d.enabled==='number'&&d.enabled!==enabledAll};
 topic.eligible15=topic.enabled>=15&&topic.independent>0;
 topic.eligible20=topic.eligible15&&topic.enabled>=20;
 topic.shallowRisk=topic.enabled>=20&&topic.high===0;
 if(topic.metadataMismatch)warnings.push(file+': declared enabled differs from actual');
 topics.push(topic);
 for(const x of q){
  if(typeof x.id!=='string'||!x.id){errors.push(file+': missing question ID');continue;}
  const old=ids.get(x.id);if(old)errors.push('duplicate ID '+x.id+' in '+old+' and '+file);else ids.set(x.id,file);
  if(x.status==='enabled'&&(!x.prompt||!x.answer))errors.push(file+': incomplete enabled question '+x.id);
  if(x.status!=='enabled')continue;
  const rawStim=typeof x.stimulus==='string'?x.stimulus:JSON.stringify(x.stimulus||{});
  // For matching/sorting, answer pairs are the stimulus: the shared heading alone is not a duplicate.
  const structured=['matching','sorting','sequence','diagram_label'].includes(x.format)?JSON.stringify(x.answer||x.options||{}):'';
  const fp=[clean(x.prompt),clean(rawStim),clean(x.format),clean(structured)].join('|');
  const list=fingerprints.get(fp)||[];list.push({id:x.id,file});fingerprints.set(fp,list);
 }
}
const groups={};
for(const t of topics){
 const name=t.subject+' Y'+t.year;
 const g=groups[name]??={topics:0,questions:0,enabled:0,preview:0,disabled:0,independent:0,application:0,high:0,extended:0,mark4:0,eligible15:0,eligible20:0,formats:{}};
 g.topics++;for(const k of ['questions','enabled','preview','disabled','independent','application','high','extended','mark4'])g[k]+=t[k];
 g.eligible15+=Number(t.eligible15);g.eligible20+=Number(t.eligible20);
 for(const[k,v]of Object.entries(t.formats))g.formats[k]=(g.formats[k]||0)+v;
}
const dupeGroups=[...fingerprints.values()].filter(x=>x.length>1);
const examPath='content/exam-practice/gcse-20261024.json';
let exam={loaded:false,file:examPath};
if(fs.existsSync(examPath)){
 const q=JSON.parse(fs.readFileSync(examPath,'utf8')).questions||[];
 exam={loaded:true,file:examPath,questions:q.length,subjects:tally(q,x=>x.subject),marks:tally(q,x=>x.marks),lacksOneMark:!q.some(x=>x.marks===1),lacksTwoMark:!q.some(x=>x.marks===2)};
}
const flags={belowStandardMinimum:topics.filter(t=>!t.eligible15),
 standardEligibleButMasteryTooSmall:topics.filter(t=>t.eligible15&&!t.eligible20),
 zeroHigherDifficulty:topics.filter(t=>t.shallowRisk),
 noHighMarkQuestions:topics.filter(t=>t.enabled>=20&&t.mark4===0),
 exactDuplicateFingerprint:dupeGroups.slice(0,150)};
const totals={files:files.length,parsed:topics.length,questions:sum(topics,t=>t.questions),enabled:sum(topics,t=>t.enabled),
 preview:sum(topics,t=>t.preview),disabled:sum(topics,t=>t.disabled),uniqueIds:ids.size,
 standardEligibleTopics:topics.filter(t=>t.eligible15).length,
 mastery20EligibleTopics:topics.filter(t=>t.eligible20).length,
 exactDuplicateGroups:dupeGroups.length,errors:errors.length,warnings:warnings.length};
const report={version:'1.0.0',snapshot:'2026-10-26',scope:'Repository inventory only: not live iPad, not learner state',
 caveats:['Nominal eligible count excludes learner-specific answered, due, learned-topic, cross-task reservations and mode-specific limitations.',
 'Difficulty tags are not a substitute for a subject-specialist quality review.',
 'Standalone GCSE exam bank is not an integrated daily task.'],
 proposal:{taskTargets:[30,30,10,10,10,20,20,10,3,20],total:163,year7to8Vocab:25,year9Vocab:5},
 existingPlanner:{vocabOld:27,vocabYear9:3,year9Light:15,usesWeaknessAndDueSlots:true,noDailyGCSE:true},
 totals,bySubjectYear:groups,exam,flags,topics,errors,warnings};
const arg=process.argv.indexOf('--output');
if(arg>=0&&process.argv[arg+1]){const output=process.argv[arg+1];fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log('AUDIT '+JSON.stringify(totals));
for(const[name,g]of Object.entries(groups))console.log('SUBJECT '+name+' '+JSON.stringify(g));
for(const[name,rows]of Object.entries(flags))console.log('FLAG '+name+': '+rows.length+' '+JSON.stringify(rows.slice(0,8).map(x=>x.topicId||x[0]?.id)));
console.log('EXAM '+JSON.stringify(exam));for(const e of errors.slice(0,25))console.error('ERROR '+e);
if(process.argv.includes('--strict')&&errors.length)process.exitCode=1;
