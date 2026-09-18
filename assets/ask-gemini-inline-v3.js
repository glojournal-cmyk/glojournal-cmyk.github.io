(() => {
  const PANEL_ID = "scholar-ai-panel";
  const ENDPOINT = "https://glojournal-cmyk-github-io.vercel.app/api/ask-ai";
  let current = null;
  let timer = null;

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect?.();
    return !r || (r.width > 0 && r.height > 0);
  }

  function feedbackHost() {
    const labels = [...document.querySelectorAll("p")]
      .filter((node) => visible(node) && node.textContent?.trim() === "Your answer");
    const label = labels.at(-1);
    if (label) return label.closest("div.mt-5.space-y-3") || label.parentElement?.parentElement?.parentElement;

    const spelling = [...document.querySelectorAll("p")]
      .filter((node) => visible(node) && node.textContent?.includes("Correct spelling:"))
      .at(-1);
    return spelling?.closest("div.mt-5") || spelling?.parentElement || null;
  }

  function cleanWhyDuplicates(host) {
    if (!host) return;
    const whyLabel = [...host.querySelectorAll("p")].find((p) => p.textContent?.trim() === "Why?");
    const box = whyLabel?.parentElement;
    if (!box) return;
    const seen = new Set();
    for (const p of [...box.querySelectorAll(":scope > p")]) {
      if (p === whyLabel) continue;
      const text = p.textContent?.trim();
      if (!text) continue;
      const key = text.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) p.remove();
      else seen.add(key);
    }
  }

  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function cacheKey(payload, action) {
    return "scholar-gemini:" + hash(JSON.stringify({ ...payload, action }));
  }

  function readCache(key) {
    try {
      const item = JSON.parse(sessionStorage.getItem(key) || "null");
      return item?.text || null;
    } catch {
      return null;
    }
  }

  function writeCache(key, text) {
    try { sessionStorage.setItem(key, JSON.stringify({ text, at: Date.now() })); } catch {}
  }

  function makeButton(label, action, payload, status, output) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "min-h-10 rounded-lg bg-card px-3 py-2 text-left text-xs ring-1 ring-line hover:bg-sage disabled:opacity-50";
    button.textContent = label;

    button.addEventListener("click", async () => {
      const key = cacheKey(payload, action);
      const cached = readCache(key);
      output.hidden = false;

      if (cached) {
        status.textContent = "AI explanation";
        output.textContent = cached;
        return;
      }

      for (const node of button.parentElement?.querySelectorAll("button") || []) node.disabled = true;
      status.textContent = "Thinking…";
      output.textContent = "Generating a short explanation…";

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, action }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "AI explanation is unavailable right now.");
        const text = String(data?.explanation || "").trim();
        if (!text) throw new Error("AI returned an empty explanation.");
        writeCache(key, text);
        status.textContent = "AI explanation";
        output.textContent = text;
      } catch (error) {
        status.textContent = error?.name === "AbortError" ? "AI took too long. Try again." : (error?.message || "AI explanation is unavailable right now.");
        output.textContent = "";
        output.hidden = true;
      } finally {
        clearTimeout(timeout);
        for (const node of button.parentElement?.querySelectorAll("button") || []) node.disabled = false;
      }
    });

    return button;
  }

  async function render(payload) {
    const host = feedbackHost();
    if (!host || !payload) return false;
    cleanWhyDuplicates(host);

    document.getElementById(PANEL_ID)?.remove();

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.dataset.geminiInline = "3";
    panel.className = "rounded-lg bg-card p-4 text-sm ring-1 ring-line";

    const kicker = document.createElement("p");
    kicker.className = "text-xs tracking-[0.16em] text-navy uppercase";
    kicker.textContent = "Ask AI";

    const copy = document.createElement("p");
    copy.className = "mt-1 text-sm text-muted";
    copy.textContent = "Optional extra explanation for this exact question. It appears here and never changes the official marking.";

    const buttons = document.createElement("div");
    buttons.className = "mt-3 grid gap-2 sm:grid-cols-2";

    const status = document.createElement("p");
    status.className = "mt-3 text-xs text-muted";
    status.setAttribute("aria-live", "polite");

    const output = document.createElement("div");
    output.hidden = true;
    output.className = "mt-2 whitespace-pre-wrap rounded-lg bg-sage/60 p-3 text-sm leading-relaxed";

    const options = payload.correct
      ? [
          ["Why is this correct?", "why_correct"],
          ["Explain more simply", "simpler"],
          ["Give me one similar example", "similar_example"],
          ["中文解釋", "chinese"],
        ]
      : [
          ["Where did I go wrong?", "where_wrong"],
          ["Explain the rule", "explain_rule"],
          ["Give me one similar example", "similar_example"],
          ["中文解釋", "chinese"],
        ];

    for (const [label, action] of options) {
      buttons.appendChild(makeButton(label, action, payload, status, output));
    }

    const note = document.createElement("p");
    note.className = "mt-3 text-[11px] text-muted";
    note.textContent = "AI can make mistakes. The approved answer and explanation above remain the marking source. No profile or reward data is sent.";

    panel.append(kicker, copy, buttons, status, output, note);

    const whyLabel = [...host.querySelectorAll("p")].find((p) => p.textContent?.trim() === "Why?");
    const whyBox = whyLabel?.parentElement;
    if (whyBox?.nextSibling) host.insertBefore(panel, whyBox.nextSibling);
    else host.appendChild(panel);
    return true;
  }

  function schedule() {
    clearTimeout(timer);
    let tries = 0;
    const run = async () => {
      tries += 1;
      if (current && await render(current)) return;
      if (tries < 15) timer = setTimeout(run, 60);
    };
    timer = setTimeout(run, 0);
  }

  window.addEventListener("scholar:question-answered", (event) => {
    current = event.detail || null;
    schedule();
  });

  window.addEventListener("scholar:question-clear", () => {
    current = null;
    clearTimeout(timer);
    document.getElementById(PANEL_ID)?.remove();
  });

  new MutationObserver(() => {
    const host = feedbackHost();
    if (host) cleanWhyDuplicates(host);
    const panel = document.getElementById(PANEL_ID);
    if (current && (!panel || panel.dataset.geminiInline !== "3")) schedule();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();