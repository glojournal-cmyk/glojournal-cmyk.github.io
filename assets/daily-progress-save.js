import {backupPreview} from "./progress-backup-preview-20261004.js?ux=20261013-corrections2";
import {readBackup,putBackup,migrateOldBackups,PREVIOUS_KEY,MANUAL_KEY,BEFORE_KEY} from "./backup-vault-20261011.js?v=20261020-quota-retry1&ux=20261013-corrections2";
import { C as store } from "/assets/index-BLVOhKhN.js?v=20261023-mastered20-backup1&ux=20261013-corrections2&uxfix=20261022-priority-ux1";
import { assertFullProgressBackup } from "./full-progress-backup-guard-20261023.js";
import {assessImport,mergeImportProgress} from "./backup-import-safety-20261023.js";
import {mergeDailyHistory} from "./daily-record-integrity-20261018.js?v=20261018-daily-record1";

const SNAPSHOT_KEY = "lux-daily-manual-backup-v1";
const AUTO_KEY = "lux-progress-auto-v1";
const BEFORE_RESTORE_KEY = "lux-progress-before-restore-v1";
let autoTimer, lastAutoSignature = "", selectedRestore = null, currentExportShared = false;
let pendingExternalSafety = null, externalSafetyOffered = false;
let lastAutoAttemptAt = 0, quotaRetryAfter = 0;
const previewCache=new Map();
const MIN_AUTO_INTERVAL_MS = 15000, QUOTA_RETRY_MS = 600000;
function backupSignature(data) {
 try {
  const parsed = JSON.parse(data);
  // exportProgress adds a timestamp on every call, even without a state change.
  delete parsed.exportedAt;
  return JSON.stringify(parsed);
 } catch { return String(data || ""); }
}
let autoSaveBusy=false;
async function autoSave(force=false){
 clearTimeout(autoTimer);
 const now=Date.now();
 if(autoSaveBusy||now<quotaRetryAfter)return;
 if(!force&&now-lastAutoAttemptAt<MIN_AUTO_INTERVAL_MS)return;
 lastAutoAttemptAt=now;autoSaveBusy=true;
 try{
  await migrateOldBackups();
  const state=store.getState(),parsed=JSON.parse(state.exportProgress());
  assertFullProgressBackup(parsed,state);
  const data=JSON.stringify(parsed),signature=backupSignature(data);
  if(signature===lastAutoSignature)return;
  const previous=await readBackup(AUTO_KEY),today=summary(state);
  if(previous?.data&&backupSignature(previous.data)===signature){lastAutoSignature=signature;return}
  if(previous?.data&&previous.day===today.day){
   let previousState=null;
   try{previousState=JSON.parse(previous.data)?.state}catch{}
   if(Number(previous.done)>today.done || Number(previousState?.xp)>Number(parsed.state?.xp)){
    const el=document.getElementById("daily-auto-status");
    if(el)el.textContent="A saved copy has more progress. Check Backup history before overwriting it.";
    return;
   }
  }
  if(previous?.data&&Number(parsed.state?.xp)===0){
   let before;try{before=JSON.parse(previous.data)?.state}catch{}
   if(Number(before?.xp)>0)return;
  }
  if(previous?.data&&previous.day!==today.day){
   const older=await readBackup(PREVIOUS_KEY);
   if(!older?.data||String(older.day||"")<String(previous.day||""))await putBackup(PREVIOUS_KEY,previous);
  }
  const saved={savedAt:new Date().toISOString(),...today,data};
  await putBackup(AUTO_KEY,saved);
  lastAutoSignature=signature;
  refreshCopies();
  const el=document.getElementById("daily-auto-status");
  if(el)el.textContent=(parsed.backupWarnings?.length
    ? "Saved learning progress with "+parsed.backupWarnings.length+" optional-storage warning(s); unparseable source text is kept in the backup · "
    : "Saved automatically in iPad recovery vault · ")+new Date(saved.savedAt).toLocaleTimeString("en-GB");
 }catch(error){
  if(/quota/i.test(String(error?.name||"")+" "+String(error?.message||"")))quotaRetryAfter=Date.now()+QUOTA_RETRY_MS;
  const el=document.getElementById("daily-auto-status");
  if(el)el.textContent="Automatic backup unavailable. Export progress to Files. "+(error?.message||"");
 }finally{autoSaveBusy=false}
}
store.subscribe(()=>{clearTimeout(autoTimer);autoTimer=setTimeout(autoSave,250)});
window.addEventListener("pagehide",()=>autoSave(true));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")autoSave(true)});
window.addEventListener("scholar:learning-changed",()=>autoSave());
window.addEventListener("scholar:maths-progress-changed",()=>autoSave());
window.addEventListener("scholar:pet-changed",()=>autoSave());
window.addEventListener("scholar:mp-changed",()=>autoSave());
const PANEL_ID = "daily-save-panel";

