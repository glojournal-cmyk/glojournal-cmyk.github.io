import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const release=read('index.html').match(/\/assets\/index-BLVOhKhN\.js\?v=[^"'<>\s)]+/)?.[0];
assert.ok(release,'Home should load the canonical app module');
const old='20261026-bio-year9-urgent1';

function* walk(dir){
 for(const name of readdirSync(path.join(root,dir))){
  const rel=path.join(dir,name),full=path.join(root,rel);
  if(name==='node_modules'||name==='.git'||name==='test-results')continue;
  const info=statSync(full);
  if(info.isDirectory())yield* walk(rel);
  else if(/\.(?:html|js)$/.test(name))yield rel;
 }
}
test('404 fallback is byte-identical to Home, including the app cache key',()=>{
 assert.equal(read('404.html'),read('index.html'));
});
test('all active page shells and imported app modules share one stateful app URL',()=>{
 const failures=[],checked=[];
 const folders=['assets','pet','study','play','garden','scholar','session','assessment'];
 const targets=['index.html','404.html',...folders.flatMap(folder=>[...walk(folder)])];
 for(const p of targets){
  const source=read(p);
  if(!source.includes('index-BLVOhKhN.js?v='))continue;
  const urls=[...source.matchAll(/(?:\/assets\/|\.\/)index-BLVOhKhN\.js\?v=[^"'<>\s)]+/g)]
    .map(m=>m[0].replace(/^\.\/index-/,'/assets/index-'));
  checked.push(p);
  if(!urls.length||urls.some(u=>u!==release))failures.push({path:p,urls});
 }
 assert.ok(checked.length>=30,'The route/module graph scan must be comprehensive');
 assert.deepEqual(failures,[],'Mixed JS module URLs create duplicate local student stores');
});
test('active HTML route shells do not still cache the superseded Biology runtime',()=>{
 const failures=[];
 for(const p of ['index.html','404.html',...['study','play','pet','garden','scholar','session'].flatMap(folder=>[...walk(folder)])]){
  if(p.endsWith('.html')&&read(p).includes(old))failures.push(p);
 }
 assert.deepEqual(failures,[]);
});
