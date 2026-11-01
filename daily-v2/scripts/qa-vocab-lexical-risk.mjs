/* Read-only source triage: print enough evidence for individual human review.
 * It must NEVER mutate question JSON, award credits or mark items certified.
 */
import {loadVocabReviewQueue} from './build-vocab-review-queue.mjs';
const q=loadVocabReviewQueue();
const normalize=s=>String(s||'').normalize('NFKD').toLowerCase()
 .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const direction=row=>{
 const explicit=String(row.stimulus?.direction||'').trim();
 const prompt=row.prompt||'';
 return normalize(explicit||(
  /TRANSLATE INTO ENGLISH/i.test(prompt)?'into English':
  /TRANSLATE INTO FRENCH/i.test(prompt)?'into French':
  /TRANSLATE INTO LATIN/i.test(prompt)?'into Latin':''));};
const flags=['PLURAL_CUE_DROPPED_BY_ALTERNATIVE',
 'SAME_STIMULUS_DIFFERENT_CONCEPT_ANSWERS','DUPLICATE_CONCEPT_FOR_SAME_PROMPT'];
const plural=q.rows.filter(r=>r.flags.includes(flags[0])).map(r=>({
 id:r.questionId,conceptId:r.conceptId,source:r.sourceFile,
 stimulus:r.stimulus?.text,direction:direction(r),accepted:r.acceptedAnswers,
 format:r.format,allFlags:r.flags.filter(f=>flags.includes(f))
}));
const groups=new Map();
for(const r of q.rows.filter(r=>r.flags.some(f=>flags.slice(1).includes(f)))){
 const key=[r.subject,r.year,direction(r),normalize(r.stimulus?.text)].join('|');
 const arr=groups.get(key)||[];arr.push(r);groups.set(key,arr);
}
const collisions=[...groups].map(([key,rows])=>({
 key,ids:rows.map(r=>r.questionId),conceptIds:[...new Set(rows.map(r=>r.conceptId))],
 answerSets:[...new Set(rows.map(r=>[...new Set(r.acceptedAnswers.map(normalize))].sort().join('|')))],
 flags:[...new Set(rows.flatMap(r=>r.flags.filter(f=>flags.slice(1).includes(f))))],
 sourceFiles:[...new Set(rows.map(r=>r.sourceFile))]
})).sort((a,b)=>b.ids.length-a.ids.length||a.key.localeCompare(b.key));
const distinctByFlag=Object.fromEntries(flags.map(flag=>[flag,
 q.rows.filter(r=>r.flags.includes(flag)).length]));
const report={
 scannedRows:q.rows.length,distinctByFlag,plural,collisionGroups:collisions.length,
 collisionGroupsByType:Object.fromEntries(flags.slice(1).map(f=>[f,
  collisions.filter(g=>g.flags.includes(f)).length])),
 collisionExamples:collisions.map(({ids,...rest})=>({...rest,exampleQuestionIds:ids.slice(0,3),questionCount:ids.length})),
 certificationCount:0,readonly:true};
console.log('LEXICAL_RISK_TRIAGE_JSON',JSON.stringify(report));
