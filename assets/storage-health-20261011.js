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
    }catch{root.__luxStoreQuotaFailed=true;paint({saved:false})}
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
      node.setAttribute("aria-label","Study progress storage status");
      // The previous 700px-wide warning blocked the iPad practice controls.
      // Keep an always-visible SMALL status indicator, not a page-wide banner.
      // Failed saves must never look like successfully stored progress.
      node.style.cssText="position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 82px);right:12px;left:auto;width:max-content;max-width:min(360px,calc(100vw - 24px));box-sizing:border-box;z-index:2147483000;padding:0;border:1px solid #98612b;border-radius:12px;background:#fff6e7;color:#412914;box-shadow:0 2px 8px #0002;font:600 13px/1.35 system-ui;overflow:hidden";
      const toggle=document.createElement("button");
      toggle.id="lux-storage-toggle";toggle.type="button";
      toggle.setAttribute("aria-expanded","false");
      toggle.setAttribute("aria-controls","lux-storage-details");
      toggle.setAttribute("aria-label","Progress not saved. Open backup and retry options.");
      toggle.textContent="⚠ Not saved · Details";
      toggle.style.cssText="display:block;min-height:40px;max-width:100%;padding:8px 12px;border:0;background:#fff0d3;color:#583012;font:700 13px/1.2 system-ui;cursor:pointer;text-align:left;white-space:nowrap";
      const details=document.createElement("div");details.id="lux-storage-details";
      details.hidden=true;
      details.style.cssText="padding:9px 12px 12px;max-width:330px;white-space:normal;font:500 13px/1.45 system-ui";
      toggle.addEventListener("click",()=>{
        details.hidden=!details.hidden;
        toggle.setAttribute("aria-expanded",String(!details.hidden));
        toggle.textContent=details.hidden?"⚠ Not saved · Details":"⚠ Not saved · Close";
        node.style.width=details.hidden?"max-content":"min(360px,calc(100vw - 24px))";
      });
      node.append(toggle);
      const message=document.createElement("p");
      message.setAttribute("role","alert");
      message.textContent="Progress could not be saved on this iPad. Recent answers may be lost if you reload.";
      message.style.cssText="margin:0 0 6px";
      const instruction=document.createElement("strong");
      instruction.textContent="Keep this page open until the backup is confirmed.";
      instruction.style.cssText="display:block;margin:0 0 8px;color:#153951";
      details.append(message,instruction);
      const exportNow=document.createElement("button");
      exportNow.id="lux-storage-export";exportNow.type="button";
      exportNow.textContent="Save backup to Files";
      exportNow.style.cssText="color:white;background:#17324d;border:0;border-radius:8px;padding:9px;margin:3px;font:600 13px system-ui;cursor:pointer;min-height:42px";
      exportNow.addEventListener("click",exportLiveProgress);
      details.append(exportNow);
      const retryButton=document.createElement("button");
      retryButton.id="lux-storage-retry";retryButton.type="button";
      retryButton.textContent="Retry saving";
      retryButton.style.cssText="color:white;background:#17324d;border:0;border-radius:8px;padding:9px;margin:3px;font:600 13px system-ui;cursor:pointer;min-height:42px";
      retryButton.addEventListener("click",retry);
      details.append(retryButton);
      const note=document.createElement("p");
      note.textContent="This backup contains recorded game progress. Unsubmitted typed answers may not be included.";
      note.style.cssText="margin:8px 0 0;font:500 12px/1.4 system-ui";
      details.append(note);
      const exportStatus=document.createElement("p");
      exportStatus.id="lux-storage-export-status";
      exportStatus.setAttribute("role","status");
      exportStatus.style.cssText="margin:6px 0 0;font:600 12px/1.4 system-ui";
      details.append(exportStatus);
      node.append(details);
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
