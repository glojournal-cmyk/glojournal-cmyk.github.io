// Read-only inspection of a JSON file selected from iPad Files/Downloads.
// No localStorage writes, imports, downloads, or network requests.
import {inspectPetWalletBackup, PET_WALLET_KEY} from "./pet-wallet-backup-20261030.js";
const record=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
const arr=x=>Array.isArray(x)?x:[];
const countTrue=x=>record(x)?Object.values(x).filter(v=>v===true).length:0;

export function auditBackupFile(raw,storage=null){
  let backup;
  try{backup=JSON.parse(raw)}
  catch{return {status:"invalid",message:"Invalid JSON. No device data changed.",facts:[]}};
  if(!record(backup)||backup.app!=="lux-scholar-garden")
    return {status:"invalid",message:"Not a Scholar Garden backup. No device data changed.",facts:[]};
  if(backup.type==="pet-wallet-diagnostic"){
    const pet=backup.petCompanion;
    if(!record(pet))return {status:"invalid",message:"Diagnostic wallet is missing or unreadable.",facts:[]};
    const rawPet=backup.petWalletStorageRaw;
    if(typeof rawPet!=="string")
      return {status:"warning",message:"Pet diagnostic snapshot found, but the original wallet bytes are missing.",facts:[]};
    let parsed;
    try{parsed=JSON.parse(rawPet)}catch{return {status:"invalid",message:"Pet diagnostic wallet text is invalid JSON.",facts:[]}}
    if(!record(parsed)||JSON.stringify(parsed)!==JSON.stringify(pet))
      return {status:"invalid",message:"Pet diagnostic JSON does not match its raw wallet text.",facts:[]};
    return {status:"pet-diagnostic",message:"Pet wallet diagnostic only; it is NOT a complete Scholar learning backup.",facts:[
      ["MP",Number.isFinite(pet.masteryPoints)?pet.masteryPoints:"not recorded"],
      ["Pet levels",Object.keys(record(pet.petLevels)?pet.petLevels:{}).length],
      ["Secret pets unlocked",countTrue(pet.unlockedSecrets)],
      ["MP transactions",arr(pet.mpTransactions).length]
    ]};
  }
  if(!record(backup.state))return {status:"invalid",message:"Scholar learning state is missing. No device data changed.",facts:[]};
  const s=backup.state;
  const tasks=arr(s.daily);
  const completeTasks=tasks.filter(t=>Number(t?.target)>0 &&
    (t?.done===true||Number(t.progress)>=Number(t.target))).length;
  const hasHistory=record(s.dailyLog)&&record(s.dailyVocabByDay)&&
    record(s.dailyCompleteAwarded)&&Array.isArray(s.formalAttemptLog);
  const manifest=backup.recent30Days;
  const covers30=record(manifest)&&manifest.periodDays===30&&
    arr(manifest.days).length===30&&manifest.through===s.today;
  const datedRows=record(s.dailyLog)?Object.keys(s.dailyLog).length:0;
  const recoveryDays=record(s.recoveryVocabByDay)?
    Object.keys(s.recoveryVocabByDay).length:0;
  const recoveries=record(s.recoveryAwarded)?Object.keys(s.recoveryAwarded).length:0;
  const facts=[
    ["Scholar XP",Number.isFinite(s.xp)?s.xp:"invalid"],
    ["Study date",typeof s.today==="string"?s.today:"missing"],
    ["Daily tasks",tasks.length+" ("+completeTasks+" complete)"],
    ["Saved dated records",datedRows],
    ["Formal answer history",arr(s.formalAttemptLog).length],
    ["Recovery days",recoveryDays],
    ["Recovery award records",recoveries],
    ["Owned outfits",arr(s.unlockedOutfits).length],
    ["Owned backgrounds",arr(s.unlockedScenes).length],
    ["Collectibles",arr(s.collectibles).length],
    ["Games saved",record(s.games)?Object.keys(s.games).length:0],
    ["30-day manifest",covers30?"present":"missing/partial"]
  ];
  const warnings=[];
  if(!Number.isFinite(s.xp)||s.xp<0)warnings.push("XP is invalid");
  if(tasks.length!==10||new Set(tasks.map(t=>t?.id)).size!==10)
    warnings.push("current Daily Tasks are not the complete 10-task plan");
  if(!hasHistory)warnings.push("dated learning or answer proof is incomplete");
  if(!covers30)warnings.push("full 30-calendar-day audit manifest is missing");
  try{
    const pet=inspectPetWalletBackup(backup,storage);
    if(pet.status==="absent"||pet.status==="legacy"){
      facts.push(["Lossless Pet wallet","not included"]);
      warnings.push("this JSON cannot guarantee Pet MP, levels and secret-pet recovery");
    }else{
      const p=pet.incoming;
      facts.push(["Lossless Pet wallet","included"],
        ["Pet MP",Number.isFinite(p.masteryPoints)?p.masteryPoints:"not recorded"],
        ["Pet levels",Object.keys(record(p.petLevels)?p.petLevels:{}).length],
        ["Secret pets unlocked",countTrue(p.unlockedSecrets)],
        ["MP transactions",arr(p.mpTransactions).length]);
      if(pet.status==="conflict")warnings.push("a different Pet wallet already exists on this device; import must NOT overwrite it");
      if(pet.status==="unavailable")warnings.push("current device Pet wallet could not be compared");
    }
  }catch(error){
    return {status:"invalid",message:"Pet wallet contents cannot be validated: "+error.message+". Nothing changed.",facts};
  }
  return {status:warnings.length?"warning":"complete",
    message:warnings.length?"Backup checked, but limitations: "+warnings.join("; ")+".": 
      "Backup structure verified: 10 Daily Tasks, dated history, 30-day manifest and lossless Pet wallet are present. Files storage and actual restore still need separate confirmation.",
    facts};
}
