/**
 * Build a human-review queue for EVERY actual checked-in objective Daily V2 source.
 * This is an independent school-curriculum / marking worksheet, NEVER a
 * certification manifest. No learner data, student IDs, grades or keys.
 *
 * node daily-v2/scripts/build-objective-review-queue.mjs --out <folder>
 * Without --out the script prints a concise JSON summary, and writes nothing.
 */
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {fingerprintDailyV2Source} from '../src/bank-adapter.js';
import {auditObjectiveSourceQuestions} from './qa-objective-scorer.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const sourceDir=join(root,'content/topics');
const MODES=new Set(['numeric','pair_map','category_map','unordered_required_groups']);
const SUBJECTS=new Set(['latin','french','biology','chemistry','physics']);
const str=x=>typeof x==='string'&&x.trim().length>0;
const active=q=>q&&q.status!=='disabled'&&q.status!=='preview'&&
 q.preview!==true&&q.formal!==false&&!q._repair;
const stable=x=>JSON.stringify(x??null);
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const normal=x=>String(x).normalize('NFKC').toLowerCase().trim();
const sourceMaterial=(t,q)=>[
 t?.topicId,t?.subject,t?.year,q?.id,q?.topicId,q?.format,q?.prompt,
 q?.stimulus,q?.options,q?.answer,q?.markScheme
];
function ceil(a){
 if(Number.isInteger(a?.totalMarks))return a.totalMarks;
 if(a?.mode==='numeric')return 1;
 if(a?.mode==='pair_map')return a.pairs?.length??null;
 if(a?.mode==='category_map')return Object.values(a.categories||{}).
  reduce((n,x)=>n+(Array.isArray(x)?x.length:0),0);
 if(a?.mode==='unordered_required_groups')return a.requiredGroups?.length??null;
 return null;
}
function flags(t,q){
 const a=q.answer||{},result=[];
 if(t.year===9||Number(t.year)===9)result.push('YEAR9_TAUGHT_STATUS_UNVERIFIED');
 if(!str(q.prompt))result.push('MISSING_PROMPT');
 if(str(q.topicId)&&q.topicId!==t.topicId)result.push('TOPIC_ID_MISMATCH');
 if(a.mode==='numeric'){
  result.push('NUMERIC_TOLERANCE_AND_UNITS_REVIEW');
  if((a.totalMarks||1)>1||str(a.working))
   result.push('WORKING_METHOD_MARKS_NEED_REVIEW');
 }else if(a.mode==='pair_map'){
  result.push('MATCHING_SOURCE_PAIRS_REVIEW');
  if(a.totalMarks===a.pairs?.length*2)
   result.push('TWO_INDEPENDENT_COMPONENTS_PER_PAIR');
  if(a.pairs?.some(x=>/\s*\/\s*/.test(x.right)))
   result.push('ALTERNATE_MATCHING_LABELS_REVIEW');
 }else if(a.mode==='category_map'){
  result.push('CATEGORY_DEFINITIONS_REVIEW');
 }else if(a.mode==='unordered_required_groups'){
  result.push('DISTINCT_ANSWER_MEANINGS_REVIEW');
  const groups=a.requiredGroups||[];
  for(let i=0;i<groups.length;i++){
   for(let j=i+1;j<groups.length;j++){
    if(groups[i].alternatives?.some(x=>
      groups[j].alternatives?.some(y=>normal(x)===normal(y)))){
     result.push('OVERLAPPING_ACCEPTED_ALTERNATIVES');i=groups.length;break;
    }
   }
  }
 }
 const markCeiling=ceil(a);
 if(!Number.isInteger(markCeiling)||markCeiling<1)result.push('INVALID_MARK_CEILING');
 if(a.mode==='pair_map'&&Number.isInteger(a.totalMarks)&&
  ![a.pairs?.length,2*a.pairs?.length].includes(a.totalMarks))
  result.push('PAIR_MARK_COUNT_NEEDS_REPAIR');
 return [...new Set(result)];
}
function rowFor(topic,question,sourceFile){
 const warnings=flags(topic,question);
 return {
  sourceFile,subject:topic.subject,year:Number(topic.year),
  topicId:topic.topicId,questionId:question.id,format:question.format||null,
  sourceFingerprint:fingerprintDailyV2Source(topic,question),
  sourceSha256:hash(sourceMaterial(topic,question)),
  answerMode:question.answer.mode,markCeiling:ceil(question.answer),
  prompt:question.prompt,stimulus:question.stimulus||null,
  options:question.options||null,markingRubric:question.answer,
  flags:warnings,
  priority:warnings.includes('PAIR_MARK_COUNT_NEEDS_REPAIR')||
   warnings.includes('INVALID_MARK_CEILING')?'source-repair':
   warnings.includes('TWO_INDEPENDENT_COMPONENTS_PER_PAIR')||
   warnings.includes('WORKING_METHOD_MARKS_NEED_REVIEW')||
   warnings.includes('OVERLAPPING_ACCEPTED_ALTERNATIVES')?'high':'normal',
  // Fixed, unambiguous release gate. Human review must be genuinely done
  // outside this generated worksheet; never auto-fill review identities.
  curriculumDecision:'pending',curriculumReviewer:'',curriculumReviewedAt:'',
  curriculumEvidence:'',scorerDecision:'pending',scorerReviewer:'',
  scorerReviewedAt:'',scoringEvidence:'',taughtEvidence:'',
  requestedDailyRole:'',reviewNotes:'',
  curriculumCertified:false,scorerCertified:false,approvedForDaily:false
 };
}
export function buildObjectiveReviewQueue(sources){
 if(!Array.isArray(sources))throw Error('DailyV2 review queue: sources must be an array');
 const rows=[],topics=[],seen=new Set(),duplicateIds=[];
 for(const source of [...sources].sort((a,b)=>a.sourceFile.localeCompare(b.sourceFile))){
  const topic=source.topic;
  if(!topic||topic.status!=='enabled'||!SUBJECTS.has(topic.subject))continue;
  if(!Array.isArray(topic.questions))throw Error('DailyV2 review queue: invalid topic '+source.sourceFile);
  topics.push(topic);
  for(const question of topic.questions){
   if(!active(question)||!MODES.has(question.answer?.mode))continue;
   if(!str(question.id))throw Error('DailyV2 review queue: source question without ID');
   if(seen.has(question.id))duplicateIds.push(question.id);
   seen.add(question.id);
   rows.push(rowFor(topic,question,source.sourceFile));
  }
 }
 rows.sort((a,b)=>a.sourceFile.localeCompare(b.sourceFile)||
  a.questionId.localeCompare(b.questionId));
 const technical=auditObjectiveSourceQuestions(topics);
 if(technical.eligible!==rows.length)
  throw Error('DailyV2 review queue: source audit and review list disagree');
 const count=(key,value)=>rows.filter(r=>r[key]===value).length;
 const riskCounts={};
 for(const r of rows)for(const f of r.flags)riskCounts[f]=(riskCounts[f]||0)+1;
 const summary={
  reviewType:'HUMAN_REVIEW_REQUIRED_NOT_A_CERTIFICATION',
  sourceQuestions:rows.length,sourceFiles:new Set(rows.map(x=>x.sourceFile)).size,
  byMode:Object.fromEntries([...MODES].map(m=>[m,count('answerMode',m)])),
  bySubject:Object.fromEntries([...SUBJECTS].map(s=>[s,count('subject',s)])),
  byPriority:{'source-repair':count('priority','source-repair'),
   high:count('priority','high'),normal:count('priority','normal')},
  riskCounts,duplicateIds,
  technicalPreview:{eligible:technical.eligible,
   fullPreview:technical.fullPreview,reviewRequired:technical.reviewRequired,
   errors:technical.errors,negativeFalseFull:technical.negativeFalseFull},
  curriculumCertified:0,scorerCertified:0,approvedForDaily:0,
  releaseReady:false,learnerDataRead:false,
  explanation:'Each item needs independent educational and scorer approval; passing source-derived tests is not a human certification.'
 };
 return {schemaVersion:1,summary,rows};
}
export function loadObjectiveReviewQueue(){
 return buildObjectiveReviewQueue(readdirSync(sourceDir).filter(x=>x.endsWith('.json'))
  .sort().map(filename=>({sourceFile:'content/topics/'+filename,
   topic:JSON.parse(readFileSync(join(sourceDir,filename),'utf8'))})));
}
const COLUMNS=[
 'sourceFile','subject','year','topicId','questionId','format',
 'sourceFingerprint','sourceSha256','answerMode','markCeiling','prompt',
 'stimulus','options','markingRubric','flags','priority',
 'curriculumDecision','curriculumReviewer','curriculumReviewedAt',
 'curriculumEvidence','scorerDecision','scorerReviewer','scorerReviewedAt',
 'scoringEvidence','taughtEvidence','requestedDailyRole','reviewNotes',
 'curriculumCertified','scorerCertified','approvedForDaily'
];
function csvValue(value){
 const raw=typeof value==='string'?value:stable(value);
 // Spreadsheet injection (Excel, Sheets) protection for prompt and rubric
 // text entered by untrusted topic authors. Review sheets are text-only.
 const cleaned=/^[\s]*[=+\-@]/.test(raw)?"'"+raw:raw;
 return '"'+cleaned.replace(/"/g,'""')+'"';
}
export function reviewQueueCsv(queue){
 if(!queue?.rows||!Array.isArray(queue.rows))throw Error('DailyV2 review queue: rows missing');
 return COLUMNS.map(csvValue).join(',')+'\r\n'+
  queue.rows.map(r=>COLUMNS.map(col=>csvValue(r[col])).join(',')).join('\r\n')+'\r\n';
}
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 const queue=loadObjectiveReviewQueue();
 const index=process.argv.indexOf('--out');
 if(index!==-1){
  const dir=process.argv[index+1];
  if(!dir||dir.startsWith('--'))throw Error('DailyV2 review queue: --out requires a directory');
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,'objective-human-review-queue.json'),
   JSON.stringify(queue,null,2)+'\n');
  writeFileSync(join(dir,'objective-human-review-queue.csv'),reviewQueueCsv(queue));
  writeFileSync(join(dir,'objective-review-summary.json'),
   JSON.stringify(queue.summary,null,2)+'\n');
 }
 process.stdout.write(JSON.stringify(queue.summary,null,2)+'\n');
}
