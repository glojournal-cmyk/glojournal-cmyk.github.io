import test from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {readCurrentProgress,encryptProgress,decryptProgress,uploadEncrypted} from '../assets/cloud-backup-client-20261022.js';
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
