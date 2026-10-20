/* Assessment visual scene only: no mutations to learner records or marking. */
(() => {
  if (!/^\/assessment\/?$/.test(location.pathname)) return;
  const readOutfit = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('lux-scholar-garden-v1') || '{}');
      const state = saved.state || saved;
      const id = String(state.equippedOutfit || 'day');
      return /^[a-z0-9-]+$/i.test(id) ? id : 'day';
    } catch { return 'day'; }
  };
  const updateOutfit = img => {
    const outfit = readOutfit();
    const src = outfit === 'day' ? '/art/home-rpg/scholar-clean.png' : '/art/doll/' + outfit + '.png';
    if (img.dataset.outfit !== outfit) {
      img.dataset.outfit = outfit;
      img.dataset.fallbackUsed = '';
      img.src = src;
    }
  };
  function mount() {
    if (document.querySelector('.assessment-rpg-scene-brand')) return;
    document.body.classList.add('assessment-rpg-scene');
    const brand = document.createElement('a');
    brand.className = 'assessment-rpg-scene-brand';
    brand.href = '/';
    brand.innerHTML = '<span aria-hidden="true" class="assessment-rpg-spark">✧</span><span><strong>Lux et Labor</strong><small>THE SCHOLAR’S GARDEN</small></span>';
    const cast = document.createElement('div');
    cast.className = 'assessment-rpg-cast';
    cast.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.className = 'assessment-rpg-scholar';
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.addEventListener('error', () => {
      if (img.dataset.fallbackUsed) return;
      img.dataset.fallbackUsed = '1';
      img.src = '/art/home-rpg/scholar-clean.png';
    });
    updateOutfit(img);
    cast.append(img);
    document.body.append(brand, cast);
    window.addEventListener('storage', event => {
      if (event.key === 'lux-scholar-garden-v1') updateOutfit(img);
    });
    const observer = new MutationObserver(() => {
      const nav = document.querySelector('.lux-shell-nav');
      if (nav && nav.dataset.assessmentSorted !== '1') {
        nav.dataset.assessmentSorted = '1';
        // Ordering is done in CSS; retain original URLs and click handlers.
      }
    });
    observer.observe(document.body, {childList:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();