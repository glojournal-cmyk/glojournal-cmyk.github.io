import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';
const load=x=>JSON.parse(readFileSync(new URL('../qa-staging/'+x,import.meta.url),'utf8'));
const bank=load('math-v311-reviewed-200.json');
const old=load('math-v318-three-lower-demand-indices-standard-replacements-20261123.json');
const risk=load('math-v319-aqa-2024-higher-comparator-three-topic-content-audit-20261123.json');
const pack=load('math-v320-two-standard-form-n9-final-output-rebalanced-candidates-20261123.json');
const near=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=1e-9*Math.max(1,Math.abs(x),Math.abs(y));
const scientific=s=>[...s.matchAll(/(\d+(?:\.\d+)?)\\times10\^(?:\{(-?\d+)\}|(-?\d+))/g)].map(m=>Number(m[1])*10**Number(m[2]??m[3]));
const p009=s=>{const m=s.match(/^\((\d+),(\d+),(\d+),(\d+(?:\.\d+)?)\\times10\^(-?\d+)\)$/);assert.ok(m,'Malformed 009 option '+s);return {a:+m[1],b:+m[2],cost:+m[3],mantissa:+m[4],exponent:+m[5],unused:+m[4]*10**+m[5]};};
const p025=s=>{const m=s.match(/^\((\d+(?:\.\d+)?),(\d+),(\d+(?:\.\d+)?)\\times10\^(-?\d+)\)$/);assert.ok(m,'Malformed 025 option '+s);return {v:+m[1],p:+m[2],mantissa:+m[3],exponent:+m[4],total:+m[3]*10**+m[4]};};
const factory=s=>{
 const amounts=scientific(s);assert.equal(amounts.length,4);
 const [initial,waste,capA,capB]=amounts,retained=initial-waste;
 const aPrice=+(s.match(/type A container costs £(\d+)/)?.[1]),bPrice=+(s.match(/type B costs £(\d+)/)?.[1]);
 const maxCount=+(s.match(/at most \*\*(\d+) containers\*\*/)?.[1]);
 const empty=[...s.matchAll(/\*\*(\d+)% empty\*\*/g)].map(m=>+m[1]);assert.deepEqual(empty,[15,10]);
 const loadA=capA*(1-empty[0]/100),loadB=capB*(1-empty[1]/100);
 const feasible=[];
 for(let a=0;a<=maxCount;a++)for(let b=0;a+b<=maxCount;b++){
  const cost=a*aPrice+b*bPrice,capacity=a*loadA+b*loadB,unused=a*capA+b*capB-retained;
  if(capacity>=retained-1e-7)feasible.push({a,b,cost,capacity,unused});
 }
 const cheapest=Math.min(...feasible.map(x=>x.cost));
 return {retained,loadA,loadB,capA,capB,aPrice,bPrice,maxCount,feasible,winners:feasible.filter(x=>x.cost===cheapest)};
};
const chamber=s=>{
 const amounts=scientific(s);assert.deepEqual(amounts,[.0025,4000,1.5e6,6000]);
 const [initialVolume,initialConcentration,packSize,target]=amounts;
 const fraction=+(s.match(/removes \*\*(\d+)%\*\*/)?.[1]),max=+(s.match(/at most \*\*(\d+) sealed packs\*\*/)?.[1]);
 const snippet=s.split('to one of the volumes ')[1]?.split(', each multiplied')[0];
 assert.ok(snippet);
 const vols=[...snippet.matchAll(/\$([\d.]+)\$/g)].map(m=>+m[1]);
 assert.deepEqual(vols,[1.5,1.75,2,2.25]);
 const retained=initialVolume*1e6*initialConcentration*(1-fraction/100);
 const solutions=[];for(const v of vols)for(let p=0;p<=max;p++){const total=retained+p*packSize;
  if(near(total/(1000*v),target))solutions.push({v,p,total});}
 const best=Math.max(...solutions.map(x=>x.v));
 return {retained,packSize,target,vols,max,solutions,winners:solutions.filter(x=>x.v===best)};
};
test('two exact V319 content-flagged sources become V320 N9 final-answer drafts with credit and external grade certification denied',()=>{
 assert.equal(bank.questions.length,200);assert.equal(bank.questions.filter(q=>q.dailyEligible).length,0);
 assert.equal(pack.kind,'V320_TWO_STANDARD_FORM_N9_EXPLICIT_OUTPUT_REBALANCED_DRAFTS_NO_CREDIT');
 assert.equal(pack.sourceBankUnchanged,true);assert.equal(pack.totals.rebalanced,2);assert.equal(pack.totals.options,12);
 assert.equal(pack.totals.wrongRationales,10);assert.equal(pack.totals.explicitN9FinalNormalization,2);
 assert.equal(pack.totals.grade7PlusCertified,0);assert.equal(pack.totals.academicApproved,0);
 assert.equal(pack.totals.dailyEligible,0);assert.equal(pack.totals.masteryEligible,0);
 assert.ok(pack.externalN9Spec.includes('aqa.org.uk'));
 const sources=new Map(bank.questions.map(x=>[x.sourceId,x]));
 let fragments=0,wrong=0;
 for(const q of pack.questions){
  const initial=sources.get(q.sourceId),prior=old.questions.find(x=>x.sourceId===q.sourceId);
  const qa=risk.rows.find(x=>x.sourceId===q.sourceId);
  assert.ok(initial&&prior&&qa&&qa.topicAlignmentRisk==='HIGH');
  assert.equal(initial.revisionId,q.replacesOriginalRevisionId);
  assert.equal(q.replacesPreviousCandidateRevisionId,prior.revisionId);
  assert.notEqual(q.revisionId,prior.revisionId);
  assert.notEqual(q.stem,prior.stem);
  assert.equal(q.topicId,initial.topicId);
  assert.equal(q.academicQA,'pending');assert.equal(q.dailyEligible,false);
  assert.equal(q.masteryEligible,false);assert.equal(q.scoringWritesAllowed,false);
  assert.equal(q.grade7PlusCertified,false);assert.equal(q.teacherTaughtConfirmed,false);
  assert.equal(q.empiricalWrongAnswerEvidence,false);
  assert.equal(q.options.length,6);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.equal(q.correctAnswerLatex,q.options.find(x=>x.id===q.correctOptionId).latex);
  assert.equal(q.options.filter(o=>o.id!==q.correctOptionId&&o.errorPath?.length>60).length,5);
  assert.ok(q.stem.includes('in standard form $A\\times10^n$'));
  assert.equal(q.workedSolutionSteps.length,3);
  assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);fragments++;
  for(const o of q.options){assert.match(mathsOptionHTML(o),/^<math xmlns=/);fragments++;if(o.id!==q.correctOptionId)wrong++}
  for(const step of q.workedSolutionSteps){assert.match(mathsRichTextHTML(step),/<math xmlns=/);fragments++}
 }
 assert.equal(wrong,10);assert.equal(fragments,20);
});
test('STANDARD_FORM-009 independent 2-type exact cost optimisation plus normalized nominal-capacity output; six physically distinct alternatives',()=>{
 const q=pack.questions.find(x=>x.sourceId.endsWith('STANDARD_FORM-009')),f=factory(q.stem);
 assert.ok(near(f.retained,570000));assert.ok(near(f.loadA,102000)&&near(f.loadB,135000));
 assert.deepEqual(f.winners.map(w=>[w.a,w.b,w.cost,w.unused]),[[3,2,250,90000]]);
 assert.equal(f.feasible.length,4);
 const expected={A:60000,B:30000,C:6000,D:90000,E:210000,F:120000};
 let found=[];
 for(const o of q.options){
  const x=p009(o.latex);
  assert.ok(x.mantissa>=1&&x.mantissa<10&&Number.isInteger(x.exponent),'Not normalized N9 '+o.id);
  assert.ok(near(x.unused,expected[o.id]));
  assert.ok(near(x.a*f.aPrice+x.b*f.bPrice,x.cost));
  if(o.id==='C')assert.ok(near(x.unused,x.a*f.loadA+x.b*f.loadB-f.retained));
  else assert.ok(near(x.unused,x.a*f.capA+x.b*f.capB-f.retained));
  const good=f.winners.some(w=>x.a===w.a&&x.b===w.b&&near(x.cost,w.cost)&&near(x.unused,w.unused));
  if(good)found.push(o.id);
 }
 assert.deepEqual(found,['D']);
});
test('STANDARD_FORM-025 independently enumerate maximum exact particle concentration and normalize total count for each option',()=>{
 const q=pack.questions.find(x=>x.sourceId.endsWith('STANDARD_FORM-025')),z=chamber(q.stem);
 assert.ok(near(z.retained,7.5e6));assert.deepEqual(z.solutions.map(x=>[x.v,x.p]),[[1.5,1],[1.75,2],[2,3]]);
 assert.deepEqual(z.winners.map(x=>[x.v,x.p,x.total]),[[2,3,12e6]]);
 let found=[];for(const opt of q.options){
  const o=p025(opt.latex);
  assert.ok(o.mantissa>=1&&o.mantissa<10&&Number.isInteger(o.exponent),'Not normalized N9 '+opt.id);
  assert.ok(near(o.total,z.retained+o.p*z.packSize),'Option particle count mismatch '+opt.id);
  const matches=z.winners.some(x=>near(x.v,o.v)&&o.p===x.p&&near(x.total,o.total));
  if(matches)found.push(opt.id);
 }
 assert.deepEqual(found,['C']);
 assert.ok(near(p025(q.correctAnswerLatex).total,1.2e7));
});
test('mutating N9 final coefficient or physical constraints changes or invalidates the correct answer',()=>{
 const sf=pack.questions.find(x=>x.sourceId.endsWith('STANDARD_FORM-009'));
 const alt=p009(sf.options.find(o=>o.id==='C').latex);
 const cost=factory(sf.stem).winners[0];
 assert.ok(alt.a===cost.a&&alt.b===cost.b&&alt.cost===cost.cost);
 assert.ok(!near(alt.unused,cost.unused));
 const s25=pack.questions.find(x=>x.sourceId.endsWith('STANDARD_FORM-025')),baseline=chamber(s25.stem);
 const mutate=s25.stem.replace('removes **25%**','removes **20%**');
 assert.notEqual(mutate,s25.stem);
 assert.equal(chamber(mutate).solutions.length,0);
 const changed=sf.stem.replace('discards $3\\times10^4$','discards $1\\times10^4$');
 assert.notEqual(changed,sf.stem);
 assert.deepEqual(factory(changed).winners.map(x=>x.cost),[275]);
 assert.notEqual(factory(changed).winners[0].cost,250);
});
