import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../',import.meta.url);
const read = p => readFileSync(new URL(p,root),'utf8');
const catalog=JSON.parse(read('notes/catalog.json'));
test('96 unique, dated, expected PDF references',()=>{
 assert.equal(catalog.notes.length,96);
 assert.equal(new Set(catalog.notes.map(n=>n.key)).size,96);
 assert.equal(catalog.notes.reduce((sum,n)=>sum+n.sizeBytes,0),706594613);
 for(const n of catalog.notes){
  assert.match(n.filename,/\.pdf$/i);
  assert.match(n.key,/^(summer|year9)\/(latin|french|biology|chemistry|english|maths|mixed)\//);
  assert.equal(n.status,n.delivery==='site'?'ready':'pending');
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
 assert.match(js,/workerReady&&available\.has\(n\.key\)/);
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

test('original ImageGen photo banners replace vector placeholders in Design C without affecting Latin PDF notes',()=>{
 const js=read('notes/library.js');
 const css=read('notes/library.css');
 const html=read('notes/index.html');
 for(const subject of ['latin','french','english','maths','biology','chemistry','physics']){
   const buffer=readFileSync(new URL('notes/images/generated-e/'+subject+'.png',root));
   assert.ok(buffer.length>1_500_000,'Missing actual generated photo for '+subject);
   assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(buffer.readUInt32BE(16),2172);
   assert.equal(buffer.readUInt32BE(20),724);
 }
 assert.match(js,/function imageFor\(/);
 assert.match(js,/notes\/images\/generated-e/);
 assert.doesNotMatch(js,/notes\/images\/option-e/);
 assert.match(js,/function subjectCard\(/);
 assert.match(js,/function renderDetail\(/);
 assert.match(js,/function noteRow\(/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.subject-art\{[\s\S]*?grid-column:2/);
 assert.match(css,/\.note-row\{width:100%/);
 assert.match(html,/20261023-generatede2/);
 assert.match(html,/id="subjectScreen"/);
 assert.match(html,/id="detailScreen"/);
});

test('six Year 9 Latin vocabulary image PDFs have dedicated chapter buttons and same-site reader paths',()=>{
 const latin=catalog.notes.filter(n=>n.period==='year9'&&n.subject==='latin'&&n.delivery==='site');
 assert.equal(latin.length,6);
 for(let i=1;i<=6;i++){
  const note=latin.find(n=>n.title==='Latin Vocabulary — Chapter '+i);
  assert.ok(note,'Missing chapter '+i);
  assert.equal(note.key,'year9/latin/Year9_Latin_Vocabulary_Chapter_'+i+'.pdf');
  assert.equal(note.url,'/notes/pdf/'+note.key);
  assert.equal(note.status,'ready');
  assert.equal(note.validation.sourcePage,i);
  assert.equal(note.validation.fullPageImageCoverage,true);
 }
 const reader=read('notes/library.js');
 assert.match(reader,/isSiteNote/);
 assert.match(reader,/isSiteNote\(note\)\?note\.url/);
 assert.match(reader,/workerReady&&available\.has\(n\.key\)/);
 assert.match(read('notes/index.html'),/20261023-latinvocab1/);
});

test('R2 screenshot confirms Latin Topic 1–6 object names, not necessarily public reader success',()=>{
 const expected=[
  'Latin_Topic_1_Sum_and_Possum_Illustrated_Notes.pdf',
  'Latin_Topic_2_Verbs_One_Image_Per_Page.pdf',
  'Latin_Topic_3_Adjectives_One_Image_Per_Page.pdf',
  'Latin_Topic_4_Trojan_Horse_One_Page_Per_Image.pdf',
  'Topic5_9pages_easy_download.pdf',
  'Latin_Topic_6_The_Journey_Begins_Image_Generated_10_Pages.pdf'
 ];
 for(const filename of expected){
  const matches=catalog.notes.filter(n=>n.key==='year9/latin/'+filename);
  assert.equal(matches.length,1,'Expected exactly one Latin topical note: '+filename);
  assert.equal(matches[0].validation?.r2ScreenshotVisible,true);
  assert.equal(matches[0].validation?.liveReaderVerified,false);
  assert.notEqual(matches[0].delivery,'site');
 }
 for(const title of ['Latin Topic 2 — Verbs (One Image Per Page)','Latin Topic 3 — Adjectives (One Image Per Page)','Latin Topic 5 — Aeneas and Creusa (9 Pages)']){
  const n=catalog.notes.find(n=>n.title===title);
  assert.ok(n);
  assert.equal(n.approximateSize,true,'Dashboard rounds displayed sizes to MB');
 }
 const client=read('notes/library.js');
 assert.match(client,/isUploadedNote/);
 assert.match(client,/reader not verified/);
 assert.match(client,/isOpenable\(note\)/);
});

test('Year 9 Maths Topic 5 and 2 Nov Biology illustrated PDF notes have exact upload keys',()=>{
 const maths=catalog.notes.filter(n=>n.key==='year9/maths/Year_9_Maths_Topic_5_Notes_10_Pages.pdf');
 const biology=catalog.notes.filter(n=>n.key==='year9/biology/Biology_2Nov_Revision_Notes.pdf');
 assert.equal(maths.length,1);
 assert.equal(biology.length,1);
 assert.equal(maths[0].sizeBytes,2760709);
 assert.equal(biology[0].sizeBytes,25041743);
 assert.equal(maths[0].period,'year9');
 assert.equal(biology[0].subject,'biology');
});


test('all 96 PDF Notes have meaningful topic labels while preserving original R2 object keys',()=>{
 assert.equal(catalog.notes.length,96);
 for(const n of catalog.notes){
  assert.equal(typeof n.topicLabel,'string');
  assert.equal(typeof n.displayTitle,'string');
  assert.equal(typeof n.topicGroup,'string');
  assert.ok(n.topicLabel.length>2, 'Missing topic label for '+n.filename);
  assert.ok(n.displayTitle.length>3, 'Missing title for '+n.filename);
  assert.doesNotMatch(n.displayTitle,/[_]|ImageGenerated|One.Page.Per.Image|\.pdf$/i);
  if(n.period==='summer'&&n.topicGroup==='Dated Revision'&&n.topicLabel.startsWith('Revision')){
   assert.match(n.displayTitle,/\d{1,2}\s*(?:Jul|Aug)/,'No invented summer subject topic when only date is known');
  }
 }
 const year9=catalog.notes.filter(n=>n.period==='year9');
 assert.equal(year9.find(n=>n.subject==='maths').displayTitle,'Equation of a Straight Line');
 assert.equal(year9.find(n=>n.subject==='biology').displayTitle,'2 November Biology Test Revision');
 const latin=year9.filter(n=>n.subject==='latin'&&n.topicGroup==='Topics');
 assert.deepEqual(latin.map(n=>n.topicLabel).sort(),['Topic 1','Topic 2','Topic 3','Topic 4','Topic 5','Topic 6']);
 const js=read('notes/library.js');
 assert.match(js,/row-topic/);
 assert.match(js,/note\.displayTitle\|\|note\.title/);
 assert.match(js,/topic-section/);
 assert.match(js,/topicGroup/);
 assert.match(read('notes/index.html'),/20261023-latinvocab1-generatede2-r2topics1-topicnames1/);
});
