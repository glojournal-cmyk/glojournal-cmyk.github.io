import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {NOV23_PAPERS,validateNov23Papers} from "../study/latin/november-2026/nov23-papers.js";
const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("All three 23 Nov Latin practice papers validate and retain the 11/14/50 blueprint",()=>{
 assert.equal(validateNov23Papers(),true);
 assert.deepEqual(NOV23_PAPERS.map(p=>p.id),["mock-1","mock-2","mock-3"]);
 for(const p of NOV23_PAPERS){
  assert.equal(p.A.reduce((a,q)=>a+q.marks,0),11,p.id+" A");
  assert.equal(p.B.reduce((a,q)=>a+q.marks,0),14,p.id+" B");
  assert.equal(p.C.reduce((a,c)=>a+c.units.length,0),50,p.id+" C");
  assert.equal(p.C.length,5);
  assert.equal(p.C.every(x=>x.units.length===10),true);
  for(const item of [...p.A,...p.B])assert.equal(item.units.length,item.marks);
  assert.ok(p.Bpassage.length>300);
  assert.ok(p.C.every(c=>c.latin.length>80&&c.model.length>80));
  assert.ok(p.C.every(c=>c.units.every(row=>row.length===2&&row.every(Boolean))));
 }
});
test("Imported source identifiers and representative tricky syntax survive",()=>{
 const [one,two,three]=NOV23_PAPERS;
 assert.equal(one.glossary.length,6);
 assert.match(one.C[0].latin,/cum duobus servis Roma ad parvam insulam/);
 assert.match(one.C[3].latin,/duas horas/);
 assert.match(two.A[0].model,/pueris dabat/);
 assert.match(two.Bpassage,/nautas malos/);
 assert.match(two.C[4].latin,/deinde Romam/);
 assert.match(three.A[2].model,/decem horas portam custodiebant/);
 assert.match(three.B[7].model,/Genitive singular/);
 assert.match(three.C[3].latin,/quinque horas per aquam navigavimus/);
 assert.match(three.C[4].latin,/arma e templo trahebat/);
});
test("Student interface delays answer keys and does not touch Daily, MP, or stored progress",()=>{
 const page=read("study/latin/november-2026/nov23/index.html");
 const app=read("study/latin/november-2026/nov23/app.js");
 assert.match(page,/Three Mock Papers/);
 assert.match(page,/Week commencing 23 November 2026/);
 assert.match(page,/answers and mark scheme stay hidden until submission/i);
 assert.match(app,/submitted\?'<div class="model">/);
 assert.match(app,/data-action="submit"/);
 assert.match(app,/s\.status="submitted"/);
 assert.match(app,/remaining:3000/);
 assert.match(app,/s\.endsAt=Date\.now\(\)\+3000000/);
 assert.match(app,/part==="C"\?\[0,0\.5,1\]:\[0,1\]/);
 assert.doesNotMatch(app,/localStorage|sessionStorage|indexedDB|awardMP|dailyLedger|setItem\(/);
});
test("Assessment and Latin studio both link the new 23 Nov papers",()=>{
 const href="/study/latin/november-2026/nov23/";
 for(const f of ["assessment/index.html","study/latin/november-2026/index.html"])
  assert.ok(read(f).includes(href),f);
});
