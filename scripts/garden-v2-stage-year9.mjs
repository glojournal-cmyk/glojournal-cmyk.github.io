#!/usr/bin/env node
// Explicit offline staging only. Does not run against deployed app, current topic bank or any learner store.
// Usage: unzip Garden_V2_Year9_Mastery_990Q_QA2.zip -d /tmp/v2-qa2
//        node scripts/garden-v2-stage-year9.mjs /tmp/v2-qa2 /tmp/v2-stage
import fs from 'node:fs';
import path from 'node:path';
import {auditV2Year9Topic,summarizeV2Year9Staging} from '../src/garden-v2/year9-staging-audit.mjs';
const [source,destination]=process.argv.slice(2);
if(!source||!destination)throw Error('Need extracted QA2 source directory and explicit draft-only destination directory');
const input=path.resolve(source,'topics'),output=path.resolve(destination);
if(output===path.resolve('content/topics')||output.startsWith(path.resolve('content/topics')+path.sep))
 throw Error('Cannot import Year9 draft over live topic directory');
if(output===path.resolve(source)||output.startsWith(path.resolve(source)+path.sep))
 throw Error('Destination cannot be source directory');
const codes=Object.entries({M:5,C:6,B:6,P:7,F:7,L:2}).flatMap(([p,n])=>Array.from({length:n},(_,i)=>p+(i+1)));
const topics=codes.map(code=>JSON.parse(fs.readFileSync(path.join(input,code+'.json'),'utf8')));
const result=summarizeV2Year9Staging(topics);
if(!result.ok)throw Error('Year9 staging validation failed: '+JSON.stringify(result.errors));
for(const topic of topics){
 const audit=auditV2Year9Topic(topic);if(!audit.ok)throw Error('Invalid '+topic.topicCode);
 if(topic.questions.some(q=>q.status==='enabled'))throw Error('Enabled draft question found');
}
fs.mkdirSync(output,{recursive:true});
for(const topic of topics)
 fs.writeFileSync(path.join(output,topic.topicCode+'.json'),JSON.stringify(topic,null,2)+'\n');
console.log(JSON.stringify({destination:output,topicCount:result.topicCount,questionCount:result.questionCount,status:'DRAFT_NOT_LIVE'}));
