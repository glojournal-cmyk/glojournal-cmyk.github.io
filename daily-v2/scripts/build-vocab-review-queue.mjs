/**
 * Human-only, source-bound Latin/French Y7-8 vocabulary REVIEW QUEUE.
 * Never certifies a curriculum, lexical meaning, scorer, taught status or XP.
 * Source questions with structured answer modes are NOT downgraded into
 * accepted-string scoring. No learner/device data is read or written.
 *
 * node daily-v2/scripts/build-vocab-review-queue.mjs --out <directory>
 * Without --out, emit only summary JSON. This is a QA worksheet, not an
 * authenticated certification or an allowed-role manifest.
 */
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {fingerprintDailyV2Source} from '../src/bank-adapter.js';
import {inspectDailyV2AnswerShape} from '../src/source-answer.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const topicDir=join(root,'content/topics');
const str=v=>typeof v==='string'&&v.trim().length>0;
const active=q=>q&&q.status!=='disabled'&&q.status!=='preview'&&
  q.preview!==true&&q.formal!==false&&!q._repair;
const sourceHash=(t,q)=>createHash('sha256').update(JSON.stringify([
 t.topicId,t.subject,t.year,q.id,q.topicId,q.format,q.prompt,q.stimulus,
 q.options,q.answer,q.markScheme
])).digest('hex');

