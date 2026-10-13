import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const src=fs.readFileSync(new URL('../assets/jsx-runtime-Cltr0gcK.js',import.meta.url),'utf8');
const guard=src.slice(0,src.indexOf('\nvar ')).replace('import.meta.url','runtimeURL');
function run(boot,release='20261013-player-ux3'){
 let target=null;const url='https://glojournal-cmyk.github.io/study/french/practise?recover=2026-10-12&mode=y8vocab';
 const ctx=vm.createContext({URL,runtimeURL:'https://glojournal-cmyk.github.io/assets/jsx-runtime-Cltr0gcK.js?ux='+release,document:{scripts:boot?[{src:boot,getAttribute:()=>boot}]:[]},location:{href:url,replace:value=>{target=value}}});
 let error;try{vm.runInContext(guard,ctx)}catch(e){error=e}
 return {target,error};
}
test('matched app document and route runtime do not reload',()=>{const r=run('/assets/index-BLVOhKhN.js?v=20261011-vault2&ux=20261013-player-ux3');assert.equal(r.target,null);assert.equal(r.error,undefined)});
test('cached document safely reopens its same practice assignment',()=>{const r=run('/assets/index-BLVOhKhN.js?v=20261011-vault2');assert.ok(r.error);const u=new URL(r.target);assert.equal(u.pathname,'/study/french/practise');assert.equal(u.searchParams.get('recover'),'2026-10-12');assert.equal(u.searchParams.get('mode'),'y8vocab');assert.equal(u.searchParams.get('uiRelease'),'20261013-player-ux3')});
test('older release is replaced before React runtimes can be combined',()=>{assert.ok(run('/assets/index-BLVOhKhN.js?v=20261011-vault2&ux=20261013-player-ux1').error)});
test('standalone Pet and assessment documents are not redirected',()=>{const r=run(null);assert.equal(r.target,null);assert.equal(r.error,undefined)});
test('release guard does not write or clear progress',()=>{assert.doesNotMatch(guard,/localStorage|setState|resetAll|indexedDB/)});
