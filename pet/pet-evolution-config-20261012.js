// One progression table shared by evolution, care, Home and reward goals.
export const MAX_PET_LEVEL = 10;
export const EVOLUTION_COSTS = Object.freeze([50,90,140,200,280,380,500,650,850]);
export const STAGE_NAMES = Object.freeze(["Foundling","Curious Companion","Scholar Familiar","Garden Familiar","Mastery Companion","Awakened Companion","Radiant Guardian","Celestial Familiar","Mythic Companion","Eternal Guardian"]);
export function clampPetLevel(value){return Math.max(1,Math.min(MAX_PET_LEVEL,Math.floor(Number(value)||1)));}
export const ADVANCED_FORMS = Object.freeze({
 'moss-hornling':['Bloom-crowned keeper','Canopy spirit','Sunlit grove guardian','Mythic forest keeper','Eternal grove sovereign'],
 'antler-bean':['Crimson Cutthroat','Silent Fang','Nightshade Assassin','Eclipse Huntress','Baphomet Assassin Queen'],
 inkling:['Royal quill phoenix','Radiant ink guardian','Celestial ink phoenix','Mythic quill sovereign','Eternal midnight phoenix'],
 'pebble-wisp':['Opal orbit keeper','Radiant stone guardian','Celestial rune spirit','Mythic crystal keeper','Eternal constellation spirit'],
 'moon-puff':['Moonlit cloud keeper','Radiant lunar guardian','Celestial moon hare','Mythic cloud sovereign','Eternal moon guardian'],
 mothling:['Guardian Form','Spirit Walker','Half-Human Form','Celestial Archer','Starfall Archer'],
 'bloom-snail':['Celestial Lynx','Star Guardian','Spirit Walker','Moonborne Guardian','Astral Sovereign'],
 'velvet-batling':['Moonlight Sentinel','Celestial Wolf','Wolf Spirit Archer','Lunar Huntress','Moonshadow Archer'],
 'sprig-dragon':['Unicorn Maiden','Starlight Princess','Starshield Knight','Celestial Crusader','Eternal Shield Sovereign'],
 'star-toadlet':['Healer Disciple','Graceful Medic','Refined Priestess','Divine Supporter','Archon Healer'],
 'snow-owl':['Starlit guardian beast','Lunar scholarling','Moonwing knight','Nocturne spirit maiden','Eternal nocturne queen'],
 'night-spider':['Violet sentinel','Archive seeker','Lore weaver','Nocturne maiden','Eternal nocturne']
});
