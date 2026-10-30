/**
 * Read-only actual source compatibility audit for Phase 1 objective previews.
 * A generated expected response checks the deterministic marking contract,
 * NOT independent curricular correctness or a learner's work.
 */
import {readFileSync,readdirSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {previewDailyV2ObjectiveScore} from '../src/objective-scorer.js';

const MODES=new Set(['numeric','pair_map','category_map','unordered_required_groups']);
const SUBJECTS=new Set(['latin','french','biology','chemistry','physics']);
const active=q=>q&&q.status!=='disabled'&&q.status!=='preview'&&q.preview!==true&&
 q.formal!==false&&!q._repair;
function canonical(a){
 // Test the actually displayed model answer, not a response regenerated
 // from the same answer.value being audited. This catches wrong published
 // answers like 540/200 labelled "3" despite the numeric source being 2.7.
 if(a.mode==='numeric')return typeof a.modelAnswer==='string'&&a.modelAnswer.trim()?
  a.modelAnswer:{value:a.value,unit:a.units?.[0]??''};
 if(a.mode==='pair_map')return Object.fromEntries(a.pairs.map(p=>{
  if(a.totalMarks===a.pairs.length*2){
   const parts=p.right.includes(' -> ')?p.right.split(/\s+->\s+/):
    p.right.includes(';')?p.right.split(/\s*;\s*/):[];
   if(parts.length===2)return [p.left,parts.map(x=>x.split(/\s*\/\s*/)[0])];
  }
  return [p.left,p.right.split(/\s+\/\s+/)[0]];
 }));
 if(a.mode==='category_map')return Object.fromEntries(
  Object.entries(a.categories).flatMap(([label,items])=>items.map(x=>[String(x),label])));
 // Groups saying "two different harms" deliberately share alternatives.
 // Manufacture DISTINCT correct examples for QA, not the same headword twice.
 const groups=a.requiredGroups,assignments=new Map();
 const normalize=x=>String(x).normalize('NFKC').toLowerCase().trim();
 function assign(group,seen){
  for(const alternative of groups[group].alternatives){
   const key=normalize(alternative);
   if(seen.has(key))continue;
   seen.add(key);
   if(!assignments.has(key)||assign(assignments.get(key).group,seen)){
    assignments.set(key,{group,answer:alternative});return true;
   }
  }
  return false;
 }
 const matches=groups.reduce((n,_g,i)=>n+Number(assign(i,new Set())),0);
 if(matches!==groups.length)return groups.map(g=>g.alternatives[0]);
 return [...assignments.values()].sort((a,b)=>a.group-b.group).map(x=>x.answer);
}
function deliberatelyWrong(answer,correct){
 const candidate=JSON.parse(JSON.stringify(correct));
 if(answer.mode==='numeric'){
  return {value:answer.value+Math.max(1,2*(answer.tolerance??0)+1),
   unit:answer.units?.[0]??''};
 }
 const first=Object.keys(candidate)[0];
 if(answer.mode==='pair_map'||answer.mode==='category_map'){
  if(first===undefined)return candidate;
  if(Array.isArray(candidate[first]))candidate[first][0]='__impossible_wrong_field__';
  else candidate[first]='__impossible_wrong_assignment__';
  return candidate;
 }
 if(Array.isArray(candidate)&&candidate.length)candidate[0]='__impossible_wrong_group__';
 return candidate;
}
export function auditObjectiveSourceQuestions(topics){
 if(!Array.isArray(topics))throw Error('DailyV2 objective audit: topic array required');
 const byMode={},samples=[],allQuestionIds=new Set();
 let eligible=0,fullPreview=0,reviewRequired=0,errors=0,
  negativeChecks=0,negativeFalseFull=0;
 for(const topic of topics){
  if(!topic||topic.status!=='enabled'||!SUBJECTS.has(topic.subject))continue;
  if(!Array.isArray(topic.questions))throw Error('DailyV2 objective audit: invalid source topic');
  for(const question of topic.questions){
   if(!active(question)||!MODES.has(question.answer?.mode))continue;
   eligible++;
   const mode=question.answer.mode;
   const counts=byMode[mode]||(byMode[mode]={scanned:0,fullPreview:0,reviewRequired:0,error:0});
   counts.scanned++;
   let status,detail;
   try{
    if(allQuestionIds.has(question.id))throw Error('duplicate question ID');
    allQuestionIds.add(question.id);
    const r=previewDailyV2ObjectiveScore({topic,question,response:canonical(question.answer)});
    if(r.releaseGrade!==false||r.ledgerEligible!==false)throw Error('Unsafe release flag');
    const wrong=previewDailyV2ObjectiveScore({topic,question,
     response:deliberatelyWrong(question.answer,canonical(question.answer))});
    negativeChecks++;
    if(wrong.correct===true||wrong.marksEarned===wrong.marksPossible||
       wrong.releaseGrade!==false||wrong.ledgerEligible!==false){
     negativeFalseFull++;throw Error('deliberately wrong source answer got full or releasable credit');
    }
    if(r.marksEarned===r.marksPossible&&r.correct===true&&r.reviewRequired===false){
     fullPreview++;counts.fullPreview++;continue;
    }
    status='review-required';detail=r.reason??'derived expected response was not fully creditable';
    reviewRequired++;counts.reviewRequired++;
   }catch(e){
    status='error';detail=String(e?.message||e);
    errors++;counts.error++;
   }
   if(samples.length<30)samples.push({topicId:topic.topicId,questionId:question.id,
    subject:topic.subject,year:topic.year,mode,status,detail});
  }
 }
 return {
  system:'Daily V2 real-source objective scorer compatibility QA',
  eligible,fullPreview,reviewRequired,errors,negativeChecks,negativeFalseFull,byMode,samples,
  autoCertified:0,releaseReady:false,learnerDataRead:false,sourceModified:false,
  limitations:[
   'Generated responses from source answers only check scoring compatibility, not educational correctness.',
   'A partial or incorrect learner answer can require independent review, particularly numeric working.',
   'All scoring results remain staging previews and never award student credit.',
   'Individual content and scoring rubric certification and iPad verification remain release blockers.'
  ]
 };
}
export function runObjectiveSourceAudit(){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
 const dir=join(root,'content/topics');
 const topics=readdirSync(dir).filter(n=>n.endsWith('.json')).sort()
  .map(n=>JSON.parse(readFileSync(join(dir,n),'utf8')));
 return auditObjectiveSourceQuestions(topics);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 process.stdout.write(JSON.stringify(runObjectiveSourceAudit(),null,2)+'\n');
