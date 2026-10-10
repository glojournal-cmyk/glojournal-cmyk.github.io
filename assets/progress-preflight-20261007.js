// Runs before the app. iPad disk space is not the limit: Safari gives each site a few megabytes.
// A failed write throws "The quota has been exceeded" into the page. Writes must not throw,
// and a readable save is only shrunk when a normal write no longer fits.
(function () {
  var KEY = "lux-scholar-garden-v1";
  var QUARANTINE = "lux-scholar-garden-v1-unreadable";
  var AUTO = "lux-progress-auto-v1";
  var BACKUPS = [AUTO, AUTO + "-previous", "lux-daily-manual-backup-v1"];
  // Discard temporary effects only when quota is genuinely exceeded. Never erase
  // a recovery copy, assessment history or daily log just by opening the app.
  var DUPLICATES = ["lux-memory-stars-result-v1", "lux-memory-stars-pending-v1", "lux-pet-pending-celebration"];
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
  function capArray(obj, key, max) {
    if (Array.isArray(obj[key]) && obj[key].length > max) obj[key] = obj[key].slice(-max);
  }
  function capMap(obj, key, max) {
    var value = obj[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    var names = Object.keys(value);
    if (names.length <= max) return;
    var next = {};
    for (var i = names.length - max; i < names.length; i++) next[names[i]] = value[names[i]];
    obj[key] = next;
  }
  function shrink(state) {
    capArray(state, "learningEvents", 40);
    capArray(state, "history", 40);
    capArray(state, "recentQuestionIds", 40);
    capMap(state, "dailyVocabByDay", 10);
    capMap(state, "activity", 21);
    capMap(state, "rewardLedgerByDay", 21);
    capMap(state, "aiHelpByDay", 14);
    capMap(state, "aiHelpLedgerByDay", 14);
    capMap(state, "dailyCompleteAwarded", 21);
    capMap(state, "reviews", 500);
    capMap(state, "seenCorrect", 500);
    capMap(state, "seenTotal", 500);
    return state;
  }
  function smallerGarden(value) {
    var saved = parse(value);
    if (!saved || typeof saved !== "object" || !usable(saved.state)) return null;
    shrink(saved.state);
    var next = JSON.stringify(saved);
    return next.length < value.length ? next : null;
  }
  function guard(storage) {
    if (!storage || typeof storage.setItem !== "function") return null;
    var native = storage.setItem.bind(storage);
    storage.setItem = function (key, value) {
      try { return native(key, value); }
      catch (error) {
        if (!quota(error)) throw error;
        if (storage !== localStorage) throw error;
        dropDuplicates(key);
        try { return native(key, value); }
        catch (again) {
          if (!quota(again)) throw again;
          // Never delete the last automatic recovery copy merely to fit an unrelated write.
          var reduced = key === KEY ? smallerGarden(String(value)) : null;
          if (!reduced) throw error;
          try { return native(key, reduced); }
          catch (e3) {
            if (!quota(e3)) throw e3;
            var previous = read(key);
            try { localStorage.removeItem(key); } catch (e4) {}
            try { return native(key, reduced); }
            catch (e5) {
              if (previous != null) { try { native(key, previous); } catch (e6) {} }
              throw e5;
            }
          }
        }
      }
    };
    return native;
  }
  var nativeSet = guard(localStorage);
  if (typeof sessionStorage !== "undefined") guard(sessionStorage);
  try {
    var root = typeof window === "undefined" ? globalThis : window;
    var proto = root.Storage && root.Storage.prototype;
    if (proto && proto.setItem && !proto.setItem.__luxGuard) {
      var protoNative = proto.setItem;
      var wrapped = function (key, value) {
        // Quota failures must surface to callers; silently swallowing them
        // makes today's progress look saved even when nothing was written.
        return protoNative.call(this, key, value);
      };
      wrapped.__luxGuard = true;
      proto.setItem = wrapped;
    }
  } catch (e) {}
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
  // A healthy save is not a reason to erase previous automatic backups.
  var root = typeof window === "undefined" ? globalThis : window;
  root.luxReleaseStorage = function () {
    dropDuplicates(KEY);
    try { localStorage.removeItem(AUTO); } catch (e) {}
    var existing = read(KEY);
    var reduced = existing && smallerGarden(existing);
    if (reduced && nativeSet) {
      try { nativeSet(KEY, reduced); } catch (e) {}
    }
  };
})();
