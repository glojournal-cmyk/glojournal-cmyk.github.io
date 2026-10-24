/* 2026-10-23 Practice Studio redesign: two visible selection stages in new UI.
 * Preserve the full new bottom navigation and background, with a dedicated
 * picker state until a quiz question begins. No saved-data mutations. */
/* Daily Practice UI v2. Presentation only: no question, answer, score, timer,
 * mastery, recovery, XP, pet selection or localStorage writes. */
(function () {
  'use strict';
  // Node-based QA imports the app bundle without any browser globals.
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__luxDailyPracticeUxV2) return;
  window.__luxDailyPracticeUxV2 = true;
  const pathIsPractice = () => /^\/study\/[^/]+\/practise\/?$/.test(location.pathname);
  // New design is the default for both free Practice and assigned Daily tasks.
  // Keep the proven classic interface available only by explicit rollback.
  const disabled = () => new URLSearchParams(location.search).get('dailyUxPreview') === '0';
  // Older saved Daily links sometimes URL-encode the value as \"1\".
  const isAssignedDaily = () => /^(1|true)$/.test(String(new URLSearchParams(location.search).get('daily') || '').replace(/^[\"']|[\"']$/g, ''));
  // Hand-drawn gold line icons based on the approved seven-item rail.
  // Keep text labels and legacy glyph text for accessible names/regression QA.
  const navDrawings = {
    Home: '<path d="M3 10.3 12 3l9 7.3V21h-6v-7H9v7H3z"/>',
    Study: '<path d="M12 6c-2.5-2-6-2.7-9-2v15c3.5-.6 6.3.2 9 2 2.7-1.8 5.5-2.6 9-2V4c-3-.7-6.5 0-9 2z" fill="none"/><path d="M12 6v15"/>',
    Play: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>',
    Garden: '<path d="M12 21V12m0 4c-5 1-9-2-9-8 5-1 9 1 9 8Zm0-4c0-6 4-9 9-8 0 6-4 9-9 8Z" fill="none"/>',
    Pet: '<ellipse cx="12" cy="16.2" rx="5" ry="3.6"/><ellipse cx="5.5" cy="8" rx="1.55" ry="2.3"/><ellipse cx="10" cy="6" rx="1.5" ry="2.3"/><ellipse cx="15" cy="6" rx="1.5" ry="2.3"/><ellipse cx="19" cy="8" rx="1.55" ry="2.3"/>',
    Assessment: '<path d="M7 3h10v3H7zm-2 3h14v15H5V6Zm4 5h6m-6 4h6M9 18h4" fill="none"/>',
    Scholar: '<path d="m2 9 10-5 10 5-10 5-10-5Zm4 3v5c4 4 8 4 12 0v-5M22 9v8" fill="none"/>'
  };
  const navSpec = [
    ['⌂','Home','/'], ['▣','Study','/study/'], ['◇','Play','/play/'],
    ['♧','Garden','/garden/'], ['♧','Pet','/pet/'],
    ['▤','Assessment','/assessment/'], ['✎','Scholar','/scholar/']
  ];
  let scheduled = false;
  let sheet;
  let nav;
  const root = document.documentElement;
  const expandedModePanels = new WeakSet();
  // Any Practice route needs its final shell before React paints the question.
  // On iPad a route or quiz re-mount may take several frames; waiting for
  // [data-question-id] shows the old Daily screen between new question frames.
  if (pathIsPractice() && !disabled()) {
    root.classList.add('lux-daily-ux-ready');
    if (isAssignedDaily()) root.classList.add('lux-daily-task-active');
    else root.classList.add('lux-practice-choosing');
  }
  function installSheet() {
    // Match the stylesheet used by the static Practice routes. Earlier Home
    // -> Daily SPA sessions imported ?v=preview1 from Safari's old cache.
    const href = '/assets/practice-studio-20261023.css?v=studio-shell-stable3';
    sheet = sheet?.isConnected ? sheet : document.getElementById('lux-daily-practice-ux-v2-style');
    if (sheet) {
      if (sheet.getAttribute('href') !== href) {
        sheet.href = href;
      }
      return;
    }
    sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.id = 'lux-daily-practice-ux-v2-style';
    sheet.href = href;
    document.head.append(sheet);
  }
  // Shared question presentation for Daily + every React-based subject.
  // Only inserts a CSS link. No question, grading, save or draft mutation.
  function installUnifiedQuestionTheme() {
    const id = 'gloria-unified-question-theme';
    const href = '/assets/gloria-unified-question-theme-20261024.css?v=20261024-progress2';
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.append(link);
    } else if (link.getAttribute('href') !== href) {
      link.href = href;
    }
  }
  // Final approved illustrated Practice skin. No replacement of React
  // controls; metadata attributes below are used only for CSS styling.
  function installMockupSkin() {
    const id='gloria-practice-final-skin';
    const href='/assets/gloria-practice-mockup-final-20261024.css?v=20261024-live2';
    let link=document.getElementById(id);
    if(!link) {
      link=document.createElement('link');
      link.id=id;
      link.rel='stylesheet';
      link.href=href;
      document.head.append(link);
    } else if(link.getAttribute('href')!==href) {
      link.href=href;
    }
  }
  function decorateCheckedAnswer(q) {
    // React owns all text, scoring and buttons. Mark existing checked-answer
    // sections visually; do not copy model answers into decorative elements.
    const card=q.querySelector('[data-lux-question-card]');
    if(!card)return;
    const stacks=[...card.querySelectorAll(':scope > div.mt-5.space-y-3')];
    const feedback=stacks.find(el=>!!el.querySelector('p.font-display.text-2xl'));
    if(!feedback)return;
    if(!feedback.hasAttribute('data-gloria-feedback-stack')){
      feedback.setAttribute('data-gloria-feedback-stack','');
    }
    const status=feedback.querySelector(':scope > div.rounded-lg.p-4');
    if(status&&!status.hasAttribute('data-gloria-feedback-status')){
      status.setAttribute('data-gloria-feedback-status','');
    }
    for(const label of card.querySelectorAll('p.text-xs')) {
      const text=(label.textContent||'').trim().toLowerCase();
      const parent=label.parentElement;
      if(!parent)continue;
      if((text==='correct answer'||text==='suggested answer')&&!parent.hasAttribute('data-gloria-model')){
        parent.setAttribute('data-gloria-model','');
      }
      if((text==='why this works'||text==='correct reasoning')&&!parent.hasAttribute('data-gloria-reason')){
        parent.setAttribute('data-gloria-reason','');
      }
    }
    const details=feedback.querySelector('details.lux-feedback-detail');
    // Native <details> is a presentation control. Show the accepted wording
    // after marking so it is legible, never before an answer is submitted.
    if(details&&!details.open&& !details.hasAttribute('data-gloria-opened')){
      details.setAttribute('data-gloria-opened','');
      details.open=true;
    }
  }
  function buildNav() {
    if (nav?.isConnected) return;
    nav = document.getElementById('lux-daily-study-nav');
    if (nav) return;
    // Match Study's div-based pill: legacy nav enhancers target <nav> and
    // otherwise add a duplicate Assessment item to this exact seven-link bar.
    nav = document.createElement('div');
    nav.setAttribute('role','navigation');
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
      // Preserve invisible glyph text for accessible name and old saved tests.
      const legacy=document.createElement('span');
      legacy.className='lux-daily-legacy-glyph';
      legacy.textContent=glyph;
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 24 24');
      svg.setAttribute('aria-hidden','true');
      svg.setAttribute('focusable','false');
      svg.setAttribute('fill','none');
      svg.setAttribute('stroke','currentColor');
      svg.setAttribute('stroke-width','1.65');
      svg.setAttribute('stroke-linecap','round');
      svg.setAttribute('stroke-linejoin','round');
      svg.innerHTML=navDrawings[label]||'';
      icon.append(svg,legacy);
      const caption = document.createElement('span');
      caption.textContent = label;
      a.append(icon,caption);
      nav.append(a);
    }
    document.body.append(nav);
  }
  let fallbackPet, petResolver, clearControl;
  let watchedBuddy;
  const companionStyleWatcher=new MutationObserver(schedule);
  function watchCompanion(buddy){
    if(watchedBuddy===buddy)return;
    companionStyleWatcher.disconnect();
    watchedBuddy=buddy;
    if(buddy)companionStyleWatcher.observe(buddy,{attributes:true,attributeFilter:['style','class']});
  }
  // The legacy Study layout sometimes sets the mounted companion itself to
  // display:none. Keep the real equipped sprite and Voice button visible here.
  // Restore its prior inline display on leaving a question; no saved pet data changes.
  function restoreCompanion(){
    watchCompanion(null);
    const buddy=document.querySelector('[data-lux-daily-shown-companion]');
    if(!buddy)return;
    const former=buddy.dataset.luxDailyFormerDisplay||'';
    const priority=buddy.dataset.luxDailyFormerPriority||'';
    if(former)buddy.style.setProperty('display',former,priority);
    else buddy.style.removeProperty('display');
    delete buddy.dataset.luxDailyFormerDisplay;
    delete buddy.dataset.luxDailyFormerPriority;
    buddy.removeAttribute('data-lux-daily-shown-companion');
  }
  function showCompanion(){
    // Don't fight the compact keyboard layout by reapplying inline
    // display:flex!important after CSS has hidden the companion.
    if (root.classList.contains('lux-daily-compact')) {
      restoreCompanion();
      return;
    }
    const buddy=document.getElementById('study-companion');
    watchCompanion(buddy);
    if(!buddy) return;
    if(getComputedStyle(buddy).display==='none'){
      if(!buddy.hasAttribute('data-lux-daily-shown-companion')){
        buddy.dataset.luxDailyFormerDisplay=buddy.style.getPropertyValue('display');
        buddy.dataset.luxDailyFormerPriority=buddy.style.getPropertyPriority('display');
        buddy.setAttribute('data-lux-daily-shown-companion','');
      }
      // Safari may receive a later display:none from legacy code after first mount.
      // Reapply only while this exact Daily question remains active.
      buddy.style.setProperty('display','flex','important');
    }
  }
  function updateFallbackPet(){
    if (document.getElementById('study-companion')) {
      fallbackPet?.remove();
      return;
    }
    if (!fallbackPet?.isConnected) {
      fallbackPet = document.createElement('div');
      fallbackPet.id = 'lux-daily-equipped-pet';
      fallbackPet.setAttribute('aria-label','Equipped study companion');
      const img = document.createElement('img');
      img.alt = 'Equipped pet';
      img.decoding = 'async';
      fallbackPet.append(img);
      document.body.append(fallbackPet);
    }
    if (!petResolver) {
      petResolver = Promise.all([
        import('/pet/pet-art-hd-20261009.js'),
        import('/assets/companion-goals-state-20261004.js')
      ]).catch(()=>null);
    }
    petResolver.then(modules=>{
      if (!modules || !fallbackPet?.isConnected) return;
      let p={};try{p=JSON.parse(localStorage.getItem('lux-pet-companion-v1')||'{}')||{}}catch{}
      const species=p.species||'moss-hornling';
      const level=modules[1].petLevel(p,species);
      const src=modules[0].petArtUrl(species,level);
      const img=fallbackPet.querySelector('img');
      if (img && img.getAttribute('src')!==src) img.setAttribute('src',src);
      if (img) img.alt=(species.replaceAll('-',' '))+' level '+level;
    });
  }
  function clearSelectedTiles(){
    const active=document.querySelector('.lux-practice-view [data-question-format="word_tiles"] [data-lux-tiles]');
    if (!active) return;
    (async()=>{
      for(let i=0;i<60;i++){
        const selected=active.querySelector(':scope > div:first-child button:not(:disabled)');
        if (!selected) break;
        selected.click();
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }
    })();
  }
  function updateClear(q){
    const workspace=q?.dataset.questionFormat==='word_tiles'
      ? q.querySelector('[data-lux-tiles]') : null;
    const tileRow=workspace?.querySelector(':scope > div:nth-child(2)');
    if (!tileRow){
      clearControl?.parentElement?.matches('[data-lux-tile-actions]') ? clearControl.parentElement.remove() : clearControl?.remove();
      return;
    }
    if(!clearControl?.isConnected){
      clearControl=document.createElement('button');
      clearControl.type='button';
      clearControl.id='lux-daily-clear-tiles';
      clearControl.textContent='↶ Clear';
      clearControl.setAttribute('aria-label','Clear selected tiles');
      clearControl.addEventListener('click',clearSelectedTiles);
      // An in-flow action row reserves its own space below the letter tiles.
      // Keep Submit last so React's existing submit styling remains intact.
      const actions=document.createElement('div');
      actions.setAttribute('data-lux-tile-actions','');
      actions.append(clearControl);
      workspace.insertBefore(actions,workspace.querySelector(':scope > button:last-child'));

    }
    const selected=workspace.querySelector(':scope > div:first-child button:not(:disabled)');
    const checked=!!workspace.querySelector(':scope > button:last-child:disabled');
    const disabled=!selected || checked;
    if(clearControl.disabled!==disabled)clearControl.disabled=disabled;
  }
  function decorateQuestion(q) {
    // React owns questions and event handlers; this changes attributes only.
    const intro = q.querySelector("h1.font-display.text-3xl")?.parentElement;
    if (intro && !intro.hasAttribute("data-lux-question-intro")) intro.setAttribute("data-lux-question-intro","");
    if (intro) {
      const heading = intro.querySelector("h1");
      const lockCandidate = [...document.querySelectorAll(".lux-practice-view > div, .lux-practice-view > section")]
        .find(el => !el.querySelector("[data-question-id]") && /^This daily task is locked to /.test((el.textContent || "").trim()));
      if (lockCandidate) lockCandidate.setAttribute("data-lux-daily-lock","");
      const lockText = (lockCandidate?.textContent || "").trim();
      const match = lockText.match(/^This daily task is locked to (.+?)\. Finish/i);
      const topicSummary = document.querySelector(".lux-practice-view .study-topic-picker summary")?.textContent?.trim() || "";
      const topic = match?.[1] || (topicSummary.startsWith("Topic: ") ? topicSummary.slice(7).trim() : "");
      const subject = (location.pathname.match(/^\/study\/([^/]+)/)?.[1] || "").replace(/^./, c=>c.toUpperCase());
      if (heading && topic && topic !== "All topics") {
        const desired = subject + " · " + topic;
        if (heading.getAttribute("data-lux-display-title") !== desired) {
          heading.setAttribute("data-lux-display-title",desired);
          heading.setAttribute("aria-label",desired);
        }
      } else if (heading?.hasAttribute("data-lux-display-title")) {
        heading.removeAttribute("data-lux-display-title");
      }
      const count = (intro.textContent || "").match(/Question\s+(\d+)\s*\/\s*(\d+)/i);
      const countText = count ? count[1] + " / " + count[2] : "";
      if (intro.dataset.luxProgressCount !== countText) intro.dataset.luxProgressCount = countText;
      if (count) {
        const complete = Number(count[1]), total = Math.max(1,Number(count[2]));
        const percent = Math.max(0,Math.min(100,100*complete/total)) + "%";
        if (intro.style.getPropertyValue("--lux-daily-fill") !== percent) {
          intro.style.setProperty("--lux-daily-fill",percent);
        }
      }
      const review = intro.nextElementSibling;
      if (review && !review.querySelector("p.font-display.text-2xl") && !review.querySelector("[data-lux-question-card]")) {
        review.setAttribute("data-lux-review-progress","");
      }
    }
    const prompt = q.querySelector('p.font-display.text-2xl');
    if (prompt && !prompt.hasAttribute('data-lux-prompt')) {
      prompt.setAttribute('data-lux-prompt','');
    }
    const card = prompt?.parentElement;
    if (card && !card.hasAttribute('data-lux-question-card')) {
      card.setAttribute('data-lux-question-card','');
    }
    const tileWorkspace = q.dataset.questionFormat === 'word_tiles'
      ? q.querySelector('[data-lux-question-card] .mt-5.space-y-3')
      : null;
    if (tileWorkspace) {
      tileWorkspace.setAttribute('data-lux-tiles','');
      const submit = tileWorkspace.querySelector(':scope > button:last-child');
      if (submit && submit.getAttribute('aria-label') !== 'Check Answer') {
        submit.setAttribute('aria-label','Check Answer');
      }
    }
    const options = q.querySelector('div.mt-5.grid.gap-2');
    if (options && options.parentElement === card) {
      if (!options.hasAttribute('data-lux-mc-options')) options.setAttribute('data-lux-mc-options','');
      const labels = [...options.querySelectorAll(':scope > button')].map(x => (x.textContent || '').trim());
      const long = labels.some(s => s.length > 85);
      if (q.dataset.luxMcLong !== String(long)) q.dataset.luxMcLong = String(long);
    }
    decorateCheckedAnswer(q);
  }
  // The new Practice shell persists for the ENTIRE route, including checked
  // feedback, result screens, next-question gaps and hydration. Previously a
  // real result explicitly disabled it, showing the classic skin before the
  // next question re-enabled the modern one. Only route exit or intentional
  // ?dailyUxPreview=0 rollback may disable the shell.
  function refresh() {
    scheduled = false;
    // Do not derive shell activity from transient React question/result markup.
    // A marked answer and the next question must never toggle the theme.
    const active = pathIsPractice() && !disabled();
    const q = active && document.querySelector('.lux-practice-view [data-question-id]');
    const isDailyTask = active && isAssignedDaily();
    root.classList.toggle('lux-daily-ux-ready',active);
    root.classList.toggle('lux-daily-task-active',isDailyTask);
    root.classList.toggle('lux-practice-choosing',active && !isDailyTask && !q);
    if (!active) {
      restoreCompanion();
      nav?.remove();
      fallbackPet?.remove();
      clearControl?.parentElement?.matches('[data-lux-tile-actions]') ? clearControl.parentElement.remove() : clearControl?.remove();
      root.classList.remove('lux-daily-typing','lux-daily-compact');
      return;
    }
    installSheet();
    installUnifiedQuestionTheme();
    installMockupSkin();
    buildNav();
    // Expand the actual React-owned activity picker once on first free Practice
    // mount. Respect the student's manual collapse afterwards.
    if (root.classList.contains('lux-practice-choosing') && !q) {
      const modes = document.querySelector('.lux-practice-view > details:not(.study-topic-picker)');
      if (modes && !expandedModePanels.has(modes)) {
        expandedModePanels.add(modes);
        modes.open = true;
      }
    }
    // Do not remove/recreate the Study rail or change the page theme when
    // the question tree is briefly empty. React still owns the question DOM.
    if (!q) return;
    // Vocab/Daily helper prose was previously rendered as a wide white bar
    // above the quiz. During an active question it obscures the one-screen
    // interface; the Home daily record remains available and unchanged.
    const view=document.querySelector('.lux-practice-view');
    if(view) for(const el of [...view.children]){
      if(el.contains(q) || el===q)continue;
      if(el.matches?.('header,details'))continue;
      const txt=(el.textContent||'').trim();
      if((/^Today.s vocabulary test\s*·/.test(txt) ||
          /^This daily task is locked to /.test(txt)) &&
         !el.hasAttribute('data-gloria-redundant-guidance')){
        el.setAttribute('data-gloria-redundant-guidance','');
      }
    }
    decorateQuestion(q);
    // The approved mockup is a fast, full-width study screen with no avatar.
    // Do not fight CSS by restoring the old companion with inline !important.
    // Equipped pet and voice preferences remain saved and visible elsewhere.
    restoreCompanion();
    fallbackPet?.remove();
    updateClear(q);
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(refresh); }
  }
  function isEditor(el) {
    return !!el?.closest?.('.lux-practice-view [data-question-id] input, .lux-practice-view [data-question-id] textarea, .lux-practice-view [data-question-id] select');
  }
  // Hide the floating nav while typing; form events continue to belong to React.
  document.addEventListener('focusin', e => {
    if (pathIsPractice() && !disabled() && isEditor(e.target)) {
      // The keyboard may close between questions. Keep the ANSWER CARD compact
      // until leaving this practice session, otherwise heading/card/companion
      // expand then contract on nearly every Submit / Next question.
      root.classList.add('lux-daily-typing','lux-daily-compact');
      restoreCompanion();
    }
  });
  document.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!isEditor(document.activeElement)) root.classList.remove('lux-daily-typing');
    });
  });
  // Safari/React can replace the html class during hydration without
  // changing a child node. A childList-only observer notices too late: a
  // single old-layout frame is painted before our requestAnimationFrame.
  // Preserve the new Practice skin on the free topic selection screen AND
  // during a live quiz; CSS uses lux-practice-choosing to reveal both pickers.
  // This never touches progress, answers, results or localStorage.
  const shellClassGuard = new MutationObserver(() => {
    if (pathIsPractice() && !disabled() &&
        !root.classList.contains('lux-daily-ux-ready')) {
      root.classList.add('lux-daily-ux-ready');
    }
  });
  shellClassGuard.observe(root,{attributes:true,attributeFilter:['class']});
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {childList:true,subtree:true});
  window.addEventListener('popstate',schedule);
  window.addEventListener('pageshow',schedule);
  window.addEventListener('resize',schedule);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('scholar:pet-changed',schedule);
  window.addEventListener('lux:app-ready',schedule);
  schedule();
})();
