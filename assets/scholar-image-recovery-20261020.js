/* Scholar image resilience. Display-only: never write progress or outfit state. */
(() => {
  if (!location.pathname.startsWith('/scholar')) return;
  const observed = new WeakSet();
  const observe = (img) => {
    if (observed.has(img)) return;
    observed.add(img);
    img.addEventListener('error', () => {
      if (!img.dataset.scholarRetried) {
        img.dataset.scholarRetried = '1';
        const original = img.getAttribute('src') || '';
        if (!original || !original.startsWith('/')) return showFallback(img);
        const url = new URL(original, location.origin);
        url.searchParams.set('scholarImageRetry', '20261020');
        img.src = url.pathname + url.search;
        return;
      }
      showFallback(img);
    });
  };
  function showFallback(img) {
    if (img.dataset.scholarFallback) return;
    img.dataset.scholarFallback = '1';
    img.style.visibility = 'hidden';
    const slot = img.parentElement;
    if (!slot || slot.querySelector('[data-scholar-image-fallback]')) return;
    const note = document.createElement('span');
    note.dataset.scholarImageFallback = '1';
    note.setAttribute('role', 'img');
    note.setAttribute('aria-label', 'Image unavailable');
    note.textContent = 'Image unavailable';
    note.style.cssText = 'display:grid;place-items:center;min-height:5rem;padding:0.5rem;color:#43536a;font-size:0.75rem;text-align:center';
    slot.appendChild(note);
  }
  function scan(root = document) {
    if (root instanceof HTMLImageElement) observe(root);
    root.querySelectorAll?.('img').forEach(observe);
  }
  scan();
  new MutationObserver(records => {
    for (const record of records)
      for (const node of record.addedNodes)
        if (node.nodeType === 1) scan(node);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
