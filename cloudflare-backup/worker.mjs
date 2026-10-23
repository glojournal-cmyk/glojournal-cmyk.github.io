

// Gloria encrypted backups. This worker stores ONLY AES-GCM ciphertext.*

// GitHub Pages never contains the upload credential, email API key, or recovery key.*

const ALLOWED_ORIGIN = "https://glojournal-cmyk.github.io";

const MAX_BODY_BYTES = 16 * 1024 * 1024; // encrypted envelope, not raw JSON*

const CACHE_HEADERS = {"cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"};

const encoder = new TextEncoder();



function reply(data,status=200,origin=""){

  const headers={...CACHE_HEADERS,"content-type":"application/json; charset=utf-8"};

  if(origin===ALLOWED_ORIGIN){

    headers["access-control-allow-origin"]=ALLOWED_ORIGIN;

    headers["access-control-allow-headers"]="authorization, content-type";

    headers["access-control-allow-methods"]="GET, POST, OPTIONS";

    Object.assign(headers,{vary:"Origin"});

  }

  return new Response(JSON.stringify(data),{status,headers});

}

async function sha(bytes){

  const raw=await crypto.subtle.digest("SHA-256",bytes);

  return [...new Uint8Array(raw)].map(x=>x.toString(16).padStart(2,"0")).join("");

}

function sameHex(a,b){

  // Equal-length, constant-work compare; never compare secret plaintext.*

  if(typeof a!=="string"||typeof b!=="string"||a.length!==64||b.length!==64)return false;

  let mismatch=0;

  for(let i=0;i<64;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);

  return mismatch===0;

}

async function authorized(request,env){

  if(!/^[0-9a-f]{64}$/.test(env.BACKUP_TOKEN_SHA256||""))return false;

  const header=request.headers.get("authorization")||"";

  if(!/^Bearer [A-Za-z0-9_-]{40,100}$/.test(header))return false;

  const digest=await sha(encoder.encode(header.slice(7)));

  return sameHex(digest,env.BACKUP_TOKEN_SHA256);

}

function validEnvelope(p){

  if(!p||p.format!=="gloria-encrypted-v1"||p.version!==1||

     !["gzip","none",undefined].includes(p.compression)||

     typeof p.iv!=="string"||!/^[A-Za-z0-9_-]{16}$/.test(p.iv)||

     typeof p.ciphertext!=="string"||p.ciphertext.length<24||

     !/^[A-Za-z0-9_-]+$/.test(p.ciphertext)||

     typeof p.keyId!=="string"||!/^[0-9a-f]{16}$/.test(p.keyId)||

     typeof p.savedAt!=="string"||Number.isNaN(Date.parse(p.savedAt))||

     typeof p.contentSha256!=="string"||!/^[0-9a-f]{64}$/.test(p.contentSha256)||

     p.ciphertext.length>MAX_BODY_BYTES)return false;

  return true;

}

async function latest(env){

  const meta=await env.BACKUPS.get("meta/latest.json");

  if(!meta)return null;

  try{return JSON.parse(await meta.text())}catch{return null}

}


const KEEP_RECENT_PROGRESS_BACKUPS=5;
// Never delete content outside the Worker-created progress namespace. In particular,
// static-site/** holds independent site recovery archives; notes are in another R2 bucket.
const PROGRESS_KEY_RE=/^backups\/\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/;

async function verifiedStoredProgress(env,key,expectedDigest=null){
  const stored=await env.BACKUPS.get(key);
  if(!stored)return false;
  const body=await stored.text();
  if(stored.size!==encoder.encode(body).length)return false;
  let snapshot;try{snapshot=JSON.parse(body)}catch{return false}
  if(!validEnvelope(snapshot))return false;
  const digest=await sha(encoder.encode(snapshot.ciphertext));
  return sameHex(digest,snapshot.contentSha256)&&
    (!expectedDigest||sameHex(digest,expectedDigest))&&
    (!stored.customMetadata?.digest||sameHex(digest,stored.customMetadata.digest));
}

