// Keep daily rows compact and explicit; counting rules remain unchanged.
const glyphs={book:'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4z M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h3z',water:'M12 3S5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12z',play:'M8 5l11 7-11 7z',trophy:'M8 3h8v6a4 4 0 0 1-8 0z M8 5H4v3a4 4 0 0 0 4 4 M16 5h4v3a4 4 0 0 1-4 4 M12 13v7 M8 21h8',review:'M4 11a8 8 0 1 1 2 7 M4 4v7h7',exercise:'M3 8v8 M6 6v12 M18 6v12 M21 8v8 M6 12h12'};
function kindFor(a){const text=(a.textContent+' '+a.getAttribute('href')).toLowerCase();if(/water|plants|tend-garden/.test(text))return['water','water'];if(/play|quick game/.test(text))return['play','play'];if(/exercise|pe-circuit/.test(text))return['play','exercise'];if(/mistake|due review/.test(text))return['mastery','review'];if(/mastery/.test(text))return['mastery','trophy'];const subject=['french','latin','biology','chemistry','english','physics'].find(x=>text.includes(x));return[subject||'latin','book'];}
function hearthShift(day, n) {
 const [y, m, d] = day.split("-").map(Number);
 const date = new Date(y, m - 1, d + n);
 return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}
function hearthStreak(days, today, todayKept) {
 const set = new Set(days);
 let cursor = todayKept ? today : hearthShift(today, -1);
 let n = 0;
 while (set.has(cursor)) { n += 1; cursor = hearthShift(cursor, -1); }
 return n;
}
function hearthLine(streak, todayKept, remaining) {
 if (todayKept) return streak <= 1 ? "Today is kept. Come back tomorrow to make it 2." : "Today is kept. The chain is " + streak + " days. It grows only if tomorrow is finished too.";
 const left = remaining === 1 ? "1 task left." : remaining + " tasks left.";
 return streak > 0 ? left + " Finish them and the chain becomes " + (streak + 1) + "." : left + " Finish them and the chain starts.";
}
const KEPT_KEY = "lux-daily-kept-v1";
function readKept() {
 try {
  const days = JSON.parse(localStorage.getItem(KEPT_KEY) || "[]");
  return Array.isArray(days) ? days.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)) : [];
 } catch { return []; }
}
function syncKept(today, todayKept) {
 const days = readKept();
 const has = days.includes(today);
 if (todayKept && !has) days.push(today);
 if (!todayKept && has) days.splice(days.indexOf(today), 1);
 if (todayKept !== has) {
  try { localStorage.setItem(KEPT_KEY, JSON.stringify([...new Set(days)].sort().slice(-60))); } catch { /* the chain can still show this visit */ }
 }
 return new Set(days);
}
function paintHearth(details) {
 const J = globalThis.LuxJourney;
 if (!J || !details) return;
 const state = J.garden();
 const today = J.day();
 if (!state || state.today !== today) return;
 const rows = (state.daily || []).filter(task => J.safeHref(task.href));
 if (!rows.length) return;
 const finished = rows.filter(task => Number(task.progress) >= Number(task.target));
 const todayKept = finished.length === rows.length;
 const days = syncKept(today, todayKept);
 const streak = hearthStreak(days, today, todayKept);
 const next = rows.find(task => Number(task.progress) < Number(task.target));
 const line = hearthLine(streak, todayKept, rows.length - finished.length);
 const signature = JSON.stringify({ streak, todayKept, line, href: next?.href || "" });
 let card = details.parentElement.querySelector("[data-daily-hearth]");
 if (card?.dataset.signature === signature) return;
 if (!card) {
  card = document.createElement("section");
  card.dataset.dailyHearth = "";
  card.setAttribute("aria-label", "Daily chain");
  details.before(card);
 }
 card.dataset.signature = signature;
 card.replaceChildren();
 const kicker = document.createElement("p");
 kicker.className = "kicker";
 kicker.textContent = "Daily chain";
 const title = document.createElement("h2");
 title.textContent = todayKept ? streak + "-day chain kept" : streak ? streak + "-day chain" : "Start today’s chain";
 const lamps = document.createElement("div");
 lamps.className = "lux-lamps";
 lamps.setAttribute("aria-hidden", "true");
 for (let i = 6; i >= 0; i--) {
  const day = hearthShift(today, -i);
  const mark = document.createElement("i");
  mark.className = days.has(day) ? "is-kept" : day === today ? "is-today" : "";
  lamps.append(mark);
 }
 const copy = document.createElement("p");
 copy.className = "line";
 copy.textContent = line;
 card.append(kicker, title, lamps, copy);
 if (next) {
  const link = document.createElement("a");
  link.href = J.navigationHref(next.href) || "/";
  link.textContent = "Next · " + (next.title || "today’s task");
  card.append(link);
 }
}
function refresh(){if(location.pathname!=='/')return;const summary=[...document.querySelectorAll('main details > summary')].find(x=>/^View today’s \d+ remaining tasks/.test(x.textContent.trim()));if(!summary)return;const list=summary.parentElement.querySelector('ul');if(!list)return;const rows=[...list.querySelectorAll('li > a')].filter(a=>a.querySelector('progress'));if(!rows.length)return;
 paintHearth(summary.parentElement);
 for(const a of rows){a.dataset.dailyTaskRow='';const title=a.querySelector('span.font-medium');if(!title)continue;if(!a.querySelector('.lux-ico')){const[kind,glyph]=kindFor(a),icon=document.createElement('span');icon.className='lux-ico is-'+kind;icon.setAttribute('aria-hidden','true');icon.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${glyphs[glyph]}"/></svg>`;title.prepend(icon)}}
 let help=summary.parentElement.querySelector('[data-daily-counting-help]');if(!help){help=document.createElement('details');help.dataset.dailyCountingHelp='';help.className='daily-counting-help';const s=document.createElement('summary');s.textContent='How tasks count';help.append(s,document.createElement('div'));list.after(help)}
 const rules=rows.map(a=>({title:a.querySelector('span.font-medium')?.textContent,copy:[...a.querySelectorAll(':scope > p')].map(p=>p.textContent).filter(t=>!/(remaining$|^Complete for today$)/.test(t))})),signature=JSON.stringify(rules);if(help.dataset.signature===signature)return;help.dataset.signature=signature;const body=help.querySelector('div');body.replaceChildren();for(const rule of rules){const section=document.createElement('section'),title=document.createElement('strong');title.textContent=rule.title;section.append(title);for(const copy of rule.copy){const p=document.createElement('p');p.textContent=copy;section.append(p)}body.append(section)}}
const css=document.createElement('style');css.textContent='a[data-daily-task-row]>p{display:none!important}a[data-daily-task-row]{padding:12px 8px!important}a[data-daily-task-row] .font-medium{display:inline-flex;align-items:center;gap:10px;min-width:0}a[data-daily-task-row] .lux-ico{flex-shrink:0}.daily-counting-help{margin-top:14px;font-size:13px;color:#53665d}.daily-counting-help>summary{cursor:pointer;min-height:44px;display:flex;align-items:center;gap:8px}.daily-counting-help>summary:before{content:"▸"}.daily-counting-help[open]>summary:before{content:"▾"}.daily-counting-help section{padding:12px 0;border-top:1px solid #d6ddcf}.daily-counting-help p{margin:6px 0;line-height:1.45}.lux-hearth,[data-daily-hearth]{margin:0 0 16px;padding:16px;border:1px solid #d4c6ac;border-radius:18px;background:#fffaf0;color:#173e50}[data-daily-hearth] .kicker{margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a6a32;font-weight:700}[data-daily-hearth] h2{margin:4px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:600}[data-daily-hearth] .lux-lamps{display:flex;gap:8px;margin:12px 0}[data-daily-hearth] .lux-lamps i{width:16px;height:16px;border-radius:50%;border:2px solid #c4b496;background:transparent}[data-daily-hearth] .lux-lamps i.is-kept{background:#173e50;border-color:#173e50}[data-daily-hearth] .lux-lamps i.is-today{border-color:#173e50}[data-daily-hearth] .line{margin:0;font-size:14px;line-height:1.45}[data-daily-hearth] a{display:inline-flex;align-items:center;min-height:44px;margin-top:12px;padding:10px 16px;border-radius:24px;background:#173e50;color:#fffdf6;text-decoration:none}';document.head.append(css);
let queued=false;function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('pageshow',schedule);window.addEventListener('popstate',schedule);schedule();
