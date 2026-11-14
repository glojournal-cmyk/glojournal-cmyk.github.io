import { LATIN_BOOKLET_RECORDS } from "/assets/latin-vocabulary-booklet-20261023.js";
import { SYLLABUS, GRAMMAR, PRACTICE, MOCK, validateMock } from "./exam-data.js?v=20261114c";
import { UNSEEN_PASSAGES, validateUnseens } from "./unseen-passages.js?v=20261114a";

validateMock();
validateUnseens();
const root = document.getElementById("app");
const tabs = [...document.querySelectorAll("[data-tab]")];
const words = LATIN_BOOKLET_RECORDS.filter(row => [1, 2, 3].includes(Number(row.chapter)));
const counts = [1, 2, 3].map(ch => words.filter(w => w.chapter === ch).length);
if (words.length !== 130 || counts.join(",") !== "40,45,45") {
  root.innerHTML = '<div class="panel"><h2>Source check needed</h2><p>This chapter revision will not show a partial or incorrect vocabulary bank. Please check the installed Latin booklet.</p></div>';
  throw new Error("Taylor Chapter 1–3 source mismatch");
}
const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));
const shuffle = rows => {
  const out = rows.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
let tab = "overview", chapter = "all", wordDirection = "l2e", queue = [], wordIndex = 0;
let wordShown = false, wordAnswer = "";
const wordKnown = new Set(), wordMissed = new Set();
let grammarGroup = "All topics", grammarIndex = 0, grammarShown = false, grammarAnswer = "";
let practiceGroup = "English → Latin", practiceIndex = 0, practiceShown = false, practiceAnswer = "";
let unseenIndex = 0, unseenSubmitted = false;
const unseenAnswers = Object.create(null);
let mockState = "ready", deadline = 0, ticker = null;
const responses = {}, awarded = new Set();

function resetVocab() {
  queue = shuffle(words.filter(w => chapter === "all" || String(w.chapter) === chapter));
  wordIndex = 0; wordShown = false; wordAnswer = "";
}
resetVocab();
function renderOverview() {
  return '<section class="panel"><div class="eyebrow">Exam map</div><h2>Stay within the school scope</h2>' +
    '<p>The November assessment contains <strong>11 marks</strong> English → Latin, <strong>14 marks</strong> comprehension, and <strong>50 marks</strong> Latin → English passage translation. Revision should combine vocabulary, grammar and sustained translation practice.</p>' +
    '<div class="grid">' + SYLLABUS.map(item =>
      '<div class="panel" style="margin:0"><h3>' + esc(item[0]) + '</h3><p class="muted">' + esc(item[1]) + '</p></div>'
    ).join("") + '</div>' +
    '<div class="note"><strong>For English → Latin (Section A):</strong> perfect tense, adjectives, imperatives/vocative and city-name rules are excluded. These may still appear in comprehension and passage translation.</div>' +
    '<div class="note warning"><strong>Not for this assessment:</strong> Taylor Chapters 4–6, future and pluperfect tenses, and unrelated declension paradigms. They may exist elsewhere in the main app; they are excluded here.</div>' +
    '<div class="btnrow"><button class="btn" data-action="jump-vocabulary">Revise 130 words</button><button class="btn secondary" data-action="jump-grammar">Practise grammar</button><button class="btn secondary" data-action="jump-mock">Start mock</button></div></section>';
}
function renderVocabulary() {
  const row = queue[wordIndex];
  const front = row ? (wordDirection === "l2e" ? row.latin : row.english) : "";
  const back = row ? (wordDirection === "l2e" ? row.english : row.latin) : "";
  const extra = row ? '<div class="flashword" lang="la">' + esc(front) + '</div>' +
    '<p class="help">' + (wordDirection === 'l2e' ? 'Write an English meaning' : 'Write the Latin headword or dictionary entry') + ' from memory, then reveal the complete booklet entry.</p>' +
    '<label for="word-input">Your ' + (wordDirection === 'l2e' ? 'English meaning' : 'Latin word') + '</label><input id="word-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(wordAnswer) + '"' + (wordShown ? ' disabled' : '') + '>' +
    (wordShown ? '<div class="model"><strong>Booklet answer</strong><p>' + esc(back) + '</p><p class="help">Count equivalent accurate meanings as correct. Pay attention to the correct forms and all senses shown.</p></div>' +
      '<div class="btnrow"><button class="btn" data-action="word-known">✓ I knew it</button><button class="btn secondary" data-action="word-missed">↻ Review again</button></div>' :
      '<div class="btnrow"><button class="btn" data-action="word-reveal">Reveal the meaning</button></div>') :
    '<h3>Chapter complete!</h3><p>You reviewed every word in this set. Choose “Another round” to shuffle the set and practise again.</p><div class="btnrow"><button class="btn" data-action="vocab-restart">Another round</button></div>';
  return '<section class="panel"><div class="sectionhead"><div><div class="eyebrow">Exact source vocabulary</div><h2>Taylor Chapters 1–3</h2></div><span class="pill">130 dictionary entries</span></div>' +
    '<p class="help">Loaded from the existing Scholar’s Garden Taylor booklet: Chapter 1 (40), Chapter 2 (45), Chapter 3 (45). Both halves of each chapter are included. No Chapter 4–6 items appear here.</p>' +
    '<label for="word-chapter">Select chapter</label><select id="word-chapter"><option value="all"' + (chapter === "all" ? ' selected' : '') + '>Chapters 1–3 (all 130)</option>' +
    [1,2,3].map((n,i) => '<option value="' + n + '"' + (chapter === String(n) ? ' selected' : '') + '>Chapter ' + n + ' (' + counts[i] + ' entries)</option>').join("") + '</select>' +
    '<label for="word-direction">Recall direction</label><select id="word-direction"><option value="l2e"' + (wordDirection === 'l2e' ? ' selected' : '') + '>Latin → English</option><option value="e2l"' + (wordDirection === 'e2l' ? ' selected' : '') + '>English → Latin</option></select>' +
    '<div class="divider"></div><div class="metrics"><span><strong>' + Math.min(wordIndex + 1, queue.length) + '/' + queue.length + '</strong> words in this round</span><span>Known: <strong>' + wordKnown.size + '</strong> · To review: <strong>' + wordMissed.size + '</strong></span></div>' + extra +
    '</section>';
}
function grammarPool() {
  return GRAMMAR.filter(item => grammarGroup === "All topics" || item[0] === grammarGroup);
}
function renderGrammar() {
  const choices = ["All topics", ...new Set(GRAMMAR.map(q => q[0]))];
  const items = grammarPool();
  const q = items[grammarIndex % items.length];
  return '<section class="panel"><div class="eyebrow">Focused recall</div><h2>Grammar practice</h2>' +
    '<p class="help">Only teacher-listed material. Check your own form, spelling and meaning after revealing the answer.</p>' +
    '<label for="grammar-group">Choose a grammar topic</label><select id="grammar-group">' +
    choices.map(g => '<option value="' + esc(g) + '"' + (g === grammarGroup ? ' selected' : '') + '>' + esc(g) + '</option>').join("") + '</select>' +
    '<div class="divider"></div><div class="count">' + (grammarIndex + 1) + ' / ' + items.length + ' · ' + esc(q[0]) + '</div>' +
    '<h3 class="prompt">' + esc(q[1]) + '</h3>' +
    '<label for="grammar-input">Your answer</label><input type="text" id="grammar-input" autocomplete="off" spellcheck="false" value="' + esc(grammarAnswer) + '"' + (grammarShown ? ' disabled' : '') + '>' +
    (grammarShown ? '<div class="model"><strong>Model answer: ' + esc(q[2]) + '</strong><p>' + esc(q[3]) + '</p></div><div class="btnrow"><button class="btn" data-action="grammar-next">Next question</button></div>' :
      '<div class="btnrow"><button class="btn" data-action="grammar-reveal">Show answer and explanation</button></div>') +
    '</section>';
}
function renderPractice() {
  const group = PRACTICE.find(item => item.group === practiceGroup) || PRACTICE[0];
  const q = group.items[practiceIndex % group.items.length];
  const latinFirst = practiceGroup === "Latin → English";
  const passage = group.passage ? '<div class="latinpassage" lang="la">' +
    group.passage.map(line => '<p>' + esc(line) + '</p>').join("") + '</div>' : "";
  return '<section class="panel"><div class="eyebrow">Untimed exam-style training</div><h2>Translation & comprehension</h2>' +
    '<p class="help">Separate from the timed mock. Try the question without help; reveal the model answer only when ready.</p>' +
    '<label for="practice-group">Choose skill</label><select id="practice-group">' +
    PRACTICE.map(item => '<option value="' + esc(item.group) + '"' + (practiceGroup === item.group ? ' selected' : '') + '>' + esc(item.group) + ' (' + item.items.length + ')</option>').join("") + '</select>' +
    '<div class="divider"></div><div class="count">Question ' + (practiceIndex + 1) + ' / ' + group.items.length + '</div>' +
    passage + '<h3 class="' + (latinFirst ? "latin" : "prompt") + '">' + esc(q[0]) + '</h3>' +
    '<label for="practice-input">Your ' + (practiceGroup === "English → Latin" ? "Latin" : "English") + ' answer</label>' +
    '<textarea id="practice-input" spellcheck="false"' + (practiceShown ? ' readonly' : '') + '>' + esc(practiceAnswer) + '</textarea>' +
    (practiceShown ? '<div class="model"><strong>Model answer</strong><p>' + esc(q[1]) + '</p><p class="help">' + esc(q[2]) + '</p></div>' +
      '<div class="btnrow"><button class="btn" data-action="practice-next">Next practice question</button></div>' :
      '<div class="btnrow"><button class="btn" data-action="practice-reveal">Reveal model answer</button></div>') +
    '</section>';
}
function renderUnseen() {
  const p=UNSEEN_PASSAGES[unseenIndex];
  const complete=p.questions.filter(q=>Number.isInteger(unseenAnswers[q.id])).length;
  const review=unseenSubmitted;
  const earned=review ? p.questions.reduce((n,q)=>n+(unseenAnswers[q.id]===q.answer ? 1:0),0) : 0;
  const header='<section class="panel"><div class="eyebrow">Five original unseen passages · 10 questions each</div>' +
    '<h2>Unseen reading · Multiple Choice</h2>' +
    '<p class="help">School Year 9 Taylor Chapters 1–3, with GCSE-style comprehension skills adapted to MC format. Each passage has exactly 10 questions (1 mark each). Correct answers and explanations are hidden until you finish.</p>' +
    '<label for="unseen-passage">Choose passage</label><select id="unseen-passage">'+
      UNSEEN_PASSAGES.map((item,i)=>'<option value="'+i+'"'+(i===unseenIndex?' selected':'')+'>'+esc((i+1)+'. '+item.title+' · '+item.difficulty)+'</option>').join("")+'</select>' +
    '<div class="facts"><span class="pill">'+esc(p.difficulty)+'</span><span class="pill">10 MC questions</span><span class="pill">'+esc(p.context)+'</span></div>' +
    '<div class="note">'+(review ? '<strong>Marked:</strong> '+earned+'/10 · '+Math.round(earned*10)+'%. See the correct choices and explanations below.' :
    '<strong>Progress:</strong> <span id="unseen-progress">'+complete+'/10 selected</span>. Read the entire passage before choosing answers. You may change any choice until you submit.')+'</div></section>';
  const passage='<section class="exam-block"><h2>'+esc(p.title)+'</h2><p class="help">Read the unseen Latin. No dictionary is needed for the intended chapter vocabulary.</p>'+
    '<div class="latinpassage" lang="la">'+p.passage.map((line,i)=>'<p><strong>'+(i+1)+'.</strong> '+esc(line)+'</p>').join("")+'</div></section>';
  const questions=p.questions.map((q,i)=>{
    const selected=unseenAnswers[q.id];
    const options=q.options.map((option,j)=>{
      const checked=selected===j;
      const status=review && j===q.answer?' <strong class="mc-correct-label">✓ Correct answer</strong>':
        review && checked && j!==q.answer?' <strong class="mc-wrong-label">Your answer</strong>':'';
      return '<label class="mc-choice'+(review && j===q.answer?' mc-is-correct':'')+'">'+
        '<input type="radio" name="unseen-'+esc(q.id)+'" value="'+j+'" data-unseen-answer="'+esc(q.id)+'"'+(checked?' checked':'')+(review?' disabled':'')+'>'+
        '<span><strong>'+("ABCD"[j])+'.</strong> '+esc(option)+status+'</span></label>';
    }).join("");
    const feedback=review?'<div class="model"><strong>'+(selected===q.answer?'Correct · 1/1':'Review · 0/1')+'</strong>'+
      '<p><strong>Evidence:</strong> <span lang="la">'+esc(q.evidence)+'</span></p><p>'+esc(q.explanation)+'</p>'+
      '<p class="help">Skill: '+esc(q.skill)+'</p></div>':'';
    return '<article class="question"><div class="sectionhead"><h3>Question '+(i+1)+' <span class="count">(1 mark)</span></h3></div>'+
      '<fieldset class="mc-fieldset"><legend class="prompt">'+esc(q.prompt)+'</legend>'+options+'</fieldset>'+feedback+'</article>';
  }).join("");
  const actions=review?'<div class="panel"><h3>Passage completed: '+earned+'/10</h3>'+
    '<div class="btnrow"><button class="btn" data-action="unseen-retry">Try this passage again</button>'+
    '<button class="btn secondary" data-action="unseen-next">Next unseen passage</button></div></div>':
    '<div class="panel"><p class="help">Submit when ready. Unanswered questions receive zero, and explanations are only shown after submission.</p>'+
    '<div class="btnrow"><button class="btn" data-action="unseen-submit">Finish passage & mark /10</button></div></div>';
  return header+passage+questions+actions;
}
function resetUnseen(){
  unseenSubmitted=false;
  for(const q of UNSEEN_PASSAGES[unseenIndex].questions)delete unseenAnswers[q.id];
}
function countdown() {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}
function timeText() {
  const seconds = countdown();
  return String(Math.floor(seconds / 60)).padStart(2,"0") + ":" +
    String(seconds % 60).padStart(2,"0");
}
function startTimer() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(() => {
    if (mockState !== "active") { clearInterval(ticker); ticker = null; return; }
    const t = document.getElementById("mock-time");
    if (t) t.textContent = timeText();
    if (countdown() <= 0) submitMock(true);
  }, 1000);
}
function startMock() {
  Object.keys(responses).forEach(k => delete responses[k]);
  awarded.clear();
  mockState = "active";
  deadline = Date.now() + MOCK.durationMinutes * 60 * 1000;
  tab = "mock"; startTimer(); render();
}
function submitMock(expired = false) {
  if (mockState !== "active") return;
  if (!expired && !window.confirm("Finish the paper? Model answers and marking guidance will appear only after submission.")) return;
  mockState = "submitted";
  if (ticker) { clearInterval(ticker); ticker = null; }
  tab = "mock"; render();
  const heading = document.getElementById("mock-heading");
  if (heading) heading.scrollIntoView({behavior:"smooth",block:"start"});
}
function renderPaperQuestion(q, review) {
  const response = esc(responses[q.id] || "");
  let after = "";
  if (review) {
    after = '<div class="model"><strong>Model answer</strong><p>' + esc(q.model) + '</p>' +
      '<p class="help">Award one mark for each complete, independently correct criterion. For A accept any grammatical Latin word order; for B/C accept accurate English equivalents. Do not award a criterion if its essential case, person, number, tense or negation is wrong. Avoid penalising one error twice.</p></div>' +
      '<ul class="marklist">' + q.points.map((item,i) => {
        const key = q.id + "-" + i;
        return '<li><label><input type="checkbox" data-award="' + esc(key) + '"' + (awarded.has(key) ? ' checked' : '') + '><span><strong>1 mark · </strong>' + esc(item) + '</span></label></li>';
      }).join("") + '</ul>';
  }
  return '<article class="question"><div class="sectionhead"><h3>' + esc(q.id) + ' <span class="count">(' + q.points.length + ' marks)</span></h3>' +
    '<span class="count">' + (review ? "Self-mark below" : "No feedback before submission") + '</span></div>' +
    (q.latin ? '<p class="latin" lang="la">' + esc(q.latin) + '</p>' : '') +
    '<p class="prompt">' + esc(q.prompt) + '</p>' +
    '<label for="answer-' + esc(q.id) + '">Your ' + (q.id.startsWith("A") ? "Latin" : "English") + ' answer</label>' +
    '<textarea id="answer-' + esc(q.id) + '" data-response="' + esc(q.id) + '"' + (review ? ' readonly' : '') + ' spellcheck="false">' + response + '</textarea>' + after +
    '</article>';
}
function renderExamSection(sec,review) {
  const marks = sec.questions.reduce((n,q) => n + q.points.length,0);
  const passage = sec.passage ? '<div class="latinpassage" lang="la">' +
    sec.passage.map((line,i) => '<p><strong>' + (i+1) + '.</strong> ' + esc(line) + '</p>').join("") + '</div>' : "";
  return '<section class="exam-block"><div class="sectionhead"><h2>' + esc(sec.title) + '</h2><span class="pill">' + marks + ' marks</span></div>' +
    '<p class="muted">' + esc(sec.description) + '</p>' + (review && sec.id === 'C' ? '<div class="note"><strong>Translation fairness:</strong> Without macrons, <em>advenit</em>, <em>invenit</em> and <em>legit</em> can be present or perfect. Credit a consistent, defensible reading rather than forcing one tense.</div>' : '') + (review ? '<p class="help">Section score: <strong id="score-section-' + sec.id + '">0</strong> / ' + marks + ' (provisional self-mark)</p>' : '') + passage + '</section>' +
    sec.questions.map(q => renderPaperQuestion(q,review)).join("");
}
function renderMock() {
  if (mockState === "ready") {
    return '<section class="panel" id="mock-heading"><div class="eyebrow">Original practice paper · teacher-scope aligned</div>' +
      '<h2>November Latin mock assessment · revised paper</h2><p class="help">One continuous unseen story in the 50-mark translation section, with varied sentence weighting and explicit grammatical checkpoints. This is scope-calibrated original practice, not a verified replica of the teacher’s paper.</p><div class="grid">' +
      MOCK.sections.map(s => '<div class="panel" style="margin:0"><h3>' + esc(s.title) +
        '</h3><p class="help">' + esc(s.description) + '</p></div>').join("") + '</div>' +
      '<div class="note warning"><strong>50-minute timed sitting.</strong> Once you begin, the timer runs continuously and submits automatically at zero. Answers are not shown until the paper finishes.</div>' +
      '<p class="help">Suggested pacing: A · 10 min; B · 10 min; C · 30 min. After submission, use the detailed 75-point marking criteria with a parent/teacher. The grade is provisional self-marking: no automatic judgment of open-ended translations, and no school grade prediction.</p>' +
      '<div class="btnrow"><button class="btn" data-action="mock-start">Start 50-minute paper</button></div></section>';
  }
  const review = mockState === "submitted";
  const header = '<div class="panel" id="mock-heading"><div class="sectionhead"><div><div class="eyebrow">' +
    (review ? "Paper submitted" : "Exam in progress") + '</div><h2>Year 9 November Latin · 75 marks</h2></div>' +
    (review ? '<span class="pill">Answer review unlocked</span>' : '<span class="pill">Time left: <span id="mock-time">' + timeText() + '</span></span>') +
    '</div><p class="help">' + (review ?
      'Compare your work to the model, then tick each earned 1-mark criterion. The displayed total is a provisional self-mark, not an automatically graded school result.' :
      'Write answers below. Your text stays in this page only. Do not refresh or close this page during the timed paper.') + '</p></div>';
  const bar = review ?
    '<div class="resultbar"><div><div class="score" id="score-text">' + awarded.size + '/75 marks awarded</div>' +
    '<div class="help">Self-marked; unticked criteria count as 0</div></div><button class="btn secondary" data-action="print">Print review</button></div>' : "";
  const finish = review ? '<div class="panel"><h3>Review complete?</h3><p>You can print this review with your written answers and chosen marks. To retry, start a fresh sitting; the previous responses will be cleared.</p><div class="btnrow"><button class="btn secondary" data-action="mock-reset">New mock sitting</button></div></div>' :
    '<div class="panel"><p class="help">Check that you have answered all three sections before finishing.</p><button class="btn" data-action="mock-submit">Finish and see marking scheme</button></div>';
  return header + bar + MOCK.sections.map(sec => renderExamSection(sec,review)).join("") + finish;
}
function render() {
  tabs.forEach(b => b.setAttribute("aria-selected",b.dataset.tab === tab ? "true" : "false"));
  root.innerHTML = tab === "overview" ? renderOverview() :
    tab === "vocabulary" ? renderVocabulary() :
    tab === "grammar" ? renderGrammar() :
    tab === "practice" ? renderPractice() :
    tab === "unseen" ? renderUnseen() : renderMock();
  if (tab === "mock" && mockState === "submitted") awardScore();
}
function awardScore() {
  const el = document.getElementById("score-text");
  if (el) el.textContent = awarded.size + "/75 marks awarded";
  for (const sec of MOCK.sections) {
    const score = document.getElementById("score-section-" + sec.id);
    if (score) score.textContent = sec.questions.reduce((n,q)=>n+q.points.filter((point,i)=>awarded.has(q.id+"-"+i)).length,0);
  }
}
tabs.forEach(button => button.addEventListener("click", () => { tab = button.dataset.tab; render(); }));
root.addEventListener("input", event => {
  const el = event.target;
  if (el.id === "word-input") wordAnswer = el.value;
  if (el.id === "grammar-input") grammarAnswer = el.value;
  if (el.id === "practice-input") practiceAnswer = el.value;
  if (el.dataset.response && mockState === "active") responses[el.dataset.response] = el.value;
});
root.addEventListener("change", event => {
  const el = event.target;
  if (el.id === "word-chapter") { chapter = el.value; resetVocab(); render(); }
  if (el.id === "word-direction") { wordDirection = el.value; resetVocab(); render(); }
  if (el.id === "grammar-group") { grammarGroup = el.value; grammarIndex = 0; grammarAnswer = ""; grammarShown = false; render(); }
  if (el.id === "practice-group") { practiceGroup = el.value; practiceIndex = 0; practiceAnswer = ""; practiceShown = false; render(); }
  if (el.id === "unseen-passage") { unseenIndex = Number(el.value); unseenSubmitted = false; render(); }
  if (el.dataset.unseenAnswer && !unseenSubmitted) {
    unseenAnswers[el.dataset.unseenAnswer]=Number(el.value);
    // Preserve all radio selections and typing focus; update count without resetting DOM.
    const progress=document.getElementById("unseen-progress");
    if(progress) progress.textContent=UNSEEN_PASSAGES[unseenIndex].questions.filter(q=>Number.isInteger(unseenAnswers[q.id])).length+"/10 selected";
  }
  if (el.dataset.award && mockState === "submitted") {
    if (el.checked) awarded.add(el.dataset.award); else awarded.delete(el.dataset.award);
    awardScore();
  }
});
root.addEventListener("click", event => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action.startsWith("jump-")) { tab = action.slice(5); render(); return; }
  if (action === "word-reveal") { wordShown = true; render(); }
  if (action === "word-known" || action === "word-missed") {
    const row = queue[wordIndex];
    if (!row || !wordShown) return;
    const id = row.chapter + ":" + row.latin;
    if (action === "word-known") {wordKnown.add(id);wordMissed.delete(id);}
    else {wordMissed.add(id);wordKnown.delete(id);}
    wordIndex++;wordShown = false;wordAnswer = "";render();
  }
  if (action === "vocab-restart") { resetVocab();render(); }
  if (action === "grammar-reveal") { grammarShown = true;render(); }
  if (action === "grammar-next") {
    const len = grammarPool().length;
    grammarIndex = (grammarIndex + 1) % len;
    grammarShown = false;grammarAnswer = "";render();
  }
  if (action === "practice-reveal") { practiceShown = true; render(); }
  if (action === "practice-next") {
    practiceIndex = (practiceIndex + 1) % PRACTICE.find(item => item.group === practiceGroup).items.length;
    practiceShown = false; practiceAnswer = ""; render();
  }
  if (action === "unseen-submit" && !unseenSubmitted) {
    const set=UNSEEN_PASSAGES[unseenIndex];
    const unanswered=set.questions.filter(q=>!Number.isInteger(unseenAnswers[q.id])).length;
    if(unanswered && !window.confirm("You have "+unanswered+" unanswered question(s). Submit anyway?"))return;
    unseenSubmitted=true;render();
  }
  if (action === "unseen-retry") {resetUnseen();render();}
  if (action === "unseen-next") {unseenIndex=(unseenIndex+1)%UNSEEN_PASSAGES.length;unseenSubmitted=false;render();}
  if (action === "mock-start") startMock();
  if (action === "mock-submit") submitMock(false);
  if (action === "mock-reset") {
    if (window.confirm("Start again? This will clear your previous answers and self-mark.")) {
      mockState = "ready";Object.keys(responses).forEach(k => delete responses[k]);awarded.clear();render();
    }
  }
  if (action === "print") window.print();
});
render();
