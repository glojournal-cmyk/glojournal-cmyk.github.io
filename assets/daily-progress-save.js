import {backupPreview} from "./progress-backup-preview-20261004.js";
import { C as store } from "/assets/index-BLVOhKhN.js?v=20261007-loading7";

const SNAPSHOT_KEY = "lux-daily-manual-backup-v1";
const AUTO_KEY = "lux-progress-auto-v1";
let autoTimer, lastAutoData = "", selectedRestore = null;
function autoSave(){
 clearTimeout(autoTimer);
 try {
  const dataRaw=store.getState().exportProgress();
  let data=dataRaw;
  try { data=JSON.stringify(JSON.parse(dataRaw)); } catch {}
  if(data===lastAutoData)return;
  const previous=localStorage.getItem(AUTO_KEY);
  if(previous && previous.length<120000)localStorage.setItem(AUTO_KEY+"-previous",previous);
  const saved={savedAt:new Date().toISOString(),...summary(store.getState()),data};
  localStorage.setItem(AUTO_KEY,JSON.stringify(saved));
  if(JSON.parse(localStorage.getItem(AUTO_KEY)).data!==data)throw Error("Save verification failed");
  lastAutoData=data;
  refreshCopies();
  const el=document.getElementById("daily-auto-status");if(el)el.textContent=`Saved automatically · ${new Date(saved.savedAt).toLocaleTimeString("en-GB")}`;
 }catch(error){const el=document.getElementById("daily-auto-status");if(el)el.textContent="Automatic backup failed. Use Save progress & backup to keep a separate file.";}
}
store.subscribe(()=>{clearTimeout(autoTimer);autoTimer=setTimeout(autoSave,250)});
window.addEventListener("pagehide",autoSave);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")autoSave()});
window.addEventListener("scholar:learning-changed",autoSave);
window.addEventListener("scholar:pet-changed",autoSave);
window.addEventListener("scholar:mp-changed",autoSave);
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
async function save() {
  const button = document.getElementById("daily-save-button");
  button.disabled = true;
  try {
    const data = store.getState().exportProgress();
    const parsed = JSON.parse(data);
    if (parsed.app !== "lux-scholar-garden" || !Array.isArray(parsed.state?.daily)) throw new Error("The backup could not be checked.");
    const today = summary(parsed.state);
    const saved = { savedAt: new Date().toISOString(), ...today, data };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(saved));
    if (savedCopy()?.data !== data) throw new Error("The local backup could not be verified.");
    status("Saved on this iPad. Choose Save to Files in the share sheet for a separate copy.", "success");
    const filename = `scholar-garden-${today.day || "progress"}-${new Date().toISOString().slice(11, 16).replace(":", "")}.json`;
    const file = new File([data], filename, { type: "application/json" });
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      try {
        await navigator.share({ files: [file], title: "Scholar Garden progress backup" });
        status("Saved on this iPad and shared. Keep the file in Files for recovery.", "success");
      } catch (error) {
        if (error?.name !== "AbortError") status("Saved on this iPad. Share sheet failed; use Export progress in Scholar for a file.", "warning");
      }
    } else {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url; link.download = filename;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status("Saved on this device and backup file downloaded. Keep the file in a safe place.", "success");
    }
  } catch (error) {
    status(`Save failed: ${error?.message || "Please try again."}`, "error");
  } finally { button.disabled = false; }
}
function previewRestore(data, name, meta = {}) {
  try {
    const info=backupPreview(data,store.getState(),meta);
    selectedRestore={data,name};
    const box=document.getElementById('daily-restore-preview');box.hidden=false;
    const when=info.savedAt&&!Number.isNaN(Date.parse(info.savedAt))?new Date(info.savedAt).toLocaleString('en-GB'):'Date not recorded';
    document.getElementById('daily-restore-description').textContent=`${name} · ${when}. Backup: ${info.saved.day}, ${info.saved.done}/${info.saved.total} tasks, ${info.saved.xp} XP. Current: ${info.current.day}, ${info.current.done}/${info.current.total} tasks, ${info.current.xp} XP. Restoring replaces the current progress on this device.`;
    status('Preview ready. Check the date and progress before restoring.');
  } catch(error) { selectedRestore=null;const box=document.getElementById('daily-restore-preview');if(box)box.hidden=true;status(error.message||'Could not read this backup.','error'); }
}
function refreshCopies() {
 for(const [id,key] of [['daily-auto-previous',AUTO_KEY+'-previous'],['daily-auto-restore',AUTO_KEY],['daily-restore-button',SNAPSHOT_KEY]]) {
  const button=document.getElementById(id);if(!button)continue;
  let saved;try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch{}
  button.disabled=!saved?.data;
  const line=document.getElementById(id+'-info');
  if(line)line.textContent=saved?.data?`${new Date(saved.savedAt).toLocaleString('en-GB')} · ${saved.day} · ${saved.done}/${saved.total} tasks`:'No copy saved yet';
 }
}
function restore(data, name) {
  const current = summary(store.getState());
  if (!confirm(`Restore ${name}? This replaces current progress on this iPad (${current.done}/${current.total} tasks). Export the current progress first if needed.`)) return;
  const result = store.getState().importProgress(data);
  if (!result?.ok) return status(result?.error || "Could not restore this backup.", "error");
  status("Backup restored. Reloading to show the updated tasks.", "success");
  location.reload();
}
function mount() {
  if (document.getElementById(PANEL_ID)) return;
  const heading = [...document.querySelectorAll("h2")].find(el => el.textContent.trim() === "Raise her today");
  const card = heading?.parentElement?.parentElement?.parentElement;
  if (!card) return;
  const panel = document.createElement("section");
  panel.id = PANEL_ID;
  panel.setAttribute("aria-label", "Save daily progress");
  panel.innerHTML = `
    <div class="daily-save-heading"><strong>Keep your progress</strong><p id="daily-save-status" role="status" aria-live="polite"></p></div>
    <p id="daily-auto-status" role="status" aria-live="polite"></p>
    <div class="daily-save-actions"><button id="daily-save-button" type="button">Save progress & backup</button></div>
    <details id="daily-recovery-options"><summary>Backup history & restore</summary>
      <p class="daily-save-note">Preview a copy before restoring. Files kept in Files or iCloud Drive can recover progress after browser data is cleared.</p>
      <div class="daily-backup-copy"><button id="daily-auto-previous" type="button">Preview previous automatic copy</button><p id="daily-auto-previous-info"></p></div>
      <div class="daily-backup-copy"><button id="daily-auto-restore" type="button">Preview latest automatic copy</button><p id="daily-auto-restore-info"></p></div>
      <div class="daily-backup-copy"><button id="daily-restore-button" type="button">Preview manual backup</button><p id="daily-restore-button-info"></p></div>
      <label class="daily-file-button" for="daily-backup-file">Preview backup from Files</label>
      <input id="daily-backup-file" type="file" accept="application/json,.json" hidden>
      <section id="daily-restore-preview" aria-label="Backup restore preview" hidden>
        <strong>Check this backup</strong><p id="daily-restore-description"></p>
        <button id="daily-restore-apply" type="button">Restore this copy</button>
        <button id="daily-restore-cancel" type="button">Cancel</button>
      </section>
    </details>
    <p class="daily-save-note">Progress saves automatically on this device. Save a backup file to keep a separate copy.</p>`;
  card.append(panel);
  status(savedStatus());
  refreshCopies();
  panel.querySelector('#daily-recovery-options').addEventListener('toggle',refreshCopies);
  panel.querySelector('#daily-restore-apply').addEventListener('click',()=>{if(selectedRestore)restore(selectedRestore.data,selectedRestore.name)});
  panel.querySelector('#daily-restore-cancel').addEventListener('click',()=>{selectedRestore=null;panel.querySelector('#daily-restore-preview').hidden=true;status(savedStatus())});
  try{const saved=JSON.parse(localStorage.getItem(AUTO_KEY)||"null");if(saved)document.getElementById("daily-auto-status").textContent=`Automatically saved ${new Date(saved.savedAt).toLocaleString("en-GB")}`;}catch{}
  panel.querySelector("#daily-auto-previous").addEventListener("click",()=>{try{const saved=JSON.parse(localStorage.getItem(AUTO_KEY+"-previous")||"null");if(saved)previewRestore(saved.data,"Previous automatic copy",saved);else status("No previous automatic backup yet.");}catch{status("Could not read the previous backup.","error")}});
  panel.querySelector("#daily-auto-restore").addEventListener("click",()=>{try{const saved=JSON.parse(localStorage.getItem(AUTO_KEY)||"null");if(saved)previewRestore(saved.data,"Latest automatic copy",saved);else status("No automatic backup yet.");}catch{status("Could not read the automatic backup.","error")}});
  panel.querySelector("#daily-save-button").addEventListener("click", save);
  panel.querySelector("#daily-restore-button").addEventListener("click", () => {
    const saved = savedCopy();
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

// Start after the store has hydrated; never replace an older recovery copy merely on opening.
