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
  /* Save a verified Scholar Garden backup directly from live memory without
     leaving the ongoing Practice page or requiring another localStorage write.
     iPadOS Share -> Save to Files is preferable while quota recovery is blocked.
     Unsubmitted text in an active React input is not part of the game store. */
  function exportLiveProgress(){
    const button=document.getElementById("lux-storage-export");
    const message=document.getElementById("lux-storage-export-status");
    const tell=value=>{if(message)message.textContent=value};
    try{
      const data=root.__luxStore?.getState?.()?.exportProgress?.();
      const snapshot=JSON.parse(data||"null");
      if(snapshot?.app!=="lux-scholar-garden"||!Array.isArray(snapshot?.state?.daily))
        throw Error("The current game progress is not available for export.");
      const day=/^\d{4}-\d{2}-\d{2}$/.test(snapshot.state.today||"")?snapshot.state.today:"progress";
      const file=new File([data],"scholar-garden-emergency-"+day+".json",{type:"application/json"});
      // Direct user activation: do not await anything before sharing.
      if(typeof navigator.share==="function"&&navigator.canShare?.({files:[file]})){
        tell("Choose Save to Files. Keep this page open until the JSON file is confirmed.");
        Promise.resolve(navigator.share({files:[file],title:"Scholar Garden emergency progress copy"}))
          .then(()=>tell("Share completed. Check that the JSON backup exists in Files before leaving this page."))
          .catch(error=>tell(error?.name==="AbortError"?"Share cancelled. Progress has not been exported.":"Share failed. Keep this page open and try again."));
      }else{
        const url=URL.createObjectURL(file),link=document.createElement("a");
        link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();
        setTimeout(()=>URL.revokeObjectURL(url),60000);
        tell("Download started. Confirm the JSON file is in Files/Downloads before leaving this page.");
      }
    }catch(error){tell("Could not export: "+(error?.message||"Please retry.")+". Keep this page open.")}
    finally{if(button)button.disabled=false}
  }
  function paint(detail){
    const missing=detail?.saved===false||root.__luxStoreQuotaFailed===true;
    const clear=detail?.saved===true&&root.__luxStoreQuotaFailed!==true;
    if(!missing&&!clear)return;
    let node=document.getElementById(ID);
    if(missing&&!node){
      node=document.createElement("aside");node.id=ID;
      node.setAttribute("role","alert");
      node.style.cssText="position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 82px);left:12px;right:12px;max-width:700px;margin:auto;z-index:2147483000;padding:12px 16px;border:2px solid #9b642b;border-radius:14px;background:#fff5df;color:#412914;box-shadow:0 4px 16px #0003;font:600 14px/1.5 system-ui";
      const message=document.createElement("span");
      message.textContent="Progress could not be saved on this iPad — recent answers may NOT survive reload. ";
      // Do not offer a normal href: a full document navigation could destroy
      // unsaved in-memory answers. Use the existing in-app Home tab instead.
      const instruction=document.createElement("strong");
      instruction.textContent="Do not reload. ";
      instruction.style.cssText="color:#153951;margin-left:4px";
      node.append(message,instruction);
      // Always offer a direct emergency backup. Navigating to Home could
      // discard the current React practice answer before storage recovers.
      const exportNow=document.createElement("button");
      exportNow.id="lux-storage-export";exportNow.type="button";
      exportNow.textContent="Save backup to Files";
      exportNow.style.cssText="color:white;background:#17324d;border:0;border-radius:9px;padding:8px 12px;margin:4px;font:600 14px system-ui;cursor:pointer";
      exportNow.addEventListener("click",exportLiveProgress);
      node.append(exportNow);
      const exportStatus=document.createElement("span");
      exportStatus.id="lux-storage-export-status";
      exportStatus.style.cssText="display:block;font:500 12px/1.4 system-ui;max-width:620px";
      node.append(exportStatus);
      const retryButton=document.createElement("button");
      retryButton.id="lux-storage-retry";retryButton.type="button";
      retryButton.textContent="Retry saving";
      retryButton.style.cssText="color:white;background:#17324d;border:0;border-radius:9px;padding:8px 12px;margin:4px;font:600 14px system-ui;cursor:pointer";
      retryButton.addEventListener("click",retry);
      node.append(retryButton);
      if(location.pathname==="/"){
        const exportNow=document.createElement("button");
        exportNow.type="button";exportNow.textContent="Export current progress";
        exportNow.style.cssText="color:white;background:#17324d;border:0;border-radius:9px;padding:8px 12px;margin-left:8px;font:600 14px system-ui;cursor:pointer";
        exportNow.addEventListener("click",()=>{
          const save=document.getElementById("daily-save-button");
          if(save){save.click();return}
          document.getElementById("daily-save-panel")?.scrollIntoView({block:"center"});
          exportNow.textContent="Scroll down to Keep your progress";
        });
        node.append(exportNow);
      }else{
        const note=document.createElement("span");
        note.textContent="You can back up live game progress here without changing pages. Unsubmitted typed answers may not be included.";
        node.append(note);
      }
      document.body.append(node);
    }
    if(node)node.hidden=!missing;
    if(clear)attempted=false;
    if(missing&&!attempted&&!recovering)void retry();
  }
  root.addEventListener("lux:app-ready",()=>{if(root.__luxStoreQuotaFailed)void retry()});
  root.addEventListener("scholar:storage-status",event=>paint(event.detail));
  const init=()=>paint(root.__luxStoreQuotaFailed?{saved:false}:null);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})(globalThis);
