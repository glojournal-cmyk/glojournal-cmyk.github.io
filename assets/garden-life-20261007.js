/* Living garden: seven basil stages, same-day water, today's weather,
   a first bookmark, and a four-second return after a study set.
   Progress stays in its own small key and does not change Scholar XP. */
(function (root) {
  var STORE_KEY = "lux-scholar-garden-v1";
  var LIFE_KEY = "lux-garden-life-v1";
  var STAGE_LINES = [
    "The soil is dry and quiet. One study set, and a shoot will show.",
    "A pale shoot broke the soil.",
    "Two seed leaves opened toward the window.",
    "The basil is dividing into real leaves.",
    "The leaves are larger, and the soil looks richer.",
    "She can smell the basil from the path.",
    "A bud is holding. One more study day.",
    "A sprig is cut for the desk. The pot stays green."
  ];
  var WEATHER_LINES = {
    still: "The garden is quiet.",
    mind: "The bookshelf is awake, and a book is open.",
    body: "The garden light is outdoor-bright.",
    spark: "The garden lantern is lit."
  };

  function localDay(date) {
    var d = date || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function blankLife() {
    return { v: 1, baselined: false, baseline: [], basilDays: [], secondDays: [], bookmarkOn: null, announcedGrowthFor: "", bookmarkAnnounced: false, returnShown: "", arrival: null };
  }

  function readScholar() {
    try {
      var raw = JSON.parse(root.localStorage.getItem(STORE_KEY) || "null");
      var state = raw && raw.state && typeof raw.state === "object" ? raw.state : raw;
      return state && typeof state === "object" ? state : {};
    } catch (e) {
      return {};
    }
  }

  function readLife() {
    try {
      var raw = JSON.parse(root.localStorage.getItem(LIFE_KEY) || "null");
      if (!raw || typeof raw !== "object") return blankLife();
      return {
        v: 1,
        baselined: !!raw.baselined,
        baseline: Array.isArray(raw.baseline) ? raw.baseline.slice(0, 120) : [],
        basilDays: Array.isArray(raw.basilDays) ? raw.basilDays.slice(0, 7) : [],
        secondDays: Array.isArray(raw.secondDays) ? raw.secondDays.slice(0, 7) : [],
        bookmarkOn: typeof raw.bookmarkOn === "string" ? raw.bookmarkOn : null,
        announcedGrowthFor: typeof raw.announcedGrowthFor === "string" ? raw.announcedGrowthFor : "",
        bookmarkAnnounced: !!raw.bookmarkAnnounced,
        returnShown: typeof raw.returnShown === "string" ? raw.returnShown : "",
        arrival: raw.arrival && typeof raw.arrival.day === "string" ? {
          day: raw.arrival.day,
          score: String(raw.arrival.score || "").slice(0, 80),
          change: String(raw.arrival.change || "held")
        } : null
      };
    } catch (e) {
      return blankLife();
    }
  }

  function writeLife(life) {
    try { root.localStorage.setItem(LIFE_KEY, JSON.stringify(life)); } catch (e) { /* quota: keep this session in memory */ }
  }

  function studyDaysOf(state) {
    return Array.isArray(state.studyDays) ? state.studyDays.filter(function (d) { return typeof d === "string"; }) : [];
  }

  function syncLife(life, state, today) {
    var next = {
      v: 1,
      baselined: !!life.baselined,
      baseline: (life.baseline || []).slice(),
      basilDays: (life.basilDays || []).slice(0, 7),
      secondDays: (life.secondDays || []).slice(0, 7),
      bookmarkOn: life.bookmarkOn || null,
      announcedGrowthFor: life.announcedGrowthFor || "",
      bookmarkAnnounced: !!life.bookmarkAnnounced,
      returnShown: life.returnShown || "",
      arrival: life.arrival && life.arrival.day ? life.arrival : null
    };
    var days = studyDaysOf(state);
    var grew = false;
    if (!next.baselined) {
      next.baselined = true;
      next.baseline = days.filter(function (d) { return d !== today; });
    }
    var known = {};
    next.baseline.forEach(function (d) { known[d] = true; });
    next.basilDays.forEach(function (d) { known[d] = true; });
    next.secondDays.forEach(function (d) { known[d] = true; });
    days.forEach(function (d) {
      if (known[d] || next.basilDays.length >= 7) return;
      next.basilDays.push(d);
      known[d] = true;
      if (d === today) grew = true;
    });
    if (next.basilDays.length >= 7) {
      days.forEach(function (d) {
        if (known[d] || next.secondDays.length >= 7) return;
        next.secondDays.push(d);
        known[d] = true;
        if (d === today) grew = true;
      });
    }
    if (!next.bookmarkOn && next.basilDays.length) next.bookmarkOn = next.basilDays[0];
    return { life: next, grew: grew };
  }

  function weatherOf(state, today) {
    var mind = Number(state.activity && state.activity[today] || 0);
    if (!isFinite(mind) || mind < 0) mind = 0;
    var body = Array.isArray(state.peDays) && state.peDays.indexOf(today) !== -1 ? 10 : 0;
    var rewards = state.gameRewardByDay && state.gameRewardByDay[today];
    var plays = 0;
    if (rewards && typeof rewards === "object") {
      Object.keys(rewards).forEach(function (k) { plays += Number(rewards[k] || 0) || 0; });
    }
    var spark = (Number(state.gameXpToday || 0) > 0 || plays > 0) ? 6 : 0;
    var scores = { mind: mind, body: body, spark: spark };
    var best = "still";
    var top = 0;
    Object.keys(scores).forEach(function (k) {
      if (scores[k] > top) { top = scores[k]; best = k; }
    });
    return best;
  }

  function replyFor(kind, pic, pip) {
    pic = pic || { stage: 0, wet: false };
    if (kind === "pot") {
      var which = pic.which === "second" ? "second" : "";
      var potStage = which === "second" ? Number(pic.second || 0) : pic.stage;
      var lines = [
        "Nothing is up yet. The soil is waiting.",
        "The shoot bends, then stands again.",
        "The seed leaves feel cool.",
        "A leaf turns toward her finger.",
        "The leaves are thicker than yesterday.",
        "Pepper and lemon. She was right.",
        "The bud is tight. Not today.",
        "The pot stays. The sprig is already on the desk."
      ];
      var line = lines[potStage] || lines[0];
      if (which === "second" && potStage <= 0) return "The second pot is only soil. It is waiting.";
      if (which === "second" && potStage > 0) line = "Second pot. " + line;
      if (pic.wet && potStage > 0) line += " A drop runs off.";
      return line;
    }
    if (kind === "pip") {
      var n = Number(pip) || 0;
      var reached = pic.which === "second" ? Number(pic.second || 0) : pic.stage;
      if (n >= 1 && n <= reached) return STAGE_LINES[n];
      return "Stage " + n + " is still ahead.";
    }
    if (kind === "bookmark") return "First evening. She left the ribbon on the wooden bench.";
    if (kind === "book") return "The book on the shelf is open at today's work.";
    if (kind === "sprig") return "This sprig is on the desk, not in the pot.";
    if (kind === "water") return pic.wet ? "The leaves are already wet." : "Water finds the soil.";
    return "";
  }

  function plantLine(stage, which) {
    if (which === "second" && stage <= 0) return "The sprig is on the desk. The second pot is waiting.";
    if (which === "second" && stage >= 7) return "A second sprig is cut. Both pots stay green.";
    var line = STAGE_LINES[stage] || STAGE_LINES[0];
    return which === "second" ? "Second pot. " + line : line;
  }

  function scoreLine(text) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    var score = text.match(/\d+\s*\/\s*\d+/);
    var xp = text.match(/\+\s*\d+\s*XP/i);
    var bits = [];
    if (score) bits.push(score[0].replace(/\s+/g, ""));
    if (xp) bits.push(xp[0].replace(/\s+/g, ""));
    return (bits.join(" · ") || text.slice(0, 80)).slice(0, 80);
  }

  function changeOf(life, today, grew) {
    if (grew && (life.secondDays || []).indexOf(today) !== -1) return "second";
    if (grew && (life.basilDays || []).indexOf(today) !== -1) return (life.basilDays || []).length >= 7 ? "sprig" : "basil";
    if (life.bookmarkOn === today && !life.bookmarkAnnounced) return "bookmark";
    return "held";
  }

  function arrivalSentence(arrival) {
    var lead = {
      basil: "The basil grew one stage.",
      second: "The second pot grew one stage.",
      bookmark: "A bookmark is on the bench.",
      sprig: "A sprig is on the desk. The second pot is waiting.",
      held: "The pot is holding this stage."
    }[arrival && arrival.change] || "Back in the garden.";
    return arrival && arrival.score ? lead + " " + arrival.score + "." : lead;
  }

  function picture(life, state, today) {
    var stage = Math.max(0, Math.min(7, (life.basilDays || []).length));
    var second = Math.max(0, Math.min(7, (life.secondDays || []).length));
    var wet = state.wateredOn === today;
    var weather = weatherOf(state, today);
    var grewToday = (life.basilDays || []).indexOf(today) !== -1 || (life.secondDays || []).indexOf(today) !== -1;
    var focus = stage >= 7 ? "second" : "basil";
    var arrival = life.arrival && life.arrival.day === today ? life.arrival : null;
    return {
      stage: stage,
      second: second,
      focus: focus,
      wet: wet,
      weather: weather,
      grewToday: grewToday,
      bookmark: !!life.bookmarkOn,
      sprig: stage >= 7,
      line: focus === "second" ? plantLine(second, "second") : plantLine(stage, "basil"),
      weatherLine: WEATHER_LINES[weather],
      waterLine: wet ? "Water is still on the leaves." : "The leaves are dry until you water.",
      bookmarkLine: life.bookmarkOn ? "A paper bookmark is on the wooden bench." : "Finish one study set and a bookmark will wait on the bench.",
      arrivalLine: arrival ? arrivalSentence(arrival) : ""
    };
  }

  function potSvg(stage, wet) {
    var leaves = "";
    var greens = ["#c5d7a4", "#9cbf78", "#6fa35a", "#3f7d45", "#2f6b3a", "#245c32", "#1e5130"];
    function leaf(x, y, rx, ry, rot, g) {
      return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + g + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>';
    }
    if (stage >= 1) leaves += '<path d="M70 78 C70 62 74 52 70 44" stroke="#3f6b3a" stroke-width="2" fill="none"/>';
    if (stage === 1) leaves += '<ellipse cx="70" cy="42" rx="3.2" ry="6" fill="#c5d7a4"/>';
    if (stage >= 2) {
      leaves += leaf(62, 58, 7, 4, -30, greens[1]);
      leaves += leaf(78, 58, 7, 4, 30, greens[1]);
    }
    if (stage >= 3) {
      leaves += leaf(56, 50, 8, 4.2, -50, greens[2]);
      leaves += leaf(84, 50, 8, 4.2, 50, greens[2]);
    }
    if (stage >= 4) {
      leaves += leaf(64, 42, 9, 4.5, -20, greens[3]);
      leaves += leaf(78, 40, 9, 4.6, 24, greens[3]);
      leaves += '<path d="M70 58 C68 40 72 34 70 28" stroke="#2f6b3a" stroke-width="2" fill="none"/>';
    }
    if (stage >= 5) {
      leaves += leaf(58, 36, 8, 4, -40, greens[4]);
      leaves += leaf(84, 34, 8, 4, 36, greens[4]);
      leaves += '<circle cx="48" cy="32" r="1.3" fill="#d7e7c4"/><circle cx="92" cy="30" r="1.2" fill="#d7e7c4"/>';
    }
    if (stage >= 6) leaves += '<circle cx="70" cy="24" r="3.2" fill="#f3efe2" stroke="#d7c89a"/>';
    if (stage >= 7) {
      leaves += '<g transform="translate(96 34)">';
      leaves += '<path d="M8 28 C8 16 10 10 8 4" stroke="#2f6b3a" stroke-width="1.6" fill="none"/>';
      leaves += leaf(4, 12, 6, 3, -40, greens[5]);
      leaves += leaf(13, 14, 6, 3, 40, greens[5]);
      leaves += leaf(8, 6, 5, 2.6, 0, greens[4]);
      leaves += "</g>";
    }
    var dew = wet ? '<g class="lux-dew"><circle cx="60" cy="46" r="1.5" fill="#f7fbff"/><circle cx="80" cy="40" r="1.3" fill="#f7fbff"/><circle cx="72" cy="52" r="1.1" fill="#e7f3ff"/></g>' : "";
    var soil = wet ? "#5c4030" : "#8b684c";
    return '<svg viewBox="0 0 140 120" aria-hidden="true"><g class="lux-sway">' +
      leaves + dew +
      '</g><path d="M46 78 h48 l-6 28 h-36 z" fill="#c46a45"/>' +
      '<path d="M44 74 h52 v8 h-52 z" fill="#a85436"/>' +
      '<ellipse cx="70" cy="78" rx="22" ry="5" fill="' + soil + '"/>' +
      "</svg>";
  }

  function pips(stage) {
    var html = "";
    for (var i = 1; i <= 7; i++) {
      html += '<button type="button" class="lux-pip' + (i <= stage ? " is-on" : "") + '" data-lux-touch="pip" data-pip="' + i + '" aria-label="Basil stage ' + i + '"></button>';
    }
    return html;
  }

  function potButton(stage, wet, extra, which) {
    var kind = which || "basil";
    return '<div class="lux-pot-wrap' + (extra ? " " + extra : "") + '" data-which="' + kind + '">' +
      '<div class="lux-pot" role="button" tabindex="0" data-lux-touch="pot" data-which="' + kind + '" data-stage="' + stage + '" aria-label="' + (kind === "second" ? "Touch the second basil" : "Touch the basil") + '">' + potSvg(stage, wet) + "</div>" +
      '<div class="lux-pips">' + pips(stage) + "</div></div>";
  }

  function signature(pic) {
    return [pic.stage, pic.second || 0, pic.wet ? 1 : 0, pic.weather, pic.bookmark ? 1 : 0, pic.sprig ? 1 : 0, pic.line, pic.arrivalLine || ""].join("|");
  }

  function stateReady(state) {
    return !!state && (typeof state.xp === "number" || typeof state.today === "string" || Array.isArray(state.studyDays));
  }

  function placeStrip(anchor, where, pic) {
    var parent = anchor && anchor.parentElement;
    if (!parent) return null;
    var strip = parent.querySelector(":scope > [data-lux-life='strip']");
    if (!strip) {
      strip = document.createElement("section");
      strip.setAttribute("data-lux-life", "strip");
      strip.className = "lux-life-strip rounded-[28px] bg-card text-ink shadow-[var(--shadow-border)]";
      parent.insertBefore(strip, where === "before" ? anchor : anchor.nextSibling);
    } else if (where === "before" && strip.nextElementSibling !== anchor) {
      parent.insertBefore(strip, anchor);
    } else if (where === "after" && strip.previousElementSibling !== anchor) {
      parent.insertBefore(strip, anchor.nextSibling);
    }
    var sig = signature(pic);
    if (strip.dataset.sig === sig) return strip;
    strip.dataset.sig = sig;
    strip.dataset.weather = pic.weather;
    var shown = pic.focus === "second" ? pic.second : pic.stage;
    strip.innerHTML =
      potButton(shown, pic.wet, "", pic.focus) +
      '<div class="min-w-0">' +
      '<p class="text-xs font-semibold tracking-[0.18em] text-navy uppercase">' + (pic.focus === "second" ? "Second pot · " + (pic.second === 0 ? "waiting" : "stage " + pic.second + " of 7") : "Basil · " + (pic.stage === 0 ? "waiting for a study day" : "stage " + pic.stage + " of 7")) + "</p>" +
      '<p class="lux-life-line font-display text-xl font-semibold leading-snug">' + esc(pic.line) + "</p>" +
      '<p class="mt-1 text-sm text-muted">' + esc(pic.weatherLine) + "</p>" +
      '<p class="mt-1 text-sm text-muted">' + esc(pic.waterLine) + "</p>" +
      '<p class="mt-1 text-sm' + (pic.bookmark ? " text-navy" : " text-muted") + '">' + esc(pic.bookmarkLine) + "</p>" +
      (pic.arrivalLine ? '<p class="mt-1 text-sm text-navy">' + esc(pic.arrivalLine) + "</p>" : "") +
      "</div>";
    return strip;
  }

  function paintHome(pic) {
    var hero = document.querySelector("img.scholar-idle");
    var frame = hero && hero.closest("div.relative");
    if (!frame || !frame.parentElement) return;
    var covered = frame.querySelector(":scope > [data-lux-life='strip']");
    if (covered && covered.parentNode) covered.parentNode.removeChild(covered);
    placeStrip(frame, "after", pic);
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "\u0026amp;")
      .replace(/</g, "\u0026lt;")
      .replace(/>/g, "\u0026gt;")
      .replace(/"/g, "\u0026quot;");
  }

  function sceneButtons() {
    var found = {};
    document.querySelectorAll("img").forEach(function (img) {
      var btn = img.closest && img.closest("button");
      if (!btn) return;
      if (img.alt === "Potted Herb") found.herb = btn;
      else if (img.alt === "Wooden Bench") found.bench = btn;
      else if (img.alt === "Garden Lantern") found.lantern = btn;
      else if (img.alt === "Bookshelf") found.bookshelf = btn;
      else if (img.alt === "Cat Companion") found.cat = btn;
      else if (img.alt === "Stone Fountain") found.fountain = btn;
    });
    return found;
  }

  function syncPin(btn, kind, on, label) {
    if (!btn) return;
    var pin = btn.querySelector("[data-lux-pin='" + kind + "']");
    if (!on) {
      if (pin && pin.parentNode) pin.parentNode.removeChild(pin);
      return;
    }
    if (pin) return;
    pin = document.createElement("button");
    pin.type = "button";
    pin.className = "lux-pin lux-" + kind;
    pin.setAttribute("data-lux-pin", kind);
    pin.setAttribute("data-lux-touch", kind);
    pin.setAttribute("data-lux-life", "pin");
    pin.textContent = label;
    btn.appendChild(pin);
  }

  function paintScene(pic) {
    var pieces = sceneButtons();
    if (pieces.lantern) pieces.lantern.classList.toggle("lux-glow", pic.weather === "spark");
    if (pieces.bookshelf) pieces.bookshelf.classList.toggle("lux-awake", pic.weather === "mind");
    if (pieces.herb) {
      var photo = pieces.herb.querySelector("img");
      if (photo) photo.style.opacity = "0";
    }
    syncPin(pieces.bench, "bookmark", pic.bookmark, "Bookmark");
    syncPin(pieces.bookshelf, "sprig", pic.sprig, "Sprig");
  }

  function paintGarden(pic) {
    var heading = null;
    document.querySelectorAll("h1").forEach(function (h) {
      if (!heading && /Garden/.test(h.textContent)) heading = h;
    });
    if (heading) {
      var header = heading.closest("header") || heading.parentElement;
      if (header) placeStrip(header, "after", pic);
    }
    var water = null;
    document.querySelectorAll("button").forEach(function (b) {
      if (!water && /Water the garden|Watered today/.test(b.textContent || "")) water = b;
    });
    var stage = water && water.closest(".relative");
    if (!stage) return;
    var layer = stage.querySelector("[data-lux-life='lawn']");
    if (!layer) {
      layer = document.createElement("div");
      layer.setAttribute("data-lux-life", "lawn");
      layer.className = "lux-life-layer";
      stage.appendChild(layer);
    }
    var sig = signature(pic);
    if (layer.dataset.sig !== sig) {
      layer.dataset.sig = sig;
      layer.dataset.weather = pic.weather;
      layer.innerHTML =
        '<div class="lux-wash" data-weather="' + pic.weather + '"></div>' +
        '<div class="lux-lawn-pot" style="left:10%;top:66%">' + potButton(pic.stage, pic.wet, "", "basil") + "</div>" +
        (pic.sprig ? '<div class="lux-lawn-pot lux-second-pot">' + potButton(pic.second, pic.wet, "", "second") + "</div>" : "");
      var pot = layer.querySelector(".lux-lawn-pot");
      if (pot && Date.now() < pourUntil) pot.classList.add("is-pouring");
    }
    paintScene(pic);
    if (Date.now() < pourUntil) {
      var livePot = layer.querySelector(".lux-lawn-pot");
      if (livePot) livePot.classList.add("is-pouring");
    }
    stage.querySelectorAll('img[alt="Potted Herb"]').forEach(function (img) {
      if (img.closest("button")) img.style.opacity = "0";
    });
    document.querySelectorAll("p").forEach(function (p) {
      if (p.textContent.trim() !== "Potted Herb") return;
      var note = p.parentElement && p.parentElement.querySelector("p.text-muted");
      if (note) note.textContent = pic.line;
    });
  }

  var resultOpen = false;
  function showReturn(life, state, today, pic) {
    var result = document.querySelector("[aria-label='Session result']");
    if (!result) { resultOpen = false; return life; }
    if (resultOpen || document.querySelector(".lux-return")) return life;
    var act = Number(state.activity && state.activity[today] || 0) || 0;
    var key = today + ":" + (Number(state.questionsToday || 0) || 0) + ":" + act + ":" + (result.textContent || "").replace(/\s+/g, " ").slice(0, 90);
    if (life.returnShown === key) { resultOpen = true; return life; }
    resultOpen = true;
    var grewNow = pic.grewToday && life.announcedGrowthFor !== today;
    var change = changeOf(life, today, grewNow);
    var score = scoreLine(result.textContent);
    life.arrival = { day: today, score: score, change: change };
    var cardStage = change === "second" ? pic.second : pic.stage;
    var cardWhich = change === "second" ? "second" : "basil";
    var overlay = document.createElement("div");
    overlay.className = "lux-return";
    overlay.setAttribute("data-lux-life", "return");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Back in the garden");
    overlay.innerHTML =
      '<div class="lux-return-card">' +
      '<p class="text-xs font-semibold tracking-[0.18em] text-navy uppercase">Back in the garden</p>' +
      '<div class="lux-pot-return">' + potButton(cardStage, pic.wet, "lux-pot-return", cardWhich) + "</div>" +
      '<p class="lux-life-line font-display text-2xl font-semibold leading-snug">' + esc(pic.line) + "</p>" +
      '<p class="mt-2 text-sm text-muted">' + esc(arrivalSentence(life.arrival)) + "</p>" +
      '<p class="mt-1 text-sm text-muted">' + esc(pic.weatherLine) + "</p>" +
      '<button type="button" class="lux-return-go">Back to the garden</button>' +
      "</div>";
    document.body.appendChild(overlay);
    var left = false;
    var leave = function () {
      if (left) return;
      left = true;
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      goGarden();
    };
    overlay.querySelector(".lux-return-go").addEventListener("click", leave);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) leave(); });
    root.setTimeout(leave, 4000);
    life.returnShown = key;
    if (grewNow) life.announcedGrowthFor = today;
    if (pic.bookmark && !life.bookmarkAnnounced) life.bookmarkAnnounced = true;
    writeLife(life);
    return life;
  }

  function goGarden() {
    if (typeof location === "undefined") return;
    if (/\/garden(?:\/index\.html)?\/?$/.test(location.pathname)) return;
    var hop = document.createElement("a");
    hop.href = "/garden";
    hop.setAttribute("data-lux-life", "hop");
    document.body.appendChild(hop);
    hop.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: root }));
    root.setTimeout(function () {
      if (!/\/garden(?:\/index\.html)?\/?$/.test(location.pathname)) location.assign("/garden");
    }, 400);
  }

  function isPracticePath(path) {
    return /\/practise\/?$/.test(path || "");
  }

  function isAssessmentPath(path) {
    return /^\/assessment(?:\/|$)/.test(path || "");
  }

  function applyLeaf(marks, ids, index, id, correct) {
    var nextMarks = (marks || []).slice();
    var nextIds = (ids || []).slice();
    if (index === 0 && nextIds[0] && id && nextIds[0] !== id) {
      nextMarks = [];
      nextIds = [];
    }
    if (index < 0 || index > 39) return { marks: nextMarks, ids: nextIds };
    nextIds[index] = id || "";
    nextMarks[index] = correct ? "yes" : "no";
    return { marks: nextMarks, ids: nextIds };
  }

  function stillAhead(total, index, answered) {
    var remain = total - index - (answered ? 1 : 0);
    return remain < 0 ? 0 : remain;
  }

  var leafSet = "";
  var leafMarks = [];
  var leafIds = [];

  function practiceCounter() {
    if (typeof document === "undefined") return null;
    if (isAssessmentPath(location.pathname) || !isPracticePath(location.pathname)) return null;
    if (document.querySelector("[aria-label='Session result']")) return null;
    var nodes = document.querySelectorAll("p.tabular-nums");
    for (var i = 0; i < nodes.length; i++) {
      var match = /Question\s+(\d+)\s+\/\s+(\d+)/.exec(nodes[i].textContent || "");
      if (!match) continue;
      var total = Number(match[2]);
      if (total < 1 || total > 40) continue;
      return { el: nodes[i], index: Number(match[1]) - 1, total: total };
    }
    return null;
  }

  function paintLeaves(rustle) {
    if (typeof document === "undefined") return;
    var host = document.querySelector("[data-lux-leaves]");
    var counter = practiceCounter();
    if (!counter) {
      if (host && host.parentNode) host.parentNode.removeChild(host);
      return;
    }
    var setKey = location.pathname + location.search;
    if (leafSet !== setKey) {
      leafSet = setKey;
      leafMarks = [];
      leafIds = [];
    }
    if (!host) {
      host = document.createElement("div");
      host.setAttribute("data-lux-leaves", "1");
      host.className = "lux-leaves";
      counter.el.insertAdjacentElement("afterend", host);
    } else if (host.previousElementSibling !== counter.el) {
      counter.el.insertAdjacentElement("afterend", host);
    }
    var done = 0;
    var html = "";
    for (var i = 0; i < counter.total; i++) {
      var mark = leafMarks[i] || "";
      if (mark) done++;
      html += '<span class="lux-leaf' + (mark === "yes" ? " is-yes" : mark === "no" ? " is-open" : "") + (i === counter.index && !mark ? " is-now" : "") + '"></span>';
    }
    var remain = stillAhead(counter.total, counter.index, !!leafMarks[counter.index]);
    var note = remain === 0 ? "This set is complete." : remain === 1 ? "1 still ahead." : remain + " still ahead.";
    var sig = done + "|" + counter.total + "|" + counter.index + "|" + note;
    if (host.dataset.sig === sig && !rustle) return;
    host.dataset.sig = sig;
    host.innerHTML = '<span class="lux-leaf-pot' + (rustle ? " is-rustle" : "") + '" aria-hidden="true"></span><span class="lux-leaf-row">' + html + '</span><span class="lux-leaf-note">' + esc(note) + "</span>";
    host.setAttribute("aria-label", "This practice set. " + note);
  }

  function onAnswered(event) {
    if (isAssessmentPath(location.pathname) || !isPracticePath(location.pathname)) return;
    var counter = practiceCounter();
    if (!counter) return;
    var detail = event && event.detail || {};
    var next = applyLeaf(leafMarks, leafIds, counter.index, detail.questionId || "", !!detail.correct);
    leafMarks = next.marks;
    leafIds = next.ids;
    paintLeaves(!!detail.correct);
  }

  function paint() {
    if (typeof document !== "undefined") paintLeaves(false);
    var state = readScholar();
    if (!stateReady(state)) return;
    var today = typeof state.today === "string" && state.today ? state.today : localDay();
    var synced = syncLife(readLife(), state, today);
    var life = synced.life;
    var pic = picture(life, state, today);
    latestPic = pic;
    writeLife(life);
    if (typeof document === "undefined") return { life: life, pic: pic };
    paintHome(pic);
    if (/\/garden(?:\/index\.html)?\/?$/.test(location.pathname)) paintGarden(pic);
    else {
      /* home hero wash, only when the scholar portrait is on the page */
      var hero = document.querySelector("img.scholar-idle");
      var frame = hero && hero.parentElement && hero.parentElement.parentElement;
      if (frame) {
        var wash = frame.querySelector("[data-lux-life='hero']");
        if (!wash) {
          wash = document.createElement("div");
          wash.setAttribute("data-lux-life", "hero");
          wash.className = "lux-hero-wash";
          frame.appendChild(wash);
        }
        wash.dataset.weather = pic.weather;
      }
    }
    showReturn(life, state, today, pic);
  }

  var pending = 0;
  var pourUntil = 0;
  var latestPic = { stage: 0, wet: false };
  var audioCtx = null;

  function whisper(text, anchor) {
    if (!text || typeof document === "undefined") return;
    var old = document.querySelector(".lux-whisper");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var node = document.createElement("p");
    node.className = "lux-whisper";
    node.setAttribute("data-lux-life", "whisper");
    node.setAttribute("role", "status");
    node.textContent = text;
    document.body.appendChild(node);
    var left = 16;
    var top = 72;
    if (anchor && anchor.getBoundingClientRect) {
      var rect = anchor.getBoundingClientRect();
      left = Math.max(12, Math.min((root.innerWidth || 320) - 228, rect.left));
      top = Math.max(12, rect.top - 46);
    }
    node.style.left = left + "px";
    node.style.top = top + "px";
    root.setTimeout(function () { node.classList.add("is-out"); }, 1500);
    root.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1900);
  }

  function tick() {
    var state = readScholar();
    if (state && state.sound === false) return;
    try {
      var Ctx = root.AudioContext || root.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 494;
      var now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.02, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch (e) {}
  }

  function onClick(event) {
    if (!event.target || !event.target.closest) return;
    var water = event.target.closest("button");
    if (water && /Water the garden|Watered today/.test(water.textContent || "")) {
      pourUntil = Date.now() + 1100;
      var lawn = document.querySelector(".lux-lawn-pot");
      if (lawn) {
        lawn.classList.remove("is-pouring");
        void lawn.offsetWidth;
        lawn.classList.add("is-pouring");
      }
      whisper(replyFor("water", latestPic), water);
      tick();
      return;
    }
    var el = event.target.closest("[data-lux-touch]");
    if (!el) return;
    var kind = el.getAttribute("data-lux-touch");
    if (kind === "pot") {
      var svg = el.querySelector("svg");
      if (svg) {
        svg.classList.remove("is-rustle");
        void svg.offsetWidth;
        svg.classList.add("is-rustle");
      }
    }
    if (kind === "bookmark") el.classList.toggle("is-open");
    var host = el.closest("[data-which]");
    var touched = latestPic;
    if (host && host.getAttribute("data-which")) {
      touched = Object.assign({}, latestPic, { which: host.getAttribute("data-which") });
    }
    if (el.hasAttribute("data-lux-pin")) event.stopPropagation();
    whisper(replyFor(kind, touched, el.getAttribute("data-pip")), el);
    tick();
  }
  function schedule() {
    if (typeof document === "undefined") return;
    root.clearTimeout(pending);
    pending = root.setTimeout(paint, 70);
  }

  function boot() {
    if (typeof document === "undefined") return;
    var started = false;
    function start() {
      if (started) return;
      started = true;
      paint();
      var obs = new MutationObserver(function (records) {
        for (var i = 0; i < records.length; i++) {
          var t = records[i].target;
          if (t && t.closest && t.closest("[data-lux-life], [data-lux-leaves], .lux-return")) continue;
          schedule();
          return;
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      document.addEventListener("click", onClick, true);
      root.addEventListener("scholar:question-answered", onAnswered);
      document.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        var el = event.target && event.target.closest && event.target.closest("[data-lux-touch='pot']");
        if (!el) return;
        event.preventDefault();
        el.click();
      });
      root.addEventListener("storage", schedule);
      root.setInterval(paint, 2000);
    }
    if (root.__luxAppReady) start();
    else root.addEventListener("lux:app-ready", start);
  }

  root.LuxGardenLife = {
    localDay: localDay,
    blankLife: blankLife,
    syncLife: syncLife,
    weatherOf: weatherOf,
    picture: picture,
    potSvg: potSvg,
    replyFor: replyFor,
    scoreLine: scoreLine,
    changeOf: changeOf,
    plantLine: plantLine,
    isPracticePath: isPracticePath,
    isAssessmentPath: isAssessmentPath,
    applyLeaf: applyLeaf,
    stillAhead: stillAhead,
    STAGE_LINES: STAGE_LINES
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
