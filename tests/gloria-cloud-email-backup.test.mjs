import test from "node:test";
import assert from "node:assert/strict";
import worker,{sendDailyEmail} from "../cloud-backup/worker.mjs";
import {encryptBackup,decryptBackup,captureLiveProgress} from "../assets/gloria-cloud-backup-20261020.js";

const encoder=new TextEncoder();
function hex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function digest(s){return hex(await crypto.subtle.digest("SHA-256",encoder.encode(s)))}
const TOKEN="Z".repeat(43);
const ORIGIN="https://glojournal-cmyk.github.io";
const sample=()=>({app:"gloria-cloud-snapshot",version:1,capturedAt:new Date().toISOString(),
  main:{app:"lux-scholar-garden",version:10,state:{xp:2862,today:"2026-10-20",
    daily:[{id:"french-vocab",progress:28,target:30}],reviews:{q:{stage:3}},
    pet:"kept",outfit:"blue",recovery:[{day:"2026-10-18"}]}},
  drafts:{"french-practice":{base:[{id:"f1"}],j:13,N:"bonjour",version:1}},
  unfinished:{questionId:"q-french",value:"Je voudrais de l’eau",route:"/study/french/practise"}});
function fakeBucket(){
 const data=new Map();
 return {
   data,
   async put(key,value,options={}){
     const text=typeof value==="string"?value:JSON.stringify(value);
     data.set(key,{text,customMetadata:options.customMetadata||{},
       size:encoder.encode(text).length,uploaded:new Date()});
     return {key,size:encoder.encode(text).length};
   },
   async get(key){
     const value=data.get(key);
     return value?{
       size:value.size,
       text:async()=>value.text,
       body:new ReadableStream({start(c){c.enqueue(encoder.encode(value.text));c.close()}})
     }:null;
   },
   async head(key){
     const v=data.get(key);
     return v?{size:v.size,customMetadata:v.customMetadata}:null;
   },
   async list({prefix=""}={}){
     const objects=[...data.entries()].filter(([k])=>k.startsWith(prefix))
       .map(([key,v])=>({key,size:v.size,uploaded:v.uploaded}));
     return {objects,truncated:false};
   }
 };
}
async function fixture(){
 const store=fakeBucket();
 const env={BACKUPS:store,BACKUP_TOKEN_SHA256:await digest(TOKEN),
   GOOGLE_APPS_SCRIPT_URL:"https://script.google.com/macros/s/AKfycbxTestOnly12345/exec",
   GOOGLE_APPS_SCRIPT_HMAC_SECRET:"test-only-long-random-looking-key-material-please-replace"};
 const raw=crypto.getRandomValues(new Uint8Array(32));
 const key=await crypto.subtle.importKey("raw",raw,{name:"AES-GCM"},false,["encrypt"]);
 const recovery=Buffer.from(raw).toString("base64url");
 const keyId=(await digestBytes(raw)).slice(0,16);
 const payload=sample();
 const envelope=await encryptBackup(payload,key,keyId);
 const url="https://gloria-backup.test/v1/backups";
 const headers={"origin":ORIGIN,"authorization":"Bearer "+TOKEN,"content-type":"application/json"};
 const request=(method,path,extra={})=>new Request("https://gloria-backup.test"+path,{method,
     headers:{"origin":ORIGIN,"authorization":"Bearer "+TOKEN,...extra.headers},...extra});
 return {env,store,raw,key,recovery,keyId,payload,envelope,url,headers,request};
}
async function digestBytes(b){return hex(await crypto.subtle.digest("SHA-256",b))}
async function send(f,envelope=f.envelope){
 return worker.fetch(new Request(f.url,{method:"POST",headers:f.headers,body:JSON.stringify(envelope)}),f.env);
}
test("an encrypted snapshot decrypts with a recovery key and refuses the wrong key",async()=>{
 const f=await fixture();
 const restored=await decryptBackup(f.envelope,f.recovery);
 assert.deepEqual(restored,f.payload);
 await assert.rejects(()=>decryptBackup(f.envelope,Buffer.from(new Uint8Array(32)).toString("base64url")),/does not match/);
 const printed=JSON.stringify(f.envelope);
 assert.ok(!printed.includes("2862")&&!printed.includes("bonjour")&&!printed.includes("Je voudrais"));
 const other=await encryptBackup(f.payload,f.key,f.keyId);
 assert.notEqual(other.iv,f.envelope.iv,"unique AES-GCM nonce for every backup");
});
test("capture includes complete study record, practice drafts and unsubmitted answer without changing state",()=>{
 const progress=sample().main;
 const currentInput={value:"unfinished",matches:()=>true,closest:()=>({getAttribute:()=>"q1"})};
 const store={getState:()=>({exportProgress:()=>JSON.stringify(progress)})};
 const cache={getItem:k=>k==="lux-practice-drafts-v1"?JSON.stringify({draft1:{j:13,N:"bonjour"}}):null};
 const payload=captureLiveProgress(store,cache,{activeElement:currentInput});
 assert.equal(payload.main.state.xp,2862);
 assert.equal(payload.main.state.reviews.q.stage,3);
 assert.equal(payload.drafts.draft1.N,"bonjour");
 assert.equal(payload.unfinished.value,"unfinished");
});
test("origin, bearer credential and preflight fail closed",async()=>{
 const f=await fixture();
 const wrong=await worker.fetch(new Request(f.url,{method:"POST",headers:{"origin":ORIGIN},
  body:JSON.stringify(f.envelope)}),f.env);
 assert.equal(wrong.status,401);
 const alien=await worker.fetch(new Request(f.url,{method:"POST",headers:{
   "origin":"https://evil.example","authorization":"Bearer "+TOKEN},body:JSON.stringify(f.envelope)}),f.env);
 assert.equal(alien.status,403);
 const probe=await worker.fetch(new Request("https://gloria-backup.test/v1/status",{method:"OPTIONS",headers:{origin:ORIGIN}}),f.env);
 assert.equal(probe.status,204);
 assert.equal(probe.headers.get("access-control-allow-origin"),ORIGIN);
 f.env.BACKUP_TOKEN_SHA256="";
 const closed=await send(f);
 assert.equal(closed.status,401);
});
test("cloud commit verifies ciphertext and never returns saved on corrupt or failed write",async()=>{
 const f=await fixture();
 const tampered={...f.envelope,ciphertext:f.envelope.ciphertext+"X"};
 assert.equal((await send(f,tampered)).status,400);
 assert.equal(f.store.data.size,0);
 const reply=await send(f);
 assert.equal(reply.status,201);
 const ack=await reply.json();
 assert.equal(ack.saved,true);
 assert.equal(ack.digest,f.envelope.contentSha256);
 const stored=[...f.store.data.keys()].filter(k=>k.startsWith("backups/"));
 assert.equal(stored.length,1);
 const storedText=f.store.data.get(stored[0]).text;
 assert.equal(storedText,JSON.stringify(f.envelope));
 assert.ok(!storedText.includes('"xp"'));
 const status=await worker.fetch(f.request("GET","/v1/status"),f.env);
 assert.equal(status.status,200);
 assert.equal((await status.json()).latest.digest,ack.digest);
 const dl=await worker.fetch(f.request("GET","/v1/download?key="+encodeURIComponent(stored[0])),f.env);
 assert.equal(dl.status,200);
 assert.deepEqual(await decryptBackup(await dl.json(),f.recovery),f.payload);
});
test("Gmail Apps Script receives HMAC-authenticated encrypted attachment and deduplicates",async()=>{
 const f=await fixture();assert.equal((await send(f)).status,201);
 const posts=[];
 const sender=async(url,options)=>{
   assert.equal(url,f.env.GOOGLE_APPS_SCRIPT_URL);
   const body=JSON.parse(options.body);
   const base=String(body.ts)+"\n"+body.digest+"\n"+body.attachment;
   const key=await crypto.subtle.importKey("raw",
     encoder.encode(f.env.GOOGLE_APPS_SCRIPT_HMAC_SECRET),
     {name:"HMAC",hash:"SHA-256"},false,["verify"]);
   assert.equal(await crypto.subtle.verify("HMAC",key,
     Buffer.from(body.signature,"hex"),encoder.encode(base)),true);
   posts.push(body);
   return new Response(JSON.stringify({ok:true,digest:body.digest}),{status:200});
 };
 const first=await sendDailyEmail(f.env,sender);
 assert.equal(first.sent,true);assert.equal(posts.length,1);
 const content=JSON.parse(Buffer.from(posts[0].attachment,"base64").toString("utf8"));
 assert.deepEqual(content,f.envelope);
 assert.ok(!JSON.stringify(posts[0]).includes("bonjour"));
 const next=await sendDailyEmail(f.env,sender);
 assert.equal(next.sent,false);assert.equal(posts.length,1);
 const v2=await encryptBackup({...f.payload,main:{...f.payload.main,state:{...f.payload.main.state,xp:2900}}},f.key,f.keyId);
 assert.equal((await send(f,v2)).status,201);
 assert.equal((await sendDailyEmail(f.env,sender)).sent,true);
 assert.equal(posts.length,2);
});
test("Gmail bridge failures retain encrypted R2 copy and never mark delivery success",async()=>{
 const f=await fixture();await send(f);
 let calls=0;
 await assert.rejects(()=>sendDailyEmail(f.env,async()=>{
   calls++;return new Response("failed",{status:503});
 }),/HTTP 503/);
 assert.equal(calls,1);
 assert.equal(await f.store.get("meta/last-emailed.json"),null);
 assert.ok((await f.store.list({prefix:"backups/"})).objects.length);
 await assert.rejects(()=>sendDailyEmail(f.env,async()=>new Response(JSON.stringify({
    ok:false,error:"unauthorized"}),{status:200})),/did not acknowledge/);
 assert.equal(await f.store.get("meta/last-emailed.json"),null);
});
test("missing Gmail bridge configuration fails closed",async()=>{
 const f=await fixture();await send(f);
 delete f.env.GOOGLE_APPS_SCRIPT_HMAC_SECRET;
 assert.equal((await sendDailyEmail(f.env)).sent,false);
 assert.equal(await f.store.get("meta/last-emailed.json"),null);
});
test("cloud startup with missing backend configuration cannot leak the plaintext state",async()=>{
 const f=await fixture();f.env.BACKUPS=null;
 const result=await send(f);
 assert.equal(result.status,503);
 assert.equal((await result.json()).saved,undefined);
});
