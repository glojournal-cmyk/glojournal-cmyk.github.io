import {clampPetLevel} from './pet-evolution-config-20261012.js?ux=20261013-corrections2';
// Each evolution stage uses a complete transparent sprite, never an enlarged sheet cell.
const species = new Set(['antler-bean','moss-hornling','inkling','pebble-wisp','moon-puff','mothling','bloom-snail','velvet-batling','sprig-dragon','star-toadlet','snow-owl','night-spider']);
export function petArtUrl(id, level = 1) {
  const safe = species.has(id) ? id : 'moss-hornling';
  const stage = clampPetLevel(level);
  // Sprig Dragon's persistent species ID is retained to preserve MP and level records.
  if(safe==='sprig-dragon') return `/pet/art-unicorn-crusader-approved-20261018/level-${stage}.png?v=20261019-unicorn2`;
  // Preserve the mothling storage ID while replacing only its visual and public-facing identity.
  if(safe==='mothling') return '/pet/art-starling-fox-20261018/level-'+stage+'.png?v=20261018-starling1';
  // The velvet-batling species ID remains unchanged for saved MP, unlocks and selection.
  if(safe==='velvet-batling') return '/pet/art-shadow-wolf-20261018/level-'+stage+'.png?v=20261018-shadow-wolf1';
  // Keep bloom-snail as the persistent storage identity to preserve player XP, levels, and history.
  if(safe==='bloom-snail') return '/pet/art-starlight-kitten-20261018/level-'+stage+'.png?v=20261018-starlight-kitten1';
  // Inkling: all ten stages are individually approved full-body transparent sprites.
  if(safe==='inkling') return `/pet/art-inkling-all10-20261018/level-${stage}.png?v=20261018-inkling-all10a`;
  // Nocturne Spider LV1–4 remain on their original artwork.
  if(safe==='night-spider' && stage>=5) return `/pet/art-nocturne-spider-20261018/level-${stage}.png?v=20261018-nocturne-spider1`;
  // Moonveil Owl: the original LV1–LV4 sprites remain untouched.
  if(safe==='snow-owl' && stage>=5) return `/pet/art-moonveil-owl-20261017/level-${stage}.png?v=20261017-moonveil-owl1`;
  if(safe==='antler-bean' && stage>=5) return `/pet/art-antler-bean-individual-20261017/level-${stage}.png?v=20261017-antler-individual4`;
  if(safe==='moss-hornling' && stage>=5) return `/pet/art-moss-hornling-20261017/level-${stage}.png?v=20261017-moss-fullbody1`;
  if(safe==='moon-puff' && stage>=5) return `/pet/art-moon-puff-20261013/level-${stage}.png?v=20261013-moon-fullbody1`;
  if(stage>5) return `/pet/art-level10-20261012/level-${stage}/${safe}.webp?v=${safe==='pebble-wisp'?'20261013-pebble-humanoid1':'20261013-spider-safe1'}`;
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