function summary(state) {
  const tasks = Array.isArray(state.daily) ? state.daily : [];
  return { day: state.today || "", done: tasks.filter(t => Number(t.target) > 0 && Number(t.progress) >= Number(t.target)).length, total: tasks.length };
}
function savedCopy() {
  try {
    const saved = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "null");
    return saved && typeof saved.data === "string" ? saved : null;
  } catch { return null; }
}
function status(message, tone = "") {
  const element = document.getElementById("daily-save-status");
  if (element) { element.textContent = message; element.dataset.tone = tone; }
}
function savedStatus() {
  const saved = savedCopy();
  if (!saved) return "No manual backup yet. Progress also saves automatically on this iPad.";
  const current = summary(store.getState());
  const time = new Date(saved.savedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  return `Last saved ${time} · ${saved.done}/${saved.total} tasks (${saved.day})${saved.day === current.day && saved.done > current.done ? " · Saved copy has more completed tasks" : ""}.`;
}
function showSpaceRepair() {
  currentExportShared=true;
  const button=document.getElementById("daily-free-backup-space");
  if(button)button.hidden=false;
}
function freeDuplicateBackups() {
 if(!currentExportShared)return status("Export the current progress to Files first.","error");
 if(!confirm("Have you verified that your CURRENT progress JSON exists in Files/iCloud Drive? Only older redundant backup copies will be deleted. The latest automatic backup and Scholar game data will stay."))return;
 const mainKey="lux-scholar-garden-v1";
 const mainBefore=localStorage.getItem(mainKey), latestAuto=localStorage.getItem(AUTO_KEY);
 if(!mainBefore || !latestAuto)return status("Your Scholar progress or latest automatic copy is missing. Nothing was deleted.","error");
 let before;
 try {
  before=JSON.parse(mainBefore);
  if(typeof before?.state?.xp!=="number")throw Error("Could not verify stored XP");
 }catch{return status("Main Scholar data cannot be validated. Nothing was deleted.","error")}
 // Reclaim space from old extra copies, never delete the latest automatic
 // backup, current game store, pet collection or the external exported file.
 try {
  [AUTO_KEY+"-previous",SNAPSHOT_KEY].forEach(key=>localStorage.removeItem(key));
  const mainAfter=localStorage.getItem(mainKey);
  if(mainAfter!==mainBefore || localStorage.getItem(AUTO_KEY)!==latestAuto)
   throw Error("Main progress or automatic backup unexpectedly changed");
  // Retry saving the live (potentially newer) progress after freeing space.
  // Never claim success unless the persisted day, XP and daily credits match.
  const live=store.getState();
  try { store.setState({}); } catch {}
  const persisted=JSON.parse(localStorage.getItem(mainKey)||"null")?.state;
  const compact=tasks=>(Array.isArray(tasks)?tasks:[]).map(t=>[t.id,Number(t.progress)||0,Number(t.target)||0]);
  const durable=!!persisted && Number(persisted.xp)===Number(live.xp) &&
    persisted.today===live.today &&
    JSON.stringify(compact(persisted.daily))===JSON.stringify(compact(live.daily));
  // Back off the duplicate automatic snapshot while the primary is recovering.
  lastAutoAttemptAt=Date.now();
  quotaRetryAfter=Date.now()+QUOTA_RETRY_MS;
  status(durable
    ? "Current progress verified in iPad storage. Latest automatic backup preserved. Keep your JSON file in Files."
    : "Older copies cleared, but CURRENT progress still could not be verified in iPad storage. Keep the JSON file and avoid reloading.",
    durable?"success":"error");
  const button=document.getElementById("daily-free-backup-space");
  if(button)button.hidden=true;
  currentExportShared=false;
 }catch(error){
  status("Space recovery could not be verified: "+(error?.message||"")+". Keep your external backup.","error");
 }
}
async function save(){
 const button=document.getElementById("daily-save-button");button.disabled=true;
 try{
  const current=store.getState(),data=current.exportProgress(),parsed=JSON.parse(data);
  assertFullProgressBackup(parsed,current);
  const today=summary(parsed.state),saved={savedAt:new Date().toISOString(),...today,data};
  const filename="scholar-garden-"+(today.day||"progress")+"-"+new Date().toISOString().slice(11,16).replace(":","")+".json";
  const file=new File([data],filename,{type:"application/json"});
  if(navigator.canShare?.({files:[file]})&&navigator.share){
    try{
      // Share while the direct tap's activation is still active.
      await navigator.share({files:[file],title:"Scholar Garden progress backup"});
      status((parsed.backupWarnings?.length
        ? "Study record exported with optional-data warnings; original raw text is included. "
        : "Export initiated. ")+"Verify the JSON file is in Files before reloading.","success");
      putBackup(MANUAL_KEY,saved).then(()=>refreshCopies()).catch(()=>{});
    }catch(error){status(error?.name==="AbortError"?"Share cancelled. No data was changed.":"Share failed: "+(error?.message||""),"error")}
  }else{
    const url=URL.createObjectURL(file),a=document.createElement("a");
    a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    status((parsed.backupWarnings?.length
      ? "Study record exported with optional-data warnings; original raw text is included. "
      : "Download initiated. ")+"Verify the JSON file in Files before reloading.","success");
    putBackup(MANUAL_KEY,saved).then(()=>refreshCopies()).catch(()=>{});
  }
 }catch(error){status("Export failed: "+(error?.message||"Please retry"),"error")}
 finally{button.disabled=false}
}
function previewRestore(data, name, meta = {}) {
  try {
    const info=backupPreview(data,store.getState(),meta);
    const report=assessImport(JSON.parse(data),store.getState());
    selectedRestore={data,name};
    pendingExternalSafety=null;externalSafetyOffered=false;
    const pendingBox=document.getElementById('daily-external-safety');
    if(pendingBox)pendingBox.hidden=true;
    const parent=document.getElementById('daily-recovery-options');
    if(parent)parent.open=true;
    const box=document.getElementById('daily-restore-preview');box.hidden=false;
    const when=info.savedAt&&!Number.isNaN(Date.parse(info.savedAt))?new Date(info.savedAt).toLocaleString('en-GB'):'Date not recorded';
    const warning=report.legacy
      ? 'Legacy partial export: missing recent detailed Daily Records. Its newest saved study evidence is '+(report.savedDay||'unknown')+'. It cannot restore any absent newer dates. '
      : '';
    document.getElementById('daily-restore-description').textContent=
      `${name} · ${when}. Backup: ${info.saved.day}, ${info.saved.done}/${info.saved.total} tasks, ${info.saved.xp} XP. Current: ${info.current.day}, ${info.current.done}/${info.current.total} tasks, ${info.current.xp} XP. `+
      warning+'Import safely combines existing and backup learning evidence; XP is not added twice. A safety copy is required if this device has progress.';
    status('Backup opened successfully. Review the missing-history warning, then choose Import & keep existing progress.');
  } catch(error) { selectedRestore=null;const box=document.getElementById('daily-restore-preview');if(box)box.hidden=true;status(error.message||'Could not read this backup.','error'); }
}
async function exportAutomaticCopy(key,label) {
  const saved=previewCache.get(key)||await readBackup(key);
  if (!saved?.data || typeof saved.data !== "string") {
    status("No automatic copy is stored on this iPad.", "error");
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(saved.data);
    if (parsed?.app !== "lux-scholar-garden" || !Array.isArray(parsed?.state?.daily))
      throw new Error("Invalid backup data");
  } catch {
    status("The automatic copy could not be validated. Nothing was changed.", "error");
    return;
  }
  // Export the saved snapshot exactly. Never replace the live state or overwrite the snapshot.
  const stamp = String(saved.savedAt || new Date().toISOString()).slice(0,10);
  const filename = "scholar-garden-" + label + "-" + (saved.day || stamp) + ".json";
  const file = new File([saved.data],filename,{type:"application/json"});
  const button=document.getElementById(key===AUTO_KEY?"daily-auto-export":"daily-auto-previous-export");
  if (button) button.disabled=true;
  try {
    if (navigator.canShare?.({files:[file]}) && navigator.share) {
      try {
        await navigator.share({files:[file],title:"Scholar Garden "+label+" backup"});
        status("Automatic copy shared. Check that you saved the JSON file in Files or iCloud Drive.","success");
      } catch(error) {
        if(error?.name==="AbortError") status("Share cancelled. The automatic copy is still saved on this iPad.");
        else throw error;
      }
    } else {
      const url=URL.createObjectURL(file);
      const link=document.createElement("a");
      link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      status("Backup downloaded. Check the Files app before clearing any website data.","success");
    }
  } catch {
    status("Could not export the automatic backup. The original local copy remains untouched.","error");
  } finally {
    if (button) button.disabled=false;
  }
}
async function refreshCopies(){
 for(const [id,key] of [['daily-before-restore',BEFORE_RESTORE_KEY],['daily-auto-previous',PREVIOUS_KEY],['daily-auto-restore',AUTO_KEY],['daily-auto-export',AUTO_KEY],['daily-auto-previous-export',PREVIOUS_KEY],['daily-restore-button',SNAPSHOT_KEY]]){
   const button=document.getElementById(id);if(!button)continue;
   const saved=await readBackup(key);
   if(saved)previewCache.set(key,saved);
   button.disabled=!saved?.data;
   const info=document.getElementById(id+"-info");
   if(info)info.textContent=saved?.data?`${new Date(saved.savedAt).toLocaleString("en-GB")} · ${saved.day} · ${saved.done}/${saved.total} tasks`:"No copy saved yet";
 }
}
async function restore(data, name, externalSafetyConfirmed=false) {
  const live=store.getState();
  let plan;
  try {plan=mergeImportProgress(JSON.parse(data),live,mergeDailyHistory);}
  catch(error) {return status("Import failed: "+(error?.message||"Unreadable JSON"),"error");}
  const {backup,report}=plan;
  const text=report.legacy ? " This is a legacy PARTIAL backup: it cannot bring back missing dated study evidence." : "";
  if(!confirm("Import "+name+" and safely combine learning progress? Existing saved completion dates and higher XP are preserved."+text))return;
  if(report.currentHasProgress && !externalSafetyConfirmed) {
    // An existing learner's progress ALWAYS needs a verified safety copy.
    let currentData;
    try {
      currentData=live.exportProgress();
      const parsed=JSON.parse(currentData);
      if(parsed?.app!=="lux-scholar-garden" ||
        !Array.isArray(parsed?.state?.daily))throw Error("Invalid live snapshot");
      if(parsed.state.daily.length!==10 || !parsed.state.dailyLog) {
        // Even if full export fails, keep *all* serializable live state in
        // the safety copy. This must not be used as a regular full backup.
        currentData=JSON.stringify({
          app:"lux-scholar-garden",version:10,
          exportedAt:new Date().toISOString(),state:live,
          safetyCopyFallback:true
        });
      }
    } catch(error) {
      try {
        currentData=JSON.stringify({app:"lux-scholar-garden",version:10,
          exportedAt:new Date().toISOString(),state:live,safetyCopyFallback:true});
      } catch {
        return status("Import blocked: current learning progress could not be copied. Nothing changed.","error");
      }
    }
    try {
      await putBackup(BEFORE_RESTORE_KEY,{
        savedAt:new Date().toISOString(),...summary(live),data:currentData
      });
    } catch(error) {
      pendingExternalSafety={data,name,currentData};
      externalSafetyOffered=false;
      const fallback=document.getElementById('daily-external-safety');
      if(fallback)fallback.hidden=false;
      return status("Your browser storage could not safeguard the existing progress ("+
        (error?.message||"storage quota")+
        "). Use the button below to save a safety JSON to Files, verify it, then continue the Import. Nothing has been overwritten.","error");
    }
  }
  const result=store.getState().importProgress(JSON.stringify(backup));
  if(!result?.ok)return status((result?.error||"Import failed")+
    ". Original and safety backup are unchanged.","error");
  // Persist and verify only after the hydrate/normalise microtasks settle.
  await Promise.resolve();await Promise.resolve();
  const imported=store.getState();
  let durable=null;try{durable=JSON.parse(localStorage.getItem("lux-scholar-garden-v1")||"null")?.state}catch{}
  const hasReceipts=Object.entries(backup.state.dailyCompleteAwarded||{}).every(
    ([day,earned])=>earned!==true||durable?.dailyCompleteAwarded?.[day]===true);
  const hasRows=Object.entries(backup.state.dailyLog||{}).every(
    ([day,row])=>!(row?.tasks?.length)||Array.isArray(durable?.dailyLog?.[day]?.tasks));
  const correct=durable&&Number(durable.xp)>=Number(backup.state.xp)&&
    Number(durable.xp)===Number(imported.xp)&&durable.today===imported.today&&
    hasReceipts&&hasRows;
  if(!correct)return status("Import reached memory but could not be VERIFIED on this device. "+
    "Do NOT reload or delete the JSON. Device storage may be full; your safety copy is preserved.","error");
  status("Import successful: progress verified in device storage, with earlier records preserved.","success");
  selectedRestore=null;
  location.reload();
}
function mount() {
  if (document.getElementById(PANEL_ID)) return;
  const heading = [...document.querySelectorAll("h2")].find(el => el.textContent.trim() === "Raise her today");
  const card = heading?.parentElement?.parentElement?.parentElement;
  if (!card) return;
  const panel = document.createElement("details");
  panel.id = PANEL_ID;
  panel.setAttribute("aria-label", "Save daily progress");
  panel.innerHTML = `
    <summary style="cursor:pointer;min-height:44px;padding:10px 0;font-weight:600">Progress & backup</summary>
    <div class="daily-save-heading"><strong>Keep your progress</strong><p id="daily-save-status" role="status" aria-live="polite"></p></div>
    <p id="daily-auto-status" role="status" aria-live="polite"></p>
    <div class="daily-save-actions"><button id="daily-save-button" type="button">Save progress & backup</button>
<button id="daily-import-file-button" type="button">Import JSON from Files</button>
<input id="daily-backup-file" type="file" accept="application/json,.json" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none" aria-label="Choose Scholar Garden JSON backup">
</div>
    <p class="daily-save-note">Directly exports your current progress to Files without first using iPad website storage. Always verify the JSON file in Files.</p>
    <details id="daily-recovery-options"><summary>Backup history & restore</summary>
      <p class="daily-save-note">Preview a copy before restoring. Files kept in Files or iCloud Drive can recover progress after browser data is cleared.</p>
      <div class="daily-backup-copy"><button id="daily-before-restore" type="button">Preview progress before last restore</button><p id="daily-before-restore-info"></p></div>
      <div class="daily-backup-copy"><button id="daily-auto-previous" type="button">Preview previous automatic copy</button><p id="daily-auto-previous-info"></p></div>
      <div class="daily-backup-copy"><button id="daily-auto-restore" type="button">Preview latest automatic copy</button><p id="daily-auto-restore-info"></p></div>
      <div class="daily-backup-copy"><button id="daily-auto-export" type="button">Export latest automatic copy to Files</button><p id="daily-auto-export-info"></p></div>
      <div class="daily-backup-copy"><button id="daily-auto-previous-export" type="button">Export previous automatic copy to Files</button><p id="daily-auto-previous-export-info"></p></div>
      <div class="daily-backup-copy"><button id="daily-restore-button" type="button">Preview manual backup</button><p id="daily-restore-button-info"></p></div>
      <p class="daily-save-note">Choose Import JSON from Files above to open an old or new Scholar backup. It will show a preview before changing anything.</p>
      <section id="daily-restore-preview" aria-label="Backup restore preview" hidden>
        <strong>Check this backup</strong><p id="daily-restore-description"></p>
        <button id="daily-restore-apply" type="button">Import & keep existing progress</button>
        <button id="daily-restore-cancel" type="button">Cancel</button>
        <div id="daily-external-safety" hidden>
          <p class="daily-save-note">Your device could not store its safety copy internally. Export the CURRENT progress before importing. Verify that Files contains the safety JSON; never delete the original progress file.</p>
          <button id="daily-save-safety-file" type="button">Save current progress safety JSON to Files</button>
          <button id="daily-confirm-safety-file" type="button" disabled>I've verified the safety file · Continue Import</button>
        </div>
      </section>
    </details>
    <p class="daily-save-note">Progress saves automatically on this device. Save a backup file to keep a separate copy.</p>`;
  card.append(panel);
  status("Tap Save progress & backup to export the current XP and tasks safely.");
  refreshCopies();
  panel.querySelector('#daily-recovery-options').addEventListener('toggle',refreshCopies);
  panel.querySelector('#daily-import-file-button').addEventListener('click',()=>panel.querySelector('#daily-backup-file').click());
  panel.querySelector('#daily-restore-apply').addEventListener('click',()=>{if(selectedRestore)restore(selectedRestore.data,selectedRestore.name)});
  panel.querySelector('#daily-restore-cancel').addEventListener('click',()=>{
    selectedRestore=null;pendingExternalSafety=null;externalSafetyOffered=false;
    panel.querySelector('#daily-restore-preview').hidden=true;status(savedStatus())
  });
  panel.querySelector('#daily-save-safety-file').addEventListener('click',async()=>{
    if(!pendingExternalSafety?.currentData)return;
    const copy=new File([pendingExternalSafety.currentData],
      'scholar-current-before-import-'+new Date().toISOString().slice(0,10)+'.json',
      {type:'application/json'});
    try{
      if(navigator.canShare?.({files:[copy]})&&navigator.share){
        await navigator.share({files:[copy],title:'Save Scholar safety copy to Files'});
      }else{
        const url=URL.createObjectURL(copy),a=document.createElement('a');
        a.href=url;a.download=copy.name;document.body.append(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),60000);
      }
      externalSafetyOffered=true;
      panel.querySelector('#daily-confirm-safety-file').disabled=false;
      status('Safety JSON export initiated. Check that the file exists in Files/Downloads before continuing.');
    }catch(error){
      externalSafetyOffered=false;
      status(error?.name==='AbortError'?'Safety file was not saved. Import remains blocked.':
        'Could not export safety file: '+(error?.message||'unknown error'),'error');
    }
  });
  panel.querySelector('#daily-confirm-safety-file').addEventListener('click',()=>{
    if(!pendingExternalSafety||!externalSafetyOffered)return;
    if(!confirm('I have checked that my CURRENT Scholar progress safety JSON exists in Files or Downloads. Continue importing without an internal backup?'))return;
    const saved=pendingExternalSafety;
    pendingExternalSafety=null;externalSafetyOffered=false;
    void restore(saved.data,saved.name,true);
  });
  readBackup(AUTO_KEY).then(saved=>{if(saved){previewCache.set(AUTO_KEY,saved);const el=document.getElementById("daily-auto-status");if(el)el.textContent="Automatically saved "+new Date(saved.savedAt).toLocaleString("en-GB")}}).catch(()=>{});
  panel.querySelector("#daily-before-restore").addEventListener("click",async()=>{const saved=previewCache.get(BEFORE_RESTORE_KEY)||await readBackup(BEFORE_RESTORE_KEY);if(saved)previewRestore(saved.data,"Progress before last restore",saved);else status("No saved copy available.","error")});
  panel.querySelector("#daily-auto-previous").addEventListener("click",async()=>{const saved=previewCache.get(PREVIOUS_KEY)||await readBackup(PREVIOUS_KEY);if(saved)previewRestore(saved.data,"Previous automatic copy",saved);else status("No saved copy available.","error")});
  panel.querySelector("#daily-auto-restore").addEventListener("click",async()=>{const saved=previewCache.get(AUTO_KEY)||await readBackup(AUTO_KEY);if(saved)previewRestore(saved.data,"Latest automatic copy",saved);else status("No saved copy available.","error")});
  panel.querySelector("#daily-auto-export").addEventListener("click",()=>exportAutomaticCopy(AUTO_KEY,"auto-latest"));
  panel.querySelector("#daily-auto-previous-export").addEventListener("click",()=>exportAutomaticCopy(PREVIOUS_KEY,"auto-previous"));
  panel.querySelector("#daily-save-button").addEventListener("click", save);

  panel.querySelector("#daily-restore-button").addEventListener("click", async () => {
    const saved = previewCache.get(SNAPSHOT_KEY)||await readBackup(SNAPSHOT_KEY);
    if (!saved) return status("No saved copy on this iPad.", "error");
    previewRestore(saved.data,"Manual backup",saved);
  });
  panel.querySelector("#daily-backup-file").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try { previewRestore(await file.text(), file.name); }
    catch { status("Could not read that file.", "error"); }
  });
}
let pending = false;
new MutationObserver(() => {
  if (pending || document.getElementById(PANEL_ID)) return;
  pending = true;
  queueMicrotask(() => { pending = false; mount(); });
}).observe(document.documentElement, { childList: true, subtree: true });
mount();

