// Runs before the app module. Readable saves are never rewritten.
// iPad Safari throws "The quota has been exceeded" once duplicate backups fill local storage,
// and that exception was reaching the page error boundary.
(function () {
  var KEY = "lux-scholar-garden-v1";
  var QUARANTINE = "lux-scholar-garden-v1-unreadable";
  var BACKUPS = ["lux-progress-auto-v1", "lux-progress-auto-v1-previous", "lux-daily-manual-backup-v1"];
  var DUPLICATES = ["lux-progress-auto-v1-previous", "lux-scholar-garden-v1-unreadable", "lux-assessment-v1-recovery", "lux-day-log-v1", "lux-memory-stars-result-v1", "lux-memory-stars-pending-v1", "lux-pet-pending-celebration"];
  function quota(error) {
    return !!error && (error.name === "QuotaExceededError" || error.code === 22 || /quota/i.test(String(error.message || "")));
  }
  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function parse(raw) {
    if (typeof raw !== "string") return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function usable(state) {
    return !!state && typeof state === "object" && (typeof state.xp === "number" || typeof state.today === "string" || Array.isArray(state.daily));
  }
  function dropDuplicates(except) {
    for (var i = 0; i < DUPLICATES.length; i++) {
      if (DUPLICATES[i] === except) continue;
      try { localStorage.removeItem(DUPLICATES[i]); } catch (e) {}
    }
  }
  var nativeSet = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    try { return nativeSet(key, value); }
    catch (error) {
      if (!quota(error)) throw error;
      dropDuplicates(key);
      try { return nativeSet(key, value); }
      catch (again) {
        if (!quota(again)) throw again;
        if (key !== "lux-progress-auto-v1") {
          try { localStorage.removeItem("lux-progress-auto-v1"); } catch (e) {}
          try { return nativeSet(key, value); } catch (e2) {}
        }
      }
    }
  };
  function write(key, value) {
    try { localStorage.setItem(key, value); return localStorage.getItem(key) === value; } catch (e) { return false; }
  }
  var raw = read(KEY);
  if (raw != null) {
    var saved = parse(raw);
    if (!(saved && typeof saved === "object" && usable(saved.state))) {
      if (write(QUARANTINE, raw)) {
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
      }
    }
  }
  var current = parse(read(KEY));
  if (current && typeof current === "object" && usable(current.state)) dropDuplicates(KEY);
})();
