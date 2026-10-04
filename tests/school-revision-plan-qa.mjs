import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
await import('../assets/school-revision-data-20261004.js');
const {schoolAssessments,buildRevisionPlan,londonDay}=globalThis.LuxSchoolRevision;
const chemistry=schoolAssessments.find(x=>x.subject==='Chemistry');
assert.deepEqual(chemistry.topics,['chem-y9-c5','chem-y9-c3','chem-y9-c1','chem-y9-c4']);
assert.equal(JSON.parse(fs.readFileSync('content/topics/'+chemistry.topics[0]+'.json')).title,'Atomic structure, isotopes and electron arrangement');
const delta=JSON.parse(fs.readFileSync('content/school-update-20260926/delta.json'));
for(const exam of schoolAssessments)for(const topic of exam.revisionTopics){
  const pack=fs.existsSync('content/topics/'+topic.id+'.json')?JSON.parse(fs.readFileSync('content/topics/'+topic.id+'.json')):delta.topics.find(t=>t.topicId===topic.id);
  assert.ok(pack,topic.id);assert.equal(pack.subject,exam.subject.toLowerCase());assert.equal(pack.year,9);
}
const empty=buildRevisionPlan({}, {}, '2026-10-04');
assert.deepEqual(empty.active.map(x=>x.subject),['Chemistry','French','Biology']);
assert.equal(empty.suggestion.assessment.subject,'Chemistry');
assert.equal(empty.suggestion.topic.state,'unchecked');
assert.match(empty.suggestion.reason,/No topic practice/);
assert.equal(new URL(empty.suggestion.href,'https://example.test').searchParams.get('topic'),'chem-y9-c5');
assert.equal(buildRevisionPlan({}, {}, '2026-10-10').active[0].phase,'current');
assert.equal(buildRevisionPlan({}, {}, '2026-10-11').active[0].phase,'current');
assert.equal(buildRevisionPlan({}, {}, '2026-10-12').active[0].subject,'Biology');
assert.equal(buildRevisionPlan({}, {}, '2026-11-22').active[0].phase,'current');
assert.equal(buildRevisionPlan({}, {}, '2026-11-23').active.length,0);
assert.equal(buildRevisionPlan({}, {}, '2026-11-23').suggestion,null);
assert.equal(londonDay(new Date('2026-10-03T23:30:00Z')),'2026-10-04');
assert.equal(londonDay(new Date('2026-12-03T23:30:00Z')),'2026-12-03');
const garden={topicStats:{'chem-y9-c5':{attempted:20,correct:19,state:'mastered'},'chem-y9-c4':{attempted:10,correct:6,state:'practising'}},reviews:{wrong:{topicId:'chem-y9-c3',wrong:true},corrected:{topicId:'chem-y9-c5',wrong:false},repair:{topicId:'chem-y9-c5',wrong:true,repair:true}}};
const original=JSON.stringify(garden);
assert.equal(buildRevisionPlan(garden,{},'2026-10-04').suggestion.topic.id,'chem-y9-c3');
assert.equal(JSON.stringify(garden),original,'planning must not write progress, daily tasks, rewards or mastery');
const result={paperId:'chemistry',score:84,date:'03/10/2026',revisionEvidence:[{topic:'Rf',credit:0.25,marks:4}]};
assert.equal(buildRevisionPlan(garden,{results:[result]},'2026-10-04').suggestion.topic.id,'chem-y9-c4');
assert.equal(buildRevisionPlan(garden,{results:[result]},'2026-10-04',{'chem-y9-c4':false}).suggestion.topic.id,'chem-y9-c3');
// A later corrected paper supersedes historical mistakes from a paper.
assert.equal(buildRevisionPlan({}, {results:[result,{...result,revisionEvidence:[{topic:'Rf',credit:1,marks:4}]}]}, '2026-10-04').suggestion.topic.id,'chem-y9-c5');
// Legacy results keep their recorded scores without guessing per-topic marking.
assert.equal(buildRevisionPlan({}, {results:[{paperId:'chemistry',score:51}]}, '2026-10-04').active[0].latest.score,51);
assert.ok(buildRevisionPlan({}, {results:[{paperId:'chemistry',score:51}]}, '2026-10-04').active[0].revisionTopics.every(t=>t.state==='unchecked'));
const mastered={topicStats:Object.fromEntries(chemistry.topics.map(id=>[id,{attempted:20,correct:20,state:'mastered'}]))};
assert.equal(buildRevisionPlan(mastered,{},'2026-10-04').suggestion.href,'/assessment/?paper=chemistry&v=20261004-school4');
assert.equal(buildRevisionPlan({}, {hiddenSchoolAssessments:[chemistry.id]}, '2026-10-04').suggestion.assessment.subject,'French');
const custom={id:'custom',subject:'Maths',date:'2026-10-04',title:'Algebra',status:'Upcoming'};
assert.equal(buildRevisionPlan({}, {tracker:[custom]}, '2026-10-04').active[0].title,'Algebra');
assert.equal(buildRevisionPlan({}, {tracker:[{...custom,status:'Completed'}]}, '2026-10-04').past[0].phase,'completed');
assert.equal(buildRevisionPlan({}, {tracker:[{...custom,date:'2026-02-31'},{...custom,subject:'<img>'}]}, '2026-10-04').active.length,3);
const app=fs.readFileSync('assessment/app-v2.js','utf8');
assert.match(app,/revisionEvidence:d.questions.map/);
assert.match(app,/get\('paper'\)/);
const markup=fs.readFileSync('assessment/index.html','utf8');
assert.ok(markup.indexOf('/assets/school-revision-data-20261004.js')<markup.indexOf('/assessment/app-v2.js'));
assert.match(fs.readFileSync('assessment-link.js','utf8'),/school-revision-home-20261004/);
// Reproduce the actual deferred-script order: the older add-on registers a
// DOMContentLoaded callback before the newer school scope is installed.
const base=JSON.parse(fs.readFileSync('assessment/chemistry-school-1.json'));
const addon=JSON.parse(fs.readFileSync('assessment/chemistry-school-style-20260927.json'));
const loaded=[],saved={drafts:{},recent:{}},exam={innerHTML:''};let rendered;
const nativeFetch=async url=>new Response(JSON.stringify(String(url).includes('chemistry-school-style')?addon:base));
const context=vm.createContext({URL,Response,Math,Set,String,Object,console,
  location:{href:'https://example.test/assessment/?paper=chemistry'},
  document:{addEventListener:(name,fn)=>{if(name==='DOMContentLoaded')loaded.push(fn);}},
  window:{fetch:nativeFetch},PAPERS:[{id:'chemistry',bank:'/assessment/chemistry-school-1.json'}],
  EXAM_GROUPS:[{subject:'Chemistry'}],cards(){},state:saved,show(){},save(){},
  start(){throw Error('Patched Chemistry start should be used');},
  bankUrl:p=>p.bank,$:()=>exam,esc:x=>x,renderTest:(p,d)=>{rendered=d;},
});
context.fetch=(...args)=>context.window.fetch(...args);
vm.runInContext(app.slice(app.indexOf('function shuffle(a)'),app.indexOf('function selectCreusa(')),context);
vm.runInContext(fs.readFileSync('assessment/chemistry-schoolstyle-20260927.js','utf8'),context);
vm.runInContext(fs.readFileSync('assessment/chemistry-oct5-patch.js','utf8'),context);
for(const fn of loaded)fn();
assert.equal(context.PAPERS[0].groups.Atoms,6,'Late add-on must not erase the newer Atoms quota');
for(let i=0;i<30;i++){
  saved.drafts={};rendered=null;await context.start('chemistry');
  assert.ok(rendered,exam.innerHTML);assert.equal(rendered.questions.length,30);
  for(const group of ['Atoms','Periodic table','Separation','RP6 method','Rf'])assert.ok(rendered.questions.some(q=>q.topic===group),group);
  saved.recent.chemistry=rendered.questions.map(q=>q.id);
}
rendered.answers[0]='saved answer';const draft=rendered;
await context.start('chemistry');assert.equal(rendered,draft);assert.equal(rendered.answers[0],'saved answer','Direct links resume a saved paper');
console.log('School revision QA passed: confirmed scope links, London dates, full assessment weeks, actual weaknesses, unchecked topics, taught-only suggestions, latest papers, custom/hidden/completed tests and read-only progress.');
