/* Daily Practice UI v2. Presentation only: no question, answer, score, timer,
 * mastery, recovery, XP, pet selection or localStorage writes. */
(function () {
  'use strict';
  // Node-based QA imports the app bundle without any browser globals.
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
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
      icon.textContent = glyph;
      const caption = document.createElement('span');
      caption.textContent = label;
      a.append(icon,caption);
      nav.append(a);
    }
    document.body.append(nav);
  }
  let fallbackPet, petResolver, clearControl;
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
      clearControl?.remove();
      return;
    }
    if(!clearControl?.isConnected){
      clearControl=document.createElement('button');
      clearControl.type='button';
      clearControl.id='lux-daily-clear-tiles';
      clearControl.textContent='↶ Clear';
      clearControl.setAttribute('aria-label','Clear selected tiles');
      clearControl.addEventListener('click',clearSelectedTiles);
      document.body.append(clearControl);
    }
    const row=tileRow.getBoundingClientRect(),card=workspace.closest('[data-lux-question-card]')?.getBoundingClientRect();
    const left=Math.max(12,row.left);
    const top=Math.min(row.bottom+12,card ? card.bottom-52:row.bottom+12);
    const coordinates=[Math.round(left)+'px',Math.round(top)+'px'];
    if(clearControl.style.left!==coordinates[0])clearControl.style.left=coordinates[0];
    if(clearControl.style.top!==coordinates[1])clearControl.style.top=coordinates[1];
    const disabled=!!workspace.querySelector(':scope > button:last-child:disabled');
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
  }
  function refresh() {
    scheduled = false;
    const q = pathIsPractice() && !disabled() &&
      document.querySelector('.lux-practice-view [data-question-id]');
    const active = Boolean(q);
    root.classList.toggle('lux-daily-ux-ready',active);
    if (!active) {
      nav?.remove();
      fallbackPet?.remove();
      clearControl?.remove();
      root.classList.remove('lux-daily-typing');
      return;
    }
    installSheet();
    decorateQuestion(q);
    buildNav();
    updateFallbackPet();
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
  window.addEventListener('resize',schedule);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('scholar:pet-changed',schedule);
  window.addEventListener('lux:app-ready',schedule);
  schedule();
})();
