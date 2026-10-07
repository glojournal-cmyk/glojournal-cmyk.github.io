// Runs before the app module. Readable saves are never modified.
// An unreadable blob cannot finish hydration, which left iPad on "Loading your saved progress".
(function () {
  var KEY = "lux-scholar-garden-v1";
  var QUARANTINE = "lux-scholar-garden-v1-unreadable";
  var BACKUPS = ["lux-progress-auto-v1", "lux-progress-auto-v1-previous", "lux-daily-manual-backup-v1"];
  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function parse(raw) {
    if (typeof raw !== "string") return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function usable(state) {
    return !!state && typeof state === "object" && (typeof state.xp === "number" || typeof state.today === "string" || Array.isArray(state.daily));
  }
  var raw = read(KEY);
  if (raw == null) return;
  var saved = parse(raw);
  if (saved && typeof saved === "object" && usable(saved.state)) return;
  if (!write(QUARANTINE, raw)) return;
  var restored = false;
  for (var i = 0; i < BACKUPS.length; i++) {
    var copy = parse(read(BACKUPS[i]));
    var data = copy && typeof copy.data === "string" ? parse(copy.data) : null;
    if (!data || !usable(data.state)) continue;
    var version = typeof data.version === "number" ? data.version : 10;
    restored = write(KEY, JSON.stringify({ state: data.state, version: version }));
    if (restored) break;
  }
  if (!restored) {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }
})();
