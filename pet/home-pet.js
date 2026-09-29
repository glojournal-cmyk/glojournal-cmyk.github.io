import { getCareSummary } from "/pet/pet-care-state.js?v=20260927-care2";

// The progression guard imports the React app bundle. Loading it on the
// standalone Pet page makes React replace that page with an empty root.
if (!location.pathname.startsWith("/pet")) {
  import("/assets/progression-guard-20260927.js?v=20260929-dailyfix4").catch(() => {});
}

const APP_KEY = "lux-scholar-garden-v1";
const PET_KEY = "lux-pet-companion-v1";
const CELEBRATE_KEY = "lux-pet-pending-celebration";
const HOME_CSS_ID = "lux-home-companion-v2";
const HOME_CSS_HREF = "/pet/home-companion-v2.css?v=20260927-layout2";
const PET_ART_VERSION = "20260926-evolution2";

const pets = {
  "moss-hornling": "Moss Hornling",
  "antler-bean": "Antler Bean",
  "inkling": "Inkling",
  "pebble-wisp": "Pebble Wisp",
  "moon-puff": "Moon Puff",
  "mothling": "Mothling",
  "bloom-snail": "Bloom Snail",
  "velvet-batling": "Velvet Batling",
  "sprig-dragon": "Sprig Dragon",
  "star-toadlet": "Star Toadlet",
  "snow-owl": "Moonveil Owl",
  "night-spider": "Nocturne Spider",
};

const stageNames = ["Foundling", "Curious Companion", "Scholar Familiar", "Garden Familiar", "Mastery Companion"];

function ensureCss() {
  if (document.getElementById(HOME_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = HOME_CSS_ID;
  link.rel = "stylesheet";
  link.href = HOME_CSS_HREF;
  document.head.appendChild(link);
}

function readApp() {
  try {
    const parsed = JSON.parse(localStorage.getItem(APP_KEY) || "{}");
    return parsed && parsed.state ? parsed.state : parsed || {};
  } catch {
    return {};
  }
}

function readPet() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PET_KEY) || "{}");
    const species = pets[parsed?.species] ? parsed.species : "moss-hornling";
    const levels = parsed?.petLevels && typeof parsed.petLevels === "object" ? { ...parsed.petLevels } : {};
    if (!levels[species] && Number(parsed?.highestStage) > 1) {
      levels[species] = Math.max(1, Math.min(5, Number(parsed.highestStage)));
    }
    return {
      ...parsed,
      species,
      name: String(parsed?.name || "").trim(),
      masteryPoints: Math.max(0, Number(parsed?.masteryPoints) || 0),
      petLevels: levels,
    };
  } catch {
    return { species: "moss-hornling", name: "", masteryPoints: 0, petLevels: {} };
  }
}

function masteryCount(state) {
  return Object.values(state.topicStats || {}).filter((row) => row?.state === "mastered").length;
}

function dueMastery(state) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return Object.values(state.skillStats || {}).filter((row) => row?.retentionDue && row.retentionDue <= today && (row.retentionReady || row.retentionPasses > 0)).length;
}

function displayName(pet) {
  return pet.name || pets[pet.species] || "Companion";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

function spriteStyle(species, level = 1) {
  const safe = pets[species] ? species : "moss-hornling";
  const stage = Math.max(1, Math.min(5, Number(level) || 1));
  if (new Set(["antler-bean", "moss-hornling", "inkling", "moon-puff", "mothling", "bloom-snail", "velvet-batling", "sprig-dragon", "star-toadlet"]).has(safe)) {
    return `background-image:url('/pet/art-3d-v2/level-${stage}/${safe}.webp?v=20260928-3d2');background-size:contain;background-position:center;background-repeat:no-repeat`;
  }
  if (safe === "snow-owl" || safe === "night-spider") {
    const position = { 1: "0% 0%", 2: "50% 0%", 3: "100% 0%", 4: "0% 100%", 5: "50% 100%" }[stage];
    return `background-image:url('/pet/art-secret/${safe}.png?v=20260928-secret1');background-size:300% 200%;background-position:${position};background-repeat:no-repeat`;
  }
  if (safe === "moss-hornling") {
    const position = { 1: "0% 0%", 2: "50% 0%", 3: "100% 0%", 4: "0% 100%", 5: "50% 100%" }[stage];
    return `background-image:url('/pet/art-evolution-v3/moss-hornling.avif?v=20260928-moss-v3');background-size:300% 200%;background-position:${position};background-repeat:no-repeat`;
  }
  if (safe === "antler-bean") {
    const position = { 1: "0% 0%", 2: "50% 0%", 3: "100% 0%", 4: "0% 100%", 5: "50% 100%" }[stage];
    return `background-image:url('/pet/art-evolution-v3/antler-bean.webp?v=20260928-antler-v3b');background-size:300% 200%;background-position:${position};background-repeat:no-repeat`;
  }
  if (stage >= 2) {
    const position = { 2: "0% 0%", 3: "100% 0%", 4: "0% 100%", 5: "100% 100%" }[stage] || "0% 0%";
    return `background-image:url('/pet/art-evolution-v2/${safe}.webp?v=${PET_ART_VERSION}');background-size:200% 200%;background-position:${position}`;
  }
  return `background-image:url('/pet/art-master/${safe}.png?v=${PET_ART_VERSION}')`;
}

function petNavIcon() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true"><circle cx="11" cy="4" r="2"></circle><circle cx="18" cy="8" r="2"></circle><circle cx="4" cy="8" r="2"></circle><path d="M12 11c-3.6 0-6.5 2.5-6.5 5.5 0 2.1 1.6 3.5 3.6 3.5 1.2 0 2-.7 2.9-.7s1.7.7 2.9.7c2 0 3.6-1.4 3.6-3.5 0-3-2.9-5.5-6.5-5.5Z"></path></svg>';
}

