import assert from 'node:assert/strict';
import fs from 'node:fs';
import {missionFor,advanceMap,completedStages,nextWeek} from '../assets/star-map-state-20261004.js';
const themes=['physics','french','chemistry','biology'],week='2026-10-12';
const report=[];
for(const theme of themes){
 const tasks=missionFor(week,theme);
 let save=null;
 // Player chooses theme; an incorrect answer is not an unlock.
 let wrong=advanceMap(save,week,0,'definitely wrong',undefined,theme);
 assert.equal(wrong.ok,false);
 assert.equal(wrong.state.weeks[week].progress,0);
 assert.equal(wrong.state.weeks[week].theme,theme);
 save=JSON.parse(JSON.stringify(wrong.state));
 // App reload: stored state is hydrated; starting theme cannot change.
 let selected=advanceMap(save,week,0,tasks[0].answer,undefined,'biology');
 assert.equal(selected.state.weeks[week].theme,theme);
 assert.equal(selected.ok,true);save=JSON.parse(JSON.stringify(selected.state));
 for(let index=1;index<8;index++){
   // Wrong answers never move a chapter gate or produce a reward.
   const bad=advanceMap(save,week,index,'definitely wrong',undefined,theme);
   assert.equal(bad.state.weeks[week].progress,index);
   assert.equal(Object.keys(bad.state.collection).length,0);
   const good=advanceMap(save,week,index,tasks[index].answer,undefined,theme);
   assert.equal(good.state.weeks[week].progress,index+1);
   assert.equal(completedStages(index+1),Math.floor((index+1)/2));
   assert.equal(Object.keys(good.state.collection).length,index===7?1:0);
   save=JSON.parse(JSON.stringify(good.state));
 }
 const reward=save.collection['star-map:'+week];
 assert.ok(reward);
 assert.equal(reward.expeditionTheme,theme);
 const replay=advanceMap(save,week,7,tasks[7].answer,undefined,theme);
 assert.equal(replay.ignored,true);
 assert.equal(Object.keys(replay.state.collection).length,1);
 // New week creates new progress and preserves the old trophy.
 const newer=nextWeek(week),fresh=advanceMap(save,newer,0,missionFor(newer,'french')[0].answer,undefined,'french');
 assert.equal(fresh.state.weeks[week].progress,8);
 assert.equal(fresh.state.weeks[newer].progress,1);
 assert.equal(Object.keys(fresh.state.collection).length,1);
 report.push({theme,steps:8,chapters:4,rewards:1,persistent:true,weeklyLock:true});
}
const ui=fs.readFileSync('assets/star-map-challenge-20261004.js','utf8');
assert.match(ui,/sm-theme-picker/);
assert.match(ui,/weekly-scene-\$\{selected\}-20261011.svg/);
assert.match(ui,/weekly-reward-\$\{selected\}-20261011.svg/);
console.log('WEEKLY_BOSS_PLAYER_JOURNEY '+JSON.stringify({failures:0,scenarios:report}));
