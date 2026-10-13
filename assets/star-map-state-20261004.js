import {adventureTasks,normalAnswer} from './weekly-adventure-20261012.js?ux=20261013-player-ux1';
import {THEMES,themedTasks,themeFor} from './weekly-boss-themes-20261011.js?ux=20261013-player-ux1';
import {weekOf} from './memory-stars-state-20261004.js?ux=20261013-player-ux1';
export {weekOf};
export const nodes=[[20,72],[38,35],[62,52],[79,22]];
export function missionFor(week,theme='physics',adventureVersion=1){if(adventureVersion===2)return adventureTasks(week,theme);if(theme!=='physics'&&THEMES[theme])return themedTasks(theme);const seed=[...week].reduce((n,c)=>n+c.charCodeAt(0),0),time=3+seed%3,speed=2+seed%3,distance=time*speed;
 return [
 {stage:0,title:'Restore the power',prompt:'The observatory uses a solar cell. Which energy transfer supplies electricity?',options:['Light → electrical','Electrical → light','Sound → chemical'],answer:'Light → electrical',hint:'The solar cell receives light and supplies electricity.',skill:'physics:energy:transfers'},
 {stage:0,title:'Restore the power',prompt:'The lamp transfers electrical energy into light. What other energy store usually increases?',options:['Thermal energy store','Gravitational energy store','Elastic energy store'],answer:'Thermal energy store',hint:'A lamp warms its surroundings.',skill:'physics:energy:dissipation'},
 {stage:1,title:'Reconnect the signal',prompt:'The signal lamp is off because the switch is open. What restores the current?',options:['Close the switch','Remove the battery','Break the wire'],answer:'Close the switch',hint:'Current needs a complete circuit.',skill:'physics:circuits:current'},
 {stage:1,title:'Reconnect the signal',prompt:'Which instrument should be connected in series to measure current?',options:['Ammeter','Voltmeter','Thermometer'],answer:'Ammeter',hint:'An ammeter measures current; it is connected in series.',skill:'physics:circuits:ammeter'},
 {stage:2,title:'Calibrate the telescope',prompt:`The telescope trolley travels ${distance} m in ${time} s. Calculate its speed, including the unit.`,numeric:speed,unit:'m/s',hint:`Speed = distance ÷ time. Divide ${distance} by ${time}, then include m/s.`,skill:'physics:speed:calculation'},
 {stage:2,title:'Calibrate the telescope',prompt:`The trolley travels at ${speed} m/s for ${time+2} s. How far does it move? Include the unit.`,numeric:speed*(time+2),unit:'m',hint:`Distance = speed × time. Multiply ${speed} by ${time+2}, then include m.`,skill:'physics:speed:distance'},
 {stage:3,title:'Reconnect the stars',prompt:'The calibration grid places star B at (7, 4). Which number gives its horizontal position?',options:['7','4','11'],answer:'7',hint:'Coordinates are written (x, y): horizontal position first.',skill:'maths:coordinates:x'},
 {stage:3,title:'Reconnect the stars',prompt:'Star A is at (2, 4) and star B is at (7, 4). How many grid units apart are they?',numeric:5,unit:'',hint:'They have the same vertical position. Subtract the horizontal coordinates: 7 − 2.',skill:'maths:coordinates:distance'}
 ];
}
export function gradeTask(task,value){if(task.accepted)return task.accepted.some(a=>normalAnswer(a)===normalAnswer(value));if(task.tokens)return normalAnswer(value)===normalAnswer(task.answer);if(task.answer)return value===task.answer;const text=String(value||'').toLowerCase().trim().replace(/[−–]/g,'-').replace(/\s+/g,' '),match=/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(.*)$/.exec(text);if(!match||Number(match[1])!==task.numeric)return false;const unit=match[2].replace(/\s/g,'');return task.unit==='m/s'?['m/s','ms-1','ms⁻¹','metrespersecond','meterspersecond'].includes(unit):task.unit==='×'?['','x','×','times'].includes(unit):task.unit==='m'?['m','metres','meters'].includes(unit):['','units','gridunits'].includes(unit);}
export function advanceMap(input,week,index,value,at=new Date().toISOString(),requestedTheme='physics',requestedVersion=1){
 const state=input||{version:1,weeks:{},collection:{}},row=state.weeks?.[week]||{progress:0,attempts:0},theme=row.theme&&THEMES[row.theme]?row.theme:(row.attempts>0||row.progress>0?'physics':(THEMES[requestedTheme]?requestedTheme:'physics')),adventureVersion=row.adventureVersion||(row.attempts>0||row.progress>0?1:requestedVersion===2?2:1),tasks=missionFor(week,theme,adventureVersion),cursor=Math.max(0,Math.min(8,Number(row.progress)||0));
 if(cursor>=8||index!==cursor)return {state,ok:false,ignored:true,complete:cursor>=8};
 const ok=gradeTask(tasks[cursor],value),progress=cursor+(ok?1:0),updated={...row,theme,adventureVersion,progress,draft:ok?'':row.draft||'',tokenDraft:ok?[]:row.tokenDraft||[],attempts:(row.attempts||0)+1};let collection={...state.collection},fresh=false;
 if(progress===8){updated.completedAt=at;const id='star-map:'+week;if(!collection[id]){collection[id]={id,theme:'star-map',expeditionTheme:theme,name:THEMES[theme].prize,week,earnedAt:at};fresh=true;}}
 return {state:{...state,version:1,weeks:{...state.weeks,[week]:updated},collection},ok,complete:progress===8,fresh,hint:ok?'Star fragment restored.':tasks[cursor].hint};
}
export function completedStages(progress){return Math.floor(Math.max(0,Math.min(8,Number(progress)||0))/2);}
export function nextWeek(week){const d=new Date(week+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7);return d.toISOString().slice(0,10);}
