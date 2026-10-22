import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../',import.meta.url);
const read = p => readFileSync(new URL(p,root),'utf8');
const catalog=JSON.parse(read('notes/catalog.json'));
test('74 unique, dated, expected PDF references',()=>{
 assert.equal(catalog.notes.length,74);
 assert.equal(new Set(catalog.notes.map(n=>n.key)).size,74);
 assert.equal(catalog.notes.reduce((sum,n)=>sum+n.sizeBytes,0),606264265);
 for(const n of catalog.notes){
  assert.match(n.filename,/\.pdf$/i);
  assert.match(n.key,/^(summer|year9)\/(latin|french|biology|chemistry|english|mixed)\//);
  assert.equal(n.status,'pending');
  assert.ok(n.dateAdded>='2026-07-01');
 }
});
test('public R2 reader never references backups or exposes writing operations',()=>{
 const worker=read('cloudflare-notes/worker.mjs');
 const config=read('cloudflare-notes/wrangler.jsonc');
 assert.match(config,/gloria-notes-library/);
 assert.doesNotMatch(config,/gloria-private-encrypted-backups|BACKUPS/);
 assert.doesNotMatch(worker,/NOTES\.(put|delete|createMultipartUpload)/);
 assert.match(worker,/read-only/);
});
test('library renders only object-verified PDF links',()=>{
 const js=read('notes/library.js');
 assert.match(js,/available\.has\(note\.key\)/);
 assert.match(js,/fetch\(API\+'\/catalog'/);
 assert.match(read('notes/index.html'),/library\.js/);
 assert.match(read('assets/study-rpg-integrated-20261019.js'),/\/notes\//);
});