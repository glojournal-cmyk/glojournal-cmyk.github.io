/* Daily V2 catalog integrity audit — pure QA, no source catalog writes.
 * A fast content/catalog.json summary is NOT the authoritative supply for
 * question assignment. Only the loaded, eligible, uniquely identified bank
 * can determine actual usable capacity, after student history exclusions.
 */
export function auditDailyV2CatalogIntegrity({catalog,sourceRows,subjects=[
 'latin','french','biology','chemistry','physics'],year=8}={}){
 if(!catalog||!Array.isArray(catalog.topics)||!Array.isArray(sourceRows))
  throw Error('DailyV2 catalog audit: valid catalog and real source rows required');
 const entries=catalog.topics.filter(t=>subjects.includes(t.subject)&&Number(t.year)===year&&t.status==='enabled');
 const seen=new Set(),counts=new Map(),duplicates=[],invalid=[];
 for(const row of sourceRows){
  if(!row||typeof row.topicId!=='string'||!row.topicId.trim()||!Number.isInteger(row.n)||row.n<0
    ||typeof row.sha!=='string'||!row.sha.trim()){
   invalid.push({topicId:row?.topicId||null,code:'INVALID_OR_MISSING_SOURCE_SNAPSHOT'});
   continue;
  }
  if(seen.has(row.topicId)){duplicates.push(row.topicId);continue;}
  seen.add(row.topicId);counts.set(row.topicId,row);
 }
 const mismatches=[],missing=[];
 for(const t of entries){
  const actual=counts.get(t.topicId);
  if(!actual){missing.push(t.topicId);continue;}
  if(Number(t.enabled)!==actual.n){
   mismatches.push({topicId:t.topicId,subject:t.subject,
    catalogEnabled:Number(t.enabled),loadedEligible:actual.n,
    delta:actual.n-Number(t.enabled),sourceBlobSha:actual.sha});
  }
 }
 const eligible=entries.reduce((sum,t)=>sum+(counts.get(t.topicId)?.n||0),0);
 return {
  status:missing.length||duplicates.length||invalid.length||mismatches.length?'requires-reconciliation':'source-counts-aligned',
  topicsExpected:entries.length,topicsWithSnapshots:entries.length-missing.length,
  nominalCatalogEnabled:entries.reduce((n,t)=>n+Number(t.enabled||0),0),
  actualEligibleLoaded:eligible,mismatches,missing,duplicates,invalid,
  mayUseCatalogCountsForDailyPlanning:false,
  // Even a perfect metadata match doesn't qualify 20 genuine Mastery questions.
  masteryCurriculumCertified:false,
  note:'Use loaded eligible Question IDs and verified pupil history, never nominal catalog count.'
 };
}
