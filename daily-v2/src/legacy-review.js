/* Daily V2 — read-only legacy reconciliation report.
 * No student records are mutated. Missing question/concept identities are NOT
 * manufactured. Actual backup schemas must be audited before enabling cutover.
 */
const TASK_IDS=new Set([
 'latin-vocab','french-vocab','latin-standard','french-standard','science-standard',
 'mastery-a','mastery-b','spaced-retention','gcse-exam-skills','year9-progressive'
]);
const taskKind=id=>id.endsWith('-vocab')?'vocab':'ordinary';
function validDay(day){return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day);}
function numericCounts(row){
 const result=[];
 for(const k of ['verifiedCorrectSlots','progress','correctCount']){
  const v=row[k];
  if(v!==undefined&&v!==null){
   if(!Number.isInteger(v)||v<0)throw Error('DailyV2 migration invalid '+k);
   result.push({source:k,count:v});
  }
 }
 return result;
}
/** Input contains user-selected mappings and normalized evidence from a copied
 * backup. Date and concept/question identity must be explicitly proved by the
 * caller, NOT guessed by parsing question ID spelling.
 */
export function reviewLegacyDailyV2Import({
 day,legacyRows=[],taskMap={},targetByTask={},sourceName='legacy-backup-copy'
}={}){
 if(!validDay(day)||!Array.isArray(legacyRows))throw Error('DailyV2 migration invalid date/rows');
 const byTask=new Map(),issues=[],ignored=[];
 for(const row of legacyRows){
  if(!row||typeof row!=='object')continue;
  const oldId=row.taskId;
  const id=taskMap[oldId]|| (TASK_IDS.has(oldId)?oldId:null);
  if(!id||!TASK_IDS.has(id)){ignored.push({sourceTaskId:oldId||null,reason:'UNMAPPED_LEGACY_TASK'});continue;}
  if((row.day||row.planDate)!==day){
   issues.push({taskId:id,code:'LEGACY_DATE_NOT_VERIFIED',sourceTaskId:oldId||null});continue;
  }
  let counts;
  try{counts=numericCounts(row);}catch{
   issues.push({taskId:id,code:'INVALID_LEGACY_SCORE'});continue;
  }
  if(!counts.length){issues.push({taskId:id,code:'MISSING_LEGACY_SCORE'});continue;}
  const count=Math.max(...counts.map(x=>x.count));
  const kind=taskKind(id);
  // Crucially, historical Question IDs are not vocabulary Concept IDs.
  const keyField=kind==='vocab'?'verifiedCorrectConceptIds':'verifiedCorrectQuestionIds';
  const names=row[keyField];
  const keys=Array.isArray(names)?[...new Set(names.filter(s=>typeof s==='string'&&s.trim()).map(String))]:[];
  const t=targetByTask[id];
  if(t!==undefined&& (!Number.isInteger(t)||t<1||count>t)){
   issues.push({taskId:id,code:'COUNT_EXCEEDS_OR_INVALID_NEW_TARGET',count,target:t});continue;
  }
  const found=byTask.get(id);
  if(found){
   if(found.count!==count)issues.push({taskId:id,code:'DIVERGENT_LEGACY_COUNTERS',counts:[found.count,count]});
   found.count=Math.max(found.count,count);
   found.knownKeys=[...new Set([...found.knownKeys,...keys])];
   found.sourceRows++;
  }else byTask.set(id,{count,knownKeys:keys,sourceRows:1});
  if(counts.some(x=>x.count!==count))issues.push({taskId:id,code:'LEGACY_SCORE_FIELD_DISAGREEMENT',counts});
 }
 const legacyBaselines={},reconciliation=[];
 for(const [id,row] of byTask){
  if(row.knownKeys.length>row.count){
   issues.push({taskId:id,code:'MORE_KNOWN_IDENTITIES_THAN_CREDITS',
    count:row.count,identityCount:row.knownKeys.length});
   // An impossible baseline must be investigated before import; no silent clamping.
   continue;
  }
  legacyBaselines[id]={count:row.count,knownKeys:[...row.knownKeys]};
  reconciliation.push({taskId:id,count:row.count,knownIdentities:row.knownKeys.length,
   opaque:row.count>row.knownKeys.length,unprovenIdentities:row.count-row.knownKeys.length});
 }
 return {
  status:issues.length||reconciliation.some(x=>x.opaque)?'requires-review':'ready-for-staging-import',
  day,sourceName,legacyBaselines,reconciliation,issues,ignored,
  readOnly:true,
  productionMigrationAuthorized:false
 };
}
