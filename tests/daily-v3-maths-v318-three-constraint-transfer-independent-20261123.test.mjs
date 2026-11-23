import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';

const read=n=>JSON.parse(readFileSync(new URL('../qa-staging/'+n,import.meta.url),'utf8'));
const bank=read('math-v311-reviewed-200.json');
const before=read('math-v315-indices017-025-standard009-025-distinct-reasoning-candidates-20261123.json');
const evidence=read('math-v317-eight-candidate-grade-demand-and-six-concept-overlap-evidence-20261123.json');
const pack=read('math-v318-three-lower-demand-indices-standard-replacements-20261123.json');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const stemScientific=s=>[...s.matchAll(/(\d+(?:\.\d+)?)\\times10\^(?:\{(-?\d+)\}|(-?\d+))/g)].map(m=>Number(m[1])*10**Number(m[2]??m[3]));
const optionTuple=s=>{const m=s.match(/^\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?\)$/);
 assert.ok(m,'Invalid numeric ordered pair/triple '+s);return m.slice(1).filter(x=>x!==undefined).map(Number)};
const keyFor=(q,check)=>q.options.filter(o=>check(o.latex)).map(o=>o.id);
const unique=q=>{assert.equal(q.options.length,6);
 assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
 assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
 assert.equal(q.options.find(o=>o.id===q.correctOptionId)?.latex,q.correctAnswerLatex);
 assert.equal(q.options.filter(o=>o.id!==q.correctOptionId&&o.errorPath?.length>=55).length,5);
};
const deriveIndices=stem=>{
 assert.ok(stem.includes('Q(t)=\\frac{2^{3t-1}}{4^{t+1}}'),'Power-ratio source changed');
 const minimum=Number(stem.match(/integer \$t\\ge(\d+)\$/)?.[1]);
 const productPower=Number(stem.match(/Q\(n\)Q\(m\)=2\^\{(\d+)\}/)?.[1]);
 const maxDifference=Number(stem.match(/\\frac\{Q\(m\)\}\{Q\(n\)\}\\le2\^(\d+)/)?.[1]);
 assert.ok(Number.isInteger(minimum)&&Number.isInteger(productPower)&&Number.isInteger(maxDifference));
 const Q=t=>2**(t-3);
 const isSquare=x=>Number.isInteger(Math.sqrt(x));
 const pairs=[];
 for(let n=minimum;n<=productPower+6;n++)for(let m=n+1;m<=productPower+6;m++){
  const a=Q(n),bb=Q(m);
  if(isSquare(a)&&isSquare(bb)&&near(a*bb,2**productPower)&&m-n<=maxDifference)pairs.push([n,m]);
 }
 return {pairs,allM:pairs.reduce((s,x)=>s+x[1],0),Q,minimum,productPower,maxDifference};
};
const deriveContainers=stem=>{
 const nums=stemScientific(stem);assert.equal(nums.length,4);
 const [initial,waste,capA,capB]=nums,retained=initial-waste;
 const priceA=Number(stem.match(/type A container costs £(\d+)/i)?.[1]);
 const priceB=Number(stem.match(/type B costs £(\d+)/i)?.[1]);
 const percentages=[...stem.matchAll(/\*\*(\d+)% empty\*\*/g)].map(m=>Number(m[1]));
 const maxContainers=Number(stem.match(/at most \*\*(\d+) containers\*\*/)?.[1]);
 assert.equal(percentages.length,2);
 const usableA=capA*(1-percentages[0]/100),usableB=capB*(1-percentages[1]/100);
 const candidates=[];
 for(let a=0;a<=maxContainers;a++)for(let bb=0;bb+a<=maxContainers;bb++){
  const capacity=a*usableA+bb*usableB,cost=a*priceA+bb*priceB;
  if(capacity>=retained-1e-8)candidates.push({a,b:bb,cost,capacity,count:a+bb});
 }
 const minCost=Math.min(...candidates.map(x=>x.cost));
 return {initial,waste,retained,capA,capB,usableA,usableB,priceA,priceB,maxContainers,candidates,
  optima:candidates.filter(x=>x.cost===minCost)};
};
const deriveChamber=stem=>{
 const numbers=stemScientific(stem);assert.equal(numbers.length,4);
 const [initialVolume,initialConcentration,packSize,targetConcentration]=numbers;
 const removed=Number(stem.match(/removes \*\*(\d+)%\*\*/)?.[1]);
 const maxPacks=Number(stem.match(/at most \*\*(\d+) sealed packs\*\*/)?.[1]);
 const snippet=stem.split('to one of the volumes ')[1]?.split(', each multiplied')[0];
 assert.ok(snippet);
 const volumes=[...snippet.matchAll(/\$([\d.]+)\$/g)].map(m=>Number(m[1]));
 assert.deepEqual(volumes,[1.5,1.75,2,2.25]);
 const rem=initialVolume*1e6*initialConcentration*(1-removed/100);
 const feasible=[];
 for(const v of volumes)for(let p=0;p<=maxPacks;p++){
  const concentration=(rem+packSize*p)/(v*1e-3*1e6);
  if(near(concentration,targetConcentration))feasible.push({v,p,concentration});
 }
 const maximum=Math.max(...feasible.map(x=>x.v));
 return {rem,volumes,maxPacks,packSize,targetConcentration,initialVolume,initialConcentration,removed,feasible,
  optimum:feasible.filter(x=>x.v===maximum)};
};

