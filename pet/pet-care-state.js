const PET_KEY = "lux-pet-companion-v1";

export const CARE_VERSION = 2;
export const MAX_BOND = 100;
export const MAX_ENERGY = 100;
export const MAX_MOOD = 100;
export const ENERGY_REGEN_PER_HOUR = 6;
export const DAILY_BOND_CAP = 8;
const ENERGY_TICK_MS = Math.round(60 * 60 * 1000 / ENERGY_REGEN_PER_HOUR);
const MAX_REWARD_LEDGER = 400;

export const BOND_TIERS = Object.freeze([
  { id: "acquainted", label: "Acquainted", min: 0, max: 24, icon: "🌱", perk: "A new friendship is beginning." },
  { id: "friendly", label: "Friendly", min: 25, max: 49, icon: "🌿", perk: "Your companion responds more warmly." },
  { id: "close", label: "Close", min: 50, max: 74, icon: "💛", perk: "Garden walks and closer interactions are available." },
  { id: "best-friend", label: "Best Friend", min: 75, max: 89, icon: "⭐", perk: "Your companion trusts you deeply." },
  { id: "soul-bond", label: "Soul Bond", min: 90, max: 99, icon: "✨", perk: "Special glowing greetings are unlocked." },
  { id: "max-bond", label: "Max Bond", min: 100, max: 100, icon: "👑", perk: "Crowned Companion status is permanently unlocked." },
]);

export const PET_ACTIONS = Object.freeze({
  pat: { id: "pat", label: "Pat", requiredBond: 0, bondGain: 1, moodGain: 3, energyCost: 0, energyGain: 0, dailyLimit: 1 },
  treat: { id: "treat", label: "Give treat", requiredBond: 15, bondGain: 1, moodGain: 4, energyCost: 0, energyGain: 8, dailyLimit: 2 },
  play: { id: "play", label: "Play", requiredBond: 30, bondGain: 2, moodGain: 6, energyCost: 12, energyGain: 0, dailyLimit: 3, tiredSensitive: true },
  gardenWalk: { id: "gardenWalk", label: "Garden walk", requiredBond: 50, bondGain: 3, moodGain: 7, energyCost: 18, energyGain: 0, dailyLimit: 2, tiredSensitive: true },
  trickTraining: { id: "trickTraining", label: "Trick training", requiredBond: 70, bondGain: 3, moodGain: 5, energyCost: 20, energyGain: 0, dailyLimit: 2, tiredSensitive: true },
});

const MOODS = Object.freeze({
  glowing: { id: "glowing", label: "Glowing", icon: "✨" },
  excited: { id: "excited", label: "Excited", icon: "🤩" },
  happy: { id: "happy", label: "Happy", icon: "😊" },
  content: { id: "content", label: "Content", icon: "🙂" },
  quiet: { id: "quiet", label: "Quiet", icon: "🌙" },
  sleepy: { id: "sleepy", label: "Sleepy", icon: "😴" },
});

function numberOr(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max, fallback = min) {
  return Math.min(max, Math.max(min, numberOr(value, fallback)));
}

export function localDayKey(now = Date.now()) {
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
  if (!raw || raw.day !== day) return { day, bondEarned: 0, actionCounts: {}, rewardKeys: {} };
  return {
    day,
    bondEarned: clamp(raw.bondEarned, 0, DAILY_BOND_CAP, 0),
    actionCounts: raw.actionCounts && typeof raw.actionCounts === "object" ? { ...raw.actionCounts } : {},
    rewardKeys: raw.rewardKeys && typeof raw.rewardKeys === "object" ? { ...raw.rewardKeys } : {},
  };
}

function normalizeLedger(raw) {
  if (!raw || typeof raw !== "object") return {};
  const entries = Object.entries(raw)
    .filter(([key]) => key)
    .map(([key, value]) => [key, Math.max(1, numberOr(value, 1))])
    .sort((a, b) => a[1] - b[1]);
  return Object.fromEntries(entries.slice(-MAX_REWARD_LEDGER));
}

function recoverEnergy(care, now) {
  const current = clamp(care.energy, 0, MAX_ENERGY, MAX_ENERGY);
  let last = Math.max(0, numberOr(care.lastEnergyUpdateAt, now)) || now;
  if (current >= MAX_ENERGY) return { ...care, energy: MAX_ENERGY, lastEnergyUpdateAt: now };
  const elapsed = Math.max(0, now - last);
  const recovered = Math.floor(elapsed / ENERGY_TICK_MS);
  if (recovered <= 0) return { ...care, energy: current, lastEnergyUpdateAt: last };
  const energy = Math.min(MAX_ENERGY, current + recovered);
  last += recovered * ENERGY_TICK_MS;
  if (energy >= MAX_ENERGY) last = now;
  return { ...care, energy, lastEnergyUpdateAt: last };
}

