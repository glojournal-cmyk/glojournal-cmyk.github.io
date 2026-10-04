import {petNames} from './companion-goals-state-20261004.js';
export function spriteStyle(species, level = 1) {
  const safe = petNames[species] ? species : "moss-hornling";
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
    return `background-image:url('/pet/art-evolution-v2/${safe}.webp?v=20260926-evolution2');background-size:200% 200%;background-position:${position}`;
  }
  return `background-image:url('/pet/art-master/${safe}.png?v=20260926-evolution2')`;
}

