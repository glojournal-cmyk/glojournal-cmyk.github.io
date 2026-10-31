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
import {triageDailyV2Sources} from '../src/source-triage.js';
import {auditDailyV2ReleaseCapacity} from '../src/release-capacity.js';

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
 const catalog=parse(join(root,'content/catalog.json'));
 const certsPresent=existsSync(certFile),taughtPresent=existsSync(taughtFile);
 const certifications=certsPresent?parse(certFile):{};
 const taughtEvidence=taughtPresent?parse(taughtFile):[];
 const taughtTopicIds=certifiedTaughtTopicIds(taughtEvidence);
 const adapted=adaptCertifiedDailyV2Bank({topics,certifications,includeUncertifiedDiagnostics:true});
 const sourceTriage=triageDailyV2Sources(topics);
 const thirtyDayRoleSupply=auditDailyV2ReleaseCapacity(adapted.questionBank,taughtTopicIds);
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
 // Metadata totals alone cannot identify which existing lesson file is absent.
 // Resolve each catalog topic to an actual loaded, subject/year-matched JSON.
 const keyOf=t=>[t?.subject,t?.year,t?.topicId].map(String).join('|');
 const loadedKeys=new Map(),catalogKeys=new Map();
 for(const t of topics){const key=keyOf(t);loadedKeys.set(key,(loadedKeys.get(key)||0)+1);}
 for(const t of catalog.topics||[]){const key=keyOf(t);catalogKeys.set(key,(catalogKeys.get(key)||0)+1);}
 const missingSeen=new Set(),unlistedSeen=new Set();
 const missingSources=(catalog.topics||[]).filter(t=>{
   const key=keyOf(t);
   if(loadedKeys.has(key)||missingSeen.has(key))return false;
   missingSeen.add(key);return true;
  }).map(t=>({topicId:t.topicId,subject:t.subject,year:t.year,status:t.status||null,
    catalogEnabled:t.enabled??null}));
 const unlistedSources=topics.filter(t=>{
   const key=keyOf(t);
   if(catalogKeys.has(key)||unlistedSeen.has(key))return false;
   unlistedSeen.add(key);return true;
  }).map(t=>({topicId:t.topicId,subject:t.subject,year:t.year,status:t.status||null}));
 const duplicateSourceTopics=[...loadedKeys].filter(([,n])=>n>1)
  .map(([key,n])=>({key,count:n}));
 const duplicateCatalogTopics=[...catalogKeys].filter(([,n])=>n>1)
  .map(([key,n])=>({key,count:n}));
 const supported=new Set(['latin','french','biology','chemistry','physics']);
 const outsideV2=topics.filter(t=>t.status==='enabled'&&!supported.has(t.subject))
  .reduce((n,t)=>n+t.questions.filter(q=>q&&q.status!=='disabled'&&
     q.status!=='preview'&&q.preview!==true&&q.formal!==false&&!q._repair).length,0);
 const catalogDisagreements=(catalog.bySubjectYear||[]).map(entry=>{
  const key=String(entry.subject)+'-y'+String(entry.year);
  const loaded=loadedBySubjectYear[key]||{topics:0,questions:0};
  return {subjectYear:key,catalogTopics:entry.topics,sourceFiles:loaded.topics,
   catalogEnabled:entry.enabled,sourceEligible:loaded.questions,
   topicDelta:loaded.topics-entry.topics,eligibleDelta:loaded.questions-entry.enabled};
 }).filter(entry=>entry.topicDelta!==0||entry.eligibleDelta!==0);
 return {
  system:'Daily V2 isolated real-source capacity audit',date:day,
  productionAffected:false,learnerDataRead:false,learnerHistoryAvailable:false,
  sourceTopicFiles:topics.length,sourceEligible:adapted.summary.scanned,
  sourceTriage,
  sourceBySubjectYear:loadedBySubjectYear,
  catalogMetadata:{topics:catalog.totals?.topics??null,
   actualTopicRows:(catalog.topics||[]).length,
   declaredVsListedTopicDelta:(catalog.totals?.topics??(catalog.topics||[]).length)-(catalog.topics||[]).length,
   enabledQuestions:catalog.totals?.enabled??null,
   filesVsCatalogTopics:topics.length-(catalog.totals?.topics??topics.length),
   eligibleVsCatalogEnabled:adapted.summary.scanned-(catalog.totals?.enabled??adapted.summary.scanned),
   subjectYearDisagreements:catalogDisagreements,
   uniqueSourceTopicKeys:loadedKeys.size,uniqueCatalogTopicKeys:catalogKeys.size,
   missingSources,unlistedSources,duplicateSourceTopics,duplicateCatalogTopics,
   supportedV2SubjectEligible:adapted.summary.scanned-outsideV2,
   unsupportedSubjectEligible:outsideV2},
  certificationManifestPresent:certsPresent,taughtEvidencePresent:taughtPresent,
  certifiedTaughtTopics:taughtTopicIds.length,
  bank:{certified:adapted.summary.certified,rejected:adapted.summary.rejected,
   unclassified:adapted.summary.unclassified,byRole:adapted.summary.byRole,
   errors:adapted.errors.slice(0,20)},
  preflight:{status:plan.status,validatedQuestions:plan.preflight.validatedQuestions,
   plannedQuestions:plan.preflight.plannedQuestions,
   blockedTasks:plan.availability.filter(t=>t.state!=='available')},
  thirtyDayRoleSupply,
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
