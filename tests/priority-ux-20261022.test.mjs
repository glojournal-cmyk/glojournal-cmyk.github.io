import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {scholarMetrics} from '../assets/scholar-metrics-20261022.js';
const read = name => fs.readFileSync(new URL('../assets/'+name,import.meta.url),'utf8');
test('Home and Settings share lifetime study, exercise and game metrics without changing saved evidence',()=>{
 const state={latinXp:68,frenchXp:12,bioXp:5,bodyXp:20,xp:9999,peSessions:2,games:{a:{points:7},b:{points:9}},topicStats:{a:{state:'mastered'}}};
 const before=JSON.stringify(state);
 assert.deepEqual(scholarMetrics(state),{mind:85,body:20,spark:16});
 assert.deepEqual(scholarMetrics({}),{mind:0,body:0,spark:0});
 assert.equal(JSON.stringify(state),before);
 for(const name of ['home-rpg-live-20261019.js','scholar-iJ2ilQWG.js','scholar-rebuilt-20261021.js'])assert.match(read(name),/scholarMetrics\((?:state|e)\)/);
});
test('completed results keep growth evidence but schedule no navigation or modal',()=>{
 const code=read('garden-life-20261007.js');
 const result={textContent:'10 / 10 +64 XP',children:[],appendChild(node){this.children.push(node)}};
 const document={querySelector:selector=>selector.includes('Session result')?result:null,createElement:tag=>({tag,setAttribute(k,v){this[k]=v}})};
 let writes=0;
 const scope=vm.createContext({document,changeOf:()=> 'basil',scoreLine:()=>'+64 XP',arrivalSentence:()=> 'Basil grew',esc:String,writeLife:()=>writes++,root:{setTimeout(){assert.fail('Results must not start a redirect timer')}},location:{assign(){assert.fail('Must not navigate automatically')}}});
 const a=code.indexOf('  var resultOpen = false;'),b=code.indexOf('  function isPracticePath',a);
 vm.runInContext(code.slice(a,b)+';globalThis.show=showReturn;',scope);
 const life={};scope.show(life,{questionsToday:10},'2026-10-22',{grewToday:true});
 assert.equal(result.children.length,1);
 assert.equal(result.children[0].tag,'section');
 assert.match(result.children[0].innerHTML,/href="\/garden\/"/);
 assert.equal(result.children[0].role,undefined);
 assert.equal(life.announcedGrowthFor,'2026-10-22');assert.equal(writes,1);
 scope.show(life,{questionsToday:10},'2026-10-22',{grewToday:true});assert.equal(result.children.length,1);
});
test('Clear has a separate flow row and cannot be clamped onto letter coordinates',()=>{
 const js=read('daily-practice-layout-20261020.js'),css=read('daily-practice-ux-v2-20261020.css');
 const clear=js.slice(js.indexOf('  function updateClear'),js.indexOf('  function decorateQuestion'));
 assert.match(clear,/workspace.insertBefore\(actions/);
 assert.doesNotMatch(clear,/getBoundingClientRect|style\.(left|top)|document.body.append/);
 assert.match(css,/#lux-daily-clear-tiles\{\s*position:static;min-height:44px/);
 assert.match(css,/\[data-lux-tile-actions\]\{\s*grid-column:1 \/ -1!important;grid-row:3!important/);
 assert.match(clear,/disabled=!selected \|\| checked/);
});
