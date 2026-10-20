const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const boot=read('assets/study-rpg-live-boot-20261020.js');

test('return-to-Study bridge is available from Pet and every React top-level shell',()=>{
  assert.match(read('pet/home-pet.js'),/import\('\/assets\/study-rpg-live-boot-20261020\.js\?v=20261020-return-nav1'\)/);
  for(const p of ['pet/index.html','play/index.html','garden/index.html','scholar/index.html','index.html','404.html','study/index.html']){
    assert.match(read(p),/home-pet\.js\?v=20261020-return-nav1/,p);
  }
  for(const p of ['index.html','404.html','study/index.html']){
    assert.match(read(p),/study-rpg-live-boot-20261020\.js\?v=20261020-return-nav1/,p);
  }
  for(const p of ['pet/index.html','assessment/index.html']){
    assert.match(read(p),/shell-frame\.js\?v=20261020-return-nav1/,p);
  }
  assert.match(read('shell-frame.js'),/\["\/study\/", "Study"\]/);
});

test('Study return click opens canonical complete document from each page, without modifying saved data',()=>{
  assert.doesNotMatch(boot,/localStorage\.(?:setItem|removeItem|clear)\(/);
  assert.doesNotMatch(boot,/store\.(?:setState|persist)\(/);
  for(const originPath of ['/pet/','/play','/garden','/scholar','/assessment/','/study/latin/learn','/']){
    const assigned=[],listeners={};
    const location={pathname:originPath,search:'',href:'https://study.test'+originPath,origin:'https://study.test',
      assign:url=>assigned.push(url)};
    const win={addEventListener:()=>{},__luxStudyRpgBootInstalled:false};
    const history={pushState:()=>1,replaceState:()=>1};
    const doc={addEventListener:(name,fn)=>{listeners[name]=fn}};
    const ctx=vm.createContext({window:win,history,document:doc,location,URL,URLSearchParams,console});
    vm.runInContext(boot,ctx,{filename:'study-rpg-live-boot-20261020.js'});
    assert.equal(typeof listeners.click,'function',originPath);
    for(const dest of ['/study','/study/']){
      const before=assigned.length;
      const anchor={href:'https://study.test'+dest,target:'',hasAttribute:()=>false};
      const click={defaultPrevented:false,button:0,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,
        target:{closest:()=>anchor},preventDefault(){this.defaultPrevented=true;},
        stopImmediatePropagation(){this.stopped=true;}};
      listeners.click(click);
      assert.equal(assigned.length,before+1,originPath+' => '+dest);
      assert.equal(assigned.at(-1),'/study/',originPath);
      assert.equal(click.defaultPrevented,true);
      assert.equal(click.stopped,true);
    }
    const before=assigned.length;
    const skipped={defaultPrevented:false,button:0,ctrlKey:true,metaKey:false,altKey:false,shiftKey:false,
      target:{closest:()=>({href:'https://study.test/study',target:'',hasAttribute:()=>false})},
      preventDefault(){throw Error('Must leave modifier navigation alone')},
      stopImmediatePropagation(){throw Error('Must leave modifier navigation alone')}};
    listeners.click(skipped);
    assert.equal(assigned.length,before);
    const nativeFallback={...skipped,ctrlKey:false,target:{closest:()=>({href:'https://study.test/study/?studyRpgPreview=0',target:'',hasAttribute:()=>false})}};
    listeners.click(nativeFallback);
    assert.equal(assigned.length,before,'Legacy fallback untouched');
    const other={...skipped,ctrlKey:false,target:{closest:()=>({href:'https://study.test/pet/',target:'',hasAttribute:()=>false})}};
    listeners.click(other);
    assert.equal(assigned.length,before,'Unrelated navigation untouched');
    vm.runInContext(boot,ctx);
    assert.equal(win.__luxStudyRpgBootInstalled,true,'Bridge remains singleton');
  }
});

test('already open Study does not reload its chosen year when active Study tab is tapped',()=>{
  const handlers={};const location={pathname:'/study/',search:'',href:'https://study.test/study/',origin:'https://study.test',assign:()=>{throw Error('Unexpected reload')}};
  const win={__luxStudyRpgBootInstalled:false,addEventListener:()=>{}};
  const doc={addEventListener:(e,cb)=>{handlers[e]=cb}};
  // Study import needs the host runtime; stub an already-mounted overlay so no import occurs.
  win.__luxStudyRpgIntegrated=true;
  vm.runInNewContext(boot,{window:win,history:{pushState:()=>{},replaceState:()=>{}},document:doc,location,URL,URLSearchParams,console});
  handlers.click({defaultPrevented:false,button:0,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,
    target:{closest:()=>({href:'https://study.test/study',target:'',hasAttribute:()=>false})}});
});
