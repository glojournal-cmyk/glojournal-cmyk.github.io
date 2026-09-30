// One cover per game, shared by rendered cards and initial HTML.
export const GAME_COVERS = Object.freeze({
  "weekly-boss": "/art/scenes/scene-01.jpg",
  "error-hunter": "/art/games/error-hunter-20260930.jpg",
  "forma-forge": "/art/games/forma.jpg",
  "sentence-mosaic": "/art/games/mosaic.jpg",
  "case-locker": "/art/games/locker.jpg",
  "verbum-match": "/art/games/match.jpg",
  "manuscript": "/art/games/manuscript.jpg",
  "mot-match": "/art/games/mot-match-20260930.jpg",
  "phrase-mosaic": "/art/games/phrase-mosaic-20260930.jpg",
  "organelle-match": "/art/games/organelle.jpg",
  "element-match": "/art/games/element.jpg",
  "force-match": "/art/games/force.jpg",
  "word-match": "/art/games/word.jpg",
  "pe-circuit": "/art/outfits/pe.jpg"
});
export function gameCover(id) { return GAME_COVERS[id] || "/art/games/match.jpg"; }

function refreshCovers() {
  for (const link of document.querySelectorAll('a[href]')) {
    const path = new URL(link.getAttribute("href"), location.href).pathname;
    const id = path.match(/^\/play\/([^/]+)\/?$/)?.[1];
    if (!GAME_COVERS[id]) continue;
    for (const image of link.querySelectorAll("img")) {
      if (image.getAttribute("src") !== GAME_COVERS[id]) image.setAttribute("src", GAME_COVERS[id]);
    }
  }
}
if (typeof document !== "undefined") {
  let pending = false;
  const schedule = () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; refreshCovers(); });
  };
  new MutationObserver(schedule).observe(document.documentElement, {childList:true,subtree:true,attributes:true,attributeFilter:["src","href"]});
  refreshCovers();
}
