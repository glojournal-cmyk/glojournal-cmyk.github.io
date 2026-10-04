import {curriculumFrontier,curriculumHref,progressionSubjects} from "../assets/daily-curriculum-20261004.js";
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const code = fs.readFileSync("assets/progression-guard-20260927.js", "utf8")
  .replace(/^import .*\n/gm, "")
  .replace(/if\(document\.readyState[\s\S]*$/, "");
const catalog = JSON.parse(fs.readFileSync("content/catalog.json", "utf8"));
const state = { today: "2026-09-27", year: 9, topicStats: {}, daily: [] };
const location = {
  origin: "https://example.test",
  pathname: "/study/biology/practise",
  search: "?daily=%221%22&locked=%221%22&year=%229%22&mode=due",
  href: "https://example.test/study/biology/practise?daily=%221%22&locked=%221%22&year=%229%22&mode=due",
  replace(url) { this.href = url; },
};
const context = {
  curriculumFrontier,curriculumHref,progressionSubjects,localStorage:{getItem:()=>"{}"},
  URL, URLSearchParams, location, store: { getState: () => state },
  getTopicCatalog: (subject, year) => catalog.topics.filter((topic) => topic.subject === subject && topic.year === year),
  document: { getElementById: () => null, createElement: () => ({ style: {}, remove() {} }), body: { appendChild() {} } },
  setTimeout() {},
};
vm.createContext(context);
vm.runInContext(`${code}\nthis.guardClick=guardDailyClick; this.guardRoute=guardCurrentDailyRoute; this.read=queryValue;`, context);

assert.equal(context.read(new URLSearchParams("daily=%221%22"), "daily"), "1");
assert.equal(context.read(new URLSearchParams("year=8"), "year"), "8");
context.guardRoute();
assert.match(location.href, /^\/study\/biology\/practise\?daily=1&locked=1&year=8&mode=standard/);
assert.match(location.href, /topic=bio-y8-balanced-diet/);

let stopped = false;
location.href = "";
const anchor = { href: "https://example.test/study/biology/practise?daily=%221%22&locked=%221%22&year=%229%22&mode=standard" };
context.guardClick({ target: { closest: () => anchor }, preventDefault() { stopped = true; }, stopPropagation() {} });
assert(stopped);
assert.match(location.href, /year=8.*topic=bio-y8-balanced-diet/);

stopped = false;
location.href = "";
anchor.href = "https://example.test/study/biology/practise?daily=%221%22&locked=%221%22&year=%228%22&mode=standard&topic=bio-y8-balanced-diet";
context.guardClick({ target: { closest: () => anchor }, preventDefault() { stopped = true; }, stopPropagation() {} });
assert.equal(stopped, false, "Year 8 practice must stay available");
console.log("DAILY_YEAR8_ROUTE_QA passed: encoded old links route to Year 8, Year 8 links remain open");
