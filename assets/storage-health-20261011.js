/* Non-destructive, unobtrusive storage recovery for the installed iPad PWA. */
(function(root){
  if(typeof document==="undefined")return;
  let recovering=false,attempted=false;
  async function retry(){
    if(recovering)return;
    const store=root.__luxStore;
    if(!store||store.persist?.hasHydrated?.()===false)return;
    recovering=true;attempted=true;
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
  // Never cover a question or answer field with a fixed alert on iPad.
  // Keep the failure flags, events, automatic retry and genuine read-back
  // verification. Save/Backup controls can read this unobtrusive state.
  function paint(detail){
    const failed=detail?.saved===false||root.__luxUnsavedStudyChanges===true;
    if(document.documentElement){
      document.documentElement.dataset.luxSaveState=failed?'unsaved':
        detail?.saved===true?'saved':'unknown';
    }
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
