/**
 * Daily V2 — REAL-SOURCE capacity audit, safe to run in CI.
 * Reads checked-in topic files, never learner/device records and never writes.
 * Absence of independent review manifests MUST yield a blocked result.
 */
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
import {adaptCertifiedDailyV2Bank,certifiedTaughtTopicIds} from '../src/bank-adapter.js';
import {planDailyV2} from '../src/planner.js';
import {simulateDailyV2Days} from '../src/simulator.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const topicDir=join(root,'content/topics');
const reviewDir=join(root,'daily-v2/review');
const certFile=join(reviewDir,'certifications.json');
const taughtFile=join(reviewDir,'verified-taught-topics.json');
const day='2026-10-30';
const parse=(file)=>JSON.parse(readFileSync(file,'utf8'));
function inspectedFiles() {
 const names=readdirSync(topicDir).filter(n=>n.endsWith('.json')).sort();
 const topics=[];
 for(const name of names){
  const data=parse(join(topicDir,name));
  if(!data||typeof data!=='object'||!Array.isArray(data.questions))
   throw new Error('DailyV2 audit: invalid topic file '+name);
  topics.push(data);
 }
 return topics;
}
export function buildRealSourceCapacityReport() {
 const topics=inspectedFiles();
 const certsPresent=existsSync(certFile),taughtPresent=existsSync(taughtFile);
 const certifications=certsPresent?parse(certFile):{};
 const taughtEvidence=taughtPresent?parse(taughtFile):[];
 const taughtTopicIds=certifiedTaughtTopicIds(taughtEvidence);
 const adapted=adaptCertifiedDailyV2Bank({topics,certifications,includeUncertifiedDiagnostics:false});
 const args={day,questionBank:adapted.questionBank,taughtTopicIds,
  priorAttempts:[],correctQuestionIds:[]};
 const plan=planDailyV2(args);
 const simulation=simulateDailyV2Days({startDate:day,days:30,
  questionBank:adapted.questionBank,taughtTopicIds,priorAttempts:[]});
 const loadedBySubjectYear={};
 for(const topic of topics){
  if(topic.status!=='enabled')continue;
  const key=String(topic.subject)+'-y'+String(topic.year);
  const eligible=topic.questions.filter(q=>q&&q.status!=='disabled'&&q.status!=='preview'&&
   q.preview!==true&&q.formal!==false&&!q._repair).length;
  const row=loadedBySubjectYear[key]||(loadedBySubjectYear[key]={topics:0,questions:0});
  row.topics++;row.questions+=eligible;
 }
 return {
  system:'Daily V2 isolated real-source capacity audit',date:day,
  productionAffected:false,learnerDataRead:false,learnerHistoryAvailable:false,
  sourceTopicFiles:topics.length,sourceEligible:adapted.summary.scanned,
  sourceBySubjectYear:loadedBySubjectYear,
  certificationManifestPresent:certsPresent,taughtEvidencePresent:taughtPresent,
  certifiedTaughtTopics:taughtTopicIds.length,
  bank:{certified:adapted.summary.certified,rejected:adapted.summary.rejected,
   unclassified:adapted.summary.unclassified,byRole:adapted.summary.byRole,
   errors:adapted.errors.slice(0,20)},
  preflight:{status:plan.status,validatedQuestions:plan.preflight.validatedQuestions,
   plannedQuestions:plan.preflight.plannedQuestions,
   blockedTasks:plan.availability.filter(t=>t.state!=='available')},
  thirtyDay:{status:simulation.status,completedDays:simulation.completedDays,
   firstBlockedDay:simulation.firstBlockedDay||null,
   diagnostics:(simulation.diagnostics||[]).slice(0,20)},
  releaseReady:false,
  limitations:[
   'No learner answer history; 30-day simulation is not student-specific.',
   'Only independently reviewed and source-bound certified items can count.',
   'No physical iPad/Safari IndexedDB quota, reload or migration verification.',
   'Do not publish this audit as an available Daily plan.'
  ]
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 process.stdout.write(JSON.stringify(buildRealSourceCapacityReport(),null,2)+'\n');
}
