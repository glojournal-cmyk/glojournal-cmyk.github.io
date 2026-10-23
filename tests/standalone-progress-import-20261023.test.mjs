import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  validatePlainBackup,parseNativeState,nativeImportSnapshot,
  linkedAdditions,commitToStorage,importReadiness,wouldOverwriteNewerStudy,preservesExistingStudy
} from '../assets/standalone-progress-import-20261023.js';
class Storage {
 constructor(entries={}){this.items=new Map(Object.entries(entries));this.failFor=null}
 getItem(k){return this.items.has(k)?this.items.get(k):null}
 setItem(k,v){if(k===this.failFor)throw Error('QuotaExceededError');this.items.set(k,String(v))}
 removeItem(k){this.items.delete(k)}
}
const task=(id,target=10,progress=target)=>({id,target,progress,done:progress>=target});
const sample=()=>({
 app:'lux-scholar-garden',version:10,exportedAt:'2026-10-23T10:59:46.800Z',
 state:{
  xp:7792,today:'2026-10-23',daily:Array.from({length:6},(_,i)=>task('old'+i,20,0)),
  studyDays:['2026-10-19','2026-10-20'],
  dailyCompleteAwarded:{'2026-10-19':true},
  unlockedOutfits:['doctor'],collectibles:['herb']
 }
});
const current22=()=>({
 xp:8000,today:'2026-10-23',
 daily:Array.from({length:10},(_,i)=>task('new'+i,20,0)),
 studyDays:['2026-10-22'],
 dailyLog:{'2026-10-22':{date:'2026-10-22',tasks:[task('latin-vocab',30)],done:1,total:1,complete:true}},
 dailyCompleteAwarded:{'2026-10-22':true},
 unlockedOutfits:['pathologist']
});
test('standard iPad export is recognized without requiring a passphrase',()=>{
 const input=sample();
 assert.equal(validatePlainBackup(JSON.stringify(input)).state.xp,7792);
});
test('invalid and encrypted JSON cannot replace Scholar state',()=>{
 assert.throws(()=>validatePlainBackup('{bad'),/valid JSON/);
 assert.throws(()=>validatePlainBackup(JSON.stringify({format:'gloria-encrypted-v1'})),/encrypted Cloud Backup/);
 assert.throws(()=>validatePlainBackup(JSON.stringify({app:'lux-scholar-garden',state:{xp:0}})),/not a valid standard/);
});
test('normal iPad six-task JSON imports on an empty new browser and readbacks exactly',()=>{
 const storage=new Storage();
 const source=sample();
 const outcome=commitToStorage(source,null,storage);
 assert.equal(outcome.saved.xp,7792);
 assert.equal(outcome.report.legacy,true);
 assert.equal(parseNativeState(storage.getItem('lux-scholar-garden-v1')).state.xp,7792);
 assert.equal(JSON.parse(storage.getItem('lux-scholar-garden-v1')).version,10);
 assert.equal(storage.items.size,1);
});
test('import to computer retains dated evidence on computer and imported file',()=>{
 const existing={
  xp:6000,today:'2026-10-23',daily:Array.from({length:10},(_,i)=>task('new'+i,10,0)),
  dailyLog:{'2026-10-18':{date:'2026-10-18',tasks:[task('french-vocab',30)],done:1,total:1,complete:true}},
  dailyCompleteAwarded:{'2026-10-18':true}
 };
 const storage=new Storage({'lux-scholar-garden-v1':JSON.stringify({state:existing,version:10})});
 const outcome=commitToStorage(sample(),storage.getItem('lux-scholar-garden-v1'),storage);
 assert.equal(outcome.saved.xp,7792);
 assert.equal(outcome.saved.dailyCompleteAwarded['2026-10-18'],true);
 assert.equal(outcome.saved.dailyCompleteAwarded['2026-10-19'],true);
 assert.equal(outcome.saved.dailyLog['2026-10-18'].complete,true);
});
test('older 6-task JSON safely merges into device with 22 Oct proof',()=>{
  const existing=current22();
  const raw=JSON.stringify({state:existing,version:10});
  const storage=new Storage({'lux-scholar-garden-v1':raw});
  assert.equal(wouldOverwriteNewerStudy(sample(),existing),false);
  const result=commitToStorage(sample(),raw,storage);
  assert.equal(result.saved.xp,8000);
  assert.equal(result.saved.daily.length,10);
  assert.equal(result.saved.dailyCompleteAwarded['2026-10-22'],true);
  assert.equal(result.saved.dailyLog['2026-10-22'].complete,true);
  assert.ok(result.saved.studyDays.includes('2026-10-20'));
  assert.ok(result.saved.unlockedOutfits.includes('pathologist'));
  assert.ok(result.saved.unlockedOutfits.includes('doctor'));
  assert.equal(preservesExistingStudy(existing,result.saved),true);
});
test('an old incomplete JSON does not fabricate missing 22 Oct completion',()=>{
  const current={...current22(),dailyLog:{},dailyCompleteAwarded:{},studyDays:['2026-10-23']};
  const raw=JSON.stringify({state:current,version:10});
  const storage=new Storage({'lux-scholar-garden-v1':raw});
  const merged=commitToStorage(sample(),raw,storage);
  assert.equal(merged.saved.dailyCompleteAwarded['2026-10-22'],undefined);
});
test('unsafe merge is still blocked if newer 6-task snapshot loses current 10-task plan',()=>{
  const oldDevice={xp:20,today:'2026-10-19',studyDays:['2026-10-19'],
    daily:Array.from({length:10},(_,i)=>task('ten-'+i,10,0))};
  const raw=JSON.stringify({state:oldDevice,version:10});
  const storage=new Storage({'lux-scholar-garden-v1':raw});
  assert.equal(wouldOverwriteNewerStudy(sample(),oldDevice),true);
  assert.throws(()=>commitToStorage(sample(),raw,storage),/Safety check failed/);
  assert.equal(storage.getItem('lux-scholar-garden-v1'),raw);
});
test('safety checks refuse a merge that drops recorded answer history',()=>{
  const saved={...current22(),history:[{id:'only-on-device',day:'2026-10-22'}]};
  const altered={...saved,history:[]};
  assert.equal(preservesExistingStudy(saved,altered),false);
});
test('storage quota error does not overwrite original or leave newly staged linked data',()=>{
 const backup={...sample(),mathsDrafts:{topic5:{answers:5}}};
 const storage=new Storage();
 storage.failFor='lux-scholar-garden-v1';
 assert.throws(()=>commitToStorage(backup,null,storage),/Import not verified/);
 assert.equal(storage.getItem('lux-scholar-garden-v1'),null);
 assert.equal(storage.getItem('lux-maths-draft-v1'),null);
});
test('existing extra progress fields are never overwritten by an import',()=>{
 const file={...sample(),petCompanion:{masteryPoints:10}};
 const storage=new Storage({'lux-pet-companion-v1':JSON.stringify({masteryPoints:100})});
 const outcome=commitToStorage(file,null,storage);
 assert.equal(outcome.saved.xp,7792);
 assert.deepEqual(JSON.parse(storage.getItem('lux-pet-companion-v1')),{masteryPoints:100});
 assert.equal(outcome.linkedCount,0);
});
test('HTML is a standalone document with visible JSON preview and safe controls',()=>{
 const html=readFileSync('import-progress.html','utf8');
 assert.match(html,/<h1>Import Scholar progress<\/h1>/);
 assert.match(html,/id="backup-file" type="file"/);
 assert.match(html,/id="preview-button"/);
 assert.match(html,/id="download-safety"/);
 assert.match(html,/id="safety-confirm"/);
 assert.match(html,/id="apply-button"/);
 assert.doesNotMatch(html,/#preview,\[hidden\]\{display:none/);
 assert.match(html,/standalone-progress-import-20261023\.js/);
});
test('Scholar direct button and fallback encryption page both open standalone importer',()=>{
 assert.match(readFileSync('assets/scholar-iJ2ilQWG.js','utf8'),/window\.location\.href=`\/import-progress\.html`/);
 assert.match(readFileSync('assets/scholar-plain-import-entry-20261023.js','utf8'),/location\.assign\('\/import-progress\.html'\)/);
 assert.match(readFileSync('encrypted-backup-restore.html','utf8'),/id="plain-import-link" href="\/import-progress\.html"/);
});

test('Import button explains safety prerequisites without bypassing verification',()=>{
  assert.equal(importReadiness({pending:false}),"Choose and preview a JSON backup first.");
  assert.match(importReadiness({pending:true,unsafeMerge:true}),/cannot preserve/);
  assert.match(importReadiness({pending:true,needsSafety:true,safetyAttempted:false}),/Download/);
  assert.match(importReadiness({pending:true,needsSafety:true,safetyAttempted:true,confirmed:false}),/tick the checkbox/);
  assert.equal(importReadiness({pending:true,needsSafety:true,safetyAttempted:true,confirmed:true}),"");
  assert.equal(importReadiness({pending:true,needsSafety:false}),"");
});
test('Safety confirmation is explicit, accessible and not a permanently disabled Import control',()=>{
  const html=readFileSync('import-progress.html','utf8');
  const js=readFileSync('assets/standalone-progress-import-20261023.js','utf8');
  assert.match(html,/id="safety-next-step" role="status"/);
  assert.match(html,/class="safety-check"/);
  assert.match(html,/20261023-guided-import3/);
  assert.match(js,/\$\("apply-button"\)\.disabled=!pending \|\| unsafeMerge/);
  assert.match(js,/const blockReason=importReadiness/);
  assert.match(js,/if\(!safetyAttempted\)\$\("download-safety"\)\.focus\(\)/);
  assert.match(js,/else \$\("safety-confirm"\)\.focus\(\)/);
  assert.match(js,/\$\("safety-confirm"\)\.disabled=false/);
});
