import assert from 'node:assert/strict';
import fs from 'node:fs';
import {weekOf,missionFor,advanceMap,gradeTask,completedStages,nextWeek} from '../assets/star-map-state-20261004.js';
assert.equal(weekOf('2026-10-04T22:59:00Z'),'2026-09-28');
assert.equal(weekOf('2026-10-04T23:00:00Z'),'2026-10-05');
assert.equal(weekOf('2026-10-25T23:30:00Z'),'2026-10-19','GMT Sunday still belongs to its Monday');
const week='2026-09-28',tasks=missionFor(week);let state;
let wrong=advanceMap(state,week,0,'wrong');assert.equal(wrong.state.weeks[week].progress,0);assert.equal(Object.keys(wrong.state.collection).length,0);state=wrong.state;
for(let i=0;i<8;i++){const before=JSON.stringify(state),task=tasks[i],value=task.answer??`${task.numeric} ${task.unit}`,r=advanceMap(state,week,i,value,'2026-10-04T20:00:00Z');assert.equal(JSON.stringify(state),before);assert.equal(r.ok,true);assert.equal(r.state.weeks[week].progress,i+1);assert.equal(completedStages(i+1),Math.floor((i+1)/2));state=JSON.parse(JSON.stringify(r.state));if(i===3)assert.equal(Object.keys(state.collection).length,0);}
assert.equal(Object.keys(state.collection).length,1);assert.equal(state.collection['star-map:'+week].week,week);
const retry=advanceMap(state,week,7,tasks[7].numeric);assert.equal(retry.ignored,true);assert.equal(Object.keys(retry.state.collection).length,1);
const next=nextWeek(week);assert.equal(next,'2026-10-05');const newWeek=advanceMap(state,next,0,missionFor(next)[0].answer);assert.equal(newWeek.state.weeks[week].progress,8);assert.equal(newWeek.state.weeks[next].progress,1);assert.equal(Object.keys(newWeek.state.collection).length,1);
assert.equal(advanceMap(state,next,5,'anything').ignored,true,'cannot skip gates or double-click past cursor');
assert.equal(gradeTask(tasks[4],String(tasks[4].numeric)),false,'speed needs unit');assert.equal(gradeTask(tasks[4],`${tasks[4].numeric} m/s`),true);assert.equal(gradeTask(tasks[4],`${tasks[4].numeric} s/m`),false);assert.equal(gradeTask(tasks[4],`${tasks[4].numeric} m/s 99`),false);assert.equal(gradeTask(tasks[7],'-5'),false);assert.equal(gradeTask(tasks[7],'5 units'),true);
for(const week of ['2026-10-05','2026-10-12','2026-10-19'])for(const task of missionFor(week))assert.equal(gradeTask(task,task.answer??`${task.numeric} ${task.unit}`),true);
const ui=fs.readFileSync('assets/star-map-challenge-20261004.js','utf8');assert.ok(!/recordAttempt|completeWeeklyBoss|award\(/.test(ui),'theme cannot create formal mastery or replay rewards');assert.match(ui,/store.setState\(\{starMapChallenge/);assert.match(ui,/Skip animations/);assert.match(ui,/actual!==week/);
assert.match(fs.readFileSync('assets/index-BLVOhKhN.js','utf8'),/state: store.getState\(\)/,'complete backups include the custom state');
console.log('Star map QA passed: four gates, eight tasks, units, exact marking, wrong-answer retry, reload, weekly collection deduplication, London rollover/DST and backup inclusion.');
