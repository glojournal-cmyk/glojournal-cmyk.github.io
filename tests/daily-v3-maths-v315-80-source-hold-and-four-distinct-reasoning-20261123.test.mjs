import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';
const load=n=>JSON.parse(readFileSync(new URL('../qa-staging/'+n,import.meta.url),'utf8'));
const bank=load('math-v311-reviewed-200.json');
const review=load('math-v315-indices40-standardform40-source-exact-pedagogical-hold-and-12-risk-corrections-20261123.json');
const pack=load('math-v315-indices017-025-standard009-025-distinct-reasoning-candidates-20261123.json');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const scientific=s=>{
 const clean=String(s).replace(/\s/g,'');
 const m=clean.match(/^(-?\d+(?:\.\d+)?)\\times10\^\{(-?\d+)\}$/);
 if(m)return Number(m[1])*10**Number(m[2]);
 if(/^-?\d+(?:\.\d+)?$/.test(clean))return Number(clean);
 throw Error('Non numeric canonical value '+s);
};
const quantities=s=>[...s.matchAll(/(\d+(?:\.\d+)?)\\times10\^\{(-?\d+)\}/g)].map(m=>Number(m[1])*10**Number(m[2]));
test('80 exact Indices/Standard Form QA statuses, 33 source templates, 74 concise wrong rationale flags and 12 corrected historical risk claims',()=>{
 const source=bank.questions.filter(q=>q.topicId==='math-y9-indices'||q.topicId==='math-y9-standard-form');
 assert.equal(bank.questions.length,200);assert.equal(source.length,80);
 assert.equal(source.filter(q=>q.dailyEligible).length,0);
 assert.equal(review.kind,'V315_INDICES40_STANDARD_FORM40_SOURCE_EXACT_ACADEMIC_RISK_CORRECTION_REGISTER');
 assert.equal(review.sourceBank.unchanged,true);
 assert.equal(review.counts.total,80);
 assert.equal(review.counts.choices,480);
 assert.equal(review.counts.wrongChoices,400);
 assert.equal(review.counts.shortWrongRationalesUnder30,74);
 assert.equal(review.counts.erroneousOrStaleHistoricalFlagCorrections,12);
 assert.equal(review.counts.numericNeutralTemplateGroups,33);
 assert.equal(review.counts.indicesWithSiblingVariants,35);
 assert.equal(review.counts.standardFormWithSiblingVariants,28);
 assert.equal(review.counts.academicApproved,0);
 assert.equal(review.counts.dailyEnabled,0);
 assert.equal(review.counts.masteryEnabled,0);
 assert.equal(review.schoolPDF,'SKIPPED_AS_INSTRUCTED');
 const all=new Map(source.map(q=>[q.sourceId,q])),seen=new Set();
 let concise=0;const families=new Map();
 for(const row of review.rows){
  const src=all.get(row.sourceId);assert.ok(src&&!seen.has(row.sourceId));
  seen.add(row.sourceId);
  assert.equal(src.revisionId,row.revisionId);
  assert.equal(row.sourceCorrectOptionId,src.correctOptionId);
  assert.equal(row.sourceCorrectAnswerLatex,src.correctAnswerLatex);
  assert.equal(src.options.length,6);
  assert.deepEqual(src.options.map(o=>o.id),['A','B','C','D','E','F']);
  const short=src.options.filter(o=>o.id!==src.correctOptionId&&(o.errorPath||'').length<30);
  assert.equal(short.length,row.shortRationaleCount);
  for(const opt of row.shortRationaleOptions){
   const srcOpt=src.options.find(o=>o.id===opt.id);
   assert.ok(srcOpt&&srcOpt.id!==src.correctOptionId);
   assert.equal(srcOpt.latex,opt.latex);
   assert.equal(srcOpt.errorPath,opt.originalExplanation);
  }
  concise+=short.length;
  assert.equal(row.academicDecision,'HOLD');
  assert.equal(row.dailyEligible,false);
  assert.equal(row.masteryEligible,false);
  assert.equal(row.independentGrade7PlusSignoff,false);
  assert.equal(row.taughtSubskillConfirmed,false);
  assert.equal(row.conceptEquivalenceSignedOff,false);
  assert.equal(row.empiricalDistractorValidation,false);
  families.set(row.sourceTemplateGroup,(families.get(row.sourceTemplateGroup)||0)+1);
 }
 assert.equal(seen.size,80);assert.equal(concise,74);
 assert.equal(families.size,33);
 assert.equal(review.groupManifest.reduce((sum,x)=>sum+x.numericNeutralVariants,0),80);
 const corrections=review.correctedHistoricalRisks;
 assert.equal(corrections.length,12);
 const mass=[...corrections].filter(x=>x.correctedFlag==='PHYSICAL_DENSITY_PLAUSIBLE');
 assert.equal(mass.length,6);
 const expectedDensity={'001':.3,'002':.4,'003':.8,'017':.3,'018':.32,'019':.375};
 for(const row of mass){
  const q=all.get(row.sourceId);
  assert.ok(near(scientific(q.correctAnswerLatex),expectedDensity[row.sourceId.slice(-3)]));
  assert.ok(near(row.independentlyConfirmedValue,expectedDensity[row.sourceId.slice(-3)]));
  assert.ok(row.independentlyConfirmedValue<1);
  assert.equal(row.academicDecision,'HOLD');
 }
 for(const suffix of ['004','020']){
  const row=corrections.find(x=>x.sourceId.endsWith('-'+suffix));
  assert.ok(row);
  assert.equal(row.correctedFlag,suffix==='004'?'QUESTION_IS_COUNT_NOT_DENSITY':'QUESTION_IS_ADDITIONAL_MASS_NOT_DENSITY');
  assert.ok(near(scientific(all.get(row.sourceId).correctAnswerLatex),row.independentlyConfirmedValue));
 }
 const historical=corrections.filter(x=>Number(x.sourceId.slice(-3))>=33);
 assert.equal(historical.length,4);
 const revisedKeys=new Set();
 for(const row of historical){
  const q=all.get(row.sourceId),values=q.options.map(o=>scientific(o.latex));
  assert.equal(row.correctedFlag,'CURRENT_REVISED_CHOICES_ALL_NONNEGATIVE_UNIQUE_AND_FOUR_KEYS_NOT_IDENTICAL');
  assert.ok(values.every(x=>x>=0));
  assert.equal(new Set(values.map(v=>v.toPrecision(13))).size,6);
  revisedKeys.add(scientific(q.correctAnswerLatex).toPrecision(13));
 }
 assert.equal(revisedKeys.size,4);
});

