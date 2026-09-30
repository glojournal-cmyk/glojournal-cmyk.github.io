(() => {
  const path = location.pathname;
  if (!path.startsWith("/pet") && !path.startsWith("/assessment")) return;
  const icons = {
    Home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 11 8-7 8 7"/><path d="M6 10.5V20h12v-9.5"/></svg>',
    Study: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 19.2A2.2 2.2 0 0 1 6.2 17H20"/><path d="M6.2 3H20v18H6.2A2.2 2.2 0 0 1 4 18.8V5.2A2.2 2.2 0 0 1 6.2 3z"/></svg>',
    Assessments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    Play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 6.2v11.6L18.4 12z"/></svg>',
    Pets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="7.5" cy="8" r="1.6"/><circle cx="16.5" cy="8" r="1.6"/><circle cx="12" cy="5.5" r="1.6"/><path d="M12 10.2c-3.4 0-6.2 2.2-6.2 5.1 0 1.9 1.5 3.2 3.4 3.2 1.1 0 1.9-.6 2.8-.6s1.7.6 2.8.6c1.9 0 3.4-1.3 3.4-3.2 0-2.9-2.8-5.1-6.2-5.1z"/></svg>',
    Garden: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21V10"/><path d="M12 10C8 9 6.2 6.2 6 3c3.6.4 6 2.4 6.8 6.2"/><path d="M12 12.5c3.2-.4 5.8-2.8 6.6-6.5-3.4 0-6 2-6.6 5.5"/></svg>',
    Scholar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.8-3.6 3.4-5.4 7-5.4s6.2 1.8 7 5.4"/></svg>',
  };
  const items = [["/", "Home"],["/study", "Study"],["/assessment", "Assessments"],["/play", "Play"],["/pet/", "Pets"],["/garden", "Garden"],["/scholar", "Scholar"]];
  function xpOf() {
    try {
      const raw = JSON.parse(localStorage.getItem("lux-scholar-garden-v1") || "{}");
      const state = raw.state || raw;
      return Math.max(0, Number(state.xp) || 0);
    } catch { return 0; }
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
      return '<a href="' + href + '"' + on + pet + ">' + icons[label] + '<span>' + label + '</span></a>';
    }).join("");
    document.body.appendChild(nav);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
