/* iPad Daily Practice keyboard viewport guard.
 * Presentation only: never changes answer evaluation, quiz state, or persistence. */
(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__luxDailyKeyboardSafe) return;
  window.__luxDailyKeyboardSafe = true;

  const html = document.documentElement;
  const selector = '.lux-practice-view [data-question-id] input:not([type=checkbox]):not([type=radio]), .lux-practice-view [data-question-id] textarea, .lux-practice-view [data-question-id] select';
  const activeEditor = () => document.activeElement?.matches?.(selector) ? document.activeElement : null;
  const practiceQuestion = () => /^\/study\/[^/]+\/practise\/?$/.test(location.pathname)
    ? document.querySelector('.lux-practice-view [data-question-id]') : null;
  const vv = () => window.visualViewport;
  let baseline = vv()?.height || window.innerHeight;
  let pending = false;
  let delayed = [];

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/assets/daily-keyboard-safe-20261020.css?v=1';
  stylesheet.id = 'lux-daily-keyboard-safe-styles';
  document.head.append(stylesheet);

  function scrollQuestionAndAnswer(editor, question) {
    if (!editor?.isConnected || !question?.isConnected || !html.classList.contains('lux-practice-keyboard-open')) return;
    const viewport = vv();
    const top = (viewport?.offsetTop || 0) + 8;
    const bottom = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight) - 12;
    const available = bottom - top;
    if (available < 155) return;
    const card = editor.closest('[data-lux-question-card]') ||
      question.querySelector('[data-lux-question-card]') || editor.closest('form')?.parentElement;
    const prompt = card?.querySelector('[data-lux-prompt], p.font-display.text-2xl') ||
      question.querySelector('[data-lux-prompt], p.font-display.text-2xl');
    const form = editor.closest('form');
    const action = form?.querySelector('button[type="submit"]') ||
      card?.querySelector('button[type="submit"]') || editor;
    const promptRect = (prompt || card || editor).getBoundingClientRect();
    const actionRect = action.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const contentHeight = actionRect.bottom - promptRect.top;
    let shift = 0;
    if (contentHeight > 0 && contentHeight <= available) {
      // Both prompt and Submit can fit: align the question at the top.
      shift = promptRect.top - top;
    } else if (editorRect.bottom > bottom || editorRect.top < top) {
      // Very long questions are still scrollable; prioritize a usable editor.
      shift = editorRect.bottom > bottom ? editorRect.bottom - bottom :
        editorRect.top - top;
    } else if (promptRect.top < top && actionRect.bottom < bottom - 20) {
      shift = promptRect.top - top;
    }
    if (Math.abs(shift) > 4) window.scrollBy({top: shift, behavior: 'instant'});
  }

  function sync() {
    pending = false;
    const question = practiceQuestion();
    const editor = question && activeEditor();
    const focused = !!editor;
    if (!focused) baseline = vv()?.height || window.innerHeight;
    const viewport = vv();
    const visible = viewport?.height || window.innerHeight;
    const obstructed = focused && (
      (baseline - visible > 125) ||
      (!!viewport && window.innerHeight - visible - viewport.offsetTop > 125)
    );
    html.classList.toggle('lux-practice-editor-focused',focused);
    html.classList.toggle('lux-practice-keyboard-open',obstructed);
    if (obstructed) {
      html.style.setProperty('--lux-practice-visible-height', Math.round(visible) + 'px');
      scrollQuestionAndAnswer(editor,question);
    } else {
      html.style.removeProperty('--lux-practice-visible-height');
    }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(sync);
  }
  function settle() {
    schedule();
    delayed.forEach(clearTimeout);
    delayed = [setTimeout(schedule,120),setTimeout(schedule,300),setTimeout(schedule,520)];
  }

  document.addEventListener('focusin',e => {
    if (e.target?.matches?.(selector)) settle();
  });
  document.addEventListener('focusout', settle);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange',settle);
  window.addEventListener('popstate',settle);
  window.addEventListener('pageshow',settle);
  window.visualViewport?.addEventListener('resize',settle);
  window.visualViewport?.addEventListener('scroll',schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  schedule();
})();
