const PANEL_ID = "scholar-ai-panel";
const ENDPOINT_KEY = "scholar-ai-endpoint";

function endpoint() {
  if (typeof window === "undefined") return "";
  return String(
    window.__SCHOLAR_AI_ENDPOINT__ ||
    document.querySelector('meta[name="scholar-ai-endpoint"]')?.content ||
    localStorage.getItem(ENDPOINT_KEY) ||
    ""
  ).trim();
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
  return "scholar-ai-cache:" + hash(JSON.stringify({ ...payload, action }));
}

function readCache(key) {
  try {
    const item = JSON.parse(sessionStorage.getItem(key) || "null");
    if (!item?.text) return null;
    return item.text;
  } catch {
    return null;
  }
}

function writeCache(key, text) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ text, at: Date.now() }));
  } catch {}
}

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

function makeButton(label, action, payload, output, status) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "min-h-10 rounded-lg bg-card px-3 py-2 text-left text-xs ring-1 ring-line hover:bg-sage disabled:opacity-50";
  button.textContent = label;
  button.addEventListener("click", async () => {
    const url = endpoint();
    if (!url) {
      status.textContent = "AI explanation is not connected yet. The approved explanation above remains available.";
      output.textContent = "";
      return;
    }

    const key = cacheKey(payload, action);
    const cached = readCache(key);
    if (cached) {
      status.textContent = "AI explanation";
      output.textContent = cached;
      return;
    }

    for (const node of button.parentElement?.querySelectorAll("button") || []) node.disabled = true;
    status.textContent = "Thinking…";
    output.textContent = "";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, {
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
    } finally {
      clearTimeout(timer);
      for (const node of button.parentElement?.querySelectorAll("button") || []) node.disabled = false;
    }
  });
  return button;
}

function render(payload) {
  const host = feedbackHost();
  if (!host || !payload) return false;

  document.getElementById(PANEL_ID)?.remove();

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "rounded-lg bg-card p-4 text-sm ring-1 ring-line";

  const top = document.createElement("div");
  top.className = "flex flex-wrap items-start justify-between gap-2";

  const heading = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "text-xs tracking-[0.16em] text-navy uppercase";
  kicker.textContent = "Ask AI";
  const copy = document.createElement("p");
  copy.className = "mt-1 text-sm text-muted";
  copy.textContent = "Optional help with this exact question. AI never changes the official answer, XP or Mastery.";
  heading.append(kicker, copy);
  top.appendChild(heading);
  panel.appendChild(top);

  const buttons = document.createElement("div");
  buttons.className = "mt-3 grid gap-2 sm:grid-cols-2";

  const status = document.createElement("p");
  status.className = "mt-3 text-xs text-muted";

  const output = document.createElement("div");
  output.className = "mt-2 whitespace-pre-wrap rounded-lg bg-sage/60 p-3 text-sm leading-relaxed";
  output.textContent = "";

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

  for (const [label, action] of options) buttons.appendChild(makeButton(label, action, payload, output, status));
  panel.append(buttons, status, output);

  const note = document.createElement("p");
  note.className = "mt-3 text-[11px] text-muted";
  note.textContent = "AI can make mistakes. The approved answer and explanation above remain the marking source.";
  panel.appendChild(note);

  const whyBox = [...host.children].find((node) => node.textContent?.trim().startsWith("Why?"));
  if (whyBox?.nextSibling) host.insertBefore(panel, whyBox.nextSibling);
  else host.appendChild(panel);
  return true;
}

let current = null;
let renderTimer = null;

function schedule() {
  clearTimeout(renderTimer);
  let attempts = 0;
  const tryRender = () => {
    attempts += 1;
    if (current && render(current)) return;
    if (attempts < 12) renderTimer = setTimeout(tryRender, 50);
  };
  tryRender();
}

window.addEventListener("scholar:question-answered", (event) => {
  current = event.detail || null;
  schedule();
});

window.addEventListener("scholar:question-clear", () => {
  current = null;
  clearTimeout(renderTimer);
  document.getElementById(PANEL_ID)?.remove();
});

new MutationObserver(() => {
  if (current && !document.getElementById(PANEL_ID)) schedule();
}).observe(document.documentElement, { childList: true, subtree: true });

export function setScholarAiEndpoint(url) {
  const value = String(url || "").trim();
  if (value) localStorage.setItem(ENDPOINT_KEY, value);
  else localStorage.removeItem(ENDPOINT_KEY);
}
