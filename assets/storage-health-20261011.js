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
      const vault=await import("./backup-vault-20261011.js?v=20261020-quota-retry1");
      const saved=await vault.recoverProgressStorage(store);
      // A completed primary write is required; an archived backup alone is not success.
      root.__luxStoreQuotaFailed=!saved;
      paint({saved,quota:!saved});
    }catch{root.__luxStoreQuotaFailed=true}
    finally{
      recovering=false;
      if(button){button.disabled=false;button.textContent="Retry saving"}
    }
  }
  // A large fixed failure banner obstructed the iPad Daily Practice screen.
  // Parent-requested UX: NO warning banner, pill, popup or overlay, even when
  // storage fails. Keep failure state and verified non-destructive retry logic.
  // This does NOT mean answers were persisted; it changes presentation only.
  function paint(detail){
    // Remove a legacy overlay if this script runs after an earlier version.
    document.getElementById(ID)?.remove();
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
