import {
  PET_ACTIONS,
  DAILY_BOND_CAP,
  awardBond,
  getActionEffectiveness,
  getCareSummary,
  performPetAction,
} from "/pet/pet-care-state.js?v=20260927-care2";

const ACTION_ORDER = ["pat", "treat", "play", "gardenWalk", "trickTraining"];
let statusTimer = 0;
let previousLevels = null;

function displayName(pet) {
  return String(pet?.name || "").trim() || "Your companion";
}

function stageSnapshot(pet) {
  const levels = pet?.petLevels && typeof pet.petLevels === "object" ? pet.petLevels : {};
  return Object.fromEntries(Object.entries(levels).map(([id, level]) => [id, Math.max(1, Math.min(5, Number(level) || 1))]));
}

function syncEvolutionReward(pet) {
  const next = stageSnapshot(pet);
  if (previousLevels == null) {
    previousLevels = next;
    return;
  }
  const previous = previousLevels;
  previousLevels = next;
  for (const [species, level] of Object.entries(next)) {
    const before = Math.max(1, Number(previous[species]) || 1);
    if (level <= before) continue;
    for (let stage = before + 1; stage <= level; stage += 1) {
      awardBond(5, {
        key: `evolve:${species}:${stage}`,
        reason: "Companion evolution",
        moodDelta: 8,
        bypassDailyCap: true,
      });
    }
  }
}

function actionMeta(action, summary) {
  const care = summary.care;
  const used = Math.max(0, Number(care.daily.actionCounts[action.id]) || 0);
  const locked = care.bond < action.requiredBond;
  const noEnergy = care.energy < action.energyCost;
  const done = used >= action.dailyLimit;
  const effectiveness = getActionEffectiveness(action, care.energy);
  const effectiveBond = action.bondGain > 0 ? Math.max(1, Math.floor(action.bondGain * effectiveness)) : 0;

  let note = `+${effectiveBond} Bond · +${action.moodGain} Mood`;
  if (action.energyCost) note += ` · −${action.energyCost} Energy`;
  if (action.energyGain) note += ` · +${action.energyGain} Energy`;
  if (locked) note = `Unlock at ${action.requiredBond} Bond`;
  else if (done) note = "Bond reward done today";
  else if (noEnergy) note = `Needs ${action.energyCost} Energy`;
  else if (effectiveness < 1) note += ` · tired ${Math.round(effectiveness * 100)}%`;

  return { used, locked, noEnergy, done, effectiveness, note };
}

function createPanel() {
  const panel = document.createElement("section");
  panel.className = "pet-panel pet-care-panel";
  panel.id = "petCarePanel";
  panel.innerHTML = `
    <div class="pet-care-head">
      <div>
        <p class="pet-kicker">Companion care</p>
        <h2>Bond, Mood & Energy</h2>
      </div>
      <div class="pet-care-badges">
        <div class="pet-care-tier" id="petBondTier" aria-live="polite"><span id="petBondTierIcon">🌱</span><strong id="petBondTierLabel">Acquainted</strong></div>
        <div class="pet-care-mood" aria-live="polite">
          <span class="pet-care-mood-icon" id="petMoodIcon" aria-hidden="true">🙂</span>
          <span><small>Mood</small><strong id="petMoodLabel">Happy</strong></span>
        </div>
      </div>
    </div>

    <div class="pet-care-meters">
      <div class="pet-care-meter">
        <div class="pet-care-meter-head"><span>Bond</span><b id="petBondValue">0 / 100</b></div>
        <div class="pet-care-track" role="progressbar" aria-label="Bond" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="petBondTrack"><i id="petBondBar"></i></div>
      </div>
      <div class="pet-care-meter">
        <div class="pet-care-meter-head"><span>Mood</span><b id="petMoodValue">65 / 100</b></div>
        <div class="pet-care-track pet-care-mood-track" role="progressbar" aria-label="Mood" aria-valuemin="0" aria-valuemax="100" aria-valuenow="65" id="petMoodTrack"><i id="petMoodBar"></i></div>
      </div>
      <div class="pet-care-meter">
        <div class="pet-care-meter-head"><span>Energy</span><b id="petEnergyValue">100 / 100</b></div>
        <div class="pet-care-track pet-care-energy-track" role="progressbar" aria-label="Energy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="petEnergyTrack"><i id="petEnergyBar"></i></div>
      </div>
    </div>

    <details class="pet-care-help"><summary>How care works</summary><p class="pet-care-explainer" id="petCareExplainer">Bond never decays. Energy recovers automatically.</p></details>
    <div class="pet-care-actions" id="petCareActions"></div>
    <p class="pet-care-status" id="petCareStatus" role="status" aria-live="polite"></p>
  `;
  return panel;
}

