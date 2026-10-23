import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
if(!globalThis.crypto) globalThis.crypto=webcrypto;
import {pruneOldBackups} from '../worker.mjs';

const sha=async value=>Array.from(new Uint8Array(
  await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),
  v=>v.toString(16).padStart(2,'0')).join('');

async function fixture(count=8){
  const objects=new Map(), deleted=[];
  for(let i=1;i<=count;i++){
    const day=String(i).padStart(2,'0');
    const when=`2026-10-${day}T12:00:00.000Z`;
    const key=`backups/2026-10-${day}/${when}-00000000-0000-4000-8000-${String(i).padStart(12,'0')}.json`;
    const ciphertext=('A'.repeat(36)+i), digest=await sha(ciphertext);
    const data=JSON.stringify({format:'gloria-encrypted-v1',version:1,compression:'none',
      iv:'A'.repeat(16),ciphertext,keyId:'a'.repeat(16),savedAt:when,contentSha256:digest});
    objects.set(key,{data,digest});
    if(i===count)objects.set('meta/latest.json',{data:JSON.stringify({key,digest,uploadedAt:when})});
  }
  objects.set('static-site/old/site.tar.gz',{data:'do not delete'});
  objects.set('meta/last-emailed.json',{data:'do not delete'});
  objects.set('other/learning-note.pdf',{data:'do not delete'});
  const BACKUPS={
    get:async key=>{
      const o=objects.get(key);
      return o?{size:new TextEncoder().encode(o.data).length,
        customMetadata:o.digest?{digest:o.digest}:undefined,
        text:async()=>o.data}:null;
    },
    list:async ({prefix,cursor})=>{
      const keys=[...objects.keys()].filter(k=>k.startsWith(prefix)).sort();
      const start=cursor?Number(cursor):0, page=keys.slice(start,start+3);
      return {objects:page.map(key=>({key})),truncated:start+3<keys.length,
        cursor:String(start+3)};
    },
    delete:async key=>{deleted.push(key);objects.delete(key);}
  };
  return {env:{BACKUPS},objects,deleted};
}
test('retains five newest progress backups while leaving site archives and metadata untouched',async()=>{
  const x=await fixture(8);
  const result=await pruneOldBackups(x.env);
  assert.deepEqual(result,{status:'pruned',deleted:3,retained:5});
  assert.equal(x.deleted.length,3);
  assert.ok(x.deleted.every(k=>k.startsWith('backups/2026-10-0')));
  assert.equal([...x.objects.keys()].filter(k=>k.startsWith('backups/')).length,5);
  for(const k of ['static-site/old/site.tar.gz','meta/latest.json',
    'meta/last-emailed.json','other/learning-note.pdf'])assert.ok(x.objects.has(k),k);
});
test('corrupt newest retained backup prevents ALL deletion',async()=>{
  const x=await fixture(8);
  const pointer=JSON.parse(x.objects.get('meta/latest.json').data);
  x.objects.get(pointer.key).data=x.objects.get(pointer.key).data.replace('A'.repeat(36),'B'.repeat(36));
  assert.deepEqual(await pruneOldBackups(x.env),{status:'verification-failed',deleted:0});
  assert.equal(x.deleted.length,0);
});
test('missing latest pointer prevents ALL deletion',async()=>{
  const x=await fixture(8);
  x.objects.delete('meta/latest.json');
  assert.deepEqual(await pruneOldBackups(x.env),{status:'no-verified-pointer',deleted:0});
  assert.equal(x.deleted.length,0);
});
test('incomplete R2 listing prevents ALL deletion',async()=>{
  const x=await fixture(8);
  x.env.BACKUPS.list=async()=>({objects:[],truncated:true,cursor:''});
  await assert.rejects(()=>pruneOldBackups(x.env),/incomplete/);
  assert.equal(x.deleted.length,0);
});
test('five or fewer verified progress versions are never pruned',async()=>{
  const x=await fixture(5);
  assert.deepEqual(await pruneOldBackups(x.env),{status:'within-limit',deleted:0,retained:5});
  assert.equal(x.deleted.length,0);
});
test('site snapshot objects alone are never eligible',async()=>{
  const x=await fixture(0);
  assert.deepEqual(await pruneOldBackups(x.env),{status:'no-verified-pointer',deleted:0});
  assert.deepEqual(x.deleted,[]);
});