function openPets(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  window.location.assign("/pet/");
}

function ensureNavigation() {
  document.querySelectorAll("nav").forEach((nav) => {
    const isAside = Boolean(nav.closest("aside"));
    if (!isAside) nav.classList.add("lux-companion-bottom-nav");

    if (nav.querySelector('[data-pet-nav="true"]')) return;
    const play = [...nav.querySelectorAll('a[href="/play"],a[href="/play/"]')].find((a) => a.parentElement === nav);
    if (!play) return;

    const link = document.createElement("a");
    link.href = "/pet/";
    link.dataset.petNav = "true";
    link.setAttribute("aria-label", "Open Pets and Mastery Points");
    link.className = play.className;
    link.innerHTML = `${petNavIcon()}<span>Pets</span>`;
    link.addEventListener("click", openPets);
    play.insertAdjacentElement("afterend", link);
  });
}

function enhanceShell() {
  ensureCss();
  ensureNavigation();
  document.querySelector("header")?.classList.add("lux-companion-header");
  document.querySelector("main")?.classList.add("lux-main-with-companion-nav");
}

function findHero() {
  const scholar = [...document.querySelectorAll('img[src^="/art/doll/"],img[src*="/art/doll/"]')].find((img) => img.closest("main"));
  if (!scholar) return null;
  const scholarWrap = scholar.parentElement;
  const host = scholarWrap?.parentElement;
  if (!host) return null;

  host.classList.add("lux-scholar-pet-scene");
  scholarWrap?.classList.add("lux-scholar-stage-scholar");
  scholar.classList.add("lux-scholar-character");
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  return host;
}

function enhanceHomeCards() {
  if (location.pathname !== "/") return;
  const main = document.querySelector("main");
  if (!main) return;

  [...main.querySelectorAll("h2")].forEach((heading) => {
    if (!/raise her today|scholar level/i.test(heading.textContent || "")) return;
    let node = heading.parentElement;
    while (node && node !== main) {
      if (String(node.className || "").includes("rounded-[28px]")) {
        node.classList.add("lux-home-card");
        break;
      }
      node = node.parentElement;
    }
  });

  [...main.querySelectorAll('a[href^="/study/"],a[href^="/play/"]')].forEach((link) => {
    const label = (link.textContent || "").trim();
    if (/Practise|Exercise|Play/i.test(label) && link.querySelector("svg")) link.classList.add("lux-home-quick-action");
  });
}

