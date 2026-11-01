// Lossless Pet companion wallet transport for Scholar JSON backups.
// Does not merge or manufacture MP; it never overwrites an existing wallet.
export const PET_WALLET_KEY = "lux-pet-companion-v1";
const record = x => !!x && typeof x === "object" && !Array.isArray(x);
function walletValid(value) {
  if (!record(value)) return false;
  if (value.masteryPoints !== undefined &&
      (!Number.isFinite(value.masteryPoints) || value.masteryPoints < 0)) return false;
  for (const key of ["petLevels","unlockedSecrets","mpLedger","careByPet"]) {
    if (value[key] !== undefined && !record(value[key])) return false;
  }
  if (value.mpTransactions !== undefined && !Array.isArray(value.mpTransactions)) return false;
  if (value.petLevels && Object.values(value.petLevels).some(level =>
      !Number.isInteger(level) || level < 1 || level > 10)) return false;
  return true;
}
const storageOrNull = storage => storage === undefined ?
  (typeof localStorage === "undefined" ? null : localStorage) : storage;

function checkRaw(raw, source) {
  let decoded;
  try { decoded = JSON.parse(raw); }
  catch { throw Error(source + " is not valid JSON. Nothing was overwritten."); }
  if (!walletValid(decoded)) throw Error(source + " is structurally invalid. Nothing was overwritten.");
  return decoded;
}
// Full Scholar export may be used after PWA reinstall. Carry a *byte-for-byte*
// wallet copy, not merely the Scholar companion preview or a calculated MP.
export function includePetWalletBackup(payload, storage) {
  const disk = storageOrNull(storage);
  if (!record(payload) || payload.app !== "lux-scholar-garden")
    throw Error("Not a Scholar Garden backup.");
  if (!disk) return {...payload,petWalletBackup:null};
  const raw = disk.getItem(PET_WALLET_KEY);
  if (raw === null) return {...payload,petWalletBackup:null};
  checkRaw(raw,"Live Pet wallet");
  return {...payload,petWalletBackup:{version:1,storageKey:PET_WALLET_KEY,raw}};
}
export function inspectPetWalletBackup(payload, storage) {
  if (!record(payload) || payload.app !== "lux-scholar-garden")
    throw Error("Not a Scholar Garden backup.");
  if (payload.petWalletBackup === undefined) return {status:"legacy"};
  if (payload.petWalletBackup === null) return {status:"absent"};
  const item=payload.petWalletBackup;
  if (!record(item) || item.version !== 1 || item.storageKey !== PET_WALLET_KEY ||
      typeof item.raw !== "string" || item.raw.length === 0)
    throw Error("Incoming Pet wallet backup format is invalid. Nothing was overwritten.");
  const incoming=checkRaw(item.raw,"Incoming Pet wallet");
  const disk=storageOrNull(storage);
  if (!disk) return {status:"unavailable",incoming};
  const currentRaw=disk.getItem(PET_WALLET_KEY);
  if (currentRaw === null) return {status:"install",incoming};
  // Corrupt current data is valuable evidence; do not overwrite it.
  checkRaw(currentRaw,"Existing Pet wallet");
  if (currentRaw === item.raw) return {status:"identical",incoming};
  return {status:"conflict",incoming};
}
