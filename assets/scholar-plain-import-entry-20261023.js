// Scholar Settings -> Import progress must accept the matching plain
// "Export progress" JSON. Older Scholar route code incorrectly routed this
// button to encrypted-backup-restore.html, which rejects plain exports.
// Intercept only this precise user gesture; do not read/write learner state.
(function installScholarPlainImportEntry() {
  if (typeof document === 'undefined' || globalThis.__gloriaPlainImportEntryInstalled) return;
  globalThis.__gloriaPlainImportEntryInstalled = true;
  document.addEventListener('click', event => {
    if (!/^\/scholar\/?$/.test(location.pathname)) return;
    const target=event.target;
    const button=target?.closest?.('button');
    if (!button || button.textContent?.trim() !== 'Import progress') return;
    // The encrypted Cloud Backup restore remains available separately from
    // the normal plain JSON import screen.
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign('/?import=1');
  },true);
})();
