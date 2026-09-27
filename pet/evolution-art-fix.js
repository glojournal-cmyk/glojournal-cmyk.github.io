const EVOLUTION_ART_VERSION = "20260927-evolution3";
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

function patchSprite(el) {
  if (!(el instanceof HTMLElement)) return false;
  const background = el.style.backgroundImage || "";
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