test('three real source-linked low-demand V315 items replaced with distinct QA-only revision ids and no Grade7 claim or credit',()=>{
 assert.equal(bank.questions.length,200);
 assert.equal(bank.questions.filter(x=>x.dailyEligible===true).length,0);
 assert.equal(pack.kind,'V318_THREE_LOW_DEMAND_REPLACEMENT_CANDIDATES_CONSTRAINT_TRANSFER_QA_ONLY');
 assert.equal(pack.canonicalSourceUnchanged,true);
 assert.equal(pack.originalV315PackRetainedForAudit,true);
 assert.equal(pack.higherBenchmarkStatus,'REASONING_INTENT_CHECKED_NOT_GRADE7_CERTIFIED');
 assert.equal(pack.counts.newCandidateQuestions,3);
 assert.equal(pack.counts.options,18);
 assert.equal(pack.counts.wrongOptionsWithNumericallySpecificErrorPaths,15);
 assert.equal(pack.counts.priorLowerPriorityItemsRedesigned,3);
 assert.equal(pack.counts.externalGrade7Certifications,0);
 assert.equal(pack.counts.academicApproved,0);
 assert.equal(pack.counts.dailyEligible,0);
 assert.equal(pack.counts.masteryEligible,0);
 const source=new Map(bank.questions.map(q=>[q.sourceId,q])),prior=new Map(before.questions.map(q=>[q.sourceId,q]));
 let fragments=0,wrong=0;
 for(const q of pack.questions){
  const original=source.get(q.sourceId),older=prior.get(q.sourceId);
  const oldScreen=evidence.candidateGradeDemandScreens.find(x=>x.sourceId===q.sourceId);
  assert.ok(original&&older&&oldScreen);
  assert.equal(oldScreen.benchmarkingPriority,'LOWER');
  assert.equal(q.oldLowerDemandVerdict,oldScreen.benchmarkingPriority);
  assert.equal(q.replacesOriginalRevisionId,original.revisionId);
  assert.equal(q.replacesPreviousCandidateRevisionId,older.revisionId);
  assert.notEqual(q.stem,older.stem);
  assert.equal(q.topicId,original.topicId);
  assert.equal(original.dailyEligible,false);
  assert.equal(older.dailyEligible,false);
  assert.equal(q.academicQA,'pending');
  assert.equal(q.independentGrade7PlusCertification,false);
  assert.equal(q.teacherTaughtConfirmed,false);
  assert.equal(q.empiricalStudentMisconceptionEvidence,false);
  assert.equal(q.independentMasteryConceptApproved,false);
  assert.equal(q.scoringWritesAllowed,false);
  assert.equal(q.dailyEligible,false);assert.equal(q.masteryEligible,false);
  unique(q);
  assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);fragments++;
  for(const opt of q.options){
   assert.match(mathsOptionHTML(opt),/^<math xmlns=/);fragments++;
   if(opt.id!==q.correctOptionId)wrong++;
  }
  assert.equal(q.workedSolutionSteps.length,3);
  for(const s of q.workedSolutionSteps){assert.match(mathsRichTextHTML(s),/<math xmlns=/);fragments++}
 }
 assert.equal(fragments,30);assert.equal(wrong,15);
});

test('INDICES-025 two-variable exponential conditions independently yield exactly two ordered pairs and all six causal alternatives',()=>{
 const q=pack.questions.find(x=>x.sourceId.endsWith('INDICES-025'));assert.ok(q);
 const out=deriveIndices(q.stem);
 assert.deepEqual(out.pairs,[[7,13],[9,11]]);
 assert.equal(out.allM,24);
 const noRatio=[];
 for(let n=out.minimum;n<=20;n++)for(let m=n+1;m<=20;m++){
  if(Number.isInteger(Math.sqrt(out.Q(n)))&&Number.isInteger(Math.sqrt(out.Q(m)))&&near(out.Q(n)*out.Q(m),2**out.productPower))noRatio.push([n,m]);
 }
 const diffTen=noRatio.filter(([n,m])=>m-n<=10);
 assert.deepEqual(noRatio,[[3,17],[5,15],[7,13],[9,11]]);
 const expected={
  A:Math.min(...out.pairs.map(x=>x[1])),B:Math.max(...out.pairs.map(x=>x[1])),
  C:out.pairs.reduce((s,x)=>s+x[0],0),D:out.allM,
  E:diffTen.reduce((s,x)=>s+x[1],0),F:noRatio.reduce((s,x)=>s+x[1],0)
 };
 assert.deepEqual(expected,{A:11,B:13,C:16,D:24,E:39,F:56});
 for(const o of q.options)assert.equal(Number(o.latex),expected[o.id]);
 assert.deepEqual(keyFor(q,x=>Number(x)===out.allM),['D']);
});

