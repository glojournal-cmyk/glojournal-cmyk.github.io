import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 requestJsonDownload,nextAutoBackupDelay,verifiedDailyDone
} from '../assets/backup-download-reliable-20261023.js';

test('ordinary JSON export downloads without requesting OS Web Share permission',()=>{
 const calls=[],link={click(){calls.push('click')},remove(){calls.push('remove')}};
 const host={
  document:{createElement(tag){assert.equal(tag,'a');return link},
   body:{append(element){assert.equal(element,link);calls.push('append')}}},
  URL:{createObjectURL(blob){assert.equal(blob.type,'application/json');return 'blob:stored'},
   revokeObjectURL(id){calls.push(id)}},
  Blob, setTimeout(fn,ms){assert.equal(ms,60000);fn();}
 };
 assert.equal(requestJsonDownload('{"app":"lux-scholar-garden"}','scholar.json',host),true);
 assert.equal(link.download,'scholar.json');
 assert.deepEqual(calls,['append','click','remove','blob:stored']);
});
test('empty export is refused without creating a zero-byte backup',()=>{
 assert.throws(()=>requestJsonDownload('','broken.json',{document:{}}),/empty/);
});
test('15-second throttle queues a fresh backup instead of silently skipping it',()=>{
 assert.equal(nextAutoBackupDelay(10000,10010,15000),15190);
 assert.equal(nextAutoBackupDelay(10000,25100,15000),300);
});
test('final ten quests or dated completion receipt triggers immediate save',()=>{
 const day='2026-10-22';
 const ten=Array.from({length:10},(_,i)=>({id:'quest'+i,target:10,progress:10}));
 assert.equal(verifiedDailyDone({today:day,daily:ten}),true);
 assert.equal(verifiedDailyDone({today:day,daily:ten.map((t,i)=>i===0?{...t,progress:9}:t)}),false);
 assert.equal(verifiedDailyDone({today:day,daily:[],dailyCompleteAwarded:{[day]:true}}),true);
});
test('manual default path downloads and explicit share path can fall back',()=>{
 const source=readFileSync('assets/daily-progress-save.js','utf8');
 assert.match(source,/save\("download"\)/);
 assert.match(source,/save\("share"\)/);
 assert.match(source,/requestJsonDownload\(data,filename\)/);
 assert.match(source,/Device sharing was blocked/);
 assert.match(source,/queueAutoSave\(verifiedDailyDone\(state\) && !verifiedDailyDone\(previous\)\)/);
 assert.doesNotMatch(source,/Share failed:/);
});
test('old automatic recovery copies export as a normal JSON download, never depend on OS Share',()=>{
 const source=readFileSync('assets/daily-progress-save.js','utf8');
 const start=source.indexOf('async function exportAutomaticCopy(');
 const end=source.indexOf('async function refreshCopies(',start);
 const routine=source.slice(start,end);
 assert.match(routine,/requestJsonDownload\(saved\.data,filename\)/);
 assert.doesNotMatch(routine,/navigator\.share/);
});