function normalizeCare(raw, now) {
  const source = raw && typeof raw === "object" ? raw : {};
  let care = {
    version: CARE_VERSION,
    bond: clamp(source.bond, 0, MAX_BOND, 0),
    energy: source.energy == null ? MAX_ENERGY : clamp(source.energy, 0, MAX_ENERGY, MAX_ENERGY),
    mood: source.mood == null ? 65 : clamp(source.mood, 0, MAX_MOOD, 65),
    lastEnergyUpdateAt: Math.max(0, numberOr(source.lastEnergyUpdateAt, now)) || now,
    lastInteractionAt: Math.max(0, numberOr(source.lastInteractionAt, 0)),
    lastPositiveAt: Math.max(0, numberOr(source.lastPositiveAt, 0)),
    lastAction: String(source.lastAction || ""),
    daily: normalizeDaily(source.daily, now),
    rewardLedger: normalizeLedger(source.rewardLedger),
  };
  care = recoverEnergy(care, now);
  return care;
}

function currentSpecies(raw) {
  return String(raw?.species || "moss-hornling");
}

function normalizePet(raw, now = Date.now()) {
  const species = currentSpecies(raw);
  const rawMap = raw?.careByPet && typeof raw.careByPet === "object" ? raw.careByPet : {};
  const hasMappedCare = Object.keys(rawMap).length > 0;
  const source = rawMap[species] ?? (!hasMappedCare ? raw?.care : null);
  const care = normalizeCare(source, now);
  return {
    ...raw,
    species,
    careByPet: { ...rawMap, [species]: care },
    care,
  };
}

function sameCareState(a, b) {
  return JSON.stringify({ care: a?.care, careByPet: a?.careByPet }) === JSON.stringify({ care: b?.care, careByPet: b?.careByPet });
}

function withSelectedCare(pet, care) {
  const species = currentSpecies(pet);
  return { ...pet, care, careByPet: { ...(pet.careByPet || {}), [species]: care } };
}

function writePet(next, detail = {}) {
  const normalized = normalizePet(next, Date.now());
  localStorage.setItem(PET_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("scholar:pet-care-changed", { detail: { pet: normalized, ...detail } }));
  window.dispatchEvent(new CustomEvent("scholar:pet-changed", { detail: normalized }));
  return normalized;
}

export function getPetSnapshot({ persistRecovery = true, now = Date.now() } = {}) {
  const raw = readRawPet();
  const next = normalizePet(raw, now);
  if (persistRecovery && !sameCareState(raw, next)) {
    try { localStorage.setItem(PET_KEY, JSON.stringify(next)); } catch {}
  }
  return next;
}

export function getBondTier(bond) {
  const value = clamp(bond, 0, MAX_BOND, 0);
  return BOND_TIERS.find((tier) => value >= tier.min && value <= tier.max) || BOND_TIERS[0];
}

export function getPetMood(petOrCare) {
  const care = petOrCare?.care || petOrCare || {};
  const energy = clamp(care.energy, 0, MAX_ENERGY, MAX_ENERGY);
  const mood = clamp(care.mood, 0, MAX_MOOD, 65);
  if (energy <= 20) return MOODS.sleepy;
  if (mood >= 90 && energy >= 45) return MOODS.glowing;
  if (mood >= 80) return MOODS.excited;
  if (mood >= 60) return MOODS.happy;
  if (mood >= 40) return MOODS.content;
  return MOODS.quiet;
}

export function getNextBondUnlock(bond) {
  const value = clamp(bond, 0, MAX_BOND, 0);
  const action = Object.values(PET_ACTIONS).filter((row) => row.requiredBond > value).sort((a, b) => a.requiredBond - b.requiredBond)[0];
  if (action) return { type: "action", label: action.label, requiredBond: action.requiredBond };
  if (value < 90) return { type: "tier", label: "Soul Bond", requiredBond: 90 };
  if (value < 100) return { type: "tier", label: "Max Bond", requiredBond: 100 };
  return null;
}

export function getActionEffectiveness(action, energy) {
  if (!action?.tiredSensitive) return 1;
  const value = clamp(energy, 0, MAX_ENERGY, MAX_ENERGY);
  if (value < 30) return 0.5;
  if (value < 50) return 0.75;
  return 1;
}

function pruneLedger(ledger) {
  const entries = Object.entries(ledger || {}).sort((a, b) => a[1] - b[1]);
  return Object.fromEntries(entries.slice(-MAX_REWARD_LEDGER));
}

function awardBondOnPet(pet, amount, options, now) {
  const { key: rewardKey, reason, moodDelta = 0, bypassDailyCap = false } = options;
  const care = pet.care;
  const daily = normalizeDaily(care.daily, now);
  const key = String(rewardKey || reason || `reward:${now}`);
  const ledger = normalizeLedger(care.rewardLedger);
  if (ledger[key]) return { pet, amount: 0, moodGained: 0, duplicate: true, capped: false };

  const requested = Math.max(0, numberOr(amount, 0));
  const remainingDaily = bypassDailyCap ? requested : Math.max(0, DAILY_BOND_CAP - daily.bondEarned);
  const remainingBond = Math.max(0, MAX_BOND - care.bond);
  const granted = Math.max(0, Math.min(requested, remainingDaily, remainingBond));
  const moodGained = Math.max(0, Math.min(numberOr(moodDelta, 0), MAX_MOOD - care.mood));
  const nextDaily = bypassDailyCap ? daily : { ...daily, bondEarned: daily.bondEarned + granted };
  const nextCare = {
    ...care,
    bond: care.bond + granted,
    mood: care.mood + moodGained,
    lastPositiveAt: granted > 0 || moodGained > 0 ? now : care.lastPositiveAt,
    daily: nextDaily,
    rewardLedger: pruneLedger({ ...ledger, [key]: now || 1 }),
  };
  return {
    pet: withSelectedCare(pet, nextCare),
    amount: granted,
    moodGained,
    duplicate: false,
    capped: granted < requested,
    reason,
  };
}