test('four reasoning drafts: 24 choices, student credit denied, exact source linkage and 40 maths fragments',()=>{
 assert.equal(pack.kind,'V315_FOUR_DISTINCT_INDICES_STANDARD_FORM_AO2_AO3_CANDIDATES_NO_GRADE_CERTIFICATION');
 assert.equal(pack.sourceBankUnmodified,true);
 assert.equal(pack.totals.candidateQuestions,4);
 assert.equal(pack.totals.choices,24);
 assert.equal(pack.totals.wrongDistractors,20);
 assert.equal(pack.totals.formalAcademicApprovals,0);
 assert.equal(pack.totals.dailyEnabled,0);
 assert.equal(pack.totals.masteryEnabled,0);
 const ids=['INDICES-017','INDICES-025','STANDARD_FORM-009','STANDARD_FORM-025'];
 let fragments=0,wrong=0;
 for(const [i,q] of pack.questions.entries()){
  assert.ok(q.sourceId.endsWith(ids[i]));
  const original=bank.questions.find(x=>x.sourceId===q.sourceId);
  assert.ok(original);
  assert.equal(q.replacesOriginalRevisionId,original.revisionId);
  assert.equal(original.dailyEligible,false);
  assert.notEqual(q.stem,original.stem);
  assert.equal(q.academicQA,'pending');
  assert.equal(q.independentGCSEGrade7PlusCertified,false);
  assert.equal(q.teacherTaughtConfirmed,false);
  assert.equal(q.studentMisconceptionsEmpiricallyVerified,false);
  assert.equal(q.independentMasteryConceptApproved,false);
  assert.equal(q.dailyEligible,false);
  assert.equal(q.masteryEligible,false);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(q.options.length,6);
  assert.equal(new Set(q.options.map(x=>x.latex)).size,6);
  assert.equal(q.options.find(x=>x.id===q.correctOptionId).latex,q.correctAnswerLatex);
  assert.ok(mathsRichTextHTML(q.stem).includes('<math xmlns='));fragments++;
  for(const o of q.options){
   assert.ok(mathsOptionHTML(o).includes('<math xmlns='));
   fragments++;if(o.id!==q.correctOptionId){wrong++;assert.ok(o.errorPath?.length>=30)}
  }
  assert.equal(q.workedSolutionSteps.length,3);
  for(const line of q.workedSolutionSteps){assert.ok(mathsRichTextHTML(line).includes('<math xmlns='));fragments++}
 }
 assert.equal(fragments,40);assert.equal(wrong,20);
});

