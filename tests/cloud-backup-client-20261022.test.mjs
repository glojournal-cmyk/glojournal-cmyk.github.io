import test from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {readCurrentProgress,encryptProgress,decryptProgress,uploadEncrypted,readBackEncrypted} from '../assets/cloud-backup-client-20261022.js';
const src={state:{xp:42,daily:[],pets:[{id:'cat'}]},version:1};
test('encrypted backup makes lossless progress roundtrip without plaintext ciphertext',async()=>{
 const progress=readCurrentProgress({getItem:key=>key==='lux-scholar-garden-v1'?JSON.stringify(src):null});
 const envelope=await encryptProgress(progress,'a long unique recovery passphrase 123!');
 assert.equal(envelope.format,'gloria-encrypted-v1');
 assert.ok(!JSON.stringify(envelope).includes('pets'));
 assert.deepEqual(await decryptProgress(envelope,'a long unique recovery passphrase 123!'),progress);
 await assert.rejects(()=>decryptProgress(envelope,'wrong phrase'),/operation|decrypt|authentication|error/i);
});
test('no verified progress never uploads',()=>assert.throws(()=>readCurrentProgress({getItem:()=>'{bad'}),/No validated/));
test('upload requires private token and checks server receipt',async()=>{
 await assert.rejects(()=>uploadEncrypted({contentSha256:'x'},'public'),/token/);
 const receipt=await uploadEncrypted({contentSha256:'abc'},'a'.repeat(40),async()=>({ok:true,json:async()=>({saved:true,digest:'abc',id:'one'})}));
 assert.equal(receipt.id,'one');
 await assert.rejects(()=>uploadEncrypted({contentSha256:'abc'},'a'.repeat(40),async()=>({ok:true,json:async()=>({saved:true,digest:'bad'})})),/Unverified/);
});

test('cloud readback downloads most recent ciphertext and never changes local data',async()=>{
 let urls=[];
 const send=async(url)=>{urls.push(url);if(url.endsWith('/v1/backups'))return {ok:true,json:async()=>({items:[
 {key:'backups/2026-10-20/2026-10-20T12:00:00.000Z-a.json',uploadedAt:'2026-10-20T12:00:00.000Z'},
 {key:'backups/2026-10-22/2026-10-22T12:00:00.000Z-b.json',uploadedAt:'2026-10-22T12:00:00.000Z'}]})};
 return {ok:true,json:async()=>({format:'gloria-encrypted-v1',ciphertext:'abc'})};};
 const out=await readBackEncrypted('a'.repeat(40),send);
 assert.equal(out.uploadedAt,'2026-10-22T12:00:00.000Z');
 assert.match(urls[1],/2026-10-22/);
 assert.equal(out.envelope.ciphertext,'abc');
});
test('cloud readback refuses incomplete listings and malformed keys',async()=>{
 await assert.rejects(()=>readBackEncrypted('a'.repeat(40),async()=>({ok:true,json:async()=>({items:[],truncated:false})})),/No cloud backup/);
 await assert.rejects(()=>readBackEncrypted('a'.repeat(40),async()=>({ok:true,json:async()=>({items:[{key:'bad/path',uploadedAt:'2026-10-22'}]})})),/Unexpected backup key/);
});
