import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(ent=>{
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()){
      if(ent.name===".git"||ent.name==="node_modules"||p.includes(path.join("__grok","install")))return[];
      return walk(p);
    }
    return [p];
  });
}
const html=walk(root).filter(p=>p.endsWith(path.sep+"index.html")||p.endsWith(path.sep+"404.html"));
const failures=[],rows=[];
const standaloneShells=new Set(["pet/index.html"]);
const mainModule="/assets/index-BLVOhKhN.js";
for(const file of html){
  const rel=path.relative(root,file).replaceAll(path.sep,"/");
  const src=fs.readFileSync(file,"utf8");
  const standalone=standaloneShells.has(rel);
  if(!standalone&&!src.includes(mainModule))failures.push({type:"missing-main-module",file:rel});
  const mainRefs=[...src.matchAll(/\/assets\/index-BLVOhKhN\.js(?:\?v=([^"'<> ]+))?/g)].map(m=>({ref:m[0],version:m[1]||null}));
  if(!standalone&&mainRefs.some(x=>!x.version))failures.push({type:"unversioned-main-module",file:rel,refs:mainRefs.map(x=>x.ref)});
  const refs=[...src.matchAll(/(?:src|href)=["'](\/[^"'?#]+)(?:[?#][^"']*)?["']/g)].map(m=>m[1])
    .filter(ref=>ref.startsWith("/assets/")||ref.startsWith("/__grok/")||ref==="/app.css"||ref==="/favicon.svg");
  const missing=[];
  for(const ref of new Set(refs)){
    const disk=path.join(root,ref.slice(1));
    if(!fs.existsSync(disk))missing.push(ref);
  }
  if(missing.length)failures.push({type:"missing-local-assets",file:rel,missing});
  rows.push({file:rel,main:src.includes(mainModule),refs:refs.length,mainVersions:standalone?[]:[...new Set(mainRefs.map(x=>x.version).filter(Boolean))]});
}
const allMainVersions=[...new Set(rows.flatMap(row=>row.mainVersions||[]))];
if(allMainVersions.length!==1)failures.push({type:"main-module-version-drift",versions:allMainVersions});
const rootHtml=fs.readFileSync("index.html","utf8"),notFound=fs.readFileSync("404.html","utf8");
if(rootHtml!==notFound)failures.push({type:"404-shell-differs-from-root"});
const manifest=JSON.parse(fs.readFileSync("__grok/manifest.webmanifest","utf8"));
if(manifest.start_url!=="/"||manifest.scope!=="/"||manifest.display!=="standalone")failures.push({type:"manifest-shell",manifest});
for(const icon of manifest.icons||[]){
  const disk=path.join(root,String(icon.src||"").replace(/^\//,""));
  if(!fs.existsSync(disk))failures.push({type:"manifest-icon-missing",src:icon.src});
}
const summary={htmlShells:html.length,failures:failures.length,rootEquals404:rootHtml===notFound,mainModuleVersion:allMainVersions[0]||null,manifest:{name:manifest.name,start_url:manifest.start_url,scope:manifest.scope,display:manifest.display}};
console.log("ROUTE_SHELL_QA "+JSON.stringify(summary));
console.log("ROUTE_SHELL_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/route-shell-qa.json",JSON.stringify({summary,failures,rows},null,2));
if(failures.length)process.exit(2);
