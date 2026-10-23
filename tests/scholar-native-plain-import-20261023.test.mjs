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
test('lazy route cache buster agrees for preload and actual Scholar import',()=>{
 const core=read('assets/index-BLVOhKhN.core.js');
 const urls=[...core.matchAll(/scholar-iJ2ilQWG\.js\?v=[^\`"'\s]+/g)].map(m=>m[0]);
 assert.equal(urls.length,2,'Both preload and dynamic import must have a cache-busted Scholar module');
 assert.equal(new Set(urls).size,1,'The preload and real import must use the SAME version');
 const wrapper=read('assets/index-BLVOhKhN.js');
 const parts=[...wrapper.matchAll(/index-BLVOhKhN\.core\.js\?v=[^\`"'\s]+/g)].map(m=>m[0]);
 assert.equal(parts.length,2,'Both wrapper imports must have a cache-busted core');
 assert.equal(new Set(parts).size,1,'Both wrapper imports must use the SAME version');
});
test('direct fallback route loads same canonical progress state module',()=>{
 const index=read('index.html'),fallback=read('404.html');
 const pattern=/\/assets\/index-BLVOhKhN\.js\?v=[^"'<>\s]+/g;
 const source=[...index.matchAll(pattern)].map(m=>m[0]);
 const recovered=[...fallback.matchAll(pattern)].map(m=>m[0]);
 assert.ok(source.length>=2,'Index must load the versioned app entry');
 assert.deepEqual(source,recovered,'The SPA fallback must use precisely the same app entry URLs');
 assert.equal(new Set(source).size,1,'Do not preload one app version and execute another');
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
