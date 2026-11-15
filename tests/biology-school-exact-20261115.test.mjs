// Biology school short answers: equivalent wording must score, and shorter wrong answers must not.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const base='assessment/';
const main=fs.readFileSync(base+'app-v2.js','utf8');
const ctx=vm.createContext({Math,Set,String,Object,RegExp,Number,window:{},state:{results:[]},save(){},grantWardrobe(){}});
vm.runInContext(main.slice(main.indexOf('function normal('),main.indexOf('async function start(')),ctx);
vm.runInContext(fs.readFileSync(base+'marking-hotfix-v3.js','utf8'),ctx);
vm.runInContext(fs.readFileSync(base+'biology-marking-20261003.js','utf8'),ctx);
vm.runInContext(fs.readFileSync(base+'biology-nov2-marking-20261017.js','utf8'),ctx);
const mark=ctx.mark;
const bank=JSON.parse(fs.readFileSync(base+'biology-school-20260927.json','utf8'));
const byId=Object.fromEntries(bank.questions.map(q=>[q.id,q]));
const q=id=>byId['bio-school-20260927-'+id];
const credit=value=>mark(q(value[0]),value[1]).credit;

for(const item of bank.questions){
  const model=item.modelAnswer||item.answer?.accepted?.[0]||'';
  assert.equal(mark(item,model).credit,1,item.id+' model');
  for(const accepted of item.answer?.accepted||[])assert.equal(mark(item,accepted).credit,1,item.id+' '+accepted);
  assert.equal(mark(item,'').credit,0,item.id+' empty');
}

const pass=[
 ['001','a eukaryotic cell'],['001','eukaryotic cell'],['001','It is eukaryotic.'],['001',"It's a eukaryote."],
 ['002','It is the nucleus.'],['002','nucleus'],
 ['003','the mitochondria'],['003','It is the mitochondria.'],['003','mitochondrion'],
 ['004','the ribosome'],['004','Ribosomes'],
 ['005','It is a plant cell.'],['005','plant cells'],
 ['008','cell-surface membrane'],['008','cell surface membrane'],['008','plasma membrane'],['008','The plasma membrane.'],
 ['010','the chloroplasts'],
 ['012','46um'],['012','46 micrometers'],['012','46 µm'],
 ['013','0.75mm'],['013','.75 mm'],['013','0.75 millimeters'],
 ['015','30 micrometers'],['015','30um'],['015','30 µm'],
 ['016','500x'],['016','500×'],['016','x 500'],['016','× 500'],['016','500 times'],
 ['017','300x'],['017','x 300'],
 ['023','400x'],['023','x 400'],
 ['037','a biconcave disc'],['037','biconcave discs'],
 ['040','a root hair'],
 ['051','DNA'],['051','the DNA'],['051','Its DNA.'],
 ['052','not all bacteria'],['052','Not all of them.'],['052','no'],
 ['009','It grows underground and normally does not photosynthesise.'],
 ['009','No light reaches it underground, so it cannot photosynthesise.'],
 ['064','a control measure'],['021','an electron microscope']
];
for(const [id,value] of pass)assert.equal(credit([id,value]),1,id+' should pass: '+value);

const fail=[
 ['001','prokaryotic'],['001','not eukaryotic'],['001',"It isn't eukaryotic."],['001','plant'],
 ['002','mitochondria'],['002','It is not the nucleus.'],['002','the mitochondria and the nucleus'],
 ['003','the mitochondria and the nucleus'],['003','ribosome'],
 ['004','the ribosome and the nucleus'],
 ['005','plant'],['005','an animal cell'],['005','bacterium'],
 ['008','cell wall'],['008','the cell wall'],['008','cell-surface membrane and the cell wall'],
 ['010','chlorophyll'],['010','cell membrane'],
 ['012','46'],['012','46 mm'],['012','0.046 mm'],['012','46 nm'],
 ['013','750 mm'],['013','0.75'],['013','0.75 um'],['013','0.75mm is not the answer'],
 ['015','30'],['015','30 mm'],['015','24 mm'],
 ['016','10 times 40'],['016','x400'],['016','500 mm'],['016','40'],
 ['017','15'],['017','300 mm'],
 ['021','electron'],['021','an electron'],['021','light microscope'],
 ['023','10 times 40'],['023','10 x 40'],['023','10x40'],['023','x40'],
 ['026','to see them more clearly'],['026','so the cells show up'],
 ['034','it differentiates'],['034','differentiation process please wait no'],
 ['037','round'],['037','biconcave nucleus'],
 ['040','hair'],['040','root'],['040','surface area'],
 ['046','it splits in two'],['046','mitosis'],
 ['051','plasmid'],['051','plasmids'],['051','RNA'],['051','plasmid DNA'],
 ['052','yes'],['052','not eukaryotic'],['052','not all of them are eukaryotic'],['052','all of them'],
 ['064','a control'],['064','control'],['064','hazard'],
 ['011','It is strong.'],['022','It is just bigger.'],['032','To look neat.'],['043','They make sugar.']
];
for(const [id,value] of fail)assert.equal(credit([id,value]),0,id+' should fail: '+value);

const keywords=[
 ['011','The wall is strong because it contains cellulose.'],
 ['022','Magnification makes it bigger but the resolution stays poor.'],
 ['032','So you can estimate the actual size.'],
 ['043','Mitochondria release energy for active transport.']
];
for(const [id,value] of keywords)assert.equal(credit([id,value]),1,'keyword '+id);

const index=fs.readFileSync(base+'index.html','utf8');
assert.match(index,/biology-marking-20261003\.js\?v=20261115-bio-school-exact1/);
console.log('biology-school exact equivalents: '+pass.length+' pass, '+fail.length+' rejected');
