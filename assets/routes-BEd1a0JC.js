export { component } from "./routes-BEd1a0JC.core.js?v=20261018-receipt2&ux=20261013-corrections2&uxfix=20261022-priority-ux1";
import { C as store } from "./index-BLVOhKhN.js?v=20261024-correct-credit1&ux=20261013-corrections2&uxfix=20261022-priority-ux1";

// Avoid repeatedly parsing the multi-megabyte practice draft and assessment
// storage on every decorative Home mutation. Invalidate on real store updates.
let cachedHref=null, cachedHrefAt=0;
function continueHref() {
  if(cachedHref&&Date.now()-cachedHrefAt<1200)return cachedHref;
  const J=globalThis.LuxJourney,state=J?.withReviewCredits?.(store.getState())||store.getState();
  const active=state.today===J?.day()&&Array.isArray(state.daily)&&state.daily.length===10;
  const next=active&&state.daily.find(t=>Number(t.progress)<Number(t.target)&&J.safeHref(t.href));
  const drafts=J?.resumeCandidates(state)||[];
  const daily=active&&drafts.find(d=>d.daily&&d.planDate===state.today);
  const free=!active&&drafts.find(d=>!d.daily);
  cachedHref=daily?.href||J?.navigationHref(next?.href)||free?.href||"/study/";
  cachedHrefAt=Date.now();
  return cachedHref;
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

// HOME-RETURN STABILITY: a busy React route can generate dozens of DOM
// mutations per frame. Never queue a full Home scan for every microtask.
let queued = false;
function schedulePatch() {
  if (typeof window === "undefined" || window.location.pathname !== "/") return;
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    if (window.location.pathname === "/") patchHome();
  });
}

if (typeof document !== "undefined") {
  setTimeout(() => {
    schedulePatch();
    new MutationObserver(schedulePatch).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    store.subscribe(()=>{cachedHref=null;schedulePatch()});
    window.addEventListener("popstate", schedulePatch);
  }, 0);
}
