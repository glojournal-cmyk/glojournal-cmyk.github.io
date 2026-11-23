import fs from "node:fs";

const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
const quiz=fs.readFileSync("assets/quiz-session-rWAnuDVj.js","utf8");
const start=core.indexOf("function qT(");
const end=core.indexOf("function JT(",start);
if(start<0||end<0) throw new Error("Review scheduler qT not found");
const qText=core.slice(start,end);

function DS(e=new Date()){return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}
function kS(e,t){let n=new Date(`${e}T12:00:00`);n.setDate(n.getDate()+t);return DS(n)}
const qT=new Function("DS","kS",qText+";return qT;")(DS,kS);
const today=DS();

const wrong=qT(undefined,false,false);
const repaired=qT(wrong,true,false);
const reinforced=qT(repaired,true,false);
const wrongAgain=qT(repaired,false,false);

const failures=[];
const expect=(ok,msg,data)=>{if(!ok)failures.push({msg,data})};
expect(wrong.due===kS(today,2),"First wrong answer must return after 2 days",{wrong,today});
expect(wrong.streak===1,"Wrong answer should seed the repair cycle at streak 1",{wrong});
expect(repaired.due===kS(today,7),"Successful repair must return after 7 days",{wrong,repaired,today});
expect(repaired.streak===2,"Successful repair should advance to streak 2",{repaired});
expect(reinforced.due===kS(today,30),"Third successful exposure should move to 30-day spacing",{reinforced,today});
expect(wrongAgain.due===kS(today,2)&&wrongAgain.streak===1,"A later error must reset to the 2-day repair cycle",{wrongAgain});

expect(core.includes("repair=!!a?.repair"),"recordAttempt must read the repair flag",{});
expect(core.includes("practice_repair_correct"),"Correct repair must use the repair award path",{});
expect(core.includes("repairs:{attempted:"),"Topic stats must track repairs separately",{});
// The original scorer's `n.ok` was replaced with `formalOk=!qaHeld&&n.ok`:
 // retain the non-repair gate AND prevent unapproved Food Tests from earning XP.
for(const path of ["assets/quiz-session-rWAnuDVj.js","assets/quiz-session-y8fix-20260920.js"]){
 const source=fs.readFileSync(path,"utf8");
 expect(source.includes("const formalOk=!qaHeld&&n.ok;"),
   "Only academically eligible answers may count toward the session score",{path});
 expect(source.includes("formalOk&&!Y._repair&&Y.formal!==!1&&se(e=>e+1)"),
   "Repair and QA-held answers must never inflate the formal session score",{path});
}
expect(quiz.includes("repair:!!Y._repair"),"Quiz session must pass repair metadata to recordAttempt",{});

const summary={today,wrong,repaired,reinforced,wrongAgain,failures:failures.length};
console.log("PROGRESS_REPAIR_QA "+JSON.stringify(summary));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/progress-repair-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length){console.error("PROGRESS_REPAIR_FAILURES "+JSON.stringify(failures));process.exit(2);}
