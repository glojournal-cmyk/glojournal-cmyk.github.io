const PET_KEY = "lux-pet-companion-v1";

export const CARE_VERSION = 1;
export const MAX_BOND = 100;
export const MAX_ENERGY = 100;
export const ENERGY_REGEN_PER_HOUR = 6;
export const DAILY_BOND_CAP = 8;
const ENERGY_TICK_MS = Math.round(60 * 60 * 1000 / ENERGY_REGEN_PER_HOUR);

export const PET_ACTIONS = Object.freeze({
  pat: {
    id: "pat",
    label: "Pat",
    requiredBond: 0,
    bondGain: 1,
    energyCost: 0,
    energyGain: 0,
    dailyLimit: 1,
  },
  treat: {
    id: "treat",
    label: "Give treat",
    requiredBond: 15,
    bondGain: 1,
    energyCost: 0,
    energyGain: 8,
    dailyLimit: 2,
  },
  play: {
    id: "play",
    label: "Play",
    requiredBond: 30,
    bondGain: 2,
    energyCost: 12,
    energyGain: 0,
    dailyLimit: 3,
  },
  gardenWalk: {
    id: "gardenWalk",
    label: "Garden walk",
    requiredBond: 50,
    bondGain: 3,
    energyCost: 18,
    energyGain: 0,
    dailyLimit: 2,
  },
  trickTraining: {
    id: "trickTraining",
    label: "Trick training",
    requiredBond: 70,
    bondGain: 3,
    energyCost: 20,
    energyGain: 0,
    dailyLimit: 2,
  },
});

