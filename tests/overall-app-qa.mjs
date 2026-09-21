import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const failures=[];
const info={};

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(ent=>{
    const p=path.join(dir,ent.name);
    const rel=path.relative(root,p).replaceAll(path.sep,"/");
    if(ent.isDirectory()){
      if([".git","node_modules","test-results"].includes(ent.name)||rel.startsWith("__grok/install")) return [];
      return walk(p);
    }
    return [p];
  });
}
function rel(p){return path.relative(root,p).replaceAll(path.sep,"/")}
function need(source,label,token){if(!source.includes(token)) failures.push({type:"missing-token",label,token})}
function forbid(source,label,token){if(source.includes(token)) failures.push({type:"stale-token",label,token})}

const files=walk(root);
const fileSet=new Set(files.map(rel));
const html=files.filter(p=>p.endsWith(".html"));
const js=files.filter(p=>rel(p).startsWith("assets/")&&p.endsWith(".js"));

for(const file of html){
  const r=rel(file),src=fs.readFileSync(file,"utf8");
  const refs=[...src.matchAll(/(?:src|href)=["'](\/[^"'?#]+)(?:[?#][^"']*)?["']/g)].map(m=>m[1])
    .filter(x=>/^(\/assets\/|\/art\/|\/pet\/|\/content\/|\/__grok\/|\/app\.css$|\/favicon\.svg$)/.test(x));
  const missing=[...new Set(refs)].filter(x=>!fileSet.has(x.slice(1)));
  if(missing.length) failures.push({type:"missing-local-ref",file:r,missing});
  if(r!=="pet/index.html"){
    if(!src.includes('name="viewport"')||!src.includes("viewport-fit=cover")) failures.push({type:"mobile-viewport",file:r});
    if(!src.includes("/assets/index-BLVOhKhN.js?v=20260920-dailyfix1")) failures.push({type:"main-runtime-version",file:r});
  }
}

for(const file of js){
  const r=rel(file),src=fs.readFileSync(file,"utf8");
  const imports=[...src.matchAll(/from["']\.\/([^"'?]+\.js)(?:\?[^"']*)?["']/g)].map(m=>`assets/${m[1]}`);
  const missing=[...new Set(imports.filter(x=>!fileSet.has(x)))];
  if(missing.length) failures.push({type:"missing-js-import",file:r,missing});
  if(r!=="assets/index-BLVOhKhN.js"&&r!=="assets/index-BLVOhKhN.core.js"){
    const marker='from"./index-BLVOhKhN.js';
    let pos=0;
    while((pos=src.indexOf(marker,pos))>=0){
      const valueStart=pos+marker.length;
      const quote=src.indexOf('"',valueStart);
      const suffix=quote>=0?src.slice(valueStart,quote):"";
      const version=suffix.startsWith("?v=")?suffix.slice(3):null;
      if(version!=="20260920-dailyfix1") failures.push({type:"runtime-import-cache-drift",file:r,version});
      pos=quote>=0?quote+1:valueStart+1;
    }
  }
}

const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const playHub=fs.readFileSync("assets/play.index-sR2wZ5CM.js","utf8");
const playGame=fs.readFileSync("assets/play._game-BbpxhxeZ.js","utf8");
const studyHub=fs.readFileSync("assets/study.index-CBZ0Frux.js","utf8");
const pe3=fs.readFileSync("assets/pe-circuit-v3-20260920.js","utf8");

need(core,"core PE preload","assets/pe-circuit-v3-20260920.js");
need(core,"core PE search","Scholar Sprint 3.0");
forbid(core,"core active PE preload","assets/pe-circuit-DPe2o8eH.js");
need(playHub,"Play hub PE import",'pe-circuit-v3-20260920.js?v=20260920-pe3');
forbid(playHub,"Play hub","pe-circuit-DPe2o8eH.js");
need(playGame,"Play game PE import",'pe-circuit-v3-20260920.js?v=20260920-pe3');
forbid(playGame,"Play game","pe-circuit-DPe2o8eH.js");
for(const token of ["Quick Feet","Reaction Dash","Precision Kick","Footwork Memory","Balance Hold","Dodge Lane","no instant game-over."]) need(pe3,"PE 3.0",token);

forbid(studyHub,"Study hub","waiting for school source");
forbid(studyHub,"Study hub","Use Year 8 revision for now");
forbid(studyHub,"Study hub","Gated");
need(core,"Year 9 bundle","runtime-${String(i).padStart(2,\"0\")}.txt");
need(core,"Year 9 catalog merge","loadSchoolY9Bundle_20260919");
need(core,"safe subject index route","study._subject.index-safe-20260920.js");
need(core,"safe practise route","study._subject.practise-y8fix-20260920.js");

const playHtml=fs.readFileSync("play/index.html","utf8");
const peHtml=fs.readFileSync("play/pe-circuit/index.html","utf8");
for(const [label,src] of [["play/index.html",playHtml],["play/pe-circuit/index.html",peHtml]]){
  forbid(src,label,"/assets/pe-circuit-DPe2o8eH.js");
  forbid(src,label,"Quad Circuit");
  forbid(src,label,"Six circuits:");
}
const studyHtml=fs.readFileSync("study/index.html","utf8");
forbid(studyHtml,"study/index.html","waiting for school source");
forbid(studyHtml,"study/index.html","Use Year 8 revision for now");
forbid(studyHtml,"study/index.html",">Gated<");

const species=["moss-hornling","moon-puff","inkling","sprig-dragon","pebble-wisp","star-toadlet","velvet-batling","antler-bean","mothling","bloom-snail"];
for(const name of species){
  if(!fileSet.has(`pet/art-production/${name}.webp`)) failures.push({type:"missing-pet-stage1",species:name});
  for(let stage=2;stage<=5;stage++){
    if(!fileSet.has(`pet/art-evolution/level-${stage}/${name}.webp`)) failures.push({type:"missing-pet-evolution",species:name,stage});
  }
}

for(let i=0;i<12;i++){
  const shard=`content/school-update-20260919/runtime-${String(i).padStart(2,"0")}.txt`;
  if(!fileSet.has(shard)) failures.push({type:"missing-year9-shard",shard});
}

const manifest=JSON.parse(fs.readFileSync("__grok/manifest.webmanifest","utf8"));
for(const icon of manifest.icons||[]){
  const p=String(icon.src||"").replace(/^\//,"");
  if(p&&!fileSet.has(p)) failures.push({type:"missing-manifest-icon",src:icon.src});
}
if(manifest.start_url!=="/"||manifest.scope!=="/"||manifest.display!=="standalone") failures.push({type:"manifest-config",manifest:{start_url:manifest.start_url,scope:manifest.scope,display:manifest.display}});

const rootHtml=fs.readFileSync("index.html","utf8");
const notFound=fs.readFileSync("404.html","utf8");
if(rootHtml!==notFound) failures.push({type:"404-root-drift"});

info.htmlShells=html.length;
info.assetJs=js.length;
info.petSpecies=species.length;
info.petEvolutionStages=4;
info.year9Shards=12;
info.peEngine="Scholar Sprint 3.0";
info.safeYear8Routes=true;
info.failures=failures.length;

console.log("OVERALL_APP_QA "+JSON.stringify(info));
console.log("OVERALL_APP_QA_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/overall-app-qa.json",JSON.stringify({info,failures},null,2));
if(failures.length) process.exit(2);
