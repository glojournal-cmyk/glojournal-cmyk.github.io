import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LATIN_BOOKLET_RECORDS} from "../assets/latin-vocabulary-booklet-20261023.js";
import {SYLLABUS,GRAMMAR,PRACTICE,MOCK,validateMock} from "../study/latin/november-2026/exam-data.js";
import {UNSEEN_PASSAGES,validateUnseens} from "../study/latin/november-2026/unseen-passages.js";

const here = new URL("../study/latin/november-2026/",import.meta.url);
const page=readFileSync(new URL("index.html",here),"utf8");
const client=readFileSync(new URL("exam.js",here),"utf8");

test("Taylor Chapters 1–3: all 130 school words, no chapters 4–6",()=>{
  const chosen=LATIN_BOOKLET_RECORDS.filter(x=>[1,2,3].includes(x.chapter));
  assert.equal(chosen.length,130);
  assert.deepEqual([1,2,3].map(ch=>chosen.filter(x=>x.chapter===ch).length),[40,45,45]);
  assert.ok(chosen.every(x=>x.headword&&x.latin&&x.english));
  assert.match(client,/LATIN_BOOKLET_RECORDS\.filter/);
  assert.match(client,/words\.length !== 130/);
});
test("Teacher's November exam structure: 50 min / 75 marks / 11+14+50",()=>{
  assert.equal(validateMock(),true);
  assert.equal(MOCK.durationMinutes,50);
  assert.equal(MOCK.totalMarks,75);
  assert.deepEqual(MOCK.sections.map(s=>s.questions.reduce((sum,q)=>sum+q.points.length,0)),[11,14,50]);
  assert.equal(MOCK.sections[0].questions.length,4);
  assert.equal(MOCK.sections[1].questions.length,7);
  assert.equal(MOCK.sections[2].questions.length,9);
  assert.equal(MOCK.sections[2].passage.length,9);
  const all=MOCK.sections.flatMap(s=>s.questions);
  assert.equal(new Set(all.map(q=>q.id)).size,all.length);
  assert.ok(all.every(q=>q.points.every(x=>x&&typeof x==="string")));
});
test("English→Latin paper deliberately excludes composition-only forbidden topics",()=>{
  const a=MOCK.sections[0].questions.map(q=>q.model).join(" ");
  const wholeWords=new Set(a.toLowerCase().replace(/[^a-z]+/g," ").trim().split(/\s+/));
  for(const unwanted of ["amavit","portavit","scripsit","laetus","laeta","romam","romae","portate","mone","serve"])
    assert.ok(!wholeWords.has(unwanted),"Composition should exclude exact word "+unwanted);
  assert.ok(MOCK.sections[0].questions.every(q=>!q.model.includes("!")));
});
test("Comprehension and translation actually practise special school syntax",()=>{
  const latin=MOCK.sections[1].passage.join(" ")+" "+MOCK.sections[2].passage.join(" ");
  for(const word of ["Romae","Romam","Roma discessit","multas horas","portare iussit","puella laeta"])
    assert.ok(latin.includes(word),"Expected in-scope structure: "+word);
  assert.ok(SYLLABUS.some(x=>x[1].includes("possum")));
});
test("Grammar drill covers every teacher-specified category",()=>{
  assert.ok(GRAMMAR.length>=70);
  const groups=new Set(GRAMMAR.map(q=>q[0]));
  for(const group of ["Nouns","Verbs","sum / possum","Adjectives","Prepositions","Special syntax"])
    assert.ok(groups.has(group),group);
  assert.ok(GRAMMAR.every(q=>q.length===4&&q.every(Boolean)));
  assert.ok(GRAMMAR.some(q=>q[1].includes("infinitive")));
  assert.ok(GRAMMAR.some(q=>q[1].includes("imperfect")||q[1].includes("were")));
});
test("End-only marking; no access to main app's progress, localStorage or MP",()=>{
  assert.match(client,/mockState === "submitted"/);
  assert.match(client,/window\.confirm/);
  assert.match(client,/mockState = "submitted"/);
  assert.match(client,/awardScore/);
  assert.doesNotMatch(client,/localStorage|indexedDB|document\.cookie|setItem\(/);
  assert.doesNotMatch(client,/awardMP|addXP|dailyLedger|cloudBackup/);
  assert.match(page,/independent of Daily Tasks/);
});
test("Static entry point and iPad-friendly controls are present",()=>{
  assert.match(page,/<meta name="viewport"/);
  assert.match(page,/width=device-width/);
  assert.match(page,/data-tab="vocabulary"/);
  assert.match(page,/data-tab="grammar"/);
  assert.match(page,/data-tab="mock"/);
  assert.match(page,/data-tab="unseen"/);
  assert.match(page,/exam\.js\?v=20261114f/);
  assert.match(client,/root\.addEventListener\("input"/);
  assert.match(client,/root\.addEventListener\("click"/);
});

test("Independent untimed practice covers all three assessed task formats",()=>{
  assert.deepEqual(PRACTICE.map(x=>x.group),["English → Latin","Comprehension","Latin → English"]);
  assert.deepEqual(PRACTICE.map(x=>x.items.length),[6,4,8]);
  assert.ok(PRACTICE.every(group=>group.items.every(x=>x.length===3&&x.every(Boolean))));
  assert.ok(PRACTICE[1].passage.length>=5);
  assert.match(page,/data-tab="practice"/);
  assert.match(client,/renderPractice/);
  assert.match(client,/wordDirection/);
});


test("Calibrated mock uses a continuous narrative and varied mark-weighted segments",()=>{
  assert.equal(MOCK.version,"2026-11-14.2");
  assert.equal(MOCK.sections[0].questions.length,4);
  assert.equal(MOCK.sections[1].passage.length,9);
  assert.equal(MOCK.sections[2].questions.length,9);
  const wordCount=MOCK.sections[2].passage.join(" ").trim().split(/\s+/).length;
  assert.ok(wordCount>=120&&wordCount<=175,"Length must be a manageable but sustained unseen passage");
  const lineMarks=MOCK.sections[2].questions.map(q=>q.points.length);
  assert.ok(new Set(lineMarks).size>=2,"Avoid the old fixed five marks on every sentence");
  assert.deepEqual(lineMarks,[6,6,6,5,5,6,6,5,5]);
  assert.equal(MOCK.sections[2].questions.reduce((n,q)=>n+q.points.length,0),50);
  assert.ok(MOCK.sections[2].passage.join(" ").includes("Romae "));
  assert.ok(MOCK.sections[2].passage.join(" ").includes(" Roma discessit"));
  assert.ok(MOCK.sections[2].passage.join(" ").includes(" Romam misit"));
  assert.match(MOCK.guidance,/not an official/);
});
test("Comprehension tests more than isolated dictionary meanings",()=>{
  const questions=MOCK.sections[1].questions;
  assert.equal(questions.length,7);
  assert.ok(questions.every(q=>q.points.length===2));
  assert.ok(questions.some(q=>/after hearing|result|respond|end/i.test(q.prompt)));
  assert.ok(questions.some(q=>/details.*show/i.test(q.prompt)));
  assert.ok(questions.every(q=>q.points.every(p=>p.includes("1 mark"))));
});
test("Composition includes present, imperfect, dative and possum; excludes school-excluded grammar",()=>{
  const a=MOCK.sections[0].questions.map(q=>q.model.toLowerCase()).join(" ");
  assert.match(a,/portabat/);
  assert.match(a,/scribebamus/);
  assert.match(a,/possunt/);
  assert.match(a,/domino/);
  const noPerfect="paravit monuit vocavit habuit fuerunt dedit misit legit portavit".split(" ");
  const tokens=new Set(a.match(/[a-z]+/g));
  for(const word of noPerfect)assert.ok(!tokens.has(word),"No perfect in composition: "+word);
});
test("Mock scoring criteria have no duplicate IDs or empty point cells",()=>{
  const qs=MOCK.sections.flatMap(s=>s.questions);
  const checks=qs.flatMap(q=>q.points.map((p,i)=>q.id+":"+i));
  assert.equal(checks.length,75);
  assert.equal(new Set(checks).size,75);
  assert.ok(qs.every(q=>q.model&&q.prompt&&q.points.every(p=>typeof p==="string"&&p.trim().length>=10)));
  assert.ok(!MOCK.sections[0].questions.some(q=>/romam|romae|\broma\b/i.test(q.model)));
});

test("Five original unseen Latin passages each have exactly 10 source-grounded MCQs",()=>{
  assert.equal(validateUnseens(),true);
  assert.equal(UNSEEN_PASSAGES.length,5);
  const ids=new Set();
  const keys=[0,0,0,0];
  const skills=new Set();
  for(const passage of UNSEEN_PASSAGES){
    assert.equal(passage.questions.length,10);
    assert.ok(passage.passage.length>=8);
    assert.ok(passage.passage.join(" ").trim().split(/\s+/).length>=65);
    const source=passage.passage.join(" ");
    for(const q of passage.questions){
      assert.equal(q.options.length,4);
      assert.equal(new Set(q.options).size,4,"Options must all differ");
      assert.ok(q.answer>=0&&q.answer<=3);
      assert.ok(source.includes(q.evidence),"Every MCQ has exact source evidence: "+q.id);
      assert.ok(q.explanation.length>=15);
      assert.ok(!ids.has(q.id),"Unique MC question ID "+q.id);
      ids.add(q.id);keys[q.answer]++;skills.add(q.skill);
    }
  }
  assert.equal(ids.size,50);
  assert.deepEqual(keys,[13,13,12,12]);
  assert.ok(skills.size>=10);
});
test("MC mode stays outside full 75-mark assessment and saved progress",()=>{
  assert.match(client,/renderUnseen/);
  assert.match(client,/unseenSubmitted/);
  assert.match(client,/data-unseen-answer=/);
  assert.match(client,/unseen-submit/);
  assert.match(client,/unseen-retry/);
  assert.doesNotMatch(client,/localStorage|indexedDB|sessionStorage/);
  assert.deepEqual(MOCK.sections.map(s=>s.questions.reduce((n,q)=>n+q.points.length,0)),[11,14,50]);
});
