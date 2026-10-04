import { C as store, st as getTopicCatalog } from "./index-BLVOhKhN.js?v=20261004-gains1";

const SUBJECTS = ["latin", "french", "biology", "chemistry", "physics"];
const LABELS = { latin: "Latin", french: "French", biology: "Biology", chemistry: "Chemistry", physics: "Physics" };
const CONFIRM_KEY = "lux-needs-confirmation-v1";
const LATIN_ORDER = [
  "la-y8-stage-1-vocabulary","la-y8-stage-2-vocabulary","la-y8-stage-3-vocabulary","la-y8-core-verbs",
  "la-y8-nouns-and-dictionary-entries","la-y8-present-person-and-number","la-y8-prepositions",
  "la-y8-stage-4-vocabulary","la-y8-stage-5-vocabulary","la-y8-stage-6-vocabulary","la-y8-stage-7-vocabulary",
  "la-y8-stage-8-vocabulary","la-y8-stage-9-vocabulary","la-y8-stage-10-vocabulary","la-y8-stage-11-vocabulary",
  "la-y8-stage-12-vocabulary","la-y8-adjective-agreement","la-y8-personal-pronouns","la-y8-ille-singular",
  "la-y8-ille-plural","la-y8-nouns-with-genitives","la-y8-set-text-translation","la-y8-perfect-cues"
];

function numericRank(id = "") {
  const fr = String(id).match(/^fr-y8-s(\d+)-/i);
  if (fr) return Number(fr[1]);
  const m = String(id).match(/(?:^|[-_])(?:s|c|p|b|t|u|topic)?(\d+)(?:[-_]|$)/i);
  return m ? Number(m[1]) : 9999;
}

function catalogue(subject) {
  let topics = [];
  try { topics = (getTopicCatalog(subject, 8) || []).filter(t => t?.topicId && t?.status !== "disabled"); } catch {}
  if (subject === "latin") {
    const rank = new Map(LATIN_ORDER.map((id, i) => [id, i]));
    return [...topics].sort((a,b)=>(rank.get(a.topicId)??9999)-(rank.get(b.topicId)??9999)||String(a.topicId).localeCompare(String(b.topicId)));
  }
  if (subject === "french") return [...topics].sort((a,b)=>numericRank(a.topicId)-numericRank(b.topicId)||String(a.topicId).localeCompare(String(b.topicId)));
  return topics.map((topic,index)=>({topic,index})).sort((a,b)=>{
    const ar=numericRank(a.topic.topicId), br=numericRank(b.topic.topicId);
    return ar!==9999||br!==9999 ? ar-br||a.index-b.index : a.index-b.index;
  }).map(x=>x.topic);
}

function summary(raw = {}) {
  const attempted = Math.max(0, Number(raw.attempted)||0);
  const correct = Math.max(0, Math.min(attempted, Number(raw.correct)||0));
  const accuracy = attempted ? correct/attempted : 0;
  const productionCorrect = Math.max(0, Number(raw.productionCorrect)||0, Array.isArray(raw.productionIds)?new Set(raw.productionIds).size:0);
  const days = new Set([...(Array.isArray(raw.correctDays)?raw.correctDays:[]), ...(Array.isArray(raw.recentOutcomes)?raw.recentOutcomes:[]).filter(r=>r&&r.correct!==false).map(r=>r.date||r.day||(r.at?String(r.at).slice(0,10):null)).filter(Boolean)]).size;
  return { attempted, accuracy, productionCorrect, days };
}

function mature(state, subject, topicId) {
  const s = summary(state.topicStats?.[topicId]||{});
  const language = subject === "latin" || subject === "french";
  return s.attempted >= 10 && s.accuracy >= .85 && (!language || s.productionCorrect >= 1) && s.days >= 2;
}

function frontier(state, subject) {
  return catalogue(subject).find(t=>!mature(state,subject,t.topicId)) || null;
}

function taskSubject(task={}) {
  if (SUBJECTS.includes(task.focusSubject)) return task.focusSubject;
  if (SUBJECTS.includes(task.assignedSubject)) return task.assignedSubject;
  if (SUBJECTS.includes(task.reviewSubject)) return task.reviewSubject;
  const href=String(task.href||"");
  return SUBJECTS.find(s=>href.includes(`/study/${s}/`))||null;
}

