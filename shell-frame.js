(() => {
  const path = location.pathname;
  if (!path.startsWith("/pet") && !path.startsWith("/assessment")) return;

  const icons = {
    Home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    Study: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    Assessments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
    Play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    Pets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 11c-3.6 0-6.5 2.5-6.5 5.5 0 2.1 1.6 3.5 3.6 3.5 1.2 0 2-.7 2.9-.7s1.7.7 2.9.7c2 0 3.6-1.4 3.6-3.5 0-3-2.9-5.5-6.5-5.5Z"/></svg>',
    Garden: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22V10"/><path d="M12 10c-4-1-6-4-6-8 4 0 7 2 8 6"/><path d="M12 13c3-.5 6-3 7-7-4 0-7 2-8 6"/></svg>',
    Scholar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  };
  const items = [
    ["/", "Home"],
    ["/study", "Study"],
    ["/assessment", "Assessments"],
    ["/play", "Play"],
    ["/pet/", "Pets"],
    ["/garden", "Garden"],
    ["/scholar", "Scholar"],
  ];

  function xpOf() {
    try {
      const raw = JSON.parse(localStorage.getItem("lux-scholar-garden-v1") || "{}");
      const state = raw.state || raw;
      return Math.max(0, Number(state.xp) || 0);
    } catch {
      return 0;
    }
  }
  function levelOf(xp) {
    let left = Math.max(0, xp);
    for (let level = 1; level <= 50; level++) {
      const need = Math.round(120 + (level - 1) * 48 + (level - 1) ** 1.4 * 12);
      if (left < need) return { level, into: left };
      left -= need;
    }
    return { level: 50, into: left };
  }
  function current(href) {
    if (href === "/") return path === "/";
    return path === href || path.startsWith(href.replace(/\/$/, ""));
  }

  function mount() {
    if (document.querySelector(".lux-shell-header")) return;
    document.body.classList.add("lux-shell-on");
    const { level, into } = levelOf(xpOf());
    const header = document.createElement("header");
    header.className = "lux-shell-header";
    header.innerHTML = '<a href="/"><strong>Lux et Labor</strong><small>Raise your scholar</small></a><div class="lux-shell-lv">Lv ' + level + " · " + into + " XP</div>";
    document.body.prepend(header);
    const nav = document.createElement("nav");
    nav.className = "lux-shell-nav";
    nav.setAttribute("aria-label", "Main");
    nav.innerHTML = items.map(([href, label]) => {
      const on = current(href) ? ' aria-current="page"' : "";
      const pet = label === "Pets" ? ' data-pet-nav="true"' : "";
      return '<a href="' + href + '"' + on + pet + ">" + icons[label] + "<span>" + label + "</span></a>";
    }).join("");
    document.body.appendChild(nav);
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
