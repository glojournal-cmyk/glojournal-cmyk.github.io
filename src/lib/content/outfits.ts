import { gardenStage, levelFromXp } from "@/lib/xp";

export const DEFAULT_SCHOLAR_NAME = "Scholar";

export type OutfitId = "day" | "library" | "winter" | "spring" | "latin" | "rose" | "pe" | "pinafore" | "blazer" | "winter-coat" | "denim" | "track" | "summer" | "hoodie" | "beret";

export type Outfit = {
  id: OutfitId;
  name: string;
  blurb: string;
  art: string;
  closet: string;
  need: string;
  category: "Uniform" | "Study" | "Seasonal" | "Latin" | "French" | "Achievement";
};

export const OUTFITS: Outfit[] = [
  {
    id: "day",
    name: "Day Uniform",
    blurb: "Teal pullover, striped blouse, charcoal pleats.",
    art: "/art/outfits/day.jpg?v=plain",
    closet: "/art/closet/day.jpg",
    need: "Starter outfit",
    category: "Uniform",
  },
  {
    id: "library",
    name: "Cardigan",
    blurb: "The matching teal school cardigan.",
    art: "/art/outfits/library.jpg?v=plain",
    closet: "/art/closet/library.jpg",
    need: "Earn 60 Scholar XP",
    category: "Uniform",
  },
  {
    id: "winter",
    name: "Winter Kit",
    blurb: "Day uniform, autumn light, black tights.",
    art: "/art/outfits/winter.jpg?v=plain",
    closet: "/art/closet/winter.jpg",
    need: "Reach Scholar Level 8",
    category: "Seasonal",
  },
  {
    id: "spring",
    name: "Summer Blouse",
    blurb: "Short-sleeve stripes, no jumper.",
    art: "/art/outfits/spring.jpg",
    closet: "/art/closet/spring.jpg",
    need: "Grow the garden to Courtyard",
    category: "Seasonal",
  },
  {
    id: "latin",
    name: "Prize Day",
    blurb: "Rosette, medal, prize-day kit.",
    art: "/art/outfits/latin.jpg?v=plain",
    closet: "/art/closet/latin.jpg",
    need: "Master 5 Latin topics",
    category: "Latin",
  },
  {
    id: "rose",
    name: "Storm Jacket",
    blurb: "Games jacket over the PE kit.",
    art: "/art/outfits/rose.jpg",
    closet: "/art/closet/rose.jpg",
    need: "Complete two PE circuits",
    category: "Achievement",
  },
  {
    id: "pe",
    name: "PE Kit",
    blurb: "White polo, cyan panels, black skort.",
    art: "/art/outfits/pe.jpg?v=plain",
    closet: "/art/closet/pe.jpg",
    need: "Complete one PE circuit",
    category: "Achievement",
  },
  {
    id: "pinafore",
    name: "Pinafore",
    blurb: "A polished school pinafore look.",
    art: "/art/wardrobe/pinafore.png",
    closet: "/art/closet/pinafore.jpg",
    need: "Wardrobe look",
    category: "Uniform",
  },
  {
    id: "blazer",
    name: "School Blazer",
    blurb: "A smart blazer for a formal school look.",
    art: "/art/wardrobe/blazer.png",
    closet: "/art/closet/blazer.jpg",
    need: "Wardrobe look",
    category: "Uniform",
  },
  {
    id: "winter-coat",
    name: "Winter Coat",
    blurb: "A warm winter look for colder days.",
    art: "/art/wardrobe/winter-coat.png",
    closet: "/art/closet/winter-coat.jpg",
    need: "Wardrobe look",
    category: "Seasonal",
  },
  {
    id: "denim",
    name: "Denim Jacket",
    blurb: "A relaxed denim layer.",
    art: "/art/wardrobe/denim.png",
    closet: "/art/closet/denim.jpg",
    need: "Wardrobe look",
    category: "Seasonal",
  },
  {
    id: "track",
    name: "Track Jacket",
    blurb: "A sporty track look.",
    art: "/art/wardrobe/track.png",
    closet: "/art/closet/track.jpg",
    need: "Wardrobe look",
    category: "Achievement",
  },
  {
    id: "summer",
    name: "Summer Look",
    blurb: "A light outfit for warmer days.",
    art: "/art/wardrobe/summer.png",
    closet: "/art/closet/summer.jpg",
    need: "Wardrobe look",
    category: "Seasonal",
  },
  {
    id: "hoodie",
    name: "Hoodie",
    blurb: "A comfortable casual hoodie.",
    art: "/art/wardrobe/hoodie.png",
    closet: "/art/closet/hoodie.jpg",
    need: "Wardrobe look",
    category: "Study",
  },
  {
    id: "beret",
    name: "French Beret",
    blurb: "A French-inspired beret look.",
    art: "/art/wardrobe/beret.png",
    closet: "/art/closet/beret.jpg",
    need: "Wardrobe look",
    category: "French",
  },

];


