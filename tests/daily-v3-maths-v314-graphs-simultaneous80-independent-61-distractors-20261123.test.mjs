import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {graphNumber,auditGraphSource40} from '../assets/math-study/math-v314-source-first-graphs40-audit.js';
import {auditSimultaneous40} from '../assets/math-study/math-v314-source-first-simultaneous40-audit.js';

const read=p=>JSON.parse(readFileSync(new URL('../qa-staging/'+p,import.meta.url),'utf8'));
const bank=read('math-v311-reviewed-200.json'),triage=read('math-v311-200-item-grade-demand-triage-20261122.json');
const rationale=read('math-v314-simultaneous-61-short-distractor-path-repair-register-20261123.json');

const register=read('math-v314-graphs40-simultaneous40-source-first-pedagogical-hold-register-20261123.json');
test('80-row source identity and 20 four-item family risk register cannot manufacture Grade7+ or Mastery approval',()=>{
 assert.equal(register.kind,'MATHS_V314_80_SOURCE_FIRST_NUMERIC_QA_WITH_PEDAGOGICAL_HOLD');
 assert.equal(register.counts.questions,80);
 assert.equal(register.counts.sourceFirstCorrectKeyChecks,80);
 assert.equal(register.counts.allOptionsValueChecks,480);
 assert.equal(register.counts.shortErrorPathEditorialRepairs,61);
 assert.equal(register.counts.templateGroups,20);
 assert.equal(register.counts.grade7PlusApprovals,0);
 assert.equal(register.counts.independentConceptApprovals,0);
 assert.equal(register.counts.dailyEligible,0);
 assert.equal(register.counts.masteryEligible,0);
 assert.equal(register.groupManifest.length,20);
 assert.equal(register.rows.length,80);
 assert.equal(register.schoolPdf,'SKIPPED_PER_USER_INSTRUCTION');
 const sources=new Map([...graphs,...simultaneous].map(q=>[q.sourceId,q]));
 const derived=new Map([...auditGraphSource40(graphs),...auditSimultaneous40(simultaneous)].map(x=>[x.sourceId,x]));
 for(const row of register.rows){
  const source=sources.get(row.sourceId),oracle=derived.get(row.sourceId);
  assert.ok(source&&oracle,'Unknown ID in 80-row QA register');
  assert.equal(source.dailyEligible,false);
  assert.equal(row.academicDecision,'HOLD');
  assert.equal(row.independentGCSEGrade7PlusCertified,false);
  assert.equal(row.teacherTaughtConfirmed,false);
  assert.equal(row.independentConceptEquivalenceSigned,false);
  assert.equal(row.dailyEligible,false);
  assert.equal(row.masteryEligible,false);
  assert.equal(row.derivedCorrectOption,source.correctOptionId);
  assert.equal(row.derivedCorrectOption,oracle.key);
  assert.ok(close(row.derivedAnswer,oracle.expected??oracle.answer));
  const sourceTriage=triage.rows.find(x=>x.id===row.sourceId);
  assert.equal(row.sourceTriage,sourceTriage.triageAction);
  assert.equal(row.sourceTemplateId,sourceTriage.sourceTemplateId);
 }
 const familyCounts=new Map();
 for(const row of register.rows)familyCounts.set(row.sourceTemplateId,(familyCounts.get(row.sourceTemplateId)||0)+1);
 assert.equal(familyCounts.size,20);
 for(const count of familyCounts.values())assert.equal(count,4);
 assert.deepEqual(register.counts.triage,{
  QUARANTINE_TAUGHT_SCOPE:20,
  RETAIN_FOR_EXTERNAL_BENCHMARK:24,
  UPGRADE_STEM_FOR_G7PLUS:31,
  REWRITE_CONTEXT_OR_DUPLICATE:5
 });
});

const graphs=bank.questions.filter(q=>/GRAPHS-\d+$/.test(q.sourceId));
const simultaneous=bank.questions.filter(q=>/SIMULTANEOUS-\d+$/.test(q.sourceId));
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b));

