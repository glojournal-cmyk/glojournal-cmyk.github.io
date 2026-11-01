import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../staging/qa.html',import.meta.url),'utf8');
const suite=readFileSync(new URL('../../tests/overall-app-qa.mjs',import.meta.url),'utf8');
const root=readFileSync(new URL('../../index.html',import.meta.url),'utf8');

test('V2 staging browser fixture is recognisably QA-only and cannot hydrate the real Scholar runtime',()=>{
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 assert.match(html,/<meta name="viewport"[^>]*viewport-fit=cover/);
 assert.match(html,/src="\.\/qa\.js"/);
 assert.match(html,/simulated staging test/i);
 assert.doesNotMatch(html,/index-BLVOhKhN(?:\.core)?\.js|daily-progress-save\.js|lux-scholar-garden-v1|lux-pet-companion-v1/);
});
test('new Physics GCSE Mastery V2.1 keeps its own independent entrypoint on merged main',()=>{
 const physics=readFileSync(new URL('../../study/physics/mastery/index.html',import.meta.url),'utf8');
 assert.match(physics,/src="\/study\/physics\/mastery\/app\.js\?v=/);
 assert.doesNotMatch(physics,/index-BLVOhKhN\.js/);
 assert.match(physics,/name="viewport"/);
 assert.match(suite,/"study\/physics\/mastery\/index\.html"/);
});
test('production HTML version audit excludes exactly the QA fixture, not production Home or learning routes',()=>{
 assert.match(suite,/rel\(p\)!=="daily-v2\/staging\/qa\.html"/);
 assert.match(suite,/\["ls-tree","-r","-z","--name-only","HEAD"\]/);
 assert.match(suite,/trackedFiles\.has\(rel\(p\)\)/);
 assert.match(suite,/const html=files\.filter\(p=>p\.endsWith\("\.html"\)/);
 assert.match(suite,/root-runtime-unversioned/);
 assert.match(suite,/main-runtime-version/);
 assert.match(root,/\/assets\/index-BLVOhKhN\.js\?v=/);
});