export const EXTRA_WARDROBE_LOOK_IDS: OutfitId[] = [
  "pinafore",
  "blazer",
  "winter-coat",
  "denim",
  "track",
  "summer",
  "hoodie",
  "beret",
];

export function isExtraWardrobeLook(id: string): id is OutfitId {
  return EXTRA_WARDROBE_LOOK_IDS.includes(id as OutfitId);
}

export type UnlockContext = {
  xp: number;
  peSessions: number;
  studyDays: number;
  medals: number;
  gameSessions: number;
  latinTopics?: number;
  writingDone?: number;
};

export function isOutfitUnlocked(id: OutfitId, ctx: UnlockContext) {
  const level = levelFromXp(ctx.xp).level;
  const garden = gardenStage(ctx.xp);
  switch (id) {
    case "day":
      return true;
    case "library":
      return ctx.xp >= 60;
    case "pe":
      return ctx.peSessions >= 1;
    case "rose":
      return ctx.peSessions >= 2;
    case "winter":
      return level >= 8 || ctx.xp >= 400;
    case "spring":
      return garden >= 2;
    case "latin":
      return (ctx.latinTopics ?? 0) >= 5 || ctx.xp >= 250;
  }
}

export function outfitById(id: string) {
  return OUTFITS.find((item) => item.id === id) ?? OUTFITS[0];
}

export function nextOutfit(unlocked: string[], ctx: UnlockContext) {
  return OUTFITS.find((item) => !unlocked.includes(item.id) && !isOutfitUnlocked(item.id, ctx)) ?? null;
}

export function scholarLine(opts: { hour: number; dailyDone: number; dailyTotal: number; peDone: boolean }) {
  if (opts.dailyDone >= opts.dailyTotal) {
    return "The day’s work is done. The garden looks brighter already.";
  }
  if (opts.hour < 12) return "Small steps today, a brighter tomorrow.";
  if (opts.hour < 17) return "Discipline today, freedom tomorrow.";
  return "One more page, then rest. Progress looks good on you.";
}

export function statFill(n: number) {
  return Math.max(3, Math.min(100, Math.round(n)));
}

export type LookSlot = "top" | "bottom" | "outer" | "extra";
export type TopId = "jumper" | "cardigan" | "blouse" | "polo";
export type BottomId = "skirt" | "skort";
export type OuterId = "none" | "jacket";
export type ExtraId = "none" | "tights" | "rosette";

export type ScholarLook = {
  top: TopId;
  bottom: BottomId;
  outer: OuterId;
  extra: ExtraId;
};

export const DEFAULT_LOOK: ScholarLook = { top: "jumper", bottom: "skirt", outer: "none", extra: "tights" };

export type Piece = {
  slot: LookSlot;
  id: string;
  name: string;
  closet: string;
  need: string;
  outfit: OutfitId | "none";
};