test('80 Graphs + Simultaneous: source-first independent answer, all 480 option values and no learner credit',()=>{
 assert.equal(bank.questions.length,200);
 assert.equal(bank.questions.filter(q=>q.dailyEligible===true).length,0);
 assert.equal(graphs.length,40);assert.equal(simultaneous.length,40);
 const g=auditGraphSource40(graphs),s=auditSimultaneous40(simultaneous),all=[...g,...s];
 assert.equal(all.length,80);
 assert.equal(new Set(all.map(q=>q.sourceId)).size,80);
 assert.ok(all.every(q=>q.numericAlternativesDistinct!==false&&q.distinctNumeric!==false));
 assert.ok(all.every(q=>q.key&&Number.isFinite(q.expected??q.answer)));
 assert.equal(all.filter(q=>q.sourceId.includes('GRAPHS')).length,40);
 assert.equal(all.filter(q=>q.sourceId.includes('SIMULTANEOUS')).length,40);
 assert.deepEqual(all.filter(q=>q.sourceId.includes('GRAPHS')).filter(q=>q.wrongRouteCount!==5),[]);
 assert.deepEqual(all.filter(q=>q.sourceId.includes('SIMULTANEOUS')).filter(q=>q.wrongOptionPaths<4),[]);
 const rows=triage.rows.filter(q=>/GRAPHS|SIMULTANEOUS/.test(q.id));
 assert.equal(rows.length,80);
 assert.equal(rows.filter(q=>q.independentG7PlusCertified).length,0);
 assert.equal(rows.filter(q=>q.eligibleForMathsDaily).length,0);
 assert.equal(rows.filter(q=>q.eligibleForXPMPMasteryRecovery).length,0);
});
test('61 short original distractor descriptions: source-coefficient numeric route recreated, proposal stored separately and held',()=>{
 assert.equal(rationale.proposedRationaleRepairs,61);
 assert.equal(rationale.affectedQuestionCount,22);
 assert.equal(rationale.sourceBankUnchanged,true);
 assert.equal(rationale.sourceIncorrectOptions,200);
 assert.equal(rationale.academicApprovals,0);
 assert.equal(rationale.dailyEnabled,0);
 assert.equal(rationale.masteryEnabled,0);
 assert.equal(rationale.realPupilErrorFrequencyIndependentlyCertified,false);
 const map=new Map(simultaneous.map(q=>[q.sourceId,q]));
 const solved=new Map(auditSimultaneous40(simultaneous).map(q=>[q.sourceId,q]));
 const seen=new Set();
 for(const row of rationale.rows){
  const q=map.get(row.sourceId),data=solved.get(row.sourceId),o=q?.options.find(o=>o.id===row.optionId);
  assert.ok(q&&data&&o,'Missing exact source distractor '+row.sourceId+row.optionId);
  assert.equal(q.revisionId,row.revisionId);
  assert.equal(q.dailyEligible,false);
  assert.equal(o.latex,row.optionLatex);
  assert.equal(o.errorPath,row.originalErrorPath);
  assert.notEqual(o.id,q.correctOptionId);
  assert.ok(row.proposedErrorPath.length>50&&row.proposedErrorPath!==row.originalErrorPath);
  assert.equal(row.verifiedNumericRoute,true);
  assert.equal(row.pupilFrequencyEvidence,'NOT_VERIFIED');
  assert.equal(row.academicDecision,'HOLD');
  assert.equal(row.dailyEligible,false);
  assert.equal(row.masteryEligible,false);
  assert.ok(close(row.sourceDerivedWrongValue,graphNumber(o.latex)));
  assert.ok(close(row.displayedWrongValue,graphNumber(o.latex)));
  assert.ok(data.solution&&Number.isFinite(data.solution.x)&&Number.isFinite(data.solution.y));
  const {x,y}=data.solution,last=data.answer,kind=row.originalErrorPath;
  const target=q.stem.match(/then find \$([^$]+)\$/);
  let result;
  if(kind==='Stop after finding x.')result=x;
  else if(kind==='Stop after finding y.')result=y;
  else if(kind==='Give their difference.')result=x-y;
  else if(kind==='Reverse the sign of x.')result=target?graphNumber(target[1],{x:-x,y}):-x*y;
  else if(kind==='Reverse the sign of y.')result=target?graphNumber(target[1],{x,y:-y}):2*x*x+y;
  else if(kind==='Add one of each.')result=x+y;
  else if(kind==='Omit the y-term.')result=(last*x-3*y)/x;
  else if(kind==='Stop at kx.')result=last*x;
  else assert.fail('Unrecognised incorrect-answer error type '+kind);
  assert.ok(close(result,row.sourceDerivedWrongValue),'Wrong route does not follow source algebra '+row.sourceId+'/'+row.optionId);
  const unique=row.sourceId+'/'+row.optionId;assert.ok(!seen.has(unique));seen.add(unique);
 }
 assert.equal(seen.size,61);
 assert.equal(new Set(rationale.rows.map(r=>r.sourceId)).size,22);
});
test('adversarial source graph changes and simultaneous system tampering trigger immediate failure',()=>{
 const clone=x=>structuredClone(x);
 const cases=[];
 const graph=clone(graphs);graph[0].stem=graph[0].stem.replace('(-4,2)','(-4,3)');cases.push(()=>auditGraphSource40(graph));
 const wrongGraphKey=clone(graphs);wrongGraphKey[1].correctOptionId='A';cases.push(()=>auditGraphSource40(wrongGraphKey));
 const sim=clone(simultaneous);sim[0].stem=sim[0].stem.replace('2x+3y=7','2x+3y=8');cases.push(()=>auditSimultaneous40(sim));
 const invalidTickets=clone(simultaneous);invalidTickets[4].stem=invalidTickets[4].stem.replace('cost £40','cost £41');cases.push(()=>auditSimultaneous40(invalidTickets));
 const invalidParam=clone(simultaneous);invalidParam[36].stem=invalidParam[36].stem.replace('(k+3)x','(k+9)x');cases.push(()=>auditSimultaneous40(invalidParam));
 const wrongSimKey=clone(simultaneous);wrongSimKey[39].correctOptionId='B';cases.push(()=>auditSimultaneous40(wrongSimKey));
 for(const [i,run] of cases.entries())assert.throws(run,undefined,'Mutation not rejected '+i);
 assert.equal(cases.length,6);
});