/**
 * Retain five latest VALID encrypted learning-progress snapshots only.
 * Fail closed: verify every retained snapshot and current latest pointer before ANY
 * deletion. Never delete unknown/legacy objects, static-site backups, metadata or PDFs.
 * Missing R2 permissions, stale listing or a corrupt backup must not trigger deletion.
 */
async function pruneOldBackups(env){
  if(!env.BACKUPS?.list||!env.BACKUPS?.delete)return {status:"unavailable",deleted:0};
  const pointer=await latest(env);
  if(!pointer||!PROGRESS_KEY_RE.test(pointer.key||"")||
     !/^[0-9a-f]{64}$/.test(pointer.digest||""))
    return {status:"no-verified-pointer",deleted:0};
  const keys=[];
  let cursor, pages=0;
  do{
    const options={prefix:"backups/",limit:1000};
    if(cursor)options.cursor=cursor;
    const page=await env.BACKUPS.list(options);
    if(!Array.isArray(page?.objects))throw Error("R2 backup listing unavailable");
    for(const object of page.objects){
      if(PROGRESS_KEY_RE.test(object?.key||""))keys.push(object.key);
    }
    if(!page.truncated)break;
    if(!page.cursor||page.cursor===cursor||++pages>100)
      throw Error("R2 backup listing incomplete");
    cursor=page.cursor;
  }while(true);
  // Timestamp is part of the immutable object key and sorts chronologically.
  keys.sort((a,b)=>b.localeCompare(a));
  if(keys.length<=KEEP_RECENT_PROGRESS_BACKUPS)
    return {status:"within-limit",deleted:0,retained:keys.length};
  if(keys[0]!==pointer.key)return {status:"stale-latest-pointer",deleted:0};
  for(const key of keys.slice(0,KEEP_RECENT_PROGRESS_BACKUPS)){
    const ok=await verifiedStoredProgress(env,key,key===pointer.key?pointer.digest:null);
    if(!ok)return {status:"verification-failed",deleted:0};
  }
  let deleted=0;
  for(const key of keys.slice(KEEP_RECENT_PROGRESS_BACKUPS)){
    // Every deleted key has the exact encrypted-progress naming convention.
    await env.BACKUPS.delete(key);
    deleted++;
  }
  return {status:"pruned",deleted,retained:KEEP_RECENT_PROGRESS_BACKUPS};
}

async function upload(request,env,origin){

  if(!env.BACKUPS)return reply({error:"Backup store not configured"},503,origin);

  const size=Number(request.headers.get("content-length")||0);

  if(size>MAX_BODY_BYTES)return reply({error:"Backup too large"},413,origin);

  const body=await request.text();

  if(encoder.encode(body).length>MAX_BODY_BYTES)return reply({error:"Backup too large"},413,origin);

  let envelope;try{envelope=JSON.parse(body)}catch{return reply({error:"Invalid backup format"},400,origin)}

  if(!validEnvelope(envelope))return reply({error:"Invalid encrypted backup format"},400,origin);

  // Verify the SHA of *encoded ciphertext*, not attacker-provided plaintext.*

  const digest=await sha(encoder.encode(envelope.ciphertext));

  if(!sameHex(digest,envelope.contentSha256))return reply({error:"Ciphertext checksum mismatch"},400,origin);

  const now=new Date(),timestamp=now.toISOString(),id=crypto.randomUUID();

  const key="backups/"+timestamp.slice(0,10)+"/"+timestamp+"-"+id+".json";

  const stored=await env.BACKUPS.put(key,body,{

    httpMetadata:{contentType:"application/json"},

    customMetadata:{digest,uploadedAt:timestamp,keyId:envelope.keyId}

  });

  if(!stored)return reply({error:"Cloud store rejected backup"},503,origin);

  const verify=await env.BACKUPS.head(key);

  if(!verify||verify.size!==encoder.encode(body).length||verify.customMetadata?.digest!==digest)

    return reply({error:"Backup was not verified; do not treat it as saved"},503,origin);

  const prior=await latest(env);

  const record={key,id,digest,uploadedAt:timestamp,bytes:verify.size,keyId:envelope.keyId};

  // This pointer is advisory. Immutable individual backups are the source of truth.*

  if(!prior||record.uploadedAt>=prior.uploadedAt)await env.BACKUPS.put("meta/latest.json",JSON.stringify(record));

  // Cleanup is best-effort and never turns a verified successful upload into a failure.
  // Retry safely on the next scheduled check if R2 cleanup fails.
  let retention={status:"deferred",deleted:0};
  try{retention=await pruneOldBackups(env)}catch{
    console.warn(JSON.stringify({event:"gloria-progress-retention",status:"deferred"}));
  }
  return reply({saved:true,id,digest,uploadedAt:timestamp,retention},201,origin);

}

