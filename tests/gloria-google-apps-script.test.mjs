import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {createHmac,randomBytes} from "node:crypto";

const source=fs.readFileSync("cloud-backup/google-apps-script.gs","utf8");
const SECRET="owner-only-random-long-demo-secret-for-signature-checking";
const DIGEST="a".repeat(64);
function setup({configured=true,failSend=false}={}){
 const config=new Map(configured?[["GLORIA_BACKUP_HMAC_SECRET",SECRET]]:[]);
 const sent=[],events=[];
 const properties={getProperty:k=>config.get(k)||null,setProperty:(k,v)=>{config.set(k,v);}};
 const utilities={
   computeHmacSha256Signature:(text,key)=>[...createHmac("sha256",key).update(text).digest()].map(n=>n>127?n-256:n),
   base64Decode:input=>[...Buffer.from(input,"base64")],
   newBlob:(bytes,mime,name)=>{
     const content=Buffer.isBuffer(bytes)?bytes:typeof bytes==="string"?Buffer.from(bytes):
       Buffer.from(bytes);
     return {getDataAsString:()=>content.toString("utf8"),name,mime};
   }
 };
 const lock={tryLock:()=>true,releaseLock:()=>events.push("lock:released")};
 const ctx={
  PropertiesService:{getScriptProperties:()=>properties},
  Utilities:utilities,
  MailApp:{sendEmail:data=>{if(failSend)throw Error("simulated provider outage");sent.push(data)}},
  LockService:{getScriptLock:()=>lock},
  ContentService:{MimeType:{JSON:"application/json"},
    createTextOutput:text=>({setMimeType(){return {text}}})},
  Date,JSON,Math,console:{error:()=>{}}
 };
 vm.createContext(ctx);
 vm.runInContext(source,ctx,{filename:"cloud-backup/google-apps-script.gs"});
 const envelope={format:"gloria-encrypted-v1",version:1,keyId:"1".repeat(16),
   savedAt:new Date().toISOString(),iv:"abcd".repeat(4),ciphertext:"ciphertext".repeat(6),
   contentSha256:DIGEST};
 const attachment=Buffer.from(JSON.stringify(envelope)).toString("base64");
 const request=({ts=Date.now(),digest=DIGEST,overrideSignature=null}={})=>{
  const signature=overrideSignature||createHmac("sha256",SECRET)
    .update(String(ts)+"\n"+digest+"\n"+attachment).digest("hex");
  return {postData:{contents:JSON.stringify({ts,digest,attachment,signature})}};
 };
 const receive=req=>JSON.parse(ctx.doPost(req).text);
 return {sent,events,config,request,receive};
}
test("authenticated encrypted attachment goes to fixed Gmail recipient once",()=>{
 const fx=setup();
 assert.deepEqual(fx.receive(fx.request()),{ok:true,digest:DIGEST});
 assert.equal(fx.sent.length,1);
 assert.equal(fx.sent[0].to,"glo.journal@gmail.com");
 assert.equal(fx.sent[0].attachments[0].mime,"application/json");
 assert.equal(fx.config.get("GLORIA_LAST_EMAILED_DIGEST"),DIGEST);
 assert.deepEqual(fx.receive(fx.request()),{ok:true,digest:DIGEST,duplicate:true});
 assert.equal(fx.sent.length,1);
 assert.ok(!JSON.stringify(fx.sent[0]).includes("student plaintext"));
 assert.equal(fx.events.length,2);
});
test("unconfigured, forged, stale, malformed and huge requests cannot send Gmail",()=>{
 for(const config of [{configured:false},{configured:true}]){
  const fx=setup(config);
  if(!config.configured)assert.equal(fx.receive(fx.request()).error,"not-configured");
  else{
   assert.equal(fx.receive(fx.request({overrideSignature:"f".repeat(64)})).error,"unauthorized");
   assert.equal(fx.receive(fx.request({ts:Date.now()-700000})).error,"expired");
   assert.equal(fx.receive({postData:{contents:"{"}}).error,"delivery-failed");
   assert.equal(fx.receive({postData:{contents:"x".repeat(6300000)}}).error,"invalid-request");
  }
  assert.equal(fx.sent.length,0);
 }
});
test("MailApp send outage does not claim email delivered",()=>{
 const fx=setup({failSend:true});
 assert.equal(fx.receive(fx.request()).error,"delivery-failed");
 assert.equal(fx.sent.length,0);
 assert.equal(fx.config.get("GLORIA_LAST_EMAILED_DIGEST"),undefined);
 assert.equal(fx.events.length,1);
});
test("the Apps Script bridge never exposes Gmail credentials in public frontend files",()=>{
 const worker=fs.readFileSync("cloud-backup/worker.mjs","utf8");
 const entry=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
 assert.ok(!entry.includes("GLORIA_BACKUP_HMAC_SECRET"));
 assert.ok(!entry.includes("GOOGLE_APPS_SCRIPT_HMAC_SECRET"));
 assert.ok(!entry.includes("google-apps-script.gs"));
 assert.ok(worker.includes("GOOGLE_APPS_SCRIPT_HMAC_SECRET"));
 assert.ok(!worker.includes("RESEND_API_KEY"));
});
