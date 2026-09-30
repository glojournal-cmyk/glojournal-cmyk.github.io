(() => {
  const ICONS = {
    Home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 11 8-7 8 7"/><path d="M6 10.5V20h12v-9.5"/></svg>',
    Study: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.2A2.2 2.2 0 0 1 6.2 17H20"/><path d="M6.2 3H20v18H6.2A2.2 2.2 0 0 1 4 18.8V5.2A2.2 2.2 0 0 1 6.2 3z"/></svg>',
    Assessments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    Play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6.2v11.6L18.4 12z"/></svg>',
    Pets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7.5" cy="8" r="1.6"/><circle cx="16.5" cy="8" r="1.6"/><circle cx="12" cy="5.5" r="1.6"/><path d="M12 10.2c-3.4 0-6.2 2.2-6.2 5.1 0 1.9 1.5 3.2 3.4 3.2 1.1 0 1.9-.6 2.8-.6s1.7.6 2.8.6c1.9 0 3.4-1.3 3.4-3.2 0-2.9-2.8-5.1-6.2-5.1z"/></svg>',
    Garden: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21V10"/><path d="M12 10C8 9 6.2 6.2 6 3c3.6.4 6 2.4 6.8 6.2"/><path d="M12 12.5c3.2-.4 5.8-2.8 6.6-6.5-3.4 0-6 2-6.6 5.5"/></svg>',
    Scholar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.8-3.6 3.4-5.4 7-5.4s6.2 1.8 7 5.4"/></svg>',
    Book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.2A2.2 2.2 0 0 1 6.2 17H20"/><path d="M6.2 3H20v18H6.2A2.2 2.2 0 0 1 4 18.8V5.2A2.2 2.2 0 0 1 6.2 3z"/></svg>',
    Drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3s6 6.4 6 11a6 6 0 1 1-12 0c0-4.6 6-11 6-11z"/></svg>',
    Leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 19c8-1 13-7 14-14-7 1-13 6-14 14z"/><path d="M9 15c2-2 4.5-3.5 8-4"/></svg>',
    Flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6M10 3v6L5.6 18.2A2.4 2.4 0 0 0 7.7 21h8.6a2.4 2.4 0 0 0 2.1-2.8L14 9V3"/></svg>',
    Trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 5h8v4a4 4 0 0 1-8 0V5z"/><path d="M8 7H5a3 3 0 0 0 3 4M16 7h3a3 3 0 0 1-3 4M12 13v3M9 21h6"/></svg>',
    Game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6.2v11.6L18.4 12z"/></svg>',
    Pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4l11-11-4-4L4 16v4z"/></svg>',
    Days: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>'
  };
  const LABEL_OF = { home:'Home', study:'Study', assessments:'Assessments', play:'Play', pets:'Pets', garden:'Garden', scholar:'Scholar' };
  function labelFromLink(a) {
    const href = (a.getAttribute('href') || '').replace(/\/$/, '') || '/';
    const raw = (a.innerText || '').trim().split('\n')[0].toLowerCase();
    if (LABEL_OF[raw]) return LABEL_OF[raw];
    if (href === '/' || href === '') return 'Home';
    if (href.startsWith('/study')) return 'Study';
    if (href.startsWith('/assessment')) return 'Assessments';
    if (href.startsWith('/play')) return 'Play';
    if (href.startsWith('/pet')) return 'Pets';
    if (href.startsWith('/garden')) return 'Garden';
    if (href.startsWith('/scholar')) return 'Scholar';
    return '';
  }
  function swapNavIcons(root) {
    root.querySelectorAll('nav a, aside nav a, .lux-shell-nav a').forEach((a) => {
      const label = labelFromLink(a);
      if (!label || !ICONS[label]) return;
      const svg = a.querySelector('svg');
      if (!svg || svg.dataset.luxIcon) return;
      const wrap = document.createElement('span');
      wrap.innerHTML = ICONS[label];
      const next = wrap.firstElementChild;
      if (next) {
        next.setAttribute('data-lux-icon', label);
        next.setAttribute('width', '16');
        next.setAttribute('height', '16');
      }
      svg.replaceWith(next);
    });
  }
  function classifyTask(text) {
    const t = text.toLowerCase();
    if (t.includes('french')) return { kind:'french', icon:'Book' };
    if (t.includes('latin')) return { kind:'latin', icon:'Book' };
    if (t.includes('water') || t.includes('plant') || t.includes('garden')) return { kind:'water', icon:'Drop' };
    if (t.includes('biology')) return { kind:'biology', icon:'Leaf' };
    if (t.includes('chem')) return { kind:'chemistry', icon:'Flask' };
    if (t.includes('english')) return { kind:'english', icon:'Book' };
    if (t.includes('physics')) return { kind:'physics', icon:'Pen' };
    if (t.includes('play') || t.includes('game')) return { kind:'play', icon:'Game' };
    if (t.includes('mastery')) return { kind:'mastery', icon:'Trophy' };
    if (t.includes('practise') || t.includes('practice') || t.includes('review') || t.includes('study')) return { kind:'latin', icon:'Pen' };
    return { kind:'garden', icon:'Leaf' };
  }
  function decorateTasks() {
    Array.from(document.querySelectorAll('a, button')).filter((el) => {
      const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
      return /\d+\s*\/\s*\d+/.test(t) && t.length < 80 && !el.querySelector('.lux-ico');
    }).slice(0, 24).forEach((a) => {
      const spec = classifyTask(a.innerText || '');
      const ico = document.createElement('span');
      ico.className = 'lux-ico is-' + spec.kind;
      ico.innerHTML = ICONS[spec.icon] || ICONS.Book;
      const row = a.querySelector('.flex, [class*="justify-between"]');
      const title = row && row.querySelector('span');
      if (title) {
        title.style.display = 'inline-flex';
        title.style.alignItems = 'center';
        title.style.gap = '10px';
        title.prepend(ico);
      } else if (row) {
        row.prepend(ico);
      } else {
        a.prepend(ico);
      }
    });
  }
  function lineUpIcons() {
    document.querySelectorAll('a > .lux-ico, button > .lux-ico').forEach((ico) => {
      const row = ico.parentElement.querySelector('.flex, [class*="justify-between"]');
      const title = row && row.querySelector('span');
      if (!title || title === ico) return;
      title.style.display = 'inline-flex';
      title.style.alignItems = 'center';
      title.style.gap = '10px';
      title.prepend(ico);
    });
  }
  function readLog() { try { return JSON.parse(localStorage.getItem('lux-day-log-v1') || '{}'); } catch { return {}; } }
  function writeTodayLog() {
    const log = readLog();
    const today = dayKey(new Date());
    const tasks = Array.from(document.querySelectorAll('a, button')).map(el => (el.innerText || '').replace(/\s+/g,' ').trim()).filter(t => /\d+\s*\/\s*\d+/.test(t)).slice(0,12).map(t => {
      const m = t.match(/(\d+)\s*\/\s*(\d+)/);
      return { name: t.replace(/\d+\s*\/\s*\d+.*/, '').trim() || t, done: m && Number(m[1]) >= Number(m[2]) };
    });
    if (tasks.length) { log[today] = { tasks, all: tasks.every(x => x.done) }; localStorage.setItem('lux-day-log-v1', JSON.stringify(log)); }
  }
  function openDays() {
    writeTodayLog();
    let layer = document.getElementById('lux-days');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'lux-days';
      layer.className = 'lux-days';
      layer.innerHTML = '<div class="lux-days-sheet"><h2>Daily record</h2><div class="lux-days-dots"></div><div class="lux-days-list"></div><button class="lux-days-close" type="button">Done</button></div>';
      layer.addEventListener('click', (e) => { if (e.target === layer || e.target.classList.contains('lux-days-close')) layer.classList.remove('is-open'); });
      document.body.appendChild(layer);
    }
    const log = readLog();
    const dots = layer.querySelector('.lux-days-dots');
    const list = layer.querySelector('.lux-days-list');
    dots.innerHTML = '';
    const today = new Date();
    let selected = dayKey(today);
    const keys = [];
    for (let i = 29; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate() - i); keys.push(dayKey(d)); }
    function renderList(key) {
      selected = key;
      const rec = log[key];
      list.innerHTML = '<p style="margin:0 0 8px;font-weight:700">' + key + '</p>';
      if (!rec || !rec.tasks.length) { list.innerHTML += '<p>No record for this day.</p>'; return; }
      rec.tasks.forEach((t) => { list.innerHTML += '<div class="lux-days-row"><span>' + t.name + '</span><span>' + (t.done ? 'Done' : 'Missing') + '</span></div>'; });
    }
    keys.forEach((key) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lux-days-dot' + (log[key] && log[key].all ? ' is-done' : '') + (key === selected ? ' is-on' : '');
      b.title = key;
      b.addEventListener('click', () => { dots.querySelectorAll('.lux-days-dot').forEach(x => x.classList.remove('is-on')); b.classList.add('is-on'); renderList(key); });
      dots.appendChild(b);
    });
    renderList(selected);
    layer.classList.add('is-open');
  }
  function ensureHeaderTools() {
    const header = document.querySelector('header.sticky, header.lux-companion-header, .lux-shell-header');
    if (!header || header.querySelector('[data-lux-tool="days"]')) return;
    const days = document.createElement('button');
    days.type = 'button';
    days.className = 'lux-tool';
    days.dataset.luxTool = 'days';
    days.innerHTML = ICONS.Days + '<span>30 days</span>';
    days.addEventListener('click', openDays);
    header.appendChild(days);
  }
  function paint() { swapNavIcons(document); decorateTasks(); lineUpIcons(); ensureHeaderTools(); writeTodayLog(); }
  let ticking = false;
  const mo = new MutationObserver(() => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; paint(); }); });
  function start() { paint(); mo.observe(document.body, { childList:true, subtree:true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
