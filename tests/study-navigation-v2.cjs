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
 assert.match(js,/header\.before\(card\)/,'quest scene is first');
 assert.match(js,/parent\.dataset\.luxQuestReady/,'quest-only styling begins after render');
 assert.match(js,/luxQuestLegacyShortcut/,'duplicate shortcuts marked for collapse');
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

test('Study displays the equipped Scholar only, with a compact scene',()=>{
 const js=file('assets/study-navigation-v2-20261010.js');
 const css=file('assets/study-navigation-v2-20261010.css');
 const home=file('index.html');
 assert.ok(js.includes('lux-path-hero-scholar'));
 assert.ok(js.includes('/art/stages/dusk.jpg'));
 assert.ok(js.includes('saved.equippedOutfit'));
 assert.ok(js.includes('outfitCatalog=mod.A'));
 for(const petText of ['lux-path-hero-pet','petLevels','Companion ↗','scholar:pet-changed'])
  assert.ok(!js.includes(petText),'Study must not render '+petText);
 assert.ok(css.includes('height:370px!important;min-height:370px!important;max-height:370px!important'));
 assert.ok(css.includes('height:445px!important;min-height:445px!important;max-height:445px!important'));
 assert.ok(home.includes('lux-celestial-b-brand-20261010.css'));
 assert.ok(!home.includes('study-navigation-v2-20261010'));
 assert.ok(!js.includes('localStorage.setItem('));
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

test('legacy subjects directory no longer blocks the first screen',()=>{
 const script=file('assessment-link.js');
 const study=file('study/index.html'),home=file('index.html');
 assert.doesNotMatch(script,/textContent='Browse subjects'/);
 assert.match(script,/getElementById\('subject-directory-entry'\)\?\.remove\(\)/);
 assert.match(home,/assessment-link\.js\?v=20261010-firstscreen-fix1/);
 assert.match(study,/assessment-link\.js\?v=20261010-portal-glyph1/);
 assert.match(study,/study-navigation-v2-20261010\.js\?v=20261010-quest-complete1/);
 const css=file('assets/study-navigation-v2-20261010.css');
 assert.match(css,/data-lux-quest-ready/);
 assert.match(css,/data-lux-quest-legacy-shortcut/);
});

test('legacy task decorator leaves Study portal star icons circular and alone',()=>{
 const source=file('lux-theme.js');
 const css=file('assets/study-navigation-v2-20261010.css');
 const a=source.indexOf('function isTaskProgress(el)');
 const b=source.indexOf('\n  function cleanCardIcons()',a);
 assert.ok(a>=0&&b>a);
 const classify=new Function(source.slice(a,b)+';return isTaskProgress;')();
 const quest={innerText:'01 YOUR ADVENTURE Daily Quest 0 / 10 stars lit',
   closest:()=>({}),querySelector:()=>null};
 const daily={innerText:'French vocab 2 / 30',closest:()=>null,querySelector:()=>null};
 assert.equal(classify(quest),false,'portal is not a task row');
 assert.equal(classify(daily),true,'real tasks still receive icons');
 assert.match(source,/querySelectorAll\('#lux-study-paths-v2 \.lux-ico'\)/);
 assert.match(css,/\.lux-study-paths \.lux-path-portal\{\s*display:grid!important/);
 assert.match(css,/\.lux-study-paths \.lux-path-portal > \.lux-ico\{display:none!important/);
 assert.match(file('study/index.html'),/study-navigation-v2-20261010\.css\?v=20261010-portal-glyph1/);
});