function toBase64(bytes){

  let binary="";

  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));

  return btoa(binary);

}

async function signGmailBridge(secret,ts,digest,attachment){

  const key=await crypto.subtle.importKey("raw",encoder.encode(secret),

    {name:"HMAC",hash:"SHA-256"},false,["sign"]);

  const payload=String(ts)+"\n"+digest+"\n"+attachment;

  const sig=await crypto.subtle.sign("HMAC",key,encoder.encode(payload));

  return [...new Uint8Array(sig)].map(n=>n.toString(16).padStart(2,"0")).join("");

}

async function sendDailyEmail(env,sendFetch=fetch){

  if(!env.BACKUPS||!env.GOOGLE_APPS_SCRIPT_URL||

     !env.GOOGLE_APPS_SCRIPT_HMAC_SECRET)return {sent:false,reason:"gmail not configured"};

  const sendUrl=new URL(env.GOOGLE_APPS_SCRIPT_URL);

  if(sendUrl.protocol!=="https:"||sendUrl.hostname!=="script.google.com"||

      !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(sendUrl.pathname)||

      sendUrl.search||sendUrl.hash)throw Error("Configured Gmail bridge URL is invalid");

  if(env.GOOGLE_APPS_SCRIPT_HMAC_SECRET.length<40)

    throw Error("Gmail bridge secret is too short");

  const latestSaved=await latest(env);

  if(!latestSaved?.key)return {sent:false,reason:"no uploaded backup"};

  const lastObject=await env.BACKUPS.get("meta/last-emailed.json");

  let old=null;try{old=lastObject?JSON.parse(await lastObject.text()):null}catch{}

  if(old?.digest===latestSaved.digest)return {sent:false,reason:"already emailed"};

  const file=await env.BACKUPS.get(latestSaved.key);

  if(!file)return {sent:false,reason:"backup missing"};

  const content=await file.text(),envelope=JSON.parse(content);

  if(!validEnvelope(envelope))throw Error("Gmail blocked: encrypted backup corrupted");

  const digest=await sha(encoder.encode(envelope.ciphertext));

  if(!sameHex(digest,latestSaved.digest)||file.size!==encoder.encode(content).length)

    throw Error("Gmail blocked: backup digest verification failed");

  const attachment=toBase64(encoder.encode(content));

  const ts=Date.now();

  const signature=await signGmailBridge(env.GOOGLE_APPS_SCRIPT_HMAC_SECRET,ts,digest,attachment);

  const result=await sendFetch(sendUrl.href,{

    method:"POST",headers:{"content-type":"text/plain; charset=utf-8"},

    body:JSON.stringify({ts,digest,attachment,signature}),redirect:"follow"

  });

  if(!result.ok)throw Error("Gmail bridge rejected request: HTTP "+result.status);

  let receipt=null;try{receipt=await result.json()}catch{throw Error("Gmail bridge returned no valid receipt")}

  if(receipt?.ok!==true||receipt.digest!==digest)

    throw Error("Gmail bridge did not acknowledge the identical encrypted copy");

  await env.BACKUPS.put("meta/last-emailed.json",JSON.stringify({

    digest,key:latestSaved.key,acceptedAt:new Date().toISOString(),sender:"gmail-apps-script"

  }));

  return {sent:true,digest,duplicate:!!receipt.duplicate};

}

