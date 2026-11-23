import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mathsRichTextHTML,mathsOptionHTML} from '../assets/math-study/math-v31-native-mathml.js';
const get=n=>JSON.parse(readFileSync(new URL('../qa-staging/'+n,import.meta.url),'utf8'));
const bank=get('math-v311-reviewed-200.json');
const original=get('math-v311-rearranging025-040-16-source-exact-pedagogical-holds-20261123.json');
const group=get('math-v313-rearranging025-040-concept-consolidation-no-credit-20261123.json');
const staged=get('math-v313-rearranging029-033-037-distinct-anchor-candidates-20261123.json');
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const family=(n)=>n<=28?0:n<=32?1:n<=36?2:3;
test('16 exact source variants are grouped as four provisional non-credit concepts; no false Mastery/learner signoff',()=>{
 assert.equal(bank.questions.length,200);
 assert.equal(bank.questions.filter(q=>q.dailyEligible).length,0);
 assert.equal(original.rows.length,16);
 assert.equal(group.items.length,16);
 assert.equal(group.totals.familyGroups,4);
 assert.equal(group.totals.numericVariantsNotDistinct,12);
 assert.equal(group.totals.provisionalAnchors,4);
 assert.equal(group.totals.approved,0);
 assert.equal(group.totals.independentMasteryCredits,0);
 assert.equal(group.schoolPdf,'SKIPPED_PER_PARENT_INSTRUCTION');
 const source=new Map(bank.questions.map(q=>[q.sourceId,q]));
 const prior=new Map(original.rows.map(q=>[q.sourceId,q]));
 const byFamily=new Map();
 const ids=new Set();
 for(const row of group.items){
  assert.ok(!ids.has(row.sourceId));ids.add(row.sourceId);
  const n=Number(row.sourceId.slice(-3));
  assert.ok(n>=25&&n<=40);
  const old=prior.get(row.sourceId),actual=source.get(row.sourceId);
  assert.ok(old&&actual&&actual.revisionId===row.sourceRevisionId);
  assert.equal(actual.stem,row.oldStem);
  assert.equal(actual.correctOptionId,row.oldKey);
  assert.equal(actual.dailyEligible,false);
  assert.equal(row.academicDecision,'HOLD');
  assert.equal(row.dailyEligible,false);
  assert.equal(row.masteryEligible,false);
  assert.equal(row.mayMintIndependentMasteryConcept,false);
  assert.equal(row.isAnchor,n===([25,29,33,37][family(n)]));
  assert.equal(row.provisionalAnchorId,'LUX-MATH-Y9-REARRANGING-'+String([25,29,33,37][family(n)]).padStart(3,'0'));
  (byFamily.get(row.conceptFamily)||byFamily.set(row.conceptFamily,[]).get(row.conceptFamily)).push(row);
 }
 assert.equal(ids.size,16);
 assert.equal(byFamily.size,4);
 for(const a of byFamily.values())assert.deepEqual([a.length,a.filter(x=>x.isAnchor).length,a.filter(x=>!x.isAnchor).length],[4,1,3]);
});

test('three distinct technique-anchor redesigns: 30 full native MathML fields, independently verified source mathematical claims and zero credit',()=>{
 assert.equal(staged.questions.length,3);
 assert.equal(staged.totals.newDistinctAnchors,3);
 assert.equal(staged.totals.allChoices,18);
 assert.equal(staged.totals.wrongChoices,15);
 assert.equal(staged.totals.academicApprovals,0);
 assert.equal(staged.totals.dailyEligible,0);
 assert.equal(staged.totals.masteryEligible,0);
 let parsed=0,wrong=0;
 for(const q of staged.questions){
  const src=bank.questions.find(x=>x.sourceId===q.sourceId);
  const family=group.items.find(x=>x.sourceId===q.sourceId);
  assert.ok(src&&family&&family.isAnchor);
  assert.equal(q.replacesOriginalRevisionId,src.revisionId);
  assert.equal(q.provisionalConceptFamily,family.conceptFamily);
  assert.notEqual(q.stem,src.stem);
  assert.equal(q.academicQA,'pending');
  assert.equal(q.dailyEligible,false);
  assert.equal(q.masteryEligible,false);
  assert.equal(q.independentGradeCalibrated,false);
  assert.equal(q.teacherTaughtConfirmed,false);
  assert.equal(q.options.length,6);
  assert.deepEqual(q.options.map(o=>o.id),['A','B','C','D','E','F']);
  assert.equal(new Set(q.options.map(o=>o.latex)).size,6);
  assert.equal(q.correctAnswerLatex,q.options.find(o=>o.id===q.correctOptionId).latex);
  assert.match(mathsRichTextHTML(q.stem),/<math xmlns=/);parsed++;
  for(const o of q.options){assert.match(mathsOptionHTML(o),/^<math xmlns=/);parsed++;
    if(o.id!==q.correctOptionId){assert.ok(o.errorPath?.length>=25);wrong++}}
  assert.equal(q.workedSolutionSteps.length,3);
  for(const st of q.workedSolutionSteps){assert.match(mathsRichTextHTML(st),/<math xmlns=/);parsed++}
 }
 assert.equal(parsed,30);assert.equal(wrong,15);
 const q29=staged.questions[0],q33=staged.questions[1],q37=staged.questions[2];
 assert.deepEqual(staged.questions.map(x=>x.sourceId.slice(-3)),['029','033','037']);
 assert.deepEqual(staged.questions.map(x=>x.correctOptionId),['C','B','C']);
 const f=x=>1+2*(x+1)/(3*x+5);
 for(const x of [0.01,0.1,0.5,1,2,10,100]){
  assert.ok(near(f(x)+f(1/x)-3,(x-1)**2/((3*x+5)*(5*x+3))));
  assert.ok(f(x)+f(1/x)>=3-1e-9);
 }
 assert.ok(near(f(1)+f(1),3));
 assert.ok(q29.correctAnswerLatex.includes('M=3,x=1'));
 const nested=x=>1+2/(2+3/(x+1)),inverse=y=>(5*y-7)/(4-2*y);
 for(const x of [-10,-3,-2,-0.5,0,1,5,50])assert.ok(near(inverse(nested(x)),x));
 assert.ok(near(inverse(1),-1));assert.ok(Number.isFinite(inverse(2-1e-7))&&Math.abs(inverse(2-1e-7))>1e6); // limiting output only
 assert.ok(q33.correctAnswerLatex.includes('y\\ne1,y\\ne2'));
 const radical=x=>1+Math.sqrt((2*x+3)/(x+4)),back=y=>(3-4*(y-1)**2)/((y-1)**2-2);
 for(const x of [-100,-5,-1.5,-1,0,1,10,100])assert.ok(near(back(radical(x)),x));
 for(const y of [1,1.1,2,3,10]){const x=back(y);assert.ok(x<-4||x>=-1.5);assert.ok(near(radical(x),y))}
 assert.ok(q37.correctAnswerLatex.includes('y\\ne1+\\sqrt{2}'));
});