test('STANDARD_FORM-009 compute constrained two-type container optimum from source coefficients, check every alternative against feasible set',()=>{
 const q=pack.questions.find(x=>x.sourceId.endsWith('STANDARD_FORM-009'));assert.ok(q);
 const out=deriveContainers(q.stem);
 assert.equal(out.retained,570000);
 assert.ok(near(out.usableA,102000)&&near(out.usableB,135000));
 assert.deepEqual(out.optima.map(x=>[x.a,x.b,x.cost]),[[3,2,250]]);
 const valid=[...out.candidates].map(x=>[x.a,x.b,x.cost]);
 assert.deepEqual(valid,[[0,5,325],[1,4,300],[2,3,275],[3,2,250]]);
 for(const o of q.options){
  const [a,bb,C]=optionTuple(o.latex);
  assert.ok(near(a*out.priceA+bb*out.priceB,C));
  const feasible=valid.some(x=>x[0]===a&&x[1]===bb&&near(x[2],C));
  if(o.id==='C')assert.equal(feasible,true);
  else if(o.id==='D')assert.equal(feasible,true); // feasible, but not least expensive
  else assert.equal(feasible,false);
 }
 assert.deepEqual(keyFor(q,s=>{
  const [a,bb,C]=optionTuple(s);
  return out.optima.some(v=>v.a===a&&v.b===bb&&near(v.cost,C));
 }),['C']);
 assert.equal(out.candidates.filter(x=>x.a+x.b<out.maxContainers).length,0);
});

test('STANDARD_FORM-025 use original concentration, stated loss, four available volumes and indivisible packs; only largest volume remains',()=>{
 const q=pack.questions.find(x=>x.sourceId.endsWith('STANDARD_FORM-025'));assert.ok(q);
 const out=deriveChamber(q.stem);
 assert.ok(near(out.rem,7.5e6));
 assert.deepEqual(out.feasible.map(x=>[x.v,x.p]),[[1.5,1],[1.75,2],[2,3]]);
 assert.deepEqual(out.optimum.map(x=>[x.v,x.p]),[[2,3]]);
 for(const o of q.options){
  const [v,p]=optionTuple(o.latex);
  const actualConcentration=(out.rem+out.packSize*p)/(v*1e-3*1e6);
  const hasExactTarget=near(actualConcentration,out.targetConcentration);
  const permitted=out.volumes.includes(v)&&p<=out.maxPacks&&p>=0&&Number.isInteger(p);
  if(o.id==='C'||o.id==='D')assert.ok(permitted&&hasExactTarget);
  if(o.id==='B')assert.ok(!permitted&&hasExactTarget);
  if(['A','E','F'].includes(o.id))assert.ok(permitted&&!hasExactTarget);
 }
 assert.deepEqual(keyFor(q,s=>{
  const [v,p]=optionTuple(s);
  return out.optimum.some(x=>x.v===v&&x.p===p);
 }),['C']);
});

test('negative source mutations change computed optima instead of trusting cached key',()=>{
 const idx=pack.questions.find(x=>x.sourceId.endsWith('INDICES-025'));
 const mutatedIndices=idx.stem.replace('2^6','2^4');
 const newI=deriveIndices(mutatedIndices);
 assert.deepEqual(newI.pairs,[[9,11]]);
 assert.notEqual(newI.allM,Number(idx.correctAnswerLatex));
 const factory=pack.questions.find(x=>x.sourceId.endsWith('STANDARD_FORM-009'));
 const changedFactory=deriveContainers(factory.stem.replace('discards $3\\times10^4$','discards $1\\times10^4$'));
 assert.deepEqual(changedFactory.optima.map(x=>x.cost),[275]);
 assert.notEqual(changedFactory.optima[0].cost,250);
 const chamber=pack.questions.find(x=>x.sourceId.endsWith('STANDARD_FORM-025'));
 const changedChamber=deriveChamber(chamber.stem.replace('removes **25%**','removes **20%**'));
 assert.equal(changedChamber.feasible.length,0);
});


