import test from 'node:test';import assert from 'node:assert/strict';
import {missionFor,advanceMap,gradeTask,nextWeek} from '../assets/star-map-state-20261004.js';
import {STORIES,collectedClues,puzzleOrder} from '../assets/weekly-adventure-20261012.js';
const week='2026-10-12',solution=q=>q.answer??`${q.numeric} ${q.unit}`;
for(const theme of Object.keys(STORIES))test(theme+' has a complete mixed adventure with one collectible',()=>{
 const tasks=missionFor(week,theme,2);assert.equal(tasks.length,8);assert.ok(tasks.filter(q=>!q.options).length>=5);assert.ok(tasks.some(q=>q.tokens));
 let saved;for(let i=0;i<8;i++){
 const bad=advanceMap(saved,week,i,'wrong',undefined,theme,2);assert.equal(bad.state.weeks[week].progress,i);assert.equal(Object.keys(bad.state.collection).length,0);
 const good=advanceMap(bad.state,week,i,solution(tasks[i]),undefined,theme,2);assert.equal(good.ok,true,theme+' '+i);assert.equal(good.state.weeks[week].adventureVersion,2);saved=JSON.parse(JSON.stringify(good.state));
 assert.equal(collectedClues(theme,i+1).filter(c=>c.word).length,Math.ceil((i+1)/2));
 }
 assert.equal(Object.keys(saved.collection).length,1);assert.equal(advanceMap(saved,week,7,solution(tasks[7]),undefined,theme,2).ignored,true);
 const fresh=advanceMap(saved,nextWeek(week),0,solution(missionFor(nextWeek(week),theme,2)[0]),undefined,theme,2);assert.equal(fresh.state.weeks[week].progress,8);assert.equal(Object.keys(fresh.state.collection).length,1);
});
test('started old expeditions remain on their original question bank',()=>{const old={weeks:{[week]:{theme:'french',progress:1,attempts:1}},collection:{}};const task=missionFor(week,'french',1)[1];const result=advanceMap(old,week,1,task.answer,undefined,'biology',2);assert.equal(result.ok,true);assert.equal(result.state.weeks[week].adventureVersion,1);assert.equal(result.state.weeks[week].theme,'french')});
test('French accents and spacing are optional, wrong concepts and wrong ordering fail',()=>{const tasks=missionFor(week,'french',2);assert.equal(gradeTask(tasks[2],"  je n’ai pas de frere  "),true);assert.equal(gradeTask(tasks[2],"Je ai pas n' de frere"),false);assert.equal(gradeTask(tasks[3],'shorter'),false);assert.equal(gradeTask(missionFor(week,'chemistry',2)[4],'.5'),true);assert.equal(gradeTask(missionFor(week,'biology',2)[6],'200x'),true)});
test('puzzle tile order is stable but never the original correct order',()=>{const q=missionFor(week,'french',2)[2];assert.deepEqual(puzzleOrder(q.tokens,week),puzzleOrder(q.tokens,week));assert.notDeepEqual(puzzleOrder(q.tokens,week),q.tokens)});
