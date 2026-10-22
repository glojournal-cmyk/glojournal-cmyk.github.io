// Deterministic, read-only inventory of committed Gloria resources.
// Important: this is NOT a snapshot of iPad localStorage or of unuploaded PDFs.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const paths=execFileSync('git',['ls-files','-z'],{maxBuffer:16*1024*1024}).toString('utf8').split('\0').filter(Boolean);
const category=path=>{
 if(/\.pdf$/i.test(path))return 'pdf';
 if(/\.(png|jpe?g|webp|svg|gif|avif|ico)$/i.test(path))return 'image';
 if(/\.(json|jsonc|csv|tsv|xlsx?)$/i.test(path)||/vocab|questions|question-bank|topic-bank|answer-key|curriculum/i.test(path))return 'question-or-data';
 if(/\.(js|mjs|cjs|tsx?|html|css|yml|yaml)$/i.test(path))return 'app-code';
 return 'other';
};
const files=paths.map(path=>{const bytes=readFileSync(path);return {path,kind:category(path),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};});
const counts={},sizes={};for(const f of files){counts[f.kind]=(counts[f.kind]||0)+1;sizes[f.kind]=(sizes[f.kind]||0)+f.bytes;}
const inventory={schema:'gloria-repo-inventory-v1',source:'committed GitHub repository only',generatedAt:new Date().toISOString(),fileCount:files.length,counts,bytesByCategory:sizes,files};
const output=process.argv[2]||'/tmp/gloria-repository-inventory.json';
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(inventory,null,2)+'\n');
console.log(JSON.stringify({output,fileCount:files.length,counts,bytesByCategory:sizes},null,2));
if(!files.length||!(counts.image>0)||!(counts['app-code']>0))process.exitCode=1;
