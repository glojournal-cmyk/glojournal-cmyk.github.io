import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Check actual deployed entrypoint URLs. This catches two independently loaded
// state-store instances on iPad Safari without relying on an old release string.
const read = p => readFileSync(p, "utf8");
const expected = read("index.html").match(/index-BLVOhKhN\\.js\\?v=([^&"'<>\\s]+)/)?.[1];
assert.ok(expected, "Home must have one explicitly versioned state-store module");
for (const path of [
  "study/french/practise/index.html",
  "study/latin/practise/index.html",
  "study/physics/practise/index.html",
  "study/chemistry/practise/index.html",
  "study/english/practise/index.html",
  "assets/study._subject.practise-y8fix-20260920.js",
  "assets/quiz-session-rWAnuDVj.js"
]) {
 test(path+" shares Home's cached state-store version", () => {
  const html = read(path);
  const versions = [...html.matchAll(/index-BLVOhKhN\\.js\\?v=([^&"'<>\\s\x60]+)/g)].map(match=>match[1]);
  assert.ok(versions.length, path+" must import a versioned store");
  assert.deepEqual([...new Set(versions)], [expected], path+" must not create another Zustand store instance");
 });
}
