#!/usr/bin/env node
// READ ONLY: Year 9 topic-bank QA prioritisation, not a Daily allocator.
// Never touches app runtime, XP, learner history, storage or production.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const application=new Set(['controlled_translation','mark_points','extended_response','practical_design','calculation','sorting','sequence']);
const production=new Set(['controlled_translation','typed_exact','typed_equivalent','typed_short','mark_points','extended_response','practical_design','calculation','unordered_set']);
const unique=x=>new Set(x).size;
const inspect=(bank,file)=>{
 const formal=(bank.questions||[]).filter(q=>q.status==='enabled'&&q.formal!==false&&!q._repair&&
  (q.year==null||Number(q.year)===9)&&(!q.subject||q.subject===bank.subject));
 const completed=new Set(formal.slice(0,5).map(q=>q.id));
 const afterFive=formal.filter(q=>!completed.has(q.id));
 const seenIds=new Set(),dedupFormal=[];
 for(const q of formal){if(q.id&&!seenIds.has(q.id)){seenIds.add(q.id);dedupFormal.push(q)}}
 const afterFiveIds=afterFive.filter(q=>seenIds.has(q.id));
 const formats={};for(const q of formal)formats[q.format]=(formats[q.format]||0)+1;
 const row={file,topicId:bank.topicId||file.replace(/\.json$/,''),title:bank.title||'',
  subject:bank.subject||'unknown',nominal:bank.questions?.length||0,
  formal:formal.length,distinctIDs:dedupFormal.length,distinctConcepts:unique(formal.map(q=>q.conceptId||q.id)),
  afterFiveFresh:afterFiveIds.length,afterFiveDistinctConcepts:unique(afterFiveIds.map(q=>q.conceptId||q.id)),
  production:formal.filter(q=>production.has(q.format)).length,
  application:formal.filter(q=>application.has(q.format)).length,
  translation:formal.filter(q=>q.format==='controlled_translation').length,
  highDifficulty:formal.filter(q=>Number(q.difficulty)>=3).length,
  multiMark:formal.filter(q=>Number(q.answer?.totalMarks)>=2).length,
  formats};
 row.flags=[];
 if(row.formal<20)row.flags.push('BELOW_NOMINAL_MASTERY_20');
 if(row.afterFiveFresh<20)row.flags.push('BELOW_20_AFTER_FIVE_CORRECT');
 if(row.afterFiveDistinctConcepts<20)row.flags.push('BELOW_20_CONCEPTS_AFTER_FIVE');
 if(row.application===0)row.flags.push('NO_APPLICATION_FORMAT');
 if(row.highDifficulty===0)row.flags.push('NO_GRADE_8_9_DEPTH_PROXY');
 // A rank is triage only; not based on unverified taught status.
 row.priorityScore=10*Number(row.formal<20)+8*Number(row.afterFiveFresh<20)+
  5*Number(row.afterFiveDistinctConcepts<20)+3*Number(row.application===0)+
  2*Number(row.highDifficulty===0);
 return row;
};
export function buildYear9CapacityReport(directory='content/topics'){
 const paths=fs.readdirSync(directory).filter(p=>/-y9-.*\.json$/.test(p)).sort();
 const topics=paths.map(file=>inspect(JSON.parse(fs.readFileSync(path.join(directory,file),'utf8')),file));
 const bySubject={};
 for(const t of topics){const g=bySubject[t.subject]??={topics:0,formal:0,nominalMastery20:0,
  afterFive20:0,afterFive20Concepts:0,noApplication:0,highDifficulty:0};
  g.topics++;g.formal+=t.formal;g.nominalMastery20+=Number(t.formal>=20);
  g.afterFive20+=Number(t.afterFiveFresh>=20);
  g.afterFive20Concepts+=Number(t.afterFiveDistinctConcepts>=20);
  g.noApplication+=Number(t.application===0);
  g.highDifficulty+=Number(t.highDifficulty>0);
 }
 const priority=topics.filter(t=>t.flags.length).sort((a,b)=>b.priorityScore-a.priorityScore||
   a.afterFiveFresh-b.afterFiveFresh||a.topicId.localeCompare(b.topicId));
 return {snapshot:'2026-10-26',mode:'read-only repository inventory with synthetic five-prior-correct scenario',
  caveats:[
   'This is NOT a learner-specific, date-aware, or taught-syllabus-filtered availability report.',
   'Distinct conceptId is a useful proxy, not verified semantic uniqueness or a mark-scheme review.',
   'A 20-question Mastery topic needs at least 20 genuinely eligible questions after earlier successes and same-day reservations; static counts are not sufficient.',
   'No production Daily-task behaviour, scoring or user state is changed.'
  ],
  summary:{topicFiles:paths.length,bySubject,
   below20:topics.filter(t=>t.formal<20).length,
   below20AfterFive:topics.filter(t=>t.afterFiveFresh<20).length,
   below20DistinctConceptsAfterFive:topics.filter(t=>t.afterFiveDistinctConcepts<20).length,
   noApplication:topics.filter(t=>t.application===0).length},
  priority,topics};
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 const report=buildYear9CapacityReport();
 const outIndex=process.argv.indexOf('--output'),out=outIndex>=0?process.argv[outIndex+1]:null;
 if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
 console.log('YEAR9_CAPACITY '+JSON.stringify(report.summary));
 for(const [subject,g] of Object.entries(report.summary.bySubject))console.log('YEAR9_SUBJECT '+subject+' '+JSON.stringify(g));
 console.log('YEAR9_PRIORITY_TOP '+JSON.stringify(report.priority.slice(0,20).map(q=>({id:q.topicId,flags:q.flags,formal:q.formal,afterFive:q.afterFiveFresh,distinctAfterFive:q.afterFiveDistinctConcepts,application:q.application}))));
}
