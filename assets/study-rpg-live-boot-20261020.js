/* Study RPG production route bridge. No learning state or persistence writes.
 * Installed on all App entry pages, so Pet/Play/Garden/Scholar returns to Study
 * always restore the integrated classroom. ?studyRpgPreview=0 is a native fallback.
 */
(function () {
  'use strict';
  if (window.__luxStudyRpgBootInstalled) return;
  window.__luxStudyRpgBootInstalled = true;
  let loading = false;
  function showStudy() {
    if (new URLSearchParams(location.search).get('studyRpgPreview') === '0') return;
    if (!/^\/study\/?$/.test(location.pathname)) return;
    if (loading || window.__luxStudyRpgIntegrated) return;
    loading = true;
    import('/assets/study-rpg-integrated-20261019.js?v=20261023-decor-singleton1&uxfix=20261022-priority-ux1')
      .catch(error => {
        loading = false;
        console.warn('Study classroom unavailable; native Study remains usable', error);
      });
  }
  for (const key of ['pushState', 'replaceState']) {
    const before = history[key];
    history[key] = function (...args) {
      const value = before.apply(this, args);
      showStudy();
      return value;
    };
  }
  // Native Home links point to /study (layout only). Follow the complete
  // /study/ document instead of the SPA's layout route, avoiding navigation
  // loops and loading exactly the same screen verified by iPad WebKit.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    let url;
    try { url = new URL(anchor.href, location.href); } catch { return; }
    if (url.origin !== location.origin || !/^\/study\/?$/.test(url.pathname)) return;
    if (new URLSearchParams(url.search).get('studyRpgPreview') === '0') return;
    // Enter the complete Study document, not a React layout-only SPA route.
    // Already on Study? Keep its local year selector and avoid a self reload.
    if (/^\/study\/?$/.test(location.pathname)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign('/study/' + url.search + url.hash);
  }, true);
  // Home's live RPG rail can replace its link between pointerup and click.
  // Resolve the real pointer release on that rail before React rerenders.
  document.addEventListener('pointerup', event => {
    if (event.button !== 0 || !/^\/$/.test(location.pathname)) return;
    const anchor=event.target?.closest?.('#lux-rpg-live-home .rpg-nav-live a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    let url;
    try { url=new URL(anchor.href,location.href); } catch { return; }
    if (url.origin !== location.origin || !/^\/study\/?$/.test(url.pathname)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign('/study/' + url.search + url.hash);
  }, true);
  window.addEventListener('popstate', showStudy);
  window.addEventListener('pageshow', showStudy);
  window.addEventListener('lux:app-ready', showStudy);
  showStudy();
}());