test('V319 externally sourced AQA Higher 2024 comparator flags real Standard Form topic drift, not invented per-question Grade7 ratings',()=>{
 const qa=read('math-v319-aqa-2024-higher-comparator-three-topic-content-audit-20261123.json');
 assert.equal(qa.kind,'V319_REAL_AQA_HIGHER_2H_2024_QUESTION_COMPARATOR_AND_THREE_TOPIC_ALIGNMENT_REVIEW');
 assert.equal(qa.canonicalBankUnchanged,true);
 assert.equal(qa.v318CandidatePath,'qa-staging/math-v318-three-lower-demand-indices-standard-replacements-20261123.json');
 assert.equal(qa.stats.reviewed,3);
 assert.equal(qa.stats.verifiedNumericKeysFromPriorV318,3);
 assert.equal(qa.stats.standardFormTopicAlignmentRiskHigh,2);
 assert.equal(qa.stats.indicesTopicAlignmentRiskLow,1);
 assert.equal(qa.stats.officialIndividualGrade7Certification,0);
 assert.equal(qa.stats.actualTaughtSubskillSignoffs,0);
 assert.equal(qa.stats.empiricalWrongOptionSignoffs,0);
 assert.equal(qa.stats.methodPointsDefinedForOptionalWrittenAssessment,16);
 assert.equal(qa.stats.originalStudentCreditsApproved,0);
 assert.equal(qa.releaseGate,'HOLD_ALL_NO_IMPORT_NO_MERGE_NO_DEPLOY_NO_STUDENT_CREDIT');
 assert.ok(qa.officialSources.aqaN7N9.includes('aqa.org.uk/subjects/mathematics/'));
 assert.ok(qa.officialSources.aqaJune2024HigherPaper2QuestionPaper.includes('AQ'+'A-83002H-QP-JUN24'));
 assert.ok(qa.officialSources.aqaJune2024HigherPaper2MarkScheme.includes('AQA-83002H-MS-JUN24'));
 assert.ok(qa.officialSources.examComparatorSummary.includes('2.5×10^6'));
 assert.ok(qa.officialSources.importantLimit.includes('NO official isolated Grade7 rating'));
 const source=new Map(bank.questions.map(q=>[q.sourceId,q]));
 const seen=new Set(); let marks=0,high=0;
 for(const row of qa.rows){
  const q=pack.questions.find(q=>q.sourceId===row.sourceId),original=source.get(row.sourceId);
  assert.ok(q&&original&&!seen.has(row.sourceId));
  seen.add(row.sourceId);
  assert.equal(row.originalRevisionId,original.revisionId);
  assert.equal(row.candidateRevisionId,q.revisionId);
  assert.equal(row.candidateStem,q.stem);
  assert.equal(row.candidateCorrectOptionId,q.correctOptionId);
  assert.equal(row.candidateCorrectAnswerLatex,q.correctAnswerLatex);
  assert.equal(row.academicQA,'HOLD');
  assert.equal(row.grade7PlusCertified,false);
  assert.equal(row.taughtAtTGSConfirmed,false);
  assert.equal(row.realPupilMisconceptionsVerified,false);
  assert.equal(row.dailyEligible,false);
  assert.equal(row.masteryEligible,false);
  assert.equal(row.scoringWritesAllowed,false);
  assert.equal(row.proposedWrittenExamOnlyMarkScheme.author,'INTERNAL_QA_DRAFT_NOT_AQA_MARK_SCHEME');
  assert.equal(row.proposedWrittenExamOnlyMarkScheme.partialCreditOnlyInSeparateWrittenAssessment,true);
  assert.equal(row.proposedWrittenExamOnlyMarkScheme.allowEquivalentValidMethods,true);
  assert.equal(row.proposedWrittenExamOnlyMarkScheme.criteria.length,row.proposedWrittenExamOnlyMarkScheme.totalMarks);
  assert.equal(row.proposedWrittenExamOnlyMarkScheme.criteria.filter(x=>x.mark==='A1').length,1);
  assert.ok(row.proposedWrittenExamOnlyMarkScheme.criteria.every(x=>x.criterion.length>35));
  assert.ok(row.assessedSkillsUnverified.length>=4);
  assert.ok(row.criticalHold.length>110);
  marks+=row.proposedWrittenExamOnlyMarkScheme.totalMarks;
  if(q.topicId==='math-y9-standard-form'){
   assert.equal(row.answerRequiresStandardForm,false);
   assert.equal(row.topicAlignmentRisk,'HIGH');
   assert.equal(row.topicSpecificity,'PARTIAL_APPLICATION_STANDARD_FORM_NOT_FINAL_ANSWER');
   high++;
  }else {
   assert.equal(q.topicId,'math-y9-indices');
   assert.equal(row.topicAlignmentRisk,'LOW');
   assert.equal(row.topicSpecificity,'STRONG_INDICES_WITH_MIXED_INEQUALITY');
  }
 }
 assert.equal(seen.size,3);
 assert.equal(high,2);
 assert.equal(marks,16);
});