function recommended(state) {
  const guarded = (state.daily||[]).find(t=>t.foundationYear===8 && (t.id==="study-session"||t.id==="adaptive-focus")) ||
    (state.daily||[]).find(t=>t.foundationYear===8);
  if (guarded) {
    const subject = taskSubject(guarded);
    const topicId = guarded.foundationTopic || guarded.focusTopic || guarded.assignedTopic || guarded.reviewTopic;
    if (subject && topicId) {
      const topic = catalogue(subject).find(t=>t.topicId===topicId) || { topicId, title: guarded.assignedLabel || topicId };
      return { subject, topic };
    }
  }
  for (const subject of SUBJECTS) {
    const topic = frontier(state,subject);
    if (topic) return { subject, topic };
  }
  return null;
}

function evidenceCopy(state, subject, topicId) {
  const s=summary(state.topicStats?.[topicId]||{});
  const pct=s.attempted?Math.round(s.accuracy*100):0;
  const prod=(subject==="latin"||subject==="french")?` · ${s.productionCorrect} correct answers written independently`:"";
  return `Year 8 foundation · ${s.attempted} attempts · ${pct}% accuracy${prod} · ${s.days} study day${s.days===1?"":"s"}. Practise on at least 2 days with 10 answers and 85% accuracy before Daily moves on.`;
}

function patchStudyLanding() {
  if (location.pathname !== "/study" && location.pathname !== "/study/") return;
  const state=store.getState?.();
  if (!state) return;
  const rec=recommended(state);
  if (!rec) return;
  const main=document.querySelector("main");
  if (!main) return;

  const pageTitle=[...main.querySelectorAll("h1")].find(el=>/Continue Learning/i.test(el.textContent||"")||el.dataset.foundationStudyTitle);
  if (pageTitle) { if(pageTitle.textContent!=="Study")pageTitle.textContent="Study"; pageTitle.dataset.foundationStudyTitle="1"; }
  const kicker=pageTitle?.parentElement?.querySelector("p.kicker");
  if (kicker && kicker.textContent!=="Foundation first · school learning stays available") kicker.textContent="Foundation first · school learning stays available";

  const sections=[...main.querySelectorAll("section")];
  const hero=sections.find(s=>s.querySelector("h2") && s.querySelector("img"));
  if (hero) {
    const source=[...main.querySelectorAll("h3")].find(h=>h.textContent===LABELS[rec.subject])?.closest("section");
    const subjectArt=[...main.querySelectorAll("h3")].find(h=>h.textContent===LABELS[rec.subject])?.parentElement?.parentElement?.parentElement?.querySelector("img");
    const heroArt=hero.querySelector("img");
    if(subjectArt&&heroArt&&heroArt.getAttribute("src")!==subjectArt.getAttribute("src"))heroArt.setAttribute("src",subjectArt.getAttribute("src"));
    const card=hero.firstElementChild;
    if (card) {
      const upper=card.querySelector("p.text-xs.font-semibold");
      const h2=card.querySelector("h2");
      const desc=[...card.querySelectorAll("p")].find(p=>p!==upper && !p.classList.contains("kicker"));
      const link=card.querySelector("a[href]");
      if (upper && upper.textContent!=="RECOMMENDED NEXT · FOUNDATION FIRST") upper.textContent="RECOMMENDED NEXT · FOUNDATION FIRST";
      if (h2 && h2.textContent!==`${LABELS[rec.subject]} · ${rec.topic.title || rec.topic.topicId}`) h2.textContent=`${LABELS[rec.subject]} · ${rec.topic.title || rec.topic.topicId}`;
      if (desc && desc.textContent!==evidenceCopy(state,rec.subject,rec.topic.topicId)) desc.textContent=evidenceCopy(state,rec.subject,rec.topic.topicId);
      if (link) {
        const safeHref=`/study/${rec.subject}/practise?daily=1&locked=1&year=8&mode=standard&task=study-recommended&topic=${encodeURIComponent(rec.topic.topicId)}`;
        link.setAttribute("href",safeHref);
        link.dataset.foundationHref=safeHref;
        if(link.textContent!=="Practise next →")link.textContent="Practise next →";
        if (!link.dataset.foundationClick) {
          link.dataset.foundationClick="1";
          link.addEventListener("click",event=>{
            const target=event.currentTarget?.dataset?.foundationHref;
            if (!target) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            location.assign(target);
          },true);
        }
      }
    }
  }

  const todayHeading=[...main.querySelectorAll("h2")].find(el=>el.textContent?.trim()==="Today"||el.dataset.schoolLessonsHeading);
  if (todayHeading) {
    if(todayHeading.textContent!==`School lessons · Year ${state.year||9} content`)todayHeading.textContent=`School lessons · Year ${state.year||9} content`;
    todayHeading.dataset.schoolLessonsHeading="1";
    const sub=todayHeading.parentElement?.querySelector("p.text-sm.text-muted");
    if (sub && sub.textContent!=="Choose a school topic below. Daily tasks continue to build your foundations in order.") sub.textContent="Choose a school topic below. Daily tasks continue to build your foundations in order.";
    const sec=todayHeading.closest("section");
    sec?.querySelectorAll("p.text-xs.text-muted").forEach(p=>{ if(p.textContent!==`School lesson · Year ${state.year||9}`)p.textContent=`School lesson · Year ${state.year||9}`; });
  }
}

