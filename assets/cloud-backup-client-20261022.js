// Client-side backup envelope: no credentials or plaintext leave the browser.
// The account owner must retain both the upload token and passphrase privately.
const enc=new TextEncoder();
const dec=new TextDecoder();
const b64url=bytes=>{let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const from64url=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const hash=async bytes=>new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
export const ENDPOINT='https://cool-hill-a2a3gloria-private-cloud-backups.glo-journal.workers.dev';
export function validateProgress(s) {
  return s?.app==='lux-scholar-garden' && s.state && typeof s.state.xp==='number' && Array.isArray(s.state.daily);
}
export function readCurrentProgress(storage=localStorage){
  const live=storage.getItem('lux-scholar-garden-v1');
  if(live){
    try{
      const s=JSON.parse(live);
      // Preserve complete native storage payload for safe future import.
      if(s?.state && typeof s.state.xp==='number' && Array.isArray(s.state.daily))
        return {app:'lux-scholar-garden',savedAt:new Date().toISOString(),storageKey:'lux-scholar-garden-v1',raw:live, state:s.state};
    }catch{}
  }
  throw Error('No validated current progress found. No upload attempted.');
}
export async function encryptProgress(progress,passphrase){
  if(!validateProgress(progress))throw Error('Invalid progress');
  if(typeof passphrase!=='string'||passphrase.length<16)throw Error('Passphrase must be 16 or more characters');
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const iterations=310000;
  const material=await crypto.subtle.importKey('raw',enc.encode(passphrase),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt']);
  const plain=enc.encode(JSON.stringify(progress));
  let payload=plain,compression='none';
  if(typeof CompressionStream==='function'){
    const stream=new Blob([plain]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressed=new Uint8Array(await new Response(stream).arrayBuffer());
    if(compressed.length<plain.length){payload=compressed;compression='gzip';}
  }
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,payload));
  const encoded=b64url(ciphertext);
  const digest=hex(await hash(enc.encode(encoded)));
  return {format:'gloria-encrypted-v1',version:1,compression,algorithm:'AES-256-GCM',kdf:'PBKDF2-SHA256',iterations,salt:b64url(salt),iv:b64url(iv),keyId:hex((await hash(salt)).slice(0,8)),ciphertext:encoded,contentSha256:digest,savedAt:new Date().toISOString()};
}
export async function decryptProgress(envelope,passphrase){
  if(envelope?.format!=='gloria-encrypted-v1'||envelope?.version!==1||envelope.kdf!=='PBKDF2-SHA256'||envelope.iterations!==310000)throw Error('Unsupported encrypted backup');
  const salt=from64url(envelope.salt),iv=from64url(envelope.iv);
  if(salt.length!==16||iv.length!==12)throw Error('Invalid encryption metadata');
  if(hex(await hash(enc.encode(envelope.ciphertext)))!==envelope.contentSha256)throw Error('Encrypted backup checksum mismatch');
  const material=await crypto.subtle.importKey('raw',enc.encode(passphrase),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  let payload=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,from64url(envelope.ciphertext)));
  if(envelope.compression==='gzip'){
    if(typeof DecompressionStream!=='function')throw Error('This browser cannot unpack gzip backup');
    payload=new Uint8Array(await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }else if(envelope.compression!=='none')throw Error('Unsupported backup compression');
  const result=JSON.parse(dec.decode(payload));
  if(!validateProgress(result))throw Error('Decrypted backup invalid');
  return result;
}
export async function uploadEncrypted(envelope,token,send=fetch){
  if(!/^[A-Za-z0-9_-]{40,100}$/.test(token))throw Error('Upload token must be 40–100 URL-safe characters');
  const response=await send(ENDPOINT+'/v1/backups',{method:'POST',headers:{'authorization':'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(envelope),cache:'no-store'});
  if(!response.ok)throw Error('Backup upload HTTP '+response.status);
  const receipt=await response.json();
  if(receipt.saved!==true||receipt.digest!==envelope.contentSha256)throw Error('Unverified backup receipt');
  return receipt;
}

function authHeader(token){
 if(!/^[A-Za-z0-9_-]{40,100}$/.test(token))throw Error('Invalid private backup token');
 return {'authorization':'Bearer '+token};
}
export async function readBackEncrypted(token,send=fetch){
 const options={headers:authHeader(token),cache:'no-store'};
 const listResponse=await send(ENDPOINT+'/v1/backups',options);
 if(!listResponse.ok)throw Error('Cloud backup list HTTP '+listResponse.status);
 const listing=await listResponse.json();
 if(!Array.isArray(listing.items)||!listing.items.length)throw Error('No cloud backup available to verify');
 if(listing.truncated)throw Error('Too many backups to safely identify latest; verification unavailable');
 const latest=[...listing.items].sort((a,b)=>String(b.uploadedAt).localeCompare(String(a.uploadedAt)))[0];
 if(!/^backups\/\d{4}-\d{2}-\d{2}\/[A-Za-z0-9:._-]+\.json$/.test(latest?.key||''))throw Error('Unexpected backup key');
 const fileResponse=await send(ENDPOINT+'/v1/download?key='+encodeURIComponent(latest.key),options);
 if(!fileResponse.ok)throw Error('Cloud download HTTP '+fileResponse.status);
 const envelope=await fileResponse.json();
 if(envelope?.format!=='gloria-encrypted-v1')throw Error('Cloud backup not encrypted');
 return {envelope,uploadedAt:latest.uploadedAt};
}
