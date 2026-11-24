// QA branch only: executable Node acceptance for targeted Food Tests changes.
// Zero academic approvals are implied by a passing function-level test.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(path.join(root,p),'utf8');
const bank=JSON.parse(read('content/topics/bio-y8-food-tests.json'));
const catalog=JSON.parse(read('content/catalog.json'));
const rubricSrc=read('assets/food-tests-ethanol-rubric-20261122.js');
const score=new Function(rubricSrc.replace('export ','')+'\nreturn scoreFoodTestsEthanolSafety')();
const cases=[
 ["Ethanol catches fire easily. Shake the sample with ethanol, then add water.",2],
 ["Ethanol is highly flammable. Shake the sample with ethanol and then add water.",2],
 ["Ethanol is flammable, so we should mix the food with ethanol and then add water.",2],
 ["Alcohol ignites easily. Mix the sample with ethanol before adding water.",2],
 ["Ethanol is very flammable. Never use a naked flame.",1],
 ["I would shake the sample with ethanol and then add water.",1],
 ["Heat ethanol over a flame, then add water.",0],
 ["Ethanol is flammable, so I will heat it over a naked flame before adding water.",1],
 ["Ethanol is flammable. Pour water into the sample, then heat ethanol over a flame.",1],
 ["Ethanol is flammable. Add only water to the sample.",1],
 ["Ethanol is flammable. Add ethanol and water to the food without shaking.",1],
 ["Water and ethanol are mixed. Add water then ethanol.",0],
 ["Ethanol is flammable. Add ethanol to the sample, shake, then add water.",2],
 ["Ethanol may catch fire. The sample is mixed with ethanol and water is then added.",2],
 ["Ethanol cannot catch fire. Shake sample with ethanol, then add water.",1],
 ["Ethanol is flammable. Don't shake sample with ethanol, add water.",1],
 ["Ethanol is flammable. First add water then shake with ethanol.",1],
 ["Ethanol is highly flammable. Shake sample with ethanol then add water but boil ethanol over a flame.",1],
 ["Ethanol is flammable. Mix water and ethanol with the sample.",1],
 ["Ethanol is flammable. Shake sample with ethanol, add water, but do not heat ethanol.",2],
 ["Ethanol is not flammable. Shake sample with ethanol then add water.",1],
 ["Ethanol burns easily. Swirl food with ethanol and then add water.",2],
 ["Ethanol is highly flammable. Do not premix ethanol and water. Shake the food with ethanol and then add water.",2],
 ["Ethanol is flammable. The food sample was shaken with ethanol, after which water was added.",2],
 ["Ethanol is flammable. Water was added after the food sample had been shaken with ethanol.",2],
 ["Ethanol is flammable. The food sample is shaken with ethanol, and only after that is water added.",2],
 ["Ethanol is non-flammable. The sample is shaken with ethanol and then water is added.",1],
 ["Ethanol isn't flammable. Shake the sample with ethanol, then add water.",1],
 ["Ethanol is nonflammable. The food was mixed with ethanol, then water was added.",1],
 ["Ethanol is flammable. Mix the ethanol with water first; then shake food with it.",1],
 ["Ethanol is flammable. Don't shake the sample with ethanol; then add water.",1],
 ["Ethanol is flammable. Mix the food with ethanol, and then add water, but the ethanol is heated first.",1],
 ["Ethanol is not flammable and will not ignite. Shake food with ethanol, then add water.",1],
 ["Ethanol is highly flammable. Do not shake ethanol and water together first. Mix the food with ethanol and add water afterwards.",2],
 ["The food sample is shaken with ethanol and water is then added. The alcohol is flammable.",2],
 ["Ethanol is flammable. After water was added, the sample was shaken with ethanol.",1],
 ["Ethanol is flammable. Shake sample with ethanol then add water but use a flame to heat the ethanol.",1],
 ["Ethanol is highly flammable. Do not mix ethanol and water before testing. Shake food with ethanol, then add water.",2],
 ["Ethanol is flammable. The food was shaken in ethanol and then water was added.",2],
 ["Ethanol is flammable. After the food sample was shaken with ethanol, water was added.",2],
 ["Ethanol is flammable. Add water first, and then shake the food in ethanol.",1],
 ["Ethanol is flammable. Mix ethanol and water together, then add food.",1],
 ["Ethanol is flammable. The sample was shaken with ethanol. Then water was added.",2],
 // Round 1 extended: explicit after-order, modal negation and near-misses.
 ["Ethanol is flammable. Add water after shaking the sample with ethanol.",2],
 ["The ethanol will not catch fire. Shake the sample with ethanol, then add water.",1],
 ["Ethanol is flammable. Pour water in after shaking food with ethanol.",2],
 ["Ethanol catches fire easily. Add water after mixing a food sample with alcohol.",2],
 ["Ethanol is flammable. Add water before shaking the sample with ethanol.",1],
 ["Ethanol will not ignite. Shake the sample with ethanol, then add water.",1],
 ["Alcohol won't catch fire. Shake the sample with ethanol, then add water.",1],
 ["Ethanol would not catch fire. Shake the sample with ethanol, then add water.",1],
 ["Ethanol is flammable. Add water after heating the sample in ethanol without shaking.",1],
 ["Ethanol is flammable. Add water after mixing ethanol and water.",1],
 ["Ethanol will catch fire near a naked flame. Shake the food sample with ethanol and then add water.",2],
 ["Ethanol won't burn. Shake the sample with ethanol, then add water.",1],
 ["Ethanol is flammable. Add water after shaking the sample with ethanol; then heat ethanol directly over a flame.",1],
 ["Ethanol is flammable. Add water after shaking the sample with ethanol, but add water first.",1],
 ["Ethanol will never catch fire. Shake the food with ethanol before adding water.",1],
 ["Ethanol is flammable. Add water after the sample was shaken in ethanol.",2],
 ["Ethanol is flammable. Only after shaking the sample with ethanol should water be added.",2],
 ["Ethanol is flammable. The sample was shaken with ethanol after adding water.",1],
 ["Ethanol isn't flammable. Add water after shaking the sample with ethanol.",1],
];
function endOf(s,at){const start=s.indexOf('{',at);let depth=0;for(let j=start;j<s.length;j++){if(s[j]==='{')depth++;else if(s[j]==='}'){depth--;if(!depth)return j+1;}}throw Error('unclosed');}
const found=[];
for(const f of ['assets/quiz-session-y8fix-20260920.js','assets/quiz-session-rWAnuDVj.js']){
 const s=read(f),at=s.indexOf('function B(e,t,n,r)');
 if(at<0||!s.includes("import {scoreFoodTestsEthanolSafety}"))throw Error('missing scorer integration '+f);
 const B=new Function('scoreFoodTestsEthanolSafety','L','I',s.slice(s.indexOf('function reviewedMark('),at)+s.slice(at,endOf(s,at))+'\nreturn B;')(score,()=>'',()=>[]);
 const q=bank.questions.find(q=>q.id==='bio-y8-app-ethanol-safety');
 for(const [answer,expected] of cases){const got=B(q,answer,'biology',{});if(got.score!==expected||got.total!==2||got.ok!==(expected===2))throw Error(f+': '+answer+': '+JSON.stringify(got));}
 const critical=[
  ["Ethanol is flammable. Add water after shaking the sample with ethanol.",[true,true]],
  ["The ethanol will not catch fire. Shake the sample with ethanol, then add water.",[false,true]]
 ];
 for(const [answer,expectedPoints] of critical){
  const got=B(q,answer,'biology',{});
  if(JSON.stringify(got.pointResults)!==JSON.stringify(expectedPoints))throw Error('critical mark points: '+answer+': '+JSON.stringify(got.pointResults));
 }
 found.push({file:f,passed:cases.length});
}
const source=read('assets/daily-curriculum-20261004.js'),at=source.indexOf('export function selectProgressionQuestions(');
if(at<0)throw Error('selector absent');
const hold=new Function(read('assets/food-tests-qa-credit-gate-20261122.js').replace(/export /g,'')+'\nreturn isFoodTestsQaHeld;')();
const selector=new Function('isFoodTestsQaHeld',source.slice(at,endOf(source,at)).replace('export ','')+'\nreturn selectProgressionQuestions')(hold);
const cases64=bank.questions.filter(q=>q.id.startsWith('bio-y8-food-tests-case-20261025-'));
const groupCounts={};for(const q of cases64)groupCounts[q.dailyConceptGroup]=(groupCounts[q.dailyConceptGroup]||0)+1;
if(cases64.length!==64||Object.keys(groupCounts).length!==16||Object.values(groupCounts).some(n=>n!==4))throw Error('invalid 16x4 case grouping');
const sampled=selector(cases64,'standard',64);
if(sampled.length!==0)throw Error('held Food Tests selected for formal session');
const fixture=cases64.map((q,i)=>({...q,id:'unrelated-fixture-'+i,topicId:'unrelated-topic'}));
const grouped=selector(fixture,'standard',64);
if(grouped.length!==16||new Set(grouped.map(q=>q.dailyConceptGroup)).size!==16)throw Error('duplicate concepts served in unrelated control fixture');
const mc=bank.questions.filter(q=>q.format==='mc_single'&&!q.id.includes('case-'));
if(mc.length!==9||mc.some(q=>q.options.length!==4||q.options.filter(x=>q.answer.accepted.includes(x)).length!==1||new Set(q.options).size!==4))throw Error('MCQ bad options');
if(bank.questions.length!==143||bank.questions.some(q=>q.status!=='enabled'))throw Error('changed bank count or status');
const row=catalog.topics.find(q=>q.topicId==='bio-y8-food-tests');
if(row.questions!==143||row.enabled!==143||row.formats.mc_single!==73||row.formats.mark_points!==52)throw Error('catalog drift');
console.log(JSON.stringify({kind:'food-tests-batch-qa',approved:0,ethanol:found,concepts:16,scenarioVariants:64,scenarioServedInOneSitting:sampled.length,mcqChecked:9,questions:143},null,2));