export function buildVocabReviewQueue(sources){
 if(!Array.isArray(sources))throw Error('Vocab review requires source array');
 const rows=[],idCounts=new Map(),conceptCounts=new Map();
 let totalSource=0,structuredExcluded=0,invalidExcluded=0,missingConcept=0;
 for(const {sourceFile,topic} of sources){
  if(topic?.status!=='enabled'||!['latin','french'].includes(topic.subject)||
     ![7,8].includes(Number(topic.year)))continue;
  if(!Array.isArray(topic.questions))throw Error('Vocab review invalid topic '+sourceFile);
  for(const q of topic.questions){
   if(!active(q))continue;
   totalSource++;
   const shape=inspectDailyV2AnswerShape(q.answer);
   // A mark_points / numeric / semantic question cannot become a simple
   // vocab word merely because it happens to carry accepted[] as well.
   if(shape.structuredMode){structuredExcluded++;continue;}
   if(!shape.accepted||!str(q.id)||!str(q.prompt)){
    invalidExcluded++;continue;
   }
   if(!str(q.conceptId)){missingConcept++;continue;}
   const accepted=q.answer.accepted.filter(str);
   if(accepted.length===0){invalidExcluded++;continue;}
   const key=topic.subject+'|'+q.conceptId;
   const flags=[];
   if(str(q.topicId)&&q.topicId!==topic.topicId)flags.push('TOPIC_ID_MISMATCH');
   if(!str(q.stimulus?.text)&&!str(q.stimulus?.word)&&
      !str(q.stimulus?.term)&&!str(q.stimulus?.latin)&&
      !str(q.stimulus?.french)&&!str(q.stimulus?.english)&&
      !str(q.stimulus?.phrase))
     flags.push('STIMULUS_CONTENT_NEEDS_REVIEW');
   if(accepted.some(x=>x.includes('/')||x.includes(' / ')))
     flags.push('ALTERNATIVE_SEPARATOR_MEANING_REVIEW');
   if(accepted.some(x=>x.includes(',')||x.includes(';')))
     flags.push('MULTI_MEANING_ANSWER_REVIEW');
   if(!['typed_exact','typed_equivalent','mc_single','short_answer'].includes(q.format))
     flags.push('VOCAB_ROLE_NOT_ESTABLISHED_BY_FORMAT');
   rows.push({
    sourceFile,subject:topic.subject,year:Number(topic.year),
    topicId:topic.topicId,topicTitle:topic.title||null,
    questionId:q.id,conceptId:q.conceptId,
    sourceFingerprint:fingerprintDailyV2Source(topic,q),
    sourceSha256:sourceHash(topic,q),
    format:q.format||null,prompt:q.prompt,stimulus:q.stimulus||null,
    options:q.options||null,answerMode:q.answer.mode||null,
    acceptedAnswers:accepted,
    flags,
    curriculumDecision:'pending',curriculumReviewer:'',curriculumEvidence:'',
    scoringDecision:'pending',scoringReviewer:'',scoringEvidence:'',
    lexicalUnitVerified:false,taughtEvidence:'',
    approvedForDaily:false
   });
   idCounts.set(q.id,(idCounts.get(q.id)||0)+1);
   conceptCounts.set(key,(conceptCounts.get(key)||0)+1);
  }
 }
 rows.sort((a,b)=>a.subject.localeCompare(b.subject)||
  a.sourceFile.localeCompare(b.sourceFile)||a.questionId.localeCompare(b.questionId));
 for(const row of rows){
  if(idCounts.get(row.questionId)>1)row.flags.push('DUPLICATE_QUESTION_ID');
  if(conceptCounts.get(row.subject+'|'+row.conceptId)>1)
   row.flags.push('MULTIPLE_QUESTIONS_SAME_CONCEPT');
 }
 // Review-only lexical ambiguity checks: these are risks, not automatic
 // declarations that a translation is wrong or permission to alter marking.
 // A bare 'calculator' alongside 'calculator (plural)' loses an explicit
 // grammatical-number cue, even if a scorer currently accepts both strings.
 const normalizeReview=v=>String(v).normalize('NFKD').toLowerCase()
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const directionFor=row=>{
  const stated=String(row.stimulus?.direction||'');
  if(stated.trim())return normalizeReview(stated);
  if(/TRANSLATE INTO ENGLISH/i.test(row.prompt))return 'into english';
  if(/TRANSLATE INTO FRENCH/i.test(row.prompt))return 'into french';
  if(/TRANSLATE INTO LATIN/i.test(row.prompt))return 'into latin';
  return '';
 };
 const sharedPrompts=new Map();
 for(const row of rows){
  const pluralTagged=row.acceptedAnswers.filter(answer=>/\\(\\s*plural\\s*\\)/i.test(answer));
  if(pluralTagged.some(tag=>{
   const bare=normalizeReview(tag.replace(/\\(\\s*plural\\s*\\)/ig,''));
   return bare&&row.acceptedAnswers.some(answer=>answer!==tag&&normalizeReview(answer)===bare);
  }))row.flags.push('PLURAL_CUE_DROPPED_BY_ALTERNATIVE');
  const stimulus=normalizeReview(row.stimulus?.text||'');
  const direction=directionFor(row);
  if(!stimulus||!direction)continue;
  const key=[row.subject,row.year,direction,stimulus].join('|');
  if(!sharedPrompts.has(key))sharedPrompts.set(key,[]);
  sharedPrompts.get(key).push(row);
 }
 for(const group of sharedPrompts.values()){
  const concepts=new Set(group.map(row=>row.conceptId));
  if(concepts.size<2)continue;
  const answerSets=new Set(group.map(row=>
   [...new Set(row.acceptedAnswers.map(normalizeReview))].sort().join('|')));
  const flag=answerSets.size>1?
   'SAME_STIMULUS_DIFFERENT_CONCEPT_ANSWERS':'DUPLICATE_CONCEPT_FOR_SAME_PROMPT';
  for(const row of group)row.flags.push(flag);
 }
 const bySubject={};
 const shortlist=[];
 for(const subject of ['latin','french']){
  const sub=rows.filter(r=>r.subject===subject);
  const concepts=new Set(sub.map(r=>r.conceptId));
  const unique=new Map();
  for(const row of [...sub].sort((a,b)=>
    a.flags.length-b.flags.length||
    Number(a.year)-Number(b.year)||
    a.questionId.localeCompare(b.questionId)))
    if(!unique.has(row.conceptId))unique.set(row.conceptId,row);
  const samples=[...unique.values()].slice(0,60);
  // Reviewable shortlist is 60 proposed distinct source concepts, NOT a
  // release-ready 2-day pool. They all remain curriculum/scorer pending.
  shortlist.push(...samples);
  bySubject[subject]={
   answerShapedQuestions:sub.length,distinctSourceConceptIds:concepts.size,
   proposedTwoDayReviewShortlist:samples.length,independentlyCertified:0,
   insufficientCandidates:concepts.size<60
  };
 }
 const flagCounts={};
 for(const row of rows)for(const flag of row.flags)
   flagCounts[flag]=(flagCounts[flag]||0)+1;
 return {schemaVersion:1,
  summary:{kind:'LATIN_FRENCH_Y7_Y8_VOCAB_HUMAN_REVIEW_PENDING',
   activeLanguageSourceQuestions:totalSource,
   answerShapedReviewRows:rows.length,
   distinctReviewConcepts:Object.values(bySubject).reduce((n,x)=>n+x.distinctSourceConceptIds,0),
   structuredScoringExcluded:structuredExcluded,
   missingOrInvalidAnswerExcluded:invalidExcluded,
   missingConceptExcluded:missingConcept,
   bySubject,flagCounts,
   twoDayMinimumPerSubject:60,independentlyCertified:0,
   releaseReady:false,learnerDataRead:false,
   warning:'Source rows and shortlist are NOT approved vocabulary. Human checks of exact lexical meaning, school-taught level, reverse directions, accepted synonyms and scoring are mandatory.'},
  rows,shortlist
 };
}
export function loadVocabReviewQueue(){
 const sources=readdirSync(topicDir).filter(x=>x.endsWith('.json')).sort()
  .map(name=>({sourceFile:'content/topics/'+name,
   topic:JSON.parse(readFileSync(join(topicDir,name),'utf8'))}));
 return buildVocabReviewQueue(sources);
}
const COLUMNS=['sourceFile','subject','year','topicId','topicTitle',
 'questionId','conceptId','sourceFingerprint','sourceSha256',
 'format','prompt','stimulus','options','answerMode','acceptedAnswers','flags',
 'curriculumDecision','curriculumReviewer','curriculumEvidence',
 'scoringDecision','scoringReviewer','scoringEvidence','lexicalUnitVerified',
 'taughtEvidence','approvedForDaily'];
