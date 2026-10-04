import {C as store,st as getTopicCatalog} from './index-BLVOhKhN.js?v=20261004-progress2';
import {curriculumFrontier,curriculumHref,progressionSubjects} from './daily-curriculum-20261004.js?v=20261004-progress2';
function queryValue(params,key){return String(params.get(key)||'').replace(/^["']|["']$/g,'');}
function learning(){try{return JSON.parse(localStorage.getItem('lux-topic-learning-v1')||'{}')}catch{return {}}}
function safeDailyHref(url){
 if(url.origin!==location.origin||queryValue(url.searchParams,'daily')!=='1')return null;
 const subject=progressionSubjects.find(s=>url.pathname.includes(`/study/${s}/practise`));if(!subject)return null;
 const taskId=queryValue(url.searchParams,'task'),mode=queryValue(url.searchParams,'mode');
 if(['french-vocab','latin-vocab','mistake-review'].includes(taskId)||['y8vocab','mistakes'].includes(mode))return null;
 const state=store.getState(),task=state.daily?.find(t=>t.id===taskId);
 const taskTopic=task?.assignedTopic||task?.reviewTopic||task?.focusTopic;
 if(task&&taskTopic){
  const taskSubject=task.assignedSubject||task.reviewSubject||task.focusSubject;
  if(taskSubject===subject)return task.href;
 }
 const pick=curriculumFrontier(state,subject,getTopicCatalog,learning());
 return pick?curriculumHref(pick,(state.topicStats?.[pick.topicId]?.attempted||0)>=10&&mode==='mastery'?'mastery':'standard',taskId||'foundation-first'):null;
}
function guardDailyClick(e){const a=e.target?.closest?.('a[href]');if(!a)return;let url;try{url=new URL(a.href,location.origin)}catch{return}const safe=safeDailyHref(url);if(!safe||url.pathname+url.search===safe)return;const target=new URL(safe,location.origin);if(queryValue(url.searchParams,'topic')===target.searchParams.get('topic')&&queryValue(url.searchParams,'year')===target.searchParams.get('year')&&queryValue(url.searchParams,'mode')===target.searchParams.get('mode'))return;e.preventDefault();e.stopPropagation();location.href=safe;}
function guardCurrentDailyRoute(){
 const url=new URL(location.href),safe=safeDailyHref(url);if(!safe)return;
 const canonical=new URL(safe,location.origin);
 // The phase changes after the tenth answer. Never interrupt a live set for a mode change.
 if(queryValue(url.searchParams,'topic')===canonical.searchParams.get('topic')&&queryValue(url.searchParams,'year')===canonical.searchParams.get('year'))return;
 location.replace(safe);
}
let timer;
function todayPrecision(state) {
  const day = state.today || todayKey();
  const rows = [];
  for (const stat of Object.values(state.topicStats || {})) {
    for (const row of Array.isArray(stat?.recentOutcomes) ? stat.recentOutcomes : []) {
      const rowDay = row?.date || row?.day || (row?.at ? String(row.at).slice(0, 10) : null);
      if (rowDay === day) rows.push(row);
    }
  }
  const attempted = rows.length;
  const correct = rows.filter((row) => row?.correct === true).length;
  const misses = Math.max(0, attempted - correct);
  const score = attempted ? Math.round((correct / attempted) * 100) : null;
  const due = Object.values(state.skillStats || {}).filter((stat) => stat?.retentionDue && stat.retentionDue <= day).length;
  return { attempted, correct, misses, score, due };
}

let precisionSignature="";
function renderPrecisionPanel() {
  if (location.pathname !== "/") return;
  const state = store.getState?.();
  if (!state) return;
  const heading = [...document.querySelectorAll("h2")].find((node) => /raise her today/i.test(node.textContent || ""));
  if (!heading) return;
  let journey = heading.parentElement;
  while (journey && journey !== document.body && !journey.querySelector("ul")) journey = journey.parentElement;
  if (!journey || journey === document.body || !journey.parentElement) return;

  const stats = todayPrecision(state);
  const frontiers = SUBJECTS.map((subject) => ({ subject, topic: curriculumFrontier(state, subject, getTopicCatalog, learning()) })).filter((row) => row.topic);
  const next = frontiers[0];
  let panel = document.getElementById("daily-precision-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "daily-precision-panel";
    panel.className = "rounded-[28px] bg-card text-ink shadow-[var(--shadow-border)] p-5";
    journey.insertAdjacentElement("afterend", panel);
  }
  const scoreText = stats.score == null ? "—" : `${stats.score}%`;
  const scoreNote = stats.attempted ? `${stats.correct}/${stats.attempted} first-pass answers correct` : "Starts counting after the first formal question";
  const frontierText = next
    ? `${LABELS[next.subject]} · ${next.topic.title || next.topic.topicId}`
    : "Foundations mastered · mark taught Year 9 topics to continue";
  const signature=JSON.stringify([stats,frontierText,next?.topic.year]);if(precisionSignature===signature&&panel.innerHTML)return;precisionSignature=signature;
  panel.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="kicker">Today’s precision</p>
        <h2 class="font-display text-2xl font-semibold">Make every mark count</h2>
      </div>
      <div class="rounded-full bg-sage px-3 py-1 text-sm font-semibold text-navy tabular-nums">${scoreText}</div>
    </div>
    <div class="mt-4 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-2xl bg-sage/70 px-2 py-3"><div class="font-display text-2xl font-semibold tabular-nums">${stats.attempted}</div><div class="text-[10px] tracking-wide text-muted uppercase">First attempts</div></div>
      <div class="rounded-2xl bg-sage/70 px-2 py-3"><div class="font-display text-2xl font-semibold tabular-nums">${stats.misses}</div><div class="text-[10px] tracking-wide text-muted uppercase">Misses to tighten</div></div>
      <div class="rounded-2xl bg-sage/70 px-2 py-3"><div class="font-display text-2xl font-semibold tabular-nums">${stats.due}</div><div class="text-[10px] tracking-wide text-muted uppercase">Retention due</div></div>
    </div>
    <p class="mt-3 text-sm text-muted">${scoreNote}. Repairs do not inflate this score.</p>
    <div class="mt-3 rounded-xl bg-paper/70 px-3 py-2 text-sm"><b class="text-navy">Next on your path:</b> Year ${next?.topic.year || 8} · ${frontierText}.</div>`;
}

function refresh(){guardCurrentDailyRoute();renderPrecisionPanel();}
function boot(){refresh();document.addEventListener('click',guardDailyClick,true);store.subscribe(()=>{clearTimeout(timer);timer=setTimeout(refresh,40)});window.addEventListener('pageshow',refresh);let checks=0;const ready=window.setInterval(()=>{if(progressionSubjects.some(subject=>getTopicCatalog(subject,8).length)||++checks>=60){window.clearInterval(ready);refresh()}},250);new MutationObserver(()=>{clearTimeout(boot.domTimer);boot.domTimer=setTimeout(renderPrecisionPanel,60)}).observe(document.documentElement,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
