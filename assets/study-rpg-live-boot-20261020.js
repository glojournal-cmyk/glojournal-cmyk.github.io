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