export function awardBond(amount, { key, reason = "Bond reward", moodDelta = 0, bypassDailyCap = false, now = Date.now() } = {}) {
  const pet = getPetSnapshot({ persistRecovery: false, now });
  const result = awardBondOnPet(pet, amount, { key, reason, moodDelta, bypassDailyCap }, now);
  if (!result.duplicate) {
    writePet(result.pet, { type: "bond", amount: result.amount, moodGained: result.moodGained, reason, capped: result.capped });
  }
  return result;
}

export function performPetAction(actionId, { now = Date.now() } = {}) {
  const action = PET_ACTIONS[actionId];
  if (!action) return { ok: false, code: "unknown-action", message: "That interaction is not available." };

  const pet = getPetSnapshot({ persistRecovery: false, now });
  const care = pet.care;
  const daily = normalizeDaily(care.daily, now);
  const used = Math.max(0, numberOr(daily.actionCounts[action.id], 0));
  if (care.bond < action.requiredBond) return { ok: false, code: "locked", action, message: `Reach ${action.requiredBond} Bond to unlock ${action.label}.`, pet };
  if (used >= action.dailyLimit) return { ok: false, code: "daily-limit", action, message: `${action.label} has already given its Bond reward for today.`, pet };
  if (care.energy < action.energyCost) return { ok: false, code: "energy", action, message: `Not enough Energy. ${action.label} needs ${action.energyCost}.`, pet };

  const effectiveness = getActionEffectiveness(action, care.energy);
  const adjustedBond = action.bondGain > 0 ? Math.max(1, Math.floor(action.bondGain * effectiveness)) : 0;
  const adjustedMood = Math.max(1, Math.round(action.moodGain * effectiveness));
  const energy = clamp(care.energy - action.energyCost + action.energyGain, 0, MAX_ENERGY, care.energy);
  const touchedCare = {
    ...care,
    energy,
    mood: clamp(care.mood + adjustedMood, 0, MAX_MOOD, care.mood),
    lastEnergyUpdateAt: energy >= MAX_ENERGY ? now : care.lastEnergyUpdateAt,
    lastInteractionAt: now,
    lastPositiveAt: now,
    lastAction: action.id,
    daily: { ...daily, actionCounts: { ...daily.actionCounts, [action.id]: used + 1 } },
  };
  const touched = withSelectedCare(pet, touchedCare);
  const rewardKey = `action:${daily.day}:${action.id}:${used + 1}`;
  const rewarded = awardBondOnPet(touched, adjustedBond, { key: rewardKey, reason: action.label, moodDelta: 0, bypassDailyCap: false }, now);
  const next = rewarded.pet;
  writePet(next, { type: "action", action: action.id, amount: rewarded.amount, moodGained: adjustedMood, energyCost: action.energyCost, energyGain: action.energyGain, effectiveness, capped: rewarded.capped });

  const energyText = action.energyCost ? ` −${action.energyCost} Energy` : action.energyGain ? ` +${action.energyGain} Energy` : "";
  const bondText = rewarded.amount > 0 ? ` +${rewarded.amount} Bond` : "";
  const tiredText = effectiveness < 1 ? ` · tired effect ${Math.round(effectiveness * 100)}%` : "";
  const glowText = next.care.mood >= 90 && next.care.energy > 20 ? " ✨ Your companion is glowing." : "";
  return { ok: true, code: "ok", action, bondGained: rewarded.amount, moodGained: adjustedMood, energy, effectiveness, pet: next, message: `${action.label}.${bondText}${energyText}${tiredText}${glowText}`.trim() };
}

export function getCareSummary(options = {}) {
  const now = options.now ?? Date.now();
  const pet = getPetSnapshot({ persistRecovery: options.persistRecovery !== false, now });
  const mood = getPetMood(pet);
  const tier = getBondTier(pet.care.bond);
  const nextUnlock = getNextBondUnlock(pet.care.bond);
  const dailyRemaining = Math.max(0, DAILY_BOND_CAP - pet.care.daily.bondEarned);
  return { pet, care: pet.care, mood, tier, nextUnlock, dailyRemaining, energyRegenPerHour: ENERGY_REGEN_PER_HOUR, energyTickMinutes: 60 / ENERGY_REGEN_PER_HOUR };
}

export { PET_KEY };
