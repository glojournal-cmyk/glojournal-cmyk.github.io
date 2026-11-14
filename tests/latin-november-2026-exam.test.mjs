import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LATIN_BOOKLET_RECORDS} from "../assets/latin-vocabulary-booklet-20261023.js";
import {SYLLABUS,GRAMMAR,PRACTICE,MOCK,validateMock} from "../study/latin/november-2026/exam-data.js";

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
  assert.equal(MOCK.sections[0].questions.length,5);
  assert.equal(MOCK.sections[1].questions.length,7);
  assert.equal(MOCK.sections[2].questions.length,10);
  assert.equal(MOCK.sections[2].passage.length,10);
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
  for(const word of ["Romae","Romam","multas horas","audire debebant","servum bonum"])
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
  assert.match(page,/exam\.js\?v=20261113a/);
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