export const PIECES: Piece[] = [
  { slot: "top", id: "jumper", name: "Teal jumper", closet: "/art/closet/day.jpg", need: "Starter", outfit: "day" },
  { slot: "top", id: "cardigan", name: "Cardigan", closet: "/art/closet/library.jpg", need: "Earn 60 Scholar XP", outfit: "library" },
  { slot: "top", id: "blouse", name: "Summer blouse", closet: "/art/closet/spring.jpg", need: "Grow the garden to Courtyard", outfit: "spring" },
  { slot: "top", id: "polo", name: "PE polo", closet: "/art/closet/pe.jpg", need: "Complete one PE circuit", outfit: "pe" },
  { slot: "bottom", id: "skirt", name: "Charcoal skirt", closet: "/art/closet/day.jpg", need: "Starter", outfit: "day" },
  { slot: "bottom", id: "skort", name: "PE skort", closet: "/art/closet/pe.jpg", need: "Complete one PE circuit", outfit: "pe" },
  { slot: "outer", id: "none", name: "No jacket", closet: "/art/closet/day.jpg", need: "Starter", outfit: "none" },
  { slot: "outer", id: "jacket", name: "Storm jacket", closet: "/art/closet/rose.jpg", need: "Complete two PE circuits", outfit: "rose" },
  { slot: "extra", id: "none", name: "No extra", closet: "/art/closet/spring.jpg", need: "Starter", outfit: "none" },
  { slot: "extra", id: "tights", name: "Black tights", closet: "/art/closet/winter.jpg", need: "Starter", outfit: "day" },
  { slot: "extra", id: "rosette", name: "Prize rosette", closet: "/art/closet/latin.jpg", need: "Master 5 Latin topics", outfit: "latin" },
];

export function isPieceUnlocked(piece: Piece, unlockedOutfits: string[]) {
  if (piece.outfit === "none") return true;
  if (piece.id === "tights") return true;
  return unlockedOutfits.includes(piece.outfit);
}

export function artForLook(look: ScholarLook) {
  if (look.outer === "jacket" && look.bottom === "skort") return "/art/outfits/rose.jpg";
  if (look.outer === "jacket") return "/art/outfits/mix-jacket.jpg";
  if (look.extra === "rosette") return "/art/outfits/latin.jpg?v=plain";
  if (look.top === "polo") return "/art/outfits/pe.jpg?v=plain";
  if (look.top === "jumper" && look.bottom === "skort") return "/art/outfits/mix-sport.jpg";
  if (look.top === "cardigan" && look.bottom === "skort") return "/art/outfits/mix-card-pe.jpg";
  if (look.top === "cardigan") return "/art/outfits/library.jpg?v=plain";
  if (look.top === "blouse" && look.extra === "tights") return "/art/outfits/mix-tights.jpg";
  if (look.top === "blouse") return "/art/outfits/spring.jpg";
  if (look.extra === "tights") return "/art/outfits/winter.jpg?v=plain";
  return "/art/outfits/day.jpg?v=plain";
}

export function lookFromOutfit(id: OutfitId): ScholarLook {
  switch (id) {
    case "library":
      return { top: "cardigan", bottom: "skirt", outer: "none", extra: "tights" };
    case "spring":
      return { top: "blouse", bottom: "skirt", outer: "none", extra: "none" };
    case "pe":
      return { top: "polo", bottom: "skort", outer: "none", extra: "none" };
    case "rose":
      return { top: "polo", bottom: "skort", outer: "jacket", extra: "none" };
    case "latin":
      return { top: "jumper", bottom: "skirt", outer: "none", extra: "rosette" };
    case "winter":
      return { top: "jumper", bottom: "skirt", outer: "none", extra: "tights" };
    default:
      return { ...DEFAULT_LOOK };
  }
}

export function lookLabel(look: ScholarLook) {
  const top = PIECES.find((p) => p.id === look.top)?.name ?? look.top;
  const bottom = PIECES.find((p) => p.id === look.bottom)?.name ?? look.bottom;
  const bits = [top, bottom];
  if (look.outer === "jacket") bits.push("storm jacket");
  if (look.extra === "rosette") bits.push("rosette");
  if (look.extra === "tights") bits.push("tights");
  return bits.join(" · ");
}

