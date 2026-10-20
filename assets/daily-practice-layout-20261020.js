/* Daily Practice UI v2. Presentation only: no question, answer, score, timer,
 * mastery, recovery, XP, pet selection or localStorage writes. */
(function () {
  'use strict';
  if (window.__luxDailyPracticeUxV2) return;
  window.__luxDailyPracticeUxV2 = true;
  const pathIsPractice = () => /^\/study\/[^/]+\/practise\/?$/.test(location.pathname);
  const disabled = () => new URLSearchParams(location.search).get('dailyUxPreview') === '0';
  const navSpec = [
    ['⌂','Home','/'], ['▣','Study','/study/'], ['◇','Play','/play/'],
    ['♧','Garden','/garden/'], ['♧','Pet','/pet/'],
    ['▤','Assessment','/assessment/'], ['✎','Scholar','/scholar/']
  ];
  let scheduled = false;
  let sheet;
  let nav;
  const root = document.documentElement;
  function installSheet() {
    if (sheet || document.getElementById('lux-daily-practice-ux-v2-style')) return;
    sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.id = 'lux-daily-practice-ux-v2-style';
    sheet.href = '/assets/daily-practice-ux-v2-20261020.css?v=preview1';
    document.head.append(sheet);
  }
  function buildNav() {
    if (nav?.isConnected) return;
    nav = document.getElementById('lux-daily-study-nav');
    if (nav) return;
    nav = document.createElement('nav');
    nav.id = 'lux-daily-study-nav';
    nav.className = 'lux-daily-study-nav';
    nav.setAttribute('aria-label', 'Study main navigation');
    for (const [glyph,label,href] of navSpec) {
      const a = document.createElement('a');
      a.href = href;
      if (label === 'Study') a.setAttribute('aria-current', 'page');
      const icon = document.createElement('span');
      icon.className = 'lux-daily-nav-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = glyph;
      const caption = document.createElement('span');
      caption.textContent = label;
      a.append(icon,caption);
      nav.append(a);
    }
    document.body.append(nav);
  }
  function decorateQuestion(q) {
    // React owns questions and event handlers; this changes attributes only.
    const prompt = q.querySelector('p.font-display.text-2xl');
    if (prompt && !prompt.hasAttribute('data-lux-prompt')) {
      prompt.setAttribute('data-lux-prompt','');
    }
    const card = prompt?.parentElement;
    if (card && !card.hasAttribute('data-lux-question-card')) {
      card.setAttribute('data-lux-question-card','');
    }
    const options = q.querySelector('div.mt-5.grid.gap-2');
    if (options && options.parentElement === card) {
      if (!options.hasAttribute('data-lux-mc-options')) options.setAttribute('data-lux-mc-options','');
      const labels = [...options.querySelectorAll(':scope > button')].map(x => (x.textContent || '').trim());
      const long = labels.some(s => s.length > 85);
      if (q.dataset.luxMcLong !== String(long)) q.dataset.luxMcLong = String(long);
    }
  }
  function refresh() {
    scheduled = false;
    const q = pathIsPractice() && !disabled() &&
      document.querySelector('.lux-practice-view [data-question-id]');
    const active = Boolean(q);
    root.classList.toggle('lux-daily-ux-ready',active);
    if (!active) {
      nav?.remove();
      root.classList.remove('lux-daily-typing');
      return;
    }
    installSheet();
    decorateQuestion(q);
    buildNav();
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(refresh); }
  }
  function isEditor(el) {
    return !!el?.closest?.('.lux-practice-view [data-question-id] input, .lux-practice-view [data-question-id] textarea, .lux-practice-view [data-question-id] select');
  }
  // Hide the floating nav while typing; form events continue to belong to React.
  document.addEventListener('focusin', e => {
    if (isEditor(e.target)) root.classList.add('lux-daily-typing');
  });
  document.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!isEditor(document.activeElement)) root.classList.remove('lux-daily-typing');
    });
  });
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {childList:true,subtree:true});
  window.addEventListener('popstate',schedule);
  window.addEventListener('pageshow',schedule);
  window.addEventListener('lux:app-ready',schedule);
  schedule();
})();
