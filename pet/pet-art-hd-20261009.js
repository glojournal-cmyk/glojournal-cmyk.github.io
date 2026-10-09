// Each evolution stage uses a complete transparent sprite, never an enlarged sheet cell.
const species = new Set(['antler-bean','moss-hornling','inkling','pebble-wisp','moon-puff','mothling','bloom-snail','velvet-batling','sprig-dragon','star-toadlet','snow-owl','night-spider']);
export function petArtUrl(id, level = 1) {
  const safe = species.has(id) ? id : 'moss-hornling';
  const stage = Math.max(1, Math.min(5, Math.floor(Number(level) || 1)));
  return `/pet/art-hd-20261009/level-${stage}/${safe}.webp?v=20261009-hd1`;
}
export function spriteStyle(id, level = 1) {
  return `background-image:url('${petArtUrl(id, level)}');background-size:contain;background-position:center;background-repeat:no-repeat;filter:url('/pet/pet-art-edge-20261009.svg#smooth')`;
}
export function applyPetSprite(el, id, level = 1) {
  el.style.backgroundImage = `url("${petArtUrl(id, level)}")`;
  el.style.backgroundSize = 'contain';
  el.style.backgroundPosition = 'center';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.filter = "url('/pet/pet-art-edge-20261009.svg#smooth')";
}
