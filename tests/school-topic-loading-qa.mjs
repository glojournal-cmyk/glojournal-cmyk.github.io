import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';

const core=fs.readFileSync('assets/index-BLVOhKhN.core.js','utf8');
const raw=JSON.parse(zlib.gunzipSync(Buffer.from(Array.from({length:12},(_,i)=>fs.readFileSync(`content/school-update-20260919/runtime-${String(i).padStart(2,'0')}.txt`,'utf8').trim()).join(''),'base64')));
const bundle=new Map(raw.t.map(t=>[t.id,{topicId:t.id,title:t.title,note:t.n,questions:t.q.map(q=>({id:q.i,status:'enabled',format:q.f,prompt:q.p,answer:q.a}))}]));
const delta=new Map(JSON.parse(fs.readFileSync('content/school-update-20260926/delta.json','utf8')).topics.map(t=>[t.topicId,t]));
const xC=new Map();
const counts=core.slice(core.indexOf('function school20260926Counts('),core.indexOf('function school20260926Meta('));
const loader=core.slice(core.indexOf('async function TC('),core.indexOf('function EC('));
const load=new Function('xC','loadSchoolY9Bundle_20260919','loadSchool20260926','applyStudyNoteUpdates','fetch',counts+loader+';return TC;')(xC,async()=>bundle,async()=>delta,async t=>t,async url=>{
 const p=url.slice(1);
 return {ok:fs.existsSync(p),json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))};
});
for(const [id,t] of delta){
 const baseCount=bundle.get(id)?.questions.length||(fs.existsSync(`content/topics/${id}.json`)?JSON.parse(fs.readFileSync(`content/topics/${id}.json`,'utf8')).questions.length:0);
 const loaded=await load(id);
 assert.ok(Array.isArray(loaded.questions),`${id}: question list must remain an array`);
 assert.equal(loaded.questions.length,baseCount+t.questions.length,id);
 assert.equal(loaded.questionCount,loaded.questions.length,id);
 assert.ok(loaded.questions.filter(q=>q.status==='enabled').length>0,id);
 assert.strictEqual(await load(id),loaded,'cached topic preserves the same question list');
}
const holidays=await load('fr-y9-20260919-unit-1-holidays-and-opinions');
assert.ok(holidays.questions.length>=76);
assert.ok(holidays.questions.every(q=>q.prompt&&q.answer));
console.log(`School topic loading passed: ${delta.size} merged topics; Holidays and opinions has ${holidays.questions.length} playable questions.`);
