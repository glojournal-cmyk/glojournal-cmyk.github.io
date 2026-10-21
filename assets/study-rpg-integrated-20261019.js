/* Study RPG: presentation only. Keep all real learning/marking/save logic in
 * the existing Lux et Labor app. The Home outfit and Pet share their sources.
 */
import { A as wardrobeOutfits, C as store } from './index-BLVOhKhN.js?v=20261021-medical-careers1';
import { petArtUrl } from '/pet/pet-art-hd-20261009.js?v=20261019-baphomet1&ux=20261013-corrections2';

if (!window.__luxStudyRpgIntegrated) {
  window.__luxStudyRpgIntegrated = true;
  if (!document.getElementById('lux-study-rpg-style')) {
    const sheet = document.createElement('link');
    sheet.id = 'lux-study-rpg-style';
    sheet.rel = 'stylesheet';
    sheet.href = '/assets/study-rpg-integrated-20261019.css?v=20261020-maths7-layout1';
    document.head.append(sheet);
  }
  // Use a div with role=main: the old Pet enhancer decorates images inside <main>.
  const root = document.createElement('div');
  root.id = 'lux-study-rpg-integrated';
  root.className = 'lux-study-rpg';
  root.setAttribute('aria-label', 'Study library');
  const subjects = [
    ['latin', 'Latin'], ['french', 'French'], ['english', 'English'],
    ['maths', 'Maths'], ['biology', 'Biology'], ['chemistry', 'Chemistry'], ['physics', 'Physics']
  ];
  const nav = [
    ['⌂', 'Home', '/'], ['▣', 'Study', '/study'], ['◇', 'Play', '/play'],
    ['♧', 'Garden', '/garden'], ['♧', 'Pet', '/pet/'],
    ['▤', 'Assessment', '/assessment/'], ['✎', 'Scholar', '/scholar']
  ];
  const el = (tag, name, text) => {
    const node = document.createElement(tag);
    if (name) node.className = name;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  const readPet = () => {
    try { return JSON.parse(localStorage.getItem('lux-pet-companion-v1') || '{}') || {}; }
    catch { return {}; }
  };
  const safeSlug = (s, fallback) => /^[a-z\d-]+$/i.test(String(s || '')) ? String(s) : fallback;
  const nativeSelect = () => document.querySelector('main:not(#lux-study-rpg-integrated) select:has(option[value="8"])');
  const studyRoute = () => /^\/study\/?$/.test(location.pathname) &&
    new URLSearchParams(location.search).get('studyRpgPreview') !== '0';
  const valuesFrom = (card) => {
    const text = card?.querySelector('.lux-subject-status')?.textContent ||
      [...(card?.querySelectorAll('p') || [])].map(n => n.textContent || '').join(' ');
    const secure = text.match(/(\d+)\s*\/\s*(\d+)\s*(?:topics\s+)?secure/i);
    const due = text.match(/(\d+)\s*(?:questions?\s+)?due/i) ||
      text.match(/(\d+)\s*questions?\s+due/i) ||
      text.match(/(\d+)\s*questions?\s+due\s+for\s+review/i);
    return { secure: secure ? `${secure[1]}/${secure[2]}` : '—', due: due ? due[1] : '—' };
  };
  function subjectData(id, label) {
    if (id === 'maths') return { id, label, secure:'5', due:'500',
      learn:'/study/maths/learn/', practice:'/study/maths/practise/',
      progress:'/study/maths/progress/' };
    const container = document.querySelector('#lux-study-subjects-v2') ||
      [...document.querySelectorAll('main:not(#lux-study-rpg-integrated) section')]
        .find(s => s.querySelector('h2')?.textContent?.trim() === 'Subjects');
    const title = [...(container?.querySelectorAll('h3') || [])].find(h => h.textContent?.trim() === label);
    const card = title?.closest('.lux-subject-card') || title?.parentElement?.parentElement?.parentElement;
    const status = valuesFrom(card);
    // Copy the real app's destinations rather than routing to the Grok demo.
    const original = kind => {
      const a = [...(card?.querySelectorAll('a') || [])]
        .find(x => new URL(x.href, location.href).pathname === `/study/${id}/${kind}`);
      return a ? new URL(a.href, location.href).pathname + new URL(a.href, location.href).search : `/study/${id}/${kind}`;
    };
    return { id, label, ...status,
      learn: original('learn'), practice: original('practise'), progress: original('progress') };
  }
  const image = (source, fallback, name, alt) => {
    const img = el('img', name);
    img.alt = alt || '';
    img.decoding = 'async';
    img.loading = 'eager';
    if (fallback && fallback !== source) {
      img.addEventListener('error', () => {
        // Safari can abort an image request during React hydration or an
        // overlapping wardrobe redraw. Retry the selected outfit once before
        // showing the generic learner, never silently change saved selection.
        if (!img.isConnected) return;
        if (!img.dataset.sourceRetried) {
          img.dataset.sourceRetried = 'true';
          img.src = source + (source.includes('?') ? '&' : '?') + 'imageRetry=1';
          return;
        }
        if (img.dataset.fallbackUsed) return;
        img.dataset.fallbackUsed = 'true';
        img.src = fallback;
      });
    }
    img.src = source;
    return img;
  };
  function updateYear(year) {
    const select = nativeSelect();
    if (!select || select.disabled || ![8, 9].includes(year)) return;
    if (Number(select.value) === year) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    if (setter) setter.call(select, String(year)); else select.value = String(year);
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    queue();
  }
  // Keep the wardrobe sprite mounted between Study rebuilds. WebKit may
  // cancel image requests when the whole scene is recreated; the cancelled
  // request can otherwise trigger the generic default outfit fallback.
  const scholarImage = image('/art/home-rpg/scholar-clean.png', null, 'lux-study-rpg-scholar', 'Your Scholar');
  let renderedOutfitSrc = '/art/home-rpg/scholar-clean.png';
  // Keep the same Pet image mounted, too. XP and Study status updates must
  // not reload a selected evolution sprite on iPad WebKit.
  const petSprite=el('img','lux-study-rpg-pet');
  petSprite.alt='Your equipped pet';petSprite.loading='eager';petSprite.decoding='async';petSprite.hidden=true;
  petSprite.addEventListener('load',()=>{petSprite.hidden=false;});
  petSprite.addEventListener('error',()=>{petSprite.hidden=true;});
  const petLink=el('a','lux-study-rpg-pet-link');
  petLink.href='/pet/';petLink.setAttribute('aria-label','Open your equipped pet');
  petLink.append(petSprite);
  let renderedPetSrc=null;
  function build() {
    const state = store.getState?.() || {};
    const select = nativeSelect();
    const year = [8, 9].includes(Number(select?.value)) ? Number(select.value) :
      ([8,9].includes(Number(state.year)) ? Number(state.year) : 9);
    const petState = readPet();
    const petId = safeSlug(petState.species || 'moss-hornling', 'moss-hornling');
    const stage = Math.min(10, Math.max(1, Number(petState.petLevels?.[petId] || petState.highestStage) || 1));
    let petSrc;
    try { petSrc = petArtUrl(petId, stage); }
    catch { petSrc = '/art/rpg/moss.png'; }
    if (typeof petSrc !== 'string' || !petSrc.startsWith('/')) petSrc = '/art/rpg/moss.png';
    const outfit = safeSlug(state.equippedOutfit || 'day', 'day');
    const scholarSrc = wardrobeOutfits.find(item => item.id === outfit)?.art || '/art/home-rpg/scholar-clean.png';

    if (renderedOutfitSrc !== scholarSrc) {
      renderedOutfitSrc = scholarSrc;
      scholarImage.dataset.sourceRetried = '';
      scholarImage.dataset.fallbackUsed = '';
      scholarImage.src = scholarSrc;
    }
    if (renderedPetSrc !== petSrc) {
      renderedPetSrc=petSrc;petSprite.hidden=true;petSprite.src=petSrc;
    }
    root.replaceChildren();
    root.append(el('div', 'lux-study-rpg-shade'));
    const hud = el('div', 'lux-study-rpg-hud');
    hud.append(image('/art/scholar-avatar.jpg', '/favicon.svg', 'lux-study-rpg-avatar', ''));
    const level = Number(state.scholarLevel || state.level);
    hud.append(el('strong', null, Number.isInteger(level) && level > 0 ? `Lv ${level} ★` : 'Scholar ★'));
    hud.append(el('span', null, `${Math.max(0,Number(state.xp)||0)} XP`));
    root.append(hud);

    const cast = el('div', 'lux-study-rpg-cast');
    cast.append(scholarImage);
    petLink.dataset.petForm = stage < 5 ? 'small' : 'evolved';
    cast.append(petLink); root.append(cast);

    const board = el('section', 'lux-study-rpg-board');
    board.setAttribute('aria-label', `Year ${year} subjects`);
    const yearBox = el('label', 'lux-study-rpg-year');
    yearBox.append(el('span', 'lux-study-rpg-sr', 'Study year'));
    const yearSelect = el('select');
    yearSelect.setAttribute('aria-label', 'Study year');
    yearSelect.disabled = !!select?.disabled;
    for (const n of [8, 9]) {
      const option = el('option', null, `Year ${n}`); option.value = n;
      if (n === year) option.selected = true;
      yearSelect.append(option);
    }
    yearSelect.value = String(year);
    yearSelect.addEventListener('change', () => updateYear(Number(yearSelect.value)));
    yearBox.append(yearSelect);board.append(yearBox);

    const scroll = el('div', 'lux-study-rpg-subject-scroll');
    const cards = el('div', 'lux-study-rpg-subjects');
    for (const [id, label] of subjects) {
      if (id === 'maths' && year !== 9) continue;
      const data = subjectData(id, label);
      const card = el('article', 'lux-study-rpg-card');
      // Year-specific Grok art is optional: the existing six subject images are a
      // safe fallback so we never render an empty card while images are installed.
      card.append(image(id==='maths'?'/assets/math-study/maths-cover.svg':`/art/study-rpg/y${year}-${id}.jpg`, id==='maths'?null:`/art/subjects/${id}.jpg`, 'lux-study-rpg-card-art', ''));
      const body = el('div','lux-study-rpg-card-body');
      if(id==='maths'){const heading=el('h2');const link=el('a',null,data.label);link.href='/study/maths/';heading.append(link);body.append(heading);}else body.append(el('h2', null, data.label));
      const status = el('div', 'lux-study-rpg-status');
      status.append(el('span', 'lux-study-rpg-secure', id==='maths'?'5 topics':`${data.secure} secure`));
      status.append(el('span', 'lux-study-rpg-due', id==='maths'?'500 questions · Study only':`${data.due} due`));
      body.append(status);
      const actions = el('div', 'lux-study-rpg-actions');
      for (const [name, href, icon] of [['Learn',data.learn,'▣'],['Practise',data.practice,'✎'],['Progress',data.progress,'▥']]) {
        const a = el('a', name==='Learn'?'primary':'', `${icon} ${name}`);
        a.href = href;
        actions.append(a);
      }
      body.append(actions);card.append(body);cards.append(card);
    }
    scroll.append(cards);board.append(scroll);root.append(board);
    const navbar = el('div','lux-study-rpg-nav');navbar.setAttribute('aria-label','Primary');
    for (const [glyph,label,url] of nav) {
      const a = el('a', label==='Study'?'active':''); a.href=url;
      const navImg=el('img','lux-study-rpg-navicon');navImg.src='/assets/math-study/nav/'+label.toLowerCase()+'.svg';navImg.alt='';navImg.width=24;navImg.height=24;
      a.append(navImg,el('span',null,label));
      if (label==='Study') a.setAttribute('aria-current','page');
      navbar.append(a);
    }
    root.append(navbar);
  }
  let busy=false, lastKey='';
  function render() {
    busy=false;
    if (!studyRoute()) {
      root.remove();document.documentElement.classList.remove('lux-study-rpg-active');
      return;
    }
    if (!window.__luxAppReady || !nativeSelect() ||
      !document.querySelector('main:not(#lux-study-rpg-integrated) h3')) return;
    const state = store.getState?.() || {};
    const pet = readPet();
    const native = nativeSelect();
    const key = JSON.stringify({
      year:native?.value, xp:state.xp, level:state.scholarLevel || state.level,
      outfit:state.equippedOutfit, species:pet.species,
      petLevels:pet.petLevels, highestStage:pet.highestStage,
      stats:subjects.map(([id,name]) => {
        const d = subjectData(id,name);return [d.secure,d.due,d.learn,d.practice,d.progress];
      })
    });
    // Some legacy outfit enhancers can replace the displayed sprite without
    // changing the authoritative wardrobe state. Reconcile the visible src
    // even if the rest of Study has not changed; never write saved progress.
    const outfit = safeSlug(state.equippedOutfit || 'day', 'day');
    const expectedScholar = wardrobeOutfits.find(item => item.id === outfit)?.art || '/art/home-rpg/scholar-clean.png';
    if (root.isConnected && key === lastKey) {
      if (scholarImage.getAttribute('src') !== expectedScholar) {
        renderedOutfitSrc = expectedScholar;
        scholarImage.src = expectedScholar;
      }
      return;
    }
    // Rebuild the scene only when *real* app data changes. No saved state is written.
    lastKey=key;
    build();
    if (!root.isConnected) document.body.append(root);
    document.documentElement.classList.add('lux-study-rpg-active');
  }
  function queue(){if(!busy){busy=true;requestAnimationFrame(render);}}
  const observer = new MutationObserver(queue);
  observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  for (const key of ['pushState','replaceState']) {
    const original = history[key];
    history[key] = function (...args) { const result=original.apply(this,args);queue();return result; };
  }
  window.addEventListener('popstate', queue);
  window.addEventListener('pageshow', queue);
  window.addEventListener('lux:app-ready', queue);
  window.addEventListener('storage', queue);
  window.addEventListener('scholar:wardrobe-changed', queue);
  window.addEventListener('scholar:pet-changed', queue);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) queue(); });
  store.subscribe?.(queue);
  store.persist?.onFinishHydration?.(queue);
  queue();
}