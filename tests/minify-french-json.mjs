import fs from "node:fs";
import path from "node:path";

const root=path.resolve("content/topics");
const files=fs.readdirSync(root).filter(f=>/^fr-.*\.json$/.test(f)).sort();
let before=0,after=0,changed=0;
for(const file of files){
  const full=path.join(root,file);
  const raw=fs.readFileSync(full,"utf8");
  before+=Buffer.byteLength(raw);
  const doc=JSON.parse(raw);
  const compact=JSON.stringify(doc)+"\n";
  after+=Buffer.byteLength(compact);
  if(raw!==compact){
    fs.writeFileSync(full,compact);
    changed++;
  }
}
console.log("FRENCH_JSON_MINIFY "+JSON.stringify({files:files.length,changed,before,after,saved:before-after}));
