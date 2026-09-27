import { C as store, st as getTopicCatalog } from "./index-BLVOhKhN.js?v=20260926-verbs";

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
  const days = new Set((Array.isArray(raw.recentOutcomes)?raw.recentOutcomes:[]).filter(r=>r&&r.correct!==false).map(r=>r.date||r.day||(r.at?String(r.at).slice(0,10):null)).filter(Boolean)).size;
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
  const prod=(subject==="latin"||subject==="french")?` · production ${s.productionCorrect}`:"";
  return `Year 8 foundation · ${s.attempted} attempts · ${pct}% first-pass${prod} · ${s.days} study day${s.days===1?"":"s"}. Daily will only move deeper when this is mature.`;
}

function patchStudyLanding() {
  if (location.pathname !== "/study") return;
  const state=store.getState?.();
  if (!state) return;
  const rec=recommended(state);
  if (!rec) return;
  const main=document.querySelector("main");
  if (!main) return;

  const pageTitle=[...main.querySelectorAll("h1")].find(el=>/Continue Learning/i.test(el.textContent||""));
  if (pageTitle) pageTitle.textContent="Study";
  const kicker=pageTitle?.parentElement?.querySelector("p.kicker");
  if (kicker) kicker.textContent="Foundation first · school learning stays available";

  const sections=[...main.querySelectorAll("section")];
  const hero=sections.find(s=>s.querySelector("h2") && s.querySelector("img"));
  if (hero) {
    const card=hero.firstElementChild;
    if (card) {
      const upper=card.querySelector("p.text-xs.font-semibold");
      const h2=card.querySelector("h2");
      const desc=[...card.querySelectorAll("p")].find(p=>p!==upper && !p.classList.contains("kicker"));
      const link=card.querySelector("a[href]");
      if (upper) upper.textContent="RECOMMENDED NEXT · FOUNDATION FIRST";
      if (h2) h2.textContent=`${LABELS[rec.subject]} · ${rec.topic.title || rec.topic.topicId}`;
      if (desc) desc.textContent=evidenceCopy(state,rec.subject,rec.topic.topicId);
      if (link) {
        link.setAttribute("href",`/study/${rec.subject}/practise?daily=1&locked=1&year=8&mode=standard&task=study-recommended&topic=${encodeURIComponent(rec.topic.topicId)}`);
        link.textContent="Practise next →";
      }
    }
  }

  const todayHeading=[...main.querySelectorAll("h2")].find(el=>el.textContent?.trim()==="Today");
  if (todayHeading) {
    todayHeading.textContent="School lessons · Year 9 content";
    const sub=todayHeading.parentElement?.querySelector("p.text-sm.text-muted");
    if (sub) sub.textContent="Current school content stays available here. It does not override the foundation-first Daily progression.";
    const sec=todayHeading.closest("section");
    sec?.querySelectorAll("p.text-xs.text-muted").forEach(p=>{ p.textContent="School lesson · Year 9"; });
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
  if (!d.correct || !d.questionId || !SUBJECTS.includes(d.subject)) return;
  const format=String(d.format||"");
  const depth=Math.max(1,Number(d.cognitiveDepth)||2);
  const production=/typed|controlled_translation|mark_points|extended_response|word_tiles|sequence|unordered_set|practical_design/i.test(format);
  if (!production) return;
  const elapsed=Math.max(0,performance.now()-questionStarted);
  const threshold=(depth>=3||/mark_points|extended_response|controlled_translation|practical_design/i.test(format))?5500:2500;
  if (elapsed>=threshold) return;
  const rows=pruneConfirm(readConfirm());
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