function showToast(title, body) {
  let toast = document.getElementById("mastery-pet-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "mastery-pet-toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<b>🌿 ${escapeHtml(title)}</b><span>${escapeHtml(body || "")}</span>`;
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => toast.classList.remove("show"), 3600);
}

function consumeCelebration() {
  try {
    const raw = localStorage.getItem(CELEBRATE_KEY);
    if (!raw) return;
    const celebration = JSON.parse(raw);
    if (!celebration?.at || Date.now() - celebration.at > 28800000) {
      localStorage.removeItem(CELEBRATE_KEY);
      return;
    }
    localStorage.removeItem(CELEBRATE_KEY);
    showToast("A new Mastery Leaf", celebration.title ? `${celebration.title} is now mastered.` : "A topic reached formal Mastery.");
  } catch {}
}

function careSummary() {
  try {
    return getCareSummary();
  } catch {
    const pet = readPet();
    return {
      pet,
      care: { bond: 0, mood: 65, energy: 100 },
      mood: { icon: "🌿", label: "Content" },
      tier: { label: "Acquainted" },
    };
  }
}

function compactMetric(label, value) {
  return `<span class="mph-mini-stat"><small>${escapeHtml(label)}</small><b>${Math.round(Number(value) || 0)}</b></span>`;
}

function renderCompanion(host) {
  const state = readApp();
  const summary = careSummary();
  const pet = summary.pet || readPet();
  const care = summary.care || { bond: 0, mood: 65, energy: 100 };
  const leaves = masteryCount(state);
  const due = dueMastery(state);
  const stage = Math.max(1, Math.min(5, Number(pet.petLevels?.[pet.species]) || 1));
  const name = displayName(pet);

  let card = document.getElementById("mastery-pet-home");
  if (!card) {
    card = document.createElement("a");
    card.id = "mastery-pet-home";
    card.href = "/pet/";
    card.setAttribute("aria-label", "Open Companion Corner");
    card.addEventListener("click", openPets);
    host.appendChild(card);
  } else if (card.parentElement !== host) {
    host.appendChild(card);
  }

  const status = due > 0 ? `${due} retention ready` : `${leaves} Mastery ${leaves === 1 ? "Leaf" : "Leaves"}`;
  const signature = [pet.species, stage, pet.masteryPoints, due, leaves, name, care.bond, care.mood, care.energy, summary.mood?.label, summary.tier?.label].join("|");
  card.dataset.stage = String(stage);
  card.dataset.mood = String(summary.mood?.label || "Content").toLowerCase().replace(/\s+/g, "-");

  if (card.dataset.renderSignature !== signature) {
    card.dataset.renderSignature = signature;
    card.innerHTML =
      '<span class="mph-glow"></span><span class="mph-star s1"></span><span class="mph-star s2"></span>' +
      `<span class="mph-art" style="${spriteStyle(pet.species, stage)}" aria-hidden="true"></span>` +
      (leaves > 0 ? `<span class="mph-leaf">${leaves}</span>` : "") +
      `<span class="mph-tag"><b>${escapeHtml(name)}</b><small>${escapeHtml(stageNames[stage - 1])} · ${escapeHtml(summary.mood?.icon || "🌿")} ${escapeHtml(summary.mood?.label || "Content")}</small></span>`;
  }

  let hud = document.getElementById("mastery-pet-home-hud");
  if (!hud) {
    hud = document.createElement("a");
    hud.id = "mastery-pet-home-hud";
    hud.href = "/pet/";
    hud.addEventListener("click", openPets);
    host.appendChild(hud);
  } else if (hud.parentElement !== host) {
    host.appendChild(hud);
  }
  const hudSignature = [name, summary.tier?.label, status, care.bond, care.mood, care.energy].join("|");
  if (hud.dataset.renderSignature !== hudSignature) {
    hud.dataset.renderSignature = hudSignature;
    hud.innerHTML =
      `<span class="mph-hud-title"><b>${escapeHtml(name)}</b><small>${escapeHtml(summary.tier?.label || "Acquainted")} · ${escapeHtml(status)}</small></span>` +
      `<span class="mph-mini-stats">${compactMetric("Bond", care.bond)}${compactMetric("Mood", care.mood)}${compactMetric("Energy", care.energy)}</span>`;
  }

  try {
    const key = "lux-pet-last-stage-v1";
    const previous = Math.max(1, Number(localStorage.getItem(key)) || stage);
    if (stage > previous) {
      card.classList.add("evolving");
      showToast("A new companion form", `${name} evolved into ${stageNames[stage - 1]}.`);
      setTimeout(() => card.classList.remove("evolving"), 2600);
    }
    localStorage.setItem(key, String(Math.max(previous, stage)));
  } catch {}

  consumeCelebration();
}

function render() {
  enhanceShell();
  enhanceHomeCards();

  const existing = document.getElementById("mastery-pet-home");
  const hud = document.getElementById("mastery-pet-home-hud");
  if (location.pathname !== "/") {
    existing?.remove();
    hud?.remove();
    return;
  }

  const host = findHero();
  if (!host) return;
  renderCompanion(host);
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    render();
  });
}

new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("popstate", schedule);
window.addEventListener("storage", schedule);
window.addEventListener("focus", schedule);
window.addEventListener("scholar:pet-changed", schedule);
window.addEventListener("scholar:pet-care-changed", schedule);
window.addEventListener("scholar:mp-changed", schedule);
window.addEventListener("scholar:mastery-earned", (event) => {
  const detail = event.detail || {};
  if (detail.kind === "mastery") {
    try {
      localStorage.setItem(CELEBRATE_KEY, JSON.stringify({ at: Date.now(), title: detail.title || "" }));
    } catch {}
  }
  schedule();
});

render();
