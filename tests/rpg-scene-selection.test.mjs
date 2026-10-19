import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectedRewardScene} from '../assets/rpg-scene-selection-20261019.js';

const list = [
 {id:'dusk',name:'Dusk',art:'/art/stages/dusk.jpg',focus:'50% 68%',free:true},
 {id:'classroom',name:'Classroom',art:'/art/stages/classroom.jpg',focus:'50% 46%',free:true},
 {id:'garden',name:'Garden',art:'/art/stages/garden.jpg',focus:'50% 55%'},
 {id:'fountain',name:'Fountain Garden',art:'/art/scenes/scene-05.jpg',focus:'50% 58%'},
 {id:'boss-moon-garden',name:'Moonlit Garden',art:'/art/scenes/scene-10.jpg',focus:'50% 58%',bossOnly:true}
];
test('equipped, owned reward wins over newest unlock or progress',()=>{
 const s={equippedScene:'garden',unlockedScenes:['garden','fountain'],xp:99999};
 assert.equal(selectedRewardScene(s,list).id,'garden');
 assert.equal(selectedRewardScene(s,list).art,'/art/stages/garden.jpg');
 s.unlockedScenes.push('boss-moon-garden');
 assert.equal(selectedRewardScene(s,list).id,'garden');
});
test('changing chosen reward changes home background without adding any rewards',()=>{
 const s={equippedScene:'garden',unlockedScenes:['garden','fountain'],xp:700};
 const before=JSON.stringify(s);
 assert.equal(selectedRewardScene(s,list).art,'/art/stages/garden.jpg');
 const equipped={...s,equippedScene:'fountain'};
 assert.equal(selectedRewardScene(equipped,list).art,'/art/scenes/scene-05.jpg');
 assert.equal(JSON.stringify(s),before);
});
test('locked, unknown, or missing choice falls back to starter only',()=>{
 for(const equippedScene of ['fountain','imaginary',null,undefined]){
   const result=selectedRewardScene({equippedScene,unlockedScenes:[]},list);
   assert.equal(result.id,'dusk');
   assert.equal(result.art,'/art/stages/dusk.jpg');
 }
});
test('starter choices are allowed and invalid art is never injected as CSS URL',()=>{
 assert.equal(selectedRewardScene({equippedScene:'classroom'},list).id,'classroom');
 const bad=[{id:'dusk',free:true,art:'javascript:alert(1)',focus:'x'}];
 assert.equal(selectedRewardScene({},bad).art,'/art/stages/dusk.jpg');
 assert.equal(selectedRewardScene({},bad).focus,'50% 68%');
});