function ensurePanel() {
  let panel = document.getElementById("petCarePanel");
  if (panel) return panel;
  const side = document.querySelector(".pet-side");
  if (!side) return null;
  panel = createPanel();
  const growthPanel = side.querySelector("#petGrowth");
  if (growthPanel) growthPanel.insertAdjacentElement("beforebegin", panel);
  else side.prepend(panel);

  panel.querySelector("#petCareActions")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-pet-action]");
    if (!button) return;
    const result = performPetAction(button.dataset.petAction);
    setStatus(result.message || "");
    render();
  });
  return panel;
}

function setStatus(message) {
  const node = document.getElementById("petCareStatus");
  if (!node) return;
  node.textContent = message;
  window.clearTimeout(statusTimer);
  if (message) {
    statusTimer = window.setTimeout(() => {
      if (node.textContent === message) node.textContent = "";
    }, 5200);
  }
}

function renderActions(summary) {
  const host = document.getElementById("petCareActions");
  if (!host) return;
  const actionButton = (id) => {
    const action = PET_ACTIONS[id];
    const meta = actionMeta(action, summary);
    const disabled = meta.locked || meta.noEnergy || meta.done;
    const suffix = meta.locked ? "Locked" : meta.done ? "Done" : meta.effectiveness < 1 ? "Tired" : "";
    return `
      <button type="button" class="pet-care-action" data-pet-action="${action.id}" ${disabled ? "disabled" : ""}>
        <span><strong>${action.label}</strong><small>${meta.note}</small></span>
        ${suffix ? `<em>${suffix}</em>` : ""}
      </button>
    `;
  };
  host.innerHTML = ACTION_ORDER.slice(0, 3).map(actionButton).join("") +
    `<details class="pet-more-actions"><summary>More activities</summary><div class="pet-more-action-list">${ACTION_ORDER.slice(3).map(actionButton).join("")}</div></details>`;
}

function render() {
  const panel = ensurePanel();
  if (!panel) return;
  const summary = getCareSummary();
  const { pet, care, mood, tier, nextUnlock, dailyRemaining, energyTickMinutes } = summary;

  panel.dataset.bondTier = tier.id;
  panel.classList.toggle("is-soul-bond", tier.id === "soul-bond");
  panel.classList.toggle("is-max-bond", tier.id === "max-bond");

  const values = [
    ["petMoodIcon", mood.icon], ["petMoodLabel", mood.label],
    ["petBondTierIcon", tier.icon], ["petBondTierLabel", tier.label],
    ["petBondValue", `${Math.round(care.bond)} / 100`],
    ["petMoodValue", `${Math.round(care.mood)} / 100`],
    ["petEnergyValue", `${Math.round(care.energy)} / 100`],
  ];
  for (const [id, value] of values) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  for (const [barId, trackId, value] of [
    ["petBondBar", "petBondTrack", care.bond],
    ["petMoodBar", "petMoodTrack", care.mood],
    ["petEnergyBar", "petEnergyTrack", care.energy],
  ]) {
    const safe = Math.max(0, Math.min(100, Number(value) || 0));
    const bar = document.getElementById(barId);
    const track = document.getElementById(trackId);
    if (bar) bar.style.width = `${safe}%`;
    if (track) track.setAttribute("aria-valuenow", String(Math.round(safe)));
  }

  const explainer = document.getElementById("petCareExplainer");
  if (explainer) {
    const nextText = nextUnlock ? ` Next unlock: ${nextUnlock.label} at ${nextUnlock.requiredBond} Bond.` : " All Bond milestones are complete.";
    const special = tier.id === "max-bond"
      ? " 👑 Crowned Companion status is permanent."
      : tier.id === "soul-bond"
        ? " ✨ Soul Bond greeting unlocked."
        : "";
    explainer.textContent = `${displayName(pet)} · ${tier.label}. ${tier.perk} Energy recovers 1 every ${energyTickMinutes} minutes. ${dailyRemaining}/${DAILY_BOND_CAP} care-interaction Bond remains today.${nextText}${special}`;
  }

  renderActions(summary);
}

function onPetChanged(event) {
  try { syncEvolutionReward(event.detail || getCareSummary({ persistRecovery: false }).pet); } catch {}
  render();
}

function boot() {
  ensurePanel();
  try { previousLevels = stageSnapshot(getCareSummary({ persistRecovery: false }).pet); } catch {}
  render();

  window.addEventListener("scholar:pet-care-changed", render);
  window.addEventListener("scholar:pet-changed", onPetChanged);
  window.addEventListener("scholar:mp-changed", render);
  window.addEventListener("focus", render);
  window.addEventListener("pageshow", render);
  window.addEventListener("storage", (event) => {
    if (event.key !== "lux-pet-companion-v1") return;
    try { previousLevels = stageSnapshot(getCareSummary({ persistRecovery: false }).pet); } catch {}
    render();
  });
  window.setInterval(render, 60 * 1000);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