test('22 source-specific revised explanation candidates retain 132 exact A-F mathematics and all student-score barriers',()=>{
 const staged=read('math-v314-simultaneous-22-rationale-repair-candidates-20261123.json');
 assert.equal(staged.kind,'STANDALONE_22_SIMULTANEOUS_RATIONALE_REPAIR_CANDIDATES_NOT_APPROVED');
 assert.equal(staged.sourceBankUnchanged,true);
 assert.equal(staged.sourceCorrectKeysRecomputed,40);
 assert.equal(staged.totals.candidateQuestions,22);
 assert.equal(staged.totals.optionStatements,132);
 assert.equal(staged.totals.revisedWrongRationales,61);
 assert.equal(staged.totals.formalAcademicApprovals,0);
 assert.equal(staged.totals.dailyEnabled,0);
 assert.equal(staged.totals.masteryEnabled,0);
 const originalById=new Map(simultaneous.map(q=>[q.sourceId,q]));
 const repairs=new Map();
 for(const row of rationale.rows){
  const key=row.sourceId+'/'+row.optionId;
  assert.ok(!repairs.has(key));repairs.set(key,row);
 }
 let modified=0;
 const seen=new Set();
 for(const q of staged.questions){
  const old=originalById.get(q.sourceId);
  assert.ok(old);
  assert.equal(q.replacesRevisionId,old.revisionId);
  assert.notEqual(q.revisionId,old.revisionId);
  assert.equal(q.stem,old.stem);
  assert.equal(q.correctOptionId,old.correctOptionId);
  assert.equal(q.correctAnswerLatex,old.correctAnswerLatex);
  assert.deepEqual(q.workedSolutionSteps,old.workedSolutionSteps);
  assert.equal(q.topicId,old.topicId);
  assert.equal(q.academicQA,'pending');
  assert.equal(q.dailyEligible,false);
  assert.equal(q.masteryEligible,false);
  assert.equal(q.teacherTaughtConfirmed,false);
  assert.equal(q.independentGradeCalibrated,false);
  assert.equal(q.studentMisconceptionsEmpiricallyVerified,false);
  assert.equal(q.options.length,6);
  for(const o of q.options){
   const previous=old.options.find(x=>x.id===o.id),fix=repairs.get(q.sourceId+'/'+o.id);
   assert.ok(previous);
   assert.equal(o.latex,previous.latex);
   assert.equal(o.id,previous.id);
   assert.equal(o.errorPath,fix?fix.proposedErrorPath:previous.errorPath);
   if(fix){modified++;seen.add(q.sourceId+'/'+o.id)}
  }
 }
 assert.equal(staged.questions.length,22);
 assert.equal(modified,61);
 assert.equal(seen.size,61);
 const replacements=new Map(staged.questions.map(q=>[q.sourceId,q]));
 const reassessed=simultaneous.map(q=>replacements.get(q.sourceId)||q);
 assert.equal(auditSimultaneous40(reassessed).length,40);
});