const MOODS = Object.freeze({
  excited: { id: "excited", label: "Excited", icon: "✨" },
  happy: { id: "happy", label: "Happy", icon: "😊" },
  content: { id: "content", label: "Content", icon: "🙂" },
  sleepy: { id: "sleepy", label: "Sleepy", icon: "😴" },
  resting: { id: "resting", label: "Resting", icon: "🌙" },
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function localDayKey(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readRawPet() {
  try {
    const raw = JSON.parse(localStorage.getItem(PET_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function normalizeDaily(raw, now) {
  const day = localDayKey(now);
  if (!raw || raw.day !== day) {
    return { day, bondEarned: 0, actionCounts: {}, rewardKeys: {} };
  }
  return {
    day,
    bondEarned: clamp(raw.bondEarned, 0, DAILY_BOND_CAP),
    actionCounts: raw.actionCounts && typeof raw.actionCounts === "object" ? { ...raw.actionCounts } : {},
    rewardKeys: raw.rewardKeys && typeof raw.rewardKeys === "object" ? { ...raw.rewardKeys } : {},
  };
}

function recoverEnergy(care, now) {
  const current = clamp(care.energy, 0, MAX_ENERGY);
  let last = Number(care.lastEnergyUpdateAt) || now;

  // Do not bank recovery time while already full.
  if (current >= MAX_ENERGY) {
    return { ...care, energy: MAX_ENERGY, lastEnergyUpdateAt: now };
  }

  const elapsed = Math.max(0, now - last);
  const recovered = Math.floor(elapsed / ENERGY_TICK_MS);
  if (recovered <= 0) return { ...care, energy: current, lastEnergyUpdateAt: last };

  const energy = Math.min(MAX_ENERGY, current + recovered);
  last += recovered * ENERGY_TICK_MS;
  if (energy >= MAX_ENERGY) last = now;
  return { ...care, energy, lastEnergyUpdateAt: last };
}

function normalizePet(raw, now = Date.now()) {
  const careRaw = raw?.care && typeof raw.care === "object" ? raw.care : {};
  let care = {
    version: CARE_VERSION,
    bond: clamp(careRaw.bond, 0, MAX_BOND),
    energy: careRaw.energy == null ? MAX_ENERGY : clamp(careRaw.energy, 0, MAX_ENERGY),
    lastEnergyUpdateAt: Number(careRaw.lastEnergyUpdateAt) || now,
    lastInteractionAt: Number(careRaw.lastInteractionAt) || 0,
    lastAction: String(careRaw.lastAction || ""),
    daily: normalizeDaily(careRaw.daily, now),
  };
  care = recoverEnergy(care, now);
  return { ...raw, care };
}

function sameCare(a, b) {
  return JSON.stringify(a?.care || null) === JSON.stringify(b?.care || null);
}

function writePet(next, detail = {}) {
  localStorage.setItem(PET_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("scholar:pet-care-changed", { detail: { pet: next, ...detail } }));
  window.dispatchEvent(new CustomEvent("scholar:pet-changed", { detail: next }));
  return next;
}

export function getPetSnapshot({ persistRecovery = true, now = Date.now() } = {}) {
  const raw = readRawPet();
  const next = normalizePet(raw, now);
  if (persistRecovery && !sameCare(raw, next)) {
    try {
      localStorage.setItem(PET_KEY, JSON.stringify(next));
    } catch {}
  }
  return next;
}

export function getPetMood(petOrCare, now = Date.now()) {
  const care = petOrCare?.care || petOrCare || {};
  const bond = clamp(care.bond, 0, MAX_BOND);
  const energy = clamp(care.energy, 0, MAX_ENERGY);
  const recentInteraction = Number(care.lastInteractionAt) > 0 && now - Number(care.lastInteractionAt) <= 2 * 60 * 60 * 1000;

  if (energy <= 20) return MOODS.sleepy;
  if (bond >= 70 && energy >= 60 && recentInteraction) return MOODS.excited;
  if (bond >= 50 && energy >= 40) return MOODS.happy;
  if (energy >= 30) return MOODS.content;
  return MOODS.resting;
}

export function getNextBondUnlock(bond) {
  const value = clamp(bond, 0, MAX_BOND);
  const ordered = Object.values(PET_ACTIONS)
    .filter((action) => action.requiredBond > value)
    .sort((a, b) => a.requiredBond - b.requiredBond);
  return ordered[0] || null;
}

function awardBondOnPet(pet, amount, rewardKey, reason, now) {
  const daily = normalizeDaily(pet.care.daily, now);
  const key = String(rewardKey || reason || `reward:${now}`);

  if (daily.rewardKeys[key]) {
    return { pet, amount: 0, duplicate: true, capped: false };
  }

  const remainingDaily = Math.max(0, DAILY_BOND_CAP - daily.bondEarned);
  const remainingBond = Math.max(0, MAX_BOND - pet.care.bond);
  const granted = Math.max(0, Math.min(Number(amount) || 0, remainingDaily, remainingBond));

  const nextDaily = {
    ...daily,
    bondEarned: daily.bondEarned + granted,
    rewardKeys: { ...daily.rewardKeys, [key]: true },
  };

  const next = {
    ...pet,
    care: {
      ...pet.care,
      bond: pet.care.bond + granted,
      daily: nextDaily,
    },
  };

  return {
    pet: next,
    amount: granted,
    duplicate: false,
    capped: granted < Math.max(0, Number(amount) || 0),
    reason,
  };
}

export function awardBond(amount, { key, reason = "Bond reward", now = Date.now() } = {}) {
  const pet = getPetSnapshot({ persistRecovery: false, now });
  const result = awardBondOnPet(pet, amount, key, reason, now);
  if (!result.duplicate) {
    writePet(result.pet, { type: "bond", amount: result.amount, reason, capped: result.capped });
  }
  return result;
}

export function performPetAction(actionId, { now = Date.now() } = {}) {
  const action = PET_ACTIONS[actionId];
  if (!action) return { ok: false, code: "unknown-action", message: "That interaction is not available." };

  const pet = getPetSnapshot({ persistRecovery: false, now });
  const care = pet.care;
  const daily = normalizeDaily(care.daily, now);
  const used = Math.max(0, Number(daily.actionCounts[action.id]) || 0);

  if (care.bond < action.requiredBond) {
    return {
      ok: false,
      code: "locked",
      action,
      message: `Reach ${action.requiredBond} Bond to unlock ${action.label}.`,
      pet,
    };
  }

  if (used >= action.dailyLimit) {
    return {
      ok: false,
      code: "daily-limit",
      action,
      message: `${action.label} has already given its Bond reward for today.`,
      pet,
    };
  }

  if (care.energy < action.energyCost) {
    return {
      ok: false,
      code: "energy",
      action,
      message: `Not enough Energy. ${action.label} needs ${action.energyCost}.`,
      pet,
    };
  }

  const energy = clamp(care.energy - action.energyCost + action.energyGain, 0, MAX_ENERGY);
  const touched = {
    ...pet,
    care: {
      ...care,
      energy,
      lastEnergyUpdateAt: energy >= MAX_ENERGY ? now : care.lastEnergyUpdateAt,
      lastInteractionAt: now,
      lastAction: action.id,
      daily: {
        ...daily,
        actionCounts: { ...daily.actionCounts, [action.id]: used + 1 },
      },
    },
  };

  const rewardKey = `action:${daily.day}:${action.id}:${used + 1}`;
  const rewarded = awardBondOnPet(touched, action.bondGain, rewardKey, action.label, now);
  const next = rewarded.pet;

  writePet(next, {
    type: "action",
    action: action.id,
    amount: rewarded.amount,
    energyCost: action.energyCost,
    energyGain: action.energyGain,
    capped: rewarded.capped,
  });

  const energyText = action.energyCost
    ? ` −${action.energyCost} Energy`
    : action.energyGain
      ? ` +${action.energyGain} Energy`
      : "";

  const bondText = rewarded.amount > 0 ? ` +${rewarded.amount} Bond` : "";
  return {
    ok: true,
    code: "ok",
    action,
    bondGained: rewarded.amount,
    energy,
    pet: next,
    message: `${action.label}.${bondText}${energyText}`.trim(),
  };
}

export function getCareSummary(options = {}) {
  const now = options.now ?? Date.now();
  const pet = getPetSnapshot({ persistRecovery: options.persistRecovery !== false, now });
  const mood = getPetMood(pet, now);
  const nextUnlock = getNextBondUnlock(pet.care.bond);
  const dailyRemaining = Math.max(0, DAILY_BOND_CAP - pet.care.daily.bondEarned);
  return {
    pet,
    care: pet.care,
    mood,
    nextUnlock,
    dailyRemaining,
    energyRegenPerHour: ENERGY_REGEN_PER_HOUR,
    energyTickMinutes: 60 / ENERGY_REGEN_PER_HOUR,
  };
}

export { PET_KEY, localDayKey };
