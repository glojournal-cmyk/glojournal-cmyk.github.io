const EVOLUTION_ART_VERSION = "20260927-pebble-v3";
const PEBBLE_SHEET = `/pet/art-evolution-v3/pebble-wisp.avif?v=${EVOLUTION_ART_VERSION}`;
const PEBBLE_SOURCE_RE = /\/pet\/(?:art-master\/pebble-wisp\.png|art-evolution-v2\/pebble-wisp\.webp)/i;
const MOSS_SHEET = "/pet/art-evolution-v3/moss-hornling.avif?v=20260928-moss-v3";
const MOSS_SOURCE_RE = /\/pet\/(?:art-master\/moss-hornling\.png|art-evolution-v2\/moss-hornling\.webp)/i;
const ANTLER_SHEET = "/pet/art-evolution-v3/antler-bean.webp?v=20260928-antler-v3b";
const ANTLER_SOURCE_RE = /\/pet\/(?:art-master\/antler-bean\.png|art-evolution-v2\/antler-bean\.webp)/i;
const LEGACY_SPRITE_RE = /\/pet\/art-evolution-v2\/([a-z0-9-]+)\.webp/i;

function clampLevel(value) {
  return Math.max(1, Math.min(5, Number(value) || 1));
}

function levelFromPosition(value = "") {
  const pos = String(value).trim().replace(/\s+/g, " ");
  if (pos === "0% 0%" || pos === "left top") return 2;
  if (pos === "100% 0%" || pos === "right top") return 3;
  if (pos === "0% 100%" || pos === "left bottom") return 4;
  if (pos === "100% 100%" || pos === "right bottom") return 5;
  return null;
}

function inferLevel(el) {
  if (el.id === "petImage") {
    const avatar = el.closest("#petAvatar");
    const match = String(avatar?.className || "").match(/(?:^|\s)stage-(\d)(?:\s|$)/);
    if (match) return clampLevel(match[1]);
  }

  const form = el.closest(".pet-form");
  const grid = form?.parentElement;
  if (form && grid?.id === "petFormGrid") {
    const index = [...grid.children].indexOf(form);
    if (index >= 0) return clampLevel(index + 1);
  }

  const home = el.closest("#mastery-pet-home");
  if (home?.dataset?.stage) return clampLevel(home.dataset.stage);

  const position = el.style.backgroundPosition || getComputedStyle(el).backgroundPosition;
  return clampLevel(levelFromPosition(position) || 1);
}

function mossPosition(level) {
  return {
    1: "0% 0%",
    2: "50% 0%",
    3: "100% 0%",
    4: "0% 100%",
    5: "50% 100%",
  }[clampLevel(level)];
}

function patchMoss(el, background) {
  if (!MOSS_SOURCE_RE.test(background)) return false;
  const level = inferLevel(el);
  el.style.backgroundImage = `url("${MOSS_SHEET}")`;
  el.style.backgroundSize = "300% 200%";
  el.style.backgroundPosition = mossPosition(level);
  el.style.backgroundRepeat = "no-repeat";
  el.dataset.evolutionArt = `moss-hornling:${level}:v3`;
  return true;
}

function antlerPosition(level) {
  return {
    1: "0% 0%",
    2: "50% 0%",
    3: "100% 0%",
    4: "0% 100%",
    5: "50% 100%",
  }[clampLevel(level)];
}

function patchAntler(el, background) {
  if (!ANTLER_SOURCE_RE.test(background)) return false;
  const level = inferLevel(el);
  el.style.backgroundImage = `url("${ANTLER_SHEET}")`;
  el.style.backgroundSize = "300% 200%";
  el.style.backgroundPosition = antlerPosition(level);
  el.style.backgroundRepeat = "no-repeat";
  el.dataset.evolutionArt = `antler-bean:${level}:v3`;
  return true;
}

function pebblePosition(level) {
  return {
    1: "0% 0%",
    2: "50% 0%",
    3: "100% 0%",
    4: "0% 100%",
    5: "50% 100%",
  }[clampLevel(level)];
}

function patchPebble(el, background) {
  if (!PEBBLE_SOURCE_RE.test(background)) return false;
  const level = inferLevel(el);
  el.style.backgroundImage = `url("${PEBBLE_SHEET}")`;
  el.style.backgroundSize = "300% 200%";
  el.style.backgroundPosition = pebblePosition(level);
  el.style.backgroundRepeat = "no-repeat";
  el.dataset.evolutionArt = `pebble-wisp:${level}:v3`;
  return true;
}

function patchSprite(el) {
  if (!(el instanceof HTMLElement)) return false;
  const background = el.style.backgroundImage || "";
  if (patchAntler(el, background)) return true;
  if (patchMoss(el, background)) return true;
  if (patchPebble(el, background)) return true;
  const match = background.match(LEGACY_SPRITE_RE);
  if (!match) return false;

  const level = inferLevel(el);
  if (level < 2) return false;

  const species = match[1];
  const nextUrl = `/pet/art-evolution/level-${level}/${species}.webp?v=${EVOLUTION_ART_VERSION}`;
  el.style.backgroundImage = `url("${nextUrl}")`;
  el.style.backgroundSize = "contain";
  el.style.backgroundPosition = "center";
  el.style.backgroundRepeat = "no-repeat";
  el.dataset.evolutionArt = `${species}:${level}`;
  return true;
}

function scan() {
  document.querySelectorAll(".pet-sprite, .mph-art").forEach(patchSprite);
}

let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    scan();
  });
}

scan();
document.addEventListener("DOMContentLoaded", schedule, { once: true });
window.addEventListener("storage", schedule);
window.addEventListener("scholar:pet-changed", schedule);
window.addEventListener("scholar:pet-care-changed", schedule);
new MutationObserver(schedule).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["style", "class", "data-stage"],
});
