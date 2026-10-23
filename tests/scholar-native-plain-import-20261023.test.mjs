import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
test('actual Scholar Settings Import button goes to plain JSON importer',()=>{
 const scholar=read('assets/scholar-iJ2ilQWG.js');
 assert.match(scholar,/onClick:\(\)=>\{window\.location\.href=`\/import-progress\.html`\},children:`Import progress`/);
 assert.doesNotMatch(scholar,/onClick:\(\)=>\{window\.location\.href=`\/encrypted-backup-restore\.html`\},children:`Import progress`/);
});
test('Scholar Export and Cloud Backup buttons are unchanged',()=>{
 const scholar=read('assets/scholar-iJ2ilQWG.js');
 assert.match(scholar,/children:`Export progress`/);
 assert.match(scholar,/window\.location\.href=`\/cloud-backup\.html`/);
});
test('lazy route cache buster is present in preload and real import',()=>{
 const core=read('assets/index-BLVOhKhN.core.js');
 const url='scholar-iJ2ilQWG.js?v=20261023-native-plain-import2';
 assert.equal(core.split(url).length-1,2);
 const wrapper=read('assets/index-BLVOhKhN.js');
 assert.equal(wrapper.split('index-BLVOhKhN.core.js?v=20261023-native-plain-import2').length-1,2);
});
test('direct fallback route loads same canonical progress state module',()=>{
 const index=read('index.html'),fallback=read('404.html');
 const url='index-BLVOhKhN.js?v=20261023-mastered20-backup1';
 assert.ok(index.includes(url));
 assert.ok(fallback.includes(url));
});
test('legacy encrypted-only page provides proper normal JSON route',()=>{
 const html=read('encrypted-backup-restore.html');
 assert.match(html,/href="\/import-progress\.html"/);
 assert.match(html,/Import standard Scholar JSON/);
 assert.match(html,/envelope\.app==='lux-scholar-garden'/);
 assert.match(html,/No passphrase is required/);
 assert.match(html,/gloria-encrypted-v1/);
});
test('normal-import route previews without replacing current progress on open',()=>{
 const importer=read('assets/daily-progress-save.js');
 assert.match(importer,/new URLSearchParams\(location.search\).get\("import"\)==="1"/);
 assert.match(importer,/Import & keep existing progress/);
 assert.match(importer,/previewRestore\(await file\.text\(\), file\.name\)/);
 assert.match(importer,/const hasReceipts=/);
 assert.match(importer,/const hasRows=/);
});
