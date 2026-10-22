import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto=webcrypto;
import {sendDailyEmail} from '../worker.mjs';
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const textObject=s=>({text:async()=>s,size:new TextEncoder().encode(s).length});
const url='https://script.google.com/macros/s/abcdef0123456789/exec';
test('Gmail sends verified ciphertext, records accepted digest and skips duplicate',async()=>{
 const ciphertext='Q'.repeat(32),digest=await sha(ciphertext);
 const content=JSON.stringify({format:'gloria-encrypted-v1',version:1,compression:'none',iv:'A'.repeat(16),ciphertext,keyId:'a'.repeat(16),savedAt:'2026-10-22T09:00:00.000Z',contentSha256:digest});
 const pointer={key:'backups/2026-10-22/snapshot.json',digest};
 const map=new Map([['meta/latest.json',textObject(JSON.stringify(pointer))],[pointer.key,textObject(content)]]);
 const writes=[],requests=[];
 const env={BACKUPS:{get:async k=>map.get(k)||null,put:async(k,v)=>{writes.push(k);map.set(k,textObject(v));return true;}},GOOGLE_APPS_SCRIPT_URL:url,GOOGLE_APPS_SCRIPT_HMAC_SECRET:'x'.repeat(48)};
 const fakeFetch=async(u,opts)=>{requests.push({url:u,opts});const req=JSON.parse(opts.body);assert.equal(req.digest,digest);assert.equal(req.attachment,Buffer.from(content).toString('base64'));assert.match(req.signature,/^[a-f0-9]{64}$/);return {ok:true,json:async()=>({ok:true,digest})};};
 const first=await sendDailyEmail(env,fakeFetch);
 assert.equal(first.sent,true);assert.deepEqual(writes,['meta/last-emailed.json']);assert.equal(requests.length,1);
 const second=await sendDailyEmail(env,fakeFetch);assert.deepEqual(second,{sent:false,reason:'already emailed'});assert.equal(requests.length,1);
});
test('Gmail bridge invalid receipt cannot mark a backup emailed',async()=>{
 const ciphertext='Q'.repeat(32),digest=await sha(ciphertext);
 const content=JSON.stringify({format:'gloria-encrypted-v1',version:1,iv:'A'.repeat(16),ciphertext,keyId:'a'.repeat(16),savedAt:'2026-10-22T09:00:00.000Z',contentSha256:digest});
 const pointer={key:'backups/2026-10-22/snapshot.json',digest};
 let wrote=false;
 const env={BACKUPS:{get:async key=>key==='meta/latest.json'?textObject(JSON.stringify(pointer)):key===pointer.key?textObject(content):null,put:async()=>{wrote=true}},GOOGLE_APPS_SCRIPT_URL:url,GOOGLE_APPS_SCRIPT_HMAC_SECRET:'x'.repeat(48)};
 await assert.rejects(()=>sendDailyEmail(env,async()=>({ok:true,json:async()=>({ok:true,digest:'bad'})})),/did not acknowledge/);
 assert.equal(wrote,false);
});
