// One progression table shared by evolution, care, Home and reward goals.
export const MAX_PET_LEVEL = 10;
export const EVOLUTION_COSTS = Object.freeze([50,90,140,200,280,380,500,650,850]);
export const STAGE_NAMES = Object.freeze(["Foundling","Curious Companion","Scholar Familiar","Garden Familiar","Mastery Companion","Awakened Companion","Radiant Guardian","Celestial Familiar","Mythic Companion","Eternal Guardian"]);
export function clampPetLevel(value){return Math.max(1,Math.min(MAX_PET_LEVEL,Math.floor(Number(value)||1)));}
export const ADVANCED_FORMS = Object.freeze({
 'moss-hornling':['Bloom-crowned keeper','Canopy spirit','Sunlit grove guardian','Mythic forest keeper','Eternal grove sovereign'],
 'antler-bean':['Golden antler keeper','Autumn guardian','Celestial woodland king','Mythic elk guardian','Eternal antler sovereign'],
 inkling:['Royal quill phoenix','Radiant ink guardian','Celestial ink phoenix','Mythic quill sovereign','Eternal midnight phoenix'],
 'pebble-wisp':['Opal orbit keeper','Radiant stone guardian','Celestial rune spirit','Mythic crystal keeper','Eternal constellation spirit'],
 'moon-puff':['Moonlit cloud keeper','Radiant lunar guardian','Celestial moon hare','Mythic cloud sovereign','Eternal moon guardian'],
 mothling:['Moon-silk keeper','Radiant wing guardian','Celestial silk monarch','Mythic lunar moth','Eternal lantern sovereign'],
 'bloom-snail':['Blossom palace keeper','Radiant garden guardian','Celestial greenhouse keeper','Mythic bloom sovereign','Eternal garden keeper'],
 'velvet-batling':['Moon-crowned sentinel','Radiant dusk guardian','Celestial night keeper','Mythic crescent sovereign','Eternal twilight guardian'],
 'sprig-dragon':['Crown-horn dragon','Radiant vine guardian','Celestial canopy dragon','Mythic forest dragon','Eternal verdant sovereign'],
 'star-toadlet':['Starlit marsh keeper','Radiant star guardian','Celestial toad sovereign','Mythic constellation keeper','Eternal star sovereign'],
 'snow-owl':['Moon-crowned owl','Radiant feather guardian','Celestial moonveil keeper','Mythic white-wing sovereign','Eternal moonveil guardian'],
 'night-spider':['Jewel-crowned weaver','Radiant web guardian','Celestial silver weaver','Mythic nocturne keeper','Eternal web sovereign']
});
