/* Home outfit display reconciliation. Read-only: never changes persistence or XP. */
import { A as outfits, C as store } from './index-BLVOhKhN.js?v=20261018-mastery2';
(function () {
  if (window.__luxHomeOutfitSyncInstalled) return;
  window.__luxHomeOutfitSyncInstalled = true;
  let queued = false;
  function sync() {
    if (location.pathname !== '/') return;
    const main = document.querySelector('main');
    if (!main) return;
    const id = store.getState()?.equippedOutfit || 'day';
    const look = outfits.find(o => o.id === id) || outfits.find(o => o.id === 'day');
    if (!look?.art) return;
    const hero = [...main.querySelectorAll('img')].find(img =>
      img.classList.contains('scholar-idle'));
    if (!hero) return;
    const current = new URL(hero.getAttribute('src') || '', location.href).href;
    const desired = new URL(look.art, location.href).href;
    if (current !== desired) hero.src = look.art;
    hero.alt = 'Scholar in ' + look.name;
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; sync(); });
  }
  store.subscribe(schedule);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('popstate', schedule);
  window.addEventListener('lux:app-ready', schedule);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });
  // React navigation/hydration can replace the hero node after a route change.
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {subtree:true, childList:true});
  schedule();
}());