// Archive duplicate snapshots only after IndexedDB commits and a readback
// proves byte-identical. The main Scholar data is never removed.
async function reclaimBackupStorage(){
 try{
  const result=await migrateOldBackups();
  await refreshCopies();
  if(!result.moved&&!Object.keys(globalThis.LuxArchivedBackupCache||{}).length)return;
  const live=store.getState();
  if(store.persist?.hasHydrated?.()===false)return;
  try{store.setState({})}catch{}
  const persisted=JSON.parse(localStorage.getItem("lux-scholar-garden-v1")||"null")?.state;
  const same=!!persisted&&persisted.xp===live.xp&&persisted.today===live.today&&
    JSON.stringify((persisted.daily||[]).map(t=>[t.id,t.progress,t.target]))===
    JSON.stringify((live.daily||[]).map(t=>[t.id,t.progress,t.target]));
  if(same){
    quotaRetryAfter=0;
    status("Saved in iPad storage. Automatic backups protected in the recovery vault.","success");
  }else{
    status("Backups safely archived, but live progress is not yet verified. Export your current progress to Files before reloading.","error");
  }
 }catch{
  status("iPad backup vault unavailable. Keep all existing data and export progress to Files.","error");
 }
}
if(store.persist?.hasHydrated?.()===false)store.persist.onFinishHydration(()=>reclaimBackupStorage());
else reclaimBackupStorage();

