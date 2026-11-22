// Read-only source inventory. This is a structural preflight, NOT Academic QA.
// The counts here must never be labelled "QA accepted" without an independent review.
import fs from 'node:fs';
import path from 'node:path';
const root='content/topics';
const names=fs.readdirSync(root).filter(name=>/^(bio|chem|phys|fr|la|eng)-y[89].*\.json$/.test(name));
const results=[],issues=[],byYearSubject={},seenIds=new Set();
const valid=q=>q?.id&&q.status!=='disabled'&&q.status!=='preview'&&
  q.status!=='draft'&&q.preview!==true&&q.formal!==false&&q._repair!==true;
for(const file of names){
  let bank;try{bank=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'))}
  catch(e){issues.push({file,reason:'invalid JSON: '+e.message});continue}
  const {subject,year,topicId}=bank;
  const all=Array.isArray(bank.questions)?bank.questions:[];
  const active=bank.status==='enabled'&&Number(year)>=8&&Number(year)<=9;
  const candidates=active?all.filter(valid):[];
  const concepts=new Map();
  let duplicates=0,missingConcept=0,missingAnswer=0,preview=0;
  for(const q of all)if(q.preview===true||q.status==='preview')preview++;
  for(const q of candidates){
    const c=String(q.conceptId||'');
    if(!c)missingConcept++;
    if(!q.answer||typeof q.answer!=='object')missingAnswer++;
    if(seenIds.has(q.id))duplicates++;
    seenIds.add(q.id);
    if(!concepts.has(c||q.id))concepts.set(c||q.id,[]);
    concepts.get(c||q.id).push(q.id);
  }
  const sourcePresent=!!String(bank.source||'').trim();
  const row={file,subject,year,topicId,active,title:bank.title,
    raw:all.length,preview,structurallyEligibleQuestions:candidates.length,
    distinctCandidateConcepts:concepts.size,missingConcept,missingAnswer,duplicateIds:duplicates,
    sourcePresent,verifiedTaught:false,independentlyAcademicQAApproved:0};
  results.push(row);
  const group=subject+'-y'+year;
  byYearSubject[group]??={topics:0,rawQuestions:0,previewQuestions:0,candidateQuestions:0,
    candidateConcepts:0,qaAcceptedQuestions:0,qaRejectedQuestions:0};
  const target=byYearSubject[group];
  target.topics++;target.rawQuestions+=all.length;target.previewQuestions+=preview;
  target.candidateQuestions+=candidates.length;target.candidateConcepts+=concepts.size;
  // No file is accepted based on structural inspection alone.
  target.qaRejectedQuestions+=all.length;
  if(missingConcept||missingAnswer||duplicates)issues.push({file,missingConcept,missingAnswer,duplicates});
}
const topYear9=results.filter(x=>x.year===9).sort((a,b)=>b.distinctCandidateConcepts-a.distinctCandidateConcepts).slice(0,15)
  .map(({topicId,subject,distinctCandidateConcepts,structurallyEligibleQuestions})=>
    ({topicId,subject,distinctCandidateConcepts,structurallyEligibleQuestions}));
const output={generatedBy:'read-only source inventory',academicSignOff:'BLOCKED',
  cannotInferTaughtFromFile:true,year9MathsBankSupplied:false,
  byYearSubject,topYear9,issues,topics:results};
fs.mkdirSync('test-results',{recursive:true});
fs.writeFileSync('test-results/daily-v3-bank-audit-20261122.json',JSON.stringify(output,null,2));
console.log('DAILY_V3_SOURCE_AUDIT '+JSON.stringify({
  academicSignOff:output.academicSignOff,topicFiles:results.length,byYearSubject,issues:issues.length,
  topYear9:topYear9.slice(0,8)
}));
