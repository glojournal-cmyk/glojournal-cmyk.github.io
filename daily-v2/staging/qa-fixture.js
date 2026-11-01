/* SIMULATED QUESTIONS ONLY. Not educational curriculum content.
 * Fixtures are separate from any real user's question bank or progress.
 * Never import old App localStorage or production IndexedDB keys.
 */
export const STAGING_DAY='2026-10-26';
export const STAGING_EXPECTED='QA_OK';

export function createStagingFixture({scenario='ready',day=STAGING_DAY}={}){
 if(!['ready','missing-gcse'].includes(scenario))throw Error('Unknown QA scenario');
 const questionBank=[],priorAttempts=[],taughtTopicIds=[
  'qa-latin-y9-vocab','qa-french-y9-vocab','qa-biology-y9-progressive'
 ];
 const add=(id,subject,year,topicId,role,more={})=>{
  questionBank.push({id,subject,year,topicId,roles:[role],status:'enabled',
   formal:true,prompt:'QA ONLY — '+id,stimulus:{text:'Simulated item '+id},
   ...more});
 };
 // Two independent 20-question Mastery topics with 4/10/6 difficulty bands.
 for(const [prefix,subject] of [['qa-ma','chemistry'],['qa-mb','physics']]){
  for(const [band,count] of [['foundation',4],['application',10],['challenge',6]])
   for(let i=0;i<count;i++)add(prefix+'-'+band+'-'+i,subject,8,prefix+'-topic','mastery',{depthBand:band});
 }
 // Standard language skills may come from several topics.
 for(const lang of ['latin','french']){
  const skills=lang==='latin'?{grammar:4,translation:3,passage:3}:{grammar:4,translation:3,writing:3};
  for(const [skill,count] of Object.entries(skills))
   for(let i=0;i<count;i++)add('qa-'+lang+'-'+skill+'-'+i,lang,8,'qa-'+lang+'-'+skill,
      lang+'-standard',{skill});
 }
 for(let i=0;i<10;i++)add('qa-science-'+i,'biology',8,'qa-science-standard','science-standard');
 for(const [band,count] of [['foundation',6],['application',11],['challenge',3]])
  for(let i=0;i<count;i++)add('qa-y9-'+band+'-'+i,'biology',9,
    'qa-biology-y9-progressive','year9-progressive',{depthBand:band});
 for(const lang of ['latin','french']){
  for(let i=0;i<25;i++)add('qa-'+lang+'-v8-'+i,lang,8,
    'qa-'+lang+'-v8-vocab',lang+'-vocab',{conceptId:lang+'-vocab-y8-'+i});
  for(let i=0;i<5;i++)add('qa-'+lang+'-v9-'+i,lang,9,
    'qa-'+lang+'-y9-vocab',lang+'-vocab',{conceptId:lang+'-vocab-y9-'+i});
 }
 for(let i=0;i<10;i++){
  const id='qa-historical-'+i;
  add(id,'biology',8,'qa-historical-source','retention-source');
  priorAttempts.push({eventId:'qa-history-'+i,day:'2026-10-01',taskId:'previous-day',
    questionId:id,correct:i%2===0,persisted:true});
 }
 for(const marks of [1,2,3]){
  if(scenario==='missing-gcse'&&marks===3)continue;
  add('qa-gcse-'+marks,'physics',8,'qa-gcse-exclusive','gcse',{
    marks,markScheme:Array.from({length:marks},(_,i)=>'SIMULATED mark point '+(i+1))
  });
 }
 return {day,questionBank,priorAttempts,taughtTopicIds};
}
