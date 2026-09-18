(() => {
  const PANEL_ID = "scholar-ai-panel";
  const CHATGPT_URL = "https://chatgpt.com/";
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

  function actionInstruction(action, correct) {
    const map = {
      why_correct: "Explain why my answer is correct. Use a clear rule → application → example structure.",
      where_wrong: "Explain exactly where I went wrong. Identify my misconception, explain the governing rule, and show how to apply it here.",
      explain_rule: "Explain the underlying rule clearly, then apply it to this question.",
      simpler: "Explain this more simply for a 13-year-old Year 9 student, without being childish.",
      similar_example: "Give me one closely related practice example. Let me try it first, then put the answer underneath a clear ANSWER heading.",
      chinese: "用簡潔繁體中文解釋，但重要學科術語保留英文、Latin 或 French。請解釋規則、我這題怎樣應用，以及一個例子。"
    };
    return map[action] || (correct ? map.why_correct : map.where_wrong);
  }

  function buildPrompt(payload, action) {
    return [
      "I am a Year 9 student revising in Scholar's Garden.",
      "",
      "Please help me understand this exact question. The app's official answer below is the marking source; do not silently change it. If you think it may genuinely be inconsistent with the question, say 'This may need checking' and explain why.",
      "",
      `Subject: ${payload.subject || "School subject"}`,
      `Year: ${payload.year || 9}`,
      payload.topic ? `Topic: ${payload.topic}` : "",
      payload.format ? `Question format: ${payload.format}` : "",
      "",
      `Question: ${payload.question || ""}`,
      payload.stimulus ? `Context: ${payload.stimulus}` : "",
      `My answer: ${payload.studentAnswer || "(blank)"}`,
      `Official answer: ${payload.officialAnswer || ""}`,
      payload.staticExplanation ? `Approved explanation: ${payload.staticExplanation}` : "",
      payload.errorKind && payload.errorKind !== "none" ? `Recorded error type: ${payload.errorKind}` : "",
      `I was marked: ${payload.correct ? "correct" : "incorrect"}`,
      "",
      "Please keep the explanation concise, accurate and suitable for Year 9.",
      actionInstruction(action, !!payload.correct)
    ].filter(Boolean).join("\n");
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    const box = document.createElement("textarea");
    box.value = text;
    box.readOnly = true;
    box.style.position = "fixed";
    box.style.left = "-9999px";
    document.body.appendChild(box);
    box.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch {}
    box.remove();
    return ok;
  }

  function showManualPrompt(prompt, status) {
    status.parentElement?.querySelector("[data-scholar-prompt]")?.remove();
    const box = document.createElement("textarea");
    box.dataset.scholarPrompt = "1";
    box.readOnly = true;
    box.value = prompt;
    box.className = "mt-3 min-h-32 w-full rounded-lg bg-sage/60 p-3 text-xs leading-relaxed ring-1 ring-line";
    status.insertAdjacentElement("afterend", box);
    box.focus();
    box.select();
  }

  function makeButton(label, action, payload, status) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "min-h-10 rounded-lg bg-card px-3 py-2 text-left text-xs ring-1 ring-line hover:bg-sage";
    button.textContent = label;
    button.addEventListener("click", async () => {
      const prompt = buildPrompt(payload, action);
      const tab = window.open(CHATGPT_URL, "_blank", "noopener,noreferrer");
      const copied = await copyText(prompt);
      if (copied && tab) status.textContent = "Prompt copied. Paste it into ChatGPT.";
      else if (copied) status.textContent = "Prompt copied. Open ChatGPT and paste it.";
      else if (tab) {
        status.textContent = "ChatGPT opened. Copy the prompt below manually.";
        showManualPrompt(prompt, status);
      } else {
        status.textContent = "New tab blocked. Copy the prompt below, then open ChatGPT.";
        showManualPrompt(prompt, status);
      }
    });
    return button;
  }

  function render(payload) {
    const host = feedbackHost();
    if (!host || !payload) return false;
    cleanWhyDuplicates(host);

    document.getElementById(PANEL_ID)?.remove();

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.dataset.freeChatgpt = "2";
    panel.className = "rounded-lg bg-card p-4 text-sm ring-1 ring-line";

    const kicker = document.createElement("p");
    kicker.className = "text-xs tracking-[0.16em] text-navy uppercase";
    kicker.textContent = "Ask ChatGPT";

    const copy = document.createElement("p");
    copy.className = "mt-1 text-sm text-muted";
    copy.textContent = "Free option: copy a ready-made prompt for this exact question and open ChatGPT.";

    const buttons = document.createElement("div");
    buttons.className = "mt-3 grid gap-2 sm:grid-cols-2";

    const options = payload.correct
      ? [["Why is this correct?","why_correct"],["Explain more simply","simpler"],["Give me one similar example","similar_example"],["中文解釋","chinese"]]
      : [["Where did I go wrong?","where_wrong"],["Explain the rule","explain_rule"],["Give me one similar example","similar_example"],["中文解釋","chinese"]];

    const status = document.createElement("p");
    status.className = "mt-3 text-xs text-muted";
    status.setAttribute("aria-live", "polite");

    for (const [label, action] of options) buttons.appendChild(makeButton(label, action, payload, status));

    const note = document.createElement("p");
    note.className = "mt-3 text-[11px] text-muted";
    note.textContent = "No paid API is used. ChatGPT opens separately and cannot change the app's official answer, XP or Mastery.";

    panel.append(kicker, copy, buttons, status, note);

    const whyLabel = [...host.querySelectorAll("p")].find((p) => p.textContent?.trim() === "Why?");
    const whyBox = whyLabel?.parentElement;
    if (whyBox?.nextSibling) host.insertBefore(panel, whyBox.nextSibling);
    else host.appendChild(panel);
    return true;
  }

  function schedule() {
    clearTimeout(timer);
    let tries = 0;
    const run = () => {
      tries += 1;
      if (current && render(current)) return;
      if (tries < 15) timer = setTimeout(run, 50);
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
    const panel = document.getElementById(PANEL_ID);
    if (current && (!panel || panel.dataset.freeChatgpt !== "2")) schedule();
    const host = feedbackHost();
    if (host) cleanWhyDuplicates(host);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();