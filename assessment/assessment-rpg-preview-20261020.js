/* Assessment visual scene only: no avatar and no learner state mutations. */
(() => {
  if (!/^\/assessment\/?$/.test(location.pathname)) return;
  function mount() {
    if (document.querySelector('.assessment-rpg-scene-brand')) return;
    document.body.classList.add('assessment-rpg-scene');
    const brand = document.createElement('a');
    brand.className = 'assessment-rpg-scene-brand';
    brand.href = '/';
    brand.innerHTML = '<span aria-hidden="true" class="assessment-rpg-spark">✧</span><span><strong>Lux et Labor</strong><small>THE SCHOLAR’S GARDEN</small></span>';
    document.body.append(brand);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();