function tomorrowKey() {
  const d=new Date(); d.setDate(d.getDate()+1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function todayKeyLocal(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function readConfirm(){try{const v=JSON.parse(localStorage.getItem(CONFIRM_KEY)||"{}");return v&&typeof v==="object"?v:{}}catch{return{}}}
function writeConfirm(v){try{localStorage.setItem(CONFIRM_KEY,JSON.stringify(v))}catch{}}
function pruneConfirm(rows){const today=todayKeyLocal();for(const [id,row] of Object.entries(rows)){if(!row||String(row.expires||"9999-12-31")<today)delete rows[id]}return rows}

let questionStarted=performance.now();
function resetQuestionClock(){questionStarted=performance.now();}
function captureFastCorrect(event){
  const d=event?.detail||{};
  // Fast word recall is expected in Daily vocabulary; do not schedule extra speed checks.
  if (d.dailyVocab) return;
  if (!d.questionId || !SUBJECTS.includes(d.subject)) return;
  const format=String(d.format||"");
  const depth=Math.max(1,Number(d.cognitiveDepth)||2);
  const production=/typed|controlled_translation|mark_points|extended_response|word_tiles|sequence|unordered_set|practical_design/i.test(format);
  if (!production) return;
  const elapsed=Math.max(0,performance.now()-questionStarted);
  const threshold=(depth>=3||/mark_points|extended_response|controlled_translation|practical_design/i.test(format))?5500:2500;
  const rows=pruneConfirm(readConfirm());
  const existing=rows[d.questionId];

  if (d.correct && existing?.due && existing.due<=todayKeyLocal() && elapsed>=threshold) {
    delete rows[d.questionId];
    writeConfirm(rows);
    return;
  }
  if (!d.correct || elapsed>=threshold) return;

  const expiry=new Date(); expiry.setDate(expiry.getDate()+14);
  const expires=`${expiry.getFullYear()}-${String(expiry.getMonth()+1).padStart(2,"0")}-${String(expiry.getDate()).padStart(2,"0")}`;
  rows[d.questionId]={subject:d.subject,topicId:d.topicId||"",skills:Array.isArray(d.skills)?d.skills:[],due:tomorrowKey(),expires,responseMs:Math.round(elapsed),reason:"fast-correct-needs-confirmation"};
  writeConfirm(rows);
}

let queued=false;
function schedule(){
  if (queued) return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;patchStudyLanding()});
}

function boot(){
  schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  store.subscribe?.(schedule);
  window.addEventListener("popstate",()=>{resetQuestionClock();schedule()});
  window.addEventListener("scholar:question-clear",resetQuestionClock);
  window.addEventListener("scholar:question-answered",captureFastCorrect);
  window.addEventListener("pageshow",()=>{resetQuestionClock();schedule()});
}

if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
