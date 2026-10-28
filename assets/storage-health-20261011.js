/* Visible, non-destructive quota alert for standalone iPad PWA. */
(function(root){
  if(typeof document==="undefined")return;
  const ID="lux-storage-warning";
  let recovering=false,attempted=false;
  async function retry(){
    if(recovering)return;
    const store=root.__luxStore;
    if(!store||store.persist?.hasHydrated?.()===false)return;
    recovering=true;attempted=true;
    const button=document.getElementById("lux-storage-retry");
    if(button){button.disabled=true;button.textContent="Saving…"}
    try{
      const vault=await import("./backup-vault-20261011.js?v=20261028-live-first1");
      const saved=await vault.recoverProgressStorage(store);
      // A completed primary write is required; an archived backup alone is not success.
      root.__luxStoreQuotaFailed=!saved;
      root.__luxUnsavedStudyChanges=!saved;
      paint({saved,quota:!saved});
    }catch{root.__luxStoreQuotaFailed=true;root.__luxUnsavedStudyChanges=true;paint({saved:false,quota:true})}
    finally{
      recovering=false;
      // paint() replaces the retry button while recovering; refresh the live button, not the detached one.
      paint({saved:!root.__luxUnsavedStudyChanges,quota:root.__luxStoreQuotaFailed});
    }
  }
  // A large fixed failure banner obstructed the iPad Daily Practice screen.
  // Parent-requested UX: NO warning banner, pill, popup or overlay, even when
  // storage fails. Keep failure state and verified non-destructive retry logic.
  // This does NOT mean answers were persisted; it changes presentation only.
  function paint(detail){
    // Keep a small non-blocking notice so unsaved answers are never silent.
    let notice=document.getElementById(ID);
    const failed=detail?.saved===false||root.__luxUnsavedStudyChanges===true;
    if(failed){
      if(!notice){notice=document.createElement('div');notice.id=ID;notice.setAttribute('role','status');notice.style.cssText='position:fixed;bottom:env(safe-area-inset-bottom, 0px);right:10px;z-index:3000;max-width:260px;padding:7px 10px;background:#fff4db;color:#473517;border:1px solid #d8b865;border-radius:8px;font:12px/1.35 system-ui';document.body?.appendChild(notice)}
      if(notice){notice.textContent='Progress not saved yet. ';const b=document.createElement('button');b.type='button';b.id='lux-storage-retry';b.textContent=recovering?'Saving…':'Retry saving';b.disabled=recovering;b.style.cssText='margin-left:6px;border:1px solid #b68b36;border-radius:5px;padding:3px 7px;background:transparent;color:inherit;font:inherit';b.addEventListener('click',()=>void retry());notice.append(b)}
    }else if(detail?.saved===true&&!root.__luxUnsavedStudyChanges){notice?.remove()}
    const missing=detail?.saved===false||root.__luxStoreQuotaFailed===true;
    const clear=detail?.saved===true&&root.__luxStoreQuotaFailed!==true;
    if(clear)attempted=false;
    if(missing&&!attempted&&!recovering)void retry();
  }
  root.addEventListener("lux:app-ready",()=>{if(root.__luxStoreQuotaFailed)void retry()});
  root.addEventListener("scholar:storage-status",event=>paint(event.detail));
  const init=()=>paint(root.__luxStoreQuotaFailed?{saved:false}:null);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})(globalThis);
