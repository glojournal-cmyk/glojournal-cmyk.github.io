/* Lux et Labor RPG Home — presentation layer only.
 * Integrates the original App state, never awards credit or edits a daily record.
 * The native Recovery module remains authoritative for dated recovery.
 */
import './home-journey-v2-logic-20261010.js?v=20261010-home-v2';
import './journey-navigation-20261004.js';
import { C as store, B as rewardScenes } from './index-BLVOhKhN.js?v=20261018-mastery2';
import { selectedRewardScene } from './rpg-scene-selection-20261019.js?v=20261019-selected-scene1';
import { petArtUrl } from '/pet/pet-art-hd-20261009.js?v=20261019-baphomet1&ux=20261013-corrections2';

if (!window.__luxRpgLiveHome) {
  window.__luxRpgLiveHome = true;
  if (!document.getElementById('lux-rpg-live-css')) {
    const css = document.createElement('link');
    css.id = 'lux-rpg-live-css';
    css.rel = 'stylesheet';
    css.href = '/assets/home-rpg-live-20261019.css?v=20261019-star-nav4';
    document.head.append(css);
  }
  const root = document.createElement('div');
  root.id = 'lux-rpg-live-home';
  root.className = 'rpg-home-live';
  let originalVisible = false;
  let savedScholar = null;
  let savedCast = null;
  let gardenModal = null;
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

  // Keep React's REAL Recovery controls mounted in its own React tree.
  // CSS displays that existing panel above the RPG scene without reparenting
  // React nodes, replacing answers or touching the learner's saved record.
  function closeGardenModal() {
    gardenModal = null;
    document.documentElement.classList.remove('lux-rpg-recovery-open','lux-rpg-record-open');
    root.querySelectorAll('.rpg-modal-dimmer-live,.rpg-record-modal-live,.rpg-modal-note-live').forEach(node => node.remove());
    document.getElementById('lux-rpg-modal-close')?.remove();
    schedule();
  }
  function modalChrome(label) {
    closeGardenModal();
    const shade = make('div','rpg-modal-dimmer-live');
    shade.addEventListener('click',closeGardenModal);
    root.append(shade);
    const back = make('button','rpg-modal-close-live','×  Back to garden');
    back.id = 'lux-rpg-modal-close';
    back.type = 'button';
    back.setAttribute('aria-label','Close ' + label + ' and return to RPG home');
    back.addEventListener('click',closeGardenModal);
    document.body.append(back);
  }
  function openNativeRecovery() {
    modalChrome('Recovery');
    gardenModal = 'recovery';
    document.documentElement.classList.add('lux-rpg-recovery-open');
    const hint = make('p','rpg-modal-note-live','Checking your saved Recovery tasks…');
    root.append(hint);
    const ensurePanel = attempts => {
      if (gardenModal !== 'recovery' || !onHome()) return;
      const panel = document.getElementById('lux-recovery-quests');
      if (panel) {
        hint.remove();
        panel.hidden = false;
        panel.open = true;
        panel.setAttribute('aria-label','Quest Recovery · choose a date');
        return;
      }
      if (attempts < 120) requestAnimationFrame(() => ensurePanel(attempts + 1));
      else {
        hint.textContent = 'No Recovery tasks are currently available. Your original study records have not changed.';
      }
    };
    ensurePanel(0);
  }
  function openThirtyDayRecord() {
    modalChrome('30-day record');
    gardenModal = 'record';
    document.documentElement.classList.add('lux-rpg-record-open');
    const record = make('section','rpg-record-modal-live');
    record.setAttribute('role','dialog');
    record.setAttribute('aria-modal','true');
    record.setAttribute('aria-label','Your past 30 days');
    record.append(make('h2',null,'Your past 30 days'));
    record.append(make('p','rpg-record-subtitle-live','Saved study records · read only'));
    const state = store.getState?.() || {};
    const list = make('div','rpg-record-list-live');
    for (let age=0;age<30;age++) {
      const date=dayBefore(age), entry=state.dailyLog?.[date], status=todayStatus(state,date);
      const row=make('div','rpg-record-row-live ' + (status || 'unopened'));
      row.append(make('strong',null,date));
      const total=number(entry?.total);
      const done=number(entry?.done);
      const label=status==='done'?'Completed':status==='partial'?'Partly completed':'Not opened';
      row.append(make('span',null,label + (total>0?' · ' + done + '/' + total:'')));
      list.append(row);
    }
    record.append(list);
    root.append(record);
  }
  // Read-only Star Map of recorded Weekly Boss results. Never fabricate a
  // week's stars or grant an award; the game's weeklyBoss engine stays authoritative.
  function openStarMap() {
    modalChrome('Star Map');
    gardenModal = 'star';
    const modal = make('section','rpg-record-modal-live rpg-star-modal-live');
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-label','Star Map · Weekly Boss progress');
    modal.append(make('h2',null,'Star Map'));
    modal.append(make('p','rpg-record-subtitle-live','Weekly Boss · your actual saved results'));
    const record = store.getState?.().weeklyBoss || {};
    const weeks = record.weeks && typeof record.weeks === 'object' ? record.weeks : {};
    const items = Object.entries(weeks)
      .filter(([week,result])=>week && result && typeof result==='object')
      .sort(([a],[b])=>String(b).localeCompare(String(a),undefined,{numeric:true}));
    const list = make('div','rpg-record-list-live rpg-star-list-live');
    if (!items.length) {
      list.append(make('p','rpg-star-empty-live',
        'No Weekly Boss results saved yet. Complete weekly challenges in Play to earn your stars.'));
    }
    for (const [week,result] of items.slice(0,20)) {
      const row = make('div','rpg-record-row-live ' + (result.passed ? 'done' : 'partial'));
      const descriptor = make('div','rpg-star-week-live');
      descriptor.append(make('strong',null,'Week ' + String(week)));
      const detail = [result.subject, result.missionId].filter(Boolean).map(String)[0];
      if (detail) descriptor.append(make('small',null,detail.slice(0,80)));
      const score = Number.isFinite(Number(result.bestScore)) && Number(result.attempts)>0
        ? ' · Best ' + Math.min(100,Math.max(0,Number(result.bestScore))) + '%' : '';
      const status = result.passed ? '★ Completed' : 'In progress';
      const outcome = make('span',null,status+score);
      row.append(descriptor,outcome);
      if (result.reward?.name) {
        row.append(make('small','rpg-star-reward-live','Reward: '+String(result.reward.name).slice(0,80)));
      }
      list.append(row);
    }
    modal.append(list);
    root.append(modal);
  }

  function openGardenSettings() {
    modalChrome('Settings');
    gardenModal='settings';
    const dialog=make('section','rpg-record-modal-live rpg-settings-modal-live');
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','Scholar Settings');
    dialog.append(make('h2',null,'Settings'));
    dialog.append(make('p','rpg-record-subtitle-live','Your existing Scholar preferences · saved automatically'));
    const toggles=make('div','rpg-settings-toggles-live');
    const options=[
      ['Sound effects','sound','setSound'],
      ['Background music','music','setMusic'],
      ['Notifications','notifications','setNotifications']
    ];
    for (const [title,key,setter] of options){
      const button=make('button','rpg-settings-option-live');
      button.type='button';
      const update=()=>{
        const active=!!store.getState?.()[key];
        button.textContent=title + ' · ' + (active?'On':'Off');
        button.setAttribute('aria-pressed',String(active));
      };
      button.addEventListener('click',()=>{
        const current=store.getState?.() || {};
        if(typeof current[setter]==='function')current[setter](!current[key]);
        update();
      });
      update();toggles.append(button);
    }
    dialog.append(toggles);
    const backup=make('button','rpg-settings-backup-live','Save progress & backup');
    backup.type='button';
    backup.addEventListener('click',()=>{
      const data=store.getState?.().exportProgress?.();
      if(typeof data!=='string'||!data.length)return;
      const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
      const a=make('a');a.href=url;a.download='lux-progress-'+dayBefore(0)+'.json';
      document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1200);
    });
    dialog.append(backup);
    root.append(dialog);
  }
  function nativePanel(kind) {
    if (kind === 'recovery') { openNativeRecovery(); return; }
    if (kind === 'record') { openThirtyDayRecord(); return; }
    if (kind === 'star') { openStarMap(); return; }
    // The RPG Home must never drop through to the old React Home.
    // Unsupported native-only controls show an honest in-scene message.
    if (kind === 'settings') { openGardenSettings(); return; }
    modalChrome(kind || 'Unknown');
    gardenModal = 'unavailable';
    root.append(make('p','rpg-modal-note-live','This panel is not available in the RPG Home yet.'));
    return;
    // Deprecated old-home fallback (unreachable):
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
        if (typeof window.__luxOpenDailyRecord === 'function') {
          window.__luxOpenDailyRecord();
          return;
        }
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
    // Isolate quest labels from native Home link/button decorators.
    const a = make('div',row.href ? 'rpg-task-live' : 'rpg-task-live rpg-task-unavailable');
    if (row.href) {
      a.setAttribute('role','link');
      a.tabIndex = 0;
      a.addEventListener('click', () => location.assign(row.href));
      a.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();location.assign(row.href);
        }
      });
    }
    if (row.done) a.classList.add('complete');
    const label = row.target === '' ? String(row.progress) : `${row.progress}/${row.target}`;
    a.setAttribute('aria-label',row.title+' · '+label);
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
    const scene = selectedRewardScene(state, rewardScenes);
    // Use the same equipped reward as Scholar and Garden, never a hardcoded scene.
    root.style.backgroundImage = 'url("' + scene.art + '")';
    root.style.backgroundPosition = scene.focus;
    root.dataset.equippedScene = scene.id;
    // Coordinate colour temperature with the actual reward art. No user settings
    // or owned backgrounds are changed; this affects sprite presentation only.
    const nightScenes = new Set(['chem-lab','sports-hall','boss-moon-garden']);
    const coldScenes = new Set(['bio-lab']);
    root.dataset.sceneMood = coldScenes.has(scene.id) ? 'cool' : nightScenes.has(scene.id) ? 'night' : 'warm';
    // Keep successful image elements mounted across frequent store updates.
    // Rebuilding the <img> on every update cancels decoding on iPad WebKit.
    for(const child of [...root.children]){
      if(child !== savedCast)child.remove();
    }
    const darken = make('div','rpg-shade-live');
    const world = make('section','rpg-world-live');
    const hud = make('div','rpg-hud-live'); // Not a native header: avoid lux-theme's automatic toolbar injection.
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
    hud.append(face,stats);
    // Keep exactly one functional 30-day button in the stable Scholar HUD.
    const days = make('button','rpg-days-live');
    days.type = 'button';
    days.setAttribute('aria-label','Open your past 30-day study record');
    days.append(make('span','rpg-days-icon-live','▣'),make('span',null,'30 days'));
    days.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openThirtyDayRecord();});
    // Button is a top-level overlay, above both RPG world and the quest rail.
    world.append(hud);
    const sceneLink = make('a','rpg-scene-picker-live','Scene: ' + scene.name + ' · Change');
    sceneLink.href = '/scholar';
    sceneLink.setAttribute('aria-label', 'Change your equipped background reward in Scholar');
    world.append(sceneLink);
    // The original Companion reward picker belongs to the existing app.
    // Open that picker directly from the RPG Home, without sending the player
    // to the hidden legacy Home or duplicating reward goal save logic.
    const goalControl=make('button','rpg-goal-control-live','Reward goal');
    goalControl.type='button';
    goalControl.setAttribute('aria-label','Choose or change your companion reward goal');
    goalControl.addEventListener('click',()=>{
      const nativeChoose=document.querySelector('#chosen-reward-goal [data-choose]');
      if(nativeChoose) nativeChoose.click();
      else goalControl.textContent='Reward goal loading…';
    });
    world.append(goalControl);
    const cast = savedCast || make('div','rpg-cast-live');
    savedCast = cast;
    // Transparent sprites need floor anchors, not flex alignment.
    // Offsets are presentation-only and keyed to the player's equipped reward.
    const floorPresets = {
      dusk:[49,63,8.5],classroom:[49,62,8],courtyard:[49,63,8],
      garden:[49,63,8],'library-hall':[49,63,9],
      'dusk-court':[49,63,8],'form-room':[49,63,8],
      conservatory:[49,63,8.5],fountain:[49,63,8],
      'chem-lab':[49,63,8],'bio-lab':[49,63,8],
      'phys-lab':[50,63,8],'sports-hall':[50,63,8],
      'herb-walk':[49,63,8],'boss-moon-garden':[49,63,8],
      'boss-grand-library':[50,63,8.5],'boss-observatory':[50,63,8]
    };
    const [scholarX, petX, floor] = floorPresets[scene.id] || floorPresets.dusk;
    cast.style.setProperty('--rpg-scholar-x', scholarX + '%');
    cast.style.setProperty('--rpg-pet-x', petX + '%');
    cast.style.setProperty('--rpg-ground', floor + '%');
    cast.dataset.sceneGround = scene.id;
    // Only the transparent Moss sprite has padding below the feet; use a
    // tiny optical adjustment without moving its actual floor anchor.
    cast.dataset.petSprite = safeImage(petState().species || 'moss-hornling','moss-hornling');
    const scholar = savedScholar || document.createElement('img');
    savedScholar = scholar;
    scholar.className='rpg-scholar-live';
    scholar.alt='Scholar character';
    scholar.loading='eager';
    scholar.decoding='async';
    const validOutfits=new Set(['day','base','beret','blazer','breton','cafe','cardigan','cloak','denim','head','hoodie','knit','latin','laurel','mac','pe','pinafore','rugby','stola','summer','track','tricolore','winter']);
    const outfit=String(state.equippedOutfit || 'day');
    const sprite=validOutfits.has(outfit)?'/art/doll/'+outfit+'.png':'/art/doll/day.png';
    const fallbacks=['/art/home-rpg/scholar-clean.png?v=20261019-ipad-safe2','/art/doll/day.png?v=20261019-ipad-safe2'];
    scholar.onerror=()=>{
      const index=Number(scholar.dataset.fallbackIndex || '-1')+1;
      scholar.dataset.fallbackIndex=String(index);
      if(index<fallbacks.length)scholar.src=fallbacks[index];
    };
    if(scholar.dataset.outfitSource!==sprite){
      scholar.dataset.outfitSource=sprite;
      scholar.dataset.fallbackIndex='-1';
      scholar.src=sprite;
    }
    const pet = petState();
    const species = safeImage(pet.species || 'moss-hornling','moss-hornling');
    const petLink = make('a','rpg-pet-live');petLink.href='/pet/'; petLink.setAttribute('aria-label','Open companion');
    const creature = document.createElement('img');creature.alt='Companion';
    const stage = Number(pet.petLevels?.[species] || pet.highestStage) || 1;
    creature.src = petArtUrl(species, stage);
    petLink.append(creature);
    // Reuse the image node, but update the companion and its link safely.
    cast.replaceChildren(scholar,petLink);world.append(cast);

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
    if (progress.ready && progress.next?.href) {
      const next = progress.next;
      const action = make('button','rpg-continue-live');
      action.type = 'button';
      action.setAttribute('aria-label',next.title+' · '+next.subtitle);
      action.append(
        make('strong',null,next.kind === 'resume' ? 'Resume saved question →' :
          next.kind === 'complete' ? 'Visit garden →' : 'Continue next task →'),
        make('span',null,next.subtitle)
      );
      action.addEventListener('click',() => location.assign(next.href));
      panel.append(action);
    }
    // Read-only progress dots live outside the scrollable quest list, fixed to the rail.
    const timeline=make('div','rpg-days-timeline-live');
    timeline.append(make('span','rpg-timeline-label-live','Last 30 days'));
    const dots=make('span','rpg-dots-live');
    for(let age=29;age>=0;age--){const dot=make('i',todayStatus(state,dayBefore(age)));dot.title=dayBefore(age);dots.append(dot);}
    timeline.append(dots);
    const orbs=make('div','rpg-orbs-live');
    // Avoid displaying an invented 0/4 or borrowing an old week's score.
    const starLabel='View'; // Native Star Map owns the current weekly progress.
    orb(orbs,'/art/home-rpg/shield-starmap.png','Star map',starLabel,()=>nativePanel('star'));
    orb(orbs,'/art/home-rpg/shield-cardigan.png','Cardigan','Next',()=>location.assign('/scholar'));
    // The native engine alone decides eligibility, including never-opened days.
    orb(orbs,'/art/home-rpg/shield-recovery.png','Recovery','Review',()=>nativePanel('recovery'));
    rail.append(panel,timeline,orbs);

    const nav=make('div','rpg-nav-live');nav.setAttribute('role','navigation');nav.setAttribute('aria-label','Home navigation');
    for(const [label,href] of [['Home','/'],['Study','/study'],['Play','/play'],['Garden','/garden'],['Pet','/pet/'],['Assessment','/assessment/'],['Recovery',null],['Settings',null],['Scholar','/scholar']]) {
      const item = href ? make('a',label==='Home'?'on':'',label) : make('button',null,label);
      if (href) item.href = href;
      else {item.type='button';item.addEventListener('click',()=>nativePanel(label === 'Settings' ? 'settings' : 'recovery'));}
      nav.append(item);
    }
    root.append(darken,world,cast,rail,nav,days);
  }
  function repaint(){
    scheduled = false;
    // Pages restored from iPad WebKit back-forward cache may miss the ready event.
    ready = ready || !!window.__luxAppReady;
    if (!onHome() || !ready) {
      if (!onHome()) { originalVisible = false; closeGardenModal(); }
      root.remove();document.documentElement.classList.remove('lux-rpg-live-active');return;
    }
    if (!root.isConnected) document.body.append(root);
    // Always re-enable the RPG shell after WebKit page-cache restoration.
    if (gardenModal) return; // Never destroy an open native Recovery dialogue.
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
  window.addEventListener('popstate',()=>{originalVisible=false;closeGardenModal();schedule();});
  window.addEventListener('keydown',event=>{
    if (event.key==='Escape' && gardenModal) { event.preventDefault();closeGardenModal(); }
  });
  window.addEventListener('lux:app-ready',()=>{ready=true;schedule();});
  window.addEventListener('pageshow',schedule);
  window.addEventListener('storage',schedule);
  window.addEventListener('scholar:pet-changed',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule();});
  store.subscribe?.(schedule);
  store.persist?.onFinishHydration?.(schedule);
  schedule();
}
