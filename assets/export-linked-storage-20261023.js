// Preserve unreadable optional storage as raw bytes while keeping the
// authoritative 10-task progress, dailyLog and marked-answer history exportable.
// This does not repair corrupted optional content or make it safe to restore.
export function readOptionalBackupJson(storage, key, fallback, manifest) {
  let raw;
  try { raw=storage.getItem(key); }
  catch (error) {
    manifest.warnings.push(key+": inaccessible ("+String(error?.name||"storage error")+")");
    return fallback;
  }
  if (raw==null || raw==="") return fallback;
  try { return JSON.parse(raw); }
  catch {
    manifest.unparsed[key]=raw;
    manifest.warnings.push(key+": JSON could not be parsed; original raw data preserved separately");
    return fallback;
  }
}
export function linkedBackupManifest() {
  return { warnings: [], unparsed: {} };
}
