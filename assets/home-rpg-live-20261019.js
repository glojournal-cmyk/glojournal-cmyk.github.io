/* Lux et Labor RPG Home — presentation layer only.
 * Integrates the original App state, never awards credit or edits a daily record.
 * The native Recovery module remains authoritative for dated recovery.
 */
import './home-journey-v2-logic-20261010.js?v=20261010-home-v2';
import './journey-navigation-20261004.js';
import { C as store } from './index-BLVOhKhN.js?v=20261018-mastery2';

if (!window.__luxRpgLiveHome) {
  window.__luxRpgLiveHome = true;
  const root = document.createElement('div');
  root.id = 'lux-rpg-live-home';
  root.className = 'rpg-home-live';
  let originalVisible = false;
  let scheduled = false;
  let ready = !!window.__luxAppReady;

  const make = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value != null) node.textContent = String(value);
    return node;
  };
  const path = () => location.pathname.replace(/\/$/, '') || '/';
  const onHome = () => path() === '/' || path() === '/index.html';
  const number = v => Math.max(0, Number(v) || 0);
  const safeImage = (value, fallback) => /^[a-z\d-]+$/i.test(String(value)) ? String(value) : fallback;
  const localDay = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'
  }).format(date);
  const dayBefore = delta => {
    const d = new Date(`${localDay()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - delta);
    return d.toISOString().slice(0,10);
  };
  const modelFor = state => {
    try {
      return window.LuxHomeJourneyV2Logic?.homeJourney(state, window.LuxJourney, localStorage) || { ready:false, count:0, total:10, rows:[] };
    } catch { return { ready:false, count:0, total:10, rows:[] }; }
  };
  const petState = () => {
    try { return JSON.parse(localStorage.getItem('lux-pet-companion-v1') || '{}') || {}; }
    catch { return {}; }
  };
  const todayStatus = (state, date) => {
    const row = state.dailyLog?.[date];
    if (row?.complete || (row?.total > 0 && row?.done >= row?.total)) return 'done';
    if (row?.tasks?.some(task => number(task.progress) > 0 || task.done) ||
        state.formalAttemptLog?.some(a => a.day === date || a.recoveryFor === date)) return 'partial';
    return '';
  };
  const recoveryCount = state => {
    // This is NOT the number of tasks available. Only the native Recovery
    // module calculates eligible tasks, which depend on saved evidence.
    const dates = [dayBefore(1), dayBefore(2)];
    return dates.filter(date => state.dailyLog?.[date]?.tasks?.some(t => !t.done && number(t.progress) < number(t.target))).length;
  };
  function nativePanel(kind) {
    // Show the real, existing React Home rather than imitating answer-credit UI.
    originalVisible = true;
    root.classList.add('show-native');
    document.documentElement.classList.remove('lux-rpg-live-active');
    root.replaceChildren();
    const back = make('button', 'rpg-return', '← Back to garden home');
    back.type = 'button';
    back.addEventListener('click', () => { originalVisible = false; repaint(); });
    root.append(back);
    queueMicrotask(() => {
      if (kind === 'recovery') {
        const panel = document.getElementById('lux-recovery-quests');
        if (panel) { panel.hidden = false; panel.open = true; panel.scrollIntoView({block:'center',behavior:'smooth'}); }
        else {
          back.insertAdjacentElement('afterend', make('p','rpg-native-hint','Recovery is still loading. Use the Recovery section on the original Home.'));
        }
      } else if (kind === 'record') {
        const candidates = [...document.querySelectorAll('main button,main a')];
        const record = candidates.find(e => /30.day|daily.record|past.30|calendar/i.test(e.textContent.trim() + ' ' + (e.getAttribute('aria-label') || '')));
        if (record) record.click();
        else back.insertAdjacentElement('afterend',make('p','rpg-native-hint','Open your original 30-day record below. Historical records have not been changed.'));
      } else if (kind === 'settings') {
        const settings = [...document.querySelectorAll('main button,header button,aside button,nav button')].find(e => /^settings$/i.test((e.textContent || '').trim()) || /^settings$/i.test(e.getAttribute('aria-label') || ''));
        if (settings) settings.click();
        else back.insertAdjacentElement('afterend',make('p','rpg-native-hint','Use the settings controls on the original home page.'));
      } else if (kind === 'star') {
        back.insertAdjacentElement('afterend',make('p','rpg-native-hint','Use the original weekly Star Map on this page, if available. Its saved progress is not recreated by this design.'));
      }
    });
  }
  function stat(parent, label, value, fraction, tip) {
    const line = make('div','rpg-stat'); line.title = tip;
    line.append(make('span','rpg-stat-label',label));
    const track = make('i','rpg-stat-track');
    const fill = make('span','rpg-stat-fill');
    fill.style.width = Math.max(0, Math.min(100, fraction * 100)) + '%';
    track.append(fill); line.append(track, make('strong','rpg-stat-value',value)); parent.append(line);
  }
  function task(parent, row, icon) {
    const a = row.href ? make('a','rpg-task-live') : make('div','rpg-task-live rpg-task-unavailable');
    if (row.href) a.href = row.href;
    if (row.done) a.classList.add('complete');
    const label = row.target === '' ? String(row.progress) : `${row.progress}/${row.target}`;
    a.append(make('span','rpg-task-icon',row.done ? '✓' : icon),make('strong',null,row.title),make('em',null,label));
    parent.append(a);
  }
  function orb(parent, asset, title, label, action) {
    const btn = make('button','rpg-orb-live');btn.type = 'button';btn.addEventListener('click',action);
    const symbol = make('span','rpg-orb-face'); const pic = document.createElement('img');pic.alt='';pic.src=asset;symbol.append(pic);
    symbol.append(make('b','rpg-orb-badge',label));btn.append(symbol,make('span',null,title));parent.append(btn);
  }
  function render(state) {
    const progress = modelFor(state);
    root.replaceChildren();
    const darken = make('div','rpg-shade-live');
    const world = make('section','rpg-world-live');
    const hud = make('header','rpg-hud-live');
    const face = document.createElement('img'); face.alt=''; face.src='/art/scholar-avatar.jpg';
    const stats = make('div','rpg-hud-stats');
    const xp = number(state.xp);
    const mastery = Object.values(state.topicStats || {}).filter(v => v?.state === 'mastered').length;
    const topics = Object.values(state.topicStats || {}).length;
    const body = number(state.peSessions);
    const level = Number(state.scholarLevel || state.level);
    stats.append(make('div','rpg-level',Number.isInteger(level) && level > 0 ? `Lv ${level}` : 'SCHOLAR'));
    stat(stats,'MIND',mastery,topics ? mastery/topics : 0,'Mastered topics / topics with saved statistics');
    stat(stats,'BODY',body,Math.min(body/10,1),'Recorded PE sessions (bar caps at 10)');
    stat(stats,'SPARK',xp,(xp % 1000)/1000,'Scholar XP · progress bar is illustrative only');
    hud.append(face,stats);world.append(hud);
    const cast = make('div','rpg-cast-live');
    const scholar = document.createElement('img');
    scholar.className='rpg-scholar-live';scholar.alt='Scholar';
    const outfit = safeImage(state.equippedOutfit || 'day','day');
    scholar.src = outfit === 'day' ? '/art/home-rpg/scholar-clean.png' : `/art/doll/${outfit}.png`;
    const pet = petState();
    const species = safeImage(pet.species || 'moss-hornling','moss-hornling');
    const petLink = make('a','rpg-pet-live');petLink.href='/pet/'; petLink.setAttribute('aria-label','Open companion');
    const creature = document.createElement('img');creature.alt='Companion';
    creature.src = species === 'moss-hornling' ? '/art/rpg/moss.png' : `/art/doll/companion-${species}.webp`;
    petLink.append(creature);cast.append(scholar,petLink);world.append(cast);

    const rail = make('aside','rpg-rail-live');
    const panel = make('section','rpg-quests-live'); panel.setAttribute('aria-label',"Today's quests");
    panel.append(make('p','rpg-kicker-live','SCHOOL'));
    task(panel,{title:'Biology · cell structure test',progress:'2 Nov',target:'',href:'/assessment/'},'▣');
    task(panel,{title:'Assessment papers & notes',progress:'Open',target:'',href:'/assessment/'},'▣');
    panel.append(make('p','rpg-kicker-live',`RAISE YOUR SCHOLAR · ${progress.ready ? progress.count : '–'}/${progress.total || 10}`));
    panel.append(make('h1',null,"Today's quests"));
    if (progress.ready) {
      for (const row of progress.rows) task(panel,row,/vocab/i.test(row.title) ? '⚑' : '▣');
    } else {
      panel.append(make('p','rpg-loading-live',"Waiting for today's official ten-task plan…"));
      const link = make('a','rpg-open-study-live','Open Study →');link.href='/study';panel.append(link);
    }
    const days = make('button','rpg-days-live');days.type='button';days.setAttribute('aria-label','Open original 30-day record');
    days.append(make('span',null,'30 days'));
    const dots=make('span','rpg-dots-live');
    for(let age=29;age>=0;age--){const dot=make('i',todayStatus(state,dayBefore(age)));dot.title=dayBefore(age);dots.append(dot);}
    days.append(dots);days.addEventListener('click',()=>nativePanel('record'));panel.append(days);
    const orbs=make('div','rpg-orbs-live');
    // Avoid displaying an invented 0/4 or borrowing an old week's score.
    const starLabel='View'; // Native Star Map owns the current weekly progress.
    orb(orbs,'/art/home-rpg/shield-starmap.png','Star map',starLabel,()=>nativePanel('star'));
    orb(orbs,'/art/home-rpg/shield-cardigan.png','Cardigan','Next',()=>location.assign('/scholar'));
    orb(orbs,'/art/home-rpg/shield-recovery.png','Recovery',recoveryCount(state) ? 'Open' : 'Check',()=>nativePanel('recovery'));
    rail.append(panel,orbs);

    const nav=make('nav','rpg-nav-live');nav.setAttribute('aria-label','Home navigation');
    for(const [label,href] of [['Home','/'],['Study','/study'],['Play','/play'],['Garden','/garden'],['Pet','/pet/'],['Assessment','/assessment/'],['Recovery',null],['Settings',null],['Scholar','/scholar']]) {
      const item = href ? make('a',label==='Home'?'on':'',label) : make('button',null,label);
      if (href) item.href = href;
      else {item.type='button';item.addEventListener('click',()=>nativePanel(label === 'Settings' ? 'settings' : 'recovery'));}
      nav.append(item);
    }
    root.append(darken,world,rail,nav);
  }
  function repaint(){
    scheduled = false;
    if (!onHome() || !ready) {
      if (!onHome()) originalVisible = false;
      root.remove();document.documentElement.classList.remove('lux-rpg-live-active');return;
    }
    if (!root.isConnected) document.body.append(root);
    if (originalVisible) return;
    document.documentElement.classList.add('lux-rpg-live-active');
    root.classList.remove('show-native');
    render(store.getState?.() || {});
  }
  function schedule(){if(!scheduled){scheduled=true;queueMicrotask(repaint);}}
  for(const key of ['pushState','replaceState']) {
    const previous=history[key];
    history[key]=function(){const val=previous.apply(this,arguments);schedule();return val;};
  }
  window.addEventListener('popstate',()=>{originalVisible=false;schedule();});
  window.addEventListener('lux:app-ready',()=>{ready=true;schedule();});
  window.addEventListener('pageshow',schedule);
  window.addEventListener('storage',schedule);
  window.addEventListener('scholar:pet-changed',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule();});
  store.subscribe?.(schedule);
  store.persist?.onFinishHydration?.(schedule);
  schedule();
}
