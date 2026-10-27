// Garden V2 draft-only, injectable key-value adapter. Does not touch the existing app storage.
// Callers must supply a storage adapter; no window/localStorage references here.
export const V2_STORAGE_KEY='lux-garden-v2-ledger-draft';
const isLedger=x=>x&&x.version===2&&x.receipts&&typeof x.receipts==='object'&&!Array.isArray(x.receipts)&&x.tasks&&typeof x.tasks==='object'&&!Array.isArray(x.tasks);
const parse=(raw)=>{
 if(raw==null)return null;
 const value=JSON.parse(raw);
 if(!isLedger(value))throw new Error('Invalid Garden V2 ledger snapshot');
 return value;
};
export function loadV2Snapshot(storage,key=V2_STORAGE_KEY){
 if(!storage||typeof storage.getItem!=='function')throw new TypeError('Storage read adapter required');
 try{return {ok:true,snapshot:parse(storage.getItem(key)),error:null};}
 catch(error){return {ok:false,snapshot:null,error:String(error?.message||error)};}
}
export function saveV2Snapshot(storage,ledger,key=V2_STORAGE_KEY){
 if(!storage||typeof storage.setItem!=='function'||typeof storage.getItem!=='function')
  throw new TypeError('Storage read/write adapter required');
 if(!isLedger(ledger))return {ok:false,reason:'invalid_ledger'};
 const raw=JSON.stringify(ledger);
 try{
  // Stop rather than silently overwriting a corrupt or newer/unknown ledger.
  const before=storage.getItem(key);
  if(before!=null)parse(before);
  storage.setItem(key,raw);
  const verified=storage.getItem(key);
  if(verified!==raw)return {ok:false,reason:'readback_mismatch'};
  return {ok:true,reason:null};
 }catch(error){
  return {ok:false,reason:error?.name==='QuotaExceededError'?'quota_exceeded':'storage_failure',
   error:String(error?.message||error)};
 }
}

/**
 * Guard against a second tab or stale reload overwriting newer V2 progress.
 * expectedRaw is the EXACT raw value read when the editing session began (null for new data).
 * This is a synchronous adapter guard, not a cross-device atomic transaction.
 */
export function saveV2SnapshotIfUnchanged(storage,ledger,expectedRaw,key=V2_STORAGE_KEY){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')
  throw new TypeError('Storage read/write adapter required');
 if(typeof expectedRaw!=='string'&&expectedRaw!==null)
  throw new TypeError('Expected raw snapshot string or null');
 if(!isLedger(ledger))return {ok:false,reason:'invalid_ledger'};
 try{
  const current=storage.getItem(key);
  if(current!==expectedRaw)return {ok:false,reason:'stale_snapshot'};
  return saveV2Snapshot(storage,ledger,key);
 }catch(error){
  return {ok:false,reason:error?.name==='QuotaExceededError'?'quota_exceeded':'storage_failure',
   error:String(error?.message||error)};
 }
}
