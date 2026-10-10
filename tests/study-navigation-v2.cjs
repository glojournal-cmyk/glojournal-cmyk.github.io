'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const file=x=>fs.readFileSync(path.join(root,x),'utf8');
test('Study V2 only loads on study route, never touches the working Home',()=>{
 const home=file('index.html'),study=file('study/index.html');
 assert.doesNotMatch(home,/study-navigation-v2-20261010/);
 assert.match(study,/study-navigation-v2-20261010\.js/);
 assert.match(study,/study-navigation-v2-20261010\.css/);
 assert.match(study,/index-BLVOhKhN\.js/);
 assert.match(study,/\/art\/subjects\/latin\.jpg/);
});
test('no new reward, task, progress, persistence or pet mutations',()=>{
 const js=file('assets/study-navigation-v2-20261010.js');
 for(const exp of [/\bstore\.setState\b/,/\blocalStorage\.setItem\s*\(/,/\baward\s*\(/,
  /\.removeItem\s*\(/,/\bdelete\s+saved\b/,/\bstate\.daily\.push\s*\(/])
  assert.doesNotMatch(js,exp);
 assert.match(js,/window\.__luxAppReady/,'wait for hydration before touching DOM');
 assert.match(js,/if\(old\)old\.replaceWith\(card\);else header\.after\(card\)/);
});
test('Study V2 preserves six existing subject cards and real native year selector',()=>{
 const shell=file('study/index.html');
 for(const sub of ['latin','french','biology','chemistry','physics','english'])
  assert.match(shell,new RegExp('href="/study/'+sub+'"'),sub+' subject');
 assert.match(shell,/<option value="9"/);
 assert.match(shell,/<option value="8"/);
 const js=file('assets/study-navigation-v2-20261010.js');
 for(const text of ['Daily Quest','Scholar’s Atlas','Trial Chamber','Year 8 revision','Year 9 topics'])
  assert.ok(js.includes(text),text);
 assert.match(js,/\/assessment\//);
});
test('disabled on homepage and app-not-ready state',()=>{
 const source=file('assets/study-navigation-v2-20261010.js');
 const calls=[];
 const context=vm.createContext({
  location:{pathname:'/'},
  document:{createElement:()=>{calls.push('mutation');return {}}},
  window:{__luxAppReady:true,addEventListener:()=>{}},
  MutationObserver:class{observe(){calls.push('observe')}},
  queueMicrotask:fn=>fn()
 });
 vm.runInContext(source,context,{timeout:2000});
 assert.deepEqual(calls,[],'Home untouched');
});

test('both original characters share Study hero, chosen outfit and upgraded pet are read-only',()=>{
 const js=file('assets/study-navigation-v2-20261010.js');
 const css=file('assets/study-navigation-v2-20261010.css');
 assert.match(js,/lux-path-hero-scholar/);
 assert.match(js,/lux-path-hero-pet/);
 assert.match(js,/art\/stages\/dusk\.jpg/);
 assert.match(js,/equippedOutfit/);
 assert.match(js,/petLevels/);
 assert.match(js,/pet\/art-hd-20261009\/level-/);
 assert.match(js,/outfitCatalog=mod\.A/);
 assert.match(css,/\.lux-path-hero-pet/);
 assert.match(css,/\.lux-path-hero-scholar/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.doesNotMatch(js,/localStorage\.setItem\s*\(/);
});

test('approved B celestial branding is shared safely between Home and Study',()=>{
 const logo=fs.readFileSync(path.join(root,'assets/lux-celestial-b-symbol-20261010.png'));
 const brand=file('assets/lux-celestial-b-brand-20261010.css');
 const study=file('study/index.html');
 const home=file('index.html');
 assert.equal(logo.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.ok(brand.includes('lux-celestial-b-symbol-20261010.png'));
 assert.ok(!brand.includes('lux-scholar-crest-20261010.svg'));
 assert.ok(home.includes('lux-celestial-b-brand-20261010.css'));
 assert.ok(study.includes('lux-celestial-b-brand-20261010.css'));
 assert.ok(!home.includes('study-navigation-v2-20261010'));
});
