/* Lux et Labor Play Hall — read-only RPG presentation.
 * Production presentation: never changes scores, XP, quest or unlocking state.
 * All 17 native /play/:game routes remain the only game implementations.
 */
import {C as store} from './index-BLVOhKhN.js?v=20261018-mastery2';

const PREVIEW_PARAM = 'playHallPreview';
const GAME_LIST = Object.freeze([
 ['verbum-match','Verbum Match','language'],
 ['sentence-mosaic','Sentence Mosaic','language'],
 ['phrase-mosaic','Phrase Mosaic','language'],
 ['mot-match','Mot Match','language'],
 ['dictation-dash','Dictation Dash','language'],
 ['word-match','Word Match','language'],
 ['organelle-match','Organelle Match','science'],
 ['element-match','Element Match','science'],
 ['force-match','Force Match','science'],
 ['pe-circuit','PE Circuit','science'],
 ['forma-forge','Forma Forge','puzzle'],
 ['manuscript','Manuscript Mystery','puzzle'],
 ['case-locker','Case Locker','puzzle'],
 ['error-hunter','Error Hunter','puzzle'],
 ['sixty-blitz','Sixty Blitz','challenge'],
 ['weekly-boss','Weekly Boss','challenge'],
 ['runway-check','Runway Check','challenge']
]);
const CATEGORIES = Object.freeze([
 {id:'language',title:'Language Workshop',subject:'Latin / French / English',desc:'Words, grammar and puzzles to build your language skills.',icon:'book',cover:'/art/games/match.jpg'},
 {id:'science',title:'Science Laboratory',subject:'Biology / Chemistry / Physics / PE',desc:'Explore the natural world through fun challenges.',icon:'flask',cover:'/art/games/element.jpg'},
 {id:'puzzle',title:'Puzzle Chamber',subject:'Logic / Memory / Thinking',desc:'Sharpen your mind with puzzles and mysteries.',icon:'puzzle',cover:'/art/games/manuscript.jpg'},
 {id:'challenge',title:'Challenge Tower',subject:'Timed / Mixed Challenges',desc:'Take on quick challenges and special events.',icon:'trophy',cover:'/art/scenes/scene-01.jpg'}
]);
const NAV = [
 ['home','Home','/'],['book','Study','/study/'],['game','Play','/play/'],
 ['sprout','Garden','/garden'],['paw','Pet','/pet/'],['scroll','Assessment','/assessment/'],['scholar','Scholar','/scholar']
];
// Standalone Play route by default; ?playHallPreview=0 opens unchanged native Play.
if (!window.__luxPlayHallPreviewMounted && /^\/play\/?$/.test(location.pathname) &&
    new URLSearchParams(location.search).get(PREVIEW_PARAM)!=='0') {
  window.__luxPlayHallPreviewMounted=true;
  const css=document.createElement('link');
  css.rel='stylesheet';css.id='lux-play-hall-preview-style';
  css.href='/assets/play-hall-preview-20261020.css?v=20261020-full-list2';document.head.append(css);
  const root=document.createElement('div');root.id='lux-play-hall-preview';root.className='lux-play-hall';
  root.setAttribute('aria-label','The Enchanted Game Hall');
  let currentGroup=null,modalOpen=false,previousFocus=null,lastSignature=null,scheduled=false;
  const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
  const safeOutfit=s=>/^[a-z0-9-]+$/i.test(String(s||''))?String(s):'day';
  const glyph=name=>{
    const paths={
      book:'<path d="M3 4.5C7 3 10 4 12 6v14c-3-2-6-3-9-2V4.5Zm18 0c-4-1.5-7-.5-9 1.5v14c3-2 6-3 9-2V4.5Z"/>',
      flask:'<path d="M9 3h6m-5 0v7l-5.5 8a2 2 0 0 0 1.6 3h11.8a2 2 0 0 0 1.6-3L14 10V3M7 16h10"/>',
      puzzle:'<path d="M8 3h4v3a2 2 0 1 0 4 0V3h5v6h-3a2 2 0 1 0 0 4h3v8h-6v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3h5"/>',
      trophy:'<path d="M7 3h10v7a5 5 0 0 1-10 0V3ZM7 6H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-5 1h10"/>',
      home:'<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3V10Z"/>',
      game:'<path d="M6 8h12a4 4 0 0 1 4 4l-1 6a3 3 0 0 1-5 1l-2-2H10l-2 2a3 3 0 0 1-5-1l-1-6a4 4 0 0 1 4-4Zm0 4h5m-2.5-2.5v5M16 11h.1m2 3h.1"/>',
      sprout:'<path d="M12 21V9M12 14c-6 1-9-2-9-7 6 0 9 2 9 7Zm0-4c0-5 3-7 9-7 0 5-3 8-9 7Z"/>',
      paw:'<path d="M8 12c-3 0-5 3-4 5 1 3 3 3 6 2l2-1 2 1c3 1 5 1 6-2 1-2-1-5-4-5m-9-4h.1m5-2h.1m5 2h.1"/>',
      scroll:'<path d="M6 3h13v14H7V5a2 2 0 0 0-4 0v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3H7m3-9h6m-6 4h6"/>',
      scholar:'<path d="m3 9 9-5 9 5-9 5-9-5Zm4 3v5c3 3 7 3 10 0v-5m4-3v7"/>',
      grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      x:'<path d="M5 5 19 19M19 5 5 19"/>'
    };
    const el=make('span','lux-play-icon');el.setAttribute('aria-hidden','true');
    el.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.grid}</svg>`;
    return el;
  };
  const gamePoints=(state,id)=>{
    const v=Number(state?.games?.[id]?.points);
    return Number.isFinite(v)&&v>0?v:0;
  };
  const navCard=(id,name)=>{const a=make('a','lux-play-hall-nav-link'+(id==='game'?' active':''));a.href=id==='game'?'/play/':NAV.find(x=>x[0]===id)?.[2]||'/';a.append(glyph(id),make('span',null,name));if(id==='game')a.setAttribute('aria-current','page');return a;};
  const action=(id,name)=>{const a=make('a','lux-play-hall-game-chip',name);a.href=`/play/${id}`;a.setAttribute('aria-label',`Play ${name}`);return a;};
  const openModal=id=>{currentGroup=id;modalOpen=true;previousFocus=document.activeElement;render(true);const btn=root.querySelector('.lux-play-hall-dialog-close');btn?.focus();};
  const closeModal=()=>{currentGroup=null;modalOpen=false;render(true);(previousFocus?.isConnected?previousFocus:root.querySelector('.lux-play-hall-all-games'))?.focus();};
  const modal=(state)=>{
    const scrim=make('div','lux-play-hall-scrim');scrim.addEventListener('click',e=>{if(e.target===scrim)closeModal();});
    const panel=make('section','lux-play-hall-dialog');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',currentGroup?CATEGORIES.find(c=>c.id===currentGroup)?.title:'All games');
    const header=make('header','lux-play-hall-dialog-header');const h=make('h2',null,currentGroup?CATEGORIES.find(c=>c.id===currentGroup)?.title:'All Games');
    const close=make('button','lux-play-hall-dialog-close');close.type='button';close.setAttribute('aria-label','Close games list');close.append(glyph('x'));close.addEventListener('click',closeModal);header.append(h,close);panel.append(header);
    const groups=currentGroup?CATEGORIES.filter(c=>c.id===currentGroup):CATEGORIES;
    const list=make('div','lux-play-hall-dialog-list');
    for(const category of groups){const section=make('section','lux-play-hall-dialog-group');section.append(make('h3',null,category.title));const tiles=make('div','lux-play-hall-dialog-grid');
      for(const [id,name] of GAME_LIST.filter(game=>game[2]===category.id)){
        const a=make('a','lux-play-hall-dialog-game');a.href=`/play/${id}`;a.append(make('span',null,name),make('small',null,`${gamePoints(state,id)} pts`));tiles.append(a);
      }
      section.append(tiles);list.append(section);
    }
    panel.append(list);scrim.append(panel);return scrim;
  };
  function render(force=false){
    scheduled=false;
    if(!/^\/play\/?$/.test(location.pathname) || new URLSearchParams(location.search).get(PREVIEW_PARAM)==='0'){
      root.remove();document.documentElement.classList.remove('lux-play-hall-active');return;
    }
    if(!window.__luxAppReady || !document.querySelector('main'))return;
    const state=store.getState?.()||{};
    const outfit=safeOutfit(state.equippedOutfit||'day');
    const signature=JSON.stringify({outfit,xp:state.xp,level:state.scholarLevel||state.level,groups:GAME_LIST.map(g=>gamePoints(state,g[0])),modal:modalOpen?currentGroup||'all':'closed'});
    if(!force && signature===lastSignature && root.isConnected)return;
    lastSignature=signature;
    root.replaceChildren();
    root.append(make('div','lux-play-hall-shade'));
    const banner=make('div','lux-play-hall-brand');banner.append(make('span','lux-play-hall-compass','✧'));
    const brandText=make('div');brandText.append(make('strong',null,'Lux et Labor'),make('span',null,'PLAY'),make('small',null,'THE ENCHANTED GAME HALL'));banner.append(brandText);root.append(banner);
    const girl=make('img','lux-play-hall-scholar');girl.alt='Your equipped Scholar, standing';girl.decoding='async';girl.src=outfit==='day'?'/art/home-rpg/scholar-clean.png':`/art/doll/${outfit}.png`;
    girl.onerror=()=>{if(!girl.dataset.fallback){girl.dataset.fallback='1';girl.src='/art/home-rpg/scholar-clean.png';}};
    root.append(girl);
    const summary=make('div','lux-play-hall-hud');summary.append(make('strong',null,`Lv ${Math.max(1,Number(state.scholarLevel||state.level)||1)}`),make('span',null,`★ ${Math.max(0,Number(state.xp)||0)} XP`));root.append(summary);
    const board=make('div','lux-play-hall-board');
    const grid=make('div','lux-play-hall-grid');
    for(const cat of CATEGORIES){
      const games=GAME_LIST.filter(x=>x[2]===cat.id);
      const card=make('section','lux-play-hall-card');card.style.setProperty('--hall-card-art',`url("${cat.cover}")`);
      const body=make('div','lux-play-hall-card-main');
      const title=make('div','lux-play-hall-card-title');title.append(glyph(cat.icon),make('div',null,cat.title));body.append(title);
      body.append(make('p','lux-play-hall-card-subject',cat.subject));
      body.append(make('p','lux-play-hall-card-description',cat.desc));
      const chips=make('div','lux-play-hall-pills');
      // Show every real game as a tappable chip, not only the first three.
      // The same GAME_LIST supplies the category total and All Games dialog.
      games.forEach(([id,name])=>chips.append(action(id,name)));
      body.append(chips);card.append(body);
      const foot=make('div','lux-play-hall-card-footer');foot.append(make('span',null,`${games.length} Games`));
      const total=games.reduce((n,x)=>n+gamePoints(state,x[0]),0);
      foot.append(make('span',null,`${total.toLocaleString('en-GB')} earned pts`));
      const button=make('button','lux-play-hall-open','›');button.type='button';button.setAttribute('aria-label',`Browse ${cat.title} games`);button.addEventListener('click',()=>openModal(cat.id));foot.append(button);card.append(foot);grid.append(card);
    }
    board.append(grid);
    const all=make('button','lux-play-hall-all-games');all.type='button';all.append(glyph('grid'));
    const label=make('span','lux-play-hall-all-label');label.append(make('strong',null,'All Games'),make('span',null,'Browse every original game'));all.append(label);
    all.append(make('span','lux-play-hall-total',`${GAME_LIST.length} Games`),make('span','lux-play-hall-arrow','›'));
    all.addEventListener('click',()=>openModal(null));board.append(all);
    root.append(board);
    const nav=make('div','lux-play-hall-nav');nav.setAttribute('role','navigation');nav.setAttribute('aria-label','Primary');NAV.forEach(([id,n])=>nav.append(navCard(id,n)));root.append(nav);
    if(modalOpen)root.append(modal(state));
    if(!root.isConnected)document.body.append(root);
    document.documentElement.classList.add('lux-play-hall-active');
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(()=>render());}}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen){e.preventDefault();closeModal();}});
  for(const method of ['pushState','replaceState']){
    const original=history[method];history[method]=function(...args){const r=original.apply(this,args);schedule();return r;};
  }
  window.addEventListener('popstate',schedule);window.addEventListener('pageshow',schedule);window.addEventListener('lux:app-ready',schedule);window.addEventListener('scholar:wardrobe-changed',schedule);
  window.addEventListener('storage',schedule);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  store.subscribe?.(schedule);store.persist?.onFinishHydration?.(schedule);
  schedule();
}