export { component } from "./routes-BEd1a0JC.core.js?v=20261003-notes4";
import { C as store } from "./index-BLVOhKhN.js?v=20261003-notes4";

const SUBJECTS = new Set(["latin", "french", "biology", "chemistry", "physics", "english"]);

function continueHref() {
  const subject = store.getState().lastSubject;
  return `/study/${SUBJECTS.has(subject) ? subject : "latin"}/practise`;
}

function patchHome() {
  if (window.location.pathname !== "/") return;

  const href = continueHref();
  for (const link of document.querySelectorAll("a")) {
    if (link.textContent?.trim() !== "Continue") continue;
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
    if (!link.dataset.scholarContinueFix) {
      link.dataset.scholarContinueFix = "1";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.assign(continueHref());
      }, true);
    }
  }

  for (const p of document.querySelectorAll("p")) {
    const text = p.textContent || "";
    if (/\bdue reviews? waiting in Latin\.$/.test(text)) {
      p.textContent = text.replace(/waiting in Latin\.$/, "due today.");
    }
  }

  for (const span of document.querySelectorAll("span.font-medium")) {
    const text=(span.textContent||"").trim();
    if (text === "Year 8 French vocab") span.textContent="French Daily 30";
    if (text === "Year 8 Latin vocab") span.textContent="Latin Daily 30";
  }
}

let queued = false;
function schedulePatch() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    patchHome();
  });
}

if (typeof document !== "undefined") {
  setTimeout(() => {
    schedulePatch();
    new MutationObserver(schedulePatch).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    store.subscribe(schedulePatch);
    window.addEventListener("popstate", schedulePatch);
  }, 0);
}
