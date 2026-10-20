// Parent-only opt-in setup; never embeds credentials in GitHub Pages.
// This script is inert until a Cloudflare Worker and upload token are supplied.
import {
  readConfig,pairCloudBackup,importRecoveryKey,enableAutoBackup,
  disableAutoBackup,uploadBackup,getCloudStatus,startAutoCloudBackup
} from "./gloria-cloud-backup-20261020.js";

const PANEL_ID="gloria-cloud-parent-setup";
let unlisten=null,lastReport="Cloud backup not configured";
function status(message){
 lastReport=message;
 const node=document.getElementById("gloria-cloud-status");
 if(node)node.textContent=message;
}
function errorMessage(e){return e?.message||"Cloud backup failed. Existing iPad records are untouched."}
function store(){return globalThis.__luxStore}
function beginSync(){
 if(unlisten||!store())return;
 unlisten=startAutoCloudBackup(store(),{onStatus:r=>{
   if(r?.saved)status("Cloud saved and verified: "+new Date(r.uploadedAt).toLocaleString("en-GB"));
   else if(r?.reason!=="not-enabled")status("Cloud NOT saved. Keep existing iPad records and try when online.");
 }});
}
async function refresh(){
 try{
  const config=await readConfig();
  if(!config){status("Not paired. No data sent.");return}
  if(!config.enabled){status("Paired but OFF. Save your recovery key, then enable.");return}
  beginSync();
  const remote=await getCloudStatus();
  const delivered=remote?.lastEmailAccepted?.acceptedAt;
  status("Cloud enabled. Latest: "+(remote.latest?.uploadedAt||"Not uploaded")+
    ". Email provider accepted: "+(delivered||"Not yet; daily schedule"));
 }catch{status("Cloud status not verified. No saved confirmation.")}
}
function element(tag,attrs={},text=""){
 const e=document.createElement(tag);
 for(const [key,value] of Object.entries(attrs)){
  if(key==="className")e.className=value;
  else e.setAttribute(key,value);
 }
 if(text)e.textContent=text;
 return e;
}
function attach(panel){
 if(!panel||panel.querySelector("#"+PANEL_ID))return;
 const root=element("section",{id:PANEL_ID,style:"margin-top:20px;padding:18px;border:1px solid #b8cabb;border-radius:14px;background:#fffdf7;color:#183246"});
 root.append(element("h3",{style:"font-size:19px;font-weight:700;margin-bottom:6px"},"Cloud + automatic Email backup (parent setup)"));
 root.append(element("p",{style:"font-size:14px;line-height:1.5;margin-bottom:10px"},"Encrypted iPad backup to private cloud, then encrypted daily attachment to glo.journal@gmail.com. Requires private Worker, verified sender, and parent recovery key. No email sent before setup."));
 const setup=element("details");
 const summary=element("summary",{style:"cursor:pointer;font-weight:650"},"Connect private cloud backup");
 setup.append(summary);
 const label1=element("label",{style:"display:block;margin-top:12px"},"Cloudflare backup Worker HTTPS URL");
 const endpoint=element("input",{type:"url",autocomplete:"off",placeholder:"https://your-worker.your-subdomain.workers.dev",style:"display:block;width:100%;padding:10px;font-size:16px;margin-top:3px"});
 label1.append(endpoint);setup.append(label1);
 const label2=element("label",{style:"display:block;margin-top:10px"},"Private device pairing token (keep secret)");
 const token=element("input",{type:"password",autocomplete:"new-password",style:"display:block;width:100%;padding:10px;font-size:16px;margin-top:3px"});
 label2.append(token);setup.append(label2);
 const button=element("button",{type:"button",style:"padding:10px 12px;margin:10px 10px 10px 0;background:#17324d;color:white;border-radius:8px"},"Pair and generate recovery key");
 setup.append(button);
 const recoveryBox=element("div",{hidden:"",style:"margin-top:10px"});
 recoveryBox.append(element("p",{},"IMPORTANT: Copy this 256-bit recovery key to a secure place OUTSIDE this iPad. Without it encrypted emails cannot be restored."));
 const keyField=element("textarea",{readonly:"",rows:"3",style:"width:100%;font-size:16px"});
 recoveryBox.append(keyField);
 const confirm=element("button",{type:"button",style:"padding:10px 14px;margin:9px 0;background:#17324d;color:white;border-radius:8px"},"I safely stored recovery key — enable backups");
 recoveryBox.append(confirm);setup.append(recoveryBox);
 const migrate=element("details");migrate.append(element("summary",{},"Already have a recovery key? Re-pair this device"));
 const oldRecovery=element("input",{type:"password",placeholder:"Paste saved recovery key",autocomplete:"off",style:"width:100%;font-size:16px;padding:10px;margin-top:9px"});
 migrate.append(oldRecovery);
 const rePair=element("button",{type:"button",style:"margin:8px 0;padding:10px"},"Restore recovery key and enable backups");
 migrate.append(rePair);setup.append(migrate);
 root.append(setup);
 const controls=element("div",{style:"display:flex;flex-wrap:wrap;gap:8px;margin:12px 0"});
 const backup=element("button",{type:"button",style:"padding:9px 13px;background:#17324d;color:white;border-radius:8px"},"Back up now");
 const pause=element("button",{type:"button",style:"padding:9px 13px;border:1px solid #17324d;border-radius:8px"},"Pause cloud sync");
 const refreshButton=element("button",{type:"button",style:"padding:9px 13px;border:1px solid #17324d;border-radius:8px"},"Check cloud/email status");
 controls.append(backup,pause,refreshButton);root.append(controls);
 root.append(element("p",{id:"gloria-cloud-status",role:"status",style:"font:600 13px/1.5 system-ui;color:#17324d"},lastReport));
 root.append(element("p",{style:"font:12px/1.5 system-ui;margin-top:7px"},
   "Only shows Cloud saved after cloud checksum confirmation. Email may be delayed. Local storage warnings are separate and are never hidden."));
 panel.append(root);
 button.addEventListener("click",async()=>{
  button.disabled=true;status("Verifying private cloud connection...");
  try{
   const result=await pairCloudBackup({endpoint:endpoint.value.trim(),token:token.value.trim()});
   token.value="";keyField.value=result.recoveryKey;
   recoveryBox.removeAttribute("hidden");
   status("Paired, NOT uploading yet. Save the displayed recovery key OFF this iPad.");
  }catch(e){status("Not paired: "+errorMessage(e))}
  finally{button.disabled=false}
 });
 confirm.addEventListener("click",async()=>{
  if(!keyField.value){status("No recovery key to confirm");return}
  try{
   await enableAutoBackup();
   keyField.value="";recoveryBox.hidden=true;
   beginSync();status("Cloud enabled. Waiting for first verified upload...");
  }catch(e){status("Cloud not enabled: "+errorMessage(e))}
 });
 rePair.addEventListener("click",async()=>{
  try{
   await importRecoveryKey({endpoint:endpoint.value.trim(),token:token.value.trim(),recoveryKey:oldRecovery.value.trim()});
   token.value="";oldRecovery.value="";
   await enableAutoBackup();
   beginSync();
   status("Recovery key restored. Encrypted cloud upload is now enabled.");
  }catch(e){status("Restore key failed: "+errorMessage(e))}
 });
 backup.addEventListener("click",async()=>{
  if(!store()){status("Learning store is not loaded yet");return}
  backup.disabled=true;status("Uploading encrypted progress...");
  try{
   const res=await uploadBackup(store());
   if(res.saved)status("Cloud saved and verified: "+new Date(res.uploadedAt).toLocaleString("en-GB"));
   else status("Not backed up: complete parent pairing and enable first");
  }catch{status("Cloud NOT saved. Check connection or service settings. Current iPad progress unchanged.")}
  finally{backup.disabled=false}
 });
 pause.addEventListener("click",async()=>{
  try{await disableAutoBackup();unlisten?.();unlisten=null;status("Cloud paused. Stored cloud backups remain untouched.");}
  catch{status("Could not pause locally. Do not assume sync status.")}
 });
 refreshButton.addEventListener("click",refresh);
 void refresh();
}
function bootstrap(){
 if(!document.body)return;
 const mount=()=>{const panel=document.getElementById("daily-save-panel");if(panel)attach(panel)};
 mount();
 // The Home backup panel mounts lazily during SPA navigation.
 const observer=new MutationObserver(mount);
 observer.observe(document.body,{childList:true,subtree:true});
 // Retain lightweight DOM observer: Home backup panel may mount after hours of practice.
 void readConfig().then(c=>{if(c?.enabled)beginSync()}).catch(()=>{});
 document.addEventListener("lux:app-ready",()=>{
   void readConfig().then(c=>{if(c?.enabled)beginSync()}).catch(()=>{});
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bootstrap,{once:true});
else bootstrap();
