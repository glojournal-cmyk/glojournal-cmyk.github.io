import fs from "node:fs";

const ver="20260919-studyfix1";
const failures=[];
const need=(src,name,token)=>{if(!src.includes(token))failures.push({type:"missing-token",name,token});};

const wrapper=fs.readFileSync("assets/index-BLVOhKhN.js","utf8");
const core=fs.readFileSync("assets/index-BLVOhKhN.core.js","utf8");
need(wrapper,"wrapper",`index-BLVOhKhN.core.js?v=${ver}`);

for(const file of [
 "study-B6lojWPd.js",
 "study.index-CBZ0Frux.js",
 "study._subject-QQDS2zXu.js",
 "study._subject.index-BzZL_sy9.js",
 "study._subject.learn-BvTzW3pu.js",
 "study._subject.play-Bt4Ow-Kd.js",
 "study._subject.practise-D_PWgUd7.js",
 "study._subject.progress-DkPgutuL.js"
]){
 need(core,"core",`import(\`./${file}?v=${ver}\`)`);
}

for(const path of [
 "assets/study-B6lojWPd.js",
 "assets/study.index-CBZ0Frux.js",
 "assets/study._subject-QQDS2zXu.js",
 "assets/study._subject.index-BzZL_sy9.js",
 "assets/study._subject.learn-BvTzW3pu.js",
 "assets/study._subject.play-Bt4Ow-Kd.js",
 "assets/study._subject.practise-D_PWgUd7.js",
 "assets/study._subject.progress-DkPgutuL.js",
 "assets/scholar-companion-Dvhsw--m.js",
 "assets/book-open-DyPOsZXh.js",
 "assets/study-year-select-Dx5P4Ogw.js",
 "assets/rotate-ccw-CnvcBu3N.js",
 "assets/card-t5JqoXqT.js"
]){
 const src=fs.readFileSync(path,"utf8");
 need(src,path,`index-BLVOhKhN.js?v=${ver}`);
}

for(const subject of ["latin","french","biology","chemistry","physics","english"]){
 const html=fs.readFileSync(`study/${subject}/index.html`,"utf8");
 need(html,subject,`index-BLVOhKhN.js?v=${ver}`);
 need(html,subject,`study._subject.index-BzZL_sy9.js?v=${ver}`);
}
for(const subject of ["latin","french"]){
 const html=fs.readFileSync(`study/${subject}/index.html`,"utf8");
 need(html,subject,"Vocabulary Bank");
 need(html,subject,"Dictation");
 need(html,subject,`/study/${subject}/practise?mode=vocab&amp;scope=all`);
 need(html,subject,`/study/${subject}/practise?mode=dictation&amp;scope=all`);
}

const summary={failures:failures.length,version:ver,subjectShells:6,languageShellsSynced:2};
console.log("STUDY_RUNTIME_CACHE_QA "+JSON.stringify(summary));
console.log("STUDY_RUNTIME_CACHE_FAILURES "+JSON.stringify(failures));
fs.mkdirSync("test-results",{recursive:true});
fs.writeFileSync("test-results/study-runtime-cache-qa.json",JSON.stringify({summary,failures},null,2));
if(failures.length)process.exit(2);
