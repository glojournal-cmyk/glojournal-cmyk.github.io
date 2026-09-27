import {
  PET_ACTIONS,
  DAILY_BOND_CAP,
  getCareSummary,
  performPetAction,
} from "/pet/pet-care-state.js?v=20260927-care1";

const ACTION_ORDER = ["pat", "treat", "play", "gardenWalk", "trickTraining"];
let statusTimer = 0;

function displayName(pet) {
  return String(pet?.name || "").trim() || "Your companion";
}

function actionMeta(action, summary) {
  const care = summary.care;
  const used = Math.max(0, Number(care.daily.actionCounts[action.id]) || 0);
  const locked = care.bond < action.requiredBond;
  const noEnergy = care.energy < action.energyCost;
  const done = used >= action.dailyLimit;

  let note = `+${action.bondGain} Bond`;
  if (action.energyCost) note += ` · −${action.energyCost} Energy`;
  if (action.energyGain) note += ` · +${action.energyGain} Energy`;
  if (locked) note = `Unlock at ${action.requiredBond} Bond`;
  else if (done) note = "Bond reward done today";
  else if (noEnergy) note = `Needs ${action.energyCost} Energy`;

  return { used, locked, noEnergy, done, note };
}

function createPanel() {
  const panel = document.createElement("section");
  panel.className = "pet-panel pet-care-panel";
  panel.id = "petCarePanel";
  panel.innerHTML = `
    <div class="pet-care-head">
      <div>
        <p class="pet-kicker">Companion care</p>
        <h2>Bond & Energy</h2>
      </div>
      <div class="pet-care-mood" aria-live="polite">
        <span class="pet-care-mood-icon" id="petMoodIcon" aria-hidden="true">🙂</span>
        <span><small>Mood</small><strong id="petMoodLabel">Content</strong></span>
      </div>
    </div>

    <div class="pet-care-meters">
      <div class="pet-care-meter">
        <div class="pet-care-meter-head"><span>Bond</span><b id="petBondValue">0 / 100</b></div>
        <div class="pet-care-track" role="progressbar" aria-label="Bond" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="petBondTrack"><i id="petBondBar"></i></div>
      </div>
      <div class="pet-care-meter">
        <div class="pet-care-meter-head"><span>Energy</span><b id="petEnergyValue">100 / 100</b></div>
        <div class="pet-care-track pet-care-energy-track" role="progressbar" aria-label="Energy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" id="petEnergyTrack"><i id="petEnergyBar"></i></div>
      </div>
    </div>

    <p class="pet-care-explainer" id="petCareExplainer">Bond never decays. Energy recovers automatically.</p>
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
  const firstPanel = side.querySelector(".pet-panel");
  if (firstPanel) firstPanel.insertAdjacentElement("afterend", panel);
  else side.prepend(panel);

  panel.querySelector("#petCareActions")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-pet-action]");
    if (!button) return;
    const actionId = button.dataset.petAction;
    const result = performPetAction(actionId);
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
    }, 4200);
  }
}

function renderActions(summary) {
  const host = document.getElementById("petCareActions");
  if (!host) return;
  const html = ACTION_ORDER.map((id) => {
    const action = PET_ACTIONS[id];
    const meta = actionMeta(action, summary);
    const disabled = meta.locked || meta.noEnergy || meta.done;
    const suffix = meta.locked ? "Locked" : meta.done ? "Done" : "";
    return `
      <button type="button" class="pet-care-action" data-pet-action="${action.id}" ${disabled ? "disabled" : ""}>
        <span><strong>${action.label}</strong><small>${meta.note}</small></span>
        ${suffix ? `<em>${suffix}</em>` : ""}
      </button>
    `;
  }).join("");
  host.innerHTML = html;
}

function render() {
  const panel = ensurePanel();
  if (!panel) return;

  const summary = getCareSummary();
  const { pet, care, mood, nextUnlock, dailyRemaining, energyTickMinutes } = summary;

  const moodIcon = document.getElementById("petMoodIcon");
  const moodLabel = document.getElementById("petMoodLabel");
  const bondValue = document.getElementById("petBondValue");
  const energyValue = document.getElementById("petEnergyValue");
  const bondBar = document.getElementById("petBondBar");
  const energyBar = document.getElementById("petEnergyBar");
  const bondTrack = document.getElementById("petBondTrack");
  const energyTrack = document.getElementById("petEnergyTrack");
  const explainer = document.getElementById("petCareExplainer");

  if (moodIcon) moodIcon.textContent = mood.icon;
  if (moodLabel) moodLabel.textContent = mood.label;
  if (bondValue) bondValue.textContent = `${care.bond} / 100`;
  if (energyValue) energyValue.textContent = `${care.energy} / 100`;
  if (bondBar) bondBar.style.width = `${care.bond}%`;
  if (energyBar) energyBar.style.width = `${care.energy}%`;
  if (bondTrack) bondTrack.setAttribute("aria-valuenow", String(care.bond));
  if (energyTrack) energyTrack.setAttribute("aria-valuenow", String(care.energy));

  if (explainer) {
    const nextText = nextUnlock
      ? ` Next unlock: ${nextUnlock.label} at ${nextUnlock.requiredBond} Bond.`
      : " All companion interactions are unlocked.";
    explainer.textContent =
      `${displayName(pet)} keeps Bond permanently. Energy recovers 1 every ${energyTickMinutes} minutes. ` +
      `${dailyRemaining}/${DAILY_BOND_CAP} Bond rewards remain today.${nextText}`;
  }

  renderActions(summary);
}

function boot() {
  ensurePanel();
  render();

  window.addEventListener("scholar:pet-care-changed", render);
  window.addEventListener("scholar:pet-changed", render);
  window.addEventListener("scholar:mp-changed", render);
  window.addEventListener("focus", render);
  window.addEventListener("pageshow", render);
  window.addEventListener("storage", (event) => {
    if (event.key === "lux-pet-companion-v1") render();
  });

  // Energy changes only every 10 minutes. A one-minute refresh keeps the UI
  // current without running a background energy timer.
  window.setInterval(render, 60 * 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
