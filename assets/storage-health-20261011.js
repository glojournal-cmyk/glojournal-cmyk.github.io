/* Visible, non-destructive quota alert for standalone iPad PWA. */
(function(root){
  if(typeof document==="undefined")return;
  const ID="lux-storage-warning";
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
      message.textContent="iPad storage full — answers are in memory but may NOT survive reload. ";
      const link=document.createElement("a");link.href="/";link.textContent="Go Home and export progress to Files";
      link.style.cssText="color:#153951;text-decoration:underline;margin-left:4px";
      node.append(message,link);document.body.append(node);
    }
    if(node)node.hidden=!missing;
  }
  root.addEventListener("scholar:storage-status",event=>paint(event.detail));
  const init=()=>paint(root.__luxStoreQuotaFailed?{saved:false}:null);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})(globalThis);
