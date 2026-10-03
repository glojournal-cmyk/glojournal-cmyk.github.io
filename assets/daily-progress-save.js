import { C as store } from "/assets/index-BLVOhKhN.js?v=20261003-qa3";

const SNAPSHOT_KEY = "lux-daily-manual-backup-v1";
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
    <div class="daily-save-actions">
      <button id="daily-save-button" type="button">Save progress & backup</button>
      <button id="daily-restore-button" type="button">Restore saved copy</button>
      <label class="daily-file-button" for="daily-backup-file">Restore from Files</label>
      <input id="daily-backup-file" type="file" accept="application/json,.json" hidden>
    </div>
    <p class="daily-save-note">Automatic progress stays in this browser. If iPad data is cleared, use the exported file kept in Files or iCloud Drive.</p>`;
  card.append(panel);
  status(savedStatus());
  panel.querySelector("#daily-save-button").addEventListener("click", save);
  panel.querySelector("#daily-restore-button").addEventListener("click", () => {
    const saved = savedCopy();
    if (!saved) return status("No saved copy on this iPad.", "error");
    restore(saved.data, `the copy from ${new Date(saved.savedAt).toLocaleString("en-GB")} (${saved.done}/${saved.total} tasks)`);
  });
  panel.querySelector("#daily-backup-file").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try { restore(await file.text(), file.name); }
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
