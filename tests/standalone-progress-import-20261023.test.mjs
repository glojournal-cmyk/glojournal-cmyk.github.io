import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  validatePlainBackup,parseNativeState,nativeImportSnapshot,
  linkedAdditions,commitToStorage
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
test('stale 20 Oct export is blocked from replacing original iPad 22 Oct 10/10',()=>{
 const stored=JSON.stringify({state:current22(),version:10});
 const storage=new Storage({'lux-scholar-garden-v1':stored});
 assert.throws(()=>commitToStorage(sample(),stored,storage),/newer progress/);
 assert.equal(storage.getItem('lux-scholar-garden-v1'),stored);
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
