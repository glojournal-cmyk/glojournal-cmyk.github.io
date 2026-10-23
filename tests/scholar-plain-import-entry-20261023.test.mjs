import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(p,'utf8');
const handlerSource=read('assets/scholar-plain-import-entry-20261023.js');
function makeHarness(pathname='/scholar'){
 const listeners=[];
 let url=null,prevented=false,stopped=false;
 const global={__gloriaPlainImportEntryInstalled:false};
 const context={
  globalThis:global,
  document:{addEventListener:(type,fn,capture)=>listeners.push({type,fn,capture})},
  location:{pathname},
  window:{location:{assign:next=>{url=next}}},
 };
 runInNewContext(handlerSource,context);
 const fire=(label='Import progress')=>{
  const evt={
   target:{closest:selector=>selector==='button'?{textContent:label}:null},
   preventDefault:()=>{prevented=true},
   stopImmediatePropagation:()=>{stopped=true}
  };
  listeners.find(l=>l.type==='click')?.fn(evt);
  return {url,prevented,stopped};
 };
 return {fire,listeners,global};
}
test('Scholar Import progress intercepts its own button before React redirects encrypted-only',()=>{
 const h=makeHarness();
 assert.equal(h.listeners[0].capture,true);
 assert.deepEqual(h.fire(),{url:'/import-progress.html',prevented:true,stopped:true});
});
test('Other Scholar buttons and all buttons on Home are not intercepted',()=>{
 assert.deepEqual(makeHarness().fire('Export progress'),{url:null,prevented:false,stopped:false});
 assert.deepEqual(makeHarness('/').fire(),{url:null,prevented:false,stopped:false});
});
test('Both SPA entry shells install the safe import route fix',()=>{
 for(const file of ['index.html','404.html']){
  assert.ok(read(file).includes('/assets/scholar-plain-import-entry-20261023.js?v=20261023-standalone2'),file);
 }
});
test('Plain JSON Import is user-triggered and appears above the RPG Home on iPad',()=>{
 const source=read('assets/daily-progress-save.js');
 assert.match(source,/new URLSearchParams\(location.search\).get\("import"\)==="1"/);
 assert.match(source,/z-index:2147483600/);
 assert.match(source,/panel\.querySelector\('#daily-recovery-options'\)\.open=true/);
 assert.match(source,/daily-import-file-button/);
 assert.match(source,/Import & keep existing progress/);
 assert.match(source,/encrypted-backup-restore\.html/);
});
test('Existing encrypted restore remains a separate path',()=>{
 const source=read('encrypted-backup-restore.html');
 assert.match(source,/gloria-encrypted-v1/);
 assert.ok(!handlerSource.includes('localStorage.setItem'));
});
