import "./home-journey-v2-logic-20261010.js?v=20261010-home-v2&ux=20261013-corrections2";
import "./journey-navigation-20261004.js?ux=20261013-corrections2";
import { C as store } from "./index-BLVOhKhN.js?v=20261018-mastery2&ux=20261013-corrections2";

if (!window.__luxRpgShell) {
  window.__luxRpgShell = true;
  const root = document.createElement("div");
  let sheet = null;
  let day = null;

  const listen = (name, fn) => {
    const original = history[name];
    history[name] = function () {
      const result = original.apply(this, arguments);
      queueMicrotask(fn);
      return result;
    };
  };
  listen("pushState", sync);
  listen("replaceState", sync);
  window.addEventListener("popstate", sync);
  window.addEventListener("lux:app-ready", sync);
  store.subscribe?.(sync);
  store.persist?.onFinishHydration?.(sync);

  function sync() {
    const home = location.pathname === "/";
    document.documentElement.classList.toggle("rpg-on", home);
    if (!home) {
      root.remove();
      return;
    }
    if (!root.isConnected) document.body.append(root);
    paint();
  }

  function paint() {
    const state = store.getState?.() || {};
    const model = journey(state);
    const studied = studyDays(state);
    const missed = missedDays(studied);
    root.innerHTML = "";
    root.className = "rpg-home";
    const scene = sceneOf(state);
    root.style.backgroundImage = `url(${scene.art})`;
    root.style.backgroundPosition = scene.focus;
    const shade = el("div", "rpg-shade");
    const world = el("div", "rpg-world");
    const hud = el("div", "rpg-hud");
    const avatar = document.createElement("img");
    avatar.src = "/art/scholar-avatar.jpg";
    avatar.alt = "";
    const who = el("div");
    who.append(el("b", null, `Lv ${levelOf(state)}`), el("small", null, `${xpOf(state)} XP`));
    hud.append(avatar, who);
    const cast = el("div", "rpg-cast");
    const scholar = document.createElement("img");
    scholar.className = "scholar";
    scholar.src = `/art/doll/${state.equippedOutfit || "day"}.png`;
    scholar.alt = "";
    const pet = document.createElement("img");
    pet.className = "pet";
    pet.src = "/art/rpg/moss.png";
    pet.alt = "Pet";
    pet.tabIndex = 0;
    pet.addEventListener("click", () => { location.href = "/pet/"; });
    cast.append(scholar, pet);
    world.append(hud, cast);

    const rail = el("div", "rpg-rail");
    const quest = el("section", "rpg-quest");
    quest.append(el("p", "rpg-kicker", "School"));
    quest.append(taskLink("/assessment/", "Biology · specialised cells", "2 Nov"));
    quest.append(taskLink("/assessment/", "Biology · cell structure", "16 Nov"));
    const rows = model.rows || [];
    const done = rows.filter((row) => row.done).length;
    quest.append(el("p", "rpg-kicker", `Raise your scholar · ${done}/${rows.length || 10}`));
    quest.append(el("h1", null, "Today's quests"));
    if (!model.ready) quest.append(el("p", null, "Opening today's tasks…"));
    for (const row of rows) {
      quest.append(taskLink(row.href || "/study", row.title, `${row.progress}/${row.target}`));
    }
    const days = document.createElement("button");
    days.className = "rpg-days";
    days.type = "button";
    days.append(el("span", null, "30 days"));
    const dots = el("span", "rpg-dots");
    for (const on of lastThirty(studied)) {
      const mark = document.createElement("i");
      if (on) mark.className = "on";
      dots.append(mark);
    }
    days.append(dots);
    days.addEventListener("click", () => open("record"));
    quest.append(days);

    const orbs = el("div", "rpg-orbs");
    orbs.append(orb("0/4", "Star map", () => open("star")));
    orbs.append(orb("Next", "Cardigan", () => { location.href = "/scholar"; }));
    orbs.append(orb(String(missed.length), "Recovery", () => open("recovery", missed, rows)));
    rail.append(quest, orbs);

    const nav = el("nav", "rpg-nav");
    for (const item of [
      ["Home", "/"],
      ["Study", "/study"],
      ["Play", "/play"],
      ["Garden", "/garden"],
      ["Pet", "/pet/"],
      ["Assessment", "/assessment/"],
      ["Recovery", "recovery"],
      ["Settings", "settings"],
      ["Scholar", "/scholar"],
    ]) {
      if (item[1].startsWith("/")) {
        const link = document.createElement("a");
        link.href = item[1];
        link.textContent = item[0];
        if (item[0] === "Home") link.className = "on";
        nav.append(link);
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item[0];
        button.addEventListener("click", () => open(item[1], missed, rows));
        nav.append(button);
      }
    }
    root.append(shade, world, rail, nav);
    if (sheet) root.append(sheetNode(sheet, missed, rows, state));
  }

  function open(kind, missed = [], rows = []) {
    sheet = { kind, missed, rows, day };
    paint();
  }

  function sheetNode(current, missed, rows, state) {
    const box = el("aside", "rpg-sheet");
    const top = el("div", "rpg-sheet-top");
    if (current.day) {
      const back = document.createElement("button");
      back.className = "texty";
      back.type = "button";
      back.textContent = "Back";
      back.addEventListener("click", () => { day = null; open("recovery", missed, rows); });
      top.append(back);
    } else top.append(el("p", "rpg-kicker", "Lux et Labor"));
    const close = document.createElement("button");
    close.className = "texty";
    close.type = "button";
    close.textContent = "Close";
    close.addEventListener("click", () => { sheet = null; day = null; paint(); });
    top.append(close);
    box.append(top);
    if (current.kind === "record") {
      box.append(el("h2", null, "30 day record"));
      box.append(el("p", null, `${[...studyDays(state)].length} recorded study days on this device.`));
    }
    if (current.kind === "star") {
      box.append(el("h2", null, "Repair the star map"));
      box.append(el("p", null, "This week's expedition stays here. It is not a Play game."));
    }
    if (current.kind === "recovery" && !current.day) {
      box.append(el("h2", null, "Recovery"));
      const list = current.missed || [];
      box.append(el("p", null, list.length ? "Open a missed day and prepare its tasks." : "No missed day to rebuild."));
      for (const date of list) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "row";
        button.innerHTML = `<span>${labelDate(date)}</span><em>Prepare</em>`;
        button.addEventListener("click", () => { day = date; open("recovery", list, current.rows); });
        box.append(button);
      }
    }
    if (current.kind === "recovery" && current.day) {
      box.append(el("h2", null, labelDate(current.day)));
      box.append(el("p", null, "Finish today's ten tasks to rebuild this day."));
      for (const row of current.rows || []) box.append(taskLink(row.href || "/study", row.title, `${row.progress}/${row.target}`));
    }
    if (current.kind === "settings") {
      box.append(el("h2", null, "Settings"));
      const sound = document.createElement("button");
      sound.type = "button";
      sound.className = "row";
      const on = localStorage.getItem("lux-sfx") !== "off";
      sound.innerHTML = `<span>Sound effects</span><em>${on ? "On" : "Off"}</em>`;
      sound.addEventListener("click", () => {
        localStorage.setItem("lux-sfx", on ? "off" : "on");
        paint();
        sheet = { kind: "settings" };
        paint();
      });
      box.append(sound);
      box.append(el("h2", null, "Keep your progress"));
      box.append(el("p", null, "Save progress & backup exports the XP and tasks on this device."));
      const save = document.createElement("button");
      save.type = "button";
      save.className = "save";
      save.textContent = "Save progress & backup";
      const note = el("p", "fine", "");
      save.addEventListener("click", () => {
        try {
          const data = state.exportProgress?.();
          if (!data) throw new Error("empty");
          const blob = new Blob([data], { type: "application/json" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `lux-progress-${new Date().toISOString().slice(0, 10)}.json`;
          link.click();
          URL.revokeObjectURL(link.href);
          note.textContent = "Backup file downloaded. Check the JSON file before you rely on it.";
        } catch {
          note.textContent = "This device has no Scholar progress to export yet.";
        }
      });
      box.append(save, note);
    }
    return box;
  }

  function journey(state) {
    try {
      const logic = globalThis.LuxHomeJourneyV2Logic;
      const api = globalThis.LuxJourney;
      if (!logic || !api) return { ready: false, rows: [] };
      return logic.homeJourney(state, api, localStorage) || { ready: false, rows: [] };
    } catch {
      return { ready: false, rows: [] };
    }
  }

  function studyDays(state) {
    const days = new Set();
    for (const entry of state.formalAttemptLog || []) if (entry?.day) days.add(entry.day);
    for (const task of state.daily || []) if (task?.planDate && Number(task.progress) > 0) days.add(task.planDate);
    return days;
  }

  function missedDays(studied) {
    const dates = [];
    const today = new Date();
    for (let ago = 1; ago <= 14 && dates.length < 2; ago += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - ago);
      const key = date.toISOString().slice(0, 10);
      if (!studied.has(key)) dates.push(key);
    }
    return dates;
  }

  function lastThirty(studied) {
    const marks = [];
    const today = new Date();
    for (let ago = 29; ago >= 0; ago -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - ago);
      marks.push(studied.has(date.toISOString().slice(0, 10)));
    }
    return marks;
  }

  function levelOf(state) {
    const xp = xpOf(state);
    return Math.max(1, Math.floor(xp / 120) + 1);
  }

  function xpOf(state) {
    return Math.max(0, Number(state.xp) || 0);
  }

  const SCENES = {
    dusk: ["/art/stages/dusk.jpg", "50% 68%"],
    classroom: ["/art/stages/classroom.jpg", "50% 46%"],
    courtyard: ["/art/stages/courtyard.jpg", "50% 62%"],
    garden: ["/art/stages/garden.jpg", "50% 55%"],
    "library-hall": ["/art/scenes/scene-01.jpg", "50% 55%"],
    "dusk-court": ["/art/scenes/scene-02.jpg", "50% 60%"],
    "form-room": ["/art/scenes/scene-03.jpg", "50% 48%"],
    conservatory: ["/art/scenes/scene-04.jpg", "50% 50%"],
    fountain: ["/art/scenes/scene-05.jpg", "50% 58%"],
    "chem-lab": ["/art/scenes/scene-06.jpg", "50% 50%"],
    "bio-lab": ["/art/scenes/scene-07.jpg", "50% 50%"],
    "phys-lab": ["/art/scenes/scene-08.jpg", "50% 50%"],
    "sports-hall": ["/art/scenes/scene-09.jpg", "50% 55%"],
    "herb-walk": ["/art/scenes/scene-10.jpg", "50% 58%"],
  };

  function sceneOf(state) {
    const picked = SCENES[state.equippedScene] || SCENES.dusk;
    return { art: picked[0], focus: picked[1] };
  }

  function petSrc() {
    try {
      const pet = JSON.parse(localStorage.getItem("lux-pet-companion-v1") || "{}");
      const species = String(pet.species || "moss-hornling");
      return `/art/doll/companion-${species}.webp`;
    } catch {
      return "/art/doll/companion-moss-hornling.webp";
    }
  }

  function labelDate(iso) {
    const date = new Date(`${iso}T12:00:00`);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  function taskLink(href, title, meta) {
    const link = document.createElement("a");
    link.className = "rpg-task";
    link.href = href;
    link.style.cssText = "display:flex;align-items:center;gap:0.45rem;width:100%;min-height:1.7rem;margin:0 0 0.2rem;padding:0.12rem 0.45rem;white-space:nowrap;overflow:hidden;text-decoration:none;color:inherit;";
    const name = document.createElement("strong");
    name.textContent = title;
    name.style.cssText = "flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.78rem;font-weight:600;";
    const em = document.createElement("em");
    em.textContent = meta;
    em.style.cssText = "flex:0 0 auto;font-style:normal;font-size:0.72rem;";
    link.append(name, em);
    return link;
  }

  function orb(badge, label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rpg-orb";
    const shield = el("span", "rpg-shield", badge);
    button.append(shield, document.createTextNode(label));
    button.addEventListener("click", onClick);
    return button;
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  sync();
}
