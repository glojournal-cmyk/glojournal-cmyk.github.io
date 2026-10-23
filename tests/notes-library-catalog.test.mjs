import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../',import.meta.url);
const read = p => readFileSync(new URL(p,root),'utf8');
const catalog=JSON.parse(read('notes/catalog.json'));
test('88 unique, dated, expected PDF references',()=>{
 assert.equal(catalog.notes.length,88);
 assert.equal(new Set(catalog.notes.map(n=>n.key)).size,88);
 assert.equal(catalog.notes.reduce((sum,n)=>sum+n.sizeBytes,0),691005358);
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
test('single ZIP archive maps exactly 25 all-image PDFs without unrelated content',()=>{
 const archive=JSON.parse(read('cloudflare-notes/archives/gloria-zip1.json'));
 assert.equal(archive.entries.length,25);
 assert.equal(archive.archiveBytes,172856064);
 let lastEnd=0;
 for(const entry of archive.entries){
  assert.match(entry.key,/^summer\/(french|latin|biology)\/[A-Za-z0-9_(). -]+\.pdf$/);
  assert.ok(entry.start >= lastEnd+30+entry.key.length);
  assert.ok(entry.start+entry.size <= archive.archiveBytes);
  assert.ok(catalog.notes.some(x=>x.key===entry.key&&x.sizeBytes===entry.size));
  lastEnd=entry.start+entry.size;
 }
 assert.equal(archive.format,'zip-store');
 assert.match(read('cloudflare-notes/worker.mjs'),/archivedPDF/);
 assert.match(read('cloudflare-notes/worker.mjs'),/availableArchive/);
});

test('second ZIP holds exactly 25 separately indexed page-image PDFs',()=>{
 const zip1=JSON.parse(read('cloudflare-notes/archives/gloria-zip1.json'));
 const zip2=JSON.parse(read('cloudflare-notes/archives/gloria-zip2.json'));
 assert.equal(zip2.entries.length,25);
 assert.equal(zip2.archiveBytes,233067053);
 assert.equal(zip2.archiveSha256,'17ce551d7d9606d0dd000f1d5b755d6ddc1607b82aa59fac6f6cc37cefc60415');
 const k1=new Set(zip1.entries.map(e=>e.key));
 assert.equal(new Set(zip2.entries.map(e=>e.key)).size,25);
 for(const e of zip2.entries){
   assert.ok(!k1.has(e.key), 'No Zip1 overlapping key: '+e.key);
   const n=catalog.notes.find(n=>n.key===e.key);
   assert.ok(n,'Missing note in catalogue: '+e.key);
   assert.equal(n.sizeBytes,e.size);
   assert.ok(e.start>=30);
   assert.ok(e.start+e.size<=zip2.archiveBytes);
 }
});

test('notes are rendered as a single full-width button per PDF grouped by academic year and subject',()=>{
 const js=read('notes/library.js');
 const css=read('notes/library.css');
 const html=read('notes/index.html');
 assert.match(js,/YEAR_ORDER = \['year9','summer'\]/);
 assert.match(js,/function yearSection\(/);
 assert.match(js,/function subjectSection\(/);
 assert.match(js,/button\.disabled=!ready/);
 assert.match(js,/function noteRow\(/);
 assert.match(css,/\.note-row\{width:100%/);
 assert.match(css,/\.note-list\{display:flex;flex-direction:column/);
 assert.match(html,/id="noteGroups"/);
 assert.doesNotMatch(html,/id="cards"/);
});
