/* Study RPG production route bridge. No learning state or persistence writes.
 * Standalone module loads only on the Study directory, including client-side
 * navigation from the RPG Home; ?studyRpgPreview=0 is a safe legacy fallback.
 */
(function () {
  'use strict';
  if (window.__luxStudyRpgBootInstalled) return;
  window.__luxStudyRpgBootInstalled = true;
  let loading = false;
  function showStudy() {
    // The native SPA links to /study (the layout route), but the complete
    // Study Library is /study/ (index child route). Canonicalize with a real
    // navigation to preserve hydration and the complete native year selector.
    if (location.pathname === '/study') {
      const url = new URL(location.href);
      url.pathname = '/study/';
      location.replace(url.pathname + url.search + url.hash);
      return;
    }
    if (!/^\/study\/?$/.test(location.pathname)) return;
    if (new URLSearchParams(location.search).get('studyRpgPreview') === '0') return;
    if (loading || window.__luxStudyRpgIntegrated) return;
    loading = true;
    import('/assets/study-rpg-integrated-20261019.js?v=20261020-study-live1')
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
  window.addEventListener('popstate', showStudy);
  window.addEventListener('pageshow', showStudy);
  window.addEventListener('lux:app-ready', showStudy);
  showStudy();
}());