export {upload,latest,authorized,sendDailyEmail,validEnvelope,pruneOldBackups};

export default {

  async fetch(request,env){

    const origin=request.headers.get("origin")||"";

    if(origin && origin!==ALLOWED_ORIGIN)return reply({error:"Origin not allowed"},403);

    const url=new URL(request.url);

    if(request.method==="OPTIONS"){

      if(origin!==ALLOWED_ORIGIN)return reply({error:"Origin not allowed"},403);

      return new Response(null,{status:204,headers:{

        ...CACHE_HEADERS,"access-control-allow-origin":ALLOWED_ORIGIN,

        "access-control-allow-methods":"GET, POST, OPTIONS",

        "access-control-allow-headers":"authorization, content-type",

        "access-control-max-age":"600",vary:"Origin"}});

    }

    if(request.method==="GET"&&url.pathname==="/health")return reply({service:"gloria-cloud-backup",ready:!!env.BACKUPS},200,origin);

    if(!await authorized(request,env))return reply({error:"Unauthorized"},401,origin);

    try{

      if(request.method==="POST"&&url.pathname==="/v1/backups")return await upload(request,env,origin);

      if(request.method==="GET"&&url.pathname==="/v1/status"){

        const state=await latest(env);

        const sent=await env.BACKUPS?.get("meta/last-emailed.json");

        let mailed=null;try{mailed=sent?JSON.parse(await sent.text()):null}catch{}

        return reply({latest:state&&{id:state.id,digest:state.digest,uploadedAt:state.uploadedAt},

          lastEmailAccepted:mailed&&{digest:mailed.digest,acceptedAt:mailed.acceptedAt}},200,origin);

      }

      if(request.method==="GET"&&url.pathname==="/v1/backups"){

        const list=await env.BACKUPS.list({prefix:"backups/",limit:1000});

        return reply({items:list.objects.map(o=>({

          id:(o.key.match(/([a-f0-9-]{36})\.json$/)||[])[1]||"",

          key:o.key,uploadedAt:o.uploaded,bytes:o.size

        })),truncated:list.truncated},200,origin);

      }

      if(request.method==="GET"&&url.pathname==="/v1/download"){

        // Restore requires an authenticated owner request. Never publish bucket URLs.*

        const key=url.searchParams.get("key")||"";

        if(!/^backups\/\d{4}-\d{2}-\d{2}\/[A-Za-z0-9:._-]+\.json$/.test(key))

          return reply({error:"Invalid key"},400,origin);

        const data=await env.BACKUPS.get(key);

        if(!data)return reply({error:"Not found"},404,origin);

        return new Response(data.body,{status:200,headers:{

          ...CACHE_HEADERS,"content-type":"application/json","content-disposition":"attachment; filename=gloria-encrypted-backup.json",

          ...(origin===ALLOWED_ORIGIN?{"access-control-allow-origin":ALLOWED_ORIGIN,vary:"Origin"}:{})

        }});

      }

      return reply({error:"Not found"},404,origin);

    }catch{

      // Never include tokens, PII, payloads or provider errors in public response.*

      return reply({error:"Backup service temporarily unavailable"},503,origin);

    }

  },

  async scheduled(event,env,ctx){

    ctx.waitUntil((async()=>{
      try {
        const result=await sendDailyEmail(env);
        // Daily check retries cleanup only; it does not create a new backup.
        // Gmail delivery remains deduplicated by digest.
        try{
          const retention=await pruneOldBackups(env);
          if(retention.deleted)console.log(JSON.stringify({event:"gloria-progress-retention",deleted:retention.deleted}));
        }catch{
          console.warn(JSON.stringify({event:"gloria-progress-retention",status:"deferred"}));
        }
        // Only outcome metadata; never log tokens, encrypted payload or personal records.
        console.log(JSON.stringify({event:"gloria-backup-mail",sent:result.sent,reason:result.reason||null}));
      } catch(error) {
        console.error(JSON.stringify({event:"gloria-backup-mail",sent:false,reason:"bridge-or-storage-failure"}));
        throw error;
      }
    })());

  }

};