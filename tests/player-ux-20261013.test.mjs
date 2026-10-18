import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {relatedTopicRows,topicDisplayTitle,directoryGroups} from '../assets/topic-directory-data-20261003.js';
import {GAME_TIME,lastGameVisit} from '../assets/player-ux-20261013.js';
import {petArtUrl} from '../pet/pet-art-hd-20261009.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalog=JSON.parse(read('content/catalog.json')).topics;
test('Biology school packs sit under their main topics without lost IDs or counts',()=>{
 const topics=catalog.filter(t=>t.subject==='biology'&&t.year===9&&t.status!=='disabled');
 const groups=directoryGroups(topics),rows=groups.flatMap(g=>relatedTopicRows(g.topics));
 const retained=rows.flatMap(r=>[r.topic,...r.related]);
 assert.deepEqual(retained.map(t=>t.topicId).sort(),topics.map(t=>t.topicId).sort());
 assert.equal(retained.reduce((s,t)=>s+t.enabled,0),topics.reduce((s,t)=>s+t.enabled,0));
 assert.ok(rows.length<topics.length);assert.equal(rows.find(r=>r.topic.topicId==='bio-y9-b3').related.length,2);
 assert.equal(topicDisplayTitle(topics.find(t=>t.topicId==='bio-y9-b1')),'Cell structure');
});
test('filtered school pack remains selectable when its parent does not match',()=>{
 const child=catalog.find(t=>t.topicId==='bio-y9-school-20260927-01');
 assert.equal(relatedTopicRows([child])[0].topic.topicId,child.topicId);
 assert.equal(relatedTopicRows([child])[0].related.length,0);
});
test('game estimates have known destinations and are labelled estimates',()=>{
 for(const [id,time] of Object.entries(GAME_TIME)){assert.match(time,/estimate/);assert.ok(fs.existsSync(new URL('../play/'+id+'/index.html',import.meta.url)),id)}
 assert.deepEqual(lastGameVisit({id:'mot-match',at:100}),{id:'mot-match',at:100});
 for(const data of [{id:'../../bad',at:10},{id:'mot-match',at:'bad'},null])assert.equal(lastGameVisit(data),null);
});
test('UX layer writes only game navigation memory, not learning or rewards',()=>{
 const js=read('assets/player-ux-20261013.js');
 assert.doesNotMatch(js,/\.setState\(|\.award\(|\.bumpDaily\(|resetAll\(|localStorage\.clear\(/);
 assert.equal((js.match(/localStorage\.setItem\(/g)||[]).length,1);
 assert.match(js,/localStorage\.setItem\('lux-game-visit-v1'/);
 assert.match(js,/LuxHomeContinue\?\.choose/);
 assert.match(js,/requestAnimationFrame\(refresh\)/);
 assert.match(js,/node\.textContent!==value/,'DOM writes must be idempotent');
});
test('practice controls collapse and correct answers retain expandable detail',()=>{
 for(const file of ['assets/study._subject.practise-D_PWgUd7.js','assets/study._subject.practise-y8fix-20260920.js']){
  const src=read(file);assert.match(src,/lux-practice-view/);assert.match(src,/study-topic-picker[^]*?open:false/);
 }
 for(const file of ['assets/quiz-session-rWAnuDVj.js','assets/quiz-session-y8fix-20260920.js']){
  const src=read(file);assert.match(src,/Answer & explanation/);assert.match(src,/compactCorrectFeedback/);
 }
});
test('all ten pet levels keep available original HD artwork',()=>{
 for(const id of ['moss-hornling','inkling','pebble-wisp','snow-owl','night-spider'])for(let level=1;level<=10;level++)assert.ok(fs.existsSync(new URL('..'+petArtUrl(id,level).split('?')[0],import.meta.url)),id+' '+level);
 assert.match(read('pet/index.html'),/10 evolution forms/);
 assert.match(read('pet/pet.js'),/Next evolution preview/);
 assert.match(read('pet/pet.js'),/panel=document.createElement\('details'\);panel.id='mp-wallet-history'/);
});
test('Recovery remains accessible for unopened dates and expands unfinished work',()=>{
 const src=read('assets/quest-recovery-20261011.js');assert.match(src,/host.hidden=false/);assert.match(src,/host.open=hadRendered\?keptOpen:unfinished>0/);assert.match(src,/Prepare ten recovery tasks/);
});
test('foundation review is distinguished from the daily Continue task',()=>{
 const src=read('assets/study-experience-20260927.js');assert.match(src,/OPTIONAL FOUNDATION REVIEW/);assert.match(src,/Review this foundation →/);
 assert.match(read('assets/player-ux-20261013.js'),/Continue today’s task/);
});
