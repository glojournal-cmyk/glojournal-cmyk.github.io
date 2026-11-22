import test from 'node:test';
import assert from 'node:assert/strict';
import {pinnedV3DailyPractice} from '../assets/daily-v3-pinned-practice-20261122.js';
import {V3_ACADEMIC_WHITELIST} from '../assets/daily-v3-approved-content-20261122.js';

const day='2026-11-23';
const parts=Object.fromEntries(['french','latin'].map(subject=>{
  const entry=V3_ACADEMIC_WHITELIST[subject].find(e=>e.concepts.length>=5);
  assert.ok(entry,'five whitelisted concepts required for '+subject);
  return [subject,{subject,year:8,topicId:entry.topicId,target:5,
    approvedQuestionIds:entry.concepts.slice(0,5).map(c=>c.ids[0]),
    approvedConceptByQuestion:Object.fromEntries(entry.concepts.slice(0,5).map(c=>[c.ids[0],c.conceptId]))}];
}));
const assignment={id:'languages-standard',dailyV3:true,planDate:day,target:10,languageSplit:parts};
const input=subject=>({dailyLocked:true,taskId:'languages-standard',assignment,
 subject,year:8,topicId:parts[subject].topicId,day});
const questions=subject=>[
 ...parts[subject].approvedQuestionIds.map(id=>({id,topicId:parts[subject].topicId})),
 {id:'fr-y8-src-frv3-06-0331-perdre-il-elle-on',topicId:parts[subject].topicId},
 {id:'another-not-approved-question',topicId:parts[subject].topicId}
];

test('French actual V3 whitelist source IDs exclude unapproved perdre task despite matching topic',()=>{
 const r=pinnedV3DailyPractice({...input('french'),questions:questions('french').reverse()});
 assert.equal(r.applicable,true);
 assert.equal(r.issue,null);
 assert.equal(r.required,5,'Latin 5 and French 5, not ten in each language');
 assert.deepEqual(r.items.map(q=>q.id),parts.french.approvedQuestionIds);
 assert.ok(!r.items.some(q=>q.id==='fr-y8-src-frv3-06-0331-perdre-il-elle-on'));
});
test('Latin is also pinned exactly to its separate five source IDs',()=>{
 const r=pinnedV3DailyPractice({...input('latin'),questions:questions('latin')});
 assert.equal(r.applicable,true);
 assert.equal(r.issue,null);
 assert.deepEqual(r.items.map(q=>q.id),parts.latin.approvedQuestionIds);
});
test('no other question can replace a missing/duplicated pinned ID',()=>{
 for(const subject of ['latin','french']){
  const qs=questions(subject);
  const gone=qs.filter(q=>q.id!==parts[subject].approvedQuestionIds[2]);
  const blocked=pinnedV3DailyPractice({...input(subject),questions:gone});
  assert.equal(blocked.issue,'approved-question-id-missing-from-loaded-bank');
  assert.deepEqual(blocked.items,[]);
  const repeated=pinnedV3DailyPractice({...input(subject),questions:[...qs,qs[0]]});
  assert.equal(repeated.issue,'ambiguous-duplicated-question-id-in-bank');
  assert.deepEqual(repeated.items,[]);
 }
});
test('malicious or stale Language Standard query cannot borrow another topic or date',()=>{
 const qs=questions('french');
 for(const changes of [{day:'2026-11-24'},{topicId:'fr-y8-other-topic'},
   {year:9},{assignment:{...assignment,planDate:'2026-11-22'}},
   {assignment:{...assignment,supplyBlocked:true}},
   {assignment:{...assignment,languageSplit:{...parts,french:{...parts.french,approvedQuestionIds:[...parts.french.approvedQuestionIds.slice(0,4),'unapproved-extra']}}}}]){
  const r=pinnedV3DailyPractice({...input('french'),questions:qs,...changes});
  assert.equal(r.applicable,true);
  assert.ok(r.issue,'must block '+JSON.stringify(changes));
  assert.deepEqual(r.items,[]);
 }
});
test('Year 9 Standard B uses only its ten date/topic/subject-pinned IDs',()=>{
 const entry=V3_ACADEMIC_WHITELIST.y9.find(e=>e.concepts.length>=10);
 assert.ok(entry);
 const ids=entry.concepts.slice(0,10).map(c=>c.ids[0]);
 const task={id:'y8-standard-b',dailyV3:true,planDate:day,
  assignedSubject:entry.subject,assignedYear:9,assignedTopic:entry.topicId,target:10,
  approvedQuestionIds:ids};
 const args={dailyLocked:true,taskId:'y8-standard-b',assignment:task,
  subject:entry.subject,year:9,topicId:entry.topicId,day};
 const bank=[{id:'unapproved-y9-question',topicId:entry.topicId},...ids.map(id=>({id,topicId:entry.topicId}))];
 const pinned=pinnedV3DailyPractice({...args,questions:bank});
 assert.equal(pinned.issue,null);
 assert.equal(pinned.required,10);
 assert.deepEqual(pinned.items.map(q=>q.id),ids);
 assert.equal(pinnedV3DailyPractice({...args,questions:bank.slice(1,10)}).items.length,0);
 assert.equal(pinnedV3DailyPractice({...args,year:8,questions:bank}).items.length,0);
});
test('legacy free practice and existing Recovery never accidentally trigger this narrow V3 pin',()=>{
 for(const opts of [{dailyLocked:false},{recovery:true},{taskId:'year8-recovery'},
   {taskId:'due-review'}]){
  const result=pinnedV3DailyPractice({...input('french'),questions:questions('french'),...opts});
  assert.equal(result.applicable,false);
 }
});