function csvCell(value){
 const raw=typeof value==='string'?value:JSON.stringify(value??null);
 const safe=/^\s*[=+\-@]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replace(/"/g,'""')+'"';
}
export function csvRows(rows){
 return COLUMNS.map(csvCell).join(',')+'\r\n'+
   rows.map(r=>COLUMNS.map(k=>csvCell(r[k])).join(',')).join('\r\n')+'\r\n';
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=loadVocabReviewQueue();
 const i=process.argv.indexOf('--out');
 if(i!==-1){
  const dir=process.argv[i+1];
  if(!str(dir)||dir.startsWith('--'))throw Error('Vocab review --out needs directory');
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'vocab-human-review-queue.csv'),csvRows(result.rows));
  writeFileSync(join(dir,'vocab-60-each-priority-review.csv'),csvRows(result.shortlist));
  const lexicalRiskFlags=new Set(['PLURAL_CUE_DROPPED_BY_ALTERNATIVE',
   'SAME_STIMULUS_DIFFERENT_CONCEPT_ANSWERS','DUPLICATE_CONCEPT_FOR_SAME_PROMPT']);
  const lexicalRisks=result.rows.filter(row=>row.flags.some(flag=>lexicalRiskFlags.has(flag)));
  writeFileSync(join(dir,'vocab-lexical-risk-review.csv'),csvRows(lexicalRisks));
  writeFileSync(join(dir,'vocab-review-summary.json'),
    JSON.stringify(result.summary,null,2)+'\n');
 }
 process.stdout.write(JSON.stringify(result.summary,null,2)+'\n');
}