test('independent source-derived answer keys and 20 distinct numeric distractor outcomes',()=>{
 const [I17,I25,S09,S25]=pack.questions;
 // I17: source powers and strict squared bounds, not stored answer.
 assert.match(I17.stem,/S\(n\)=2\^\{2n\}\+2\^\{2n\+2\}/);
 const [nLow,nHigh]=[...I17.stem.matchAll(/S\((\d+)\)/g)].slice(-2).map(m=>Number(m[1]));
 assert.deepEqual([nLow,nHigh],[2,5]);
 const S=n=>2**(2*n)+2**(2*n+2),lo=S(nLow),hi=S(nHigh);
 const possible=[];for(let k=1;k*k<hi;k++)if(k*k>lo&&k%8===0&&k%16!==0)possible.push(k);
 assert.deepEqual(possible,[24,40,56]);
 const sum=possible.reduce((a,b)=>a+b,0);
 assert.equal(sum,120);
 const expectedI17={A:sum+8,B:sum+72,C:sum-24,D:sum,E:sum-40,F:sum-56};
 for(const o of I17.options)assert.ok(near(scientific(o.latex),expectedI17[o.id]));
 assert.deepEqual(I17.options.filter(o=>near(scientific(o.latex),sum)).map(x=>x.id),['D']);
 // I25: exponent ratio 2^(n-3), square iff exponent a nonnegative even number.
 assert.ok(I25.stem.includes('A=2^{3n-1}')&&I25.stem.includes('B=4^{n+1}'));
 const bounds=I25.stem.match(/2\^(\d+)\\le\\frac\{A\}\{B\}\\le2\^(\d+)/);
 assert.ok(bounds);
 const [lowerPower,upperPower]=bounds.slice(1).map(Number);
 const candidates=Array.from({length:50},(_,n)=>n).filter(n=>n-3>=lowerPower&&n-3<=upperPower);
 const accepted=candidates.filter(n=>(n-3)%2===0);
 assert.deepEqual(candidates,[7,8,9,10,11,12]);
 assert.deepEqual(accepted,[7,9,11]);
 const acceptedSum=accepted.reduce((a,b)=>a+b,0);
 const excludedOdd=candidates.filter(n=>(n-3)%2!==0).reduce((a,b)=>a+b,0);
 const expectedI25={A:candidates.reduce((a,b)=>a+b,0),B:excludedOdd,C:acceptedSum-7,D:acceptedSum-11,E:acceptedSum,F:acceptedSum-9};
 for(const o of I25.options)assert.ok(near(scientific(o.latex),expectedI25[o.id]));
 assert.deepEqual(I25.options.filter(o=>near(scientific(o.latex),acceptedSum)).map(x=>x.id),['E']);
 // SF009: source mass, waste, capacity and headroom, integer ceiling.
 const masses=quantities(S09.stem);assert.deepEqual(masses,[600000,30000,120000]);
 const pct=Number(S09.stem.match(/at least (\d+)%/)?.[1]);assert.equal(pct,10);
 const [initial,waste,cap]=masses,retained=initial-waste,maxLoad=cap*(1-pct/100);
 const N=Math.ceil(retained/maxLoad),U=N*cap-retained;
 assert.equal(N,6);assert.ok(near(U,150000));
 const expectedS09={A:[5,5*cap-retained],B:[N,U],C:[N,N*cap-(initial-2*waste)],D:[N,N*cap-initial],E:[N+1,(N+1)*cap-retained],F:[5,5*cap-(initial-2*waste)]};
 for(const o of S09.options){
  const m=o.latex.match(/^N=(\d+),U=(.+)$/);assert.ok(m);
  const got=[Number(m[1]),scientific(m[2])],expect=expectedS09[o.id];
  assert.ok(got.every((v,i)=>near(v,expect[i])),'S09 wrong reasoning value: '+o.id);
 }
 assert.deepEqual(S09.options.filter(o=>{
  const m=o.latex.match(/^N=(\d+),U=(.+)$/);return Number(m[1])===N&&near(scientific(m[2]),U)
 }).map(x=>x.id),['B']);
 // SF025: actual initial + compressed volumes and concentrations; extra target particles.
 const vals=quantities(S25.stem);assert.deepEqual(vals,[.0025,4000,.002,6000]);
 const remove=Number(S25.stem.match(/removes \*\*(\d+)%\*\*/)?.[1]);assert.equal(remove,25);
 const initialCount=vals[0]*1e6*vals[1],remain=initialCount*(1-remove/100),target=vals[2]*1e6*vals[3],extra=target-remain;
 assert.ok(near(initialCount,1e7)&&near(extra,4.5e6));
 const expectedS25={
  A:target-initialCount,B:extra,C:target-initialCount*.8,D:initialCount*.25,
  E:vals[0]*1e6*vals[3]-remain,
  F:vals[0]*1e6*(vals[3]-vals[1])
 };
 for(const o of S25.options)assert.ok(near(scientific(o.latex),expectedS25[o.id]),'SF025 wrong-route value '+o.id);
 assert.deepEqual(S25.options.filter(o=>near(scientific(o.latex),extra)).map(x=>x.id),['B']);
});

test('adversarial key, eligibility and source-constraint edits fail the maths proof',()=>{
 const c=structuredClone(pack.questions);
 c[0].correctOptionId='A';assert.notEqual(c[0].correctOptionId,pack.questions[0].correctOptionId);
 assert.notEqual(scientific(c[0].options.find(o=>o.id==='A').latex),120);
 const z=structuredClone(pack.questions);
 z[2].dailyEligible=true;assert.notEqual(z[2].dailyEligible,false);
 const a=structuredClone(pack.questions);
 a[3].stem=a[3].stem.replace('removes **25%**','removes **20%**');
 assert.ok(a[3].stem.includes('removes **20%**'));
 const original=quantities(a[3].stem),count=original[0]*1e6*original[1],target=original[2]*1e6*original[3];
 const changed=target-count*.8;assert.ok(near(changed,4e6));
 assert.ok(!near(changed,scientific(a[3].correctAnswerLatex)));
});