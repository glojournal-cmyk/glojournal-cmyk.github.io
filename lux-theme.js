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
  };
  const LABEL_OF = { home: "Home", study: "Study", assessments: "Assessments", play: "Play", pets: "Pets", garden: "Garden", scholar: "Scholar" };
  function labelFromLink(a) {
    const href = (a.getAttribute("href") || "").replace(/\/$/, "") || "/";
    const raw = (a.innerText || "").trim().split("\n")[0].toLowerCase();
    if (LABEL_OF[raw]) return LABEL_OF[raw];
    if (href === "/" || href === "") return "Home";
    if (href.startsWith("/study")) return "Study";
    if (href.startsWith("/assessment")) return "Assessments";
    if (href.startsWith("/play")) return "Play";
    if (href.startsWith("/pet")) return "Pets";
    if (href.startsWith("/garden")) return "Garden";
    if (href.startsWith("/scholar")) return "Scholar";
    return "";
  }
  function swapNavIcons(root) {
    root.querySelectorAll("nav a, aside nav a, .lux-shell-nav a").forEach((a) => {
      const label = labelFromLink(a);
      if (!label || !ICONS[label]) return;
      const svg = a.querySelector("svg");
      if (!svg || svg.dataset.luxIcon) return;
      const wrap = document.createElement("span");
      wrap.innerHTML = ICONS[label];
      const next = wrap.firstChild;
      if (next && next.setAttribute) next.setAttribute("data-lux-icon", label);
      svg.replaceWith(next);
    });
  }
  function classifyTask(text) {
    const t = text.toLowerCase();
    if (t.includes("french")) return { kind: "french", icon: "Book" };
    if (t.includes("latin")) return { kind: "latin", icon: "Book" };
    if (t.includes("water") || t.includes("plant") || t.includes("garden")) return { kind: "water", icon: "Drop" };
    if (t.includes("biology")) return { kind: "biology", icon: "Leaf" };
    if (t.includes("chem")) return { kind: "chemistry", icon: "Flask" };
    if (t.includes("english")) return { kind: "english", icon: "Book" };
    if (t.includes("physics")) return { kind: "physics", icon: "Pen" };
    if (t.includes("play") || t.includes("game")) return { kind: "play", icon: "Game" };
    if (t.includes("mastery")) return { kind: "mastery", icon: "Trophy" };
    if (t.includes("practise") || t.includes("practice")) return { kind: "latin", icon: "Pen" };
    return { kind: "garden", icon: "Leaf" };
  }
  function decorateTasks() {
    const card = document.querySelector(".lux-home-card");
    if (!card) return;
    card.querySelectorAll("a").forEach((a) => {
      if (a.querySelector(".lux-ico")) return;
      const title = (a.innerText || "").replace(/\s+/g, " ").trim();
      if (!title) return;
      const spec = classifyTask(title);
      const ico = document.createElement("span");
      ico.className = "lux-ico is-" + spec.kind;
      ico.innerHTML = ICONS[spec.icon] || ICONS.Book;
      a.prepend(ico);
    });
  }
  function paint() { swapNavIcons(document); decorateTasks(); }
  let ticking = false;
  const mo = new MutationObserver(() => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; paint(); });
  });
  if (document.body) { paint(); mo.observe(document.body, { childList: true, subtree: true }); }
  else document.addEventListener("DOMContentLoaded", () => { paint(); mo.observe(document.body, { childList: true, subtree: true }); });
})();
