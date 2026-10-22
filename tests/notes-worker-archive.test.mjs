import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare-notes/worker.mjs';
import archive from '../cloudflare-notes/archives/gloria-zip1.json' with {type:'json'};
const origin='https://gloria-notes-public.glo-journal.workers.dev';
const entry=archive.entries[0];
function fakeEnv(archiveExists=true){
 const calls=[];
 const NOTES={
  list:async()=>({objects:[],truncated:false}),
  head:async key=> key===archive.archiveKey && archiveExists?
   {size:archive.archiveBytes,uploaded:new Date('2026-10-22T00:00:00Z')}:null,
  get:async (key,opts)=> {
   calls.push({key,range:opts?.range});
   if(key===archive.archiveKey)return {body:new Uint8Array([37,80,68,70])};
   return null;
  }
 };
 return {NOTES,calls};
}
test('no false availability before user uploads archive',async()=>{
 const env=fakeEnv(false);
 const res=await worker.fetch(new Request(origin+'/catalog'),env);
 assert.equal(res.status,200);
 assert.equal((await res.json()).files.length,0);
 const head=await worker.fetch(new Request(origin+'/pdf?key='+encodeURIComponent(entry.key),{method:'HEAD'}),env);
 assert.equal(head.status,404);
});
test('all 25 notes become browseable only after archive size is confirmed',async()=>{
 const env=fakeEnv(true);
 const res=await worker.fetch(new Request(origin+'/catalog'),env);
 const j=await res.json();
 assert.equal(j.files.length,25);
 assert.deepEqual(new Set(j.files.map(x=>x.key)),new Set(archive.entries.map(x=>x.key)));
 assert.equal(j.files.find(x=>x.key===entry.key).size,entry.size);
 const head=await worker.fetch(new Request(origin+'/pdf?key='+encodeURIComponent(entry.key),{method:'HEAD'}),env);
 assert.equal(head.status,200);
 assert.equal(head.headers.get('Content-Length'),String(entry.size));
});
test('streamed PDF byte-range points to the correct internal ZIP offset',async()=>{
 const env=fakeEnv(true);
 const res=await worker.fetch(new Request(origin+'/pdf?key='+encodeURIComponent(entry.key),{
  headers:{Range:'bytes=0-3'}}),env);
 assert.equal(res.status,206);
 assert.equal(res.headers.get('Content-Range'),'bytes 0-3/'+entry.size);
 assert.equal(res.headers.get('Content-Length'),'4');
 assert.equal(await res.text(),'%PDF');
 assert.deepEqual(env.calls.at(-1),{key:archive.archiveKey,range:{offset:entry.start,length:4}});
 const suffix=await worker.fetch(new Request(origin+'/pdf?key='+encodeURIComponent(entry.key),{
  headers:{Range:'bytes=-4'}}),env);
 assert.equal(suffix.status,206);
 assert.deepEqual(env.calls.at(-1),{key:archive.archiveKey,range:{offset:entry.start+entry.size-4,length:4}});
});
test('no write operations or path traversal permitted',async()=>{
 const env=fakeEnv(true);
 const post=await worker.fetch(new Request(origin+'/pdf?key='+encodeURIComponent(entry.key),{method:'POST'}),env);
 assert.equal(post.status,405);
 const attack=await worker.fetch(new Request(origin+'/pdf?key=summer%2Flatin%2F..%2Fsecret.pdf'),env);
 assert.equal(attack.status,400);
 const invalid=await worker.fetch(new Request(origin+'/pdf?key='+encodeURIComponent(entry.key),{headers:{Range:'bytes=999999999-'}}),env);
 assert.equal(invalid.status,416);
});